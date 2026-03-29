<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import type { SupportedLocale } from '../i18n'
import { saveLocale } from '../i18n'

const props = withDefaults(defineProps<{ storageKey?: string }>(), {
  storageKey: 'locale',
})

const LANGS: Record<SupportedLocale, { flag: string; name: string }> = {
  en: { flag: '🇬🇧', name: 'English' },
  fr: { flag: '🇫🇷', name: 'Français' },
  nl: { flag: '🇳🇱', name: 'Nederlands' },
  de: { flag: '🇩🇪', name: 'Deutsch' },
  ru: { flag: '🇷🇺', name: 'Русский' },
}

const { locale } = useI18n()
const open = ref(false)
const triggerRef = ref<HTMLElement | null>(null)
const dropdownRef = ref<HTMLElement | null>(null)

const current = computed(() => LANGS[locale.value as SupportedLocale] ?? LANGS.en)

function select(lang: SupportedLocale) {
  locale.value = lang
  if (props.storageKey === 'locale') {
    saveLocale(lang)
  } else {
    localStorage.setItem(props.storageKey, lang)
  }
  open.value = false
}

function onClickOutside(e: MouseEvent) {
  if (
    triggerRef.value &&
    !triggerRef.value.contains(e.target as Node) &&
    dropdownRef.value &&
    !dropdownRef.value.contains(e.target as Node)
  ) {
    open.value = false
  }
}

onMounted(() => document.addEventListener('click', onClickOutside))
onUnmounted(() => document.removeEventListener('click', onClickOutside))
</script>

<template>
  <div class="relative">
    <!-- Trigger — shows only the flag when closed -->
    <button
      ref="triggerRef"
      @click="open = !open"
      class="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-sm transition-colors hover:bg-slate-100"
      :aria-expanded="open"
      aria-haspopup="listbox"
    >
      <span class="text-base leading-none">{{ current.flag }}</span>
      <svg
        class="w-3 h-3 text-slate-400 transition-transform"
        :class="{ 'rotate-180': open }"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>

    <!-- Dropdown — flag + name for each option -->
    <Transition name="dropdown">
      <ul
        v-if="open"
        ref="dropdownRef"
        role="listbox"
        class="absolute right-0 mt-1 w-40 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-50"
      >
        <li
          v-for="(meta, lang) in LANGS"
          :key="lang"
          role="option"
          :aria-selected="locale === lang"
          @click="select(lang as SupportedLocale)"
          class="flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer transition-colors"
          :class="locale === lang ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-slate-700 hover:bg-slate-50'"
        >
          <span class="text-base leading-none">{{ meta.flag }}</span>
          <span>{{ meta.name }}</span>
        </li>
      </ul>
    </Transition>
  </div>
</template>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
