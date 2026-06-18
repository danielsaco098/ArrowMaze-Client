/**
 * Jest configuration.
 *
 * Layer 1 (domain) and Layer 2 (application) are pure TypeScript with no React Native
 * dependencies, so they are tested in a fast Node environment via ts-jest — keeping the
 * inner Clean Architecture layers fully decoupled from the framework.
 *
 * UI / widget tests (Fase 3) will be added as a second Jest project using the `jest-expo`
 * preset (already installed) without affecting these domain tests.
 */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/index.ts',
  ],
  coverageDirectory: '<rootDir>/coverage',
  clearMocks: true,
};
