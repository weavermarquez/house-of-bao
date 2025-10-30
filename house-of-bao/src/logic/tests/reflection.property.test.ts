import { describe, it, expect } from "vitest";
import fc from "fast-check";
import {
  isReflectionApplicable,
  cancelReflection,
  createReflection,
  createReflectionPair,
} from "../reflection";
import {
  canonicalSignature,
  collectFormIds,
  collectFormForestIds,
} from "../Form";
import { formNodeArb, materializeFormNode } from "./formArbitraries";

describe("Reflection Axiom", () => {
  describe("isReflectionApplicable / cancelReflection", () => {
    it("property: cancelReflection removes any generated reflection pair", () => {
      fc.assert(
        fc.property(formNodeArb, (raw) => {
          const original = materializeFormNode(raw);
          const pair = createReflectionPair(original);

          expect(isReflectionApplicable(pair)).toBe(true);
          const result = cancelReflection(pair);
          expect(result).toHaveLength(0);
        }),
      );
    });

    it("property: survivors retain structure with fresh ids", () => {
      fc.assert(
        fc.property(formNodeArb, formNodeArb, (pairRaw, contextRaw) => {
          const base = materializeFormNode(pairRaw);
          const context = materializeFormNode(contextRaw);
          fc.pre(
            canonicalSignature(base) !== canonicalSignature(context),
          );

          const [baseClone, reflectionClone] = createReflectionPair(base);
          const forest = [context, baseClone, reflectionClone];

          const result = cancelReflection(forest);
          expect(result).toHaveLength(1);

          const [contextClone] = result;
          const expectedSignature = canonicalSignature(context);
          expect(canonicalSignature(contextClone)).toBe(expectedSignature);

          const originalIds = collectFormIds(context, expectedSignature);
          const cloneIds = collectFormForestIds(result, [expectedSignature]);
          originalIds.forEach((id) => {
            expect(cloneIds.has(id)).toBe(false);
          });
        }),
      );
    });
  }
}
