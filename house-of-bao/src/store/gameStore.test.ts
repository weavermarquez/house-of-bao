import { beforeEach, describe, expect, it } from "vitest";
import { useGameStore } from "./gameStore";
import { createForm, round, square } from "../logic";
import { canonicalSignatureForest } from "../logic/Form";
import { type LevelDefinition } from "../levels/types";

function loadTestLevel(level: LevelDefinition): void {
  const { loadLevel } = useGameStore.getState();
  loadLevel(level);
}

function resetStore(): void {
  useGameStore.setState({
    level: null,
    currentForms: [],
    goalForms: [],
    status: "idle",
    selectedNodeIds: [],
    history: { past: [], future: [] },
  });
}

describe("game store operations", () => {
  beforeEach(() => {
    resetStore();
  });

  it("enfold wraps zero selection to create a void pair", () => {
    const level: LevelDefinition = {
      id: "test-void-enfold",
      name: "Void Enfold",
      start: [],
      goal: [],
      difficulty: 1,
    };
    loadTestLevel(level);

    const { applyOperation } = useGameStore.getState();
    applyOperation({ type: "enfold", targetIds: [], variant: "frame" });

    const { currentForms } = useGameStore.getState();
    expect(currentForms).toHaveLength(1);
    const signatures = canonicalSignatureForest(currentForms);
    expect(signatures[0]).toBe("round:[square:[]]");
  });

  it("enfold wraps multiple root siblings under a new pair", () => {
    const start = [round(), square()];
    const level: LevelDefinition = {
      id: "test-multi-enfold",
      name: "Multi Enfold",
      start,
      goal: [],
      difficulty: 1,
    };

    loadTestLevel(level);

    const { currentForms, applyOperation } = useGameStore.getState();
    const targetIds = currentForms.map((form) => form.id);

    applyOperation({ type: "enfold", targetIds, variant: "frame" });

    const after = useGameStore.getState().currentForms;
    expect(after).toHaveLength(1);
    const wrapper = after[0];
    expect(wrapper.boundary).toBe("round");
    const innerSquare = [...wrapper.children][0];
    expect(innerSquare.boundary).toBe("square");
    expect(innerSquare.children.size).toBe(2);
  });

  it("disperse splits selection of square contents", () => {
    const unitA = createForm("round");
    const unitB = createForm("round");
    const squareNode = createForm("square", unitA, unitB);
    const frame = createForm("round", squareNode);

    const level: LevelDefinition = {
      id: "test-disperse",
      name: "Disperse Selection",
      start: [frame],
      goal: [],
      difficulty: 1,
      allowedAxioms: ["arrangement"],
    };

    loadTestLevel(level);

    const store = useGameStore.getState();
    const frameNode = store.currentForms[0];
    const frameSquare = [...frameNode.children][0];
    const contentIds = [...frameSquare.children].map((child) => child.id);

    store.applyOperation({
      type: "disperse",
      selectionIds: contentIds,
    });

    const { currentForms: dispersed } = useGameStore.getState();
    expect(dispersed).toHaveLength(2);
    const signatures = canonicalSignatureForest(dispersed);
    signatures.forEach((signature) => {
      expect(signature).toBe("round:[square:[round:[]]]");
    });
  });
});
