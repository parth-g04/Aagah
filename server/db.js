const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const dbPath = path.join(__dirname, 'database.db');
const db = new DatabaseSync(dbPath);

// Enable foreign key support
db.exec('PRAGMA foreign_keys = ON');

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    role TEXT CHECK(role IN ('mp', 'officer', 'admin')) NOT NULL,
    state TEXT NOT NULL,
    district TEXT NOT NULL,
    active INTEGER DEFAULT 1,
    otp_attempts INTEGER DEFAULT 0,
    otp_lock_until INTEGER,
    created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
  );

  CREATE TABLE IF NOT EXISTS otp_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    code_hash TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    consumed INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS districts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    state TEXT NOT NULL,
    alert_level TEXT CHECK(alert_level IN ('green', 'yellow', 'red')) DEFAULT 'green',
    total_farmers INTEGER DEFAULT 0,
    total_blocks INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS blocks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    district_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    mandal TEXT NOT NULL,
    total_farmers INTEGER DEFAULT 0,
    crop_coverage TEXT, -- JSON object
    alert_level TEXT CHECK(alert_level IN ('green', 'yellow', 'red')) DEFAULT 'green',
    stress_index INTEGER CHECK(stress_index >= 0 AND stress_index <= 100) DEFAULT 0,
    stress_history TEXT, -- JSON array of 7 values
    rainfall_deficit_pct REAL DEFAULT 0.0,
    mandi_price_drop_pct REAL DEFAULT 0.0,
    soil_moisture_pct REAL DEFAULT 0.0,
    rainfall_mm REAL DEFAULT 0.0,
    last_inspected_at TEXT,
    lat REAL,
    lng REAL,
    updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
    FOREIGN KEY(district_id) REFERENCES districts(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    block_id INTEGER NOT NULL,
    type TEXT CHECK(type IN ('pest', 'drought', 'flood', 'disease', 'weather')) NOT NULL,
    severity TEXT CHECK(severity IN ('low', 'medium', 'high')) NOT NULL,
    affected_metric TEXT,
    status TEXT CHECK(status IN ('open', 'monitoring', 'resolved')) DEFAULT 'open',
    reported_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
    resolved_at INTEGER,
    FOREIGN KEY(block_id) REFERENCES blocks(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS interventions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    block_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    detail TEXT NOT NULL,
    resources_deployed TEXT NOT NULL,
    status TEXT CHECK(status IN ('scheduled', 'active', 'completed')) DEFAULT 'scheduled',
    notes TEXT,
    created_by INTEGER NOT NULL,
    created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
    FOREIGN KEY(block_id) REFERENCES blocks(id) ON DELETE CASCADE,
    FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE CASCADE
  );
`);

module.exports = db;
