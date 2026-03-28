import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppointmentsStore = defineStore('appointments', () => {
  const bookedSlots = ref<Record<string, string[]>>({}) // date → ["09:00", ...]

  async function fetchSlotsForDate(date: string) {
    if (bookedSlots.value[date]) return
    try {
      const res = await fetch(`/api/appointments/by-date?date=${date}`)
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      bookedSlots.value[date] = data.slots
    } catch {
      bookedSlots.value[date] = []
    }
  }

  function invalidateDate(date: string) {
    delete bookedSlots.value[date]
  }

  return { bookedSlots, fetchSlotsForDate, invalidateDate }
})
