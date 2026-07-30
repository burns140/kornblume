<script setup lang="ts">
import { computed } from 'vue';
import { getArcanistI0ImagePath, getArcanistFramePath, getArcanistAfflatusIconPath } from '@/composables/images';
import { IArcanist } from '@/types';
import { useArcanistOwnershipStore } from '@/stores/arcanistOwnershipStore';
import type { OwnershipSource } from '@/stores/arcanistOwnershipStore';

const props = defineProps({
    arcanist: {
        type: Object as () => IArcanist,
        required: true
    },
    count: {
        type: Number,
        required: true
    }
});

const ownershipStore = useArcanistOwnershipStore();
const ownershipSource: OwnershipSource = computed(() => {
    const manualEntry = ownershipStore.getManualEntry(props.arcanist.Id);
    if (manualEntry) {
        return "Manual";
    }

    const trackerEntry = ownershipStore.getTrackerEntry(props.arcanist.Id);
    if (trackerEntry) {
        return "Tracker";
    }

    return "None";
});

</script>

<template>
    <div class="p-2.5 relative overflow-hidden group">
        <div class="transform transition-transform duration-500 overflow-hidden">
            <img class="w-16 sm:w-20 aspect-[57/131] object-contain object-center rounded-b-full scale-[1.025] transform transition-transform duration-300 group-hover:scale-125"
                :src="getArcanistI0ImagePath(props.arcanist.Id)" :alt="props.arcanist.Name" />
            <!-- Overlay -->
            <div
                class="overlay absolute inset-0 bg-gray-500 opacity-0 group-hover:opacity-50 transition-opacity duration-300">
            </div>
            <span v-if="count >= 0"
                class="absolute top-0.5 right-1.5 w-auto px-1 text-center text-sm font-bold text-white/90 bg-opacity-50 rounded-md bg-black">
                <i18n-t keypath='P{portrait}'>
                    <template #portrait>
                        <span> {{ props.count }}</span>
                    </template>
                </i18n-t>
            </span>
            <img class="absolute top-0 left-0 w-4 opacity-90" :src="getArcanistAfflatusIconPath(props.arcanist.Afflatus)"
                alt="">
            <img class="absolute bottom-0 w-16 sm:w-20 rounded-md" :src="getArcanistFramePath(props.arcanist.Rarity)"
                alt="">
            <span class="absolute bottom-0 w-16 sm:w-20 text-center text-white/90 py-2.5 text-shadow font-bold opacity-95"> {{
                $t(props.arcanist.Name) }} </span>
            <div v-if="ownershipSource !== 'none'"
                class="absolute right-1.5 top-1.5 z-20 group/ownership">
                <div class="flex h-6 w-6 items-center justify-center rounded-full border border-white/70 text-white shadow-md"
                    :class="ownershipSource === 'manual' ? 'bg-emerald-600/80' : 'bg-sky-600/80'">
                    <i class="fa-solid fa-check text-[12px]"></i>
                </div>
                <span class="pointer-events-none absolute right-full top-1/2 mr-1 -translate-y-1/2 whitespace-nowrap rounded bg-black/80 px-2 py-1 text-[10px] text-white opacity-0 transition-opacity duration-200 group-hover/ownership:opacity-100">
                    {{ ownershipSource === 'manual' ? 'Manual' : 'Tracker' }}
                </span>
            </div>
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
    text-shadow: -1px 0 black, 0 1px black, 1px 0 black, 0 -1px black;
}
/* .transform:hover {
    border-color: white;
    border-radius: 0.5rem;
} */
</style>
