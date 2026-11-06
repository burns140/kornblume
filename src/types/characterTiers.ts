export type ICharacterTierRole =
  | "damage-dealer"
  | "sub-carry"
  | "support"
  | "survival";

export interface ICharacterTier {
  name: string;
  slug: string;
  tier: string;
  role: ICharacterTierRole;
  tags: string;
  score?: number;
  modeScores?: Partial<Record<string, number>>;
}

export interface ICharacterTierListData {
  source: string;
  scrapedAt: string;
  version: string;
  characters: ICharacterTier[];
}
