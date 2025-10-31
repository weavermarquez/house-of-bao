import {
  type Form,
  canonicalSignature,
  canonicalSignatureForest,
} from "./Form";

/**
 * Returns true when two forms are structurally identical, ignoring runtime ids
 * and sibling ordering.
 */
export function formsEquivalent(left: Form, right: Form): boolean {
  return canonicalSignature(left) === canonicalSignature(right);
}

/**
 * Returns true when two forests (unordered collections of root forms) are
 * structurally identical, ignoring runtime ids and sibling ordering within
 * each form.
 */
export function forestsEquivalent(left: Form[], right: Form[]): boolean {
  if (left.length !== right.length) {
    return false;
  }

  const leftSignatures = canonicalSignatureForest(left);
  const rightSignatures = canonicalSignatureForest(right);
  return leftSignatures.every(
    (signature, index) => signature === rightSignatures[index],
  );
}

/**
 * Determines whether the player's current forest satisfies the supplied goal
 * forest. Both collections must contain forms that match exactly; there is no
 * subset or superset matching.
 */
export function checkWinCondition(
  current: Form[],
  goal: Form[],
): boolean {
  return forestsEquivalent(current, goal);
}
