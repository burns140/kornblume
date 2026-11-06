import { describe, it, expect } from "vitest";
import {
  findTeamsWithCharacter,
  parseArchetypeTeams,
  resolveTeam,
} from "./teams";
import type { IArcanist, ITeam } from "@/types";

const arcanists = [
  { Id: 1, Name: "Tooth Fairy" },
  { Id: 2, Name: "Rhiannon" },
  { Id: 3, Name: "Aleph" },
] as unknown as IArcanist[];

const team: ITeam = {
  name: "T",
  tier: "S",
  damageType: "physical",
  slots: [
    [{ name: "Aleph", slug: "aleph" }],
    [
      { name: "Rhiannon", slug: "rhiannon" },
      { name: "Tooth  Fairy", slug: "tooth-fairy" },
    ],
    [{ name: "Unknown", slug: "unknown" }],
  ],
};

describe("parseArchetypeTeams", () => {
  it("extracts team slots from the archetype sheet layout", () => {
    const csv = [
      '"Conduit","","","","","","",""',
      '"Utility","Essential","DPS","Negotiable","Utility","Negotiable","Sustain","Essential"',
      '"Coppélia","","The Twins","","Hedone","","Everecho",""',
      ',"Burn but Good","","","","","",""',
      "",
    ].join("\n");

    expect(parseArchetypeTeams(csv)).toEqual([
      {
        name: "Conduit",
        tier: "",
        damageType: "",
        slots: [
          [{ name: "Coppélia", slug: "coppelia" }],
          [{ name: "The Twins", slug: "thetwins" }],
          [{ name: "Hedone", slug: "hedone" }],
          [{ name: "Everecho", slug: "everecho" }],
        ],
      },
    ]);
  });

  it("strips Euphoria suffixes from character names", () => {
    const csv = [
      '"Liang","","","","","","",""',
      '"DPS","Essential","Utility","Essential","Sustain","Flexible","Utility","Flexible"',
      '"Liang Yue (E1)","","Flutterpage (E12)","","Enigma","","Rhiannon",""',
      "",
    ].join("\n");

    expect(
      parseArchetypeTeams(csv)[0].slots.map((slot) => slot[0].name),
    ).toEqual(["Liang Yue", "Flutterpage", "Enigma", "Rhiannon"]);
  });

  it("supports quoted commas and newlines in unrelated sheet cells", () => {
    const csv = [
      '"Intro, with a comma\nand another line"',
      '"An ""quoted"" heading","","","","","","",""',
      "",
    ].join("\n");

    expect(parseArchetypeTeams(csv)).toEqual([]);
  });
});

describe("findTeamsWithCharacter", () => {
  const other: ITeam = {
    name: "Other",
    tier: "A",
    damageType: "mental",
    slots: [[{ name: "Aleph", slug: "aleph" }]],
  };

  it("finds teams where the character is any slot alternative", () => {
    expect(findTeamsWithCharacter([team, other], "tooth fairy")).toEqual([
      team,
    ]);
    expect(findTeamsWithCharacter([team, other], "Aleph")).toEqual([
      team,
      other,
    ]);
  });

  it("finds teams for an engraved character name", () => {
    expect(findTeamsWithCharacter([team, other], "Aleph (E1)")).toEqual([
      team,
      other,
    ]);
  });

  it("returns nothing for characters in no team", () => {
    expect(findTeamsWithCharacter([team, other], "Nobody")).toEqual([]);
  });
});

describe("resolveTeam", () => {
  it("counts a slot as owned if any alternative is owned", () => {
    const r = resolveTeam(team, arcanists, (id) => id === 1);
    expect(r.ownedCount).toBe(1);
    expect(r.total).toBe(3);
    expect(r.slots[1].owned).toBe(true);
    expect(r.slots[0].owned).toBe(false);
  });

  it("treats unmatched names as not owned", () => {
    const r = resolveTeam(team, arcanists, () => true);
    expect(r.slots[2].options[0].arcanistId).toBeNull();
    expect(r.ownedCount).toBe(2);
  });
});
