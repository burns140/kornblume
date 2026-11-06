import { describe, expect, it } from "vitest";
import type { IArcanist, ISelectedArcanist } from "@/types";
import { isPlannerGoalComplete } from "./plannerProgress";

const completed: ISelectedArcanist = {
  Id: 1,
  isVisible: false,
  currentInsight: 3,
  currentLevel: 30,
  goalInsight: 3,
  goalLevel: 30,
  currentResonance: 10,
  goalResonance: 10,
  frequency: [],
  euphoria: [2],
  completedEuphorias: [2],
  currentMastery: 4,
  goalMastery: 4,
};
const character: IArcanist = {
  Id: 1,
  Name: "Test",
  Afflatus: "Star",
  Rarity: 6,
  IsReleased: true,
  Insight: [],
  Resonance: [],
  Frequency: [],
  Euphoria: [{ Id: 2, Material: [], Quantity: [] }],
  Mastery: [],
};

describe("isPlannerGoalComplete", () => {
  it("recognizes complete goals regardless of planner visibility", () => {
    expect(isPlannerGoalComplete(completed, character)).toBe(true);
    expect(isPlannerGoalComplete({ ...completed, isVisible: true }, character)).toBe(true);
  });

  it.each([
    { currentInsight: 2 },
    { currentLevel: 29 },
    { currentResonance: 9 },
    { currentMastery: 3 },
    { currentInsight: 4 },
    { currentLevel: 31 },
    { currentResonance: 11 },
  ])("recognizes incomplete goals: %o", (changes) => {
    expect(isPlannerGoalComplete({ ...completed, ...changes }, character)).toBe(false);
  });

  it("does not require mastery for a character without Euphoria", () => {
    expect(
      isPlannerGoalComplete({
        ...completed,
        currentMastery: 0,
      }, { ...character, Euphoria: [] }),
    ).toBe(true);
  });

  it("does not assume completion when character data is unavailable", () => {
    expect(isPlannerGoalComplete(completed, undefined)).toBe(false);
  });

  it("requires the last Euphoria to be recorded as completed", () => {
    expect(isPlannerGoalComplete({ ...completed, completedEuphorias: [] }, character)).toBe(false);
    expect(isPlannerGoalComplete({ ...completed, completedEuphorias: undefined }, character)).toBe(false);
    expect(isPlannerGoalComplete({ ...completed, completedEuphorias: [1] }, character)).toBe(false);
  });
});
