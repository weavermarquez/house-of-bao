import { useMemo } from "react";
import { useShallow } from "zustand/shallow";
import { ROOT_NODE_ID } from "../dialects/network";
import { type Form } from "../logic/Form";
import { isClarifyApplicable } from "../logic/inversion";
import { type AxiomType } from "../levels/types";
import {
  formsEqual,
  previewOperation,
  type GameState,
  type GameStatus,
  type GameOperation,
  useGameStore,
} from "../store/gameStore";

type IndexedEntry = {
  node: Form;
  parentId: string | null;
};

const ROOT_PARENT_KEY = "__root__";
const LOAD_LEVEL_REASON = "Load a level to use axiom actions.";
const SELECTION_STALE_REASON = "Selected form is no longer available.";
const PARENT_STALE_REASON = "Selected parent is no longer available.";
const PARENT_MISMATCH_REASON = "Select sibling nodes that share the same parent.";

const AXIOM_REASONS: Record<AxiomType, string> = {
  inversion: "This level disables inversion actions.",
  arrangement: "This level disables arrangement actions.",
  reflection: "This level disables reflection actions.",
};

const FALLBACK_REASONS = {
  clarify: "Select a round-square pair to clarify.",
  enfoldFrame: "Select sibling forms or choose a parent to add a frame.",
  enfoldMark: "Select sibling forms or choose a parent to add a mark.",
  disperse: "Select contents inside a single square to disperse.",
  collect: "Select round frames that share the same context to collect.",
  cancel: "Select a form and its reflection (or an empty angle) to cancel.",
  create: "Choose a parent or template to create a reflection pair.",
} as const;

const OPERATION_KEYS = [
  "clarify",
  "enfoldFrame",
  "enfoldMark",
  "disperse",
  "collect",
  "cancel",
  "create",
] as const;

export type OperationKey = (typeof OPERATION_KEYS)[number];

export type OperationAvailability = {
  available: boolean;
  reason?: string;
};

export type OperationAvailabilityMap = Record<OperationKey, OperationAvailability>;

type OperationEvaluationContext = {
  currentForms: Form[];
  selectedNodeIds: string[];
  selectedParentId: string | null;
  status: GameStatus;
  allowedAxioms?: AxiomType[];
};

const selectHookState = (state: GameState) => ({
  currentForms: state.currentForms,
  selectedNodeIds: state.selectedNodeIds,
  selectedParentId: state.selectedParentId,
  status: state.status,
  allowedAxioms: state.level?.allowedAxioms,
});

export function useAvailableOperations(): OperationAvailabilityMap {
  const snapshot = useGameStore(useShallow(selectHookState));

  return useMemo(
    () =>
      evaluateOperationAvailability({
        currentForms: snapshot.currentForms,
        selectedNodeIds: snapshot.selectedNodeIds,
        selectedParentId: snapshot.selectedParentId,
        status: snapshot.status,
        allowedAxioms: snapshot.allowedAxioms,
      }),
    [
      snapshot.currentForms,
      snapshot.selectedNodeIds,
      snapshot.selectedParentId,
      snapshot.status,
      snapshot.allowedAxioms,
    ],
  );
}

