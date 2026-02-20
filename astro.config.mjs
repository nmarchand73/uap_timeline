import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://uap-timeline.netlify.app',
  output: 'static',
  build: {
    assets: '_assets',
  },
  vite: {
    optimizeDeps: {
      include: ['fuse.js'],
    },
  },
});
