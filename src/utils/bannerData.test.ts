import { describe, expect, it } from "vitest";
import {
  bannerBorderClass,
  completableWithBanner,
  currentBanners,
  isOnCurrentBanner,
} from "./bannerData";

const slot = (owned: boolean, ...names: string[]) => ({
  owned,
  options: names.map((name) => ({ name })),
});

const team = (...slots: ReturnType<typeof slot>[]) => ({
  slots,
  total: slots.length,
  ownedCount: slots.filter((s) => s.owned).length,
});

describe("banner data", () => {
  it("detects characters on a current banner case-insensitively", () => {
    expect(isOnCurrentBanner("Hedone")).toBe(true);
    expect(isOnCurrentBanner("ULRICH")).toBe(true);
    expect(isOnCurrentBanner("Nobody")).toBe(false);
  });

  it("uses a distinct border color per banner type", () => {
    const classes = [
      bannerBorderClass("Hedone"),
      bannerBorderClass("Ulrich"),
      bannerBorderClass("Recoleta"),
    ];
    expect(classes[0]).toContain("yellow");
    expect(classes[1]).toContain("sky");
    expect(classes[2]).toContain("violet");
    expect(new Set(classes).size).toBe(3);
  });

  it("returns no border class for characters not on a banner", () => {
    expect(bannerBorderClass("Nobody")).toBe("");
  });

  it("ignores the Euphoria suffix when looking up banners", () => {
    expect(isOnCurrentBanner("Recoleta (E1)")).toBe(true);
    expect(bannerBorderClass("Moldir (E1)")).toBe(
      bannerBorderClass("Moldir"),
    );
    expect(bannerBorderClass("Moldir (E1)")).toContain("violet");
  });

  it("assigns the current banner types", () => {
    expect(currentBanners.hedone).toBe("event");
    expect(currentBanners.ulrich).toBe("rerun");
    for (const name of [
      "recoleta",
      "noire",
      "melania",
      "regulus",
      "moldir",
      "hissabeth",
    ]) {
      expect(currentBanners[name]).toBe("euphoria");
    }
  });

  describe("completableWithBanner", () => {
    it("is true when every missing slot has a banner option", () => {
      expect(
        completableWithBanner(team(slot(true, "A"), slot(false, "Hedone"))),
      ).toBe(true);
    });

    it("is true when only one option of a missing slot is on a banner", () => {
      expect(
        completableWithBanner(team(slot(false, "A", "Ulrich"))),
      ).toBe(true);
    });

    it("is false when a missing slot has no banner option", () => {
      expect(
        completableWithBanner(
          team(slot(false, "Hedone"), slot(false, "Nobody")),
        ),
      ).toBe(false);
    });

    it("is false when the team is already complete", () => {
      expect(completableWithBanner(team(slot(true, "Hedone")))).toBe(false);
    });
  });
});
