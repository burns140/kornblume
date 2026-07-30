import { beforeEach, describe, expect, it } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useArcanistOwnershipStore } from "./arcanistOwnershipStore";
import { usePullsRecordStore, IPull } from "./pullsRecordStore";
import { useDataStore } from "./dataStore";
import type { IArcanist } from "@/types";

describe("useArcanistOwnershipStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("prefers manual ownership over tracker-derived ownership", () => {
    const store = useArcanistOwnershipStore();
    const pullsStore = usePullsRecordStore();
    const dataStore = useDataStore();

    dataStore.arcanists = [
      {
        Id: 1,
        Name: "Test Arcanist",
      } as IArcanist,
    ];

    const pulls: IPull[] = [
      {
        ArcanistName: "Test Arcanist",
        Rarity: 6,
        BannerType: "Standard",
        Timestamp: 0,
      },
    ];
    pullsStore.updatePullsRecord(pulls);

    const trackerEntry = store.getTrackerEntry(1);
    expect(trackerEntry?.isOwned).toBe(true);
    expect(trackerEntry?.source).toBe("tracker");
    expect(trackerEntry?.currentPortrait).toBe(0);

    store.setOwned(1, "Test Arcanist", false);
    const effectiveEntry = store.getEffectiveEntry(1);
    expect(effectiveEntry?.isOwned).toBe(false);
    expect(effectiveEntry?.source).toBe("manual");
    expect(effectiveEntry?.resonance).toBe(1);
  });
});
