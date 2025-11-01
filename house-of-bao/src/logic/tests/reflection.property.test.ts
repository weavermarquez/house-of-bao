import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { isCancelApplicable, cancel, create } from "../reflection";
import {
  type Form,
  canonicalSignature,
  canonicalSignatureForest,
  collectFormForestIds,
} from "../Form";
import { formNodeArb, materializeFormNode } from "./formArbitraries";

function countSignatureOccurrences(forms: Form[], target: string): number {
  let count = 0;
  const stack: Form[] = [...forms];
  while (stack.length > 0) {
    const node = stack.pop()!;
    if (canonicalSignature(node) === target) {
      count += 1;
    }
    node.children.forEach((child) => {
      stack.push(child);
    });
  }
  return count;
}

describe("Reflection Axiom", () => {
  describe("isReflectionApplicable / cancelReflection", () => {
    it("property: cancelReflection removes any generated reflection pair", () => {
      fc.assert(
        fc.property(formNodeArb, (raw) => {
          const original = materializeFormNode(raw);
          const pair = create(original);

          expect(isCancelApplicable(pair)).toBe(true);
          const result = cancel(pair);
          expect(result).toHaveLength(0);
        }),
      );
    });

    it("property: survivors retain structure with fresh ids", () => {
      fc.assert(
        fc.property(formNodeArb, formNodeArb, (pairRaw, contextRaw) => {
          const base = materializeFormNode(pairRaw);
          const context = materializeFormNode(contextRaw);
          fc.pre(canonicalSignature(base) !== canonicalSignature(context));

          const [baseClone, reflectionClone] = create(base);
          const forest = [context, baseClone, reflectionClone];

          const baseSignature = canonicalSignature(base);
          const beforeCount = countSignatureOccurrences(forest, baseSignature);
          expect(beforeCount).toBeGreaterThanOrEqual(2);

          const result = cancel(forest);
          expect(countSignatureOccurrences(result, baseSignature)).toBe(
            beforeCount - 2,
          );

          const originalIds = collectFormForestIds(
            forest,
            canonicalSignatureForest(forest),
          );
          const cloneIds = collectFormForestIds(
            result,
            canonicalSignatureForest(result),
          );
          originalIds.forEach((id) => {
            expect(cloneIds.has(id)).toBe(false);
          });
        }),
      );
    });
  });
});
