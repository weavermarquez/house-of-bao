import { useMemo } from "react";
import { useShallow } from "zustand/shallow";
import { ROOT_NODE_ID } from "../dialects/network";
import { type Form } from "../logic/Form";
import { isClarifyApplicable } from "../logic/inversion";
import { type AxiomType } from "../levels/types";
import { OPERATION_KEYS, type OperationKey } from "../operations/types";
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

const SANDBOX_DISABLED_REASON =
  "Enable sandbox mode to add sandbox primitives.";

const FALLBACK_REASONS = {
  clarify: "Select a round-square pair to clarify.",
  enfoldFrame: "Select sibling forms or choose a parent to add a frame.",
  enfoldMark: "Select sibling forms or choose a parent to add a mark.",
  disperse: "Select a square (or its contents) within a single frame to disperse.",
  collect:
    "Select frames (or their squares) that share the same context to collect.",
  cancel:
    "Select a reflection angle (or its contents) alongside its matching form to cancel.",
  create: "Choose a parent or template to create a reflection pair.",
  addRound: "Enable sandbox mode and select siblings to wrap with a round boundary.",
  addSquare: "Enable sandbox mode and select siblings to wrap with a square boundary.",
  addAngle: "Enable sandbox mode and select siblings to wrap with an angle boundary.",
  addVariable: "Enter a variable label to insert an atom in sandbox mode.",
} as const;

const OPERATION_DISABLED_REASONS: Record<OperationKey, string> = {
  clarify: "This level locks Clarify to focus on other actions.",
  enfoldFrame: "This level locks Enfold Frame to focus on other actions.",
  enfoldMark: "This level locks Enfold Mark to focus on other actions.",
  disperse: "This level locks Disperse to focus on other actions.",
  collect: "This level locks Collect to focus on other actions.",
  cancel: "This level locks Cancel to focus on other actions.",
  create: "This level locks Create to focus on other actions.",
  addRound: "This level locks Add Round to focus on other actions.",
  addSquare: "This level locks Add Square to focus on other actions.",
  addAngle: "This level locks Add Angle to focus on other actions.",
  addVariable: "This level locks Add Variable to focus on other actions.",
};

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
  allowedOperations?: OperationKey[];
  sandboxEnabled: boolean;
};

