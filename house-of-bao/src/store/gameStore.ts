import { create } from "zustand";
import { type Form, deepClone, canonicalSignatureForest } from "../logic/Form";
import {
  clarify,
  enfoldRoundSquare,
  enfoldSquareRound,
} from "../logic/inversion";
import { disperse, type DisperseOptions, collect } from "../logic/arrangement";
import { cancel, create as createReflection } from "../logic/reflection";
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
      targetId: string;
      variant?: "round-square" | "square-round";
    }
  | {
      type: "disperse";
      targetId: string;
      squareId?: string;
      contentIds?: string[];
    }
  | { type: "collect"; targetIds: string[] }
  | { type: "cancel"; targetIds: string[] }
  | { type: "create"; parentId: string | null; templateIds?: string[] };

type GameState = {
  level: LevelDefinition | null;
  currentForms: Form[];
  goalForms: Form[];
  status: GameStatus;
  selectedNodeIds: string[];
  history: HistoryStack;
  loadLevel: (level: LevelDefinition) => void;
  resetLevel: () => void;
  applyOperation: (operation: GameOperation) => void;
  undo: () => void;
  redo: () => void;
  toggleSelection: (nodeId: string) => void;
  clearSelection: () => void;
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

function isAllowed(allowed: AxiomType[] | undefined, type: AxiomType): boolean {
  if (!allowed || allowed.length === 0) {
    return true;
  }
  return allowed.includes(type);
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
        nextForms = applySingleTarget(
          state.currentForms,
          operation.targetId,
          (form) => {
            if (operation.variant === "square-round") {
              return [enfoldSquareRound(form)];
            }
            return [enfoldRoundSquare(form)];
          },
        );
        break;
      }
      case "disperse": {
        if (!isAllowed(allowed, "arrangement")) {
          return;
        }
        const options: DisperseOptions = {
          squareId: operation.squareId,
          contentIds: operation.contentIds,
        };
        nextForms = applySingleTarget(
          state.currentForms,
          operation.targetId,
          (form) => disperse(form, options),
        );
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
        nextForms = applySiblingOperation(
          state.currentForms,
          operation.targetIds,
          (forms) => cancel(forms.map((entry) => deepClone(entry))),
        );
        break;
      }
      case "create": {
        if (!isAllowed(allowed, "reflection")) {
          return;
        }
        const templateIds = operation.templateIds ?? [];
        let templateLocations: Map<string, LocatedNode> | null = null;
        let templates: Form[] = [];
        if (templateIds.length > 0) {
          templateLocations = locateNodes(
            state.currentForms,
            new Set(templateIds),
          );
          templates = templateIds
            .map((id) => templateLocations.get(id))
            .filter((entry): entry is LocatedNode => Boolean(entry))
            .map((entry) => deepClone(entry.node));
        }
        const created = createReflection(...templates);
        const parentId =
          operation.parentId ??
          (templateIds.length > 0
            ? (templateLocations?.get(templateIds[0])?.parent?.id ?? null)
            : null);

        if (parentId === null) {
          nextForms = [...state.currentForms, ...created];
        } else {
          nextForms = applySingleTarget(
            state.currentForms,
            parentId,
            (form) => {
              const nextChildren: Form[] = [];
              form.children.forEach((child) => nextChildren.push(child));
              created.forEach((child) => nextChildren.push(child));
              return [
                {
                  id: form.id,
                  boundary: form.boundary,
                  label: form.label,
                  children: new Set<Form>(nextChildren),
                },
              ];
            },
          );
        }
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
}));
