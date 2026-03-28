<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { saveLocale } from '../i18n'

const { locale, t } = useI18n()

function setLocale(l: 'en' | 'fr' | 'nl') {
  locale.value = l
  saveLocale(l)
}
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <header class="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between gap-4">
      <router-link to="/" class="text-lg font-semibold text-slate-800 shrink-0">
        {{ t('nav.title') }}
      </router-link>

      <nav class="flex items-center gap-4 text-sm">
        <router-link to="/" class="text-slate-600 hover:text-slate-800 transition-colors">
          {{ t('nav.schedule') }}
        </router-link>
        <router-link to="/cancel" class="text-slate-600 hover:text-slate-800 transition-colors">
          {{ t('nav.cancel') }}
        </router-link>

        <!-- Language switcher -->
        <div class="flex items-center gap-1 border-l border-slate-200 pl-4 ml-1">
          <button
            v-for="lang in ['en', 'fr', 'nl'] as const"
            :key="lang"
            @click="setLocale(lang)"
            class="px-2 py-1 rounded text-xs font-medium transition-colors"
            :class="
              locale === lang ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            "
          >
            {{ t(`lang.${lang}`) }}
          </button>
        </div>
      </nav>
    </header>

    <main class="max-w-2xl mx-auto px-4 py-8">
      <slot />
    </main>
  </div>
</template>
