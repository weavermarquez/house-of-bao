import { useEffect, useMemo, useState } from "react";
import { useShallow } from "zustand/shallow";
import "./App.css";
import { levels } from "./levels";
import { type AxiomType } from "./levels/types";
import { useGameStore, type GameState } from "./store/gameStore";
import { canonicalSignature, type Form } from "./logic/Form";
import { NetworkView, ROOT_NODE_ID } from "./dialects/network";
import { AxiomActionPanel } from "./components/AxiomActionPanel";
import { FormPreview } from "./components/FormPreview";
import { Footer } from "./components/Footer";

type LegendShape = "round" | "square" | "angle";

type LegendItem = {
  shape: LegendShape;
  color: string;
  title: string;
  description: string;
};

type ActivePanel = "actions" | "selection" | "goal";

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

function LegendPanel({ onDismiss }: { onDismiss?: () => void }) {
  return (
    <div className="legend-panel">
      <div className="legend-header">
        <span className="legend-title">Legend</span>
        {onDismiss ? (
          <button type="button" className="legend-close" onClick={onDismiss}>
            Close
          </button>
        ) : null}
      </div>
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

function App() {
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
  const undo = useGameStore(selectUndo);
  const redo = useGameStore(selectRedo);
  const historyCounts = useGameStore(useShallow(selectHistoryCounts));
  const [activePanel, setActivePanel] = useState<ActivePanel>("actions");
  const [legendOpen, setLegendOpen] = useState(false);

  useEffect(() => {
    if (!level) {
      loadLevel(levels[0]);
    }
  }, [level, loadLevel]);

  useEffect(() => {
    if (!legendOpen) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setLegendOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [legendOpen]);

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

  const statusLabel =
    status === "won"
      ? "Goal complete"
      : status === "playing"
      ? "In progress"
      : "Ready";
  const levelSummary = level
    ? `${level.id} · ${level.name}`
    : "Select a level to get started";
  const selectionTabLabel =
    selectionCount === 0
      ? "Selection"
      : `Selection (${selectionCount})`;
  const goalTabLabel = status === "won" ? "Goal ✓" : "Goal";

  const tabs: Array<{
    value: ActivePanel;
    label: string;
    tabId: string;
    panelId: string;
  }> = [
    { value: "actions", label: "Actions", tabId: "tab-actions", panelId: "panel-actions" },
    {
      value: "selection",
      label: selectionTabLabel,
      tabId: "tab-selection",
      panelId: "panel-selection",
    },
    { value: "goal", label: goalTabLabel, tabId: "tab-goal", panelId: "panel-goal" },
  ];

  return (
    <div className="app-shell">
      <div className="app-card">
        <header className="app-header">
          <div className="header-identity">
            <div className="header-title">
              <h1>House of Bao</h1>
              <p>Network Dialect Sandbox</p>
            </div>
            <span className={`status-pill ${status}`}>{statusLabel}</span>
          </div>
          <p className="level-summary">{levelSummary}</p>
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
                  setActivePanel("actions");
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
        </header>

        <main className="app-main">
          <section className="play-stage">
            <div className="stage-header">
              <span className="stage-label">Working canvas</span>
              <button
                type="button"
                className="legend-trigger"
                onClick={() => setLegendOpen(true)}
              >
                Legend
              </button>
            </div>
            <div className="graph-panel">
              <NetworkView
                forms={currentForms}
                selectedIds={selectionSet}
                selectedParentId={selectedParentId}
                className="network-view-container"
                onToggleNode={(id) => toggleSelection(id)}
                onSelectParent={(id) => {
                  if (
                    selectedParentId === id ||
                    (selectedParentId === null && id === null) ||
                    (selectedParentId === ROOT_NODE_ID && id === null)
                  ) {
                    clearParentSelection();
                  } else {
                    selectParent(id ?? ROOT_NODE_ID);
                  }
                }}
                onBackgroundClick={() => {
                  clearSelection();
                  clearParentSelection();
                }}
              />
            </div>
          </section>

          <section className="panel-stack">
            <nav className="panel-tabs" role="tablist" aria-label="Gameplay panels">
              {tabs.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  role="tab"
                  id={tab.tabId}
                  aria-controls={tab.panelId}
                  aria-selected={activePanel === tab.value}
                  tabIndex={activePanel === tab.value ? 0 : -1}
                  className={`panel-tab ${activePanel === tab.value ? "active" : ""}`}
                  onClick={() => setActivePanel(tab.value)}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
            <div className="panel-body">
              <div
                id="panel-actions"
                role="tabpanel"
                aria-labelledby="tab-actions"
                hidden={activePanel !== "actions"}
              >
                <AxiomActionPanel
                  showInversionActions={showInversionActions}
                  showArrangementActions={showArrangementActions}
                  showReflectionActions={showReflectionActions}
                  selectedNodeIds={selectedNodeIds}
                  firstSelected={firstSelected}
                  parentIdForOps={parentIdForOps}
                  applyOperation={applyOperation}
                />
              </div>
              <div
                id="panel-selection"
                role="tabpanel"
                aria-labelledby="tab-selection"
                hidden={activePanel !== "selection"}
              >
                <section className="info-card selection-panel">
                  <div className="section-heading">
                    <h2>Selection</h2>
                    <span className="selection-count">
                      {selectionCount} node{selectionCount === 1 ? "" : "s"}
                    </span>
                  </div>
                  {selectedDetails.length === 0 ? (
                    <p className="empty-note">Tap a node to select it.</p>
                  ) : (
                    <ul className="selection-list">
                      {selectedDetails.map(({ form, signature }) => (
                        <li key={form.id}>
                          <FormPreview form={form} />
                          <code>{signature}</code>
                        </li>
                      ))}
                    </ul>
                  )}
                  <button
                    type="button"
                    className="ghost"
                    onClick={() => clearSelection()}
                    disabled={selectionCount === 0}
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
              </div>
              <div
                id="panel-goal"
                role="tabpanel"
                aria-labelledby="tab-goal"
                hidden={activePanel !== "goal"}
              >
                <section className="info-card goal-panel">
                  <div className="section-heading">
                    <h2>Goal State</h2>
                    <span
                      className={`goal-status ${
                        status === "won" ? "goal-status-complete" : ""
                      }`}
                    >
                      {status === "won" ? "Complete" : "In progress"}
                    </span>
                  </div>
                  <p className="panel-note">Match this layout to clear the level.</p>
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
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
      {legendOpen ? (
        <div
          className="legend-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="Legend"
          onClick={() => setLegendOpen(false)}
        >
          <div
            className="legend-sheet"
            onClick={(event) => {
              event.stopPropagation();
            }}
          >
            <LegendPanel onDismiss={() => setLegendOpen(false)} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default App;
