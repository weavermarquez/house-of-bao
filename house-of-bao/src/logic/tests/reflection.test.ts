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
  round,
  square,
  angle,
  atom,
  collectFormIds,
  collectFormForestIds,
} from "../Form";
import { formNodeArb, materializeFormNode } from "./formArbitraries";

describe("Reflection Axiom", () => {
  describe("isReflectionApplicable / cancelReflection", () => {
    it("detects and cancels simple pair (() <()>)", () => {
      const base = round();
      const pair = createReflectionPair(base);

      expect(isReflectionApplicable(pair)).toBe(true);
      expect(cancelReflection(pair)).toEqual([]);
    });

    it("returns clones of survivors when extra context remains", () => {
      const base = square(round(atom("x")));
      const [baseClone, reflection] = createReflectionPair(base);
      const context = angle(atom("y"));
      const forms = [context, baseClone, reflection];

      const result = cancelReflection(forms);

      expect(result).toHaveLength(1);
      const [contextClone] = result;
      expect(canonicalSignature(contextClone)).toBe(
        canonicalSignature(context),
      );
      expect(contextClone.id).not.toBe(context.id);
    });

    it("clones inputs when no reflection pair is present", () => {
      const formA = round(atom("a"));
      const formB = square(atom("b"));

      const result = cancelReflection([formA, formB]);

      expect(result).toHaveLength(2);
      expect(canonicalSignature(result[0])).toBe(canonicalSignature(formA));
      expect(result[0].id).not.toBe(formA.id);
      expect(canonicalSignature(result[1])).toBe(canonicalSignature(formB));
      expect(result[1].id).not.toBe(formB.id);
    });

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
  });

  describe("createReflection / createReflectionPair", () => {
    it("creates reflection with cloned contents", () => {
      const payload = round(square(atom("p")));
      const reflection = createReflection(payload);

      expect(reflection.boundary).toBe("angle");
      const child = [...reflection.children][0];
      expect(canonicalSignature(child)).toBe(canonicalSignature(payload));

      const originalIds = collectFormIds(payload, canonicalSignature(payload));
      const reflectedIds = collectFormIds(child, canonicalSignature(payload));
      originalIds.forEach((id) => {
        expect(reflectedIds.has(id)).toBe(false);
      });
    });

    it("creates pair with base clone and matching reflection", () => {
      const original = square(round(atom("base")), angle());
      const [baseClone, reflection] = createReflectionPair(original);

      const expectedSignature = canonicalSignature(original);
      expect(canonicalSignature(baseClone)).toBe(expectedSignature);
      expect(baseClone.id).not.toBe(original.id);

      expect(reflection.boundary).toBe("angle");
      const reflectedChild = [...reflection.children][0];
      expect(canonicalSignature(reflectedChild)).toBe(expectedSignature);
    });
  });
});
