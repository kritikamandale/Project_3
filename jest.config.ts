import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'node',
  rootDir: '.',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],

  // TypeScript transformation via ts-jest or Next.js SWC
  transform: {
    '^.+\\.(t|j)sx?$': ['@swc/jest', {}],
  },

  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  testMatch: [
    '<rootDir>/tests/unit/**/*.test.ts',
    '<rootDir>/tests/integration/**/*.test.ts',
  ],

  collectCoverageFrom: [
    'src/lib/**/*.ts',
    '!src/lib/db/schema.ts',
    '!src/lib/db/index.ts',
    '!**/*.d.ts',
  ],

  coverageProvider: 'v8',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: { lines: 70, functions: 70, branches: 60 },
  },

  // Avoid running against node_modules
  testPathIgnorePatterns: ['/node_modules/', '/.next/'],

  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,
};

export default config;
