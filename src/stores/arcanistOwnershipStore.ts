import { defineStore } from "pinia";

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
      return this.entries.find(
        (entry) => entry.Id === id && entry.source === "tracker",
      );
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

      const trackerEntry = this.getTrackerEntry(id);
      if (trackerEntry) {
        return trackerEntry;
      }

      return this.getEntry(id);
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
        currentResonance: 0,
        currentPortrait: 0,
        currentEuphoria: [],
        currentEuphoriaEnabled: [],
        source: "manual",
      });
    },
    setOwnedFromTracker(id: number, name: string, isOwned: boolean) {
      const existing = this.entries.find(
        (entry) => entry.Id === id && entry.source === "tracker",
      );
      if (existing) {
        existing.isOwned = isOwned;
        existing.Name = name;
        return;
      }

      this.entries = this.entries.filter(
        (entry) => entry.Id !== id || entry.source !== "tracker",
      );
      this.entries.push({
        Id: id,
        Name: name,
        isOwned,
        currentLevel: 1,
        currentInsight: 0,
        currentResonance: 0,
        currentPortrait: 0,
        currentEuphoria: [],
        currentEuphoriaEnabled: [],
        source: "tracker",
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
          currentResonance: updates.currentResonance ?? 0,
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
