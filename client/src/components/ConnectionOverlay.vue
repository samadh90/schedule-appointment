<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <Transition name="fade">
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div class="bg-white rounded-xl shadow-xl p-8 max-w-sm w-full mx-4 text-center">
        <div class="flex items-center justify-center gap-3 mb-4">
          <span class="inline-block w-3 h-3 rounded-full bg-rose-400 animate-pulse" />
          <h2 class="text-lg font-semibold text-slate-800">{{ t('connection.offlineTitle') }}</h2>
        </div>
        <p class="text-slate-400 text-sm">{{ t('connection.offlineMsg') }}</p>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
