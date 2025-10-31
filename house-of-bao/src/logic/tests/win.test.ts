import { describe, expect, it } from "vitest";
import {
  round,
  square,
  angle,
  atom,
  formsEquivalent,
  forestsEquivalent,
  checkWinCondition,
} from "../index";

describe("win condition helpers", () => {
  it("considers identical structures equivalent regardless of ids", () => {
    const left = round(square(round()), atom("x"));
    const right = round(square(round()), atom("x"));
    expect(formsEquivalent(left, right)).toBe(true);
  });

  it("rejects structurally different forms", () => {
    const left = round(square(round()));
    const right = round(angle(round()));
    expect(formsEquivalent(left, right)).toBe(false);
  });

  it("compares forests ignoring sibling order", () => {
    const forestA = [round(angle()), square()];
    const forestB = [square(), round(angle())];
    expect(forestsEquivalent(forestA, forestB)).toBe(true);
  });

  it("requires matching forest sizes", () => {
    const forestA = [round(), square()];
    const forestB = [round()];
    expect(forestsEquivalent(forestA, forestB)).toBe(false);
  });

  it("checkWinCondition delegates to forest comparison", () => {
    const current = [round(square(round())), angle()];
    const goal = [angle(), round(square(round()))];
    expect(checkWinCondition(current, goal)).toBe(true);
  });
});
