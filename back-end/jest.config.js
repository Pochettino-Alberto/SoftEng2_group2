
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',

  roots: ['<rootDir>/test_unit', '<rootDir>/test_integration'],
  testMatch: ['**/?(*.)+(spec|test).[tj]s?(x)'],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],

  // --- Add these ---
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['lcov', 'text', 'html'],
  // Only collect coverage from source files (not tests/helpers)
  collectCoverageFrom: ['<rootDir>/src/**/*.ts'],
  // Ignore test folders and any helper/test files from coverage
  coveragePathIgnorePatterns: ['/test_unit/', '/test_integration/', '/node_modules/'],
};
