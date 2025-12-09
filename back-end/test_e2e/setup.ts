/// <reference types="jest" />
// Ensure NODE_ENV=test to let db.ts pick the test DB path
process.env.NODE_ENV = 'test'

import request from 'supertest'
import { resetTestDb, teardownTestDb } from './testDb'
import { beforeAll, afterAll, afterEach } from '@jest/globals'
// Remove any existing test DB before requiring modules that open the DB
resetTestDb()

// Import dbReady after reset so the DB module opens with the expected file state
import { dbReady } from '../src/dao/db'

// import app after NODE_ENV has been set and DB reset
import { app } from '../index'

// Import supabase mock to reset fail flag after each test
import { supabaseServiceMockConfig } from './supabaseMock'

// jest global setup: nothing to export; tests will import this file.

// After each test, reset the supabase mock fail flag to prevent state leakage
afterEach(() => {
    supabaseServiceMockConfig.setFailNextUpload(false)
})

// After all tests, close DB connection and perform cleanup
afterAll(async () => {
    await teardownTestDb()
})

// Ensure DB initialization finished before any tests run
beforeAll(async () => {
    await dbReady
})

export default request(app)
