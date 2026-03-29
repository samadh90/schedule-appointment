/** @type {import('tailwindcss').Config} */
export default {
  // scan both embed and client source so all Tailwind classes are included
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}', '../client/src/**/*.{vue,js,ts,jsx,tsx}'],
  // Disable Preflight: the widget is embedded inside a host page — we don't
  // want to reset global element styles (headings, links, body…).
  // The scoped reset in widget.css provides the essential defaults instead.
  corePlugins: { preflight: false },
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
