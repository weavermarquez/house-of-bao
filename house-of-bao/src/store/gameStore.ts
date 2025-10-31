import { create } from "zustand";
import {
  type Form,
  deepClone,
  canonicalSignatureForest,
  canonicalSignature,
} from "../logic/Form";
import { clarify, enfold } from "../logic/inversion";
import { disperse, collect } from "../logic/arrangement";
import {
  cancel,
  create as createReflection,
  isCancelApplicable,
} from "../logic/reflection";
import { checkWinCondition } from "../logic/win";
import { type LevelDefinition, type AxiomType } from "../levels/types";

type HistoryStack = {
  past: Form[][];
  future: Form[][];
};

export type GameStatus = "idle" | "playing" | "won";

export type GameOperation =
  | { type: "clarify"; targetId: string }
  | {
      type: "enfold";
      targetIds: string[];
      variant?: "frame" | "mark";
      parentId?: string | null;
    }
  | {
      type: "disperse";
      contentIds: string[];
      squareId?: string;
      frameId?: string;
    }
  | { type: "collect"; targetIds: string[] }
  | { type: "cancel"; targetIds: string[] }
  | { type: "create"; parentId: string | null; templateIds?: string[] };

export type GameState = {
  level: LevelDefinition | null;
  currentForms: Form[];
  goalForms: Form[];
  status: GameStatus;
  selectedNodeIds: string[];
  selectedParentId: string | null;
  history: HistoryStack;
  loadLevel: (level: LevelDefinition) => void;
  resetLevel: () => void;
  applyOperation: (operation: GameOperation) => void;
  undo: () => void;
  redo: () => void;
  toggleSelection: (nodeId: string) => void;
  clearSelection: () => void;
  selectParent: (nodeId: string | null) => void;
  clearParentSelection: () => void;
};

type LocatedNode = {
  node: Form;
  parent: Form | null;
};

function cloneForest(forms: Form[]): Form[] {
  return forms.map((form) => deepClone(form));
}

function locateNodes(
  forest: Form[],
  ids: Set<string>,
): Map<string, LocatedNode> {
  const results = new Map<string, LocatedNode>();
  const stack: Array<{ node: Form; parent: Form | null }> = forest.map(
    (node) => ({
      node,
      parent: null,
    }),
  );

  while (stack.length > 0 && results.size < ids.size) {
    const current = stack.pop()!;
    if (ids.has(current.node.id)) {
      results.set(current.node.id, {
        node: current.node,
        parent: current.parent,
      });
    }
    current.node.children.forEach((child) => {
      stack.push({ node: child, parent: current.node });
    });
  }

  return results;
}

function applySingleTarget(
  forest: Form[],
  targetId: string,
  transform: (form: Form) => Form[],
): Form[] | null {
  let modified = false;

  function rewrite(node: Form): { forms: Form[]; changed: boolean } {
    if (node.id === targetId) {
      modified = true;
      return { forms: transform(node), changed: true };
    }

    let anyChildChanged = false;
    const replacementChildren: Form[] = [];
    node.children.forEach((child) => {
      const result = rewrite(child);
      if (result.changed) {
        anyChildChanged = true;
        result.forms.forEach((replacement) => {
          replacementChildren.push(replacement);
        });
      } else {
        replacementChildren.push(child);
      }
    });

    if (!anyChildChanged) {
      return { forms: [node], changed: false };
    }

    const clone: Form = {
      id: node.id,
      boundary: node.boundary,
      label: node.label,
      children: new Set<Form>(replacementChildren),
    };

    return { forms: [clone], changed: true };
  }

  const updatedRoots: Form[] = [];
  forest.forEach((root) => {
    const result = rewrite(root);
    updatedRoots.push(...result.forms);
  });

  return modified ? updatedRoots : null;
}

/**
 * Applies a transformation to sibling forms with the same parent.
 * Replaces the siblings with the transformed result, preserving order.
 */
