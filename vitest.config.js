import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    fileParallelism: false,
    env: {
      NODE_ENV: 'test',
    },
    setupFiles: ['./tests/setup/database-test.js'],
    include: ['tests/**/*.test.js', 'src/**/*.test.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'clover', 'html'],
      exclude: ['node_modules', 'src/config', 'src/app.js', 'tests'],
    },
  },
});
