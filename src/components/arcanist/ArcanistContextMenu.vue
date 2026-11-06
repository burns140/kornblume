<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { useDataStore } from "@/stores/dataStore";
import ArcanistContextMenuPopup from "./ArcanistContextMenuPopup.vue";

// Wraps any element to give it the right-click "Add to planner" menu
const props = defineProps<{
  arcanistId: number;
  name: string;
}>();

const dataStore = useDataStore();
const arcanist = computed(() =>
  dataStore.arcanists.find((a) => a.Id === props.arcanistId),
);
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
    <ArcanistContextMenuPopup
      v-if="menu"
      :x="menu.x"
      :y="menu.y"
      :arcanist-id="arcanistId"
      :name="name"
      @close="closeMenu"
    />
  </div>
</template>
