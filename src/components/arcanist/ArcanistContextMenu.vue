<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { useDataStore } from "@/stores/dataStore";
import { usePlannerStore } from "@/stores/plannerStore";

// Wraps any element to give it the right-click "Add to planner" menu
const props = defineProps<{
  arcanistId: number;
  name: string;
}>();

const dataStore = useDataStore();
const plannerStore = usePlannerStore();
const arcanist = computed(() =>
  dataStore.arcanists.find((a) => a.Id === props.arcanistId),
);
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
  <div class="contents" @contextmenu.prevent="openMenu">
    <slot />
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
  </div>
</template>
