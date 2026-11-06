import { defineStore } from "pinia";
import { IArcanist, ISelectedArcanist } from "@/types";

interface IPlannerStore {
  selectedArcanists: ISelectedArcanist[];
}

export const usePlannerStore = defineStore("planner", {
  state: (): IPlannerStore => ({
    selectedArcanists: [],
  }),
  getters: {
    hasArcanist: (state) => (id: number) =>
      state.selectedArcanists.some((arc) => Number(arc.Id) === Number(id)),
  },
  actions: {
    addDefaultArcanist(
      arcanist: IArcanist,
      mode: "new" | "complete" | "completeEuphoria" = "new",
    ) {
      if (this.hasArcanist(arcanist.Id)) return;
      const euphorias = arcanist.Euphoria ?? [];
      const lastEuphoria =
        euphorias.length > 0 ? [euphorias[euphorias.length - 1].Id] : [];
      if (mode === "new") {
        this.selectedArcanists.push({
          Id: arcanist.Id,
          isVisible: true,
          currentInsight: 0,
          currentLevel: 1,
          goalInsight: 3,
          goalLevel: 30,
          currentResonance: 0,
          goalResonance: 10,
          frequency: [],
          euphoria: lastEuphoria,
          currentMastery: 0,
          goalMastery: euphorias.length > 0 ? 4 : 0,
        });
        return;
      }
      const withEuphoria = mode === "completeEuphoria" && lastEuphoria.length > 0;
      const mastery = withEuphoria ? 4 : 0;
      this.selectedArcanists.push({
        Id: arcanist.Id,
        isVisible: false,
        currentInsight: 3,
        currentLevel: 30,
        goalInsight: 3,
        goalLevel: 30,
        currentResonance: 10,
        goalResonance: 10,
        frequency: [],
        euphoria: withEuphoria ? lastEuphoria : [],
        completedEuphorias: withEuphoria ? lastEuphoria : [],
        currentMastery: mastery,
        goalMastery: mastery,
      });
    },
  },
  persist: true,
});
