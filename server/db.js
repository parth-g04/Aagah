const path = require('path');
const fs = require('fs');

let DatabaseSync;
let db = null;
global.dbError = null;

// Mock Data Store for fallback when node:sqlite is unavailable
const mockData = {
  users: [
    { id: 1, name: "Ravi Kumar", phone: "+919900000001", role: "mp", state: "Andhra Pradesh", district: "Anantapur", active: 1, otp_attempts: 0, otp_lock_until: null, created_at: Date.now() },
    { id: 2, name: "Priya Sharma", phone: "+919900000002", role: "officer", state: "Andhra Pradesh", district: "Anantapur", active: 1, otp_attempts: 0, otp_lock_until: null, created_at: Date.now() },
    { id: 3, name: "System Administrator", phone: "+919900000003", role: "admin", state: "Andhra Pradesh", district: "Anantapur", active: 1, otp_attempts: 0, otp_lock_until: null, created_at: Date.now() }
  ],
  districts: [
    { id: 1, name: "Anantapur", state: "Andhra Pradesh", alert_level: "yellow", total_farmers: 185000, total_blocks: 8 }
  ],
  blocks: [
    { id: 1, district_id: 1, name: "Kalyandurg", mandal: "Kalyandurg Mandal", total_farmers: 24500, crop_coverage: '{"Groundnut":15000,"Paddy":4000,"Jowar":2500}', alert_level: "red", stress_index: 82, stress_history: '[68,70,72,73,74,72,82]', rainfall_deficit_pct: 32.5, soil_moisture_pct: 12.0, rainfall_mm: 110.0, mandi_price_drop_pct: 18.2, lat: 14.55, lng: 77.12, updated_at: Date.now() },
    { id: 2, district_id: 1, name: "Rayadurg", mandal: "Rayadurg Mandal", total_farmers: 22000, crop_coverage: '{"Groundnut":12000,"Cotton":6000,"Maize":2000}', alert_level: "red", stress_index: 78, stress_history: '[76,77,75,78,76,77,78]', rainfall_deficit_pct: 28.0, soil_moisture_pct: 14.5, rainfall_mm: 125.0, mandi_price_drop_pct: 24.5, lat: 14.70, lng: 76.85, updated_at: Date.now() },
    { id: 3, district_id: 1, name: "Tadipatri", mandal: "Tadipatri Mandal", total_farmers: 28000, crop_coverage: '{"Paddy":18000,"Groundnut":6000,"Sunflower":2000}', alert_level: "yellow", stress_index: 48, stress_history: '[42,43,44,45,47,46,48]', rainfall_deficit_pct: 12.0, soil_moisture_pct: 22.0, rainfall_mm: 180.0, mandi_price_drop_pct: 5.0, lat: 14.91, lng: 78.01, updated_at: Date.now() },
    { id: 4, district_id: 1, name: "Dharmavaram", mandal: "Dharmavaram Mandal", total_farmers: 19500, crop_coverage: '{"Groundnut":10000,"Cotton":7000,"Paddy":1500}', alert_level: "green", stress_index: 22, stress_history: '[25,24,23,22,21,23,22]', rainfall_deficit_pct: -5.0, soil_moisture_pct: 35.0, rainfall_mm: 240.0, mandi_price_drop_pct: -2.0, lat: 14.43, lng: 77.71, updated_at: Date.now() },
    { id: 5, district_id: 1, name: "Kadiri", mandal: "Kadiri Mandal", total_farmers: 31000, crop_coverage: '{"Groundnut":22000,"Maize":5000,"Ragi":2000}', alert_level: "red", stress_index: 85, stress_history: '[60,62,65,70,72,74,85]', rainfall_deficit_pct: 38.0, soil_moisture_pct: 9.5, rainfall_mm: 95.0, mandi_price_drop_pct: 29.0, lat: 14.11, lng: 78.16, updated_at: Date.now() },
    { id: 6, district_id: 1, name: "Guntakal", mandal: "Guntakal Mandal", total_farmers: 18000, crop_coverage: '{"Cotton":10000,"Groundnut":5000,"Bajra":2000}', alert_level: "yellow", stress_index: 55, stress_history: '[45,48,50,52,53,54,55]', rainfall_deficit_pct: 18.5, soil_moisture_pct: 18.0, rainfall_mm: 155.0, mandi_price_drop_pct: 12.0, lat: 15.17, lng: 77.38, updated_at: Date.now() },
    { id: 7, district_id: 1, name: "Hindupur", mandal: "Hindupur Mandal", total_farmers: 25000, crop_coverage: '{"Groundnut":14000,"Paddy":8000,"Maize":2000}', alert_level: "green", stress_index: 35, stress_history: '[40,38,37,36,35,34,35]', rainfall_deficit_pct: 5.0, soil_moisture_pct: 28.0, rainfall_mm: 210.0, mandi_price_drop_pct: 1.5, lat: 13.83, lng: 77.49, updated_at: Date.now() },
    { id: 8, district_id: 1, name: "Penukonda", mandal: "Penukonda Mandal", total_farmers: 17000, crop_coverage: '{"Groundnut":11000,"Maize":4000,"Cotton":1000}', alert_level: "red", stress_index: 76, stress_history: '[60,65,68,70,72,73,76]', rainfall_deficit_pct: 26.0, soil_moisture_pct: 13.0, rainfall_mm: 130.0, mandi_price_drop_pct: 21.0, lat: 14.08, lng: 77.59, updated_at: Date.now() }
  ],
  alerts: [
    { id: 1, block_id: 1, type: "drought", severity: "high", affected_metric: "Soil Moisture: 12%", status: "open", reported_at: Date.now() - 3 * 24 * 60 * 60 * 1000, resolved_at: null },
    { id: 2, block_id: 1, type: "pest", severity: "medium", affected_metric: "Affected area: 1,200 Ha", status: "monitoring", reported_at: Date.now() - 3 * 24 * 60 * 60 * 1000, resolved_at: null },
    { id: 3, block_id: 2, type: "drought", severity: "high", affected_metric: "Rainfall deficit: 28%", status: "open", reported_at: Date.now() - 10 * 24 * 60 * 60 * 1000, resolved_at: null },
    { id: 4, block_id: 2, type: "weather", severity: "medium", affected_metric: "Mandi price drop: 24.5%", status: "resolved", reported_at: Date.now() - 10 * 24 * 60 * 60 * 1000, resolved_at: Date.now() - 2 * 24 * 60 * 60 * 1000 },
    { id: 5, block_id: 5, type: "drought", severity: "high", affected_metric: "Soil Moisture: 9.5%", status: "open", reported_at: Date.now() - 3 * 24 * 60 * 60 * 1000, resolved_at: null },
    { id: 6, block_id: 5, type: "pest", severity: "high", affected_metric: "Spodoptera frugiperda outbreak", status: "open", reported_at: Date.now() - 3 * 24 * 60 * 60 * 1000, resolved_at: null },
    { id: 7, block_id: 8, type: "drought", severity: "high", affected_metric: "Rainfall deficit: 26%", status: "open", reported_at: Date.now() - 3 * 24 * 60 * 60 * 1000, resolved_at: null }
  ],
  interventions: [
    { id: 1, block_id: 1, type: "Water tanker delivery", detail: "Deploying 15 water tankers daily to critical mandal areas", resources_deployed: "15 Tankers, 30,000 Litres", status: "active", notes: "Coordinated with local panchayats.", created_by: 2, created_at: Date.now() - 3 * 24 * 60 * 60 * 1000 },
    { id: 2, block_id: 1, type: "Seed distribution", detail: "Distributing drought-resistant groundnut seeds", resources_deployed: "5,000 Seed Minikits", status: "scheduled", notes: "Distribution starts next Monday.", created_by: 2, created_at: Date.now() - 1 * 24 * 60 * 60 * 1000 },
    { id: 3, block_id: 2, type: "Subsidy credit release", detail: "Deploying financial subsidy for crop failure", resources_deployed: "Rs. 2.4 Crores allocated", status: "completed", notes: "Transferred directly to eligible cooperative society accounts.", created_by: 2, created_at: Date.now() - 10 * 24 * 60 * 60 * 1000 },
    { id: 4, block_id: 5, type: "Pesticide sprayers deployment", detail: "Providing subsidized chemical sprayers to control pest infestation", resources_deployed: "120 Sprayers, 500L Pesticide", status: "active", notes: "Monitoring daily progress.", created_by: 2, created_at: Date.now() - 3 * 24 * 60 * 60 * 1000 }
  ],
  otpLogs: []
};

