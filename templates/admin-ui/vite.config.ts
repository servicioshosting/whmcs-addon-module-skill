import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [tailwindcss(), svelte()],
  base: '/modules/addons/<Name>/assets/admin/',
  build: {
    outDir: '../addons/<Name>/assets/admin',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
  },
});
