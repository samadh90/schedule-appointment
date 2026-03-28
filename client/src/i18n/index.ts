import { createI18n } from 'vue-i18n'
import en from './locales/en'
import fr from './locales/fr'
import nl from './locales/nl'

function detectLocale(): 'en' | 'fr' | 'nl' {
  const lang = navigator.language?.toLowerCase() ?? ''
  if (lang.startsWith('nl')) return 'nl'
  if (lang.startsWith('fr')) return 'fr'
  return 'en'
}

const STORAGE_KEY = 'locale'

function getSavedLocale(): 'en' | 'fr' | 'nl' | null {
  const v = localStorage.getItem(STORAGE_KEY) as 'en' | 'fr' | 'nl' | null
  return v && ['en', 'fr', 'nl'].includes(v) ? v : null
}

export function saveLocale(locale: 'en' | 'fr' | 'nl') {
  localStorage.setItem(STORAGE_KEY, locale)
}

export const i18n = createI18n({
  legacy: false,
  locale: getSavedLocale() ?? detectLocale(),
  fallbackLocale: 'en',
  messages: { en, fr, nl },
})
