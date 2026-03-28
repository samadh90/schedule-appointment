import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { BlockedDate } from '../types'

export const useBlockedDatesStore = defineStore('blockedDates', () => {
  const blockedDates = ref<BlockedDate[]>([])
  const loadedRanges = ref<string[]>([])

  async function fetchForMonth(year: number, month: number) {
    const from = `${year}-${String(month).padStart(2, '0')}-01`
    const lastDay = new Date(year, month, 0).getDate()
    const to = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
    const key = `${from}/${to}`
    if (loadedRanges.value.includes(key)) return
    try {
      const res = await fetch(`/api/blocked-dates?from=${from}&to=${to}`)
      if (!res.ok) throw new Error('Failed to fetch blocked dates')
      const data: BlockedDate[] = await res.json()
      for (const d of data) {
        if (!blockedDates.value.find(b => b.date === d.date)) {
          blockedDates.value.push(d)
        }
      }
      loadedRanges.value.push(key)
    } catch {
      // silently fail — treat as no blocked dates
    }
  }

  function isBlocked(date: string): boolean {
    return blockedDates.value.some(b => b.date === date)
  }

  return { blockedDates, fetchForMonth, isBlocked }
})
