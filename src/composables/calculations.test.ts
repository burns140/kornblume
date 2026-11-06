import { beforeAll, describe, expect, it } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useDataStore } from "@/stores/dataStore";

describe("Euphoria material requirements", () => {
  let useCalculation: typeof import("./calculations").useCalculation;

  beforeAll(async () => {
    setActivePinia(createPinia());
    useDataStore().arcanists.push({
      Id: 1,
      Name: "Test",
      Afflatus: "Star",
      Rarity: 6,
      IsReleased: true,
      Insight: [],
      Resonance: [],
      Frequency: [],
      Euphoria: [{ Id: 2, Material: ["Euphoria Material"], Quantity: [3] }],
      Mastery: [],
    });
    ({ useCalculation } = await import("./calculations"));
  });

  it("only counts Euphoria materials until that Euphoria is completed", () => {
    const entry = {
      Id: 1,
      isVisible: true,
      currentInsight: 3,
      currentLevel: 30,
      goalInsight: 3,
      goalLevel: 30,
      currentResonance: 10,
      goalResonance: 10,
      frequency: [],
      euphoria: [2],
      currentMastery: 4,
      goalMastery: 4,
    };

    expect(useCalculation(entry)).toContainEqual({
      Material: "Euphoria Material",
      Quantity: 3,
    });
    expect(useCalculation({ ...entry, completedEuphorias: [2] })).toEqual([]);
  });
});
