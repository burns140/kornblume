import { beforeEach, describe, expect, it } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import type { IArcanist } from "@/types";
import { usePlannerStore } from "./plannerStore";

const arcanist: IArcanist = {
  Id: 1,
  Name: "Test Arcanist",
  Afflatus: "Star",
  Rarity: 6,
  IsReleased: true,
  Insight: [],
  Resonance: [],
  Frequency: [],
  Euphoria: [
    { Id: 1, Material: [], Quantity: [] },
    { Id: 2, Material: [], Quantity: [] },
  ],
  Mastery: [],
};

describe("usePlannerStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it.each([
    ["complete", [] as number[], 0],
    ["completeEuphoria", [2], 4],
  ] as const)(
    "adds %s characters disabled with the requested completed goals",
    (mode, euphoria, mastery) => {
      const store = usePlannerStore();
      store.addDefaultArcanist(arcanist, mode);

      expect(store.selectedArcanists).toEqual([
        {
          Id: 1,
          isVisible: false,
          currentInsight: 3,
          currentLevel: 30,
          goalInsight: 3,
          goalLevel: 30,
          currentResonance: 10,
          goalResonance: 10,
          frequency: [],
          euphoria,
          completedEuphorias: euphoria,
          currentMastery: mastery,
          goalMastery: mastery,
        },
      ]);
    },
  );

  it("keeps new characters enabled", () => {
    const store = usePlannerStore();
    store.addDefaultArcanist(arcanist, "new");

    expect(store.selectedArcanists[0].isVisible).toBe(true);
    expect(store.selectedArcanists[0].currentInsight).toBe(0);
    expect(store.selectedArcanists[0].currentLevel).toBe(1);
    expect(store.selectedArcanists[0].euphoria).toEqual([2]);
    expect(store.selectedArcanists[0].goalMastery).toBe(4);
  });
});
