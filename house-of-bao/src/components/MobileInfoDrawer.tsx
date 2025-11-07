import { NetworkView, ROOT_NODE_ID } from "../dialects/network";
import type { Form } from "../logic/Form";
import type { GameState } from "../store/gameStore";
import { FormPreview } from "./FormPreview";

type SelectionDetail = {
  form: Form;
  signature: string;
};

type MobileInfoDrawerProps = {
  status: GameState["status"];
  goalForms: Form[];
  selectedNodeIds: string[];
  selectedDetails: SelectionDetail[];
  onClearSelection: () => void;
  parentDetail: Form | null;
  selectedParentId: string | null;
  onClearParent: () => void;
};

export function MobileInfoDrawer({
  status,
  goalForms,
  selectedNodeIds,
  selectedDetails,
  onClearSelection,
  parentDetail,
  selectedParentId,
  onClearParent,
}: MobileInfoDrawerProps) {
  return (
    <div className="mobile-info-drawer">
      <section className="info-card">
        <div className="section-heading">
          <h2>Goal State</h2>
          <span
            className={`goal-status ${status === "won" ? "goal-status-complete" : ""}`}
          >
            {status === "won" ? "Complete" : "In Progress"}
          </span>
        </div>
        <div className="goal-preview">
          <NetworkView forms={goalForms} className="goal-network-container" />
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
          onClick={onClearSelection}
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
            onClick={onClearParent}
            disabled={!selectedParentId}
          >
            Clear Parent
          </button>
        </div>
      </section>
    </div>
  );
}
