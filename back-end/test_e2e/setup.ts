/// <reference types="jest" />
process.env.NODE_ENV = 'test'
process.env.SUPABASE_URL = 'http://test.supabase.co';
process.env.SUPABASE_SERVICE_KEY = 'test-key';

import request from 'supertest'
import { dbReady } from '../src/dao/db'
import { app } from '../index'

beforeAll(async () => {
    // Ensure the database is fully initialized before any test runs
    await dbReady
}, 60000)

export default request(app)