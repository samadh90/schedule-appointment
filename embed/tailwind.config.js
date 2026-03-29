/** @type {import('tailwindcss').Config} */
export default {
  // scan both embed and client source so all Tailwind classes are included
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}', '../client/src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
