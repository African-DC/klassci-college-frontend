import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    // Exclude Playwright e2e specs — they are run by `pnpm playwright test`,
    // not by Vitest. Their `test.describe()` API is incompatible.
    exclude: ['**/node_modules/**', '**/.next/**', 'e2e/**'],
    // Don't fail the suite while we have no unit tests yet — tests come in
    // a follow-up commit. Allows CI to stay green during the unit-test gap.
    passWithNoTests: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
