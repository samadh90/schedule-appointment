<script setup lang="ts">
import { onMounted, onUnmounted, onErrorCaptured, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import ConnectionOverlay from '../../client/src/components/ConnectionOverlay.vue'
import { useAppointmentsStore } from '../../client/src/stores/appointments'
import { useConnectionStatus } from '../../client/src/composables/useConnectionStatus'
import EmbedNav from './EmbedNav.vue'

const { t } = useI18n()
const appointmentsStore = useAppointmentsStore()
const { isOnline } = useConnectionStatus()

const fatalError = ref<Error | null>(null)

onErrorCaptured(err => {
  fatalError.value = err instanceof Error ? err : new Error(String(err))
  return false
})

onMounted(() => appointmentsStore.connect())
onUnmounted(() => appointmentsStore.disconnect())

function reloadPage() {
  window.location.reload()
}
</script>

<template>
  <div v-if="fatalError" class="bg-white rounded-xl shadow-sm border border-slate-200 p-8 max-w-sm w-full text-center">
    <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-50 mb-4">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="w-8 h-8 text-rose-400"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    </div>
    <h2 class="text-xl font-semibold text-slate-800 mb-2">{{ t('error.boundaryTitle') }}</h2>
    <p class="text-slate-400 text-sm mb-6">{{ t('error.boundaryMsg') }}</p>
    <button
      @click="reloadPage"
      class="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
    >
      {{ t('error.reload') }}
    </button>
  </div>
  <template v-else>
    <EmbedNav />
    <router-view />
    <ConnectionOverlay v-if="!isOnline" />
  </template>
</template>
