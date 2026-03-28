<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { saveLocale } from '../i18n'

const { locale, t } = useI18n()
const route = useRoute()

const isSchedule = computed(() => route.path === '/')
const isCancel = computed(() => route.path.startsWith('/cancel'))

function setLocale(l: 'en' | 'fr' | 'nl') {
  locale.value = l
  saveLocale(l)
}
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <header class="fixed top-0 inset-x-0 z-10 h-16 bg-white border-b border-slate-200 flex items-center px-4">
      <div class="max-w-2xl mx-auto w-full flex items-center justify-between gap-4">
        <!-- Logo + title -->
        <router-link to="/" class="flex items-center gap-2.5 shrink-0">
          <span class="flex items-center justify-center w-8 h-8 bg-emerald-600 rounded-lg text-white">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-4 h-4"
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
          </span>
          <span class="text-base font-semibold text-slate-800">{{ t('nav.title') }}</span>
        </router-link>

        <!-- Nav + language switcher -->
        <nav class="flex items-center gap-1 text-sm">
          <router-link
            to="/"
            class="px-3 py-1.5 rounded-full font-medium transition-colors"
            :class="
              isSchedule ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            "
          >
            {{ t('nav.schedule') }}
          </router-link>
          <router-link
            to="/cancel"
            class="px-3 py-1.5 rounded-full font-medium transition-colors"
            :class="
              isCancel ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            "
          >
            {{ t('nav.cancel') }}
          </router-link>

          <!-- Divider -->
          <span class="w-px h-4 bg-slate-200 mx-2" />

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
        </nav>
      </div>
    </header>

    <main class="max-w-2xl mx-auto px-4 py-10 pt-24">
      <slot />
    </main>
  </div>
</template>
