/**
 * Wait for the database to be fully initialized before running integration tests.
 * This ensures that tables are created and ready before tests try to use them.
 */
export async function waitForDB(): Promise<void> {
  const { dbReady } = require('../../src/dao/db')
  await dbReady
}
