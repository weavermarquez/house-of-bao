import { type Form, type BoundaryType } from "./Form";

/**
 * Deep clones a Form tree, creating new Form objects with new IDs.
 */
export function deepClone(form: Form): Form {
  const clonedChildren = new Set<Form>();
  for (const child of form.children) {
    clonedChildren.add(deepClone(child));
  }
  return {
    id: crypto.randomUUID(),
    boundary: form.boundary,
    children: clonedChildren,
    label: form.label,
  };
}

function invertiblePair(self: BoundaryType, child: BoundaryType): boolean {
  return (
    (self === "round" && child === "square") ||
    (self === "square" && child === "round")
  );
}

function invertibleChild(form: Form): Form | null {
  if (form.children.size !== 1) {
    return null;
  }

  const iteratorResult = form.children.values().next();
  if (iteratorResult.done) {
    return null;
  }

  const child = iteratorResult.value as Form;
  return invertiblePair(form.boundary, child.boundary) ? child : null;
}

export function isClarifyApplicable(form: Form): boolean {
  return invertibleChild(form) !== null;
}

/**
 * Applies Clarify (Inversion axiom, removal direction): ([A]) = A or [(A)] = A
 * Removes paired round-square or square-round boundaries.
 *
 * @param form The top-level form to clarify
 * @returns Array of forms after clarification, empty array for void
 */
export function clarify(form: Form): Form[] {
  const child = invertibleChild(form);
  if (!child) {
    // No paired boundary to remove; return the original form clone.
    return [deepClone(form)];
  }

  // ([A]) = A or [(A)] = A, so return clones of the inner children.
  return [...child.children].map(deepClone);
}

/**
 * Applies Enfold (Inversion axiom, addition direction): A = ([A]) or A = [(A)]
 * Adds paired boundaries around the form.
 *
 * @param form The form to enfold
 * @returns The form wrapped in paired boundaries: ([form])
 */
export function enfold(form: Form): Form {
  // Create ([form]) - round containing square containing the form
  const innerSquare = {
    id: crypto.randomUUID(),
    boundary: "square" as BoundaryType,
    children: new Set([deepClone(form)]),
  };
  return {
    id: crypto.randomUUID(),
    boundary: "round" as BoundaryType,
    children: new Set([innerSquare]),
  };
}
