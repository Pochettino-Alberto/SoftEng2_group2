// Ensure NODE_ENV=test to let db.ts pick the test DB path
process.env.NODE_ENV = 'test'

import request from 'supertest'
import { resetTestDb, teardownTestDb } from './testDb'
import { dbReady } from '../src/dao/db'

// Remove any existing test DB before requiring modules that open the DB
resetTestDb()

// import app after NODE_ENV has been set and DB reset
import { app } from '../index'

// jest global setup: nothing to export; tests will import this file.

// After all tests, close DB connection and perform cleanup
afterAll(async () => {
    await teardownTestDb()
})

// Ensure DB initialization finished before any tests run
beforeAll(async () => {
    await dbReady
})

export default request(app)
