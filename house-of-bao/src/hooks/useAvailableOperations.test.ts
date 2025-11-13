import { describe, expect, it } from "vitest";
import { atom, round, square, angle } from "../logic";
import { evaluateOperationAvailability } from "./useAvailableOperations";

type EvaluationInput = Parameters<typeof evaluateOperationAvailability>[0];

function baseContext(): EvaluationInput {
  return {
    currentForms: [],
    selectedNodeIds: [],
    selectedParentId: null,
    status: "playing",
    allowedAxioms: undefined,
    allowedOperations: undefined,
    sandboxEnabled: false,
  };
}

describe("useAvailableOperations/evaluateOperationAvailability", () => {
  it("disables every action while the game is idle", () => {
    const availability = evaluateOperationAvailability({
      ...baseContext(),
      status: "idle",
    });

    expect(availability.clarify.available).toBe(false);
    expect(availability.clarify.reason).toContain("Load a level");
    expect(availability.disperse.available).toBe(false);
    expect(availability.create.available).toBe(false);
  });

  it("marks clarify as available when a round-square pair is selected", () => {
    const clarifiable = round(square(atom("x")));

    const availability = evaluateOperationAvailability({
      ...baseContext(),
      currentForms: [clarifiable],
      selectedNodeIds: [clarifiable.id],
    });

    expect(availability.clarify.available).toBe(true);
  });

  it("marks clarify as available when the clarifiable child is selected", () => {
    const clarifiable = round(square(atom("x")));
    const child = [...clarifiable.children][0]!;

    const availability = evaluateOperationAvailability({
      ...baseContext(),
      currentForms: [clarifiable],
      selectedNodeIds: [child.id],
    });

    expect(availability.clarify.available).toBe(true);
  });

  it("marks disperse as available when the square boundary is selected", () => {
    const squareNode = square(round(atom("a")), round(atom("b")));
    const frame = round(squareNode);

    const availability = evaluateOperationAvailability({
      ...baseContext(),
      currentForms: [frame],
      selectedNodeIds: [squareNode.id],
    });

    expect(availability.disperse.available).toBe(true);
  });

  it("explains when collect lacks a frame selection", () => {
    const frame = round(square(atom("left")));
    const squareChild = [...frame.children][0]!;

    const availability = evaluateOperationAvailability({
      ...baseContext(),
      currentForms: [frame],
      selectedNodeIds: [squareChild.id],
    });

    expect(availability.collect.available).toBe(false);
    expect(availability.collect.reason).toBe(
      "Select round frames that share the same context to collect.",
    );
  });

  it("surfaces arrangement axiom locks for disperse", () => {
    const frame = round(square(atom("a"), atom("b")));

    const availability = evaluateOperationAvailability({
      ...baseContext(),
      currentForms: [frame],
      selectedNodeIds: [frame.id],
      allowedAxioms: ["inversion"],
    });

    expect(availability.disperse.available).toBe(false);
    expect(availability.disperse.reason).toBe(
      "This level disables arrangement actions.",
    );
  });

  it("surfaces per-operation locks", () => {
    const frame = round(square(atom("a")));

    const availability = evaluateOperationAvailability({
      ...baseContext(),
      currentForms: [frame],
      selectedNodeIds: [frame.id],
      allowedOperations: ["enfoldFrame"],
    });

    expect(availability.clarify.available).toBe(false);
    expect(availability.clarify.reason).toBe(
      "This level locks Clarify to focus on other actions.",
    );
    expect(availability.enfoldFrame.reason ?? "").not.toContain("locks");
  });

  it("marks cancel as available when selecting content inside an angle", () => {
    const base = atom("z");
    const reflection = angle(atom("z"));
    const inner = [...reflection.children][0]!;

    const availability = evaluateOperationAvailability({
      ...baseContext(),
      currentForms: [base, reflection],
      selectedNodeIds: [inner.id],
    });

    expect(availability.cancel.available).toBe(true);
  });

  it("disables sandbox actions until sandbox mode is enabled", () => {
    const availability = evaluateOperationAvailability({
      ...baseContext(),
      sandboxEnabled: false,
    });

    expect(availability.addRound.available).toBe(false);
    expect(availability.addRound.reason).toContain("Enable sandbox mode");
    expect(availability.addSquare.reason).toContain("Enable sandbox mode");
    expect(availability.addAngle.reason).toContain("Enable sandbox mode");
    expect(availability.addVariable.reason).toContain("Enable sandbox mode");
  });

  it("marks addRound as available when sandbox mode is enabled", () => {
    const availability = evaluateOperationAvailability({
      ...baseContext(),
      sandboxEnabled: true,
    });

    expect(availability.addRound.available).toBe(true);
    expect(availability.addVariable.available).toBe(true);
  });

  it("requires sibling selections for sandbox wrapping", () => {
    const frame = round(square(atom("inner")), atom("solo"));
    const squareChild = [...frame.children][0]!;
    const innerLeaf = [...squareChild.children][0]!;

    const availability = evaluateOperationAvailability({
      ...baseContext(),
      currentForms: [frame],
      selectedNodeIds: [squareChild.id, innerLeaf.id],
      sandboxEnabled: true,
    });

    expect(availability.addSquare.available).toBe(false);
    expect(availability.addSquare.reason).toBe(
      "Select sibling nodes that share the same parent.",
    );
  });
});
