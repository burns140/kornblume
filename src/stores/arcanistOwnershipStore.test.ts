import { beforeEach, describe, expect, it } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useArcanistOwnershipStore } from "./arcanistOwnershipStore";

describe("useArcanistOwnershipStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("prefers manual ownership over tracker-derived ownership", () => {
    const store = useArcanistOwnershipStore();

    store.setOwnedFromTracker(1, "Test Arcanist", true);
    store.updateEntry(1, {
      Id: 1,
      Name: "Test Arcanist",
      isOwned: false,
      currentLevel: 60,
      currentInsight: 3,
      currentResonance: 2,
      currentPortrait: 5,
    });

    const effectiveEntry = store.getEffectiveEntry(1);
    expect(effectiveEntry?.isOwned).toBe(false);
    expect(effectiveEntry?.source).toBe("manual");
    expect(store.getTrackerEntry(1)?.isOwned).toBe(true);
  });
});
