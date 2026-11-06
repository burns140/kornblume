<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { usePlannerStore } from "@/stores/plannerStore";
import { OWNERSHIP_SOURCES } from "@/constants";
import {
  getArcanistI0ImagePath,
  getArcanistFramePath,
  getArcanistAfflatusIconPath,
} from "@/composables/images";
import type { IArcanist } from "@/types";
import type {
  OwnershipSource,
  IArcanistOwnershipEntry,
} from "@/stores/arcanistOwnershipStore";
import { useArcanistOwnershipStore } from "@/stores/arcanistOwnershipStore";

const props = defineProps({
  arcanist: {
    type: Object as () => IArcanist,
    required: true,
  },
});

const ownershipStore = useArcanistOwnershipStore();
const effectiveOwnership = computed<IArcanistOwnershipEntry | undefined>(() =>
  ownershipStore.getEffectiveEntry(props.arcanist.Id),
);
const ownershipSource = computed<OwnershipSource>(() =>
  effectiveOwnership.value
    ? effectiveOwnership.value.source
    : OWNERSHIP_SOURCES.NONE,
);

const ownershipTooltip = computed(() => {
  if (ownershipSource.value === OWNERSHIP_SOURCES.MANUAL) {
    return "Manual";
  }
  if (ownershipSource.value === OWNERSHIP_SOURCES.TRACKER) {
    return "Tracker";
  }
  return "";
});

const plannerStore = usePlannerStore();
const inPlanner = computed(() => plannerStore.hasArcanist(props.arcanist.Id));
const menu = ref<{ x: number; y: number } | null>(null);

const closeMenu = () => {
  menu.value = null;
};
const onKeydown = (e: KeyboardEvent) => {
  if (e.key === "Escape") closeMenu();
};
const openMenu = (e: MouseEvent) => {
  menu.value = { x: e.clientX, y: e.clientY };
};
const addToPlanner = () => {
  plannerStore.addDefaultArcanist(props.arcanist);
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

const displayPortraitCount = computed(() => {
  if (!effectiveOwnership.value) {
    return null;
  }
  return effectiveOwnership.value.portrait;
});
</script>

<template>
  <div
    class="p-2.5 relative overflow-hidden group"
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
        <li class="px-3 py-1 font-semibold text-white truncate">{{ $t(props.arcanist.Name) }}</li>
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
    <div class="transform transition-transform duration-500 overflow-hidden">
      <img
        class="w-16 sm:w-20 aspect-[57/131] object-contain object-center rounded-b-full scale-[1.025] transform transition-transform duration-300 group-hover:scale-125"
        :src="getArcanistI0ImagePath(props.arcanist.Id)"
        :alt="props.arcanist.Name"
      />
      <!-- Overlay -->
      <div
        class="overlay absolute inset-0 bg-gray-500 opacity-0 group-hover:opacity-50 transition-opacity duration-300"
      ></div>
      <span
        v-if="displayPortraitCount !== null"
        class="absolute top-0.5 right-1.5 w-auto px-1 text-center text-sm font-bold text-white/90 bg-opacity-50 rounded-md bg-black"
        :title="ownershipTooltip"
      >
        <span>{{ $t("P{portrait}", { portrait: displayPortraitCount }) }}</span>
      </span>
      <img
        class="absolute top-0 left-0 w-4 opacity-90"
        :src="getArcanistAfflatusIconPath(props.arcanist.Afflatus)"
        alt=""
      />
      <img
        class="absolute bottom-0 w-16 sm:w-20 rounded-md"
        :src="getArcanistFramePath(props.arcanist.Rarity)"
        alt=""
      />
      <span
        class="absolute bottom-0 w-16 sm:w-20 text-center text-white/90 py-2.5 text-shadow font-bold opacity-95"
      >
        {{ $t(props.arcanist.Name) }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.transform {
  border: 2px solid transparent;
  box-sizing: border-box;
}

.overlay {
  pointer-events: none;
}
.text-shadow {
  font-size: 0.825rem;
  line-height: 1rem;
  text-shadow:
    -1px 0 black,
    0 1px black,
    1px 0 black,
    0 -1px black;
}
/* .transform:hover {
    border-color: white;
    border-radius: 0.5rem;
} */
</style>
