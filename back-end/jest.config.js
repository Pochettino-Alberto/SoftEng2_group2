module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // run both unit and integration tests
  roots: ['<rootDir>/test_unit', '<rootDir>/test_integration'],
  testMatch: ['**/?(*.)+(spec|test).[tj]s?(x)'],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
};
