/**
 * Database Initialization Script
 * Creates the SQLite database and tables
 */

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const DB_PATH = process.env.DB_PATH || './database/businesses.db';
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

// Ensure database directory exists
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

// Read schema file
const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');

// Create database connection
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        process.exit(1);
    }
    console.log('Connected to SQLite database');
});

// Execute schema
db.exec(schema, (err) => {
    if (err) {
        console.error('Error creating tables:', err.message);
        db.close();
        process.exit(1);
    }
    console.log('Database schema created successfully');
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        } else {
            console.log('Database initialized successfully!');
        }
    });
});

