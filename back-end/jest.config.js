module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',

  roots: [
    '<rootDir>/test_unit',
    '<rootDir>/test_integration',
    '<rootDir>/test_e2e',
    '<rootDir>/test_UI',
  ],
  testMatch: ['**/?(*.)+(spec|test).[tj]s?(x)'],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],

  globalSetup: process.env.RUN_E2E === 'true'
      ? '<rootDir>/test_e2e/globalSetup.ts'
      : undefined,

  globalTeardown: process.env.RUN_E2E === 'true'
      ? '<rootDir>/test_e2e/globalTeardown.ts'
      : undefined,

  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['lcov', 'text', 'html'],
  collectCoverageFrom: ['<rootDir>/src/**/*.ts'],
  coveragePathIgnorePatterns: [
    '/test_unit/',
    '/test_integration/',
    '/test_e2e/',
    '/node_modules/',
  ],

  testTimeout: 60000,
}