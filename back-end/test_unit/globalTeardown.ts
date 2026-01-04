import db from "../src/dao/db";

export default async () => {
    if (db) {
        await new Promise<void>((resolve) => {
            db.close(() => resolve());
        });
    }
};
