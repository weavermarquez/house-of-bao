import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import type { Form } from "../logic/Form";
import type { AxiomType } from "../levels/types";
import {
  previewOperation,
  useGameStore,
  type GameOperation,
} from "../store/gameStore";
import {
  useAvailableOperations,
  createDisperseOperationForSelection,
  createCancelOperationForSelection,
} from "../hooks/useAvailableOperations";
import type { OperationKey } from "../operations/types";
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

const colors = {
  roundFill: "#fde68a",
  roundStroke: "#b45309",
  squareFill: "#bfdbfe",
  squareStroke: "#1d4ed8",
  angleFill: "#e9d5ff",
  angleStroke: "#7c3aed",
  nodeFill: "#fcd34d",
  nodeStroke: "#a16207",
  accent: "#2563eb",
  neutral: "#94a3b8",
  voidFill: "#f8fafc",
  voidStroke: "#94a3b8",
  atomFill: "#fecdd3",
  atomStroke: "#be123c",
};

type AxiomActionPanelProps = {
  showInversionActions: boolean;
  showArrangementActions: boolean;
  showReflectionActions: boolean;
  showSandboxActions: boolean;
  selectedNodeIds: string[];
  firstSelected?: string;
  parentIdForOps: string | null;
  applyOperation: (operation: GameOperation) => void;
  currentForms: Form[];
  allowedAxioms?: AxiomType[];
  allowedOperations?: OperationKey[];
  onPreviewChange?: (
    payload: {
      forms?: Form[];
      description: string;
      operation: OperationKey;
      note?: string;
    } | null,
  ) => void;
};

