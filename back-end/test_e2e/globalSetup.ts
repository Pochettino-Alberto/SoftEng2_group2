import fs from "fs";
import path from "path";
import os from "os";

export default async () => {
    // ---- Fake Supabase for E2E ONLY ----
    process.env.SUPABASE_URL =
        process.env.SUPABASE_URL || "http://localhost/fake-supabase";
    process.env.SUPABASE_SERVICE_KEY =
        process.env.SUPABASE_SERVICE_KEY || "fake-service-key";

    // ---- Stable DB path for E2E ----
    const dbPath = path.join(
        os.tmpdir(),
        `e2e-db-${process.pid}.db`
    );

    process.env.DB_PATH = dbPath;

    // Ensure fresh DB
    if (fs.existsSync(dbPath)) {
        fs.unlinkSync(dbPath);
    }

    process.env.NODE_ENV = "test";
};
