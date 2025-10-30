import { type Form, noop, deepClone, type BoundaryType } from "./Form";

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

/**
 * Applies Enfold (Inversion axiom, addition direction): A = ([A]) or A = [(A)]
 * Adds paired boundaries around the form.
 */
function wrapWithPair(
  form: Form,
  outer: BoundaryType,
  inner: BoundaryType,
): Form {
  const innerWrapper = {
    id: crypto.randomUUID(),
    boundary: inner,
    children: new Set<Form>([deepClone(form)]),
  };
  return {
    id: crypto.randomUUID(),
    boundary: outer,
    children: new Set<Form>([innerWrapper]),
  };
}

/**
 * Adds round outer/square inner boundaries: ([form]).
 */
export function enfoldRoundSquare(form: Form): Form {
  return wrapWithPair(form, "round", "square");
}

/**
 * Adds square outer/round inner boundaries: [(form)].
 */
export function enfoldSquareRound(form: Form): Form {
  return wrapWithPair(form, "square", "round");
}

/**
 * Default enfold (round outer, square inner) for backward compatibility.
 */
export function enfold(form: Form): Form {
  return enfoldRoundSquare(form);
}