// Mock SQLite Statement Executor
class MockStatement {
  constructor(sql) {
    this.sql = sql;
  }

  run(...args) {
    if (this.sql.includes('INSERT INTO interventions')) {
      const [block_id, type, detail, resources_deployed, status, notes, created_by] = args;
      const newId = mockData.interventions.length + 1;
      mockData.interventions.push({
        id: newId,
        block_id, type, detail, resources_deployed, status, notes, created_by,
        created_at: Date.now()
      });
      return { lastInsertRowid: newId, changes: 1 };
    }
    if (this.sql.includes('INSERT INTO alerts')) {
      const [block_id, type, severity, affected_metric, status] = args;
      const newId = mockData.alerts.length + 1;
      mockData.alerts.push({
        id: newId,
        block_id, type, severity, affected_metric, status,
        reported_at: Date.now(),
        resolved_at: null
      });
      return { lastInsertRowid: newId, changes: 1 };
    }
    if (this.sql.includes('INSERT INTO otp_logs')) {
      const [user_id, code_hash, expires_at, consumed] = args;
      const newId = mockData.otpLogs.length + 1;
      mockData.otpLogs.push({
        id: newId,
        user_id, code_hash, expires_at, consumed,
        created_at: Date.now()
      });
      return { lastInsertRowid: newId, changes: 1 };
    }
    if (this.sql.includes('UPDATE otp_logs')) {
      const [consumed, id] = args;
      const log = mockData.otpLogs.find(l => l.id === id);
      if (log) log.consumed = consumed;
      return { changes: 1 };
    }
    if (this.sql.includes('UPDATE users')) {
      return { changes: 1 };
    }
    if (this.sql.includes('UPDATE blocks')) {
      const [stress_index, alert_level, updated_at, id] = args;
      const block = mockData.blocks.find(b => b.id === id);
      if (block) {
        block.stress_index = stress_index;
        block.alert_level = alert_level;
        block.updated_at = updated_at;
      }
      return { changes: 1 };
    }
    if (this.sql.includes('UPDATE alerts')) {
      const [status, resolved_at, id] = args;
      const alert = mockData.alerts.find(a => a.id === id);
      if (alert) {
        alert.status = status;
        alert.resolved_at = resolved_at;
      }
      return { changes: 1 };
    }
    if (this.sql.includes('UPDATE interventions')) {
      const [status, notes, id] = args;
      const int = mockData.interventions.find(i => i.id === id);
      if (int) {
        int.status = status;
        int.notes = notes;
      }
      return { changes: 1 };
    }
    return { lastInsertRowid: 0, changes: 0 };
  }

