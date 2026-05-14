/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src/__tests__'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    'src/services/**/*.ts',
    'src/controllers/**/*.ts',
    'src/middleware/**/*.ts',
    'src/utils/**/*.ts',
    '!src/**/*.d.ts',
  ],
  coverageThreshold: {
    global: { lines: 80, functions: 80, branches: 70, statements: 80 },
  },
  coverageReporters: ['text', 'lcov', 'html'],
  coverageDirectory: 'coverage',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@shared/(.*)$': '<rootDir>/../shared/$1',
  },
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/src/__tests__/unit/**/*.test.ts'],
      preset: 'ts-jest',
      testEnvironment: 'node',
      clearMocks: true,
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/src/__tests__/integration/**/*.test.ts'],
      preset: 'ts-jest',
      testEnvironment: 'node',
      clearMocks: true,
      testTimeout: 30000,
    },
    {
      displayName: 'security',
      testMatch: ['<rootDir>/src/__tests__/security/**/*.test.ts'],
      preset: 'ts-jest',
      testEnvironment: 'node',
      clearMocks: true,
    },
  ],
  verbose: true,
};
