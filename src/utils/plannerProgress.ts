import type { IArcanist, ISelectedArcanist } from "@/types";

export function isPlannerGoalComplete(
  arcanist: ISelectedArcanist,
  character: IArcanist | undefined,
): boolean {
  return (
    character !== undefined &&
    Number(arcanist.currentInsight) === Number(arcanist.goalInsight) &&
    Number(arcanist.currentLevel) === Number(arcanist.goalLevel) &&
    Number(arcanist.currentResonance) === Number(arcanist.goalResonance) &&
    ((character.Euphoria ?? []).length === 0 ||
      (Number(arcanist.currentMastery) === 4 &&
        (arcanist.completedEuphorias ?? []).includes(
          character.Euphoria[character.Euphoria.length - 1].Id,
        )))
  );
}
