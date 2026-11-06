import { defineStore } from "pinia";
import {
  IArcanists,
  ICharacterTier,
  ICharacterTierListData,
  IFormulas,
  IItems,
  IPsychubes,
  IShops,
  IStages,
  ITeam,
  ITeamsData,
} from "@/types";
import { parseSheetCharacterTiers } from "@/composables/characterTiers";
import { parseArchetypeTeams } from "@/composables/teams";
import { SHEET_GIDS, fetchSheetCsv } from "@/utils/googleSheet";

interface IDataStore {
  characterTiers: ICharacterTierListData | null;
  teams: ITeamsData | null;
  sheetCharacterTiers: ICharacterTier[];
  sheetTeams: ITeam[];
  arcanists: IArcanists;
  stages: IStages;
  stages1_4_greedy: IStages;
  stages1_7_greedy: IStages;
  stages1_9_greedy: IStages;
  stages2_8_greedy: IStages;
  stages3_3_greedy: IStages;
  formulas: IFormulas;
  items: IItems;
  psychubes: IPsychubes;
  shops: IShops;
}

const getDataSize = (data) => {
  if (!data) {
    return 0;
  }
  return data.constructor === Object
    ? Object.keys(data).length
    : data.length || 0;
};

export const useDataStore = defineStore("dataStore", {
  state: (): IDataStore => ({
    characterTiers: null,
    teams: null,
    sheetCharacterTiers: [],
    sheetTeams: [],
    arcanists: [],
    stages: {},
    stages1_4_greedy: {},
    stages1_7_greedy: {},
    stages1_9_greedy: {},
    stages2_8_greedy: {},
    stages3_3_greedy: {},
    formulas: [],
    items: [],
    psychubes: [],
    shops: [],
  }),
  actions: {
    async loadJsonData(module: string) {
      console.log("DataStore", `fetching ${module}...`);
      return fetch(`./data/${module}.json`)
        .then((response) => response.json())
        .then((json) => {
          this[module] = json;
        });
    },
    async checkAndLoadJsonData(module: string) {
      if (getDataSize(this[module]) === 0) {
        return this.loadJsonData(module);
      } else {
        return Promise.resolve();
      }
    },
    async checkDataLoaded(modules: string[]) {
      return Promise.all(
        modules.map((module) => this.checkAndLoadJsonData(module)),
      );
    },
    // Community spreadsheet data is fetched live and cached for the session
    async loadSheetTeams() {
      if (this.sheetTeams.length > 0) {
        return;
      }
      const teams = parseArchetypeTeams(
        await fetchSheetCsv(SHEET_GIDS.archetypes, "B13:I1000"),
      );
      if (teams.length === 0) {
        throw new Error("No teams were found in the spreadsheet");
      }
      this.sheetTeams = teams;
    },
    async loadSheetCharacterTiers() {
      if (this.sheetCharacterTiers.length > 0) {
        return;
      }
      const characters = parseSheetCharacterTiers(
        await fetchSheetCsv(SHEET_GIDS.characterTiers),
      );
      if (characters.length === 0) {
        throw new Error("No characters were found in the spreadsheet");
      }
      this.sheetCharacterTiers = characters;
    },
  },
});
