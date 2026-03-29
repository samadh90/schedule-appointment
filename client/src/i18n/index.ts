import { createI18n } from 'vue-i18n'
import en from './locales/en'
import fr from './locales/fr'
import nl from './locales/nl'
import de from './locales/de'
import ru from './locales/ru'

export type SupportedLocale = 'en' | 'fr' | 'nl' | 'de' | 'ru'
const SUPPORTED: SupportedLocale[] = ['en', 'fr', 'nl', 'de', 'ru']

function detectLocale(): SupportedLocale {
  const lang = navigator.language?.toLowerCase() ?? ''
  if (lang.startsWith('nl')) return 'nl'
  if (lang.startsWith('fr')) return 'fr'
  if (lang.startsWith('de')) return 'de'
  if (lang.startsWith('ru')) return 'ru'
  return 'en'
}

const STORAGE_KEY = 'locale'

function getSavedLocale(): SupportedLocale | null {
  const v = localStorage.getItem(STORAGE_KEY) as SupportedLocale | null
  return v && SUPPORTED.includes(v) ? v : null
}

export function saveLocale(locale: SupportedLocale) {
  localStorage.setItem(STORAGE_KEY, locale)
}

export const i18n = createI18n({
  legacy: false,
  locale: getSavedLocale() ?? detectLocale(),
  fallbackLocale: 'en',
  messages: { en, fr, nl, de, ru },
})
