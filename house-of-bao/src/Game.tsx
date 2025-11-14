import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useShallow } from "zustand/shallow";
import "./Game.css";
import { levels } from "./levels";
import { formatFormsAsJson } from "./levels/serializer";
import { type AxiomType } from "./levels/types";
import { useGameStore, type GameState } from "./store/gameStore";
import { canonicalSignature, type Form } from "./logic/Form";
import { NetworkView, ROOT_NODE_ID } from "./dialects/network";
import { AxiomActionPanel } from "./components/AxiomActionPanel";
import { FormPreview } from "./components/FormPreview";
import { Footer } from "./components/Footer";
import { TutorialOverlay } from "./components/TutorialOverlay";
import type { OperationKey } from "./operations/types";
import { ACTION_METADATA } from "./components/ActionGlyphs";

type LegendShape = "round" | "square" | "angle";

type LegendItem = {
  shape: LegendShape;
  color: string;
  title: string;
  description: string;
};

const LEGEND_ITEMS: LegendItem[] = [
  {
    shape: "round",
    color: "#fde68a",
    title: "Round boundary",
    description: "Quantity / iteration context",
  },
  {
    shape: "square",
    color: "#bfdbfe",
    title: "Square boundary",
    description: "Collection / grouping context",
  },
  {
    shape: "angle",
    color: "#e9d5ff",
    title: "Angle boundary",
    description: "Reflection / inversion context",
  },
];

function indexForms(forms: Form[]): Map<string, Form> {
  const map = new Map<string, Form>();
  const stack = [...forms];
  while (stack.length > 0) {
    const node = stack.pop()!;
    map.set(node.id, node);
    node.children.forEach((child) => stack.push(child));
  }
  return map;
}

function LegendIcon({ shape, color }: { shape: LegendShape; color: string }) {
  switch (shape) {
    case "square":
      return (
        <svg width={20} height={20} className="legend-icon">
          <rect x={4} y={4} width={12} height={12} rx={2} ry={2} fill={color} />
        </svg>
      );
    case "angle":
      return (
        <svg width={20} height={20} className="legend-icon">
          <polygon points="10,2 18,10 10,18 2,10" fill={color} />
        </svg>
      );
    case "round":
    default:
      return (
        <svg width={20} height={20} className="legend-icon">
          <circle cx={10} cy={10} r={8} fill={color} />
        </svg>
      );
  }
}

