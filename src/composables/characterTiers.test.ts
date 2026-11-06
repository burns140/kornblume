import { describe, expect, it } from "vitest";
import type { IArcanist, ICharacterTier } from "@/types";
import {
  parseSheetCharacterTiers,
  resolveCharacterTiers,
  sheetScoreTier,
  withSheetMode,
} from "./characterTiers";

const arcanists = [
  { Id: 1, Name: "Tooth Fairy" },
  { Id: 2, Name: "Beryl" },
] as IArcanist[];

// Builds one character block laid out like the community sheet (11 columns)
function sheetBlock(
  name: string,
  tags: string,
  final: string,
  role: string,
): string[][] {
  const row = (cells: Record<number, string>) =>
    Array.from({ length: 11 }, (_, i) => cells[i] ?? "");
  return [
    row({ 1: name, 3: "Character Performance" }),
    row({ 3: "Limbo", 5: "◆", 6: tags }),
    row({ 3: "9" }),
    row({ 3: "Base Score" }),
    row({ 3: "6.0", 4: final }),
    row({ 1: role, 3: "Team Multiplier" }),
    row({ 1: "Easy", 3: "10" }),
  ];
}

const toCsv = (rows: string[][]) =>
  rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");

describe("sheetScoreTier", () => {
  it("buckets scores into the requested ranges", () => {
    expect(sheetScoreTier(10)).toBe("9.1-10");
    expect(sheetScoreTier(9.1)).toBe("9.1-10");
    expect(sheetScoreTier(9.0)).toBe("8.1-9");
    expect(sheetScoreTier(8.1)).toBe("8.1-9");
    expect(sheetScoreTier(8.0)).toBe("7.1-8");
    expect(sheetScoreTier(7.1)).toBe("7.1-8");
    expect(sheetScoreTier(7.0)).toBe("6.1-7");
    expect(sheetScoreTier(6.1)).toBe("6.1-7");
    expect(sheetScoreTier(6.0)).toBe("5.1-6");
    expect(sheetScoreTier(5.1)).toBe("5.1-6");
    expect(sheetScoreTier(5.0)).toBe("≤ 5.0");
    expect(sheetScoreTier(1.1)).toBe("≤ 5.0");
  });
});

describe("parseSheetCharacterTiers", () => {
  const csv = toCsv([
    ...sheetBlock("Rhiannon ", "Extra Round, AP Free", "10.0", "Utility"),
    ...sheetBlock("Beryl (E1)* [4.0]", "Lingering Glow", "9.5", "Carry"),
    ...sheetBlock("J (E1) [3.8]", "Counter", "4.2", "Sustain"),
    ...sheetBlock("Unscored", "Nothing", "", "Carry"),
  ]);

  it("reads score, role and tags; keeps the Euphoria suffix, drops other decorations", () => {
    expect(parseSheetCharacterTiers(csv)).toEqual([
      {
        name: "Rhiannon",
        slug: "rhiannon",
        tier: "9.1-10",
        role: "support",
        tags: "Extra Round, AP Free",
        score: 10,
        modeScores: { limbo: 9 },
      },
      {
        name: "Beryl (E1)",
        slug: "beryle1",
        tier: "9.1-10",
        role: "damage-dealer",
        tags: "Lingering Glow",
        score: 9.5,
        modeScores: { limbo: 9 },
      },
      {
        name: "J (E1)",
        slug: "je1",
        tier: "≤ 5.0",
        role: "survival",
        tags: "Counter",
        score: 4.2,
        modeScores: { limbo: 9 },
      },
    ]);
  });

  it("re-tiers by a mode subscore and drops characters without one", () => {
    const characters = parseSheetCharacterTiers(csv);
    expect(withSheetMode(characters, "overall")).toBe(characters);
    const limbo = withSheetMode(characters, "limbo");
    expect(limbo.map((c) => [c.score, c.tier])).toEqual([
      [9, "9"],
      [9, "9"],
      [9, "9"],
    ]);
    expect(withSheetMode(characters, "raid")).toEqual([]);
  });

  it("keeps engraved and base versions of a character as separate entries", () => {
    const characters = parseSheetCharacterTiers(
      toCsv([
        ...sheetBlock("Moldir", "", "7.5", "Utility"),
        ...sheetBlock("Moldir (E1)", "", "9.0", "Utility"),
      ]),
    );

    expect(characters.map((c) => c.name)).toEqual(["Moldir (E1)", "Moldir"]);
    expect(new Set(characters.map((c) => c.slug)).size).toBe(2);
  });

  it("resolves engraved names to the base arcanist for images and ownership", () => {
    const groups = resolveCharacterTiers(
      parseSheetCharacterTiers(
        toCsv(sheetBlock("Beryl (E1)", "", "9.5", "Carry")),
      ),
      arcanists,
      (id) => id === 2,
    );

    expect(groups[0].roles[0].characters[0]).toMatchObject({
      arcanistId: 2,
      owned: true,
      character: { name: "Beryl (E1)" },
    });
  });

  it("orders characters by score descending", () => {
    const names = parseSheetCharacterTiers(
      toCsv([
        ...sheetBlock("Low", "", "5.5", "Carry"),
        ...sheetBlock("High", "", "9.9", "Carry"),
      ]),
    ).map((character) => character.name);

    expect(names).toEqual(["High", "Low"]);
  });
});

const characters: ICharacterTier[] = [
  {
    name: "Tooth  Fairy",
    slug: "tooth-fairy",
    tier: "S+",
    role: "support",
    tags: "HEAL",
  },
  {
    name: "Beryl",
    slug: "beryl",
    tier: "S+",
    role: "damage-dealer",
    tags: "GLOW",
  },
  {
    name: "Unknown",
    slug: "unknown",
    tier: "A",
    role: "survival",
    tags: "",
  },
];

describe("resolveCharacterTiers", () => {
  it("groups characters by tier and role in display order", () => {
    const groups = resolveCharacterTiers(characters, arcanists, () => false);

    expect(groups.map((group) => group.tier)).toEqual(["S+", "A"]);
    expect(groups[0].roles.map((group) => group.role)).toEqual([
      "damage-dealer",
      "support",
    ]);
    expect(groups[0].roles[1].characters[0]).toMatchObject({
      arcanistId: 1,
      owned: false,
      character: { name: "Tooth  Fairy" },
    });
  });

  it("filters to owned characters and omits empty tiers", () => {
    const groups = resolveCharacterTiers(
      characters,
      arcanists,
      (id) => id === 2,
      true,
    );

    expect(groups).toHaveLength(1);
    expect(groups[0].tier).toBe("S+");
    expect(groups[0].roles).toHaveLength(1);
    expect(groups[0].roles[0].role).toBe("damage-dealer");
    expect(groups[0].roles[0].characters[0]).toMatchObject({
      arcanistId: 2,
      owned: true,
    });
  });

  it("marks unmatched characters unowned and keeps them unless filtered", () => {
    const groups = resolveCharacterTiers(characters, arcanists, () => true);
    const unmatched = groups[1].roles[0].characters[0];

    expect(unmatched).toMatchObject({ arcanistId: null, owned: false });
    expect(
      resolveCharacterTiers(characters, arcanists, () => true, true),
    ).toHaveLength(1);
  });
});
