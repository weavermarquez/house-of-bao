import { useState } from "react";
import type { GameOperation } from "../store/gameStore";
import { useAvailableOperations, type OperationKey } from "../hooks/useAvailableOperations";

const OPERATION_READY_COPY: Record<OperationKey, string> = {
  clarify: "Clarify removes a round/square wrapper from the selected form.",
  enfoldFrame: "Enfold Frame wraps siblings with a round-square shell.",
  enfoldMark: "Enfold Mark wraps siblings with a square-round shell.",
  disperse: "Disperse splits square contents into separate frames.",
  collect: "Collect merges matching frames back together.",
  cancel: "Cancel removes a form and its reflection (or empty angle).",
  create: "Create Pair spawns a template + reflection at the chosen parent.",
};

type AxiomActionPanelProps = {
  showInversionActions: boolean;
  showArrangementActions: boolean;
  showReflectionActions: boolean;
  selectedNodeIds: string[];
  firstSelected?: string;
  parentIdForOps: string | null;
  applyOperation: (operation: GameOperation) => void;
};

export function AxiomActionPanel({
  showInversionActions,
  showArrangementActions,
  showReflectionActions,
  selectedNodeIds,
  firstSelected,
  parentIdForOps,
  applyOperation,
}: AxiomActionPanelProps) {
  const operationAvailability = useAvailableOperations();
  const [focusedOperation, setFocusedOperation] = useState<OperationKey | null>(
    null,
  );

  const withFocusHandlers = (key: OperationKey) => ({
    onMouseEnter: () => setFocusedOperation(key),
    onFocus: () => setFocusedOperation(key),
    onMouseLeave: () => setFocusedOperation(null),
    onBlur: () =>
      setFocusedOperation((current) => (current === key ? null : current)),
  });

  const getOperationTooltip = (key: OperationKey) =>
    operationAvailability[key].available
      ? undefined
      : operationAvailability[key].reason ?? undefined;

  const getOperationMessage = (key: OperationKey): string => {
    const entry = operationAvailability[key];
    if (!entry.available) {
      return entry.reason ?? "Action unavailable.";
    }
    return OPERATION_READY_COPY[key];
  };

  const actionMessage = focusedOperation
    ? getOperationMessage(focusedOperation)
    : "Hover or focus an action to learn what it does.";

  return (
    <section className="info-card">
      <h2>Axiom Actions</h2>
      <div className="action-grid">
        {showInversionActions && (
          <>
            <button
              type="button"
              onClick={() => {
                if (
                  !operationAvailability.clarify.available ||
                  !firstSelected
                ) {
                  return;
                }
                applyOperation({
                  type: "clarify",
                  targetId: firstSelected,
                });
              }}
              disabled={!operationAvailability.clarify.available}
              title={getOperationTooltip("clarify")}
              {...withFocusHandlers("clarify")}
            >
              Clarify
            </button>
            <button
              type="button"
              onClick={() => {
                if (!operationAvailability.enfoldFrame.available) {
                  return;
                }
                applyOperation({
                  type: "enfold",
                  targetIds: selectedNodeIds,
                  variant: "frame",
                  parentId: parentIdForOps,
                });
              }}
              disabled={!operationAvailability.enfoldFrame.available}
              title={getOperationTooltip("enfoldFrame")}
              {...withFocusHandlers("enfoldFrame")}
            >
              Enfold Frame
            </button>
            <button
              type="button"
              onClick={() => {
                if (!operationAvailability.enfoldMark.available) {
                  return;
                }
                applyOperation({
                  type: "enfold",
                  targetIds: selectedNodeIds,
                  variant: "mark",
                  parentId: parentIdForOps,
                });
              }}
              disabled={!operationAvailability.enfoldMark.available}
              title={getOperationTooltip("enfoldMark")}
              {...withFocusHandlers("enfoldMark")}
            >
              Enfold Mark
            </button>
          </>
        )}
        {showArrangementActions && (
          <>
            <button
              type="button"
              onClick={() => {
                if (!operationAvailability.disperse.available) {
                  return;
                }
                applyOperation({
                  type: "disperse",
                  contentIds: selectedNodeIds,
                  frameId: parentIdForOps ?? undefined,
                });
              }}
              disabled={!operationAvailability.disperse.available}
              title={getOperationTooltip("disperse")}
              {...withFocusHandlers("disperse")}
            >
              Disperse
            </button>
            <button
              type="button"
              onClick={() => {
                if (!operationAvailability.collect.available) {
                  return;
                }
                applyOperation({
                  type: "collect",
                  targetIds: selectedNodeIds,
                });
              }}
              disabled={!operationAvailability.collect.available}
              title={getOperationTooltip("collect")}
              {...withFocusHandlers("collect")}
            >
              Collect
            </button>
          </>
        )}
        {showReflectionActions && (
          <>
            <button
              type="button"
              onClick={() => {
                if (!operationAvailability.cancel.available) {
                  return;
                }
                applyOperation({
                  type: "cancel",
                  targetIds: selectedNodeIds,
                });
              }}
              disabled={!operationAvailability.cancel.available}
              title={getOperationTooltip("cancel")}
              {...withFocusHandlers("cancel")}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (!operationAvailability.create.available) {
                  return;
                }
                applyOperation({
                  type: "create",
                  parentId: parentIdForOps,
                  templateIds:
                    selectedNodeIds.length > 0 ? selectedNodeIds : undefined,
                });
              }}
              disabled={!operationAvailability.create.available}
              title={getOperationTooltip("create")}
              {...withFocusHandlers("create")}
            >
              Create Pair
            </button>
          </>
        )}
      </div>
      <p className="action-feedback">{actionMessage}</p>
    </section>
  );
}
