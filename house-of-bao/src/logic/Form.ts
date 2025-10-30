export type BoundaryType = "round" | "square" | "angle" | "atom";

export type Form = {
  id: string;
  boundary: BoundaryType;
  children: Set<Form>;
  label?: string;
};

export function createForm(boundary: BoundaryType, ...children: Form[]): Form {
  return {
    id: crypto.randomUUID(),
    boundary,
    children: new Set(children), // Create a copy to avoid external mutations
  };
}

// Convenience functions for creating forms
export function atom(label: string): Form {
  return { ...createForm("atom"), label };
}

export function round(...children: Form[]): Form {
  return createForm("round", ...children);
}

export function square(...children: Form[]): Form {
  return createForm("square", ...children);
}

export function angle(...children: Form[]): Form {
  return createForm("angle", ...children);
}

/**
 * Produces an order-invariant signature for structural comparisons:
 * - Ignores runtime-generated ids
 * - Sorts child signatures to account for unordered sibling sets
 */
export function canonicalSignature(form: Form): string {
  const labelPart = form.label ?? "";
  const childSignatures = [...form.children]
    .map((child) => canonicalSignature(child))
    .sort();
  return `${form.boundary}:${labelPart}[${childSignatures.join(",")}]`;
}

/**
 * Generates order-invariant signatures for every form in a forest. Helpful when
 * comparing contexts (unordered sets of siblings).
 */
export function canonicalSignatureForest(forms: Iterable<Form>): string[] {
  return [...forms].map((form) => canonicalSignature(form)).sort();
}
