import { resetTestDb } from './testDb'

export default async function globalSetup() {
    await resetTestDb()
}