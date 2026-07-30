<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useArcanistOwnershipStore } from '@/stores/arcanistOwnershipStore';
import type { IArcanistOwnershipEntry, OwnershipSource } from '@/stores/arcanistOwnershipStore';
import type { IArcanist } from '@/types';

const props = defineProps<{
    arcanist?: IArcanist;
}>();

const ownershipStore = useArcanistOwnershipStore();
const effectiveEntry = computed(() => ownershipStore.getEffectiveEntry(props.arcanist?.Id ?? -1));
const ownershipSource = computed<OwnershipSource>(() => effectiveEntry.value?.source ?? 'none');

const isOwnedChecked = computed(() => ownershipSource.value === 'manual');
const ownershipToggleLabel = computed(() => ownershipSource.value === 'tracker' ? 'Overwrite tracker ownership' : 'Owned');
const hasEuphoria = computed(() => (props.arcanist?.Euphoria?.length ?? 0) > 0);
const euphoriaRows = computed(() => Array.from({ length: props.arcanist?.Euphoria?.length ?? 0 }, (_, index) => index));
const canEnableEuphoria = computed(() => {
    if (!effectiveEntry.value || ownershipSource.value !== 'manual') {
        return false;
    }
    return (effectiveEntry.value.insight ?? 0) === 3 && (effectiveEntry.value.level ?? 1) >= 30;
});
const inputLevel = ref('');
const inputResonance = ref('');

const clampLevel = (insight: number, level: number) => {
    const insightMaxLevels = [30, 40, 50, 60];
    return Math.min(insightMaxLevels[insight] ?? 60, Math.max(1, level));
};

const clampResonance = (insight: number, resonance: number) => {
    const insightMaxResonance = [1, 5, 10, 15];
    return Math.min(insightMaxResonance[insight] ?? 15, Math.max(1, resonance));
};

const parseAndClamp = (rawValue: string | number, insight: number, fallback: number, clamp: (insight: number, value: number) => number) => {
    const parsedValue = typeof rawValue === 'string'
        ? (rawValue.trim() === '' ? fallback : Number(rawValue.trim()))
        : rawValue;

    const nextValue = Number.isFinite(parsedValue) ? parsedValue : fallback;
    return clamp(insight, nextValue);
};

const applyOwnershipUpdate = (updates: Partial<IArcanistOwnershipEntry>) => {
    if (!props.arcanist) {
        return;
    }

    ownershipStore.updateEntry(props.arcanist.Id, {
        Id: props.arcanist.Id,
        Name: props.arcanist.Name,
        ...updates,
    });
};

const getNormalizedEuphoriaState = (insight: number, level: number) => {
    const currentEuphorias = effectiveEntry.value?.euphorias ?? [];
    const currentEuphoriaEnabled = effectiveEntry.value?.euphoriasEnabled ?? [];
    const shouldDisableEuphoria = insight < 3 || level < 30;

    const normalizedEuphoriaEnabled = Array.from(
        { length: euphoriaRows.value.length },
        (_, i) => (shouldDisableEuphoria ? false : (currentEuphoriaEnabled[i] ?? false)),
    );
    const normalizedEuphorias = Array.from(
        { length: euphoriaRows.value.length },
        (_, i) => (normalizedEuphoriaEnabled[i] ? (currentEuphorias[i] ?? 0) : 0),
    );

    return {
        normalizedEuphoriaEnabled,
        normalizedEuphorias,
    };
};

const normalizeManualEntryValues = () => {
    if (!effectiveEntry.value || ownershipSource.value !== 'manual') {
        return;
    }

    const currentEuphorias = effectiveEntry.value.euphorias ?? [];
    const currentEuphoriaEnabled = effectiveEntry.value.euphoriasEnabled ?? [];
    const insight = effectiveEntry.value.insight ?? 0;
    const normalizedLevel = clampLevel(insight, effectiveEntry.value.level ?? 1);
    const normalizedResonance = clampResonance(insight, effectiveEntry.value.resonance ?? 1);
    const {
        normalizedEuphoriaEnabled,
        normalizedEuphorias,
    } = getNormalizedEuphoriaState(insight, normalizedLevel);

    const euphoriaEnabledChanged = normalizedEuphoriaEnabled.some(
        (value, i) => value !== (currentEuphoriaEnabled[i] ?? false),
    ) || normalizedEuphoriaEnabled.length !== currentEuphoriaEnabled.length;

    const euphoriasChanged = normalizedEuphorias.some(
        (value, i) => value !== (currentEuphorias[i] ?? 0),
    ) || normalizedEuphorias.length !== currentEuphorias.length;

    if (
        normalizedLevel === effectiveEntry.value.level
        && normalizedResonance === effectiveEntry.value.resonance
        && !euphoriaEnabledChanged
        && !euphoriasChanged
    ) {
        return;
    }

    applyOwnershipUpdate({
        level: normalizedLevel,
        resonance: normalizedResonance,
        euphoriasEnabled: normalizedEuphoriaEnabled,
        euphorias: normalizedEuphorias,
    });
};

