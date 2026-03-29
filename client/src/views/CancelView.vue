<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import type { Appointment } from '../types'
import { apiUrl } from '../utils/api'
import { useConfigStore } from '../stores/config'

const { t, locale } = useI18n()
const route = useRoute()
const configStore = useConfigStore()

const token = ref((route.params.token as string) ?? '')
const appointment = ref<Appointment | null>(null)
const lookupError = ref<string | null>(null)
const lookupLoading = ref(false)
const cancelLoading = ref(false)
const cancelResult = ref<'success' | 'error' | null>(null)
const cancelError = ref<string | null>(null)
const redirectCountdown = ref<number | null>(null)

onMounted(() => {
  configStore.fetchConfig()
  if (token.value) lookup()
})

async function lookup() {
  lookupError.value = null
  appointment.value = null
  lookupLoading.value = true
  try {
    const res = await fetch(apiUrl(`/api/appointments/${token.value}`))
    if (res.status === 404) {
      lookupError.value = t('cancel.errNotFound')
      return
    }
    if (!res.ok) throw new Error('Lookup failed')
    appointment.value = await res.json()
  } catch {
    lookupError.value = t('cancel.errLookup')
  } finally {
    lookupLoading.value = false
  }
}

async function confirmCancel() {
  if (!appointment.value) return
  cancelLoading.value = true
  cancelError.value = null
  try {
    const res = await fetch(apiUrl(`/api/appointments/${appointment.value.cancellation_token}`), {
      method: 'DELETE',
    })
    const data = await res.json()
    if (res.ok) {
      cancelResult.value = 'success'
      const siteUrl = configStore.config?.siteUrl
      if (siteUrl) {
        redirectCountdown.value = 5
        const timer = setInterval(() => {
          if (redirectCountdown.value === null) {
            clearInterval(timer)
            return
          }
          redirectCountdown.value--
          if (redirectCountdown.value <= 0) {
            clearInterval(timer)
            window.location.href = siteUrl
          }
        }, 1000)
      }
    } else {
      cancelError.value = data.error ?? t('cancel.errGeneric')
    }
  } catch {
    cancelError.value = t('cancel.errNetwork')
  } finally {
    cancelLoading.value = false
  }
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
    <h1 class="text-2xl font-bold text-slate-900 mb-6">{{ t('cancel.title') }}</h1>

    <!-- Success -->
    <div
      v-if="cancelResult === 'success'"
      class="rounded-xl shadow-sm border border-slate-200 bg-white p-6 text-center"
    >
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
      <h2 class="text-xl font-semibold text-slate-800 mb-2">{{ t('cancel.successTitle') }}</h2>
      <p class="text-sm text-slate-500 mb-6">{{ t('cancel.successMsg') }}</p>
      <p v-if="redirectCountdown !== null" class="text-sm text-slate-400 mb-4">
        {{ t('cancel.redirecting', { n: redirectCountdown }) }}
      </p>
      <div class="flex flex-col sm:flex-row gap-2 justify-center">
        <router-link
          to="/"
          class="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
        >
          {{ t('cancel.bookNewBtn') }}
        </router-link>
        <a
          v-if="configStore.config?.siteUrl"
          :href="configStore.config.siteUrl"
          class="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
        >
          {{ t('cancel.backToSite') }}
        </a>
      </div>
    </div>

    <!-- Token input + details -->
    <div v-else class="rounded-xl shadow-sm border border-slate-200 bg-white p-6">
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('cancel.tokenLabel') }}</label>
          <input
            v-model="token"
            type="text"
            class="w-full rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 px-3 py-2 text-sm font-mono outline-none transition-all"
            :placeholder="t('cancel.tokenPlaceholder')"
          />
        </div>

        <button
          @click="lookup"
          :disabled="!token.trim() || lookupLoading"
          class="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <span
            v-if="lookupLoading"
            class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
          />
          {{ lookupLoading ? t('cancel.lookingUp') : t('cancel.lookupBtn') }}
        </button>

        <p v-if="lookupError" class="text-rose-500 text-sm">{{ lookupError }}</p>
      </div>

      <!-- Appointment summary -->
      <div v-if="appointment" class="mt-6 border-t border-slate-200 pt-6">
        <h3 class="text-base font-semibold text-slate-800 mb-4">{{ t('cancel.detailsTitle') }}</h3>

        <div v-if="appointment.cancelled" class="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4">
          <p class="text-sm text-slate-500">{{ t('cancel.alreadyCancelled') }}</p>
        </div>

        <dl class="divide-y divide-slate-100 rounded-lg border border-slate-200 overflow-hidden mb-6">
          <div class="flex px-4 py-3 gap-4 bg-white">
            <dt class="text-xs font-medium text-slate-400 uppercase tracking-wide w-24 shrink-0 pt-0.5">
              {{ t('cancel.name') }}
            </dt>
            <dd class="text-sm text-slate-800 font-medium">{{ appointment.first_name }} {{ appointment.last_name }}</dd>
          </div>
          <div class="flex px-4 py-3 gap-4 bg-white">
            <dt class="text-xs font-medium text-slate-400 uppercase tracking-wide w-24 shrink-0 pt-0.5">
              {{ t('cancel.dateTime') }}
            </dt>
            <dd class="text-sm text-slate-800 font-medium">{{ formatDateTime(appointment.start_time) }}</dd>
          </div>
          <div v-if="appointment.reason" class="flex px-4 py-3 gap-4 bg-white">
            <dt class="text-xs font-medium text-slate-400 uppercase tracking-wide w-24 shrink-0 pt-0.5">
              {{ t('cancel.reason') }}
            </dt>
            <dd class="text-sm text-slate-800">{{ appointment.reason }}</dd>
          </div>
        </dl>

        <div v-if="cancelError" class="bg-rose-50 border border-rose-200 text-rose-500 text-sm rounded-lg p-4 mb-4">
          {{ cancelError }}
        </div>

        <button
          v-if="!appointment.cancelled"
          @click="confirmCancel"
          :disabled="cancelLoading"
          class="w-full bg-rose-400 hover:bg-rose-500 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <span
            v-if="cancelLoading"
            class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
          />
          {{ cancelLoading ? t('cancel.confirming') : t('cancel.confirmBtn') }}
        </button>
      </div>
    </div>
  </div>
</template>
