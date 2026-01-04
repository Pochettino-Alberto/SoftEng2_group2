process.env.NODE_ENV = 'test'

import request from 'supertest'
import { dbReady } from '../src/dao/db'
import { app } from '../index'

// This hook ensures every test file waits for the DB to be schema-ready
beforeAll(async () => {
    await dbReady;
}, 60000);

export default request(app)