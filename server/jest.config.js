/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  globalSetup: "<rootDir>/jest.global-setup.js",
  globalTeardown: "<rootDir>/jest.global-teardown.js",
  setupFiles: ["<rootDir>/jest.setup.ts"],
  testMatch: ["**/src/tests/**/*.test.ts"],
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/tests/**",
    "!src/app.ts",
    "!src/index.ts",
  ],
};
