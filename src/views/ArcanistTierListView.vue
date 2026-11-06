<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { storeToRefs } from "pinia";
import { useDataStore } from "@/stores/dataStore";
import { useArcanistOwnershipStore } from "@/stores/arcanistOwnershipStore";
import { useViewPreferencesStore } from "@/stores/viewPreferencesStore";
import { getArcanistI0ImagePath } from "@/composables/images";
import {
  resolveCharacterTiers,
  sheetModes,
  withSheetMode,
} from "@/composables/characterTiers";
import { findTeamsWithCharacter, resolveTeam } from "@/composables/teams";
import { bannerBorderClass } from "@/utils/bannerData";
import { SHEET_GIDS, sheetEditUrl } from "@/utils/googleSheet";
import type { ITeam } from "@/types";

const sheetUrl = sheetEditUrl(SHEET_GIDS.characterTiers);

const dataStore = useDataStore();
const ownershipStore = useArcanistOwnershipStore();
const {
  characterTiersSource: selectedSource,
  characterTiersMode: selectedMode,
  characterTiersOnlyOwned: onlyOwned,
} = storeToRefs(useViewPreferencesStore());
const sheetLoading = ref(false);
const sheetError = ref("");
const selectedName = ref<string | null>(null);
const hoveredTeam = ref<ITeam | null>(null);
const root = ref<HTMLElement | null>(null);
const panel = ref<HTMLElement | null>(null);

// Card clicks are handled by selectCharacter, so only other clicks close the panel
function closeOnOutsideClick(event: MouseEvent) {
  const target = event.target as Element;
  if (
    selectedName.value &&
    !panel.value?.contains(target) &&
    !target.closest("[data-character-card]")
  ) {
    selectedName.value = null;
    hoveredTeam.value = null;
  }
}

onMounted(() => {
  document.addEventListener("click", closeOnOutsideClick);
  // The remembered source may need its live data fetched on a fresh page load
  if (selectedSource.value === "sheet") {
    loadSheet();
  }
});
onBeforeUnmount(() =>
  document.removeEventListener("click", closeOnOutsideClick),
);
const panelStyle = ref<Record<string, string>>({});
const flyoutStyle = ref<Record<string, string>>({});

// Opens toward whichever side of the element has more room
function sidePosition(rect: DOMRect) {
  const openRight = window.innerWidth - rect.right >= rect.left;
  return {
    openRight,
    x: openRight ? rect.right : rect.left,
    transform: openRight
      ? "translateX(8px)"
      : "translateX(calc(-100% - 8px))",
  };
}

const isOwned = (id: number) => !!ownershipStore.getEffectiveEntry(id);

// The team panel follows the selected source so teams match the tier list
const sourceTeams = computed(() =>
  selectedSource.value === "sheet"
    ? dataStore.sheetTeams
    : dataStore.teams?.teams ?? [],
);

const selectedTeams = computed(() =>
  selectedName.value
    ? findTeamsWithCharacter(sourceTeams.value, selectedName.value).map(
        (team) => {
          const resolved = resolveTeam(team, dataStore.arcanists, isOwned);
          return { team, buildable: resolved.ownedCount === resolved.total };
        },
      )
    : [],
);

const resolvedHoveredTeam = computed(() =>
  hoveredTeam.value
    ? resolveTeam(hoveredTeam.value, dataStore.arcanists, isOwned)
    : null,
);

function selectCharacter(name: string, event: MouseEvent) {
  hoveredTeam.value = null;
  if (selectedName.value === name) {
    selectedName.value = null;
    return;
  }

  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  const rootRect = root.value!.getBoundingClientRect();
  const { x, transform } = sidePosition(rect);
  panelStyle.value = {
    top: `${rect.top - rootRect.top}px`,
    left: `${x - rootRect.left}px`,
    transform,
  };
  selectedName.value = name;
}

function showFlyout(team: ITeam, event: MouseEvent) {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  const { x, transform } = sidePosition(rect);
  flyoutStyle.value = {
    top: `${Math.max(8, Math.min(rect.top, window.innerHeight - 220))}px`,
    left: `${x}px`,
    transform,
  };
  hoveredTeam.value = team;
}

const tierGroups = computed(() => {
  return resolveCharacterTiers(
    selectedSource.value === "sheet"
      ? withSheetMode(dataStore.sheetCharacterTiers, selectedMode.value)
      : dataStore.characterTiers?.characters ?? [],
    dataStore.arcanists,
    isOwned,
    onlyOwned.value,
  );
});

