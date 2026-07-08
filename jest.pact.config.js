/**
 * Dedicated Jest config for the Pact consumer-contract tests, kept out of the
 * main suite so `npm test` never depends on the Pact native binaries.
 * Run with `npm run test:pact` (also wired in CI).
 */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/pact/**/*.pact.test.ts'],
  testTimeout: 60000,
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: { types: ['node', 'jest'] } }],
  },
};