export function AxiomActionPanel({
  showInversionActions,
  showArrangementActions,
  showReflectionActions,
  showSandboxActions,
  selectedNodeIds,
  firstSelected,
  parentIdForOps,
  currentForms,
  allowedAxioms,
  allowedOperations,
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
  const [sandboxVariableLabel, setSandboxVariableLabel] = useState("x");
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
      return previewOperation(
        currentForms,
        operation,
        allowedAxioms,
        allowedOperations,
      );
    },
    [currentForms, allowedAxioms, allowedOperations],
  );

  const lockPreviewFor = useCallback(
    (key: OperationKey) => {
      setPreviewLock(key);
      onPreviewChange?.(null);
    },
    [onPreviewChange],
  );

  const createInteractionHandlers = useCallback(
    (key: OperationKey, buildOperation?: () => GameOperation | null) => {
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
      checkAndTriggerTutorial,
      computePreview,
      onPreviewChange,
      operationAvailability,
      previewLock,
      setPreviewLock,
    ],
  );

  const getOperationTooltip = (key: OperationKey) =>
    operationAvailability[key].available
      ? undefined
      : (operationAvailability[key].reason ?? undefined);

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
    options?: {
      append?: ReactNode;
      wrapperClassName?: string;
    },
  ) => {
    const handlers = createInteractionHandlers(key, buildOperation);
    const wrapperClassName = options?.wrapperClassName
      ? `action-button-wrapper ${options.wrapperClassName}`
      : "action-button-wrapper";
    return (
      <div
        className={wrapperClassName}
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
        {options?.append}
      </div>
    );
  };

  const trimmedVariableLabel = sandboxVariableLabel.trim();

  const buildAddVariableOperation = () => {
    if (trimmedVariableLabel.length === 0) {
      return null;
    }
    return {
      type: "addVariable" as const,
      label: trimmedVariableLabel,
      parentId: parentIdForOps ?? null,
    } satisfies GameOperation;
  };

  const handleVariableLabelChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSandboxVariableLabel(event.target.value);
  };

  const handleVariableLabelKeyDown = (
    event: KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Enter") {
      event.preventDefault();
      const operation = buildAddVariableOperation();
      if (!operation) {
        return;
      }
      if (!operationAvailability.addVariable.available) {
        return;
      }
      applyOperation(operation);
      lockPreviewFor("addVariable");
    }
  };

  const buildDisperseOperation = useCallback(() => {
    return createDisperseOperationForSelection(
      currentForms,
      selectedNodeIds,
      parentIdForOps,
    );
  }, [currentForms, selectedNodeIds, parentIdForOps]);

  const buildCancelOperation = useCallback(() => {
    return createCancelOperationForSelection(currentForms, selectedNodeIds);
  }, [currentForms, selectedNodeIds]);

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
                buildDisperseOperation,
                {
                  onClick: () => {
                    if (!operationAvailability.disperse.available) {
                      return;
                    }
                    const operation = buildDisperseOperation();
                    if (!operation) {
                      return;
                    }
                    applyOperation(operation);
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
                buildCancelOperation,
                {
                  onClick: () => {
                    if (!operationAvailability.cancel.available) {
                      return;
                    }
                    const operation = buildCancelOperation();
                    if (!operation) {
                      return;
                    }
                    applyOperation(operation);
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
                        selectedNodeIds.length > 0
                          ? selectedNodeIds
                          : undefined,
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
        {showSandboxActions && (
          <div className="axiom-group">
            <div className="axiom-group-heading">
              <div className="axiom-heading-copy">
                <span>Sandbox</span>
              </div>
              <div className="axiom-group-visual">
                <SandboxGlyph />
              </div>
            </div>
            <div className="axiom-group-actions">
              {renderActionControl(
                "addRound",
                () => ({
                  type: "addBoundary",
                  targetIds: selectedNodeIds,
                  boundary: "round",
                  parentId: parentIdForOps,
                }),
                {
                  onClick: () => {
                    if (!operationAvailability.addRound.available) {
                      return;
                    }
                    applyOperation({
                      type: "addBoundary",
                      targetIds: selectedNodeIds,
                      boundary: "round",
                      parentId: parentIdForOps,
                    });
                    lockPreviewFor("addRound");
                  },
                  disabled: !operationAvailability.addRound.available,
                  title: getOperationTooltip("addRound"),
                  className: newlyAvailable.has("addRound")
                    ? "button-newly-available"
                    : "",
                },
              )}
              {renderActionControl(
                "addSquare",
                () => ({
                  type: "addBoundary",
                  targetIds: selectedNodeIds,
                  boundary: "square",
                  parentId: parentIdForOps,
                }),
                {
                  onClick: () => {
                    if (!operationAvailability.addSquare.available) {
                      return;
                    }
                    applyOperation({
                      type: "addBoundary",
                      targetIds: selectedNodeIds,
                      boundary: "square",
                      parentId: parentIdForOps,
                    });
                    lockPreviewFor("addSquare");
                  },
                  disabled: !operationAvailability.addSquare.available,
                  title: getOperationTooltip("addSquare"),
                  className: newlyAvailable.has("addSquare")
                    ? "button-newly-available"
                    : "",
                },
              )}
              {renderActionControl(
                "addAngle",
                () => ({
                  type: "addBoundary",
                  targetIds: selectedNodeIds,
                  boundary: "angle",
                  parentId: parentIdForOps,
                }),
                {
                  onClick: () => {
                    if (!operationAvailability.addAngle.available) {
                      return;
                    }
                    applyOperation({
                      type: "addBoundary",
                      targetIds: selectedNodeIds,
                      boundary: "angle",
                      parentId: parentIdForOps,
                    });
                    lockPreviewFor("addAngle");
                  },
                  disabled: !operationAvailability.addAngle.available,
                  title: getOperationTooltip("addAngle"),
                  className: newlyAvailable.has("addAngle")
                    ? "button-newly-available"
                    : "",
                },
              )}
              {renderActionControl(
                "addVariable",
                buildAddVariableOperation,
                {
                  onClick: () => {
                    const operation = buildAddVariableOperation();
                    if (!operation) {
                      return;
                    }
                    if (!operationAvailability.addVariable.available) {
                      return;
                    }
                    applyOperation(operation);
                    lockPreviewFor("addVariable");
                  },
                  disabled:
                    !operationAvailability.addVariable.available ||
                    trimmedVariableLabel.length === 0,
                  title:
                    trimmedVariableLabel.length === 0
                      ? "Enter a label to add a variable."
                      : getOperationTooltip("addVariable"),
                  className: newlyAvailable.has("addVariable")
                    ? "button-newly-available"
                    : "",
                },
                {
                  append: (
                    <div className="sandbox-variable-field">
                      <label htmlFor="sandbox-variable-input">
                        Variable label
                      </label>
                      <input
                        id="sandbox-variable-input"
                        type="text"
                        className="sandbox-variable-input"
                        value={sandboxVariableLabel}
                        onChange={handleVariableLabelChange}
                        onKeyDown={handleVariableLabelKeyDown}
                        placeholder="e.g. x"
                      />
                    </div>
                  ),
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
  return (
    <svg width={76} height={40} viewBox="0 0 76 40" aria-hidden>
      <rect
        x={4}
        y={6}
        width={28}
        height={28}
        rx={4}
        fill={colors.squareFill}
        stroke={colors.squareStroke}
        strokeWidth={2}
      />
      <circle
        cx={18}
        cy={20}
        r={9}
        fill={colors.roundFill}
        stroke={colors.roundStroke}
        strokeWidth={2}
      />
      <circle
        cx={52}
        cy={20}
        r={14}
        fill={colors.roundFill}
        stroke={colors.roundStroke}
        strokeWidth={2}
      />
      <rect
        x={44}
        y={12}
        width={16}
        height={16}
        rx={3}
        fill={colors.squareFill}
        stroke={colors.squareStroke}
        strokeWidth={2}
      />
    </svg>
  );
}

function ArrangementGlyph() {
  return (
    <svg width={120} height={42} viewBox="0 0 120 42" aria-hidden>
      <circle
        cx={24}
        cy={21}
        r={18}
        fill={colors.roundFill}
        stroke={colors.roundStroke}
        strokeWidth={2}
      />
      <rect
        x={12}
        y={11}
        width={24}
        height={20}
        rx={4}
        fill={colors.squareFill}
        stroke={colors.squareStroke}
        strokeWidth={1.8}
      />
      <circle
        cx={24}
        cy={16}
        r={3}
        fill={colors.nodeFill}
        stroke={colors.roundStroke}
        strokeWidth={1}
      />
      <circle
        cx={24}
        cy={26}
        r={3}
        fill={colors.nodeFill}
        stroke={colors.roundStroke}
        strokeWidth={1}
      />
      <circle
        cx={70}
        cy={14}
        r={4}
        fill={colors.nodeFill}
        stroke={colors.roundStroke}
        strokeWidth={1}
      />
      <circle
        cx={94}
        cy={14}
        r={4}
        fill={colors.nodeFill}
        stroke={colors.roundStroke}
        strokeWidth={1}
      />
      <circle
        cx={70}
        cy={28}
        r={4}
        fill={colors.nodeFill}
        stroke={colors.roundStroke}
        strokeWidth={1}
      />
      <circle
        cx={94}
        cy={28}
        r={4}
        fill={colors.nodeFill}
        stroke={colors.roundStroke}
        strokeWidth={1}
      />
      <circle
        cx={70}
        cy={21}
        r={13}
        fill={colors.roundFill}
        stroke={colors.roundStroke}
        strokeWidth={1.6}
      />
      <rect
        x={62}
        y={15}
        width={16}
        height={12}
        rx={3}
        fill={colors.squareFill}
        stroke={colors.squareStroke}
        strokeWidth={1.4}
      />
      <circle
        cx={94}
        cy={21}
        r={13}
        fill={colors.roundFill}
        stroke={colors.roundStroke}
        strokeWidth={1.6}
      />
      <rect
        x={86}
        y={15}
        width={16}
        height={12}
        rx={3}
        fill={colors.squareFill}
        stroke={colors.squareStroke}
        strokeWidth={1.4}
      />
    </svg>
  );
}

function ReflectionGlyph() {
  return (
    <svg width={100} height={42} viewBox="0 0 100 42" aria-hidden>
      <circle
        cx={24}
        cy={21}
        r={12}
        fill={colors.roundFill}
        stroke={colors.roundStroke}
        strokeWidth={2}
      />
      <polygon
        points="64,7 90,21 64,35"
        fill={colors.angleFill}
        stroke={colors.angleStroke}
        strokeWidth={2}
      />
      <circle
        cx={76}
        cy={21}
        r={6}
        fill={colors.roundFill}
        stroke={colors.roundStroke}
        strokeWidth={1.4}
      />
    </svg>
  );
}

function SandboxGlyph() {
  return (
    <svg width={100} height={42} viewBox="0 0 100 42" aria-hidden>
      <rect
        x={10}
        y={12}
        width={24}
        height={18}
        rx={4}
        fill={colors.squareFill}
        stroke={colors.squareStroke}
        strokeWidth={2}
      />
      <circle
        cx={22}
        cy={18}
        r={5}
        fill={colors.roundFill}
        stroke={colors.roundStroke}
        strokeWidth={1.4}
      />
      <polygon
        points="58,8 82,21 58,34"
        fill={colors.angleFill}
        stroke={colors.angleStroke}
        strokeWidth={2}
      />
      <circle
        cx={74}
        cy={16}
        r={5}
        fill={colors.roundFill}
        stroke={colors.roundStroke}
        strokeWidth={1.4}
      />
      <rect
        x={68}
        y={22}
        width={12}
        height={10}
        rx={3}
        fill={colors.squareFill}
        stroke={colors.squareStroke}
        strokeWidth={1.4}
      />
    </svg>
  );
}
