import { teardownTestDb } from './testDb'
import db from '../src/dao/db'

export default async function globalTeardown() {
    await teardownTestDb()
    db.close()
}