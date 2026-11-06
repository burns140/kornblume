import { defineStore } from "pinia";
import type { SheetMode } from "@/composables/characterTiers";

export type TeamsSource = "prydwen" | "archetypes";
export type CharacterTiersSource = "prydwen" | "sheet";

interface IViewPreferencesStore {
  teamsSource: TeamsSource;
  teamsOnlyBuildable: boolean;
  teamsPortraits: boolean;
  characterTiersSource: CharacterTiersSource;
  characterTiersMode: SheetMode;
  characterTiersOnlyOwned: boolean;
  characterTiersPortraits: boolean;
}

// UI selections remembered across visits; deliberately not part of data backups
export const useViewPreferencesStore = defineStore("viewPreferences", {
  state: (): IViewPreferencesStore => ({
    teamsSource: "prydwen",
    teamsOnlyBuildable: false,
    teamsPortraits: false,
    characterTiersSource: "prydwen",
    characterTiersMode: "overall",
    characterTiersOnlyOwned: false,
    characterTiersPortraits: false,
  }),
  persist: true,
});
