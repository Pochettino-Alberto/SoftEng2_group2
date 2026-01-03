import request from 'supertest'
import app from '../index'
import { dbReady } from '../src/dao/db'

beforeAll(async () => {
    await dbReady
})

export default request(app)