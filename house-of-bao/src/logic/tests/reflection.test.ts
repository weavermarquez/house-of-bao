import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { isCancelApplicable, cancel, create } from "../reflection";
import {
  canonicalSignature,
  collectFormIds,
  collectFormForestIds,
  round,
  square,
  angle,
  atom,
  type Form,
} from "../Form";
import { formNodeArb, materializeFormNode } from "./formArbitraries";

function expectNoSharedIds(result: Form[], originals: Set<string>): void {
  result.forEach((form) => {
    collectFormIds(form).forEach((id) => {
      expect(originals.has(id)).toBe(false);
    });
  });
}

describe("Reflection Axiom", () => {
  describe("isCancelApplicable / cancel", () => {
    it("detects and cancels a simple (() <()>) pair", () => {
      const base = round();
      const pair = create(base);

      expect(isCancelApplicable(pair)).toBe(true);
      expect(cancel(pair)).toEqual([]);
    });

    it("returns clones of survivors when extra context remains", () => {
      const base = square(round(atom("x")));
      const [baseClone, reflection] = create(base);
      const context = angle(atom("y"));
      const forms = [context, baseClone, reflection];

      const result = cancel(forms);

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

      const result = cancel([formA, formB]);

      expect(result).toHaveLength(2);
      expect(canonicalSignature(result[0])).toBe(canonicalSignature(formA));
      expect(result[0].id).not.toBe(formA.id);
      expect(canonicalSignature(result[1])).toBe(canonicalSignature(formB));
      expect(result[1].id).not.toBe(formB.id);
    });

    it("eliminates void reflections without a base", () => {
      const voidReflection = angle();

      expect(isCancelApplicable([voidReflection])).toBe(true);
      expect(cancel([voidReflection])).toEqual([]);
    });

    it("property: cancel(create(A)) eliminates the pair", () => {
      fc.assert(
        fc.property(formNodeArb, (raw) => {
          const base = materializeFormNode(raw);
          const pair = create(base);
          expect(isCancelApplicable(pair)).toBe(true);
          expect(cancel(pair)).toEqual([]);
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

          const [baseClone, reflectionClone] = create(base);
          const forest = [context, baseClone, reflectionClone];

          const result = cancel(forest);
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

  describe("create", () => {
    it("creates a pair with cloned base and reflection", () => {
      const original = square(round(atom("base")), angle());
      const [baseClone, reflection] = create(original);

      const expectedSignature = canonicalSignature(original);
      expect(canonicalSignature(baseClone)).toBe(expectedSignature);
      expect(baseClone.id).not.toBe(original.id);

      expect(reflection.boundary).toBe("angle");
      const child = [...reflection.children][0];
      expect(canonicalSignature(child)).toBe(expectedSignature);

      const baseIds = collectFormIds(baseClone, expectedSignature);
      const reflectionIds = collectFormIds(child, expectedSignature);
      baseIds.forEach((id) => {
        expect(reflectionIds.has(id)).toBe(false);
      });
    });

    it("creates an angle unit when given void template", () => {
      const result = create();
      expect(result).toHaveLength(1);
      const [voidReflection] = result;
      expect(voidReflection.boundary).toBe("angle");
      expect(voidReflection.children.size).toBe(0);
    });

    it("property: created pair uses fresh ids", () => {
      fc.assert(
        fc.property(formNodeArb, (raw) => {
          const original = materializeFormNode(raw);
          const [baseClone, reflection] = create(original);

          const expectedSignature = canonicalSignature(original);
          expect(canonicalSignature(baseClone)).toBe(expectedSignature);

          const baseIds = collectFormIds(baseClone, expectedSignature);
          const reflectionChild = [...reflection.children][0];
          expect(canonicalSignature(reflectionChild)).toBe(
            expectedSignature,
          );
          const reflectionIds = collectFormIds(
            reflectionChild,
            expectedSignature,
          );

          expectNoSharedIds([baseClone], collectFormIds(original));
          baseIds.forEach((id) => {
            expect(reflectionIds.has(id)).toBe(false);
          });
        }),
      );
    });
  });
});
