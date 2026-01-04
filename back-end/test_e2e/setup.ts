process.env.NODE_ENV = 'test'
import request from 'supertest'
import { dbReady } from '../src/dao/db'
import { app } from '../index'

beforeAll(async () => {
    await dbReady;
}, 60000);

export default request(app)