const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const dotenv = require('dotenv');

dotenv.config();

const DEFAULT_DB_PATH = path.join(__dirname, 'database', 'businesses.db');
const DB_PATH = process.env.DB_PATH || DEFAULT_DB_PATH;
const SCHEMA_PATH = path.join(__dirname, 'database', 'schema.sql');

function ensureDatabaseFile() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(DB_PATH)) {
    fs.closeSync(fs.openSync(DB_PATH, 'w'));
  }
}

function loadSchema() {
  if (!fs.existsSync(SCHEMA_PATH)) {
    throw new Error(`Schema file not found at ${SCHEMA_PATH}`);
  }
  return fs.readFileSync(SCHEMA_PATH, 'utf8');
}

function runMigrations() {
  return new Promise((resolve, reject) => {
    ensureDatabaseFile();
    const schema = loadSchema();

    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        reject(err);
      }
    });

    db.exec(schema, (err) => {
      if (err) {
        db.close(() => reject(err));
        return;
      }

      db.close((closeErr) => {
        if (closeErr) {
          reject(closeErr);
          return;
        }
        resolve();
      });
    });
  });
}

runMigrations()
  .then(() => {
    console.log('✅ Database migrations completed');
  })
  .catch((error) => {
    console.error('❌ Database migration failed:', error.message);
    process.exit(1);
  });

