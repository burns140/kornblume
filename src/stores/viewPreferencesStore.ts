import { defineStore } from "pinia";

export type TeamsSource = "prydwen" | "archetypes";
export type CharacterTiersSource = "prydwen" | "sheet";

interface IViewPreferencesStore {
  teamsSource: TeamsSource;
  teamsOnlyBuildable: boolean;
  characterTiersSource: CharacterTiersSource;
  characterTiersOnlyOwned: boolean;
}

// UI selections remembered across visits; deliberately not part of data backups
export const useViewPreferencesStore = defineStore("viewPreferences", {
  state: (): IViewPreferencesStore => ({
    teamsSource: "prydwen",
    teamsOnlyBuildable: false,
    characterTiersSource: "prydwen",
    characterTiersOnlyOwned: false,
  }),
  persist: true,
});