const setOwned = (value: boolean) => {
    if (!props.arcanist) {
        return;
    }

    if (!value) {
        ownershipStore.removeEntry(props.arcanist.Id);
        return;
    }

    ownershipStore.setOwned(props.arcanist.Id, props.arcanist.Name);
};

const setCurrentInsight = (value: number) => {
    const levelInputText = inputLevel.value.trim();
    const enteredLevel = levelInputText === '' ? NaN : Number(levelInputText);
    const preservedLevel = Number.isFinite(enteredLevel) ? enteredLevel : (effectiveEntry.value?.level ?? 1);
    const nextLevel = clampLevel(value, preservedLevel);
    const nextResonance = clampResonance(value, effectiveEntry.value?.resonance ?? 1);
    const {
        normalizedEuphoriaEnabled,
        normalizedEuphorias,
    } = getNormalizedEuphoriaState(value, nextLevel);

    applyOwnershipUpdate({
        insight: value,
        level: nextLevel,
        resonance: nextResonance,
        euphoriasEnabled: normalizedEuphoriaEnabled,
        euphorias: normalizedEuphorias,
    });
    inputLevel.value = String(nextLevel);
};

const setCurrentPortrait = (value: number) => {
    applyOwnershipUpdate({ portrait: value });
};

const setCurrentEuphoria = (index: number, value: number) => {
    if (!canEnableEuphoria.value) {
        return;
    }

    const current = effectiveEntry.value?.euphorias ?? [];
    const nextEuphoria = Array.from(
        { length: euphoriaRows.value.length },
        (_, i) => current[i] ?? 0,
    );
    nextEuphoria[index] = value;
    applyOwnershipUpdate({ euphorias: nextEuphoria });
};

const setCurrentEuphoriaEnabled = (index: number, value: boolean) => {
    const currentEnabled = effectiveEntry.value?.euphoriasEnabled ?? [];
    const current = effectiveEntry.value?.euphorias ?? [];
    const nextEnabled = Array.from(
        { length: euphoriaRows.value.length },
        (_, i) => currentEnabled[i] ?? false,
    );

    const nextEuphoria = Array.from(
        { length: euphoriaRows.value.length },
        (_, i) => current[i] ?? 0,
    );

    const nextEnabledValue = value && canEnableEuphoria.value;
    nextEnabled[index] = nextEnabledValue;
    nextEuphoria[index] = nextEnabledValue ? (current[index] ?? 0) : 0;
    applyOwnershipUpdate({
        euphoriasEnabled: nextEnabled,
        euphorias: nextEuphoria,
    });
};

const startLevelEdit = () => {
    inputLevel.value = String(effectiveEntry.value?.level ?? 1);
};

const startResonanceEdit = () => {
    inputResonance.value = String(effectiveEntry.value?.resonance ?? 1);
};

const commitResonanceEdit = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const insight = effectiveEntry.value?.insight ?? 0;
    const nextValue = parseAndClamp(target.value, insight, 1, clampResonance);

    inputResonance.value = String(nextValue);
    applyOwnershipUpdate({ resonance: nextValue });
};

const handleResonanceKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
        (event.target as HTMLInputElement).blur();
    }
};

const commitLevelEdit = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const insight = effectiveEntry.value?.insight ?? 0;
    const nextValue = parseAndClamp(target.value, insight, 1, clampLevel);
    const {
        normalizedEuphoriaEnabled,
        normalizedEuphorias,
    } = getNormalizedEuphoriaState(insight, nextValue);

    inputLevel.value = String(nextValue);
    applyOwnershipUpdate({
        level: nextValue,
        euphoriasEnabled: normalizedEuphoriaEnabled,
        euphorias: normalizedEuphorias,
    });
};

const handleLevelKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
        (event.target as HTMLInputElement).blur();
    }
};

