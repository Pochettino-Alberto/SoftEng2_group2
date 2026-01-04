import { resetTestDB } from "./resetTestDB"

export default async () => {
    process.env.TEST_DB_E2E = "true"
    await resetTestDB()
}
