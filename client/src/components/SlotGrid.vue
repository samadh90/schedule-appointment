<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { Slot } from '../types'

const { t } = useI18n()

defineProps<{
  slots: Slot[]
  loading?: boolean
}>()

const emit = defineEmits<{
  select: [time: string]
}>()

function slotClass(status: Slot['status']): string {
  const base = 'rounded-lg text-sm font-medium py-2.5 px-3 transition-colors'
  switch (status) {
    case 'free':
      return `${base} bg-emerald-600 hover:bg-emerald-700 text-white`
    case 'booked':
      return `${base} bg-rose-400 text-white opacity-70 cursor-not-allowed`
    default:
      return `${base} bg-slate-300 text-slate-500 cursor-not-allowed`
  }
}
</script>

<template>
  <div>
    <div v-if="loading" class="flex flex-wrap gap-2.5">
      <div v-for="i in 12" :key="i" class="animate-pulse bg-slate-200 rounded-lg h-9 w-16" />
    </div>

    <div v-else-if="slots.length === 0" class="text-center py-16">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10 mx-auto text-slate-300 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
        <line x1="10" y1="14" x2="14" y2="18"/>
        <line x1="14" y1="14" x2="10" y2="18"/>
      </svg>
      <p class="text-sm font-medium text-slate-400">{{ t('slot.noSlots') }}</p>
    </div>

    <div v-else class="flex flex-wrap gap-2.5">
      <button
        v-for="slot in slots"
        :key="slot.time"
        :class="slotClass(slot.status)"
        :disabled="slot.status !== 'free'"
        @click="slot.status === 'free' && emit('select', slot.time)"
      >
        {{ slot.time }}
      </button>
    </div>
  </div>
</template>
