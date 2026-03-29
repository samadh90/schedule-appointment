import { createApp, type App } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import { i18n } from '../../client/src/i18n'
import { setApiBase } from '../../client/src/utils/api'
import EmbedApp from './EmbedApp.vue'
import SlotListView from '../../client/src/views/SlotListView.vue'
import BookView from '../../client/src/views/BookView.vue'
import CancelView from '../../client/src/views/CancelView.vue'
import './widget.css'
import 'flag-icons/css/flag-icons.min.css'

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
  /** Base URL of the schedule-appointment API, e.g. 'https://api.example.com'.
   *  Defaults to the current page's origin (correct for same-origin deployments). */
  apiBase?: string
  /** Force a locale. Accepts any BCP-47 tag — matched by prefix to a
   *  supported locale. Falls back to the host page's <html lang>, then browser
   *  language, then 'en'. */
  lang?: string
}

export interface WidgetInstance {
  /** Unmount the widget and release all resources. */
  destroy(): void
}

/**
 * Mount the scheduling widget into any element.
 *
 * @param target CSS selector string or an HTMLElement.
 * @param options Optional configuration. Can also be supplied as data-*
 *   attributes on the target element (data-api, data-lang) — those are
 *   overridden by this options object when both are present.
 */
export function init(target: string | Element, options: WidgetOptions = {}): WidgetInstance {
  const el = typeof target === 'string' ? document.querySelector(target) : target
  if (!el) throw new Error(`[schedule-widget] Element not found: ${target}`)

  // data-* attributes on the element are the zero-JS config fallback
  const apiBase = options.apiBase ?? (el as HTMLElement).dataset.api ?? ''
  const lang = options.lang ?? (el as HTMLElement).dataset.lang

  setApiBase(apiBase)
  el.classList.add('schedule-widget')

  const locale = resolveLocale(lang)
  i18n.global.locale.value = locale

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: SlotListView },
      { path: '/book', component: BookView },
      { path: '/cancel/:token?', component: CancelView },
    ],
  })

  const app: App = createApp(EmbedApp)
  app.use(createPinia())
  app.use(router)
  app.use(i18n)
  app.mount(el)

  return {
    destroy() {
      app.unmount()
      el.classList.remove('schedule-widget')
    },
  }
}

/**
 * Auto-initialize every element that carries the [data-schedule-widget]
 * attribute. Called automatically on DOMContentLoaded — customers only need
 * a <div> and the <script> tag, no JavaScript of their own.
 */
function autoInit(): void {
  document.querySelectorAll<HTMLElement>('[data-schedule-widget]').forEach(el => {
    init(el)
  })
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', autoInit)
} else {
  autoInit()
}
