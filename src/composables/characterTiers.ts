import type {
  IArcanist,
  ICharacterTier,
  ICharacterTierRole,
} from "@/types";
import { parseCsv } from "@/utils/csv";
import { normalizeName } from "@/utils/teamMatching";

export interface IResolvedCharacterTierEntry {
  character: ICharacterTier;
  arcanistId: number | null;
  owned: boolean;
}

export interface ICharacterTierGroup {
  tier: string;
  roles: {
    role: ICharacterTierRole;
    characters: IResolvedCharacterTierEntry[];
  }[];
}

const roleOrder: ICharacterTierRole[] = [
  "damage-dealer",
  "sub-carry",
  "support",
  "survival",
];

const sheetRoles: Record<string, ICharacterTierRole> = {
  carry: "damage-dealer",
  utility: "support",
  sustain: "survival",
};

const sheetScoreTiers = [
  { above: 9, label: "9.1-10" },
  { above: 8, label: "8.1-9" },
  { above: 7, label: "7.1-8" },
  { above: 6, label: "6.1-7" },
  { above: 5, label: "5.1-6" },
];
const lowestSheetTier = "≤ 5.0";

export function sheetScoreTier(score: number): string {
  return (
    sheetScoreTiers.find((tier) => score > tier.above)?.label ??
    lowestSheetTier
  );
}

// Sheet names carry decorations: CN-only "*" and version "[3.9]". The engraving
// "(E1)" is kept because the same character can be listed once per engraving.
const cleanSheetName = (name: string) =>
  name
    .replace(/\[[^\]]*\]|\*/g, "")
    .replace(/\s+/g, " ")
    .trim();

// Each character is a multi-row block starting at its "Character Performance" row.
// Column indexes: 1 = name/role, 3 = labels and scores, 4 = final score, 6 = kit tags.
export function parseSheetCharacterTiers(csv: string): ICharacterTier[] {
  const rows = parseCsv(csv);
  const cell = (row: number, column: number) =>
    (rows[row]?.[column] ?? "").trim();
  const starts = rows
    .map((_, row) => row)
    .filter(
      (row) => cell(row, 1) && cell(row, 3).startsWith("Character Performance"),
    );

  const characters: ICharacterTier[] = [];
  starts.forEach((start, i) => {
    const end = starts[i + 1] ?? rows.length;
    let scoreLabelRow = -1;
    for (let row = start; row < end && scoreLabelRow < 0; row += 1) {
      if (cell(row, 3) === "Base Score") {
        scoreLabelRow = row;
      }
    }
    if (scoreLabelRow < 0) {
      return;
    }

    const score = parseFloat(cell(scoreLabelRow + 1, 4));
    let role: ICharacterTierRole | undefined;
    for (
      let row = scoreLabelRow + 1;
      row < Math.min(end, scoreLabelRow + 8) && !role;
      row += 1
    ) {
      role = sheetRoles[cell(row, 1).toLowerCase()];
    }

    let tags = "";
    for (let row = start; row < scoreLabelRow && !tags; row += 1) {
      tags = cell(row, 6);
    }

    const name = cleanSheetName(cell(start, 1));
    if (!name || Number.isNaN(score) || !role) {
      return;
    }

    characters.push({
      name,
      // Not normalizeName: it ignores the engraving, and slugs must stay unique
      slug: name.toLowerCase().replace(/[^a-z0-9]/g, ""),
      tier: sheetScoreTier(score),
      role,
      tags,
      score,
    });
  });

  return characters.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
}

export function resolveCharacterTiers(
  characters: ICharacterTier[],
  arcanists: IArcanist[],
  isOwned: (id: number) => boolean,
  onlyOwned = false,
): ICharacterTierGroup[] {
  const arcanistsByName = new Map(
    arcanists.map((arcanist) => [normalizeName(arcanist.Name), arcanist]),
  );
  const tiers = new Map<string, IResolvedCharacterTierEntry[]>();

  for (const character of characters) {
    const arcanist = arcanistsByName.get(normalizeName(character.name));
    const owned = !!arcanist && isOwned(arcanist.Id);
    if (onlyOwned && !owned) {
      continue;
    }

    if (!tiers.has(character.tier)) {
      tiers.set(character.tier, []);
    }
    tiers.get(character.tier)!.push({
      character,
      arcanistId: arcanist?.Id ?? null,
      owned,
    });
  }

  return [...tiers.entries()].map(([tier, tierCharacters]) => ({
    tier,
    roles: roleOrder
      .map((role) => ({
        role,
        characters: tierCharacters.filter(
          (entry) => entry.character.role === role,
        ),
      }))
      .filter((group) => group.characters.length > 0),
  }));
}
