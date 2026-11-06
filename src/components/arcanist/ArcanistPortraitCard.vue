<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { useDataStore } from "@/stores/dataStore";
import { usePlannerStore } from "@/stores/plannerStore";
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

const plannerStore = usePlannerStore();
const inPlanner = computed(() => plannerStore.hasArcanist(props.arcanistId));
const menu = ref<{ x: number; y: number } | null>(null);

const closeMenu = () => {
  menu.value = null;
};
const onKeydown = (e: KeyboardEvent) => {
  if (e.key === "Escape") closeMenu();
};
const openMenu = (e: MouseEvent) => {
  if (!arcanist.value) return;
  menu.value = { x: e.clientX, y: e.clientY };
};
const addToPlanner = () => {
  if (arcanist.value) plannerStore.addDefaultArcanist(arcanist.value);
  closeMenu();
};

watch(menu, (value) => {
  if (value) {
    window.addEventListener("click", closeMenu);
    window.addEventListener("contextmenu", closeMenu, true);
    window.addEventListener("scroll", closeMenu, true);
    window.addEventListener("keydown", onKeydown);
  } else {
    window.removeEventListener("click", closeMenu);
    window.removeEventListener("contextmenu", closeMenu, true);
    window.removeEventListener("scroll", closeMenu, true);
    window.removeEventListener("keydown", onKeydown);
  }
});
onBeforeUnmount(closeMenu);
</script>

<template>
  <div
    class="group relative w-16 shrink-0 overflow-hidden rounded-md cursor-pointer"
    @contextmenu.prevent="openMenu"
  >
    <Teleport to="body">
      <ul
        v-if="menu"
        class="menu fixed z-[1000] w-44 rounded-md border border-base-content/30 bg-base-200 p-1 shadow-lg"
        :style="{ left: menu.x + 'px', top: menu.y + 'px' }"
        @click.stop
        @contextmenu.prevent
      >
        <li class="px-3 py-1 font-semibold text-white truncate">{{ name }}</li>
        <li :class="{ disabled: inPlanner }">
          <a
            :class="{
              'cursor-pointer': !inPlanner,
              'opacity-40 cursor-not-allowed': inPlanner,
            }"
            :aria-disabled="inPlanner"
            @click.prevent="!inPlanner && addToPlanner()"
          >
            {{ $t("Add to planner") }}
          </a>
        </li>
      </ul>
    </Teleport>
    <div
      v-if="borderClass"
      class="absolute inset-0 z-10 rounded-md pointer-events-none"
      :class="borderClass"
    ></div>
    <div :class="{ 'opacity-40 grayscale': !owned }">
      <img
        class="w-full aspect-[57/131] object-contain object-center rounded-b-full transition-transform duration-300 group-hover:scale-110"
        :src="getArcanistI0ImagePath(arcanistId)"
        :alt="name"
      />
      <div
        class="absolute inset-0 bg-gray-500 opacity-0 group-hover:opacity-40 transition-opacity duration-300 pointer-events-none"
      ></div>
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
