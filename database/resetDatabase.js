import sqlite3 from 'sqlite3';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';


// npm run reset-database  -> "reset-database": "node ../database/resetDatabase.ts"

// Needed because we’re using ES modules (import syntax)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Absolute paths to all files
const dbPath = resolve(__dirname, 'database.db');
const ddlPath = resolve(__dirname, 'tables_DDL.sql');
const defaultValuesPath = resolve(__dirname, 'tables_default_values.sql');

// Connect to the SQLite database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err.message);
    process.exit(1);
  } else {
    console.log('✅ Connected to database:', dbPath);
    runSQLFiles();
  }
});

function runSQLFiles() {
  try {
    const ddlSQL = readFileSync(ddlPath, 'utf8');
    const defaultSQL = readFileSync(defaultValuesPath, 'utf8');

    console.log('🚧 Running DDL script...');
    db.exec(ddlSQL, (err) => {
      if (err) {
        console.error('❌ Error executing DDL script:', err.message);
        process.exit(1);
      } else {
        console.log('✅ Tables created successfully.');

        console.log('🚧 Running default values script...');
        db.exec(defaultSQL, (err) => {
          if (err) {
            console.error('❌ Error executing default values script:', err.message);
            process.exit(1);
          } else {
            console.log('✅ Default values inserted successfully.');
            db.close((err) => {
              if (err) console.error('⚠️ Error closing database:', err.message);
              else console.log('🏁 Database connection closed.');
            });
          }
        });
      }
    });
  } catch (err) {
    console.error('❌ Failed to read SQL files:', err.message);
    process.exit(1);
  }
}
