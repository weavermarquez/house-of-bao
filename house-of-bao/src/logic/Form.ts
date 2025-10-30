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

/**
 * Traverses a Form tree depth-first, invoking the supplied visitor for each
 * node. Traversal order is implementation-defined but guarantees every node is
 * visited exactly once.
 */
export function traverseForm(form: Form, visit: (node: Form) => void): void {
  const stack: Form[] = [form];
  while (stack.length > 0) {
    const current = stack.pop()!;
    visit(current);
    current.children.forEach((child) => stack.push(child));
  }
}

function assertCanonicalSignature(
  actual: string,
  expected?: string,
): void {
  if (expected === undefined) {
    return;
  }

  if (actual !== expected) {
    throw new Error(
      `Expected canonical signature "${expected}" but received "${actual}"`,
    );
  }
}

function signaturesMatch(
  actual: string[],
  expected?: string[],
): boolean {
  if (!expected) {
    return true;
  }

  if (actual.length !== expected.length) {
    return false;
  }

  const sortedExpected = [...expected].sort();
  return actual.every((signature, index) => signature === sortedExpected[index]);
}

/**
 * Collects every id present in the supplied Form tree. When an expected
 * canonical signature is provided, the structure is validated before ids are
 * collected.
 */
export function collectFormIds(
  form: Form,
  expectedSignature?: string,
): Set<string> {
  assertCanonicalSignature(canonicalSignature(form), expectedSignature);

  const ids = new Set<string>();
  traverseForm(form, (node) => {
    ids.add(node.id);
  });
  return ids;
}

/**
 * Collects every id across a forest of Forms. When expected canonical
 * signatures are passed, the forest structure is validated (order-invariant)
 * before ids are returned.
 */
export function collectFormForestIds(
  forms: Iterable<Form>,
  expectedSignatures?: string[],
): Set<string> {
  const materialized = [...forms];
  const actualSignatures = canonicalSignatureForest(materialized);
  if (!signaturesMatch(actualSignatures, expectedSignatures)) {
    throw new Error(
      `Expected canonical signatures ${JSON.stringify(
        expectedSignatures ?? [],
      )} but received ${JSON.stringify(actualSignatures)}`,
    );
  }

  const ids = new Set<string>();
  materialized.forEach((form) => {
    traverseForm(form, (node) => {
      ids.add(node.id);
    });
  });
  return ids;
}
