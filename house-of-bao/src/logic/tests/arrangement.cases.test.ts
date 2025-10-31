import { describe, it, expect } from "vitest";
import {
  isCollectApplicable,
  collect,
  disperse,
  isFrame,
} from "../arrangement";
import { canonicalSignature, round, square, angle, atom } from "../Form";

describe("Arrangement Axiom", () => {
  describe("isFrame", () => {
    it("identifies (x [a b]) as a frame", () => {
      const form = round(atom("x"), square(atom("a"), atom("b")));
      expect(isFrame(form)).toBe(true);
    });

    it("rejects (x <a>) without square", () => {
      const form = round(atom("x"), angle(atom("a")));
      expect(isFrame(form)).toBe(false);
    });

    it("rejects [a] as not a frame", () => {
      const form = square(atom("a"));
      expect(isFrame(form)).toBe(false);
    });
  });

  describe("disperse", () => {
    it("distributes (x [ab]) -> (x [a])(x [b]) by default", () => {
      const context = atom("x");
      const form = round(square(atom("a"), atom("b")), context);

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

    it("selectively disperses (x [abc]) with c -> (x [ab])(x [c])", () => {
      const context = atom("x");
      const a = atom("a");
      const b = atom("b");
      const c = atom("c");
      const form = round(context, square(a, b, c));

      const result = disperse(form, { contentIds: [c.id] });

      expect(result).toHaveLength(2);

      const signatures = new Set(result.map(canonicalSignature));
      expect(signatures.size).toBe(2);
      const expectedRemainder = canonicalSignature(
        round(atom("x"), square(atom("a"), atom("b"))),
      );
      const expectedSelected = canonicalSignature(
        round(atom("x"), square(atom("c"))),
      );
      expect(signatures.has(expectedRemainder)).toBe(true);
      expect(signatures.has(expectedSelected)).toBe(true);
    });

    it("returns void for (x [ ])", () => {
      // Dominion Theorem
      const form = round(atom("x"), square());
      expect(isFrame(form)).toBe(true);
      expect(disperse(form)).toEqual([]);
    });

    it("clones when given (x <>)", () => {
      const form = round(atom("x"), angle());

      expect(isFrame(form)).toBe(false);

      const result = disperse(form);
      expect(result).toHaveLength(1);
      expect(canonicalSignature(result[0])).toBe(canonicalSignature(form));
      expect(result[0].id).not.toBe(form.id);
    });

    it("clones when selection ids are invalid on (x [ab])", () => {
      const context = atom("x");
      const form = round(context, square(atom("a"), atom("b")));

      const result = disperse(form, { contentIds: ["not-real"] });
      expect(result).toHaveLength(1);
      expect(canonicalSignature(result[0])).toBe(canonicalSignature(form));
      expect(result[0].id).not.toBe(form.id);
    });

    it("noop if target [c] in (x [ab][c]) -> (x [ab][c])", () => {
      const context = atom("x");
      const primarySquare = square(atom("a"), atom("b"));
      const secondarySquare = square(atom("c"));
      const form = round(context, primarySquare, secondarySquare);

      // console.log("Initial Form", canonicalSignature(form));
      // I'm not happy with Arrangement
      const result = disperse(form, { squareId: secondarySquare.id });

      // console.log("Dispersed", canonicalSignature(result.at(0)));
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

    it("handles nested frames: disperse inner square", () => {
      const innerFrame = round(atom("y"), square(atom("a")));
      const outerFrame = round(atom("x"), square(innerFrame, atom("b")));

      const outerSquare = [...outerFrame.children].find(
        (c) => c.boundary === "square",
      )!;
      const result = disperse(outerFrame, { squareId: outerSquare.id });

      expect(result).toHaveLength(2);
      // One with inner frame, one with b
    });

    it("disperse if target [ab] in (x [a b][c d]) -> (x [a][c d])(x [b][c d])", () => {
      const context = atom("x");
      const square1 = square(atom("a"), atom("b"));
      const square2 = square(atom("c"), atom("d"));
      const form = round(context, square1, square2);

      const result = disperse(form, { squareId: square1.id });
      expect(result).toHaveLength(2);
      result.forEach((frame) => {
        const squares = [...frame.children].filter(
          (c) => c.boundary === "square",
        );
        expect(squares).toHaveLength(2); // original square1 and square2
        expect(
          squares.some((sq) =>
            [...sq.children].every(
              (cont) => cont.label === "c" || cont.label === "d",
            ),
          ),
        ).toBe(true);
        const distributedSquare = squares.find((sq) =>
          [...sq.children].some(
            (cont) => cont.label === "a" || cont.label === "b",
          ),
        );
        expect(distributedSquare).toBeDefined();
      });
    });
  });

  describe("collect", () => {
    it("combines (x [a])(x [b]) -> (x [ab])", () => {
      const original = round(atom("x"), square(atom("a"), atom("b")));
      const distributed = disperse(original);

      expect(isCollectApplicable(distributed)).toBe(true);

      const collected = collect(distributed);
      expect(collected).toHaveLength(1);

      const [combined] = collected;
      expect(combined.boundary).toBe("round");
      expect(canonicalSignature(combined)).toBe(canonicalSignature(original));
      expect(combined.id).not.toBe(original.id);
    });

    it("returns clones for (x [a]) vs (y [b]) mismatch", () => {
      const form1 = round(atom("x"), square(atom("a")));
      const form2 = round(atom("y"), square(atom("b")));

      expect(isCollectApplicable([form1, form2])).toBe(false);

      const result = collect([form1, form2]);
      expect(result).toHaveLength(2);
      expect(canonicalSignature(result[0])).toBe(canonicalSignature(form1));
      expect(canonicalSignature(result[1])).toBe(canonicalSignature(form2));
      expect(result[0].id).not.toBe(form1.id);
      expect(result[1].id).not.toBe(form2.id);
    });

    it("collects (x [ab])(x [c]) after selective disperse", () => {
      const x = atom("x");
      const a = atom("a");
      const b = atom("b");
      const c = atom("c");
      const original = round(x, square(a, b, c));
      const distributed = disperse(original, { contentIds: [c.id] });

      expect(isCollectApplicable(distributed)).toBe(true);

      const collected = collect(distributed);
      expect(collected).toHaveLength(1);
      expect(canonicalSignature(collected[0])).toBe(
        canonicalSignature(original),
      );
    });

    it("collects frames that share additional square context", () => {
      const sharedContext = square(atom("shared"));
      const a = atom("a");
      const b = atom("b");
      const payload = square(a, b);
      const base = round(sharedContext, payload);

      const distributed = disperse(base, {
        squareId: payload.id,
        contentIds: [b.id],
      });

      expect(distributed).toHaveLength(2);
      expect(isCollectApplicable(distributed)).toBe(true);

      const collected = collect(distributed);
      expect(collected).toHaveLength(1);
      expect(canonicalSignature(collected[0])).toBe(canonicalSignature(base));
    });

    it("handles empty input gracefully", () => {
      expect(isCollectApplicable([])).toBe(false);
      expect(collect([])).toEqual([]);
    });
  });

  describe("isCollectApplicable", () => {
    it("returns true for (x [a])(x [b])", () => {
      const frameA = round(atom("x"), square(atom("a")));
      const frameB = round(atom("x"), square(atom("b")));

      expect(isCollectApplicable([frameA, frameB])).toBe(true);
    });

    it("returns false for mismatched contexts (x [a])(y [b])", () => {
      const frameA = round(atom("x"), square(atom("a")));
      const frameB = round(atom("y"), square(atom("b")));

      expect(isCollectApplicable([frameA, frameB])).toBe(false);
    });

    it("returns false when any square is empty (x [ ])", () => {
      const frameEmpty = round(atom("x"), square());

      expect(isCollectApplicable([frameEmpty])).toBe(false);
    });
  });
});
