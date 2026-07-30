import { defineNuxtConfig } from 'nuxt/config';

export default defineNuxtConfig({
  compatibilityDate: '2024-01-01',
  devtools: { enabled: true },

  modules: ['@pinia/nuxt'],

  nitro: {
    preset: 'cloudflare-pages',
    prerender: {
      routes: ['/']   // 强制预渲染根路由
    }
  },

  app: {
    head: {
      title: 'AI Chat',
      meta: [
        { name: 'description', content: 'ChatGPT 风格的 AI 对话平台' },
      ],
      link: [
        { rel: 'icon', href: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">✨</text></svg>' },
      ],
    },
  },

  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:8787',
    },
  },

  css: ['~/assets/css/main.css'],

  typescript: {
    typeCheck: false,
  },

  // 配置 Vite 处理 pdfjs-dist
  vite: {
    optimizeDeps: {
      include: ['pdfjs-dist'],
    },
  },

  // 配置构建时排除不需要的依赖
  build: {
    transpile: ['pdfjs-dist'],
  },
});