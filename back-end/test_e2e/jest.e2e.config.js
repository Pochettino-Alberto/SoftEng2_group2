module.exports = {
    globalSetup: '<rootDir>/test_e2e/globalSetup.ts',
    globalTeardown: '<rootDir>/test_e2e/globalTeardown.ts',
    testMatch: ['**/test_e2e/**/*.test.ts'],
    testEnvironment: 'node',
    runInBand: true
}
