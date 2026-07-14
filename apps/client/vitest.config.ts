import { fileURLToPath } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    // jsdom (as of v29) pulls in html-encoding-sniffer -> @exodus/bytes, which
    // ships ESM-only and crashes when required under this project's CommonJS
    // toolchain (the same class of bug as the sanitize-html/htmlparser2 issue
    // found during the Task H-L review) - happy-dom is vitest's other supported
    // DOM environment and doesn't have this problem.
    environment: 'happy-dom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
  },
});
