<script setup lang="ts">
import { computed } from "vue";
import { useDataStore } from "@/stores/dataStore";
import { usePlannerStore } from "@/stores/plannerStore";

const props = defineProps<{
  x: number;
  y: number;
  arcanistId: number;
  name: string;
}>();
const emit = defineEmits<{ (e: "close"): void }>();

const MENU_WIDTH = 176;
const FLYOUT_WIDTH = 224;

const dataStore = useDataStore();
const plannerStore = usePlannerStore();
const arcanist = computed(() =>
  dataStore.arcanists.find((a) => a.Id === props.arcanistId),
);
const inPlanner = computed(() => plannerStore.hasArcanist(props.arcanistId));
const hasEuphoria = computed(() => (arcanist.value?.Euphoria ?? []).length > 0);
const flyoutOnLeft = computed(
  () => props.x + MENU_WIDTH + FLYOUT_WIDTH > window.innerWidth,
);

const add = (mode: "new" | "complete" | "completeEuphoria") => {
  if (arcanist.value) plannerStore.addDefaultArcanist(arcanist.value, mode);
  emit("close");
};
</script>

<template>
  <Teleport to="body">
    <ul
      class="menu fixed z-[1000] w-44 rounded-md border border-base-content/30 bg-base-200 p-1 shadow-lg"
      :style="{ left: x + 'px', top: y + 'px' }"
      @click.stop
      @contextmenu.prevent
    >
      <li class="px-3 py-1 font-semibold text-white truncate">{{ name }}</li>
      <li class="group relative" :class="{ disabled: inPlanner }">
        <a
          class="flex items-center justify-between"
          :class="{
            'cursor-pointer': !inPlanner,
            'opacity-40 cursor-not-allowed': inPlanner,
          }"
          :aria-disabled="inPlanner"
        >
          <span>{{ $t("Add to planner") }}</span>
          <svg
            class="h-4 w-4 shrink-0"
            :class="{ 'rotate-180': flyoutOnLeft }"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </a>
        <div
          v-if="!inPlanner"
          class="absolute -top-1 invisible group-hover:visible !bg-transparent"
          :class="flyoutOnLeft ? 'right-full pr-1.5' : 'left-full pl-1.5'"
        >
          <ul
            class="menu w-56 !m-0 rounded-md border border-base-content/30 bg-base-200 !p-1 shadow-lg"
          >
            <li>
              <a class="cursor-pointer" @click.prevent="add('complete')">
                {{ $t("Quick Complete") }}
              </a>
            </li>
            <li v-if="hasEuphoria">
              <a
                class="cursor-pointer"
                @click.prevent="add('completeEuphoria')"
              >
                {{ $t("Quick Complete (w/ Euphoria)") }}
              </a>
            </li>
            <li>
              <a class="cursor-pointer" @click.prevent="add('new')">
                {{ $t("New") }}
              </a>
            </li>
          </ul>
        </div>
      </li>
    </ul>
  </Teleport>
</template>
