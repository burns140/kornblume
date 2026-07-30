<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useArcanistOwnershipStore } from '@/stores/arcanistOwnershipStore';
import type { IArcanistOwnershipEntry, OwnershipSource } from '@/stores/arcanistOwnershipStore';
import type { IArcanist } from '@/types';

const props = defineProps<{
    arcanist?: IArcanist;
}>();

const ownershipStore = useArcanistOwnershipStore();
const manualOwnership = computed(() => ownershipStore.getManualEntry(props.arcanist?.Id ?? -1));
const ownership = computed(() => ownershipStore.getEffectiveEntry(props.arcanist?.Id ?? -1));
const ownershipSource = computed<OwnershipSource>(() => ownership.value?.source ?? 'none');

const checkboxIsChecked = computed(() => manualOwnership.value?.isOwned ?? false);
const ownershipToggleLabel = computed(() => ownershipSource.value === 'tracker' ? 'Overwrite tracker ownership' : 'Owned');
const hasEuphoria = computed(() => (props.arcanist?.Euphoria?.length ?? 0) > 0);
const euphoriaRows = computed(() => Array.from({ length: props.arcanist?.Euphoria?.length ?? 0 }, (_, index) => index));
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
    if (!props.arcanist) return;

    ownershipStore.updateEntry(props.arcanist.Id, {
        Id: props.arcanist.Id,
        Name: props.arcanist.Name,
        ...updates,
    });
};

const normalizeResonanceIfNeeded = () => {
    if (!ownership.value || ownership.value.currentResonance >= 1) return;

    const insight = ownership.value.currentInsight ?? 0;
    applyOwnershipUpdate({ currentResonance: clampResonance(insight, ownership.value.currentResonance) });
};

const setOwned = (value: boolean) => {
    if (!props.arcanist) return;

    if (!value) {
        if (manualOwnership.value) {
            ownershipStore.removeEntry(props.arcanist.Id);
        }
        return;
    }

    ownershipStore.setOwned(props.arcanist.Id, props.arcanist.Name, true);
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
    nextEuphoria[index] = value ? (current[index] ?? 0) : 0;
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
        normalizeResonanceIfNeeded();
    },
    { immediate: true }
);

watch(
    () => props.arcanist?.Id,
    () => {
        draftLevel.value = String(ownership.value?.currentLevel ?? 1);
        draftResonance.value = String(ownership.value?.currentResonance ?? 1);
        normalizeResonanceIfNeeded();
    },
    { immediate: true }
);
</script>

<template>
    <div class="mt-4 rounded-lg border border-slate-700 bg-slate-900/60 p-4 text-sm text-slate-200">
        <div class="mb-3 flex flex-wrap items-center gap-2">
            <span class="rounded-full border border-slate-600 px-2 py-1 text-xs uppercase tracking-wide text-slate-300">
                Ownership: {{ ownership?.isOwned ? ownershipSource : 'NONE' }}
            </span>
            <span v-if="ownership?.isOwned && ownershipSource === 'manual'" class="text-xs text-emerald-400">You set this manually.</span>
            <span v-else-if="ownership?.isOwned && ownershipSource === 'tracker'" class="text-xs text-sky-400">Showing ownership from summon tracker.</span>
            <span v-else class="text-xs text-slate-400">Ownership is not marked as present.</span>
        </div>
        <div class="flex flex-col gap-3">
            <label class="flex items-center gap-2">
                <input
                    type="checkbox"
                    class="checkbox checkbox-info checkbox-sm"
                    :checked="checkboxIsChecked"
                    @change="setOwned(($event.target as HTMLInputElement).checked)" />
                <span>{{ ownershipToggleLabel }}</span>
            </label>
            <div v-if="ownershipSource === 'manual' && ownership?.isOwned" class="flex flex-wrap items-center gap-3">
                <label class="flex items-center gap-2">
                    <span>Level</span>
                    <input
                        type="number"
                        :min="ownership?.currentInsight === 0 ? 1 : 0"
                        :max="ownership?.currentInsight === 0 ? 30 : ownership?.currentInsight === 1 ? 40 : ownership?.currentInsight === 2 ? 50 : 60"
                        class="input input-sm w-24 bg-slate-800 text-white"
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
            <div v-if="ownershipSource === 'manual' && ownership?.isOwned && hasEuphoria" class="flex flex-col gap-3">
                <div
                    v-for="index in euphoriaRows"
                    :key="index"
                    class="flex flex-wrap items-center gap-3">
                    <label class="flex items-center gap-2">
                        <input
                            type="checkbox"
                            class="checkbox checkbox-info checkbox-sm"
                            :checked="ownership?.currentEuphoriaEnabled?.[index] ?? false"
                            @change="setCurrentEuphoriaEnabled(index, ($event.target as HTMLInputElement).checked)" />
                        <span>Euphoria {{ index + 1 }}</span>
                        <select
                            class="select select-sm w-20 bg-slate-800 text-white"
                            :disabled="!(ownership?.currentEuphoriaEnabled?.[index] ?? false)"
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
</template>

<style scoped>
input:disabled,
select:disabled {
    opacity: 0.6;
}
</style>
