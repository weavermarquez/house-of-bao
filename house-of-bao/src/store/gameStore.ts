import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  type Form,
  deepClone,
  canonicalSignatureForest,
  canonicalSignature,
  createForm,
  atom,
} from "../logic/Form";
import { clarify, enfold, isClarifyApplicable } from "../logic/inversion";
import { disperse, collect } from "../logic/arrangement";
import {
  cancel,
  create as createReflection,
  isCancelApplicable,
} from "../logic/reflection";
import { checkWinCondition } from "../logic/win";
import {
  type LevelDefinition,
  type AxiomType,
  type TutorialStep,
  type TutorialTrigger,
} from "../levels/types";
import type { OperationKey } from "../operations/types";

type HistoryStack = {
  past: Form[][];
  future: Form[][];
};

type TutorialState = {
  enabled: boolean;
  completedSteps: string[];
  currentStep: TutorialStep | null;
  currentStepIndex: number;
  dismissedForCurrentLevel: boolean;
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
  | { type: "create"; parentId: string | null; templateIds?: string[] }
  | {
      type: "addBoundary";
      targetIds: string[];
      boundary: "round" | "square" | "angle";
      parentId?: string | null;
    }
  | { type: "addVariable"; label: string; parentId?: string | null };

export type GameState = {
  level: LevelDefinition | null;
  currentForms: Form[];
  goalForms: Form[];
  status: GameStatus;
  selectedNodeIds: string[];
  selectedParentId: string | null;
  history: HistoryStack;
  tutorial: TutorialState;
  loadLevel: (level: LevelDefinition) => void;
  resetLevel: () => void;
  applyOperation: (operation: GameOperation) => void;
  undo: () => void;
  redo: () => void;
  toggleSelection: (nodeId: string) => void;
  clearSelection: () => void;
  selectParent: (nodeId: string | null) => void;
  clearParentSelection: () => void;
  showTutorialStep: (step: TutorialStep) => void;
  dismissTutorialStep: () => void;
  completeTutorialStep: (stepId: string) => void;
  skipTutorialForLevel: () => void;
  toggleTutorialEnabled: () => void;
  checkAndTriggerTutorial: (trigger: TutorialTrigger) => void;
  sandboxEnabled: boolean;
  setSandboxEnabled: (enabled: boolean) => void;
};

type LocatedNode = {
  node: Form;
  parent: Form | null;
};

const fallbackStorageMap = new Map<string, string>();
const fallbackStorage: Storage = {
  get length() {
    return fallbackStorageMap.size;
  },
  clear() {
    fallbackStorageMap.clear();
  },
  getItem(key: string) {
    return fallbackStorageMap.has(key)
      ? fallbackStorageMap.get(key) ?? null
      : null;
  },
  key(index: number) {
    return [...fallbackStorageMap.keys()][index] ?? null;
  },
  removeItem(key: string) {
    fallbackStorageMap.delete(key);
  },
  setItem(key: string, value: string) {
    fallbackStorageMap.set(key, value);
  },
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
      const children = [...form.children];
      children.forEach((child) => {
        const innerSignature = canonicalSignature(child);
        const angles = anglesByInnerSignature.get(innerSignature);
        if (angles) {
          angles.push(form);
        } else {
          anglesByInnerSignature.set(innerSignature, [form]);
        }
      });
    }
  });

  // Deduplicate angle references per signature to avoid redundant lookups.
  anglesByInnerSignature.forEach((forms, signature) => {
    const seen = new Set<string>();
    const uniqueAngles = forms.filter((form) => {
      if (seen.has(form.id)) {
        return false;
      }
      seen.add(form.id);
      return true;
    });
    anglesByInnerSignature.set(signature, uniqueAngles);
  });

  const augmented = new Set(uniqueIds);

  uniqueIds.forEach((id) => {
    const form = idToForm.get(id);
    if (!form) {
      return;
    }

    if (form.boundary === "angle") {
      const children = [...form.children];
      for (const child of children) {
        const innerSignature = canonicalSignature(child);
        const candidates = baseBySignature.get(innerSignature) ?? [];
        const partner = candidates.find(
          (candidate) => candidate.id !== form.id,
        );
        if (partner) {
          augmented.add(partner.id);
          break;
        }
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

function operationKeyFor(operation: GameOperation): OperationKey {
  switch (operation.type) {
    case "clarify":
      return "clarify";
    case "enfold":
      return operation.variant === "mark" ? "enfoldMark" : "enfoldFrame";
    case "disperse":
      return "disperse";
    case "collect":
      return "collect";
    case "cancel":
      return "cancel";
    case "create":
      return "create";
    case "addBoundary":
      switch (operation.boundary) {
        case "square":
          return "addSquare";
        case "angle":
          return "addAngle";
        case "round":
        default:
          return "addRound";
      }
    case "addVariable":
      return "addVariable";
    default:
      return "clarify";
  }
}

function isOperationAllowed(
  allowed: OperationKey[] | undefined,
  operation: GameOperation,
): boolean {
  const key = operationKeyFor(operation);
  if (
    key === "addRound" ||
    key === "addSquare" ||
    key === "addAngle" ||
    key === "addVariable"
  ) {
    return true;
  }
  if (!allowed || allowed.length === 0) {
    return true;
  }
  return allowed.includes(key);
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

export function formsEqual(left: Form[], right: Form[]): boolean {
  if (left.length !== right.length) {
    return false;
  }
  const leftSignatures = canonicalSignatureForest(left);
  const rightSignatures = canonicalSignatureForest(right);
  return leftSignatures.every(
    (signature, index) => signature === rightSignatures[index],
  );
}

export function previewOperation(
  forest: Form[],
  operation: GameOperation,
  allowedAxioms?: AxiomType[],
  allowedOperations?: OperationKey[],
): Form[] | null {
  if (!isOperationAllowed(allowedOperations, operation)) {
    return null;
  }
  let nextForms: Form[] | null = null;

  switch (operation.type) {
    case "clarify": {
      if (!isAllowed(allowedAxioms, "inversion")) {
        return null;
      }
      const attempt = applySingleTarget(
        forest,
        operation.targetId,
        (form) => clarify(form),
      );
      if (attempt && !formsEqual(attempt, forest)) {
        nextForms = attempt;
        break;
      }

      const locations = locateNodes(
        forest,
        new Set<string>([operation.targetId]),
      );
      const located = locations.get(operation.targetId);
      if (!located || !located.parent) {
        return null;
      }
      if (!isClarifyApplicable(located.parent)) {
        return null;
      }
      nextForms = applySingleTarget(
        forest,
        located.parent.id,
        (form) => clarify(form),
      );
      break;
    }
    case "enfold": {
      if (!isAllowed(allowedAxioms, "inversion")) {
        return null;
      }
      const variant = operation.variant ?? "frame";
      const targetIds = [...new Set(operation.targetIds)];

      if (targetIds.length === 0) {
        const wrapper = enfold(variant);
        nextForms = addChild(forest, operation.parentId ?? null, [wrapper]);
      } else {
        nextForms = applySiblingOperation(forest, targetIds, (nodes) => [
          enfold(variant, ...nodes),
        ]);
      }
      break;
    }
    case "disperse": {
      if (!isAllowed(allowedAxioms, "arrangement")) {
        return null;
      }
      if (operation.frameId) {
        nextForms = applySingleTarget(forest, operation.frameId, (form) =>
          disperse(form, {
            squareId: operation.squareId,
            contentIds: operation.contentIds,
          }),
        );
      } else {
        nextForms = disperseContent(forest, operation.contentIds);
      }
      break;
    }
    case "collect": {
      if (!isAllowed(allowedAxioms, "arrangement")) {
        return null;
      }
      const uniqueTargets = [...new Set(operation.targetIds)];
      if (uniqueTargets.length === 0) {
        return null;
      }

      const locations = locateNodes(forest, new Set(uniqueTargets));

      const frameIds = uniqueTargets.filter((id) => {
        const match = locations.get(id);
        return match?.node.boundary === "round";
      });

      if (frameIds.length === 0) {
        return null;
      }

      const squareHint = uniqueTargets
        .map((id) => locations.get(id))
        .find((entry): entry is LocatedNode => {
          return entry !== undefined && entry.node.boundary === "square";
        });

      const hintParentId = squareHint?.parent?.id ?? null;
      const hintSquareSignature = squareHint
        ? canonicalSignature(squareHint.node)
        : null;

      const collectTargetIds =
        hintParentId && frameIds.includes(hintParentId)
          ? [hintParentId, ...frameIds.filter((id) => id !== hintParentId)]
          : frameIds;

      nextForms = applySiblingOperation(
        forest,
        collectTargetIds,
        (forms) => {
          const clones = forms.map((entry) => deepClone(entry));
          if (!hintParentId || !hintSquareSignature) {
            return collect(clones);
          }

          const templateIndex = forms.findIndex(
            (form) => form.id === hintParentId,
          );
          if (templateIndex === -1) {
            return collect(clones);
          }

          const templateClone = clones[templateIndex];
          const originalChildren = [...templateClone.children];
          const squareClones = originalChildren.filter(
            (child) => child.boundary === "square",
          );
          if (squareClones.length === 0) {
            return collect(clones);
          }

          const targetSquareClone = squareClones.find(
            (child) => canonicalSignature(child) === hintSquareSignature,
          );
          if (!targetSquareClone) {
            return collect(clones);
          }

          const orderedSquares = [
            targetSquareClone,
            ...squareClones.filter((square) => square !== targetSquareClone),
          ];

          let squareCursor = 0;
          const reorderedChildren = originalChildren.map((child) => {
            if (child.boundary !== "square") {
              return child;
            }
            const replacement = orderedSquares[squareCursor] ?? targetSquareClone;
            squareCursor += 1;
            return replacement;
          });
          templateClone.children = new Set(reorderedChildren);

          return collect(clones);
        },
      );
      break;
    }
    case "cancel": {
      if (!isAllowed(allowedAxioms, "reflection")) {
        return null;
      }
      const augmentedIds = ensureCancelPairs(forest, operation.targetIds);
      nextForms = applySiblingOperation(forest, augmentedIds, (forms) => {
        if (!isCancelApplicable(forms)) {
          return forms;
        }
        return cancel(forms.map((entry) => deepClone(entry)));
      });
      break;
    }
    case "create": {
      if (!isAllowed(allowedAxioms, "reflection")) {
        return null;
      }
      const templateIds = operation.templateIds ?? [];
      const templates: Form[] = [];
      let inferredParent: string | null = null;

      if (templateIds.length > 0) {
        const templateLocations = locateNodes(forest, new Set(templateIds));
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

      nextForms = addChild(forest, parentId, created);
      break;
    }
    case "addBoundary": {
      const targetIds = [...new Set(operation.targetIds)];
      const parentId = operation.parentId ?? null;
      const boundary = operation.boundary;

      if (targetIds.length === 0) {
        const created = createForm(boundary);
        nextForms = addChild(forest, parentId, [created]);
      } else {
        nextForms = applySiblingOperation(forest, targetIds, (nodes) => [
          createForm(boundary, ...nodes),
        ]);
      }
      break;
    }
    case "addVariable": {
      const label = operation.label.trim();
      if (label.length === 0) {
        return null;
      }
      const parentId = operation.parentId ?? null;
      const created = atom(label);
      nextForms = addChild(forest, parentId, [created]);
      break;
    }
    default:
      nextForms = null;
  }

  return nextForms;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      level: null,
      currentForms: [],
      goalForms: [],
      status: "idle",
      selectedNodeIds: [],
      selectedParentId: null,
      history: { past: [], future: [] },
      tutorial: {
        enabled: true,
        completedSteps: [],
        currentStep: null,
        currentStepIndex: 0,
        dismissedForCurrentLevel: false,
      },
      sandboxEnabled: false,
      loadLevel: (level: LevelDefinition) => {
        const start = cloneForest(level.start);
        const goal = cloneForest(level.goal);
        set((state) => ({
          level,
          currentForms: start,
          goalForms: goal,
          status: checkWinCondition(start, goal) ? "won" : "playing",
          selectedNodeIds: [],
          selectedParentId: null,
          history: { past: [], future: [] },
          tutorial: {
            ...state.tutorial,
            currentStep: null,
            currentStepIndex: 0,
            dismissedForCurrentLevel: false,
          },
        }));

        setTimeout(() => {
          get().checkAndTriggerTutorial("level_start");
        }, 500);
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
          tutorial: {
            ...state.tutorial,
            currentStep: null,
            currentStepIndex: 0,
            dismissedForCurrentLevel: false,
          },
        });
      },
      applyOperation: (operation: GameOperation) => {
        const state = get();
        if (state.status === "idle") {
          return;
        }
        if (
          (operation.type === "addBoundary" ||
            operation.type === "addVariable") &&
          !state.sandboxEnabled
        ) {
          return;
        }

        const allowed = state.level?.allowedAxioms;
        const allowedOps = state.level?.allowedOperations;
        const nextForms = previewOperation(
          state.currentForms,
          operation,
          allowed,
          allowedOps,
        );

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
      showTutorialStep: (step: TutorialStep) => {
        const level = get().level;
        const index =
          level?.tutorialSteps?.findIndex((entry) => entry.id === step.id) ?? -1;
        set((state) => ({
          tutorial: {
            ...state.tutorial,
            currentStep: step,
            currentStepIndex:
              index >= 0 ? index : state.tutorial.currentStepIndex,
          },
        }));
      },
      dismissTutorialStep: () => {
        set((state) => ({
          tutorial: {
            ...state.tutorial,
            currentStep: null,
          },
        }));
      },
      completeTutorialStep: (stepId: string) => {
        set((state) => {
          const alreadyCompleted = state.tutorial.completedSteps.includes(stepId);
          return {
            tutorial: {
              ...state.tutorial,
              currentStep: null,
              currentStepIndex: state.tutorial.currentStepIndex + 1,
              completedSteps: alreadyCompleted
                ? state.tutorial.completedSteps
                : [...state.tutorial.completedSteps, stepId],
            },
          };
        });
      },
      skipTutorialForLevel: () => {
        set((state) => ({
          tutorial: {
            ...state.tutorial,
            currentStep: null,
            dismissedForCurrentLevel: true,
          },
        }));
      },
      toggleTutorialEnabled: () => {
        set((state) => {
          const enabled = !state.tutorial.enabled;
          return {
            tutorial: {
              ...state.tutorial,
              enabled,
              currentStep: enabled ? state.tutorial.currentStep : null,
            },
          };
        });
      },
      checkAndTriggerTutorial: (trigger: TutorialTrigger) => {
        const state = get();
        const { level, tutorial } = state;

        if (
          !tutorial.enabled ||
          !level?.tutorialSteps ||
          tutorial.dismissedForCurrentLevel ||
          tutorial.currentStep
        ) {
          return;
        }

        const candidates = level.tutorialSteps
          .filter((step) => step.trigger === trigger)
          .filter((step) => !tutorial.completedSteps.includes(step.id));

        if (candidates.length === 0) {
          return;
        }

        candidates.sort(
          (a, b) => (a.priority ?? 0) - (b.priority ?? 0),
        );

        state.showTutorialStep(candidates[0]);
      },
      setSandboxEnabled: (enabled: boolean) => {
        set({ sandboxEnabled: enabled });
      },
    }),
    {
      name: "house-of-bao-storage",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" && window.localStorage
          ? window.localStorage
          : fallbackStorage,
      ),
      partialize: (state) => ({
        tutorial: {
          enabled: state.tutorial.enabled,
          completedSteps: state.tutorial.completedSteps,
        },
      }),
      merge: (persistedState, currentState) => {
        const safePersistedState =
          (persistedState ?? {}) as Partial<GameState>;
        return {
          ...currentState,
          ...safePersistedState,
          tutorial: {
            ...currentState.tutorial,
            ...(safePersistedState.tutorial ?? {}),
          },
        };
      },
    },
  ),
);
