# embed

Embeddable widget package. Builds the Vue appointment app as a self-contained IIFE (`widget.iife.js`) that any host page can drop in with one `<script>` tag.

## Structure

```
embed/
  src/
    widget.ts       Entry point — exports init(), auto-initializes [data-schedule-widget] elements
    widget.css      Scoped Tailwind (no Preflight) + scoped element reset for the widget container
    EmbedApp.vue    Root component (no SaaS navbar, just content + ConnectionOverlay)
    EmbedNav.vue    Compact tab bar (Schedule | Cancel) + LangDropdown
  index.html        Demo page simulating a customer website
  vite.config.ts    Dev server on :5174, proxies /api + /socket.io → :3000
                    Library build → widget.iife.js
  tailwind.config.js  Scans both embed/src and client/src; Preflight disabled (corePlugins.preflight: false)
```

## Integration (customer side)

Zero-JS — declarative `data-*` attributes on the container:

```html
<div data-schedule-widget data-api="https://your-api.example.com" data-lang="en"></div>
<script src="widget.iife.js"></script>
```

`data-api` — base URL of the API server. Omit for same-origin deployments.  
`data-lang` — force a locale (BCP-47 prefix matched). Omit to auto-detect from `<html lang>` then browser.

Programmatic API (optional, overrides data-\* attributes):

```js
const widget = init('#my-div', { apiBase: 'https://...', lang: 'fr' })
widget.destroy() // unmount and release resources
```

## Key rules

- **Never** import from `client/src/App.vue` or `client/src/components/AppLayout.vue` — the embed has its own root and nav without the SaaS chrome
- Uses `createMemoryHistory()` — the widget never touches the host page's URL bar
- Language storage key is `schedule-widget-locale` (not `locale`) to avoid clashing with the SPA's own localStorage key
- CSS: `widget.css` imports only `@tailwind components` and `@tailwind utilities` — **never** `@tailwind base`. The scoped reset block in `widget.css` provides the Preflight essentials (box-sizing, border-style:solid, font-family…) scoped to `.schedule-widget *` only
- All API calls go through `client/src/utils/api.ts` (`apiUrl()` / `apiSocketOrigin()`). `setApiBase()` is called in `init()` before mounting the app

## Language priority

1. `schedule-widget-locale` in localStorage (user picked via switcher)
2. `options.lang` passed to `init()` / `data-lang` attribute
3. `<html lang="...">` on the host page
4. `navigator.language`
5. `'en'` fallback

## Dev

```bash
pnpm dev:embed   # starts server + embed demo
```

Demo at **http://localhost:5174**