async function loadSheet(force = false) {
  sheetLoading.value = true;
  sheetError.value = "";
  try {
    await Promise.all([
      dataStore.loadSheetCharacterTiers(force),
      dataStore.loadSheetTeams(force),
    ]);
  } catch (error) {
    sheetError.value = error instanceof Error ? error.message : String(error);
  } finally {
    sheetLoading.value = false;
  }
}

function onSourceChange() {
  selectedName.value = null;
  hoveredTeam.value = null;
  if (selectedSource.value === "sheet") {
    loadSheet();
  }
}

const scrapedDate = computed(() =>
  dataStore.characterTiers
    ? new Date(dataStore.characterTiers.scrapedAt).toLocaleDateString()
    : "",
);
</script>

<template>
  <div ref="root" class="container mx-auto px-4 py-6 relative">
    <div class="flex flex-wrap items-center justify-between gap-3 mb-5">
      <p class="text-sm opacity-80">
        <template v-if="selectedSource === 'sheet'">
          {{ $t("character-tier-list-sheet-description") }}
        </template>
        <template v-else>
          {{ $t("character-tier-list-description") }}
          <span v-if="dataStore.characterTiers">
            ({{ dataStore.characterTiers.version }})
          </span>
        </template>
      </p>
      <label class="flex items-center gap-2">
        <span>{{ $t("character-tier-list-source-label") }}</span>
        <select
          v-model="selectedSource"
          class="select select-bordered select-sm"
          @change="onSourceChange"
        >
          <option value="prydwen">
            {{ $t("character-tier-list-source-prydwen") }}
          </option>
          <option value="sheet">
            {{ $t("character-tier-list-source-sheet") }}
          </option>
        </select>
      </label>
      <label v-if="selectedSource === 'sheet'" class="flex items-center gap-2">
        <span>{{ $t("character-tier-list-mode-label") }}</span>
        <select
          v-model="selectedMode"
          class="select select-bordered select-sm"
        >
          <option v-for="mode in sheetModes" :key="mode" :value="mode">
            {{ $t(`character-tier-list-mode-${mode}`) }}
          </option>
        </select>
      </label>
      <label class="flex items-center gap-2 cursor-pointer">
        <input v-model="onlyOwned" type="checkbox" class="checkbox" />
        {{ $t("character-tier-list-only-owned") }}
      </label>
      <div
        v-if="selectedSource === 'prydwen' && dataStore.characterTiers"
        class="text-sm opacity-70"
      >
        {{ $t("character-tier-list-last-updated", { date: scrapedDate }) }} ·
        <a
          :href="dataStore.characterTiers.source"
          target="_blank"
          rel="noopener"
          class="link"
          >{{ $t("teams-source") }}</a
        >
      </div>
      <div v-else-if="selectedSource === 'sheet'" class="text-sm opacity-70">
        <a :href="sheetUrl" target="_blank" rel="noopener" class="link">{{
          $t("teams-source")
        }}</a>
        <template v-if="dataStore.sheetCharacterTiersFetchedAt">
          ·
          {{
            $t("sheet-last-fetched", {
              date: new Date(
                dataStore.sheetCharacterTiersFetchedAt,
              ).toLocaleString(),
            })
          }}
        </template>
        <button
          class="btn btn-xs ml-2"
          :disabled="sheetLoading"
          @click="loadSheet(true)"
        >
          {{ $t("sheet-refresh") }}
        </button>
      </div>
    </div>

    <p v-if="selectedSource === 'sheet' && sheetLoading" class="opacity-70">
      {{ $t("character-tier-list-source-loading") }}
    </p>
    <p
      v-else-if="selectedSource === 'sheet' && sheetError"
      class="text-error"
      role="alert"
    >
      {{ $t("character-tier-list-source-load-error", { error: sheetError }) }}
    </p>
    <p v-else-if="tierGroups.length === 0" class="opacity-70">
      {{ $t("character-tier-list-no-characters") }}
    </p>

    <section
      v-for="group in tierGroups"
      :key="group.tier"
      class="mb-8 pt-5 border-t-2 border-white/40 first:border-t-0 first:pt-0"
    >
      <h2 class="text-2xl font-bold mb-3">{{ group.tier }}</h2>
      <div class="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
        <section
          v-for="roleGroup in group.roles"
          :key="roleGroup.role"
          class="rounded-lg p-3 bg-base-200"
        >
          <h3 class="font-semibold mb-3">
            {{ $t(`character-tier-role-${roleGroup.role}`) }}
          </h3>
          <div class="grid gap-2 grid-cols-2">
            <div
              v-for="entry in roleGroup.characters"
              :key="entry.character.slug"
              data-character-card
              class="flex items-center gap-2 rounded-md p-2 border-2 min-w-0 cursor-pointer hover:bg-base-300"
              :class="[
                entry.owned
                  ? 'border-success'
                  : 'border-transparent',
                { 'bg-base-300': selectedName === entry.character.name },
              ]"
              :title="entry.character.name"
              @click="selectCharacter(entry.character.name, $event)"
            >
              <div
                v-if="entry.arcanistId !== null"
                class="w-12 h-12 rounded-full overflow-hidden shrink-0"
                :class="bannerBorderClass(entry.character.name)"
              >
                <img
                  :src="getArcanistI0ImagePath(entry.arcanistId)"
                  :alt="entry.character.name"
                  class="w-full h-full object-cover object-top"
                  :class="{ 'opacity-70 grayscale': !entry.owned }"
                />
              </div>
              <div
                v-else
                class="w-12 h-12 rounded-full bg-base-300 shrink-0"
                :class="{ 'opacity-70': !entry.owned }"
              ></div>
              <div class="min-w-0" :class="{ 'opacity-70': !entry.owned }">
                <div class="text-sm font-medium truncate">
                  {{ entry.character.name }}
                </div>
                <div
                  v-if="entry.character.score !== undefined || entry.character.tags"
                  class="text-xs truncate"
                >
                  <span
                    v-if="entry.character.score !== undefined"
                    class="text-base font-bold"
                    >{{
                      selectedMode === "overall"
                        ? entry.character.score.toFixed(1)
                        : entry.character.score
                    }}</span
                  >
                  <span
                    v-if="entry.character.score !== undefined && entry.character.tags"
                    class="opacity-70"
                  >
                    ·
                  </span>
                  <span class="opacity-70">{{ entry.character.tags }}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </section>

    <aside
      v-if="selectedName"
      ref="panel"
      class="absolute z-40 w-max max-w-xs rounded-lg bg-base-200 shadow-xl border-2 border-white/30 p-3"
      :style="panelStyle"
    >
      <p v-if="selectedTeams.length === 0" class="text-sm opacity-70">
        {{ $t("character-tier-list-no-teams") }}
      </p>
      <ul v-else class="flex flex-col gap-1">
        <li
          v-for="{ team, buildable } in selectedTeams"
          :key="team.name"
          class="rounded-md px-3 py-2 bg-base-300 cursor-default hover:bg-base-100 border-2"
          :class="buildable ? 'border-success/60' : 'border-transparent'"
          @mouseenter="showFlyout(team, $event)"
          @mouseleave="hoveredTeam = null"
        >
          {{ team.name }}
        </li>
      </ul>
    </aside>

    <div
      v-if="resolvedHoveredTeam"
      class="fixed z-50 pointer-events-none rounded-lg p-3 bg-base-200 border-2 border-white/40 shadow-2xl max-w-[90vw]"
      :style="flyoutStyle"
    >
      <div class="flex flex-wrap gap-2">
        <div
          v-for="(slot, i) in resolvedHoveredTeam.slots"
          :key="i"
          class="rounded-md border-2 border-white/30 p-1 flex gap-1"
        >
          <div
            v-for="opt in slot.options"
            :key="opt.name"
            class="text-center w-16"
          >
            <div
              v-if="opt.arcanistId !== null"
              class="w-16 h-16 rounded-full overflow-hidden"
              :class="bannerBorderClass(opt.name)"
            >
              <img
                :src="getArcanistI0ImagePath(opt.arcanistId)"
                :alt="opt.name"
                class="w-full h-full object-cover object-top"
                :class="{ 'opacity-30 grayscale': !opt.owned }"
              />
            </div>
            <div
              v-else
              class="w-16 h-16 rounded-full bg-base-300"
              :class="{ 'opacity-30': !opt.owned }"
            ></div>
            <div class="text-xs truncate" :class="{ 'opacity-30': !opt.owned }">
              {{ opt.name }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
