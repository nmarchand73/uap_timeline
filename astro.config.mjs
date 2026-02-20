import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://incredible-mousse-cfff92.netlify.app',
  output: 'static',
  build: {
    assets: '_assets',
  },
});
