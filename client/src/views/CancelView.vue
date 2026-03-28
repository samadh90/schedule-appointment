<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import type { Appointment } from '../types'

const route = useRoute()

const token = ref((route.params.token as string) ?? '')
const appointment = ref<Appointment | null>(null)
const lookupError = ref<string | null>(null)
const lookupLoading = ref(false)
const cancelLoading = ref(false)
const cancelResult = ref<'success' | 'error' | null>(null)
const cancelError = ref<string | null>(null)

onMounted(() => {
  if (token.value) lookup()
})

async function lookup() {
  lookupError.value = null
  appointment.value = null
  lookupLoading.value = true
  try {
    const res = await fetch(`/api/appointments/${token.value}`)
    if (res.status === 404) { lookupError.value = 'No appointment found with this token.'; return }
    if (!res.ok) throw new Error('Lookup failed')
    appointment.value = await res.json()
  } catch {
    lookupError.value = 'Failed to look up appointment. Check the token and try again.'
  } finally {
    lookupLoading.value = false
  }
}

async function confirmCancel() {
  if (!appointment.value) return
  cancelLoading.value = true
  cancelError.value = null
  try {
    const res = await fetch(`/api/appointments/${appointment.value.cancellation_token}`, { method: 'DELETE' })
    const data = await res.json()
    if (res.ok) {
      cancelResult.value = 'success'
    } else {
      cancelError.value = data.error ?? 'Cancellation failed.'
    }
  } catch {
    cancelError.value = 'Network error. Please try again.'
  } finally {
    cancelLoading.value = false
  }
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-BE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}
</script>

<template>
  <div>
    <h1 class="text-2xl font-semibold text-slate-800 mb-6">Cancel Appointment</h1>

    <!-- Success -->
    <div v-if="cancelResult === 'success'" class="rounded-xl shadow-sm border border-slate-200 bg-white p-6 text-center">
      <div class="text-emerald-600 text-4xl mb-4">✓</div>
      <h2 class="text-xl font-semibold text-slate-800 mb-2">Appointment Cancelled</h2>
      <p class="text-sm text-slate-500 mb-6">Your appointment has been successfully cancelled.</p>
      <router-link to="/" class="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors">
        Book a new appointment
      </router-link>
    </div>

    <!-- Token input form -->
    <div v-else class="rounded-xl shadow-sm border border-slate-200 bg-white p-6">
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Cancellation Token</label>
          <input
            v-model="token"
            type="text"
            class="w-full rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 px-3 py-2 text-sm font-mono outline-none transition-all"
            placeholder="Paste your token here..."
          />
        </div>

        <button
          @click="lookup"
          :disabled="!token.trim() || lookupLoading"
          class="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <span v-if="lookupLoading" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          {{ lookupLoading ? 'Looking up...' : 'Look up Appointment' }}
        </button>

        <!-- Lookup error -->
        <p v-if="lookupError" class="text-rose-500 text-sm">{{ lookupError }}</p>
      </div>

      <!-- Appointment summary -->
      <div v-if="appointment" class="mt-6 border-t border-slate-200 pt-6">
        <h3 class="text-lg font-medium text-slate-800 mb-3">Appointment Details</h3>

        <div v-if="appointment.cancelled" class="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4">
          <p class="text-sm text-slate-500">This appointment has already been cancelled.</p>
        </div>

        <div class="space-y-2 text-sm text-slate-700 mb-6">
          <p><span class="text-slate-400">Name:</span> {{ appointment.first_name }} {{ appointment.last_name }}</p>
          <p><span class="text-slate-400">Email:</span> {{ appointment.email }}</p>
          <p><span class="text-slate-400">Date &amp; Time:</span> {{ formatDateTime(appointment.start_time) }}</p>
          <p v-if="appointment.reason"><span class="text-slate-400">Reason:</span> {{ appointment.reason }}</p>
        </div>

        <!-- Cancel error -->
        <div v-if="cancelError" class="bg-rose-50 border border-rose-200 text-rose-500 text-sm rounded-lg p-4 mb-4">
          {{ cancelError }}
        </div>

        <button
          v-if="!appointment.cancelled"
          @click="confirmCancel"
          :disabled="cancelLoading"
          class="w-full bg-rose-400 hover:bg-rose-500 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <span v-if="cancelLoading" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          {{ cancelLoading ? 'Cancelling...' : 'Cancel Appointment' }}
        </button>
      </div>
    </div>
  </div>
</template>