const selectHookState = (state: GameState) => ({
  currentForms: state.currentForms,
  selectedNodeIds: state.selectedNodeIds,
  selectedParentId: state.selectedParentId,
  status: state.status,
  allowedAxioms: state.level?.allowedAxioms,
  allowedOperations: state.level?.allowedOperations,
  sandboxEnabled: state.sandboxEnabled,
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
        allowedOperations: snapshot.allowedOperations,
        sandboxEnabled: snapshot.sandboxEnabled,
      }),
    [
      snapshot.currentForms,
      snapshot.selectedNodeIds,
      snapshot.selectedParentId,
      snapshot.status,
      snapshot.allowedAxioms,
      snapshot.allowedOperations,
      snapshot.sandboxEnabled,
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
  const allowedOperations = context.allowedOperations;
  const firstSelected = context.selectedNodeIds[0];

  const previewChange = (operation: GameOperation | null): boolean => {
    if (!operation) {
      return false;
    }
    const result = previewOperation(
      context.currentForms,
      operation,
      allowedAxioms,
      allowedOperations,
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

  const guardOperation = (key: OperationKey): boolean => {
    if (allowsOperation(allowedOperations, key)) {
      return false;
    }
    availability[key] = {
      available: false,
      reason: OPERATION_DISABLED_REASONS[key],
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
  if (!guardOperation("clarify") && !guardAxiom("clarify", "inversion")) {
    if (!firstSelected) {
      availability.clarify = {
        available: false,
        reason: FALLBACK_REASONS.clarify,
      };
    } else {
      const targetEntry = indexById.get(firstSelected);
      if (!targetEntry) {
        availability.clarify = {
          available: false,
          reason: SELECTION_STALE_REASON,
        };
      } else {
        const clarifyTarget = resolveClarifyTarget(indexById, targetEntry);
        if (!clarifyTarget) {
          availability.clarify = {
            available: false,
            reason: FALLBACK_REASONS.clarify,
          };
        } else if (
          previewChange({ type: "clarify", targetId: clarifyTarget.node.id })
        ) {
          availability.clarify = { available: true };
        }
      }
    }
  }

  // Enfold Frame
  if (
    !guardOperation("enfoldFrame") &&
    !guardAxiom("enfoldFrame", "inversion") &&
    !guardParent("enfoldFrame")
  ) {
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
  if (
    !guardOperation("enfoldMark") &&
    !guardAxiom("enfoldMark", "inversion") &&
    !guardParent("enfoldMark")
  ) {
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
  if (
    !guardOperation("disperse") &&
    !guardAxiom("disperse", "arrangement") &&
    !guardParent("disperse")
  ) {
    const disperseOperation = buildDisperseOperation(
      indexById,
      context.selectedNodeIds,
      parentIdForOps,
    );
    if (disperseOperation && previewChange(disperseOperation)) {
      availability.disperse = { available: true };
    }
  }

  // Collect
  if (!guardOperation("collect") && !guardAxiom("collect", "arrangement")) {
    const collectOperation = buildCollectOperation(
      indexById,
      context.selectedNodeIds,
    );
    if (!collectOperation) {
      availability.collect = {
        available: false,
        reason: FALLBACK_REASONS.collect,
      };
    } else if (previewChange(collectOperation)) {
      availability.collect = { available: true };
    }
  }

  // Cancel
  if (!guardOperation("cancel") && !guardAxiom("cancel", "reflection")) {
    const cancelOperation = buildCancelOperation(
      indexById,
      context.selectedNodeIds,
    );
    if (cancelOperation && previewChange(cancelOperation)) {
      availability.cancel = { available: true };
    }
  }

  // Create
  if (
    !guardOperation("create") &&
    !guardAxiom("create", "reflection") &&
    !guardParent("create")
  ) {
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

  const evaluateAddBoundary = (
    key: OperationKey,
    boundary: "round" | "square" | "angle",
  ) => {
    if (guardOperation(key)) {
      return;
    }
    if (!context.sandboxEnabled) {
      availability[key] = {
        available: false,
        reason: SANDBOX_DISABLED_REASON,
      };
      return;
    }
    if (guardParent(key)) {
      return;
    }
    if (
      context.selectedNodeIds.length > 0 &&
      guardSiblingSelection(key)
    ) {
      return;
    }

    if (
      previewChange({
        type: "addBoundary",
        targetIds: context.selectedNodeIds,
        parentId: parentIdForOps ?? null,
        boundary,
      })
    ) {
      availability[key] = { available: true };
    }
  };

  evaluateAddBoundary("addRound", "round");
  evaluateAddBoundary("addSquare", "square");
  evaluateAddBoundary("addAngle", "angle");

  const evaluateAddVariable = () => {
    if (guardOperation("addVariable")) {
      return;
    }
    if (!context.sandboxEnabled) {
      availability.addVariable = {
        available: false,
        reason: SANDBOX_DISABLED_REASON,
      };
      return;
    }
    if (guardParent("addVariable")) {
      return;
    }

    if (
      previewChange({
        type: "addVariable",
        label: "sandbox",
        parentId: parentIdForOps ?? null,
      })
    ) {
      availability.addVariable = { available: true };
    }
  };

  evaluateAddVariable();

  return availability;
}

function resolveClarifyTarget(
  index: Map<string, IndexedEntry>,
  entry: IndexedEntry,
): IndexedEntry | null {
  if (isClarifyApplicable(entry.node)) {
    return entry;
  }
  if (!entry.parentId) {
    return null;
  }
  const parentEntry = index.get(entry.parentId);
  if (parentEntry && isClarifyApplicable(parentEntry.node)) {
    return parentEntry;
  }
  return null;
}

function buildDisperseOperation(
  index: Map<string, IndexedEntry>,
  selectedNodeIds: string[],
  parentIdForOps: string | null,
): GameOperation | null {
  const uniqueIds = [...new Set(selectedNodeIds)];
  if (uniqueIds.length === 0) {
    return null;
  }

  const entries = uniqueIds.map((id) => index.get(id));
  if (entries.some((entry) => entry === undefined)) {
    return null;
  }

  const squareEntry = entries.find(
    (entry): entry is IndexedEntry =>
      entry !== undefined && entry.node.boundary === "square",
  );

  if (squareEntry && uniqueIds.length === 1) {
    if (squareEntry.node.children.size === 0) {
      return null;
    }
    if (!squareEntry.parentId) {
      return null;
    }
    const contentIds = [...squareEntry.node.children].map((child) => child.id);
    return {
      type: "disperse",
      contentIds,
      squareId: squareEntry.node.id,
      frameId: squareEntry.parentId,
    };
  }

  return {
    type: "disperse",
    contentIds: uniqueIds,
    frameId: parentIdForOps ?? undefined,
  };
}

export function createDisperseOperationForSelection(
  forest: Form[],
  selectedNodeIds: string[],
  parentIdForOps: string | null,
): GameOperation | null {
  const index = indexForms(forest);
  return buildDisperseOperation(index, selectedNodeIds, parentIdForOps);
}

function normalizeCancelTargets(
  index: Map<string, IndexedEntry>,
  selectedNodeIds: string[],
): string[] {
  const normalized: string[] = [];

  selectedNodeIds.forEach((id) => {
    const entry = index.get(id);
    if (!entry) {
      return;
    }

    if (entry.node.boundary === "angle") {
      normalized.push(entry.node.id);
      return;
    }

    if (entry.parentId) {
      const parentEntry = index.get(entry.parentId);
      if (parentEntry?.node.boundary === "angle") {
        normalized.push(parentEntry.node.id);
        return;
      }
    }

    normalized.push(entry.node.id);
  });

  return [...new Set(normalized)];
}

function buildCancelOperation(
  index: Map<string, IndexedEntry>,
  selectedNodeIds: string[],
): GameOperation | null {
  const targetIds = normalizeCancelTargets(index, selectedNodeIds);
  if (targetIds.length === 0) {
    return null;
  }
  return {
    type: "cancel",
    targetIds,
  };
}

export function createCancelOperationForSelection(
  forest: Form[],
  selectedNodeIds: string[],
): GameOperation | null {
  const index = indexForms(forest);
  return buildCancelOperation(index, selectedNodeIds);
}

function buildCollectOperation(
  index: Map<string, IndexedEntry>,
  selectedNodeIds: string[],
): GameOperation | null {
  const uniqueIds = [...new Set(selectedNodeIds)];
  if (uniqueIds.length === 0) {
    return null;
  }

  const entries = uniqueIds.map((id) => index.get(id));
  if (entries.some((entry) => entry === undefined)) {
    return null;
  }

  const frameIds: string[] = [];
  const seenFrames = new Set<string>();
  const squareIds: string[] = [];

  uniqueIds.forEach((id, indexPosition) => {
    const entry = entries[indexPosition];
    if (!entry) {
      return;
    }
    if (entry.node.boundary === "round") {
      if (!seenFrames.has(entry.node.id)) {
        seenFrames.add(entry.node.id);
        frameIds.push(entry.node.id);
      }
      return;
    }
    if (entry.node.boundary === "square") {
      squareIds.push(entry.node.id);
      if (entry.parentId) {
        const parentEntry = index.get(entry.parentId);
        if (parentEntry?.node.boundary === "round") {
          if (!seenFrames.has(parentEntry.node.id)) {
            seenFrames.add(parentEntry.node.id);
            frameIds.push(parentEntry.node.id);
          }
        }
      }
    }
  });

  if (frameIds.length === 0) {
    return null;
  }

  return {
    type: "collect",
    targetIds: [...frameIds, ...squareIds],
  };
}

export function createCollectOperationForSelection(
  forest: Form[],
  selectedNodeIds: string[],
): GameOperation | null {
  const index = indexForms(forest);
  return buildCollectOperation(index, selectedNodeIds);
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

function allowsOperation(
  allowed: OperationKey[] | undefined,
  key: OperationKey,
): boolean {
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
