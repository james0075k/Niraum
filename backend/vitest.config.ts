import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    env: { NODE_ENV: 'test' },
    globalSetup: ['tests/globalSetup.ts'],
    setupFiles: ['tests/setup.ts'],
    // Argon2 + an in-memory mongod per run: give the first hash/startup room.
    testTimeout: 20_000,
    hookTimeout: 60_000,
    coverage: {
      provider: 'v8',
      include: ['src/**'],
      exclude: ['src/server.ts', 'src/seed/index.ts', 'src/types/**'],
      reporter: ['text-summary', 'text', 'html'],
      thresholds: {
        'src/services/**': { lines: 80, statements: 80, functions: 80, branches: 70 },
        'src/controllers/**': { lines: 80, statements: 80, functions: 80, branches: 70 },
      },
    },
  },
});
