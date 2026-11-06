<script setup lang="ts">
import { computed } from "vue";
import { useDataStore } from "@/stores/dataStore";
import { stripEuphoria } from "@/utils/teamMatching";
import {
  getArcanistI0ImagePath,
  getArcanistFramePath,
  getArcanistAfflatusIconPath,
} from "@/composables/images";

// Static portrait in the style of ArcanistPortrait, without the ownership store
const props = defineProps<{
  arcanistId: number;
  name: string;
  owned: boolean;
  showName?: boolean;
  borderClass?: string;
}>();

const dataStore = useDataStore();
const arcanist = computed(() =>
  dataStore.arcanists.find((a) => a.Id === props.arcanistId),
);

// The Euphoria level moves to a badge so the name fits over the frame
const displayName = computed(() => stripEuphoria(props.name));
const euphoria = computed(() => /\((E\d+)\)/i.exec(props.name)?.[1] ?? "");
</script>

<template>
  <div class="relative w-16 shrink-0 overflow-hidden rounded-md">
    <div
      v-if="borderClass"
      class="absolute inset-0 z-10 rounded-md pointer-events-none"
      :class="borderClass"
    ></div>
    <div :class="{ 'opacity-40 grayscale': !owned }">
      <img
        class="w-full aspect-[57/131] object-contain object-center rounded-b-full"
        :src="getArcanistI0ImagePath(arcanistId)"
        :alt="name"
      />
      <img
        v-if="arcanist"
        class="absolute top-0 left-0 w-4 opacity-90"
        :src="getArcanistAfflatusIconPath(arcanist.Afflatus)"
        alt=""
      />
      <img
        v-if="arcanist"
        class="absolute bottom-0 left-0 w-full rounded-md"
        :src="getArcanistFramePath(arcanist.Rarity)"
        alt=""
      />
      <span
        v-if="showName"
        class="absolute bottom-0 left-0 w-full text-center text-white/90 py-2.5 font-bold opacity-95 text-xs leading-4 truncate px-0.5 name-shadow"
      >
        {{ displayName }}
      </span>
    </div>
    <span
      v-if="euphoria"
      class="absolute top-0.5 right-0.5 px-1 text-xs font-bold text-white/90 rounded-md bg-black/70"
      >{{ euphoria }}</span
    >
  </div>
</template>

<style scoped>
.name-shadow {
  text-shadow:
    -1px 0 black,
    0 1px black,
    1px 0 black,
    0 -1px black;
}
</style>
