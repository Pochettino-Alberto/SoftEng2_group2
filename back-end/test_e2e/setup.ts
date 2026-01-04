process.env.NODE_ENV = 'test'

import request from 'supertest'
import { dbReady } from '../src/dao/db'
import { app } from '../index'

beforeAll(async () => {
    // Wait for the global readiness promise to resolve
    await dbReady;
}, 60000);

export default request(app)