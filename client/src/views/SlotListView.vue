<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useConfigStore } from '../stores/config'
import { useBlockedDatesStore } from '../stores/blockedDates'
import { useAppointmentsStore } from '../stores/appointments'
import { generateSlots } from '../composables/useSlotGenerator'
import DayNavigator from '../components/DayNavigator.vue'
import SlotGrid from '../components/SlotGrid.vue'

const router = useRouter()
const configStore = useConfigStore()
const blockedStore = useBlockedDatesStore()
const appointmentsStore = useAppointmentsStore()

const today = new Date().toISOString().split('T')[0]
const selectedDate = ref(today)
const loadingSlots = ref(false)

onMounted(async () => {
  await configStore.fetchConfig()
  await loadDate(today)
})

async function loadDate(date: string) {
  const [year, month] = date.split('-').map(Number)
  loadingSlots.value = true
  await Promise.all([
    blockedStore.fetchForMonth(year, month),
    appointmentsStore.fetchSlotsForDate(date)
  ])
  loadingSlots.value = false
}

watch(selectedDate, loadDate)

const blockedDateStrings = computed(() =>
  blockedStore.blockedDates.map(b => b.date)
)

const slots = computed(() => {
  if (!configStore.config) return []
  const bookedTimes = appointmentsStore.bookedSlots[selectedDate.value] ?? []
  return generateSlots(
    selectedDate.value,
    configStore.config,
    bookedTimes,
    blockedStore.isBlocked(selectedDate.value)
  )
})

function onSlotSelect(time: string) {
  router.push({ path: '/book', query: { date: selectedDate.value, time } })
}
</script>

<template>
  <div>
    <h1 class="text-2xl font-semibold text-slate-800 mb-6">Available Appointments</h1>

    <div class="rounded-xl shadow-sm border border-slate-200 bg-white p-6">
      <DayNavigator
        v-model="selectedDate"
        :blocked-dates="blockedDateStrings"
      />
      <hr class="border-slate-200 my-4" />
      <SlotGrid
        :slots="slots"
        :loading="loadingSlots || configStore.loading"
        @select="onSlotSelect"
      />
    </div>
  </div>
</template>