watch(
    effectiveEntry,
    (newEffectiveEntry) => {
        inputLevel.value = String(newEffectiveEntry?.level ?? 1);
        inputResonance.value = String(newEffectiveEntry?.resonance ?? 1);
        normalizeManualEntryValues();
    },
    { immediate: true }
);

watch(
    () => props.arcanist?.Id,
    () => {
        inputLevel.value = String(effectiveEntry.value?.level ?? 1);
        inputResonance.value = String(effectiveEntry.value?.resonance ?? 1);
        normalizeManualEntryValues();
    },
    { immediate: true }
);
</script>

<template>
    <div class="mt-4 rounded-lg border border-slate-700 bg-slate-900/60 p-4 text-sm text-slate-200">
        <div class="mb-3 flex flex-wrap items-center gap-2">
            <span class="rounded-full border border-slate-600 px-2 py-1 text-xs uppercase tracking-wide text-slate-300">
                Ownership: {{ effectiveEntry ? ownershipSource : 'NONE' }}
            </span>
            <span v-if="effectiveEntry && ownershipSource === 'manual'" class="text-xs text-emerald-400">You set this manually.</span>
            <span v-else-if="effectiveEntry && ownershipSource === 'tracker'" class="text-xs text-sky-400">Showing ownership from summon tracker.</span>
            <span v-else class="text-xs text-slate-400">Ownership is not marked as present.</span>
        </div>
        <div class="flex flex-col gap-3">
            <div class="flex items-center gap-2">
                <input
                    type="checkbox"
                    class="checkbox checkbox-info checkbox-sm"
                    :checked="isOwnedChecked"
                    @change="setOwned(($event.target as HTMLInputElement).checked)" />
                <span>{{ ownershipToggleLabel }}</span>
            </div>
            <div v-if="ownershipSource === 'manual' && effectiveEntry" class="flex flex-wrap items-center gap-3">
                <label class="flex items-center gap-2">
                    <span>Level</span>
                    <input
                        type="number"
                        min="1"
                        :max="effectiveEntry?.insight === 0 ? 30 : effectiveEntry?.insight === 1 ? 40 : effectiveEntry?.insight === 2 ? 50 : 60"
                        class="input input-sm w-24 bg-slate-800 text-white"
                        :value="inputLevel"
                        @focus="startLevelEdit"
                        @input="inputLevel = ($event.target as HTMLInputElement).value"
                        @blur="commitLevelEdit($event)"
                        @keydown="handleLevelKeydown($event)" />
                </label>
                <label class="flex items-center gap-2">
                    <span>Insight</span>
                    <select
                        class="select select-sm w-20 bg-slate-800 text-white"
                        :value="effectiveEntry?.insight ?? 0"
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
                        :max="effectiveEntry?.insight === 0 ? 1 : effectiveEntry?.insight === 1 ? 5 : effectiveEntry?.insight === 2 ? 10 : 15"
                        class="input input-sm w-20 bg-slate-800 text-white"
                        :value="inputResonance"
                        @focus="startResonanceEdit"
                        @input="inputResonance = ($event.target as HTMLInputElement).value"
                        @change="commitResonanceEdit($event)"
                        @blur="commitResonanceEdit($event)"
                        @keydown="handleResonanceKeydown($event)" />
                </label>
                <label class="flex items-center gap-2">
                    <span>Portrait</span>
                    <select
                        class="select select-sm w-20 bg-slate-800 text-white"
                        :value="effectiveEntry?.portrait ?? 0"
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
            <div v-if="ownershipSource === 'manual' && effectiveEntry && hasEuphoria" class="flex flex-col gap-3">
                <div
                    v-for="index in euphoriaRows"
                    :key="index"
                    class="flex flex-wrap items-center gap-3">
                    <label class="flex items-center gap-2">
                        <input
                            type="checkbox"
                            class="checkbox checkbox-info checkbox-sm"
                            :disabled="!canEnableEuphoria"
                            :checked="effectiveEntry?.euphoriasEnabled?.[index] ?? false"
                            @change="setCurrentEuphoriaEnabled(index, ($event.target as HTMLInputElement).checked)" />
                        <span :class="!canEnableEuphoria ? 'text-slate-500' : ''">Euphoria {{ index + 1 }}</span>
                        <select
                            class="select select-sm w-20 bg-slate-800 text-white"
                            :disabled="!canEnableEuphoria || !(effectiveEntry?.euphoriasEnabled?.[index] ?? false)"
                            :value="effectiveEntry?.euphorias?.[index] ?? 0"
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
