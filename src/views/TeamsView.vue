<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { storeToRefs } from "pinia";
import { useDataStore } from "@/stores/dataStore";
import { useArcanistOwnershipStore } from "@/stores/arcanistOwnershipStore";
import { useViewPreferencesStore } from "@/stores/viewPreferencesStore";
import { resolveTeam } from "@/composables/teams";
import { getArcanistI0ImagePath } from "@/composables/images";
import {
  bannerBorderClass,
  completableWithBanner,
} from "@/utils/bannerData";
import { SHEET_GIDS, sheetEditUrl } from "@/utils/googleSheet";

const archetypeSheetUrl = sheetEditUrl(SHEET_GIDS.archetypes);

type ResolvedTeam = ReturnType<typeof resolveTeam>;

const teamBorderClass = (r: ResolvedTeam) => {
  if (r.ownedCount === r.total) {
    return "border-success";
  }
  return completableWithBanner(r) ? "border-yellow-400" : "border-transparent";
};

const dataStore = useDataStore();
const ownershipStore = useArcanistOwnershipStore();
const { teamsSource: selectedSource, teamsOnlyBuildable: onlyBuildable } =
  storeToRefs(useViewPreferencesStore());
const archetypeLoading = ref(false);
const archetypeError = ref("");

const resolved = computed(() => {
  const teams =
    selectedSource.value === "archetypes"
      ? dataStore.sheetTeams
      : dataStore.teams?.teams ?? [];
  return teams.map((team) =>
    resolveTeam(
      team,
      dataStore.arcanists,
      (id) => !!ownershipStore.getEffectiveEntry(id),
    ),
  );
});

const groups = computed(() => {
  const groups = new Map<string, typeof resolved.value>();
  for (const r of resolved.value) {
    const isBuildable = r.ownedCount >= r.total;
    if (onlyBuildable.value && !isBuildable) {
      continue;
    }

    const group = selectedSource.value === "archetypes" ? "" : r.team.tier;
    if (!groups.has(group)) {
      groups.set(group, []);
    }

    groups.get(group)!.push(r);
  }

  return [...groups.entries()];
});

async function loadArchetypeTeams(force = false) {
  archetypeLoading.value = true;
  archetypeError.value = "";
  try {
    await dataStore.loadSheetTeams(force);
  } catch (error) {
    archetypeError.value =
      error instanceof Error ? error.message : String(error);
  } finally {
    archetypeLoading.value = false;
  }
}

function onSourceChange() {
  if (selectedSource.value === "archetypes") {
    loadArchetypeTeams();
  }
}

// The remembered source may need its live data fetched on a fresh page load
onMounted(onSourceChange);

const scrapedDate = computed(() =>
  dataStore.teams
    ? new Date(dataStore.teams.scrapedAt).toLocaleDateString()
    : "",
);
</script>

<template>
  <div class="container mx-auto px-4 py-6">
    <div class="flex flex-wrap items-center justify-between gap-2 mb-4">
      <p class="text-sm opacity-80">
        {{ $t("teams-role-help") }}
      </p>
      <label class="flex items-center gap-2">
        <span>{{ $t("teams-source-label") }}</span>
        <select
          v-model="selectedSource"
          class="select select-bordered select-sm"
          @change="onSourceChange"
        >
          <option value="prydwen">{{ $t("teams-source-prydwen") }}</option>
          <option value="archetypes">
            {{ $t("teams-source-archetypes") }}
          </option>
        </select>
      </label>
      <label class="flex items-center gap-2 cursor-pointer">
        <input v-model="onlyBuildable" type="checkbox" class="checkbox" />
        {{ $t("teams-only-buildable") }}
      </label>
      <div
        v-if="selectedSource === 'prydwen' && dataStore.teams"
        class="text-sm opacity-70"
      >
        {{ $t("teams-last-updated", { date: scrapedDate }) }} ·
        <a
          :href="dataStore.teams.source"
          target="_blank"
          rel="noopener"
          class="link"
          >{{ $t("teams-source") }}</a
        >
      </div>
      <div
        v-else-if="selectedSource === 'archetypes'"
        class="text-sm opacity-70"
      >
        <a
          :href="archetypeSheetUrl"
          target="_blank"
          rel="noopener"
          class="link"
          >{{ $t("teams-source") }}</a
        >
        <template v-if="dataStore.sheetTeamsFetchedAt">
          ·
          {{
            $t("sheet-last-fetched", {
              date: new Date(dataStore.sheetTeamsFetchedAt).toLocaleString(),
            })
          }}
        </template>
        <button
          class="btn btn-xs ml-2"
          :disabled="archetypeLoading"
          @click="loadArchetypeTeams(true)"
        >
          {{ $t("sheet-refresh") }}
        </button>
      </div>
    </div>

    <p
      v-if="selectedSource === 'archetypes' && archetypeLoading"
      class="opacity-70"
    >
      {{ $t("teams-source-loading") }}
    </p>
    <p
      v-else-if="selectedSource === 'archetypes' && archetypeError"
      class="text-error"
      role="alert"
    >
      {{ $t("teams-source-load-error", { error: archetypeError }) }}
    </p>
    <p v-else-if="groups.length === 0" class="opacity-70">
      {{ $t("teams-no-teams") }}
    </p>

    <section
      v-for="[group, teams] in groups"
      :key="group"
      class="mb-8 pt-5 border-t-2 border-white/40 first:border-t-0 first:pt-0"
    >
      <h2 v-if="group" class="text-2xl font-bold mb-3">{{ group }}</h2>
      <div class="grid gap-3 grid-cols-1 lg:grid-cols-2">
        <div
          v-for="r in teams"
          :key="r.team.name"
          class="rounded-lg p-3 bg-base-200 border-2"
          :class="teamBorderClass(r)"
        >
          <div class="flex justify-between gap-2 mb-2">
            <span class="font-semibold">{{ r.team.name }}</span>
            <span
              class="badge whitespace-nowrap"
              :class="
                r.ownedCount === r.total ? 'badge-success' : 'badge-ghost'
              "
              >{{
                $t("teams-owned-count", { owned: r.ownedCount, total: r.total })
              }}</span
            >
          </div>
          <div class="flex flex-wrap gap-2">
            <div v-for="(slot, i) in r.slots" :key="i" class="flex gap-1">
              <div class="rounded-md border-2 border-white/30 p-1">
                <div class="flex gap-1">
                  <div
                    v-for="opt in slot.options"
                    :key="opt.name"
                    class="text-center w-16"
                    :title="
                      opt.owned
                        ? opt.name
                        : `${opt.name} (${$t('teams-missing')})`
                    "
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
                    <div
                      class="text-xs truncate"
                      :class="{ 'opacity-30': !opt.owned }"
                    >
                      {{ opt.name }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
