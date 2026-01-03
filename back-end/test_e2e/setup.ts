import request from 'supertest'
import { dbReady } from '../src/dao/db'
import { app } from '../index'

beforeAll(async () => {
    // Ensure the database is fully initialized before any test runs
    await dbReady
})

export default request(app)