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
    glyph: InversionGlyph,
  },
  arrangement: {
    label: "Arrangement",
    glyph: ArrangementGlyph,
  },
  reflection: {
    label: "Reflection",
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
  const roundFill = "#fde68a";
  const roundStroke = "#b45309";
  const squareFill = "#bfdbfe";
  const squareStroke = "#1d4ed8";
  return (
    <svg width={76} height={40} viewBox="0 0 76 40" aria-hidden>
      <rect
        x={4}
        y={6}
        width={28}
        height={28}
        rx={4}
        fill={squareFill}
        stroke={squareStroke}
        strokeWidth={2}
      />
      <circle cx={18} cy={20} r={9} fill={roundFill} stroke={roundStroke} strokeWidth={2} />
      <circle
        cx={52}
        cy={20}
        r={14}
        fill={roundFill}
        stroke={roundStroke}
        strokeWidth={2}
      />
      <rect
        x={44}
        y={12}
        width={16}
        height={16}
        rx={3}
        fill={squareFill}
        stroke={squareStroke}
        strokeWidth={2}
      />
    </svg>
  );
}

function ArrangementGlyph() {
  const roundFill = "#fde68a";
  const roundStroke = "#b45309";
  const squareFill = "#bfdbfe";
  const squareStroke = "#1d4ed8";
  const contentFill = "#fcd34d";
  return (
    <svg width={120} height={42} viewBox="0 0 120 42" aria-hidden>
      <circle cx={24} cy={21} r={18} fill={roundFill} stroke={roundStroke} strokeWidth={2} />
      <rect
        x={12}
        y={11}
        width={24}
        height={20}
        rx={4}
        fill={squareFill}
        stroke={squareStroke}
        strokeWidth={1.8}
      />
      <circle cx={24} cy={16} r={3} fill={contentFill} stroke={roundStroke} strokeWidth={1} />
      <circle cx={24} cy={26} r={3} fill={contentFill} stroke={roundStroke} strokeWidth={1} />
      <circle cx={70} cy={14} r={4} fill={contentFill} stroke={roundStroke} strokeWidth={1} />
      <circle cx={94} cy={14} r={4} fill={contentFill} stroke={roundStroke} strokeWidth={1} />
      <circle cx={70} cy={28} r={4} fill={contentFill} stroke={roundStroke} strokeWidth={1} />
      <circle cx={94} cy={28} r={4} fill={contentFill} stroke={roundStroke} strokeWidth={1} />
      <circle cx={70} cy={21} r={13} fill={roundFill} stroke={roundStroke} strokeWidth={1.6} />
      <rect
        x={62}
        y={15}
        width={16}
        height={12}
        rx={3}
        fill={squareFill}
        stroke={squareStroke}
        strokeWidth={1.4}
      />
      <circle cx={94} cy={21} r={13} fill={roundFill} stroke={roundStroke} strokeWidth={1.6} />
      <rect
        x={86}
        y={15}
        width={16}
        height={12}
        rx={3}
        fill={squareFill}
        stroke={squareStroke}
        strokeWidth={1.4}
      />
    </svg>
  );
}

function ReflectionGlyph() {
  const angleFill = "#e9d5ff";
  const angleStroke = "#7c3aed";
  const roundFill = "#fde68a";
  const roundStroke = "#b45309";
  return (
    <svg width={100} height={42} viewBox="0 0 100 42" aria-hidden>
      <circle cx={24} cy={21} r={12} fill={roundFill} stroke={roundStroke} strokeWidth={2} />
      <polygon
        points="64,7 90,21 64,35"
        fill={angleFill}
        stroke={angleStroke}
        strokeWidth={2}
      />
      <circle cx={76} cy={21} r={6} fill={roundFill} stroke={roundStroke} strokeWidth={1.4} />
    </svg>
  );
}
