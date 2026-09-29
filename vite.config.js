import { defineConfig } from 'vite';

export default defineConfig({
  base: '/',
  root: '.',
  server: {
    open: 'index.html',
    host: true,
  },
});