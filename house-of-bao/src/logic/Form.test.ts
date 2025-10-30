import { describe, it, expect } from "vitest";
import { createForm, round, square, angle, variable, type Form } from "./Form";

describe("Form Data Structure", () => {
  describe("createForm", () => {
    it("creates a unit when no children provided", () => {
      const unit = createForm("round");

      expect(unit.boundary).toBe("round");
      expect(unit.children).toBeInstanceOf(Set);
      expect(unit.children.size).toBe(0);
      expect(unit.id).toMatch(/^[a-f0-9-]+$/); // UUID-like format
    });

    it("creates a form with children when provided", () => {
      const child1 = createForm("round");
      const child2 = createForm("square");

      const parent = createForm("round", child1, child2);

      expect(parent.boundary).toBe("round");
      expect(parent.children.size).toBe(2);
      expect(parent.children.has(child1)).toBe(true);
      expect(parent.children.has(child2)).toBe(true);
    });

    it("creates a copy of the children set to prevent mutations", () => {
      const childrenSet = new Set([createForm("round")]);
      const form = createForm("square", ...childrenSet);

      expect(form.children).not.toBe(childrenSet); // Different reference
      expect(form.children.has([...childrenSet][0])).toBe(true);
    });
  });

  describe("Convenience Functions", () => {
    it("round() --> o", () => {
      const r = round();
      expect(r.boundary).toBe("round");
      expect(r.children.size).toBe(0);
    });

    it("round(square(), angle()) --> ([]<>)", () => {
      const child1 = square();
      const child2 = angle();
      const r = round(child1, child2);

      expect(r.boundary).toBe("round");
      expect(r.children.size).toBe(2);
      expect(r.children.has(child1)).toBe(true);
      expect(r.children.has(child2)).toBe(true);
    });

    it("square() --> []", () => {
      const s = square();
      expect(s.boundary).toBe("square");
      expect(s.children.size).toBe(0);
    });

    it("square(round(), angle()) --> [o<>]", () => {
      const child1 = round();
      const child2 = angle();
      const s = square(child1, child2);

      expect(s.boundary).toBe("square");
      expect(s.children.size).toBe(2);
      expect(s.children.has(child1)).toBe(true);
      expect(s.children.has(child2)).toBe(true);
    });

    it("angle() --> <>", () => {
      const a = angle();
      expect(a.boundary).toBe("angle");
      expect(a.children.size).toBe(0);
    });

    it("angle(round(), square()) --> <o[]>", () => {
      const child1 = round();
      const child2 = square();
      const a = angle(child1, child2);

      expect(a.boundary).toBe("angle");
      expect(a.children.size).toBe(2);
      expect(a.children.has(child1)).toBe(true);
      expect(a.children.has(child2)).toBe(true);
    });

    it("variable(name) creates an atom with label", () => {
      const v = variable("x");
      expect(v.boundary).toBe("atom");
      expect(v.children.size).toBe(0);
      expect(v.label).toBe("x");
      expect(v.id).toMatch(/^[a-f0-9-]+$/);
    });
  });

  describe("Set-based Children", () => {
    it("children are Set<Form> | (()[]) === ([]())", () => {
      const child1 = round();
      const child2 = square();

      const parent = createForm("round", child1, child2);

      expect(parent.children).toBeInstanceOf(Set);
      expect(parent.children.size).toBe(2);

      // Order doesn't matter - sets are unordered
      const reversedParent = createForm("round", child2, child1);
      expect(reversedParent.children.size).toBe(2);
      expect(reversedParent.children.has(child1)).toBe(true);
      expect(reversedParent.children.has(child2)).toBe(true);
    });

    it("prevents duplicate children (Set behavior)", () => {
      const child = round();
      const parent = createForm("square", child, child, child);

      expect(parent.children.size).toBe(1); // Only one instance
      expect(parent.children.has(child)).toBe(true);
    });
  });

  describe("Form Identity and Uniqueness", () => {
    it("each form has a unique id", () => {
      const form1 = createForm("round");
      const form2 = createForm("round");

      expect(form1.id).not.toBe(form2.id);
      expect(form1.id).toBeDefined();
      expect(form2.id).toBeDefined();
    });

    it("forms with same structure but different ids are not equal", () => {
      const form1 = round(square(), angle());
      const form2 = round(square(), angle());

      // Different ids, so not equal
      expect(form1.id).not.toBe(form2.id);
      // But structure is the same (would need custom equality for comparison)
    });
  });
});
