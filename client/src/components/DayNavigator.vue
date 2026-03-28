<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()

const props = defineProps<{
  modelValue: string
  blockedDates: string[]
  workDays?: number[]
}>()

const emit = defineEmits<{
  'update:modelValue': [date: string]
}>()

const today: string = (() => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
})()
const showPicker = ref(false)
const pickerInput = ref<HTMLInputElement | null>(null)

const effectiveWorkDays = computed(() => props.workDays ?? [1, 2, 3, 4, 5])

watch(showPicker, async val => {
  if (val) {
    await nextTick()
    pickerInput.value?.showPicker?.()
    pickerInput.value?.focus()
  }
})

function isWorkDay(dateStr: string): boolean {
  return effectiveWorkDays.value.includes(new Date(dateStr + 'T00:00:00').getDay())
}

function addDays(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d + n)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function step(direction: 1 | -1) {
  let next = addDays(props.modelValue, direction)
  for (let i = 0; i < 7 && !isWorkDay(next); i++) next = addDays(next, direction)
  if (next < today) return
  emit('update:modelValue', next)
}

const isPrevDisabled = computed(() => {
  let candidate = addDays(props.modelValue, -1)
  for (let i = 0; i < 7 && !isWorkDay(candidate); i++) candidate = addDays(candidate, -1)
  return candidate < today
})

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const localeMap: Record<string, string> = { en: 'en-BE', fr: 'fr-BE', nl: 'nl-BE' }
  const fmt = localeMap[locale.value] ?? 'en-BE'
  return d.toLocaleDateString(fmt, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

const isCurrentBlocked = computed(() => props.blockedDates.includes(props.modelValue))
const isWeekend = computed(() => !isWorkDay(props.modelValue))
const isUnavailable = computed(() => isCurrentBlocked.value || isWeekend.value)

function onPickerChange(e: Event) {
  const val = (e.target as HTMLInputElement).value
  if (val && val >= today) emit('update:modelValue', val)
  showPicker.value = false
}
</script>

<template>
  <div class="flex items-center justify-between gap-4 py-3">
    <button
      @click="step(-1)"
      :disabled="isPrevDisabled"
      class="flex items-center justify-center min-w-10 h-10 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-medium text-sm"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="w-4 h-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <polyline points="15 18 9 12 15 6" />
      </svg>
    </button>

    <div class="text-center flex-1 relative">
      <button
        v-if="!showPicker"
        @click="showPicker = true"
        class="text-base font-semibold hover:text-emerald-600 transition-colors"
        :class="isUnavailable ? 'text-rose-500' : 'text-slate-800'"
        :title="t('slot.pickDate')"
      >
        {{ formatDate(modelValue) }}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="w-3 h-3 inline-block ml-1 text-slate-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      <input
        v-else
        ref="pickerInput"
        type="date"
        :value="modelValue"
        :min="today"
        @change="onPickerChange"
        @blur="showPicker = false"
        class="rounded-lg border border-emerald-400 focus:ring-2 focus:ring-emerald-500 px-3 py-1.5 text-sm text-slate-800 outline-none"
      />

      <p v-if="!showPicker && isWeekend" class="text-xs text-rose-400 mt-0.5">
        {{ t('slot.weekend') }}
      </p>
      <p v-else-if="!showPicker && isCurrentBlocked" class="text-xs text-rose-400 mt-0.5">
        {{ t('slot.holiday') }}
      </p>
    </div>

    <button
      @click="step(1)"
      class="flex items-center justify-center min-w-10 h-10 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors text-slate-700 font-medium text-sm"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="w-4 h-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </button>
  </div>
</template>
