# embed

Embeddable widget package. Builds the Vue appointment app as a self-contained IIFE (`widget.iife.js`) that any host page can drop in with one `<script>` tag and one `init()` call.

## Structure

```
embed/
  src/
    widget.ts       Entry point — exports init(selector, options?)
    EmbedApp.vue    Root component (no SaaS navbar, just content + ConnectionOverlay)
    EmbedNav.vue    Compact tab bar (Schedule | Cancel) + language switcher
  index.html        Demo page simulating a customer website
  vite.config.ts    Dev server on :5174, proxies /api + /socket.io → :3000
                    Library build → widget.iife.js
  tailwind.config.js  Scans both embed/src and client/src for CSS classes
```

## Key rules

- **Never** import from `client/src/App.vue` or `client/src/components/AppLayout.vue` — the embed has its own root (`EmbedApp.vue`) and nav (`EmbedNav.vue`) without the SaaS chrome
- Uses `createMemoryHistory()` — the widget never touches the host page's URL bar
- Language storage key is `schedule-widget-locale` (not `locale`) to avoid clashing with the SPA's own localStorage key

## Language priority

1. `schedule-widget-locale` in localStorage (user picked via switcher)
2. `options.lang` passed to `init()`
3. `<html lang="...">` on the host page
4. `navigator.language`
5. `'en'` fallback

## Dev

```bash
pnpm dev:embed   # starts server + embed demo
```

Demo at **http://localhost:5174**
