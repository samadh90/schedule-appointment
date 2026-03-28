<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  modelValue: string  // YYYY-MM-DD
  blockedDates: string[]
}>()

const emit = defineEmits<{
  'update:modelValue': [date: string]
}>()

const today = new Date().toISOString().split('T')[0]

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

const isPrevDisabled = computed(() => props.modelValue <= today)

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-BE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

const isCurrentBlocked = computed(() => props.blockedDates.includes(props.modelValue))

function prev() {
  if (!isPrevDisabled.value) {
    emit('update:modelValue', addDays(props.modelValue, -1))
  }
}

function next() {
  emit('update:modelValue', addDays(props.modelValue, 1))
}
</script>

<template>
  <div class="flex items-center justify-between gap-4 py-3">
    <button
      @click="prev"
      :disabled="isPrevDisabled"
      class="flex items-center justify-center min-w-10 h-10 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-medium text-sm"
    >
      ←
    </button>

    <div class="text-center flex-1">
      <p class="text-sm font-medium text-slate-800" :class="{ 'text-rose-500': isCurrentBlocked }">
        {{ formatDate(modelValue) }}
      </p>
      <p v-if="isCurrentBlocked" class="text-xs text-rose-400 mt-0.5">Holiday / Blocked</p>
    </div>

    <button
      @click="next"
      class="flex items-center justify-center min-w-10 h-10 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors text-slate-700 font-medium text-sm"
    >
      →
    </button>
  </div>
</template>
