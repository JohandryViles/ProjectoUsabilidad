import { defineConfig } from 'vitest/config';

export default defineConfig({
  esbuild: { jsx: 'automatic' },
  server: {
    // El backend de IA (server/) atiende /api durante el desarrollo.
    proxy: { '/api': `http://localhost:${process.env.PORT || 8787}` },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.test.{js,jsx}', 'server/**/*.test.js'],
    restoreMocks: true,
  },
});
