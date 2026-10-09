/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ isSsrBuild }) => ({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    port: 5173,
    // Same-origin API in dev so httpOnly SameSite=Strict cookies just work.
    proxy: { '/api': { target: 'http://localhost:4000', changeOrigin: true } },
  },
  build: {
    target: 'es2020',
    sourcemap: true,
    cssCodeSplit: true,
    // Vendor splitting applies to the client bundle only; SSR externalises deps.
    rollupOptions: isSsrBuild
      ? {}
      : {
          output: {
            manualChunks: {
              react: ['react', 'react-dom', 'react-router-dom'],
              motion: ['framer-motion', 'gsap', 'lenis'],
              map: ['leaflet', 'react-leaflet'],
            },
          },
        },
  },
  // vite-react-ssg: prerender public routes at build time (admin stays client-only).
  ssgOptions: {
    script: 'async',
    formatting: 'none',
    beastiesOptions: { preload: 'media' },
    dirStyle: 'nested',
    // Dynamic routes (projects/:slug, news/:slug, careers/:slug) are expanded via
    // each route's getStaticPaths() which calls the public API at build time.
    includedRoutes: (paths) => paths.filter((p) => !p.startsWith('/admin')),
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}', 'src/**/*.test.{ts,tsx}'],
    css: false,
  },
}));
