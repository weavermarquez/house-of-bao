import { describe, expect, it } from "vitest";
import { atom, round, square } from "../logic";
import { evaluateOperationAvailability } from "./useAvailableOperations";

type EvaluationInput = Parameters<typeof evaluateOperationAvailability>[0];

function baseContext(): EvaluationInput {
  return {
    currentForms: [],
    selectedNodeIds: [],
    selectedParentId: null,
    status: "playing",
    allowedAxioms: undefined,
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
});
