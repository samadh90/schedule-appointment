<script setup lang="ts">
import { onMounted, onUnmounted, onErrorCaptured, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AppLayout from './components/AppLayout.vue'
import ConnectionOverlay from './components/ConnectionOverlay.vue'
import { useAppointmentsStore } from './stores/appointments'
import { useConnectionStatus } from './composables/useConnectionStatus'

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
  <div v-if="fatalError" class="min-h-screen bg-slate-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-8 max-w-sm w-full text-center">
      <div class="text-rose-400 text-4xl mb-4">!</div>
      <h2 class="text-xl font-semibold text-slate-800 mb-2">{{ t('error.boundaryTitle') }}</h2>
      <p class="text-slate-400 text-sm mb-6">{{ t('error.boundaryMsg') }}</p>
      <button
        @click="reloadPage"
        class="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
      >
        {{ t('error.reload') }}
      </button>
    </div>
  </div>
  <template v-else>
    <AppLayout>
      <router-view />
    </AppLayout>
    <ConnectionOverlay v-if="!isOnline" />
  </template>
</template>
