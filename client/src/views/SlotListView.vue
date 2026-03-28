<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useConfigStore } from '../stores/config'
import { useBlockedDatesStore } from '../stores/blockedDates'
import { useAppointmentsStore } from '../stores/appointments'
import { generateSlots } from '../composables/useSlotGenerator'
import DayNavigator from '../components/DayNavigator.vue'
import SlotGrid from '../components/SlotGrid.vue'

const { t } = useI18n()
const router = useRouter()
const configStore = useConfigStore()
const blockedStore = useBlockedDatesStore()
const appointmentsStore = useAppointmentsStore()

// Timezone-safe helpers — never use new Date('YYYY-MM-DD') or toISOString() for date math
function localToday(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function localAddDays(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d + n) // local time constructor avoids DST/UTC issues
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function firstWorkDayFrom(startDate: string, workDays: number[] = [1, 2, 3, 4, 5]): string {
  let d = startDate
  for (let i = 0; i < 7; i++) {
    if (workDays.includes(new Date(d + 'T00:00:00').getDay())) return d
    d = localAddDays(d, 1)
  }
  return d
}

const today = localToday()
const selectedDate = ref(firstWorkDayFrom(today))
const loadingSlots = ref(false)

async function loadDate(date: string) {
  const [year, month] = date.split('-').map(Number)
  loadingSlots.value = true
  await Promise.all([blockedStore.fetchForMonth(year, month), appointmentsStore.fetchSlotsForDate(date)])
  loadingSlots.value = false
}

onMounted(async () => {
  await Promise.all([configStore.fetchConfig(), loadDate(selectedDate.value)])
  if (configStore.config) {
    const correct = firstWorkDayFrom(today, configStore.config.workDays)
    if (correct !== selectedDate.value) selectedDate.value = correct
  }
})

// Watch handles all date changes
watch(selectedDate, loadDate)

const blockedDateStrings = computed(() => blockedStore.blockedDates.map(b => b.date))

const slots = computed(() => {
  if (!configStore.config) return []
  const bookedTimes = appointmentsStore.bookedSlots[selectedDate.value] ?? []
  return generateSlots(selectedDate.value, configStore.config, bookedTimes, blockedStore.isBlocked(selectedDate.value))
})

function onSlotSelect(time: string) {
  router.push({ path: '/book', query: { date: selectedDate.value, time } })
}
</script>

<template>
  <div>
    <h1 class="text-2xl font-semibold text-slate-800 mb-6">{{ t('slot.title') }}</h1>

    <div class="rounded-xl shadow-sm border border-slate-200 bg-white p-6">
      <DayNavigator
        v-model="selectedDate"
        :blocked-dates="blockedDateStrings"
        :work-days="configStore.config?.workDays"
      />
      <hr class="border-slate-200 my-4" />
      <SlotGrid :slots="slots" :loading="loadingSlots || configStore.loading" @select="onSlotSelect" />
    </div>
  </div>
</template>
