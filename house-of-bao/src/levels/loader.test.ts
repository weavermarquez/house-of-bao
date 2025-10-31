import { describe, expect, it } from "vitest";
import { hydrateLevel } from "./loader";
import { rawLevels } from "./rawLevels";
import { canonicalSignatureForest } from "../logic/Form";

describe("level hydration", () => {
  it("instantiates sets of forms from raw definitions", () => {
    const hydrated = hydrateLevel(rawLevels[0]);
    expect(hydrated.start).toHaveLength(1);
    expect(hydrated.goal).toHaveLength(1);
    const startSignatures = canonicalSignatureForest(hydrated.start);
    expect(startSignatures[0]).toContain("round");
  });

  it("produces new ids for each instantiation", () => {
    const first = hydrateLevel(rawLevels[0]);
    const second = hydrateLevel(rawLevels[0]);
    expect(first.start[0].id).not.toBe(second.start[0].id);
  });
});