function applySiblingOperation(
  forest: Form[],
  targetIds: string[],
  transform: (nodes: Form[]) => Form[],
): Form[] | null {
  const uniqueIds = [...new Set(targetIds)];
  if (uniqueIds.length === 0) {
    return null;
  }

  const locations = locateNodes(forest, new Set(uniqueIds));
  if (locations.size !== uniqueIds.length) {
    return null;
  }

  const parentReferences = new Set(
    [...locations.values()].map((entry) => entry.parent?.id ?? "__root"),
  );
  if (parentReferences.size !== 1) {
    return null;
  }

  const parent = [...locations.values()][0].parent;
  const sortedTargets = uniqueIds.map((id) => locations.get(id)!.node);
  const transformed = transform(sortedTargets);

  if (parent === null) {
    const survivingRoots = forest.filter(
      (form) => !uniqueIds.includes(form.id),
    );
    return [...survivingRoots, ...transformed];
  }

  return applySingleTarget(forest, parent.id, (currentParent) => {
    const nextChildren: Form[] = [];
    currentParent.children.forEach((child) => {
      if (!uniqueIds.includes(child.id)) {
        nextChildren.push(child);
      }
    });
    transformed.forEach((replacement) => nextChildren.push(replacement));
    return [
      {
        id: currentParent.id,
        boundary: currentParent.boundary,
        label: currentParent.label,
        children: new Set<Form>(nextChildren),
      },
    ];
  });
}

function firstChild(form: Form): Form | null {
  const iterator = form.children.values();
  const first = iterator.next();
  return first.done ? null : (first.value as Form);
}

function ensureCancelPairs(forest: Form[], targetIds: string[]): string[] {
  const uniqueIds = [...new Set(targetIds)];
  if (uniqueIds.length === 0) {
    return uniqueIds;
  }

  const locations = locateNodes(forest, new Set(uniqueIds));
  if (locations.size !== uniqueIds.length) {
    return uniqueIds;
  }

  const parentKeys = new Set(
    [...locations.values()].map((entry) => entry.parent?.id ?? "__root"),
  );

  if (parentKeys.size !== 1) {
    return uniqueIds;
  }

  const parent = [...locations.values()][0].parent;
  const siblings = parent ? [...parent.children] : forest;

  const idToForm = new Map<string, Form>(
    siblings.map((form) => [form.id, form]),
  );
  const baseBySignature = new Map<string, Form[]>();
  const anglesByInnerSignature = new Map<string, Form[]>();

  siblings.forEach((form) => {
    const signature = canonicalSignature(form);
    const existingBases = baseBySignature.get(signature);
    if (existingBases) {
      existingBases.push(form);
    } else {
      baseBySignature.set(signature, [form]);
    }

    if (form.boundary === "angle") {
      const inner = firstChild(form);
      if (inner) {
        const innerSignature = canonicalSignature(inner);
        const angles = anglesByInnerSignature.get(innerSignature);
        if (angles) {
          angles.push(form);
        } else {
          anglesByInnerSignature.set(innerSignature, [form]);
        }
      }
    }
  });

  const augmented = new Set(uniqueIds);

  uniqueIds.forEach((id) => {
    const form = idToForm.get(id);
    if (!form) {
      return;
    }

    if (form.boundary === "angle") {
      const inner = firstChild(form);
      if (!inner) {
        return;
      }
      const innerSignature = canonicalSignature(inner);
      const candidates = baseBySignature.get(innerSignature) ?? [];
      const partner = candidates.find((candidate) => candidate.id !== form.id);
      if (partner) {
        augmented.add(partner.id);
      }
    } else {
      const signature = canonicalSignature(form);
      const candidates = anglesByInnerSignature.get(signature) ?? [];
      const partner = candidates.find((candidate) => candidate.id !== form.id);
      if (partner) {
        augmented.add(partner.id);
      }
    }
  });

  return [...augmented];
}

function isAllowed(allowed: AxiomType[] | undefined, type: AxiomType): boolean {
  if (!allowed || allowed.length === 0) {
    return true;
  }
  return allowed.includes(type);
}

