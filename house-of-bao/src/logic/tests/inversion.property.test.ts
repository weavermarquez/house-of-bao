import { describe, it, expect } from "vitest";
import fc from "fast-check";
import {
  enfoldRoundSquare,
  enfoldSquareRound,
  isClarifyApplicable,
  clarify,
} from "../inversion";
import {
  canonicalSignature,
  round,
  square,
  type Form,
  collectFormIds,
  collectFormForestIds,
  traverseForm,
  sortedCanonicalSignatures,
} from "../Form";
import {
  formNodeArb,
  invertiblePairNodesArb,
  materializeFormNode,
} from "./formArbitraries";

function expectDisjoint(setA: Set<string>, setB: Set<string>): void {
  for (const id of setA) {
    expect(setB.has(id)).toBe(false);
  }
}

function expectFreshClones(forms: Form[], original: Form): void {
  const originalIds = collectFormIds(original, canonicalSignature(original));
  const observed = new Set<string>();
  forms.forEach((form) => {
    traverseForm(form, (node) => {
      expect(originalIds.has(node.id)).toBe(false);
      expect(observed.has(node.id)).toBe(false);
      observed.add(node.id);
    });
  });
}

describe("Inversion Axiom (Property)", () => {
  describe("clarify", () => {
    it("property: clarify returns inner contents for invertible pairs", () => {
      fc.assert(
        fc.property(invertiblePairNodesArb, ({ outer, payloads }) => {
          const payloadForms = payloads.map(materializeFormNode);
          const inner =
            outer === "round"
              ? square(...payloadForms)
              : round(...payloadForms);
          const form = outer === "round" ? round(inner) : square(inner);

          expect(isClarifyApplicable(form)).toBe(true);

          const clarified = clarify(form);
          const expectedSignatures = [...inner.children]
            .map((child) => canonicalSignature(child))
            .sort();
          const actualSignatures = clarified
            .map((child) => canonicalSignature(child))
            .sort();
          expect(actualSignatures).toEqual(expectedSignatures);

          const originalIds = new Set(
            [...inner.children].map((child) => child.id),
          );
          clarified.forEach((clone) => {
            expect(originalIds.has(clone.id)).toBe(false);
          });
        }),
      );
    });

    it("property: clarify clones when inversion is inapplicable", () => {
      fc.assert(
        fc.property(formNodeArb, (raw) => {
          const form = materializeFormNode(raw);
          fc.pre(!isClarifyApplicable(form));

          const clarified = clarify(form);
          expect(clarified).toHaveLength(1);

          const [clone] = clarified;
          expect(canonicalSignature(clone)).toBe(canonicalSignature(form));
          expect(clone.id).not.toBe(form.id);
        }),
      );
    });

    it("property: clarify(enfoldRoundSquare(form)) yields clones of the original form", () => {
      fc.assert(
        fc.property(formNodeArb, (raw) => {
          const original = materializeFormNode(raw);
          const wrapped = enfoldRoundSquare(original);

          expect(isClarifyApplicable(wrapped)).toBe(true);

          const clarified = clarify(wrapped);
          expect(clarified).toHaveLength(1);
          expect(sortedCanonicalSignatures(clarified)).toEqual([
            canonicalSignature(original),
          ]);

          expectFreshClones(clarified, original);
          const wrappedIds = collectFormIds(
            wrapped,
            canonicalSignature(wrapped),
          );
          const clarifiedIds = collectFormForestIds(clarified, [
            canonicalSignature(original),
          ]);
          expectDisjoint(clarifiedIds, wrappedIds);
        }),
      );
    });

    it("property: clarify(enfoldSquareRound(form)) yields clones of the original form", () => {
      fc.assert(
        fc.property(formNodeArb, (raw) => {
          const original = materializeFormNode(raw);
          const wrapped = enfoldSquareRound(original);

          expect(isClarifyApplicable(wrapped)).toBe(true);

          const clarified = clarify(wrapped);
          expect(clarified).toHaveLength(1);
          expect(sortedCanonicalSignatures(clarified)).toEqual([
            canonicalSignature(original),
          ]);

          expectFreshClones(clarified, original);
          const wrappedIds = collectFormIds(
            wrapped,
            canonicalSignature(wrapped),
          );
          const clarifiedIds = collectFormForestIds(clarified, [
            canonicalSignature(original),
          ]);
          expectDisjoint(clarifiedIds, wrappedIds);
        }),
      );
    });
  });
  // describe("enfold", () => {});
});