export function evaluateOperationAvailability(
  context: OperationEvaluationContext,
): OperationAvailabilityMap {
  const availability = createBaseAvailabilityMap();

  if (context.status === "idle") {
    OPERATION_KEYS.forEach((key) => {
      availability[key] = { available: false, reason: LOAD_LEVEL_REASON };
    });
    return availability;
  }

  const indexById = indexForms(context.currentForms);
  const parentIdForOps =
    context.selectedParentId === ROOT_NODE_ID ? null : context.selectedParentId;
  const allowedAxioms = context.allowedAxioms;
  const firstSelected = context.selectedNodeIds[0];

  const previewChange = (operation: GameOperation | null): boolean => {
    if (!operation) {
      return false;
    }
    const result = previewOperation(
      context.currentForms,
      operation,
      allowedAxioms,
    );
    if (!result) {
      return false;
    }
    return !formsEqual(result, context.currentForms);
  };

  const guardAxiom = (
    key: OperationKey,
    requirement: AxiomType,
  ): boolean => {
    if (allowsAxiom(allowedAxioms, requirement)) {
      return false;
    }
    availability[key] = {
      available: false,
      reason: AXIOM_REASONS[requirement],
    };
    return true;
  };

  const guardParent = (key: OperationKey): boolean => {
    if (!parentIdForOps) {
      return false;
    }
    if (indexById.has(parentIdForOps)) {
      return false;
    }
    availability[key] = { available: false, reason: PARENT_STALE_REASON };
    return true;
  };

  const guardSiblingSelection = (key: OperationKey): boolean => {
    if (context.selectedNodeIds.length === 0) {
      return false;
    }
    const selectionEntries = context.selectedNodeIds.map((id) =>
      indexById.get(id),
    );
    if (selectionEntries.some((entry) => entry === undefined)) {
      availability[key] = { available: false, reason: SELECTION_STALE_REASON };
      return true;
    }
    const parentKeys = new Set(
      selectionEntries.map((entry) => entry!.parentId ?? ROOT_PARENT_KEY),
    );
    if (parentKeys.size > 1) {
      availability[key] = {
        available: false,
        reason: PARENT_MISMATCH_REASON,
      };
      return true;
    }
    return false;
  };

  // Clarify
  if (!guardAxiom("clarify", "inversion")) {
    if (!firstSelected) {
      availability.clarify = {
        available: false,
        reason: FALLBACK_REASONS.clarify,
      };
    } else {
      const target = indexById.get(firstSelected);
      if (!target) {
        availability.clarify = {
          available: false,
          reason: SELECTION_STALE_REASON,
        };
      } else if (!isClarifyApplicable(target.node)) {
        availability.clarify = {
          available: false,
          reason: FALLBACK_REASONS.clarify,
        };
      } else if (
        previewChange({ type: "clarify", targetId: target.node.id })
      ) {
        availability.clarify = { available: true };
      }
    }
  }

  // Enfold Frame
  if (!guardAxiom("enfoldFrame", "inversion") && !guardParent("enfoldFrame")) {
    if (
      !guardSiblingSelection("enfoldFrame") &&
      previewChange({
        type: "enfold",
        targetIds: context.selectedNodeIds,
        parentId: parentIdForOps,
        variant: "frame",
      })
    ) {
      availability.enfoldFrame = { available: true };
    }
  }

  // Enfold Mark
  if (!guardAxiom("enfoldMark", "inversion") && !guardParent("enfoldMark")) {
    if (
      !guardSiblingSelection("enfoldMark") &&
      previewChange({
        type: "enfold",
        targetIds: context.selectedNodeIds,
        parentId: parentIdForOps,
        variant: "mark",
      })
    ) {
      availability.enfoldMark = { available: true };
    }
  }

  // Disperse
  if (!guardAxiom("disperse", "arrangement") && !guardParent("disperse")) {
    if (
      previewChange({
        type: "disperse",
        contentIds: context.selectedNodeIds,
        frameId: parentIdForOps ?? undefined,
      })
    ) {
      availability.disperse = { available: true };
    }
  }

  // Collect
  if (!guardAxiom("collect", "arrangement")) {
    const selectionHasFrames = context.selectedNodeIds.some((id) => {
      const entry = indexById.get(id);
      return entry?.node.boundary === "round";
    });

    if (!selectionHasFrames) {
      availability.collect = {
        available: false,
        reason: FALLBACK_REASONS.collect,
      };
    } else if (
      previewChange({ type: "collect", targetIds: context.selectedNodeIds })
    ) {
      availability.collect = { available: true };
    }
  }

  // Cancel
  if (!guardAxiom("cancel", "reflection")) {
    if (
      previewChange({ type: "cancel", targetIds: context.selectedNodeIds })
    ) {
      availability.cancel = { available: true };
    }
  }

  // Create
  if (!guardAxiom("create", "reflection") && !guardParent("create")) {
    if (
      previewChange({
        type: "create",
        parentId: parentIdForOps ?? null,
        templateIds:
          context.selectedNodeIds.length > 0
            ? context.selectedNodeIds
            : undefined,
      })
    ) {
      availability.create = { available: true };
    }
  }

  return availability;
}

function createBaseAvailabilityMap(
  sharedReason?: string,
): OperationAvailabilityMap {
  const map = {} as OperationAvailabilityMap;
  OPERATION_KEYS.forEach((key) => {
    map[key] = {
      available: false,
      reason: sharedReason ?? FALLBACK_REASONS[key],
    };
  });
  return map;
}

function allowsAxiom(
  allowed: AxiomType[] | undefined,
  type: AxiomType,
): boolean {
  if (!allowed || allowed.length === 0) {
    return true;
  }
  return allowed.includes(type);
}

function indexForms(forest: Form[]): Map<string, IndexedEntry> {
  const index = new Map<string, IndexedEntry>();
  const stack: Array<IndexedEntry> = forest.map((node) => ({ node, parentId: null }));

  while (stack.length > 0) {
    const current = stack.pop()!;
    index.set(current.node.id, {
      node: current.node,
      parentId: current.parentId,
    });
    current.node.children.forEach((child) => {
      stack.push({ node: child, parentId: current.node.id });
    });
  }

  return index;
}
