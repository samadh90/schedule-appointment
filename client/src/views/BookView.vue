<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const date = route.query.date as string
const time = route.query.time as string

if (!date || !time) {
  router.push('/')
}

const form = ref({
  first_name: '',
  last_name: '',
  email: '',
  reason: ''
})

const errors = ref<Record<string, string>>({})
const loading = ref(false)
const serverError = ref<string | null>(null)
const success = ref<{ cancellation_token: string; start_time: string } | null>(null)
const copied = ref(false)

function validateField(field: string) {
  errors.value[field] = ''
  if (field === 'first_name' && !form.value.first_name.trim()) errors.value.first_name = 'First name is required'
  if (field === 'last_name' && !form.value.last_name.trim()) errors.value.last_name = 'Last name is required'
  if (field === 'email') {
    if (!form.value.email.trim()) errors.value.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) errors.value.email = 'Enter a valid email'
  }
  if (field === 'reason' && form.value.reason.length > 500) errors.value.reason = 'Reason must be 500 characters or less'
}

function validateAll(): boolean {
  ['first_name', 'last_name', 'email', 'reason'].forEach(validateField)
  return !Object.values(errors.value).some(e => e)
}

async function submit() {
  if (!validateAll()) return
  loading.value = true
  serverError.value = null
  try {
    const res = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form.value,
        start_time: `${date}T${time}:00`
      })
    })
    const data = await res.json()
    if (!res.ok) {
      if (res.status === 409) serverError.value = 'This slot was just taken. Please go back and choose another time.'
      else serverError.value = data.error ?? 'Booking failed. Please try again.'
    } else {
      success.value = { cancellation_token: data.cancellation_token, start_time: data.start_time }
    }
  } catch {
    serverError.value = 'Network error. Please try again.'
  } finally {
    loading.value = false
  }
}

async function copyToken() {
  if (!success.value) return
  await navigator.clipboard.writeText(success.value.cancellation_token)
  copied.value = true
  setTimeout(() => copied.value = false, 2000)
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
    <!-- Success screen -->
    <div v-if="success" class="rounded-xl shadow-sm border border-slate-200 bg-white p-6 text-center">
      <div class="text-emerald-600 text-4xl mb-4">✓</div>
      <h2 class="text-xl font-semibold text-slate-800 mb-2">Appointment Booked!</h2>
      <p class="text-sm text-slate-700 mb-6">{{ formatDateTime(success.start_time) }}</p>

      <div class="bg-slate-50 rounded-lg border border-slate-200 p-4 mb-4">
        <p class="text-xs text-slate-400 mb-1">Your cancellation token (save this!)</p>
        <p class="font-mono text-sm text-slate-800 break-all">{{ success.cancellation_token }}</p>
      </div>

      <button
        @click="copyToken"
        class="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
      >
        {{ copied ? '✓ Copied!' : 'Copy Token' }}
      </button>

      <div class="mt-6">
        <router-link to="/" class="text-sm text-slate-500 hover:text-slate-700 transition-colors">← Back to schedule</router-link>
      </div>
    </div>

    <!-- Booking form -->
    <div v-else>
      <div class="mb-6">
        <h1 class="text-2xl font-semibold text-slate-800">Book Appointment</h1>
        <p class="text-sm text-slate-500 mt-1">{{ date }} at {{ time }}</p>
      </div>

      <!-- Server error -->
      <div v-if="serverError" class="bg-rose-50 border border-rose-200 text-rose-500 text-sm rounded-lg p-4 mb-4">
        {{ serverError }}
      </div>

      <div class="rounded-xl shadow-sm border border-slate-200 bg-white p-6">
        <form @submit.prevent="submit" class="space-y-4">
          <!-- First Name -->
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">First Name</label>
            <input
              v-model="form.first_name"
              @blur="validateField('first_name')"
              type="text"
              class="w-full rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 px-3 py-2 text-sm outline-none transition-all"
              placeholder="Jane"
            />
            <p v-if="errors.first_name" class="text-rose-500 text-xs mt-1">{{ errors.first_name }}</p>
          </div>

          <!-- Last Name -->
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
            <input
              v-model="form.last_name"
              @blur="validateField('last_name')"
              type="text"
              class="w-full rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 px-3 py-2 text-sm outline-none transition-all"
              placeholder="Doe"
            />
            <p v-if="errors.last_name" class="text-rose-500 text-xs mt-1">{{ errors.last_name }}</p>
          </div>

          <!-- Email -->
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              v-model="form.email"
              @blur="validateField('email')"
              type="email"
              class="w-full rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 px-3 py-2 text-sm outline-none transition-all"
              placeholder="jane@example.com"
            />
            <p v-if="errors.email" class="text-rose-500 text-xs mt-1">{{ errors.email }}</p>
          </div>

          <!-- Reason -->
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Reason <span class="text-slate-400">(optional)</span></label>
            <textarea
              v-model="form.reason"
              @blur="validateField('reason')"
              rows="3"
              class="w-full rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 px-3 py-2 text-sm outline-none transition-all resize-none"
              placeholder="Briefly describe the reason for your appointment..."
            />
            <p v-if="errors.reason" class="text-rose-500 text-xs mt-1">{{ errors.reason }}</p>
            <p class="text-xs text-slate-400 mt-1">{{ form.reason.length }}/500</p>
          </div>

          <div class="flex gap-3 pt-2">
            <router-link to="/" class="flex-1 text-center border border-slate-300 text-slate-700 rounded-lg px-4 py-2 text-sm font-medium hover:bg-slate-50 transition-colors">
              Cancel
            </router-link>
            <button
              type="submit"
              :disabled="loading"
              class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span v-if="loading" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {{ loading ? 'Booking...' : 'Confirm Booking' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
