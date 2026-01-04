import {resetTestDB} from "../test_integration/helpers/resetTestDB";

export default async () => {
    process.env.TEST_DB_E2E = "true"
    await resetTestDB()
}
