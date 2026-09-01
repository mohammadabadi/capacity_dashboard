import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  css: ['~/assets/css/main.css'],
  modules: ['@nuxt/eslint'],
  vite: {
    plugins: [tailwindcss()],
  },
  app: {
    head: {
      title: 'Capacity',
      htmlAttrs: { lang: 'en' },
    },
  },
})
