import react from '@vitejs/plugin-react';
import viteTsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react(), viteTsconfigPaths()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*'],
      exclude: ['**/*.test.ts', '**/*.spec.ts', '**/*.d.ts'],
      // thresholds: {
      //   statements: 70,
      //   branches: 65,
      //   functions: 70,
      //   lines: 70,
      // },
    },
  },
});
