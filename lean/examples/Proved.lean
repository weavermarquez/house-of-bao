import Mathlib

namespace Proved

theorem contrapositive_iff (p q : Prop) : (p → q) ↔ (¬q → ¬p) := by
  tauto

theorem monotone_involution_id {α : Type*} [LinearOrder α] (f : α → α)
    (hmono : Monotone f) (hinv : ∀ x, f (f x) = x) : ∀ x, f x = x := by
  intro x
  rcases lt_trichotomy (f x) x with h | h | h
  · have hle := hmono h.le
    rw [hinv] at hle
    exact absurd h (not_lt.mpr hle)
  · exact h
  · have hle := hmono h.le
    rw [hinv] at hle
    exact absurd h (not_lt.mpr hle)

theorem box_distrib {W : Type*} (R : W → W → Prop) (P Q : W → Prop) (w : W)
    (h : ∀ v, R w v → (P v → Q v)) (hp : ∀ v, R w v → P v) :
    ∀ v, R w v → Q v := by
  intro v hv
  exact h v hv (hp v hv)

end Proved

#print axioms Proved.contrapositive_iff
#print axioms Proved.monotone_involution_id
#print axioms Proved.box_distrib
