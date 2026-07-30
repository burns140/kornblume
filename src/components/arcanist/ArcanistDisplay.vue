<!-- eslint-disable no-unused-vars -->
<!-- eslint-disable @typescript-eslint/no-unused-vars -->
<script setup lang="ts">
import { ref, computed, watch, onBeforeMount } from 'vue';
import { useRoute } from 'vue-router';
import { useDataStore } from '@/stores/dataStore';
import { useArcanistOwnershipStore, } from '@/stores/arcanistOwnershipStore';
import { IArcanist } from '@/types'
import type { IArcanistOwnershipEntry, OwnershipSource } from '@/stores/arcanistOwnershipStore';
import { getArcanistI2ImagePath, getArcanistAfflatusPath, getAfflatusList, getArcanistDmgTypePath } from '@/composables/images';
import ArcanistIconDisplay from '@/components/arcanist/ArcanistIconDisplay.vue';
import Stats from '@/components/arcanist/info/Stats.vue';
import Resonance from '@/components/arcanist/info/Resonance.vue';
import Euphoria from './info/Euphoria.vue';

const route = useRoute();
const arcanistStore = useDataStore().arcanists;
const ownershipStore = useArcanistOwnershipStore();
const arcanist = ref<IArcanist>(arcanistStore[0]);
const buttons = ['Stats', 'Resonance', 'Euphoria'];
const selectedButton = ref(buttons[0]);
const ownership = computed(() => ownershipStore.getEffectiveEntry(arcanist.value?.Id ?? -1));
const ownershipSource = computed<OwnershipSource>(() => {
    const manualEntry = ownershipStore.getManualEntry(arcanist.value?.Id ?? -1);
    if (manualEntry) {
        return 'manual';
    }

    const trackerEntry = ownershipStore.getTrackerEntry(arcanist.value?.Id ?? -1);
    if (trackerEntry) {
        return 'tracker';
    }

    return 'none';
});

const isManualOwnershipActive = computed(() => ownership.value?.source === 'manual' && ownership.value?.isOwned === true);
const hasEuphoria = computed(() => (arcanist.value?.Euphoria?.length ?? 0) > 0);
const euphoriaRows = computed(() => Array.from({ length: arcanist.value?.Euphoria?.length ?? 0 }, (_, index) => index));
const draftLevel = ref('');
const draftResonance = ref('');

const clampLevel = (insight: number, level: number) => {
    const insightMaxLevels = [30, 40, 50, 60];
    return Math.min(insightMaxLevels[insight] ?? 60, Math.max(1, level));
};

const clampResonance = (insight: number, resonance: number) => {
    const insightMaxResonance = [1, 5, 10, 15];
    return Math.min(insightMaxResonance[insight] ?? 15, Math.max(1, resonance));
};

const parseResonanceInput = (rawValue: string | number) => {
    if (typeof rawValue === 'string') {
        if (rawValue.trim() === '') return 1;
        return Number(rawValue);
    }
    return rawValue;
};

const applyOwnershipUpdate = (updates: Partial<IArcanistOwnershipEntry>) => {
    if (!arcanist.value) return;

    ownershipStore.updateEntry(arcanist.value.Id, {
        Id: arcanist.value.Id,
        Name: arcanist.value.Name,
        ...updates,
    });
};

const setOwned = (value: boolean) => {
    applyOwnershipUpdate({ isOwned: value });
};

const setCurrentLevel = (value: number) => {
    const insight = ownership.value?.currentInsight ?? 0;
    applyOwnershipUpdate({ currentLevel: clampLevel(insight, value) });
};

const setCurrentInsight = (value: number) => {
    const rawDraftLevel = draftLevel.value.trim();
    const parsedDraftLevel = rawDraftLevel === '' ? NaN : Number(rawDraftLevel);
    const currentLevel = Number.isFinite(parsedDraftLevel) ? parsedDraftLevel : (ownership.value?.currentLevel ?? 1);
    const nextLevel = clampLevel(value, currentLevel);
    const currentResonance = ownership.value?.currentResonance ?? 1;
    const nextResonance = clampResonance(value, currentResonance);
    applyOwnershipUpdate({
        currentInsight: value,
        currentLevel: nextLevel,
        currentResonance: nextResonance,
    });
    draftLevel.value = String(nextLevel);
};

