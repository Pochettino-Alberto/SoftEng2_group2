/// <reference types="jest" />
// Ensure NODE_ENV=test to let db.ts pick the test DB path
process.env.NODE_ENV = 'test'

import request from 'supertest'
// Remove resetTestDb call - now handled globally
// Remove teardownTestDb import and call - now handled globally

// Import dbReady after NODE_ENV has been set
import { dbReady } from '../src/dao/db'

// import app after NODE_ENV has been set
import { app } from '../index'

// jest global setup: nothing to export; tests will import this file.

// Remove afterAll hook - database teardown now handled globally

// Ensure DB initialization finished before any tests run
beforeAll(async () => {
    await dbReady
}, 60000) // 60 second timeout for DB initialization

export default request(app)
