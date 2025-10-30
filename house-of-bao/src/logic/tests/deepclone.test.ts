import { describe, it, expect } from "vitest";
import fc from "fast-check";
import {
  deepClone,
  canonicalSignature,
  round,
  square,
  angle,
  atom,
  collectFormIds,
  traverseForm,
} from "../Form";
import { formNodeArb, materializeFormNode } from "./formArbitraries";

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

  it("property: deepClone preserves structure with fresh ids", () => {
    fc.assert(
      fc.property(formNodeArb, (raw) => {
        const original = materializeFormNode(raw);
        const cloned = deepClone(original);

        expect(canonicalSignature(cloned)).toBe(canonicalSignature(original));

        const originalIds = collectFormIds(
          original,
          canonicalSignature(original),
        );
        const observed = new Set<string>();
        traverseForm(cloned, (node) => {
          expect(originalIds.has(node.id)).toBe(false);
          expect(observed.has(node.id)).toBe(false);
          observed.add(node.id);
        });
      }),
    );
  });
});
