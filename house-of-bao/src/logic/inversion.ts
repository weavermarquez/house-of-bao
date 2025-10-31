import {
  type Form,
  noop,
  round,
  square,
  deepClone,
  type BoundaryType,
} from "./Form";

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
    return noop(form);
  }

  // ([A]) = A or [(A)] = A, so return clones of the inner children.
  return [...child.children].map(deepClone);
}

function invertiblePair(self: BoundaryType, child: BoundaryType): boolean {
  return (
    (self === "round" && child === "square") ||
    (self === "square" && child === "round")
  );
}

export function invertibleChild(form: Form): Form | null {
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

export function enfold(variant: "frame" | "mark", ...forms: Form[]): Form {
  const clonedForms = forms.map(deepClone);
  if (variant === "mark") {
    return square(round(...clonedForms));
  } else {
    // (variant === "frame")
    return round(square(...clonedForms));
  }
}
