// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://fleetlix.com',
  build: {
    inlineStylesheets: 'never',
  },
  integrations: [
    react(),
    sitemap({
      filter: (page) => !page.includes("/thank-you"),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
