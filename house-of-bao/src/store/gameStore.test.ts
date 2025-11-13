import { beforeEach, describe, expect, it } from "vitest";
import { useGameStore } from "./gameStore";
import { round, square, angle, atom } from "../logic";
import { canonicalSignatureForest, canonicalSignature, deepClone } from "../logic/Form";
import { clarify } from "../logic/inversion";
import { collect as arrangementCollect } from "../logic/arrangement";
import {
  cancel as reflectionCancel,
  create as reflectionCreate,
} from "../logic/reflection";
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
    sandboxEnabled: false,
  });
  useGameStore.persist?.clearStorage?.();
}

describe("game store operations", () => {
  beforeEach(() => {
    if (typeof localStorage !== "undefined" && typeof localStorage.clear === "function") {
      localStorage.clear();
    }
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

  it("enfold inserts empty wrapper under a selected parent", () => {
    const parent = round();
    const level: LevelDefinition = {
      id: "test-parent-enfold",
      name: "Parent Enfold",
      start: [parent],
      goal: [],
      difficulty: 1,
    };

    loadTestLevel(level);

    const { currentForms, applyOperation } = useGameStore.getState();
    const parentId = currentForms[0].id;

    applyOperation({
      type: "enfold",
      targetIds: [],
      parentId,
      variant: "mark",
    });

    const updated = useGameStore.getState().currentForms[0];
    const children = [...updated.children];
    expect(children).toHaveLength(1);
    const wrapper = children[0];
    expect(wrapper.boundary).toBe("square");
    const inner = [...wrapper.children][0];
    expect(inner.boundary).toBe("round");
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

  it("addBoundary inserts an empty round at the root when sandbox is enabled", () => {
    const level: LevelDefinition = {
      id: "test-add-root",
      name: "Add Root Node",
      start: [],
      goal: [],
      difficulty: 1,
    };

    loadTestLevel(level);
    const store = useGameStore.getState();
    store.setSandboxEnabled(true);

    store.applyOperation({
      type: "addBoundary",
      targetIds: [],
      boundary: "round",
      parentId: null,
    });

    const { currentForms } = useGameStore.getState();
    expect(canonicalSignatureForest(currentForms)).toEqual(["round:[]"]);
  });

  it("addBoundary wraps selected siblings with a new boundary", () => {
    const start = [round(), square()];
    const level: LevelDefinition = {
      id: "test-add-wrap",
      name: "Add Wrap",
      start,
      goal: [],
      difficulty: 1,
    };

    loadTestLevel(level);
    const store = useGameStore.getState();
    const first = store.currentForms[0];
    const second = store.currentForms[1];
    store.setSandboxEnabled(true);

    store.applyOperation({
      type: "addBoundary",
      targetIds: [first.id, second.id],
      boundary: "square",
    });

    const after = useGameStore.getState().currentForms;
    expect(after).toHaveLength(1);
    expect(canonicalSignatureForest(after)).toEqual([
      "square:[round:[],square:[]]",
    ]);
  });

  it("addBoundary respects the selected parent when inserting new nodes", () => {
    const parent = round();
    const level: LevelDefinition = {
      id: "test-add-parent",
      name: "Add Parent Node",
      start: [parent],
      goal: [],
      difficulty: 1,
    };

    loadTestLevel(level);
    const store = useGameStore.getState();
    const parentId = store.currentForms[0].id;
    store.setSandboxEnabled(true);

    store.applyOperation({
      type: "addBoundary",
      targetIds: [],
      boundary: "angle",
      parentId,
    });

    const updatedParent = useGameStore.getState().currentForms[0];
    const childSignatures = canonicalSignatureForest(updatedParent.children);
    expect(childSignatures).toContain("angle:[]");
  });

  it("ignores addBoundary requests while sandbox mode is disabled", () => {
    const level: LevelDefinition = {
      id: "test-add-disabled",
      name: "Add Disabled",
      start: [],
      goal: [],
      difficulty: 1,
    };

    loadTestLevel(level);
    const before = useGameStore.getState().currentForms;

    useGameStore
      .getState()
      .applyOperation({ type: "addBoundary", targetIds: [], boundary: "round" });

    const after = useGameStore.getState().currentForms;
    expect(canonicalSignatureForest(after)).toEqual(
      canonicalSignatureForest(before),
    );
  });

  it("addVariable inserts a labeled atom at the root when sandbox is enabled", () => {
    const level: LevelDefinition = {
      id: "test-var-root",
      name: "Add Variable Root",
      start: [],
      goal: [],
      difficulty: 1,
    };

    loadTestLevel(level);
    const store = useGameStore.getState();
    store.setSandboxEnabled(true);

    store.applyOperation({ type: "addVariable", label: "foo" });

    const added = useGameStore.getState().currentForms;
    expect(added).toHaveLength(1);
    const [variable] = added;
    expect(variable.boundary).toBe("atom");
    expect(variable.label).toBe("foo");
  });

  it("addVariable inserts into the selected parent when provided", () => {
    const container = round();
    const level: LevelDefinition = {
      id: "test-var-parent",
      name: "Add Variable Parent",
      start: [container],
      goal: [],
      difficulty: 1,
    };

    loadTestLevel(level);
    const store = useGameStore.getState();
    const parentId = store.currentForms[0].id;
    store.setSandboxEnabled(true);

    store.applyOperation({ type: "addVariable", label: "bar", parentId });

    const updatedParent = useGameStore.getState().currentForms[0];
    const childAtoms = [...updatedParent.children].filter(
      (child) => child.boundary === "atom",
    );
    expect(childAtoms).toHaveLength(1);
    expect(childAtoms[0]?.label).toBe("bar");
  });

  it("trims variable labels before insertion", () => {
    const level: LevelDefinition = {
      id: "test-var-trim",
      name: "Trim Variable Label",
      start: [],
      goal: [],
      difficulty: 1,
    };

    loadTestLevel(level);
    const store = useGameStore.getState();
    store.setSandboxEnabled(true);

    store.applyOperation({ type: "addVariable", label: "  Zap  " });

    const [variable] = useGameStore.getState().currentForms;
    expect(variable?.label).toBe("Zap");
  });

  it("ignores addVariable requests while sandbox mode is disabled", () => {
    const level: LevelDefinition = {
      id: "test-var-disabled",
      name: "Add Variable Disabled",
      start: [],
      goal: [],
      difficulty: 1,
    };

    loadTestLevel(level);
    const before = useGameStore.getState().currentForms;

    useGameStore.getState().applyOperation({ type: "addVariable", label: "q" });

    const after = useGameStore.getState().currentForms;
    expect(canonicalSignatureForest(after)).toEqual(
      canonicalSignatureForest(before),
    );
  });

  it("disperse splits selection of square contents", () => {
    const frame = round(square(round(), round()));

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
      contentIds,
    });

    const { currentForms: dispersed } = useGameStore.getState();
    expect(dispersed).toHaveLength(2);
    const signatures = canonicalSignatureForest(dispersed);
    signatures.forEach((signature) => {
      expect(signature).toBe("round:[square:[round:[]]]");
    });
  });

  it("disperse accepts square selection to disperse all contents", () => {
    const frame = round(square(round(), round()));

    const level: LevelDefinition = {
      id: "test-disperse-square",
      name: "Disperse Square Selection",
      start: [frame],
      goal: [],
      difficulty: 1,
      allowedAxioms: ["arrangement"],
    };

    loadTestLevel(level);

    const store = useGameStore.getState();
    const frameNode = store.currentForms[0];
    const squareNode = [...frameNode.children][0];
    const contentIds = [...squareNode.children].map((child) => child.id);

    store.applyOperation({
      type: "disperse",
      contentIds,
      squareId: squareNode.id,
      frameId: frameNode.id,
    });

    const { currentForms: dispersed } = useGameStore.getState();
    expect(dispersed).toHaveLength(2);
    const signatures = canonicalSignatureForest(dispersed);
    signatures.forEach((signature) => {
      expect(signature).toBe("round:[square:[round:[]]]");
    });
  });

  it("disperse distributes content from specified square in frame", () => {
    const frame = round(
      square(atom("a"), atom("b")),
      square(atom("c"), atom("d")),
      atom("e"),
    );

    const level: LevelDefinition = {
      id: "test-disperse-frame",
      name: "Disperse Frame",
      start: [frame],
      goal: [],
      difficulty: 1,
      allowedAxioms: ["arrangement"],
    };

    loadTestLevel(level);

    const store = useGameStore.getState();
    const frameNode = store.currentForms[0];
    const frameSquareAB = [...frameNode.children].find(
      (child) =>
        child.boundary === "square" && [...child.children].length === 2,
    );
    expect(frameSquareAB).toBeDefined();
    const contentIds = [...frameSquareAB!.children].map((child) => child.id);

    store.applyOperation({
      type: "disperse",
      contentIds,
      squareId: frameSquareAB!.id,
      frameId: frameNode.id,
    });

    const { currentForms: dispersed } = useGameStore.getState();
    expect(dispersed).toHaveLength(2);
    dispersed.forEach((form) => {
      expect(form.boundary).toBe("round");
      const children = [...form.children];
      expect(children).toHaveLength(3);
      const squares = children.filter((c) => c.boundary === "square");
      expect(squares).toHaveLength(2);
      const atoms = children.filter((c) => c.boundary === "atom");
      expect(atoms).toHaveLength(1);
      const singleSquares = squares.filter((s) => [...s.children].length === 1);
      expect(singleSquares).toHaveLength(1);
      const doubleSquares = squares.filter((s) => [...s.children].length === 2);
      expect(doubleSquares).toHaveLength(1);
    });
  });

  it("clarify matches inversion behaviour for a round-square pair", () => {
    const startForm = round(square(atom("x")));
    const level: LevelDefinition = {
      id: "test-clarify-match",
      name: "Clarify Match",
      start: [startForm],
      goal: [],
      difficulty: 1,
      allowedAxioms: ["inversion"],
    };

    loadTestLevel(level);

    const store = useGameStore.getState();
    const target = store.currentForms[0];
    const expected = clarify(deepClone(target));

    store.applyOperation({ type: "clarify", targetId: target.id });

    const { currentForms: after } = useGameStore.getState();
    expect(canonicalSignatureForest(after)).toEqual(
      canonicalSignatureForest(expected),
    );
  });

  it("clarify uses the parent when the child of an invertible pair is selected", () => {
    const startForm = round(square(atom("y")));
    const level: LevelDefinition = {
      id: "test-clarify-child-selection",
      name: "Clarify Child Selection",
      start: [startForm],
      goal: [],
      difficulty: 1,
      allowedAxioms: ["inversion"],
    };

    loadTestLevel(level);

    const store = useGameStore.getState();
    const parent = store.currentForms[0];
    const child = [...parent.children][0];
    const expected = clarify(deepClone(parent));

    store.applyOperation({ type: "clarify", targetId: child.id });

    const { currentForms: after } = useGameStore.getState();
    expect(canonicalSignatureForest(after)).toEqual(
      canonicalSignatureForest(expected),
    );
  });

  it("clarify does nothing when inversion is disallowed", () => {
    const startForm = round(square(atom("x")));
    const level: LevelDefinition = {
      id: "test-clarify-guard",
      name: "Clarify Guard",
      start: [startForm],
      goal: [],
      difficulty: 1,
      allowedAxioms: ["arrangement"],
    };

    loadTestLevel(level);
    const before = useGameStore.getState().currentForms;
    const beforeSignatures = canonicalSignatureForest(before);

    useGameStore
      .getState()
      .applyOperation({ type: "clarify", targetId: before[0].id });

    const { currentForms: after } = useGameStore.getState();
    expect(canonicalSignatureForest(after)).toEqual(beforeSignatures);
  });

  it("collect matches arrangement collect behaviour", () => {
    const frameA = round(atom("ctx"), square(atom("a")));
    const frameB = round(atom("ctx"), square(atom("b")));
    const level: LevelDefinition = {
      id: "test-collect-match",
      name: "Collect Match",
      start: [frameA, frameB],
      goal: [],
      difficulty: 1,
      allowedAxioms: ["arrangement"],
    };

    loadTestLevel(level);

    const store = useGameStore.getState();
    const [first, second] = store.currentForms;
    const expected = arrangementCollect([deepClone(first), deepClone(second)]);

    store.applyOperation({
      type: "collect",
      targetIds: [first.id, second.id],
    });

    const { currentForms: after } = useGameStore.getState();
    expect(canonicalSignatureForest(after)).toEqual(
      canonicalSignatureForest(expected),
    );
  });

  it("collect respects targeted square selection context", () => {
    const makeContextSquare = () => square(atom("ctx1"), atom("ctx2"));
    const frameA = round(makeContextSquare(), square(atom("payloadA")));
    const frameB = round(makeContextSquare(), square(atom("payloadB")));
    const level: LevelDefinition = {
      id: "test-collect-targeted-square",
      name: "Collect Targeted Square",
      start: [frameA, frameB],
      goal: [],
      difficulty: 1,
      allowedAxioms: ["arrangement"],
    };

    loadTestLevel(level);

    const store = useGameStore.getState();
    const [first, second] = store.currentForms;
    const targetSquare = [...first.children].find(
      (child) => child.boundary === "square" && child.children.size === 1,
    );
    expect(targetSquare).toBeDefined();

    store.applyOperation({
      type: "collect",
      targetIds: [first.id, second.id, targetSquare!.id],
    });

    const { currentForms: after } = useGameStore.getState();
    expect(after).toHaveLength(1);
    const [combined] = after;
    const squares = [...combined.children].filter(
      (child) => child.boundary === "square",
    );
    expect(squares).toHaveLength(2);

    const squareLabelSets = squares.map(
      (squareNode) =>
        new Set([...squareNode.children].map((child) => child.label ?? "")),
    );

    expect(
      squareLabelSets.some(
        (labels) =>
          labels.size === 2 && labels.has("ctx1") && labels.has("ctx2"),
      ),
    ).toBe(true);
    expect(
      squareLabelSets.some(
        (labels) =>
          labels.size === 2 && labels.has("payloadA") && labels.has("payloadB"),
      ),
    ).toBe(true);
  });

  it("cancel matches reflection cancel behaviour for a base-reflection pair", () => {
    const base = atom("z");
    const reflection = reflectionCreate(base)[1];
    const filler = atom("y");
    const level: LevelDefinition = {
      id: "test-cancel-match",
      name: "Cancel Match",
      start: [base, reflection, filler],
      goal: [],
      difficulty: 1,
      allowedAxioms: ["reflection"],
    };

    loadTestLevel(level);

    const store = useGameStore.getState();
    const current = store.currentForms;
    const baseNode = current.find(
      (form) => form.boundary === "atom" && form.label === "z",
    );
    const reflectionNode = current.find((form) => form.boundary === "angle");
    const fillerNode = current.find(
      (form) => form.boundary === "atom" && form.label === "y",
    );
    if (!baseNode || !reflectionNode || !fillerNode) {
      throw new Error("Failed to locate test nodes");
    }

    const expectedReplacement = reflectionCancel([
      deepClone(baseNode),
      deepClone(reflectionNode),
    ]);
    const expectedForest = [deepClone(fillerNode), ...expectedReplacement];

    store.applyOperation({
      type: "cancel",
      targetIds: [baseNode.id, reflectionNode.id],
    });

    const { currentForms: after } = useGameStore.getState();
    expect(canonicalSignatureForest(after)).toEqual(
      canonicalSignatureForest(expectedForest),
    );
  });

  it("cancel preserves angle context when reflection holds additional children", () => {
    const base = round();
    const reflection = angle(round(), square(atom("ctx")));
    const level: LevelDefinition = {
      id: "test-cancel-angle-context",
      name: "Cancel With Angle Context",
      start: [base, reflection],
      goal: [],
      difficulty: 2,
      allowedAxioms: ["reflection"],
    };

    loadTestLevel(level);

    const store = useGameStore.getState();
    const [baseNode, reflectionNode] = store.currentForms;

    store.applyOperation({
      type: "cancel",
      targetIds: [baseNode.id, reflectionNode.id],
    });

    const { currentForms: after } = useGameStore.getState();
    expect(after).toHaveLength(1);
    const [remaining] = after;
    expect(remaining.boundary).toBe("angle");
    const expected = angle(square(atom("ctx")));
    expect(canonicalSignature(remaining)).toBe(canonicalSignature(expected));
  });

  it("create adds reflections alongside templates under the parent", () => {
    const template = atom("seed");
    const parent = round(template);
    const level: LevelDefinition = {
      id: "test-create-match",
      name: "Create Match",
      start: [parent],
      goal: [],
      difficulty: 1,
      allowedAxioms: ["reflection"],
    };

    loadTestLevel(level);

    const store = useGameStore.getState();
    const parentNode = store.currentForms[0];
    const templateNode = [...parentNode.children][0];
    const existingChildren = [...parentNode.children].map((child) =>
      deepClone(child),
    );
    const created = reflectionCreate(deepClone(templateNode));
    const expectedChildren = [...existingChildren, ...created];

    store.applyOperation({
      type: "create",
      parentId: parentNode.id,
      templateIds: [templateNode.id],
    });

    const updatedParent = useGameStore.getState().currentForms[0];
    expect(canonicalSignatureForest(updatedParent.children)).toEqual(
      canonicalSignatureForest(expectedChildren),
    );
  });

  it("create without templates adds a lone angle form at the root", () => {
    const level: LevelDefinition = {
      id: "test-create-void",
      name: "Create Void",
      start: [],
      goal: [],
      difficulty: 1,
      allowedAxioms: ["reflection"],
    };

    loadTestLevel(level);

    const expected = reflectionCreate();
    useGameStore
      .getState()
      .applyOperation({ type: "create", parentId: null, templateIds: [] });

    const { currentForms: after } = useGameStore.getState();
    expect(canonicalSignatureForest(after)).toEqual(
      canonicalSignatureForest(expected),
    );
  });

  it("create with missing template ids falls back to root angle", () => {
    const origin = atom("origin");
    const level: LevelDefinition = {
      id: "test-create-missing-template",
      name: "Create Missing Template",
      start: [origin],
      goal: [],
      difficulty: 1,
      allowedAxioms: ["reflection"],
    };

    loadTestLevel(level);
    const before = useGameStore.getState().currentForms;

    useGameStore
      .getState()
      .applyOperation({
        type: "create",
        parentId: null,
        templateIds: ["non-existent-template"],
      });

    const { currentForms: after } = useGameStore.getState();
    expect(after).toHaveLength(before.length + 1);
    const angleForms = after.filter((form) => form.boundary === "angle");
    expect(angleForms).toHaveLength(1);
    expect(canonicalSignatureForest(after)).toEqual(
      canonicalSignatureForest([...before, angleForms[0]]),
    );
  });

  it("create with missing template ids inserts fallback under provided parent", () => {
    const frame = round(square(atom("leaf")), atom("context"));
    const level: LevelDefinition = {
      id: "test-create-missing-template-parent",
      name: "Create Missing Template Parent",
      start: [frame],
      goal: [],
      difficulty: 1,
      allowedAxioms: ["reflection"],
    };

    loadTestLevel(level);

    const store = useGameStore.getState();
    const parent = store.currentForms[0];
    const beforeChildren = [...parent.children].map((child) => deepClone(child));

    store.applyOperation({
      type: "create",
      parentId: parent.id,
      templateIds: ["missing-template"],
    });

    const updated = useGameStore.getState().currentForms[0];
    expect(canonicalSignatureForest(updated.children)).toEqual(
      canonicalSignatureForest([...beforeChildren, ...reflectionCreate()]),
    );
  });
});
