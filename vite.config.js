import { copyFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// GitHub Pages has no SPA fallback: a direct hit on /tts serves 404.html.
// Shipping a copy of index.html as 404.html lets the client-side router take over.
const spaFallback = () => {
  let outDir;
  return {
    name: 'spa-fallback-404',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      copyFileSync(resolve(outDir, 'index.html'), resolve(outDir, '404.html'));
    },
  };
};

export default defineConfig({
  base: '/',
  root: '.',
  plugins: [spaFallback()],
  server: {
    open: 'index.html',
    host: true,
  },
});