/**
 * Adds new child forms to a parent form or the root forest.
 * Does not remove any existing children.
 */
function addChild(
  forest: Form[],
  parentId: string | null,
  newChildren: Form[],
): Form[] | null {
  if (parentId === null) {
    return [...forest, ...newChildren];
  }
  return applySingleTarget(forest, parentId, (form) => {
    const nextChildren: Form[] = [...form.children, ...newChildren];
    return [
      {
        id: form.id,
        boundary: form.boundary,
        label: form.label,
        children: new Set<Form>(nextChildren),
      },
    ];
  });
}

/**
 * Distributes content forms from their containing square into separate frames.
 */
function disperseContent(forest: Form[], contentIds: string[]): Form[] | null {
  if (contentIds.length === 0) {
    return null;
  }

  const locations = locateNodes(forest, new Set(contentIds));
  if (locations.size !== contentIds.length) {
    return null;
  }

  const squareIds = new Set(
    [...locations.values()].map((entry) => entry.parent?.id ?? null),
  );
  if (squareIds.size !== 1) {
    return null;
  }

  const [squareId] = [...squareIds];
  if (!squareId) {
    return null;
  }

  const squareLocation = locateNodes(forest, new Set([squareId])).get(squareId);
  if (!squareLocation || !squareLocation.parent) {
    return null;
  }

  const frameId = squareLocation.parent.id;
  return applySingleTarget(forest, frameId, (form) =>
    disperse(form, { squareId, contentIds }),
  );
}

function formsEqual(left: Form[], right: Form[]): boolean {
  if (left.length !== right.length) {
    return false;
  }
  const leftSignatures = canonicalSignatureForest(left);
  const rightSignatures = canonicalSignatureForest(right);
  return leftSignatures.every(
    (signature, index) => signature === rightSignatures[index],
  );
}

