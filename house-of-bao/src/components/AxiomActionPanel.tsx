import { useCallback, useEffect, useRef, useState } from "react";
import type { Form } from "../logic/Form";
import type { AxiomType } from "../levels/types";
import {
  previewOperation,
  useGameStore,
  type GameOperation,
} from "../store/gameStore";
import { useAvailableOperations, type OperationKey } from "../hooks/useAvailableOperations";
import { ACTION_METADATA } from "./ActionGlyphs";

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
  currentForms: Form[];
  allowedAxioms?: AxiomType[];
  onPreviewChange?: (
    payload:
      | {
          forms?: Form[];
          description: string;
          operation: OperationKey;
          note?: string;
        }
      | null
  ) => void;
};

export function AxiomActionPanel({
  showInversionActions,
  showArrangementActions,
  showReflectionActions,
  selectedNodeIds,
  firstSelected,
  parentIdForOps,
  currentForms,
  allowedAxioms,
  applyOperation,
  onPreviewChange,
}: AxiomActionPanelProps) {
  const checkAndTriggerTutorial = useGameStore(
    (state) => state.checkAndTriggerTutorial,
  );
  const operationAvailability = useAvailableOperations();
  const [newlyAvailable, setNewlyAvailable] = useState<Set<OperationKey>>(
    () => new Set(),
  );
  const [previewLock, setPreviewLock] = useState<OperationKey | null>(null);
  const availabilityRef = useRef(operationAvailability);

  useEffect(() => {
    const previous = availabilityRef.current;
    const keys = Object.keys(operationAvailability) as OperationKey[];
    const nowAvailable = new Set<OperationKey>();
    keys.forEach((key) => {
      if (operationAvailability[key].available && !previous[key]?.available) {
        nowAvailable.add(key);
      }
    });
    availabilityRef.current = operationAvailability;

    if (nowAvailable.size > 0) {
      setNewlyAvailable(nowAvailable);
      const timer = setTimeout(() => setNewlyAvailable(new Set()), 1000);
      return () => clearTimeout(timer);
    }
    setNewlyAvailable(new Set());
    return undefined;
  }, [operationAvailability]);

  const computePreview = useCallback(
    (operation: GameOperation): Form[] | null => {
      return previewOperation(currentForms, operation, allowedAxioms);
    },
    [currentForms, allowedAxioms],
  );

  const lockPreviewFor = useCallback(
    (key: OperationKey) => {
      setPreviewLock(key);
      onPreviewChange?.(null);
    },
    [onPreviewChange],
  );

  const createInteractionHandlers = useCallback(
    (
      key: OperationKey,
      buildOperation?: () => GameOperation | null,
    ) => {
      const showPreview = () => {
        const metadata = ACTION_METADATA[key];
        const availability = operationAvailability[key];
        const emitPreview = (forms?: Form[], note?: string) => {
          onPreviewChange?.({
            forms,
            description: metadata.description,
            operation: key,
            note,
          });
        };

        if (previewLock === key) {
          onPreviewChange?.(null);
          return;
        }
        if (!buildOperation) {
          emitPreview(undefined, availability.reason);
          return;
        }
        const operation = buildOperation();
        if (!operation) {
          emitPreview(undefined, availability.reason);
          return;
        }
        if (availability.available) {
          const preview = computePreview(operation);
          if (preview) {
            emitPreview(preview);
          } else {
            emitPreview();
          }
        } else {
          emitPreview(undefined, availability.reason);
        }
      };

      return {
        onMouseEnter: () => {
          checkAndTriggerTutorial("button_hover");
          showPreview();
        },
        onFocus: () => {
          checkAndTriggerTutorial("button_hover");
          showPreview();
        },
        onMouseLeave: () => {
          onPreviewChange?.(null);
          setPreviewLock((current) => (current === key ? null : current));
        },
        onBlur: () => {
          onPreviewChange?.(null);
          setPreviewLock((current) => (current === key ? null : current));
        },
      };
    },
    [
      previewLock,
      operationAvailability,
      computePreview,
      onPreviewChange,
      checkAndTriggerTutorial,
    ],
  );

  const getOperationTooltip = (key: OperationKey) =>
    operationAvailability[key].available
      ? undefined
      : operationAvailability[key].reason ?? undefined;

  const renderButtonContent = (key: OperationKey) => {
    const metadata = ACTION_METADATA[key];
    const Glyph = metadata.Glyph;
    return (
      <span className="action-button-content">
        <Glyph className="action-button-glyph" />
        <span className="action-button-text">
          <span className="action-button-name">{metadata.label}</span>
          <span className="action-button-hint">{metadata.hint}</span>
        </span>
      </span>
    );
  };

  const renderActionControl = (
    key: OperationKey,
    buildOperation: (() => GameOperation | null) | undefined,
    buttonProps: {
      onClick: () => void;
      disabled: boolean;
      title?: string;
      className?: string;
    },
  ) => {
    const handlers = createInteractionHandlers(key, buildOperation);
    return (
      <div
        className="action-button-wrapper"
        onMouseEnter={handlers.onMouseEnter}
        onMouseLeave={handlers.onMouseLeave}
      >
        <button
          type="button"
          {...buttonProps}
          onFocus={handlers.onFocus}
          onBlur={handlers.onBlur}
        >
          {renderButtonContent(key)}
        </button>
      </div>
    );
  };

  return (
    <section className="info-card axiom-actions-panel">
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
              {renderActionControl(
                "clarify",
                () =>
                  firstSelected
                    ? {
                        type: "clarify",
                        targetId: firstSelected,
                      }
                    : null,
                {
                  onClick: () => {
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
                    lockPreviewFor("clarify");
                  },
                  disabled: !operationAvailability.clarify.available,
                  title: getOperationTooltip("clarify"),
                  className: newlyAvailable.has("clarify")
                    ? "button-newly-available"
                    : "",
                },
              )}
              {renderActionControl(
                "enfoldFrame",
                () => ({
                  type: "enfold",
                  targetIds: selectedNodeIds,
                  variant: "frame",
                  parentId: parentIdForOps,
                }),
                {
                  onClick: () => {
                    if (!operationAvailability.enfoldFrame.available) {
                      return;
                    }
                    applyOperation({
                      type: "enfold",
                      targetIds: selectedNodeIds,
                      variant: "frame",
                      parentId: parentIdForOps,
                    });
                    lockPreviewFor("enfoldFrame");
                  },
                  disabled: !operationAvailability.enfoldFrame.available,
                  title: getOperationTooltip("enfoldFrame"),
                  className: newlyAvailable.has("enfoldFrame")
                    ? "button-newly-available"
                    : "",
                },
              )}
              {renderActionControl(
                "enfoldMark",
                () => ({
                  type: "enfold",
                  targetIds: selectedNodeIds,
                  variant: "mark",
                  parentId: parentIdForOps,
                }),
                {
                  onClick: () => {
                    if (!operationAvailability.enfoldMark.available) {
                      return;
                    }
                    applyOperation({
                      type: "enfold",
                      targetIds: selectedNodeIds,
                      variant: "mark",
                      parentId: parentIdForOps,
                    });
                    lockPreviewFor("enfoldMark");
                  },
                  disabled: !operationAvailability.enfoldMark.available,
                  title: getOperationTooltip("enfoldMark"),
                  className: newlyAvailable.has("enfoldMark")
                    ? "button-newly-available"
                    : "",
                },
              )}
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
              {renderActionControl(
                "disperse",
                () => ({
                  type: "disperse",
                  contentIds: selectedNodeIds,
                  frameId: parentIdForOps ?? undefined,
                }),
                {
                  onClick: () => {
                    if (!operationAvailability.disperse.available) {
                      return;
                    }
                    applyOperation({
                      type: "disperse",
                      contentIds: selectedNodeIds,
                      frameId: parentIdForOps ?? undefined,
                    });
                    lockPreviewFor("disperse");
                  },
                  disabled: !operationAvailability.disperse.available,
                  title: getOperationTooltip("disperse"),
                  className: newlyAvailable.has("disperse")
                    ? "button-newly-available"
                    : "",
                },
              )}
              {renderActionControl(
                "collect",
                () => ({
                  type: "collect",
                  targetIds: selectedNodeIds,
                }),
                {
                  onClick: () => {
                    if (!operationAvailability.collect.available) {
                      return;
                    }
                    applyOperation({
                      type: "collect",
                      targetIds: selectedNodeIds,
                    });
                    lockPreviewFor("collect");
                  },
                  disabled: !operationAvailability.collect.available,
                  title: getOperationTooltip("collect"),
                  className: newlyAvailable.has("collect")
                    ? "button-newly-available"
                    : "",
                },
              )}
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
              {renderActionControl(
                "cancel",
                () => ({
                  type: "cancel",
                  targetIds: selectedNodeIds,
                }),
                {
                  onClick: () => {
                    if (!operationAvailability.cancel.available) {
                      return;
                    }
                    applyOperation({
                      type: "cancel",
                      targetIds: selectedNodeIds,
                    });
                    lockPreviewFor("cancel");
                  },
                  disabled: !operationAvailability.cancel.available,
                  title: getOperationTooltip("cancel"),
                  className: newlyAvailable.has("cancel")
                    ? "button-newly-available"
                    : "",
                },
              )}
              {renderActionControl(
                "create",
                () => ({
                  type: "create",
                  parentId: parentIdForOps,
                  templateIds:
                    selectedNodeIds.length > 0 ? selectedNodeIds : undefined,
                }),
                {
                  onClick: () => {
                    if (!operationAvailability.create.available) {
                      return;
                    }
                    applyOperation({
                      type: "create",
                      parentId: parentIdForOps,
                      templateIds:
                        selectedNodeIds.length > 0 ? selectedNodeIds : undefined,
                    });
                    lockPreviewFor("create");
                  },
                  disabled: !operationAvailability.create.available,
                  title: getOperationTooltip("create"),
                  className: newlyAvailable.has("create")
                    ? "button-newly-available"
                    : "",
                },
              )}
            </div>
          </div>
        )}
      </div>
      {/*
        TODO(bao-preview-copy): Reintroduce the action-feedback text if future UX testing
        shows the overlay description is insufficient.
        <p className="action-feedback">{actionMessage}</p>
      */}
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
