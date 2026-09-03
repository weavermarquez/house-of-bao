/-
Test bed for remote proof search (Aristotle) and for the local prove/review
loop. Each `sorry` below is a genuine hole: true, non-trivial enough that
`simp` alone will not close it, but small enough to be a fair smoke test.

Success criterion (borrowed from lean4-skills):
  `lake build` passes, zero `sorry`, zero custom axioms (`#print axioms`).
-/
import Mathlib

namespace Sorries

/-- Warm-up: propositional, no Mathlib lemmas needed. Should be instant. -/
theorem contrapositive_iff (p q : Prop) : (p → q) ↔ (¬q → ¬p) := by
  sorry

/-- Order theory: a monotone involution on a linear order is the identity.
    Needs a case split on trichotomy plus the involution hypothesis. -/
theorem monotone_involution_id {α : Type*} [LinearOrder α] (f : α → α)
    (hmono : Monotone f) (hinv : ∀ x, f (f x) = x) : ∀ x, f x = x := by
  sorry

/-- Modal-logic flavoured: the Löb-style fixpoint schema is *not* derivable
    for an arbitrary predicate, so this is the sound weakening. -/
theorem box_distrib {W : Type*} (R : W → W → Prop) (P Q : W → Prop) (w : W)
    (h : ∀ v, R w v → (P v → Q v)) (hp : ∀ v, R w v → P v) :
    ∀ v, R w v → Q v := by
  sorry

end Sorries
