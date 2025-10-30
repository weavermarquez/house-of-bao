import { describe, it, expect } from "vitest";
import {
  clarify,
  collect,
  deepClone,
  disperse,
  enfold,
  enfoldRoundSquare,
  enfoldSquareRound,
  isCollectApplicable,
  isFrame,
} from "./Axioms";
import { canonicalSignature, round, square, angle, variable } from "./Form";

describe("Axioms", () => {
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

      // All ids should be different
      expect(cloned.id).not.toBe(original.id);
      expect(clonedChild.id).not.toBe([...original.children][0].id);
      expect(clonedGrandchild.id).not.toBe(
        [...[...original.children][0].children][0].id,
      );
    });

    it("preserves atom labels when cloning", () => {
      const original = variable("x");
      const cloned = deepClone(original);

      expect(cloned.label).toBe("x");
      expect(cloned.id).not.toBe(original.id);
    });
  });

  describe("clarify", () => {
    it("clarifies ([()]) to void (empty array)", () => {
      const form = round(square()); // ([()])
      const result = clarify(form);

      expect(result).toEqual([]);
    });

    it("clarifies ([A]) where A is a single form", () => {
      const inner = round();
      const form = round(square(inner)); // ([o])
      const result = clarify(form);

      expect(result).toHaveLength(1);
      expect(result[0].boundary).toBe("round");
      expect(result[0].children.size).toBe(0);
    });

    it("clarifies ([A B]) where A and B are multiple forms", () => {
      const inner1 = round();
      const inner2 = square();
      const form = round(square(inner1, inner2)); // ([o []])
      const result = clarify(form);

      expect(result).toHaveLength(2);
      const boundaries = result.map((f) => f.boundary);
      expect(boundaries).toContain("round");
      expect(boundaries).toContain("square");
    });

    it("clarifies [(A)] where A is void", () => {
      const form = square(round()); // [(())]
      const result = clarify(form);

      expect(result).toEqual([]);
    });

    it("clarifies [(A)] where A is a form", () => {
      const inner = square();
      const form = square(round(inner)); // [([])]
      const result = clarify(form);

      expect(result).toHaveLength(1);
      expect(result[0].boundary).toBe("square");
      expect(result[0].children.size).toBe(0);
    });

    it("does not clarify if not a paired boundary", () => {
      const form = round(); // just ()
      const result = clarify(form);

      expect(result).toHaveLength(1);
      expect(result[0].boundary).toBe("round");
      expect(result[0].id).not.toBe(form.id); // cloned
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
    it("enfolds a simple form", () => {
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

    it("enfolds a complex form", () => {
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
    it("wraps form with square outer and round inner boundaries", () => {
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

  describe("disperse", () => {
    it("distributes shared context to each child inside the square by default", () => {
      const context = variable("x");
      const form = round(context, square(variable("a"), variable("b")));

      expect(isFrame(form)).toBe(true);

      const result = disperse(form);

      expect(result).toHaveLength(2);
      result.forEach((roundForm) => {
        expect(roundForm.boundary).toBe("round");

        const contextForms = [...roundForm.children].filter(
          (child) => child.boundary === "atom",
        );
        expect(contextForms).toHaveLength(1);
        expect(contextForms[0].label).toBe("x");
        expect(contextForms[0].id).not.toBe(context.id);

        const frameSquare = [...roundForm.children].find(
          (child) => child.boundary === "square",
        );
        expect(frameSquare).toBeDefined();
        expect(frameSquare?.children.size).toBe(1);
      });

      const distributedLabels = result.map((roundForm) => {
        const frameSquare = [...roundForm.children].find(
          (child) => child.boundary === "square",
        )!;
        const content = [...frameSquare.children][0];
        return content.label;
      });
      expect(new Set(distributedLabels)).toEqual(new Set(["a", "b"]));
    });

    it("can disperse a selected child while keeping the remainder grouped", () => {
      const context = variable("x");
      const a = variable("a");
      const b = variable("b");
      const c = variable("c");
      const form = round(context, square(a, b, c));

      const result = disperse(form, { contentIds: [c.id] });

      expect(result).toHaveLength(2);

      const signatures = new Set(result.map(canonicalSignature));
      expect(signatures.size).toBe(2);
      const expectedRemainder = canonicalSignature(
        round(variable("x"), square(variable("a"), variable("b"))),
      );
      const expectedSelected = canonicalSignature(
        round(variable("x"), square(variable("c"))),
      );
      expect(signatures.has(expectedRemainder)).toBe(true);
      expect(signatures.has(expectedSelected)).toBe(true);
    });

    it("returns void when the enclosed square is empty", () => {
      const form = round(variable("x"), square());
      expect(isFrame(form)).toBe(true);
      expect(disperse(form)).toEqual([]);
    });

    it("returns a clone of the original form when not a frame", () => {
      const form = round(variable("x"), angle());

      expect(isFrame(form)).toBe(false);

      const result = disperse(form);
      expect(result).toHaveLength(1);
      expect(canonicalSignature(result[0])).toBe(canonicalSignature(form));
      expect(result[0].id).not.toBe(form.id);
    });

    it("returns a clone when an invalid content selection is provided", () => {
      const context = variable("x");
      const form = round(context, square(variable("a"), variable("b")));

      const result = disperse(form, { contentIds: ["not-real"] });
      expect(result).toHaveLength(1);
      expect(canonicalSignature(result[0])).toBe(canonicalSignature(form));
      expect(result[0].id).not.toBe(form.id);
    });

    it("disperses the specified square when multiple squares exist", () => {
      const context = variable("x");
      const primarySquare = square(variable("a"), variable("b"));
      const secondarySquare = square(variable("c"));
      const form = round(context, primarySquare, secondarySquare);

      const result = disperse(form, { squareId: secondarySquare.id });

      expect(result).toHaveLength(1);
      const [distributed] = result;
      const frameSquares = [...distributed.children].filter(
        (child) => child.boundary === "square",
      );
      expect(frameSquares).toHaveLength(2);

      const distributedSquare = frameSquares.find((squareForm) =>
        [...squareForm.children].some((content) => content.label === "c"),
      );
      expect(distributedSquare).toBeDefined();
    });
  });

  describe("collect", () => {
    it("combines distributed forms back into a single round context", () => {
      const original = round(
        variable("x"),
        square(variable("a"), variable("b")),
      );
      const distributed = disperse(original);

      expect(isCollectApplicable(distributed)).toBe(true);

      const collected = collect(distributed);
      expect(collected).toHaveLength(1);

      const [combined] = collected;
      expect(combined.boundary).toBe("round");
      expect(canonicalSignature(combined)).toBe(canonicalSignature(original));
      expect(combined.id).not.toBe(original.id);
    });

    it("returns clones when contexts differ", () => {
      const form1 = round(variable("x"), square(variable("a")));
      const form2 = round(variable("y"), square(variable("b")));

      expect(isCollectApplicable([form1, form2])).toBe(false);

      const result = collect([form1, form2]);
      expect(result).toHaveLength(2);
      expect(canonicalSignature(result[0])).toBe(canonicalSignature(form1));
      expect(canonicalSignature(result[1])).toBe(canonicalSignature(form2));
      expect(result[0].id).not.toBe(form1.id);
      expect(result[1].id).not.toBe(form2.id);
    });

    it("collects forms after a selective disperse", () => {
      const x = variable("x");
      const a = variable("a");
      const b = variable("b");
      const c = variable("c");
      const original = round(x, square(a, b, c));
      const distributed = disperse(original, { contentIds: [c.id] });

      expect(isCollectApplicable(distributed)).toBe(true);

      const collected = collect(distributed);
      expect(collected).toHaveLength(1);
      expect(canonicalSignature(collected[0])).toBe(canonicalSignature(original));
    });

    it("handles empty input gracefully", () => {
      expect(isCollectApplicable([])).toBe(false);
      expect(collect([])).toEqual([]);
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