const setCurrentResonance = (rawValue: string | number) => {
    const insight = ownership.value?.currentInsight ?? 0;
    const parsedValue = parseResonanceInput(rawValue);
    const nextValue = Number.isFinite(parsedValue) ? parsedValue : 1;
    applyOwnershipUpdate({ currentResonance: clampResonance(insight, nextValue) });
};

const setCurrentPortrait = (value: number) => {
    applyOwnershipUpdate({ currentPortrait: value });
};

const setCurrentEuphoria = (index: number, value: number) => {
    const current = ownership.value?.currentEuphoria ?? [];
    const nextEuphoria = Array.from(
        { length: euphoriaRows.value.length },
        (_, i) => current[i] ?? 0,
    );
    nextEuphoria[index] = value;
    applyOwnershipUpdate({ currentEuphoria: nextEuphoria });
};

const setCurrentEuphoriaEnabled = (index: number, value: boolean) => {
    const currentEnabled = ownership.value?.currentEuphoriaEnabled ?? [];
    const current = ownership.value?.currentEuphoria ?? [];
    const nextEnabled = Array.from(
        { length: euphoriaRows.value.length },
        (_, i) => currentEnabled[i] ?? false,
    );

    const nextEuphoria = Array.from(
        { length: euphoriaRows.value.length },
        (_, i) => current[i] ?? 0,
    );

    nextEnabled[index] = value;
    nextEuphoria[index] = value || 0;
    applyOwnershipUpdate({
        currentEuphoriaEnabled: nextEnabled,
        currentEuphoria: nextEuphoria,
    });
};

const startLevelEdit = () => {
    draftLevel.value = String(ownership.value?.currentLevel ?? 1);
};

const startResonanceEdit = () => {
    draftResonance.value = String(ownership.value?.currentResonance ?? 1);
};

const commitResonanceEdit = (event: Event) => {
    if (!arcanist.value) return;

    const target = event.target as HTMLInputElement;
    const rawValue = target.value.trim();
    const parsedValue = rawValue === '' ? 1 : Number(rawValue);
    const insight = ownership.value?.currentInsight ?? 0;
    const nextValue = Number.isFinite(parsedValue) ? clampResonance(insight, parsedValue) : clampResonance(insight, 1);

    draftResonance.value = String(nextValue);
    setCurrentResonance(nextValue);
};

const handleResonanceKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
        (event.target as HTMLInputElement).blur();
    }
};

const commitLevelEdit = (event: Event) => {
    if (!arcanist.value) return;

    const target = event.target as HTMLInputElement;
    const rawValue = target.value.trim();
    const parsedValue = rawValue === '' ? 1 : Number(rawValue);
    const insight = ownership.value?.currentInsight ?? 0;
    const nextValue = Number.isFinite(parsedValue) ? clampLevel(insight, parsedValue) : clampLevel(insight, 1);

    draftLevel.value = String(nextValue);
    setCurrentLevel(nextValue);
};

const handleLevelKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
        (event.target as HTMLInputElement).blur();
    }
};

watch(
    ownership,
    (newOwnership) => {
        draftLevel.value = String(newOwnership?.currentLevel ?? 1);
        draftResonance.value = String(newOwnership?.currentResonance ?? 1);
        if (newOwnership && newOwnership.currentResonance < 1) {
            const insight = newOwnership.currentInsight ?? 0;
            applyOwnershipUpdate({ currentResonance: clampResonance(insight, newOwnership.currentResonance) });
        }
    },
    { immediate: true }
);

onBeforeMount(() => {
    arcanist.value = arcanistStore.find(arc => arc.Id === Number(route.params.id)) || arcanistStore[0];
    draftLevel.value = String(ownership.value?.currentLevel ?? 1);
    draftResonance.value = String(ownership.value?.currentResonance ?? 1);
    if (ownership.value && ownership.value.currentResonance < 1) {
        const insight = ownership.value.currentInsight ?? 0;
        applyOwnershipUpdate({ currentResonance: clampResonance(insight, ownership.value.currentResonance) });
    }
});

