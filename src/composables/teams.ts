import type { IArcanist, ITeam } from "@/types";
import { parseCsv } from "@/utils/csv";
import { normalizeName, stripEuphoria } from "@/utils/teamMatching";

export interface IResolvedOption {
  name: string;
  arcanistId: number | null;
  owned: boolean;
}

export interface IResolvedSlot {
  options: IResolvedOption[];
  owned: boolean;
}

export interface IResolvedTeam {
  team: ITeam;
  slots: IResolvedSlot[];
  ownedCount: number;
  total: number;
}

export function parseArchetypeTeams(csv: string): ITeam[] {
  const rows = parseCsv(csv);
  const teams: ITeam[] = [];
  for (let i = 0; i + 2 < rows.length; i += 1) {
    const [name, ...remaining] = rows[i].map((value) => value.trim());
    if (!name || remaining.some(Boolean)) {
      continue;
    }

    const roleRow = rows[i + 1];
    const characterRow = rows[i + 2];
    const slots = [0, 2, 4, 6]
      .filter((column) => roleRow[column]?.trim() && characterRow[column]?.trim())
      .map((column) => {
        const characterName = stripEuphoria(characterRow[column].trim());
        return [{ name: characterName, slug: normalizeName(characterName) }];
      });

    if (slots.length < 2) {
      continue;
    }

    teams.push({
      name,
      tier: "",
      damageType: "",
      slots,
    });
  }

  return teams;
}

export function findTeamsWithCharacter(
  teams: ITeam[],
  characterName: string,
): ITeam[] {
  const target = normalizeName(characterName);
  return teams.filter((team) =>
    team.slots.some((slot) =>
      slot.some((c) => normalizeName(c.name) === target),
    ),
  );
}

export function resolveTeam(
  team: ITeam,
  arcanists: IArcanist[],
  isOwned: (id: number) => boolean,
): IResolvedTeam {
  const byName = new Map(arcanists.map((a) => [normalizeName(a.Name), a.Id]));
  const slots = team.slots.map((slot) => {
    const options = slot.map((c) => {
      const arcanistId = byName.get(normalizeName(c.name)) ?? null;
      return {
        name: c.name,
        arcanistId,
        owned: arcanistId !== null && isOwned(arcanistId),
      };
    });
    return { options, owned: options.some((o) => o.owned) };
  });
  return {
    team,
    slots,
    ownedCount: slots.filter((s) => s.owned).length,
    total: slots.length,
  };
}
