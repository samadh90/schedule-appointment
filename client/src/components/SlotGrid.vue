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
  const base = 'rounded-lg text-sm font-medium py-2 px-3 transition-colors'
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
    <div v-if="loading" class="flex flex-wrap gap-3">
      <div v-for="i in 12" :key="i" class="animate-pulse bg-slate-200 rounded-lg h-9 w-16" />
    </div>

    <div v-else-if="slots.length === 0" class="text-center py-12 text-slate-400">
      <p class="text-sm">{{ t('slot.noSlots') }}</p>
    </div>

    <div v-else class="flex flex-wrap gap-3">
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
