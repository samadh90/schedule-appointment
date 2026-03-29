<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAppointmentsStore } from '../stores/appointments'
import { apiUrl } from '../utils/api'

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const appointmentsStore = useAppointmentsStore()

const date = route.query.date as string
const time = route.query.time as string

if (!date || !time) {
  router.push('/')
}

const form = ref({
  first_name: '',
  last_name: '',
  email: '',
  reason: '',
})

const errors = ref<Record<string, string>>({})
const loading = ref(false)
const serverError = ref<string | null>(null)
const success = ref<{ cancellation_token: string; start_time: string } | null>(null)
const copied = ref(false)

function validateField(field: string) {
  errors.value[field] = ''
  if (field === 'first_name') {
    if (!form.value.first_name.trim()) errors.value.first_name = t('book.validFirstName')
    else if (form.value.first_name.trim().length > 100) errors.value.first_name = t('book.validFirstNameLength')
  }
  if (field === 'last_name') {
    if (!form.value.last_name.trim()) errors.value.last_name = t('book.validLastName')
    else if (form.value.last_name.trim().length > 100) errors.value.last_name = t('book.validLastNameLength')
  }
  if (field === 'email') {
    if (!form.value.email.trim()) errors.value.email = t('book.validEmail')
    else if (form.value.email.length > 254) errors.value.email = t('book.validEmailLength')
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) errors.value.email = t('book.validEmailFormat')
  }
  if (field === 'reason' && form.value.reason.length > 500) errors.value.reason = t('book.validReason')
}

function validateAll(): boolean {
  ;['first_name', 'last_name', 'email', 'reason'].forEach(validateField)
  return !Object.values(errors.value).some(e => e)
}

async function submit() {
  if (!validateAll()) return
  loading.value = true
  serverError.value = null
  try {
    const res = await fetch(apiUrl('/api/appointments'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form.value,
        start_time: `${date}T${time}:00`,
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      if (res.status === 409) serverError.value = t('book.err409')
      else serverError.value = data.error ?? t('book.errGeneric')
    } else {
      appointmentsStore.invalidateDate(date)
      success.value = { cancellation_token: data.cancellation_token, start_time: data.start_time }
    }
  } catch {
    serverError.value = t('book.errNetwork')
  } finally {
    loading.value = false
  }
}

async function copyToken() {
  if (!success.value) return
  await navigator.clipboard.writeText(success.value.cancellation_token)
  copied.value = true
  setTimeout(() => (copied.value = false), 2000)
}

function formatDateTime(iso: string): string {
  const localeMap: Record<string, string> = { en: 'en-BE', fr: 'fr-BE', nl: 'nl-BE', de: 'de-DE', ru: 'ru-RU' }
  const fmt = localeMap[locale.value] ?? 'en-BE'
  return new Date(iso).toLocaleString(fmt, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <div>
    <!-- Success screen -->
    <div v-if="success" class="rounded-xl shadow-sm border border-slate-200 bg-white p-6 text-center">
      <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 mb-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="w-8 h-8 text-emerald-600"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      </div>
      <h2 class="text-xl font-semibold text-slate-800 mb-2">{{ t('book.successTitle') }}</h2>
      <p class="text-sm text-slate-700 mb-6">{{ formatDateTime(success.start_time) }}</p>

      <div class="bg-slate-50 rounded-lg border border-slate-200 p-4 mb-4">
        <p class="text-xs text-slate-400 mb-1">{{ t('book.successToken') }}</p>
        <p class="font-mono text-sm text-slate-800 break-all">{{ success.cancellation_token }}</p>
      </div>

      <button
        @click="copyToken"
        class="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
      >
        <svg
          v-if="!copied"
          xmlns="http://www.w3.org/2000/svg"
          class="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
        <svg
          v-else
          xmlns="http://www.w3.org/2000/svg"
          class="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
        {{ copied ? t('book.copied') : t('book.copyToken') }}
      </button>

      <div class="mt-6">
        <router-link to="/" class="text-sm text-slate-500 hover:text-slate-700 transition-colors">
          {{ t('book.backToSchedule') }}
        </router-link>
      </div>
    </div>

    <!-- Booking form -->
    <div v-else>
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-slate-900">{{ t('book.title') }}</h1>
        <div class="mt-2 inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="w-3.5 h-3.5 text-emerald-600 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span class="text-sm font-medium text-emerald-700">{{ date }} {{ t('book.subtitle') }} {{ time }}</span>
        </div>
      </div>

      <div v-if="serverError" class="bg-rose-50 border border-rose-200 text-rose-500 text-sm rounded-lg p-4 mb-4">
        {{ serverError }}
      </div>

      <div class="rounded-xl shadow-sm border border-slate-200 bg-white p-6">
        <form @submit.prevent="submit" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('book.firstName') }}</label>
              <input
                v-model="form.first_name"
                @blur="validateField('first_name')"
                type="text"
                class="w-full rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 px-3 py-2 text-sm outline-none transition-all"
              />
              <p v-if="errors.first_name" class="text-rose-500 text-xs mt-1">
                {{ errors.first_name }}
              </p>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('book.lastName') }}</label>
              <input
                v-model="form.last_name"
                @blur="validateField('last_name')"
                type="text"
                class="w-full rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 px-3 py-2 text-sm outline-none transition-all"
              />
              <p v-if="errors.last_name" class="text-rose-500 text-xs mt-1">{{ errors.last_name }}</p>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('book.email') }}</label>
            <input
              v-model="form.email"
              @blur="validateField('email')"
              type="email"
              class="w-full rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 px-3 py-2 text-sm outline-none transition-all"
            />
            <p v-if="errors.email" class="text-rose-500 text-xs mt-1">{{ errors.email }}</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">
              {{ t('book.reason') }}
              <span class="text-slate-400">{{ t('book.reasonOptional') }}</span>
            </label>
            <textarea
              v-model="form.reason"
              @blur="validateField('reason')"
              rows="3"
              class="w-full rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 px-3 py-2 text-sm outline-none transition-all resize-none"
              :placeholder="t('book.reasonPlaceholder')"
            />
            <p v-if="errors.reason" class="text-rose-500 text-xs mt-1">{{ errors.reason }}</p>
            <p class="text-xs text-slate-400 mt-1">
              {{ t('book.reasonCounter', { count: form.reason.length }) }}
            </p>
          </div>

          <div class="flex gap-3 pt-2">
            <router-link
              to="/"
              class="flex-1 text-center border border-slate-300 text-slate-700 rounded-lg px-4 py-2 text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              {{ t('book.cancelBtn') }}
            </router-link>
            <button
              type="submit"
              :disabled="loading"
              class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span
                v-if="loading"
                class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
              />
              {{ loading ? t('book.submitting') : t('book.submit') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
