import { defineStore } from 'pinia'
import { ref } from 'vue'
import { io, Socket } from 'socket.io-client'
import { apiUrl, apiSocketOrigin } from '../utils/api'

export const useAppointmentsStore = defineStore('appointments', () => {
  const bookedSlots = ref<Record<string, string[]>>({}) // date → ["09:00", ...]
  let socket: Socket | null = null

  function connect() {
    if (socket?.connected) return
    socket = io(apiSocketOrigin(), { path: '/socket.io' })

    socket.on('slot:booked', ({ date, time }: { date: string; time: string }) => {
      if (bookedSlots.value[date]) {
        if (!bookedSlots.value[date].includes(time)) {
          bookedSlots.value[date] = [...bookedSlots.value[date], time]
        }
      }
    })

    socket.on('slot:freed', ({ date, time }: { date: string; time: string }) => {
      if (bookedSlots.value[date]) {
        bookedSlots.value[date] = bookedSlots.value[date].filter(t => t !== time)
      }
    })
  }

  function disconnect() {
    socket?.disconnect()
    socket = null
  }

  async function fetchSlotsForDate(date: string) {
    if (bookedSlots.value[date]) return
    try {
      const res = await fetch(apiUrl(`/api/appointments/by-date?date=${date}`))
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

  return { bookedSlots, connect, disconnect, fetchSlotsForDate, invalidateDate }
})
