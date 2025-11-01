import { useEffect, useMemo } from "react";
import { useShallow } from "zustand/shallow";
import "./App.css";
import { levels } from "./levels";
import { type AxiomType } from "./levels/types";
import { useGameStore, type GameState } from "./store/gameStore";
import { canonicalSignature, type Form } from "./logic/Form";
import { NetworkView, ROOT_NODE_ID } from "./dialects/network";

type NodeView = {
  id: string;
  boundary: string;
  signature: string;
  depth: number;
};

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

function flattenForms(forms: Form[]): NodeView[] {
  const result: NodeView[] = [];
  const stack = forms.map((form) => ({ node: form, depth: 0 }));

  while (stack.length > 0) {
    const current = stack.pop()!;
    result.push({
      id: current.node.id,
      boundary: current.node.boundary,
      signature: canonicalSignature(current.node),
      depth: current.depth,
    });

    const children = [...current.node.children];
    for (let index = children.length - 1; index >= 0; index -= 1) {
      stack.push({ node: children[index], depth: current.depth + 1 });
    }
  }

  return result;
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

function App() {
  const {
    level,
    currentForms,
    goalForms,
    status,
    selectedNodeIds,
    selectedParentId,
  } =
    useGameStore(useShallow(selectViewState));
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

  useEffect(() => {
    if (!level) {
      loadLevel(levels[0]);
    }
  }, [level, loadLevel]);

  const nodeViews = useMemo(() => flattenForms(currentForms), [currentForms]);
  const selectionSet = useMemo(
    () => new Set(selectedNodeIds),
    [selectedNodeIds],
  );
  const allowedAxioms = level?.allowedAxioms;
  const allowsAxiom = useMemo<((type: AxiomType) => boolean)>(() => {
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
    const lookup = new Map(nodeViews.map((node) => [node.id, node]));
    return selectedNodeIds
      .map((id) => lookup.get(id))
      .filter((entry): entry is NodeView => entry !== undefined);
  }, [nodeViews, selectedNodeIds]);

  const parentDetail = useMemo(() => {
    if (!selectedParentId) {
      return null;
    }
    const lookup = new Map(nodeViews.map((node) => [node.id, node]));
    return lookup.get(selectedParentId) ?? null;
  }, [nodeViews, selectedParentId]);

  const firstSelected = selectedNodeIds[0];
  const parentIdForOps =
    selectedParentId === ROOT_NODE_ID ? null : selectedParentId;

  return (
    <div className="app-shell">
      <div className="app-card">
        <header className="app-header">
          <div className="header-copy">
            <h1>House of Bao</h1>
            <p>Network Dialect Sandbox</p>
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
              <button onClick={() => undo()} disabled={historyCounts.past === 0}>
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
            <LegendPanel />
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
                  {selectedDetails.map((node) => (
                    <li key={node.id}>
                      <span className="selection-boundary">{node.boundary}</span>
                      <code>{node.signature}</code>
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
                    <>
                      <span className="selection-boundary">{parentDetail.boundary}</span>
                      <code>{parentDetail.signature}</code>
                    </>
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

            <section className="info-card">
              <h2>Axiom Actions</h2>
              <div className="action-grid">
                {showInversionActions && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        if (firstSelected) {
                          applyOperation({
                            type: "clarify",
                            targetId: firstSelected,
                          });
                        }
                      }}
                      disabled={!firstSelected}
                    >
                      Clarify
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        applyOperation({
                          type: "enfold",
                          targetIds: selectedNodeIds,
                          variant: "frame",
                          parentId: parentIdForOps,
                        });
                      }}
                      disabled={status === "idle"}
                    >
                      Enfold Frame
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        applyOperation({
                          type: "enfold",
                          targetIds: selectedNodeIds,
                          variant: "mark",
                          parentId: parentIdForOps,
                        });
                      }}
                      disabled={status === "idle"}
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
                        applyOperation({
                          type: "disperse",
                          contentIds: selectedNodeIds,
                          frameId: parentIdForOps ?? undefined,
                        });
                      }}
                      disabled={selectedNodeIds.length === 0}
                    >
                      Disperse
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedNodeIds.length >= 2) {
                          applyOperation({
                            type: "collect",
                            targetIds: selectedNodeIds,
                          });
                        }
                      }}
                      disabled={selectedNodeIds.length < 2}
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
                        if (selectedNodeIds.length >= 1) {
                          applyOperation({
                            type: "cancel",
                            targetIds: selectedNodeIds,
                          });
                        }
                      }}
                      disabled={selectedNodeIds.length === 0}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        applyOperation({
                          type: "create",
                          parentId: parentIdForOps,
                          templateIds:
                            selectedNodeIds.length > 0
                              ? selectedNodeIds
                              : undefined,
                        });
                      }}
                    >
                      Create Pair
                    </button>
                  </>
                )}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default App;