function LegendPanel() {
  return (
    <div className="legend-panel">
      <span className="legend-title">Legend</span>
      <div className="legend-grid">
        {LEGEND_ITEMS.map((item) => (
          <div key={item.title} className="legend-item">
            <LegendIcon shape={item.shape} color={item.color} />
            <div className="legend-text">
              <span className="legend-label">{item.title}</span>
              <span className="legend-description">{item.description}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const selectViewState = (state: GameState) => ({
  level: state.level,
  currentForms: state.currentForms,
  goalForms: state.goalForms,
  status: state.status,
  selectedNodeIds: state.selectedNodeIds,
  selectedParentId: state.selectedParentId,
});

const selectLoadLevel = (state: GameState) => state.loadLevel;
const selectResetLevel = (state: GameState) => state.resetLevel;
const selectApplyOperation = (state: GameState) => state.applyOperation;
const selectToggleSelection = (state: GameState) => state.toggleSelection;
const selectClearSelection = (state: GameState) => state.clearSelection;
const selectParentSelection = (state: GameState) => state.selectParent;
const selectClearParentSelection = (state: GameState) =>
  state.clearParentSelection;
const selectUndo = (state: GameState) => state.undo;
const selectRedo = (state: GameState) => state.redo;
const selectHistoryCounts = (state: GameState) => ({
  past: state.history.past.length,
  future: state.history.future.length,
});

export function Game() {
  const {
    level,
    currentForms,
    goalForms,
    status,
    selectedNodeIds,
    selectedParentId,
  } = useGameStore(useShallow(selectViewState));
  const loadLevel = useGameStore(selectLoadLevel);
  const resetLevel = useGameStore(selectResetLevel);
  const applyOperation = useGameStore(selectApplyOperation);
  const toggleSelection = useGameStore(selectToggleSelection);
  const clearSelection = useGameStore(selectClearSelection);
  const selectParent = useGameStore(selectParentSelection);
  const clearParentSelection = useGameStore(selectClearParentSelection);
  const sandboxEnabled = useGameStore((state) => state.sandboxEnabled);
  const setSandboxEnabled = useGameStore((state) => state.setSandboxEnabled);
  const undo = useGameStore(selectUndo);
  const redo = useGameStore(selectRedo);
  const checkAndTriggerTutorial = useGameStore(
    (state) => state.checkAndTriggerTutorial,
  );
  const historyCounts = useGameStore(useShallow(selectHistoryCounts));
  const [previewState, setPreviewState] = useState<{
    forms?: Form[];
    description: string;
    operation: OperationKey;
    note?: string;
  } | null>(null);
  const previewTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!level) {
      loadLevel(levels[0]);
    }
  }, [level, loadLevel]);

  const formIndex = useMemo(() => indexForms(currentForms), [currentForms]);
  const selectionSet = useMemo(
    () => new Set(selectedNodeIds),
    [selectedNodeIds],
  );
  const allowedAxioms = level?.allowedAxioms;
  const allowsAxiom = useMemo<(type: AxiomType) => boolean>(() => {
    if (!allowedAxioms || allowedAxioms.length === 0) {
      return () => true;
    }
    const allowedSet = new Set(allowedAxioms);
    return (type) => allowedSet.has(type);
  }, [allowedAxioms]);
  const showInversionActions = allowsAxiom("inversion");
  const showArrangementActions = allowsAxiom("arrangement");
  const showReflectionActions = allowsAxiom("reflection");

  const selectedDetails = useMemo(() => {
    return selectedNodeIds
      .map((id) => formIndex.get(id))
      .filter((form): form is Form => form !== undefined)
      .map((form) => ({ form, signature: canonicalSignature(form) }));
  }, [formIndex, selectedNodeIds]);

  const parentDetail = useMemo(() => {
    if (!selectedParentId || selectedParentId === ROOT_NODE_ID) {
      return null;
    }
    return formIndex.get(selectedParentId) ?? null;
  }, [formIndex, selectedParentId]);

  const firstSelected = selectedNodeIds[0];
  const parentIdForOps =
    selectedParentId === ROOT_NODE_ID ? null : selectedParentId;
  const selectionCount = selectedNodeIds.length;

  const handleToggleNode = useCallback(
    (id: string) => {
      const wasEmpty = selectionCount === 0;
      toggleSelection(id);
      if (wasEmpty) {
        checkAndTriggerTutorial("first_selection");
      }
    },
    [selectionCount, toggleSelection, checkAndTriggerTutorial],
  );

  const handlePreviewChange = useCallback(
    (
      next: {
        forms?: Form[];
        description: string;
        operation: OperationKey;
        note?: string;
      } | null,
    ) => {
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
        previewTimeoutRef.current = null;
      }
      if (next) {
        setPreviewState(next);
        return;
      }
      previewTimeoutRef.current = window.setTimeout(() => {
        setPreviewState(null);
        previewTimeoutRef.current = null;
      }, 200);
    },
    [],
  );

  useEffect(
    () => () => {
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
      }
    },
    [],
  );

  const activeForms = previewState?.forms ?? currentForms;
  const isPreviewing = Boolean(previewState?.forms);
  const previewMetadata = previewState
    ? ACTION_METADATA[previewState.operation]
    : null;
  const PreviewGlyph = previewMetadata?.Glyph;
  const currentFormsJson = useMemo(
    () => formatFormsAsJson(currentForms),
    [currentForms],
  );
  const goalFormsJson = useMemo(
    () => formatFormsAsJson(goalForms),
    [goalForms],
  );

  return (
    <div className="app-shell">
      <div className="app-card">
        <header className="app-header">
          <div className="header-copy">
            <h1>House of Bao</h1>
          </div>
          <div className="header-controls">
            <label className="level-select">
              <span>Level</span>
              <select
                value={level?.id ?? levels[0].id}
                onChange={(event) => {
                  const next = levels.find(
                    (entry) => entry.id === event.target.value,
                  );
                  if (next) {
                    loadLevel(next);
                  }
                }}
              >
                {levels.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.id}: {entry.name}
                  </option>
                ))}
              </select>
            </label>
            <span className={`status-pill ${status}`}>{status}</span>
            <div className="history-controls">
              <button
                onClick={() => undo()}
                disabled={historyCounts.past === 0}
              >
                Undo
              </button>
              <button
                onClick={() => redo()}
                disabled={historyCounts.future === 0}
              >
                Redo
              </button>
              <button onClick={() => resetLevel()} disabled={!level}>
                Reset
              </button>
            </div>
          </div>
        </header>

        <div className="app-main">
          <aside className="axiom-sidebar">
            <AxiomActionPanel
              showInversionActions={showInversionActions}
              showArrangementActions={showArrangementActions}
              showReflectionActions={showReflectionActions}
              showSandboxActions={sandboxEnabled}
              selectedNodeIds={selectedNodeIds}
              firstSelected={firstSelected}
              parentIdForOps={parentIdForOps}
              currentForms={currentForms}
              allowedAxioms={allowedAxioms}
              allowedOperations={level?.allowedOperations}
              applyOperation={applyOperation}
              onPreviewChange={handlePreviewChange}
            />
          </aside>
          <div className="play-column">
            <div
              className={`graph-panel ${isPreviewing ? "is-previewing" : ""}`}
            >
              <NetworkView
                forms={activeForms}
                selectedIds={selectionSet}
                selectedParentId={selectedParentId}
                className="network-view-container"
                onToggleNode={isPreviewing ? undefined : handleToggleNode}
                onSelectParent={
                  isPreviewing
                    ? undefined
                    : (id) => {
                        if (
                          selectedParentId === id ||
                          (selectedParentId === null && id === null) ||
                          (selectedParentId === ROOT_NODE_ID && id === null)
                        ) {
                          clearParentSelection();
                        } else {
                          selectParent(id ?? ROOT_NODE_ID);
                        }
                      }
                }
                onBackgroundClick={
                  isPreviewing
                    ? undefined
                    : () => {
                        clearSelection();
                        clearParentSelection();
                      }
                }
              />
              {previewState ? (
                <div className="graph-preview-overlay">
                  {previewMetadata && PreviewGlyph ? (
                    <div className="preview-label">
                      <PreviewGlyph className="preview-glyph" />
                      <div className="preview-copy">
                        <span className="preview-operation-label">
                          Preview • {previewMetadata.label}
                        </span>
                        <span className="preview-description">
                          {previewState.description}
                        </span>
                        {previewState.note ? (
                          <span className="preview-note">
                            {previewState.note}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  ) : (
                    <div className="preview-label">
                      <div className="preview-copy">
                        <span className="preview-operation-label">Preview</span>
                        <span className="preview-description">
                          {previewState.description}
                        </span>
                        {previewState.note ? (
                          <span className="preview-note">
                            {previewState.note}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
          <aside className="side-panel">
            <section className="info-card">
              <div className="section-heading">
                <h2>Goal State</h2>
                <span
                  className={`goal-status ${
                    status === "won" ? "goal-status-complete" : ""
                  }`}
                >
                  {status === "won" ? "Complete" : "In Progress"}
                </span>
              </div>
              <div className="goal-preview">
                <NetworkView
                  forms={goalForms}
                  className="goal-network-container"
                />
              </div>
              {status === "won" ? (
                <p className="goal-complete">Goal satisfied — nice work!</p>
              ) : null}
            </section>
            <section className="info-card sandbox-card">
              <div className="section-heading">
                <h2>Sandbox Mode</h2>
              </div>
              <label className="sandbox-toggle">
                <input
                  type="checkbox"
                  checked={sandboxEnabled}
                  onChange={(event) => setSandboxEnabled(event.target.checked)}
                />
                <span>Enable sandbox actions</span>
              </label>
              <p className="sandbox-copy">
                Add standalone boundaries and export the forest for raw level
                definitions.
              </p>
              {sandboxEnabled ? (
                <div className="sandbox-export">
                  <label className="sandbox-export-label" htmlFor="sandbox-current">
                    Current forms (use for `start`)
                  </label>
                  <textarea
                    id="sandbox-current"
                    className="sandbox-export-textarea"
                    value={currentFormsJson}
                    readOnly
                  />
                  <label className="sandbox-export-label" htmlFor="sandbox-goal">
                    Goal forms
                  </label>
                  <textarea
                    id="sandbox-goal"
                    className="sandbox-export-textarea"
                    value={goalFormsJson}
                    readOnly
                  />
                </div>
              ) : null}
            </section>

            <section className="info-card">
              <div className="section-heading">
                <h2>Selection</h2>
                <span className="selection-count">
                  {selectedNodeIds.length} node
                  {selectedNodeIds.length === 1 ? "" : "s"}
                </span>
              </div>
              {selectedDetails.length === 0 ? (
                <p className="empty-note">Tap a node to select it</p>
              ) : (
                <ul className="selection-list">
                  {selectedDetails.map(({ form }) => (
                    <li key={form.id}>
                      <FormPreview form={form} />
                    </li>
                  ))}
                </ul>
              )}
              <button
                type="button"
                className="ghost"
                onClick={() => clearSelection()}
                disabled={selectedNodeIds.length === 0}
              >
                Clear Selection
              </button>
              <div className="parent-summary">
                <span className="parent-label">Parent</span>
                <div className="parent-value">
                  {selectedParentId === null ? (
                    <span className="parent-root">root (default)</span>
                  ) : selectedParentId === ROOT_NODE_ID ? (
                    <span className="parent-root">root (forest)</span>
                  ) : parentDetail ? (
                    <FormPreview form={parentDetail} highlight />
                  ) : (
                    <span className="parent-none">none</span>
                  )}
                </div>
                <button
                  type="button"
                  className="ghost"
                  onClick={() => clearParentSelection()}
                  disabled={!selectedParentId}
                >
                  Clear Parent
                </button>
              </div>
            </section>
            <section className="info-card legend-card">
              <LegendPanel />
            </section>
          </aside>
        </div>

        <Footer />
      </div>
      <TutorialOverlay />
    </div>
  );
}

