import { describe, it, expect } from "vitest";
import { clarify, enfold, deepClone } from "./Axioms";
import { round, square, angle, variable } from "./Form";

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

  describe("enfold", () => {
    it("enfolds a simple form", () => {
      const form = round();
      const result = enfold(form);

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
      const result = enfold(form);

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
      const result = enfold(original);

      expect(result.id).not.toBe(original.id);

      const inner = [...result.children][0];
      expect(inner.id).not.toBe(original.id);

      const innermost = [...inner.children][0];
      expect(innermost.id).not.toBe(original.id);
    });
  });
});
