import { closeDb } from "../src/dao/db";

export default async function globalTeardown() {
    await closeDb();
}
