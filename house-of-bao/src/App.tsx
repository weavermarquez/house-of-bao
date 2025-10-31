import { useEffect, useMemo } from "react";
import { useShallow } from "zustand/shallow";
import "./App.css";
import { levels } from "./levels";
import { useGameStore, type GameState } from "./store/gameStore";
import {
  canonicalSignature,
  canonicalSignatureForest,
  type Form,
} from "./logic/Form";

type NodeView = {
  id: string;
  boundary: string;
  signature: string;
  depth: number;
};

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

const selectViewState = (state: GameState) => ({
  level: state.level,
  currentForms: state.currentForms,
  goalForms: state.goalForms,
  status: state.status,
  selectedNodeIds: state.selectedNodeIds,
});

const selectLoadLevel = (state: GameState) => state.loadLevel;
const selectResetLevel = (state: GameState) => state.resetLevel;
const selectApplyOperation = (state: GameState) => state.applyOperation;
const selectToggleSelection = (state: GameState) => state.toggleSelection;
const selectClearSelection = (state: GameState) => state.clearSelection;
const selectUndo = (state: GameState) => state.undo;
const selectRedo = (state: GameState) => state.redo;
const selectHistoryCounts = (state: GameState) => ({
  past: state.history.past.length,
  future: state.history.future.length,
});

function App() {
  const { level, currentForms, goalForms, status, selectedNodeIds } =
    useGameStore(useShallow(selectViewState));
  const loadLevel = useGameStore(selectLoadLevel);
  const resetLevel = useGameStore(selectResetLevel);
  const applyOperation = useGameStore(selectApplyOperation);
  const toggleSelection = useGameStore(selectToggleSelection);
  const clearSelection = useGameStore(selectClearSelection);
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

  const goalSignatures = useMemo(
    () => canonicalSignatureForest(goalForms),
    [goalForms],
  );

  const firstSelected = selectedNodeIds[0];

  return (
    <div className="app">
      <header>
        <h1>House of Bao — Text Sandbox</h1>
        <div className="status">
          <span>Level:</span>
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
          <span className={`badge ${status}`}>{status}</span>
        </div>
        <div className="controls">
          <button onClick={() => undo()} disabled={historyCounts.past === 0}>
            Undo
          </button>
          <button onClick={() => redo()} disabled={historyCounts.future === 0}>
            Redo
          </button>
          <button onClick={() => resetLevel()} disabled={!level}>
            Reset
          </button>
        </div>
      </header>

      <main>
        <section className="panel">
          <h2>Current Form</h2>
          <div className="list">
            {nodeViews.length === 0 ? (
              <p className="empty">void</p>
            ) : (
              nodeViews.map((node) => (
                <button
                  key={node.id}
                  type="button"
                  className={`node ${selectionSet.has(node.id) ? "selected" : ""}`}
                  onClick={() => toggleSelection(node.id)}
                >
                  <span
                    className="depth"
                    style={{ marginLeft: node.depth * 12 }}
                  >
                    {node.boundary}
                  </span>
                  <code className="signature">{node.signature}</code>
                </button>
              ))
            )}
          </div>
        </section>

        <section className="panel">
          <h2>Goal Signature</h2>
          <ul className="goal-list">
            {goalSignatures.length === 0 ? (
              <li>void</li>
            ) : (
              goalSignatures.map((signature) => (
                <li key={signature}>
                  <code>{signature}</code>
                </li>
              ))
            )}
          </ul>

          <div className="actions">
            <h3>Axiom Actions</h3>
            <div className="action-row">
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
                  });
                }}
                disabled={status === "idle"}
              >
                Enfold Frame ([])
              </button>
              <button
                type="button"
                onClick={() => {
                  applyOperation({
                    type: "enfold",
                    targetIds: selectedNodeIds,
                    variant: "mark",
                  });
                }}
                disabled={status === "idle"}
              >
                Enfold Mark ([()])
              </button>
              <button
                type="button"
                onClick={() => {
                  applyOperation({
                    type: "disperse",
                    contentIds: selectedNodeIds,
                  });
                }}
                disabled={selectedNodeIds.length === 0}
              >
                Disperse
              </button>
            </div>
            <div className="action-row">
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
                    parentId: null,
                    templateIds:
                      selectedNodeIds.length > 0 ? selectedNodeIds : undefined,
                  });
                }}
              >
                Create Pair
              </button>
            </div>
            <button
              type="button"
              className="secondary"
              onClick={() => clearSelection()}
              disabled={selectedNodeIds.length === 0}
            >
              Clear Selection
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
