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

const AXIOM_METADATA = {
  inversion: {
    label: "Inversion",
    reminder: "round ↔ square",
    glyph: InversionGlyph,
  },
  arrangement: {
    label: "Arrangement",
    reminder: "frames ↔ squares",
    glyph: ArrangementGlyph,
  },
  reflection: {
    label: "Reflection",
    reminder: "angle ↔ mirror",
    glyph: ReflectionGlyph,
  },
} as const;

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
    <section className="info-card axiom-actions-panel">
      <div className="axiom-panel-heading">
        <div>
          <h2>Axiom Actions</h2>
          <p className="axiom-panel-subhead">
            See which moves are ready and why others are blocked.
          </p>
        </div>
      </div>
      <div className="axiom-groups">
        {showInversionActions && (
          <div className="axiom-group">
            <div className="axiom-group-heading">
              <div className="axiom-heading-copy">
                <span>{AXIOM_METADATA.inversion.label}</span>
                <span className="axiom-group-reminder">
                  {AXIOM_METADATA.inversion.reminder}
                </span>
              </div>
              <div className="axiom-group-visual">
                <AXIOM_METADATA.inversion.glyph />
              </div>
            </div>
            <div className="axiom-group-actions">
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
            </div>
          </div>
        )}
        {showArrangementActions && (
          <div className="axiom-group">
            <div className="axiom-group-heading">
              <div className="axiom-heading-copy">
                <span>{AXIOM_METADATA.arrangement.label}</span>
                <span className="axiom-group-reminder">
                  {AXIOM_METADATA.arrangement.reminder}
                </span>
              </div>
              <div className="axiom-group-visual">
                <AXIOM_METADATA.arrangement.glyph />
              </div>
            </div>
            <div className="axiom-group-actions">
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
            </div>
          </div>
        )}
        {showReflectionActions && (
          <div className="axiom-group">
            <div className="axiom-group-heading">
              <div className="axiom-heading-copy">
                <span>{AXIOM_METADATA.reflection.label}</span>
                <span className="axiom-group-reminder">
                  {AXIOM_METADATA.reflection.reminder}
                </span>
              </div>
              <div className="axiom-group-visual">
                <AXIOM_METADATA.reflection.glyph />
              </div>
            </div>
            <div className="axiom-group-actions">
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
            </div>
          </div>
        )}
      </div>
      <p className="action-feedback">{actionMessage}</p>
    </section>
  );
}

function InversionGlyph() {
  return (
    <svg width={56} height={34} viewBox="0 0 56 34" aria-hidden>
      <circle cx={12} cy={17} r={12} fill="#fde68a" stroke="#b45309" strokeWidth={1.5} />
      <rect x={28} y={5} width={18} height={24} rx={3} fill="#bfdbfe" stroke="#1d4ed8" strokeWidth={1.5} />
    </svg>
  );
}

function ArrangementGlyph() {
  return (
    <svg width={56} height={34} viewBox="0 0 56 34" aria-hidden>
      <circle cx={14} cy={17} r={13} fill="#e0f2fe" stroke="#0284c7" strokeWidth={1.5} />
      <rect x={7} y={10} width={14} height={14} rx={2} fill="#cbd5f5" stroke="#475569" strokeWidth={1.2} />
      <circle cx={40} cy={17} r={13} fill="#e0f2fe" stroke="#0284c7" strokeWidth={1.5} />
      <rect x={33} y={10} width={14} height={14} rx={2} fill="#fef3c7" stroke="#c2410c" strokeWidth={1.2} />
    </svg>
  );
}

function ReflectionGlyph() {
  return (
    <svg width={56} height={34} viewBox="0 0 56 34" aria-hidden>
      <polygon points="8,4 28,17 8,30" fill="#ede9fe" stroke="#7c3aed" strokeWidth={1.5} />
      <circle cx={40} cy={17} r={10} fill="#fef9c3" stroke="#eab308" strokeWidth={1.5} />
      <path d="M40 7 L48 17 L40 27" fill="#a5b4fc" stroke="#4338ca" strokeWidth={1.2} />
    </svg>
  );
}
