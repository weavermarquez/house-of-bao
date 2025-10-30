import { describe, it, expect } from "vitest";
import fc from "fast-check";
import {
  clarify,
  deepClone,
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
} from "../Form";
import {
  invertiblePairArb,
  materializeRawForm,
  rawFormArb,
} from "./FormArbitraries";

describe("Clarify Axiom", () => {
  describe("deepClone", () => {
    it("clones a simple form with new id", () => {
      const original = round();
      const cloned = deepClone(original);

      expect(cloned.boundary).toBe(original.boundary);
      expect(cloned.children.size).toBe(original.children.size);
      expect(cloned.id).not.toBe(original.id);
    });

    it("deep clones nested forms", () => {
      const original = round(square(angle()));
      const cloned = deepClone(original);

      expect(cloned.boundary).toBe("round");
      expect(cloned.children.size).toBe(1);

      const clonedChild = [...cloned.children][0];
      expect(clonedChild.boundary).toBe("square");
      expect(clonedChild.children.size).toBe(1);

      const clonedGrandchild = [...clonedChild.children][0];
      expect(clonedGrandchild.boundary).toBe("angle");

      expect(cloned.id).not.toBe(original.id);
      expect(clonedChild.id).not.toBe([...original.children][0].id);
      expect(clonedGrandchild.id).not.toBe(
        [...[...original.children][0].children][0].id,
      );
    });

    it("preserves atom labels when cloning", () => {
      const original = atom("x");
      const cloned = deepClone(original);

      expect(cloned.label).toBe("x");
      expect(cloned.id).not.toBe(original.id);
    });
  });

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
        fc.property(invertiblePairArb, ({ outer, payloads }) => {
          const payloadForms = payloads.map(materializeRawForm);
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
        fc.property(rawFormArb, (raw) => {
          const form = materializeRawForm(raw);
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
    it("clarifies ([()]) to void (empty array)", () => {
      const form = round(square());
      const result = clarify(form);

      expect(result).toEqual([]);
    });

    it("clarifies ([A]) where A is a single form", () => {
      const inner = round();
      const form = round(square(inner));
      const result = clarify(form);

      expect(result).toHaveLength(1);
      expect(result[0].boundary).toBe("round");
      expect(result[0].children.size).toBe(0);
    });

    it("clarifies ([A B]) where A and B are multiple forms", () => {
      const inner1 = round();
      const inner2 = square();
      const form = round(square(inner1, inner2));
      const result = clarify(form);

      expect(result).toHaveLength(2);
      const boundaries = result.map((f) => f.boundary);
      expect(boundaries).toContain("round");
      expect(boundaries).toContain("square");
    });

    it("clarifies [(A)] where A is void", () => {
      const form = square(round());
      const result = clarify(form);

      expect(result).toEqual([]);
    });

    it("clarifies [(A)] where A is a form", () => {
      const inner = square();
      const form = square(round(inner));
      const result = clarify(form);

      expect(result).toHaveLength(1);
      expect(result[0].boundary).toBe("square");
      expect(result[0].children.size).toBe(0);
    });

    it("does not clarify if not a paired boundary", () => {
      const form = round();
      const result = clarify(form);

      expect(result).toHaveLength(1);
      expect(result[0].boundary).toBe("round");
      expect(result[0].id).not.toBe(form.id);
    });

    it("does not clarify round with multiple children", () => {
      const form = round(square(), angle());
      const result = clarify(form);

      expect(result).toHaveLength(1);
      expect(result[0].boundary).toBe("round");
    });

    it("does not clarify square with non-round child", () => {
      const form = square(angle());
      const result = clarify(form);

      expect(result).toHaveLength(1);
      expect(result[0].boundary).toBe("square");
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

  it("enfold alias matches round-square variant", () => {
    const form = angle();
    const roundSquare = enfoldRoundSquare(form);
    const alias = enfold(form);

    expect(alias.boundary).toBe(roundSquare.boundary);
    expect([...alias.children][0].boundary).toBe(
      [...roundSquare.children][0].boundary,
    );
  });
});
