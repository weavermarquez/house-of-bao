import { describe, expect, it } from "vitest";
import { hydrateLevel } from "./loader";
import { rawLevels } from "./rawLevels";
import { canonicalSignatureForest } from "../logic/Form";

describe("level hydration", () => {
  it("instantiates sets of forms from raw definitions", () => {
    const sample = rawLevels.find(
      (entry) => entry.start.length > 0 && entry.goal.length > 0,
    );
    expect(sample).toBeDefined();
    const hydrated = hydrateLevel(sample!);
    expect(hydrated.start).toHaveLength(sample!.start.length);
    expect(hydrated.goal).toHaveLength(sample!.goal.length);
    const startSignatures = canonicalSignatureForest(hydrated.start);
    expect(startSignatures[0]).toContain("round");
  });

  it("produces new ids for each instantiation", () => {
    const sample = rawLevels.find((entry) => entry.start.length > 0);
    expect(sample).toBeDefined();
    const first = hydrateLevel(sample!);
    const second = hydrateLevel(sample!);
    expect(first.start[0].id).not.toBe(second.start[0].id);
  });
});
