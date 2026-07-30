import { defineStore } from "pinia";
import { useDataStore } from "@/stores/dataStore";
import { usePullsRecordStore } from "@/stores/pullsRecordStore";

export type OwnershipSource = "manual" | "tracker" | "none";

export interface IArcanistOwnershipEntry {
  Id: number;
  Name: string;
  isOwned: boolean;
  currentLevel: number;
  currentInsight: number;
  currentResonance: number;
  currentPortrait: number;
  currentEuphoria: number[];
  currentEuphoriaEnabled: boolean[];
  source: OwnershipSource;
}

interface IArcanistOwnershipStoreState {
  entries: IArcanistOwnershipEntry[];
}

export const useArcanistOwnershipStore = defineStore("arcanistOwnership", {
  state: (): IArcanistOwnershipStoreState => ({
    entries: [],
  }),
  getters: {
    ownedIds: (state) =>
      state.entries.filter((entry) => entry.isOwned).map((entry) => entry.Id),
    getOwnedArcanists: (state) =>
      state.entries.filter((entry) => entry.isOwned),
  },
  actions: {
    getEntry(id: number) {
      return this.entries.find((entry) => entry.Id === id);
    },
    getTrackerEntry(id: number) {
      const pullsStore = usePullsRecordStore();
      const dataStore = useDataStore();
      const arcanist = dataStore.arcanists.find((arc) => arc.Id === id);
      if (!arcanist) {
        return undefined;
      }

      const pullCount = pullsStore.data.filter(
        (pull) => pull.ArcanistName === arcanist.Name,
      ).length;
      const portrait = pullCount > 0 ? pullCount - 1 : -1;
      if (portrait < 0) {
        return undefined;
      }

      return {
        Id: id,
        Name: arcanist.Name,
        isOwned: true,
        currentLevel: 1,
        currentInsight: 0,
        currentResonance: 1,
        currentPortrait: portrait,
        currentEuphoria: [],
        currentEuphoriaEnabled: [],
        source: "tracker",
      };
    },
    getManualEntry(id: number) {
      return this.entries.find(
        (entry) => entry.Id === id && entry.source === "manual",
      );
    },
    getEffectiveEntry(id: number) {
      const manualEntry = this.getManualEntry(id);
      if (manualEntry) {
        return manualEntry;
      }

      return this.getTrackerEntry(id);
    },
    setOwned(id: number, name: string, isOwned: boolean) {
      const existing = this.entries.find(
        (entry) => entry.Id === id && entry.source === "manual",
      );
      if (existing) {
        existing.isOwned = isOwned;
        existing.Name = name;
        return;
      }

      this.entries = this.entries.filter(
        (entry) => entry.Id !== id || entry.source !== "manual",
      );
      this.entries.push({
        Id: id,
        Name: name,
        isOwned,
        currentLevel: 1,
        currentInsight: 0,
        currentResonance: 1,
        currentPortrait: 0,
        currentEuphoria: [],
        currentEuphoriaEnabled: [],
        source: "manual",
      });
    },
    upsertEntry(entry: IArcanistOwnershipEntry) {
      const existing = this.entries.find(
        (item) => item.Id === entry.Id && item.source === entry.source,
      );
      if (existing) {
        Object.assign(existing, entry);
        return;
      }

      this.entries = this.entries.filter(
        (item) => item.Id !== entry.Id || item.source !== entry.source,
      );
      this.entries.push(entry);
    },
    updateEntry(id: number, updates: Partial<IArcanistOwnershipEntry>) {
      const existing = this.entries.find(
        (entry) => entry.Id === id && entry.source === "manual",
      );
      if (!existing) {
        this.entries = this.entries.filter(
          (entry) => entry.Id !== id || entry.source !== "manual",
        );
        this.entries.push({
          Id: id,
          Name: updates.Name ?? "",
          isOwned: updates.isOwned ?? false,
          currentLevel: updates.currentLevel ?? 1,
          currentInsight: updates.currentInsight ?? 0,
          currentResonance: updates.currentResonance ?? 1,
          currentPortrait: updates.currentPortrait ?? 0,
          currentEuphoria: Array.isArray(updates.currentEuphoria)
            ? updates.currentEuphoria
            : updates.currentEuphoria !== undefined
              ? [updates.currentEuphoria]
              : [],
          currentEuphoriaEnabled: Array.isArray(updates.currentEuphoriaEnabled)
            ? updates.currentEuphoriaEnabled
            : updates.currentEuphoriaEnabled !== undefined
              ? [updates.currentEuphoriaEnabled]
              : [],
          source: "manual",
        });
        return;
      }

      Object.assign(existing, updates);
    },
    removeEntry(id: number) {
      this.entries = this.entries.filter((entry) => entry.Id !== id);
    },
    clear() {
      this.entries = [];
    },
  },
  persist: true,
});
