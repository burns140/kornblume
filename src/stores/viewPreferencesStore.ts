import { defineStore } from "pinia";
import type { SheetMode } from "@/composables/characterTiers";

export type TeamsSource = "prydwen" | "archetypes";
export type CharacterTiersSource = "prydwen" | "sheet";

interface IViewPreferencesStore {
  teamsSource: TeamsSource;
  teamsOnlyBuildable: boolean;
  characterTiersSource: CharacterTiersSource;
  characterTiersMode: SheetMode;
  characterTiersOnlyOwned: boolean;
}

// UI selections remembered across visits; deliberately not part of data backups
export const useViewPreferencesStore = defineStore("viewPreferences", {
  state: (): IViewPreferencesStore => ({
    teamsSource: "prydwen",
    teamsOnlyBuildable: false,
    characterTiersSource: "prydwen",
    characterTiersMode: "overall",
    characterTiersOnlyOwned: false,
  }),
  persist: true,
});
