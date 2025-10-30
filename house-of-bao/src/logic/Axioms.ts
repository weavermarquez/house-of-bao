import {
  type Form,
  type BoundaryType,
  round,
  square,
  canonicalSignature,
} from "./Form";

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

function noop(form: Form): Form[] {
  return [deepClone(form)];
}

function getSquareChildren(form: Form): Form[] {
  return [...form.children].filter((child) => child.boundary === "square");
}

type FramePartition = {
  picked: Form[];
  remaining: Form[];
};

/**
 * Partitions the available square contents into the subset the caller asked to
 * distribute (`picked`) and the subset that should stay behind (`remaining`).
 *
 * - When no ids are supplied, we interpret that as "pick everything".
 * - If any requested id is unknown, we return null so the caller can treat the
 *   entire disperse attempt as a no-op.
 */
function partitionFrameContents(
  available: Form[],
  requestedIds?: string[],
): FramePartition | null {
  if (!requestedIds || requestedIds.length === 0) {
    return {
      picked: available,
      remaining: [],
    };
  }

  const lookup = new Map<string, Form>();
  for (const entry of available) {
    lookup.set(entry.id, entry);
  }

  const seen = new Set<string>();
  const picked: Form[] = [];

  for (const id of requestedIds) {
    if (seen.has(id)) {
      continue;
    }
    seen.add(id);
    const match = lookup.get(id);
    if (!match) {
      return null;
    }
    picked.push(match);
  }

  if (picked.length === 0) {
    return null;
  }

  const remaining = available.filter((entry) => !seen.has(entry.id));
  return { picked, remaining };
}

function cloneFrame(contextForms: Form[], contents: Form[]): Form {
  const contextClones = contextForms.map((context) => deepClone(context));
  const contentsClones = contents.map((content) => deepClone(content));
  return round(...contextClones, square(...contentsClones));
}

function arraysEqual<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) {
    return false;
  }

  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) {
      return false;
    }
  }

  return true;
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
    return noop(form);
  }

  // ([A]) = A or [(A)] = A, so return clones of the inner children.
  return [...child.children].map(deepClone);
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

export function isFrame(form: Form): boolean {
  if (form.boundary !== "round") {
    return false;
  }

  return getSquareChildren(form).length > 0;
}

export type DisperseOptions = {
  squareId?: string;
  contentIds?: string[];
};

/**
 * Applies Disperse (Arrangement axiom, distribution direction):
 * (A [B C]) ⇒ (A [B])(A [C])
 *
 * @param form Round form potentially containing one or more square children
 * @param options Optional selection of which square (by id) and which contents (by id) to split
 * @returns Array of round forms after dispersal, or clones of the original form when not applicable
 */
export function disperse(form: Form, options?: DisperseOptions): Form[] {
  if (!isFrame(form)) {
    return noop(form);
  }

  const frameSquares = getSquareChildren(form);
  const targetSquare = options?.squareId
    ? frameSquares.find((square) => square.id === options.squareId)
    : frameSquares[0];

  if (!targetSquare) {
    return noop(form);
  }

  if (targetSquare.children.size === 0) {
    // Dominion theorem: (context [ ]) ⇒ void. Disperse therefore yields no frames.
    return [];
  }

  const frameContents = [...targetSquare.children];

  const selection = partitionFrameContents(frameContents, options?.contentIds);
  if (!selection) {
    return noop(form);
  }

  const { picked: pickedContents, remaining: remainingContents } = selection;
  const frameContext = [...form.children].filter(
    (child) => child !== targetSquare,
  );

  const distributedFrames = pickedContents.map((content) =>
    cloneFrame(frameContext, [content]),
  );
  if (remainingContents.length === 0) {
    return distributedFrames;
  }

  const remainderFrame = cloneFrame(frameContext, remainingContents);
  return [remainderFrame, ...distributedFrames];
}

export function isCollectApplicable(forms: Form[]): boolean {
  if (forms.length === 0) {
    return false;
  }

  const template = forms[0];
  if (template.boundary !== "round") {
    return false;
  }

  const templateSquares = getSquareChildren(template);
  if (templateSquares.length !== 1) {
    return false;
  }

  const [templateSquare] = templateSquares;
  if (!templateSquare || templateSquare.children.size === 0) {
    return false;
  }

  const templateContextSignatures = [...template.children]
    .filter((child) => child !== templateSquare)
    .map((child) => canonicalSignature(child))
    .sort();

  for (const form of forms) {
    if (form.boundary !== "round") {
      return false;
    }

    const frameSquaresForForm = getSquareChildren(form);
    if (frameSquaresForForm.length !== 1) {
      return false;
    }

    const [frameSquare] = frameSquaresForForm;
    if (!frameSquare || frameSquare.children.size === 0) {
      return false;
    }

    const contextSignatures = [...form.children]
      .filter((child) => child !== frameSquare)
      .map((child) => canonicalSignature(child))
      .sort();

    if (!arraysEqual(contextSignatures, templateContextSignatures)) {
      return false;
    }
  }

  return true;
}

/**
 * Applies Collect (Arrangement axiom, aggregation direction):
 * (A [B])(A [C]) ⇒ (A [B C])
 *
 * @param forms Array of round forms to attempt combination
 * @returns Array containing the combined round form when applicable,
 *          or deep clones of the original forms otherwise.
 */
export function collect(forms: Form[]): Form[] {
  if (!isCollectApplicable(forms)) {
    return forms.map((form) => deepClone(form));
  }

  const template = forms[0];
  const [templateSquare] = getSquareChildren(template);
  if (!templateSquare) {
    return forms.map((form) => deepClone(form));
  }

  const templateContext = [...template.children].filter(
    (child) => child !== templateSquare,
  );
  const combinedSquareChildren: Form[] = [];
  for (const form of forms) {
    const frameSquare = getSquareChildren(form)[0]!;
    for (const content of frameSquare.children) {
      combinedSquareChildren.push(deepClone(content));
    }
  }

  const combinedSquare: Form = {
    id: crypto.randomUUID(),
    boundary: "square",
    children: new Set<Form>(combinedSquareChildren),
  };

  const combinedChildren = templateContext.map((child) => deepClone(child));
  combinedChildren.push(combinedSquare);

  const combinedRound: Form = {
    id: crypto.randomUUID(),
    boundary: "round",
    children: new Set<Form>(combinedChildren),
  };

  return [combinedRound];
}
