<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'

const { locale, t } = useI18n()
const route = useRoute()
const router = useRouter()

const isSchedule = computed(() => route.path === '/' || route.path === '/book')
const isCancel = computed(() => route.path.startsWith('/cancel'))

function setLocale(l: 'en' | 'fr' | 'nl') {
  locale.value = l
  localStorage.setItem('schedule-widget-locale', l)
}
</script>

<template>
  <div class="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-200">
    <!-- Tab navigation -->
    <nav class="flex items-center gap-1 text-sm">
      <button
        @click="router.push('/')"
        class="px-3 py-1.5 rounded-full font-medium transition-colors"
        :class="
          isSchedule ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
        "
      >
        {{ t('nav.schedule') }}
      </button>
      <button
        @click="router.push('/cancel')"
        class="px-3 py-1.5 rounded-full font-medium transition-colors"
        :class="isCancel ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'"
      >
        {{ t('nav.cancel') }}
      </button>
    </nav>

    <!-- Language switcher -->
    <div class="flex items-center gap-1">
      <button
        v-for="lang in ['en', 'fr', 'nl'] as const"
        :key="lang"
        @click="setLocale(lang)"
        class="px-2 py-1 rounded text-xs font-medium transition-colors"
        :class="
          locale === lang ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
        "
      >
        {{ t(`lang.${lang}`) }}
      </button>
    </div>
  </div>
</template>
