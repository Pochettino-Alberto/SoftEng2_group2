
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',

  // include unit, integration and end-to-end tests
  roots: ['<rootDir>/test_unit', '<rootDir>/test_integration', '<rootDir>/test_e2e', '<rootDir>/test_UI'],
  testMatch: ['**/?(*.)+(spec|test).[tj]s?(x)'],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],

  // Global setup and teardown for e2e tests
  globalSetup: '<rootDir>/test_e2e/globalSetup.ts',
  globalTeardown: '<rootDir>/test_e2e/globalTeardown.ts',

  // --- Add these ---
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['lcov', 'text', 'html'],
  // Only collect coverage from source files (not tests/helpers)
  collectCoverageFrom: ['<rootDir>/src/**/*.ts'],
  // Ignore test folders and any helper/test files from coverage
  coveragePathIgnorePatterns: ['/test_unit/', '/test_integration/', '/test_e2e/', '/node_modules/'],
  // Increase default timeout for CI (some e2e operations may be slower)
  testTimeout: 60000,
};