</script>

<template>
    <div class="container flex flex-col xl:flex-row justify-center items-center">
        <!--I2 Portrait-->
        <div class="w-full xl:w-1/2 relative p-4 flex justify-center">
            <img class="lg:h-[80vh] object-contain object-center text-2xl text-white font-bold"
                :src="getArcanistI2ImagePath(arcanist?.Id.toString() ?? '')" alt="Work in progress">
        </div>

        <!--Infomation-->
        <div class="flex flex-col w-full xl:w-1/2 gap-y-4 max-w-xl 2xl:max-w-2xl p-4 self-start">
            <!--Name and Selectors-->
            <div class="p-4 rounded shadow custom-border w-full">
                <div class="flex flex-wrap items-center space-x-2">
                    <ArcanistIconDisplay :arcanist="arcanist" />
                    <h2 class="text-white text-xl lg:text-3xl font-bold"> {{ $t(arcanist?.Name) }} </h2>
                    <p class="pt-1" :class="{
                        'text-orange-300': arcanist?.Rarity === 6,
                        'text-yellow-100': arcanist?.Rarity === 5,
                        'text-purple-400': arcanist?.Rarity === 4,
                        'text-sky-200': arcanist?.Rarity === 3,
                        'text-green-200': arcanist?.Rarity === 2
                    }"> {{ arcanist?.Rarity }} <i class="fa-solid fa-star"></i> </p>
                    <img v-for="afflatus in getAfflatusList(arcanist?.Afflatus ?? '')" :key="afflatus"
                        class="inline-block w-10" :src="getArcanistAfflatusPath(afflatus)" alt="">
                    <!-- <img class="inline-block w-8 pb-2" :src="getArcanistDmgTypePath('1')" alt=""> -->
                </div>
                <div class="flex flex-wrap gap-x-2 gap-y-2 pt-2 justify-center items-center sm:justify-start">
                    <button v-for="(button, index) in buttons" :key="index" @click="selectedButton = button"
                        :class="['hover:bg-info rounded-md text-white py-1 px-3', selectedButton === button ? 'border-button' : '']">
                        {{ $t(button) }}
                    </button>
                </div>
                <div class="mt-4 rounded-lg border border-slate-700 bg-slate-900/60 p-4 text-sm text-slate-200">
                    <div v-if="(ownership?.isOwned ?? false)" class="mb-3 flex flex-wrap items-center gap-2">
                        <span class="rounded-full border border-slate-600 px-2 py-1 text-xs uppercase tracking-wide text-slate-300">
                            Ownership: {{ ownershipSource }}
                        </span>
                        <span v-if="ownershipSource === 'manual'" class="text-xs text-emerald-400">You set this manually.</span>
                        <span v-else-if="ownershipSource === 'tracker'" class="text-xs text-sky-400">Pulled from summon tracker data.</span>
                        <span v-else class="text-xs text-slate-400">No ownership data yet.</span>
                    </div>
                    <div v-else class="mb-3 text-xs text-slate-400">
                        Ownership is not marked as present.
                    </div>
                    <div class="flex flex-col gap-3">
                        <label class="flex items-center gap-2">
                            <input
                                type="checkbox"
                                class="checkbox checkbox-info checkbox-sm"
                                :checked="ownership?.isOwned ?? false"
                                @change="setOwned(($event.target as HTMLInputElement).checked)" />
                            <span>Owned</span>
                        </label>
                        <div class="flex flex-wrap items-center gap-3">
                            <label class="flex items-center gap-2">
                                <span>Level</span>
                                <input
                                    type="number"
                                    :min="ownership?.currentInsight === 0 ? 1 : 0"
                                    :max="ownership?.currentInsight === 0 ? 30 : ownership?.currentInsight === 1 ? 40 : ownership?.currentInsight === 2 ? 50 : 60"
                                    class="input input-sm w-24 bg-slate-800 text-white"
                                    :disabled="!isManualOwnershipActive"
                                    :value="draftLevel"
                                    @focus="startLevelEdit"
                                    @input="draftLevel = ($event.target as HTMLInputElement).value"
                                    @blur="commitLevelEdit($event)"
                                    @keydown="handleLevelKeydown($event)" />
                            </label>
                            <label class="flex items-center gap-2">
                                <span>Insight</span>
                                <select
                                    class="select select-sm w-20 bg-slate-800 text-white"
                                    :disabled="!isManualOwnershipActive"
                                    :value="ownership?.currentInsight ?? 0"
                                    @change="setCurrentInsight(Number(($event.target as HTMLSelectElement).value))">
                                    <option :value="0">0</option>
                                    <option :value="1">1</option>
                                    <option :value="2">2</option>
                                    <option :value="3">3</option>
                                </select>
                            </label>
                            <label class="flex items-center gap-2">
                                <span>Resonance</span>
                                <input
                                    type="number"
                                    min="1"
                                    :max="ownership?.currentInsight === 0 ? 1 : ownership?.currentInsight === 1 ? 5 : ownership?.currentInsight === 2 ? 10 : 15"
                                    class="input input-sm w-20 bg-slate-800 text-white"
                                    :disabled="!isManualOwnershipActive"
                                    :value="draftResonance"
                                    @focus="startResonanceEdit"
                                    @input="draftResonance = ($event.target as HTMLInputElement).value"
                                    @change="commitResonanceEdit($event)"
                                    @blur="commitResonanceEdit($event)"
                                    @keydown="handleResonanceKeydown($event)" />
                            </label>
                            <label class="flex items-center gap-2">
                                <span>Portrait</span>
                                <select
                                    class="select select-sm w-20 bg-slate-800 text-white"
                                    :disabled="!isManualOwnershipActive"
                                    :value="ownership?.currentPortrait ?? 0"
                                    @change="setCurrentPortrait(Number(($event.target as HTMLSelectElement).value))">
                                    <option :value="0">0</option>
                                    <option :value="1">1</option>
                                    <option :value="2">2</option>
                                    <option :value="3">3</option>
                                    <option :value="4">4</option>
                                    <option :value="5">5</option>
                                </select>
                            </label>
                        </div>
                        <div class="flex flex-col gap-3" v-if="hasEuphoria">
                            <div
                                class="flex flex-wrap items-center gap-3"
                                v-for="index in euphoriaRows"
                                :key="index">
                                <label class="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        class="checkbox checkbox-info checkbox-sm"
                                        :disabled="!isManualOwnershipActive"
                                        :checked="ownership?.currentEuphoriaEnabled?.[index] ?? false"
                                        @change="setCurrentEuphoriaEnabled(index, ($event.target as HTMLInputElement).checked)" />
                                    <span>Euphoria {{ index + 1 }}</span>
                                    <select
                                        class="select select-sm w-20 bg-slate-800 text-white"
                                        :disabled="!isManualOwnershipActive || !(ownership?.currentEuphoriaEnabled?.[index] ?? false)"
                                        :value="ownership?.currentEuphoria?.[index] ?? 0"
                                        @change="setCurrentEuphoria(index, Number(($event.target as HTMLSelectElement).value))">
                                        <option :value="0">0</option>
                                        <option :value="1">1</option>
                                        <option :value="2">2</option>
                                        <option :value="3">3</option>
                                        <option :value="4">4</option>
                                    </select>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <!--Info Cards-->
            <div class="p-4 rounded shadow custom-border w-full">
                <Stats :arcanist="arcanist ?? {}" v-if="selectedButton === 'Stats'" />
                <Resonance :arcanist="arcanist ?? {}" v-if="selectedButton === 'Resonance'" />
                <Euphoria :arcanist="arcanist ?? {}" v-if="selectedButton === 'Euphoria'" />
            </div>
        </div>
    </div>
</template>

<style scoped>
button:disabled {
    opacity: 0.25;
}
</style>