export const useGameStore = create<GameState>((set, get) => ({
  level: null,
  currentForms: [],
  goalForms: [],
  status: "idle",
  selectedNodeIds: [],
  selectedParentId: null,
  history: { past: [], future: [] },
  loadLevel: (level: LevelDefinition) => {
    const start = cloneForest(level.start);
    const goal = cloneForest(level.goal);
    set({
      level,
      currentForms: start,
      goalForms: goal,
      status: checkWinCondition(start, goal) ? "won" : "playing",
      selectedNodeIds: [],
      selectedParentId: null,
      history: { past: [], future: [] },
    });
  },
  resetLevel: () => {
    const state = get();
    if (!state.level) {
      return;
    }
    const start = cloneForest(state.level.start);
    set({
      currentForms: start,
      goalForms: cloneForest(state.level.goal),
      status: checkWinCondition(start, state.goalForms) ? "won" : "playing",
      selectedNodeIds: [],
      selectedParentId: null,
      history: { past: [], future: [] },
    });
  },
  applyOperation: (operation: GameOperation) => {
    const state = get();
    if (state.status === "idle") {
      return;
    }

    const allowed = state.level?.allowedAxioms;

    let nextForms: Form[] | null = null;

    switch (operation.type) {
      case "clarify": {
        if (!isAllowed(allowed, "inversion")) {
          return;
        }
        nextForms = applySingleTarget(
          state.currentForms,
          operation.targetId,
          (form) => clarify(form),
        );
        break;
      }
      case "enfold": {
        if (!isAllowed(allowed, "inversion")) {
          return;
        }
        const variant = operation.variant ?? "frame";
        const targetIds = [...new Set(operation.targetIds)];

        if (targetIds.length === 0) {
          // Create a new wrapper form and add it to the specified parent or roots.
          const wrapper = enfold(variant);
          nextForms = addChild(state.currentForms, operation.parentId ?? null, [
            wrapper,
          ]);
        } else {
          // Wrap the target siblings in a new wrapper form.
          nextForms = applySiblingOperation(
            state.currentForms,
            targetIds,
            (nodes) => [enfold(variant, ...nodes)],
          );
        }
        break;
      }
      case "disperse": {
        if (!isAllowed(allowed, "arrangement")) {
          return;
        }
        if (operation.frameId) {
          // Distribute contentIds from squareId within frameId into separate frames.
          nextForms = applySingleTarget(
            state.currentForms,
            operation.frameId,
            (form) =>
              disperse(form, {
                squareId: operation.squareId,
                contentIds: operation.contentIds,
              }),
          );
        } else {
          // Distribute contentIds from their current containing square into separate frames.
          nextForms = disperseContent(state.currentForms, operation.contentIds);
        }
        break;
      }
      case "collect": {
        if (!isAllowed(allowed, "arrangement")) {
          return;
        }
        nextForms = applySiblingOperation(
          state.currentForms,
          operation.targetIds,
          (forms) => collect(forms.map((entry) => deepClone(entry))),
        );
        break;
      }
      case "cancel": {
        if (!isAllowed(allowed, "reflection")) {
          return;
        }
        const augmentedIds = ensureCancelPairs(
          state.currentForms,
          operation.targetIds,
        );
        nextForms = applySiblingOperation(
          state.currentForms,
          augmentedIds,
          (forms) => {
            if (!isCancelApplicable(forms)) {
              return forms;
            }
            return cancel(forms.map((entry) => deepClone(entry)));
          },
        );
        break;
      }
      case "create": {
        if (!isAllowed(allowed, "reflection")) {
          return;
        }
        const templateIds = operation.templateIds ?? [];
        const templates: Form[] = [];
        let inferredParent: string | null = null;

        if (templateIds.length > 0) {
          const templateLocations = locateNodes(
            state.currentForms,
            new Set(templateIds),
          );
          templateIds.forEach((id) => {
            const match = templateLocations.get(id);
            if (match) {
              templates.push(deepClone(match.node));
              inferredParent ??= match.parent?.id ?? null;
            }
          });
        }

        const created = createReflection(...templates);
        const parentId = operation.parentId ?? inferredParent ?? null;

        nextForms = addChild(state.currentForms, parentId, created);
        break;
      }
      default:
        nextForms = null;
    }

    if (!nextForms || formsEqual(nextForms, state.currentForms)) {
      return;
    }

    const past = [...state.history.past, cloneForest(state.currentForms)];
    const future: Form[][] = [];
    const won = checkWinCondition(nextForms, state.goalForms);

    set({
      currentForms: nextForms,
      history: { past, future },
      status: won ? "won" : "playing",
      selectedNodeIds: [],
      selectedParentId: null,
    });
  },
  undo: () => {
    const state = get();
    if (state.history.past.length === 0) {
      return;
    }

    const previous = state.history.past[state.history.past.length - 1];
    const past = state.history.past.slice(0, -1);
    const future = [cloneForest(state.currentForms), ...state.history.future];

    set({
      currentForms: previous.map((form) => deepClone(form)),
      history: { past, future },
      status: checkWinCondition(previous, state.goalForms) ? "won" : "playing",
      selectedNodeIds: [],
      selectedParentId: null,
    });
  },
  redo: () => {
    const state = get();
    if (state.history.future.length === 0) {
      return;
    }

    const [next, ...rest] = state.history.future;
    const past = [...state.history.past, cloneForest(state.currentForms)];

    set({
      currentForms: next.map((form) => deepClone(form)),
      history: { past, future: rest },
      status: checkWinCondition(next, state.goalForms) ? "won" : "playing",
      selectedNodeIds: [],
      selectedParentId: null,
    });
  },
  toggleSelection: (nodeId: string) => {
    const state = get();
    const already = new Set(state.selectedNodeIds);
    if (already.has(nodeId)) {
      already.delete(nodeId);
    } else {
      already.add(nodeId);
    }
    set({ selectedNodeIds: [...already] });
  },
  clearSelection: () => {
    set({ selectedNodeIds: [] });
  },
  selectParent: (nodeId: string | null) => {
    set({ selectedParentId: nodeId });
  },
  clearParentSelection: () => {
    set({ selectedParentId: null });
  },
}));
