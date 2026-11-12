import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// base './' keeps every URL relative, so dist/ works under any sub-path (e.g. /navigators/)
export default defineConfig({
  base: './',
  plugins: [svelte()],
  build: { target: 'es2022', chunkSizeWarningLimit: 900 },
});
