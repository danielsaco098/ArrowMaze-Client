/**
 * Jest configuration with two projects:
 *
 * - "logic": Layer 1 (domain) and Layer 2 (application) are pure TypeScript with
 *   no React Native dependencies, so they run fast in a Node environment via
 *   ts-jest, keeping the inner Clean Architecture layers decoupled from the
 *   framework. Matches `*.test.ts`.
 *
 * - "ui": widget tests for the React Native screens/components run under the
 *   `jest-expo` preset. Matches `*.test.tsx`.
 */
module.exports = {
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/index.ts',
    '!src/test-support/**',
  ],
  coverageDirectory: '<rootDir>/coverage',
  projects: [
    {
      displayName: 'logic',
      preset: 'ts-jest',
      testEnvironment: 'node',
      roots: ['<rootDir>/src'],
      testMatch: ['**/*.test.ts'],
      clearMocks: true,
    },
    {
      displayName: 'ui',
      preset: 'jest-expo',
      testMatch: ['<rootDir>/src/**/*.test.tsx'],
      setupFiles: ['<rootDir>/jest.setup.ui.js'],
      clearMocks: true,
    },
  ],
};
