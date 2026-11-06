<script setup lang="ts">
import { bannerBorderClasses, type BannerType } from "@/utils/bannerData";

defineProps<{
  // Describes the card border: owned character or buildable team
  cardBorder?: "owned" | "team";
  // Teams missing only characters that are on a current banner
  showBannerTeam?: boolean;
}>();

const bannerTypes: BannerType[] = ["event", "rerun", "euphoria", "limited"];
</script>

<template>
  <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm mb-4">
    <span class="font-semibold">{{ $t("border-legend-title") }}</span>
    <span v-if="cardBorder" class="flex items-center gap-1.5">
      <span class="inline-block w-4 h-4 rounded-sm border-2 border-success" />
      {{
        cardBorder === "owned"
          ? $t("border-legend-owned")
          : $t("border-legend-team-buildable")
      }}
    </span>
    <span v-if="showBannerTeam" class="flex items-center gap-1.5">
      <span
        class="inline-block w-4 h-4 rounded-sm border-2 border-pink-400"
      />
      {{ $t("border-legend-team-banner") }}
    </span>
    <span
      v-for="type in bannerTypes"
      :key="type"
      class="flex items-center gap-1.5"
    >
      <span
        class="inline-block w-4 h-4 rounded-full"
        :class="bannerBorderClasses[type]"
      />
      {{ $t(`border-legend-banner-${type}`) }}
    </span>
  </div>
</template>
