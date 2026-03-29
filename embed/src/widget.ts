import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import { i18n, saveLocale } from '../../client/src/i18n'
import EmbedApp from './EmbedApp.vue'
import SlotListView from '../../client/src/views/SlotListView.vue'
import BookView from '../../client/src/views/BookView.vue'
import CancelView from '../../client/src/views/CancelView.vue'
import '../../client/src/style.css'

const SUPPORTED = ['en', 'fr', 'nl', 'de', 'ru'] as const
type SupportedLocale = (typeof SUPPORTED)[number]

function toSupported(raw: string | null | undefined): SupportedLocale | null {
  if (!raw) return null
  const lower = raw.toLowerCase()
  for (const l of SUPPORTED) {
    if (lower.startsWith(l)) return l
  }
  return null
}

function resolveLocale(hostLang?: string): SupportedLocale {
  // 1. User's explicit saved choice (they touched the language switcher)
  const saved = toSupported(localStorage.getItem('schedule-widget-locale'))
  if (saved) return saved

  // 2. Host page explicit option
  const fromOption = toSupported(hostLang)
  if (fromOption) return fromOption

  // 3. Host page <html lang="..."> attribute
  const fromHtml = toSupported(document.documentElement.lang)
  if (fromHtml) return fromHtml

  // 4. Browser language
  const fromBrowser = toSupported(navigator.language)
  if (fromBrowser) return fromBrowser

  return 'en'
}

export interface WidgetOptions {
  lang?: string
}

export function init(selector: string, options: WidgetOptions = {}) {
  const el = document.querySelector(selector)
  if (!el) throw new Error(`[schedule-widget] Element not found: ${selector}`)

  const locale = resolveLocale(options.lang)
  i18n.global.locale.value = locale

  // Use memory history so the widget never touches the host page's URL bar
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: SlotListView },
      { path: '/book', component: BookView },
      { path: '/cancel/:token?', component: CancelView },
    ],
  })

  const app = createApp(EmbedApp)
  app.use(createPinia())
  app.use(router)
  app.use(i18n)
  app.mount(el)
}