  get(...args) {
    if (this.sql.includes('FROM users WHERE phone = ?')) {
      const [phone] = args;
      return mockData.users.find(u => u.phone === phone) || null;
    }
    if (this.sql.includes('FROM users WHERE name = ?')) {
      const [name] = args;
      return mockData.users.find(u => u.name === name) || null;
    }
    if (this.sql.includes('FROM users WHERE role = ?')) {
      const [role] = args;
      return mockData.users.find(u => u.role === role) || null;
    }
    if (this.sql.includes('FROM blocks WHERE id = ?')) {
      const [id] = args;
      return mockData.blocks.find(b => b.id === id) || null;
    }
    return null;
  }

  all(...args) {
    if (this.sql.includes('SELECT id, name, role FROM users')) {
      return mockData.users.map(u => ({ id: u.id, name: u.name, role: u.role }));
    }
    if (this.sql.includes('FROM otp_logs')) {
      const [user_id, now] = args;
      return mockData.otpLogs.filter(l => l.user_id === user_id && l.expires_at > now && l.consumed === 0);
    }
    if (this.sql.includes('FROM districts')) {
      return mockData.districts;
    }
    if (this.sql.includes('FROM blocks WHERE district_id = ?')) {
      const [district_id] = args;
      return mockData.blocks.filter(b => b.district_id === district_id);
    }
    if (this.sql.includes('FROM blocks')) {
      return mockData.blocks;
    }
    if (this.sql.includes('FROM alerts WHERE status =')) {
      return mockData.alerts.filter(a => a.status === 'open' || a.status === 'monitoring');
    }
    if (this.sql.includes('FROM alerts WHERE block_id = ?')) {
      const [block_id] = args;
      return mockData.alerts.filter(a => a.block_id === block_id);
    }
    if (this.sql.includes('FROM interventions WHERE block_id = ?')) {
      const [block_id] = args;
      return mockData.interventions.filter(i => i.block_id === block_id);
    }
    if (this.sql.includes('FROM interventions')) {
      return mockData.interventions;
    }
    return [];
  }
}

// Attempt real SQLite load
try {
  DatabaseSync = require('node:sqlite').DatabaseSync;
  
  let dbPath = path.join(__dirname, 'database.db');

  // Search fallback paths
  if (!fs.existsSync(dbPath)) {
    const possiblePaths = [
      path.join(__dirname, '../server/database.db'),
      path.join(__dirname, 'server/database.db'),
      path.join(process.cwd(), 'server/database.db'),
      path.join(process.cwd(), 'database.db')
    ];
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        dbPath = p;
        break;
      }
    }
  }

  // Copy database to /tmp on Vercel
  if (process.env.VERCEL) {
    const tempDbPath = path.join('/tmp', 'database.db');
    if (!fs.existsSync(tempDbPath)) {
      if (fs.existsSync(dbPath)) {
        fs.copyFileSync(dbPath, tempDbPath);
        console.log('[SQLite] Copied database.db to /tmp successfully.');
      } else {
        console.warn('[SQLite] Source database.db does not exist at:', dbPath);
      }
    }
    dbPath = tempDbPath;
  }

  db = new DatabaseSync(dbPath);
  db.exec('PRAGMA foreign_keys = ON');

  // Ensure tables exist
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
      crop_coverage TEXT,
      alert_level TEXT CHECK(alert_level IN ('green', 'yellow', 'red')) DEFAULT 'green',
      stress_index INTEGER CHECK(stress_index >= 0 AND stress_index <= 100) DEFAULT 0,
      stress_history TEXT,
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
  console.log('[Aagah DB] Loaded real SQLite Database successfully.');
} catch (err) {
  console.error('[Aagah DB Warning] Real SQLite failed to load. Falling back to In-Memory JS Database.', err);
  global.dbError = err.message || String(err);
  
  // Instanciate the in-memory JS fallback database
  db = {
    exec: () => {},
    prepare: (sql) => new MockStatement(sql)
  };
}

module.exports = db;
