module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/test_unit/**/*.test.ts"],
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"]
}