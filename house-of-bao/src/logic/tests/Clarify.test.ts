import { describe, it, expect } from "vitest";
import fc from "fast-check";
import {
  clarify,
  enfold,
  enfoldRoundSquare,
  enfoldSquareRound,
  isClarifyApplicable,
} from "../Axioms";
import {
  canonicalSignature,
  round,
  square,
  angle,
  atom,
  type Form,
  collectFormIds,
  collectFormForestIds,
  traverseForm,
} from "../Form";
import {
  formNodeArb,
  invertiblePairNodesArb,
  materializeFormNode,
} from "./FormArbitraries";

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

function sortedBoundaries(forms: Form[]): string[] {
  return forms.map((form) => form.boundary).sort();
}

function sortedCanonicalSignatures(forms: Form[]): string[] {
  return forms.map((form) => canonicalSignature(form)).sort();
}

describe("Clarify Axiom", () => {
  describe("isClarifyApplicable", () => {
    type ClarifyCase = {
      label: string;
      factory: () => Form;
      expected: boolean;
      assert: (clarified: Form[], original: Form) => void;
    };

    const cases: ClarifyCase[] = [
      {
        label: "true positive: ([o]) → applicable",
        factory: () => round(square(round())),
        expected: true,
        assert: (clarified) => {
          expect(clarified).toHaveLength(1);
          expect(clarified[0].boundary).toBe("round");
        },
      },
      {
        label: "true positive: [(o)] → applicable",
        factory: () => square(round(square())),
        expected: true,
        assert: (clarified) => {
          expect(clarified).toHaveLength(1);
          expect(clarified[0].boundary).toBe("square");
        },
      },
      {
        label: "true negative: (()[]) → inapplicable",
        factory: () => round(square(), round()),
        expected: false,
        assert: (clarified, original) => {
          expect(clarified).toHaveLength(1);
          expect(clarified[0].boundary).toBe("round");
          expect(clarified[0].id).not.toBe(original.id);
        },
      },
      {
        label: "true negative: [[]] → inapplicable",
        factory: () => square(square()),
        expected: false,
        assert: (clarified, original) => {
          expect(clarified).toHaveLength(1);
          expect(clarified[0].boundary).toBe("square");
          expect(clarified[0].id).not.toBe(original.id);
        },
      },
      {
        label: "false positive guard: (o<>) stays inapplicable",
        factory: () => round(angle()),
        expected: false,
        assert: (clarified, original) => {
          expect(clarified).toHaveLength(1);
          expect(clarified[0].boundary).toBe("round");
          expect(clarified[0].id).not.toBe(original.id);
        },
      },
      {
        label: "false negative guard: ([(o)]) stays applicable",
        factory: () => round(square(round(square()))),
        expected: true,
        assert: (clarified) => {
          expect(clarified).toHaveLength(1);
          expect(clarified[0].boundary).toBe("round");
        },
      },
    ];

    it.each(cases)("$label", ({ factory, expected, assert }) => {
      const form = factory();
      expect(isClarifyApplicable(form)).toBe(expected);

      const clarified = clarify(form);
      assert(clarified, form);
    });

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
  });

  describe("clarify", () => {
    type ClarifyExampleCase = {
      label: string;
      factory: () => Form;
      expectedBoundaries?: (original: Form) => string[];
      expectedSignatures?: (original: Form) => string[];
    };

    const clarifyExamples: ClarifyExampleCase[] = [
      {
        label: "clarifies ([()]) to void (empty array)",
        factory: () => round(square()),
        expectedBoundaries: () => [],
        expectedSignatures: () => [],
      },
      {
        label: "clarifies ([A]) where A is a single form",
        factory: () => {
          const inner = round();
          return round(square(inner));
        },
        expectedBoundaries: () => ["round"],
        expectedSignatures: (original) => {
          const [squareChild] = [...original.children];
          return [...squareChild.children].map((child) =>
            canonicalSignature(child),
          );
        },
      },
      {
        label: "clarifies ([A B]) where A and B are multiple forms",
        factory: () => {
          const inner1 = round();
          const inner2 = square();
          return round(square(inner1, inner2));
        },
        expectedBoundaries: () => ["round", "square"],
        expectedSignatures: (original) => {
          const [squareChild] = [...original.children];
          return [...squareChild.children].map((child) =>
            canonicalSignature(child),
          );
        },
      },
      {
        label: "clarifies [(A)] where A is void",
        factory: () => square(round()),
        expectedBoundaries: () => [],
        expectedSignatures: () => [],
      },
      {
        label: "clarifies [(A)] where A is a form",
        factory: () => {
          const inner = square();
          return square(round(inner));
        },
        expectedBoundaries: () => ["square"],
        expectedSignatures: (original) => {
          const [roundChild] = [...original.children];
          return [...roundChild.children].map((child) =>
            canonicalSignature(child),
          );
        },
      },
      {
        label: "does not clarify if not a paired boundary",
        factory: () => round(),
        expectedBoundaries: (original) => [original.boundary],
        expectedSignatures: (original) => [canonicalSignature(original)],
      },
      {
        label: "does not clarify round with multiple children",
        factory: () => round(square(), angle()),
        expectedBoundaries: (original) => [original.boundary],
        expectedSignatures: (original) => [canonicalSignature(original)],
      },
      {
        label: "does not clarify square with non-round child",
        factory: () => square(angle()),
        expectedBoundaries: (original) => [original.boundary],
        expectedSignatures: (original) => [canonicalSignature(original)],
      },
    ];

    it.each(clarifyExamples)("$label", (testCase) => {
      const form = testCase.factory();
      const result = clarify(form);

      if (testCase.expectedBoundaries) {
        const expected = [...testCase.expectedBoundaries(form)].sort();
        expect(sortedBoundaries(result)).toEqual(expected);
      }

      if (testCase.expectedSignatures) {
        const expected = [...testCase.expectedSignatures(form)].sort();
        expect(sortedCanonicalSignatures(result)).toEqual(expected);
      }

      expectFreshClones(result, form);
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

  describe("enfoldRoundSquare", () => {
    it("enfolds () -> [(())]", () => {
      const form = round();
      const result = enfoldRoundSquare(form);

      expect(result.boundary).toBe("round");
      expect(result.children.size).toBe(1);

      const inner = [...result.children][0];
      expect(inner.boundary).toBe("square");
      expect(inner.children.size).toBe(1);

      const innermost = [...inner.children][0];
      expect(innermost.boundary).toBe("round");
      expect(innermost.children.size).toBe(0);
    });

    it("enfolds A = [()<>] -> ([ A ])", () => {
      const form = square(round(), angle());
      const result = enfoldRoundSquare(form);

      expect(result.boundary).toBe("round");
      expect(result.children.size).toBe(1);

      const inner = [...result.children][0];
      expect(inner.boundary).toBe("square");
      expect(inner.children.size).toBe(1);

      const innermost = [...inner.children][0];
      expect(innermost.boundary).toBe("square");
      expect(innermost.children.size).toBe(2);
    });

    it("creates new IDs for all levels", () => {
      const original = round();
      const result = enfoldRoundSquare(original);

      expect(result.id).not.toBe(original.id);

      const inner = [...result.children][0];
      expect(inner.id).not.toBe(original.id);

      const innermost = [...inner.children][0];
      expect(innermost.id).not.toBe(original.id);
    });
  });

  describe("enfoldSquareRound", () => {
    it("enfolds [] -> [([])]", () => {
      const form = square();
      const result = enfoldSquareRound(form);

      expect(result.boundary).toBe("square");
      expect(result.children.size).toBe(1);

      const inner = [...result.children][0];
      expect(inner.boundary).toBe("round");
      expect(inner.children.size).toBe(1);

      const innermost = [...inner.children][0];
      expect(innermost.boundary).toBe("square");
      expect(innermost.children.size).toBe(0);
    });

    it("creates new IDs for all levels", () => {
      const original = round();
      const result = enfoldSquareRound(original);

      expect(result.id).not.toBe(original.id);

      const inner = [...result.children][0];
      expect(inner.id).not.toBe(original.id);

      const innermost = [...inner.children][0];
      expect(innermost.id).not.toBe(original.id);
    });
  });

  describe("enfold", () => {
    it("alias matches round-square variant (example)", () => {
      const form = angle();
      const roundSquare = enfoldRoundSquare(form);
      const alias = enfold(form);

      expect(alias.boundary).toBe(roundSquare.boundary);
      expect([...alias.children][0].boundary).toBe(
        [...roundSquare.children][0].boundary,
      );
    });

    it("property: alias matches round-square variant structurally", () => {
      fc.assert(
        fc.property(formNodeArb, (raw) => {
          const form = materializeFormNode(raw);
          const roundSquare = enfoldRoundSquare(form);
          const alias = enfold(form);

          expect(canonicalSignature(alias)).toBe(
            canonicalSignature(roundSquare),
          );

          const originalIds = collectFormIds(form, canonicalSignature(form));
          const roundSquareIds = collectFormIds(
            roundSquare,
            canonicalSignature(roundSquare),
          );
          const aliasIds = collectFormIds(alias, canonicalSignature(alias));

          expectDisjoint(aliasIds, originalIds);
          expectDisjoint(roundSquareIds, originalIds);
          expectDisjoint(aliasIds, roundSquareIds);
        }),
      );
    });
  });
});
