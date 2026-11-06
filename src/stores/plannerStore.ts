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
    addDefaultArcanist(arcanist: IArcanist) {
      if (this.hasArcanist(arcanist.Id)) return;
      const euphorias = arcanist.Euphoria ?? [];
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
        euphoria:
          euphorias.length > 0 ? [euphorias[euphorias.length - 1].Id] : [],
        currentMastery: 0,
        goalMastery: euphorias.length > 0 ? 4 : 0,
      });
    },
  },
  persist: true,
});
