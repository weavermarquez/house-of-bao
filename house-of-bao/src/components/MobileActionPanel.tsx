import { AxiomActionPanel } from "./AxiomActionPanel";
import type { GameState } from "../store/gameStore";

type MobileActionPanelProps = {
  showInversionActions: boolean;
  showArrangementActions: boolean;
  showReflectionActions: boolean;
  selectedNodeIds: string[];
  firstSelected?: string;
  parentIdForOps: string | null;
  applyOperation: GameState["applyOperation"];
};

export function MobileActionPanel({
  showInversionActions,
  showArrangementActions,
  showReflectionActions,
  selectedNodeIds,
  firstSelected,
  parentIdForOps,
  applyOperation,
}: MobileActionPanelProps) {
  return (
    <div className="mobile-action-panel">
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
  );
}
