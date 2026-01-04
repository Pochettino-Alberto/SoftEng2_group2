import { resetTestDB } from "../test_integration/helpers/resetTestDB";

export default async function globalSetup() {
    process.env.NODE_ENV = "test";
    process.env.TEST_DB_IN_MEMORY = "false";
    process.env.SKIP_DB_INIT = "true";

    await resetTestDB();
}
