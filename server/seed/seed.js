const db = require('../db');

function seed() {
  console.log('Seeding database...');

  // Enable transactional writes
  db.exec('BEGIN TRANSACTION');
  try {
    // Delete existing records to avoid duplicate inserts
    db.exec('DELETE FROM interventions');
    db.exec('DELETE FROM alerts');
    db.exec('DELETE FROM blocks');
    db.exec('DELETE FROM districts');
    db.exec('DELETE FROM otp_logs');
    db.exec('DELETE FROM users');

    // Reset autoincrement sequences
    db.exec("DELETE FROM sqlite_sequence WHERE name='users'");
    db.exec("DELETE FROM sqlite_sequence WHERE name='otp_logs'");
    db.exec("DELETE FROM sqlite_sequence WHERE name='districts'");
    db.exec("DELETE FROM sqlite_sequence WHERE name='blocks'");
    db.exec("DELETE FROM sqlite_sequence WHERE name='alerts'");
    db.exec("DELETE FROM sqlite_sequence WHERE name='interventions'");

    // 1. Insert Users
    const insertUser = db.prepare(`
      INSERT INTO users (name, phone, role, state, district, active, otp_attempts, otp_lock_until)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertUser.run("Ravi Kumar", "+919900000001", "mp", "Andhra Pradesh", "Anantapur", 1, 0, null);
    insertUser.run("Priya Sharma", "+919900000002", "officer", "Andhra Pradesh", "Anantapur", 1, 0, null);
    insertUser.run("System Administrator", "+919900000003", "admin", "Andhra Pradesh", "Anantapur", 1, 0, null);

    const userMap = {};
    db.prepare('SELECT id, name, role FROM users').all().forEach(u => {
      userMap[u.role] = u.id;
    });

    // 2. Insert District
    const insertDistrict = db.prepare(`
      INSERT INTO districts (name, state, alert_level, total_farmers, total_blocks)
      VALUES (?, ?, ?, ?, ?)
    `);
    const districtResult = insertDistrict.run("Anantapur", "Andhra Pradesh", "yellow", 185000, 8);
    const districtId = districtResult.lastInsertRowid;

    // 3. Insert Blocks
    const insertBlock = db.prepare(`
      INSERT INTO blocks (
        district_id, name, mandal, total_farmers, crop_coverage, alert_level,
        stress_index, stress_history, rainfall_deficit_pct, soil_moisture_pct,
        rainfall_mm, mandi_price_drop_pct, last_inspected_at, lat, lng
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // We need 8 blocks.
    // 1. Kalyandurg (High stress, newly crossed: second-to-last 72, current 82)
    const kalyandurgRes = insertBlock.run(
      districtId, "Kalyandurg", "Kalyandurg Mandal", 24500,
      JSON.stringify({ Groundnut: 15000, Paddy: 4000, Jowar: 2500 }),
      "red", 82, JSON.stringify([68, 70, 72, 73, 74, 72, 82]),
      32.5, 12.0, 110.0, 18.2, "2026-06-25", 14.55, 77.12
    );

    // 2. Rayadurg (High stress, not newly crossed: second-to-last 77, current 78)
    const rayadurgRes = insertBlock.run(
      districtId, "Rayadurg", "Rayadurg Mandal", 22000,
      JSON.stringify({ Groundnut: 12000, Cotton: 6000, Maize: 2000 }),
      "red", 78, JSON.stringify([76, 77, 75, 78, 76, 77, 78]),
      28.0, 14.5, 125.0, 24.5, "2026-06-24", 14.70, 76.85
    );

    // 3. Tadipatri (Moderate stress)
    const tadipatriRes = insertBlock.run(
      districtId, "Tadipatri", "Tadipatri Mandal", 28000,
      JSON.stringify({ Paddy: 18000, Groundnut: 6000, Sunflower: 2000 }),
      "yellow", 48, JSON.stringify([42, 43, 44, 45, 47, 46, 48]),
      12.0, 22.0, 180.0, 5.0, "2026-06-26", 14.91, 78.01
    );

    // 4. Dharmavaram (Low stress)
    const dharmavaramRes = insertBlock.run(
      districtId, "Dharmavaram", "Dharmavaram Mandal", 19500,
      JSON.stringify({ Groundnut: 10000, Cotton: 7000, Paddy: 1500 }),
      "green", 22, JSON.stringify([25, 24, 23, 22, 21, 23, 22]),
      -5.0, 35.0, 240.0, -2.0, "2026-06-23", 14.43, 77.71
    );

    // 5. Kadiri (High stress, newly crossed: second-to-last 74, current 85)
    const kadiriRes = insertBlock.run(
      districtId, "Kadiri", "Kadiri Mandal", 31000,
      JSON.stringify({ Groundnut: 22000, Maize: 5000, Ragi: 2000 }),
      "red", 85, JSON.stringify([60, 62, 65, 70, 72, 74, 85]),
      38.0, 9.5, 95.0, 29.0, "2026-06-22", 14.11, 78.16
    );

    // 6. Guntakal (Moderate stress)
    const guntakalRes = insertBlock.run(
      districtId, "Guntakal", "Guntakal Mandal", 18000,
      JSON.stringify({ Cotton: 10000, Groundnut: 5000, Bajra: 2000 }),
      "yellow", 55, JSON.stringify([45, 48, 50, 52, 53, 54, 55]),
      18.5, 18.0, 155.0, 12.0, "2026-06-20", 15.17, 77.38
    );

    // 7. Hindupur (Low stress)
    const hindupurRes = insertBlock.run(
      districtId, "Hindupur", "Hindupur Mandal", 25000,
      JSON.stringify({ Groundnut: 14000, Paddy: 8000, Maize: 2000 }),
      "green", 35, JSON.stringify([40, 38, 37, 36, 35, 34, 35]),
      5.0, 28.0, 210.0, 1.5, "2026-06-21", 13.83, 77.49
    );

    // 8. Penukonda (High stress, newly crossed, 0 interventions seeded)
    const penukondaRes = insertBlock.run(
      districtId, "Penukonda", "Penukonda Mandal", 17000,
      JSON.stringify({ Groundnut: 11000, Maize: 4000, Cotton: 1000 }),
      "red", 76, JSON.stringify([60, 65, 68, 70, 72, 73, 76]),
      26.0, 13.0, 130.0, 21.0, "2026-06-25", 14.08, 77.59
    );

    const bKalyandurg = kalyandurgRes.lastInsertRowid;
    const bRayadurg = rayadurgRes.lastInsertRowid;
    const bTadipatri = tadipatriRes.lastInsertRowid;
    const bDharmavaram = dharmavaramRes.lastInsertRowid;
    const bKadiri = kadiriRes.lastInsertRowid;
    const bGuntakal = guntakalRes.lastInsertRowid;
    const bHindupur = hindupurRes.lastInsertRowid;
    const bPenukonda = penukondaRes.lastInsertRowid;

    // 4. Insert Alerts
    const insertAlert = db.prepare(`
      INSERT INTO alerts (block_id, type, severity, affected_metric, status, reported_at, resolved_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const now = Date.now();
    const threeDaysAgo = now - 3 * 24 * 60 * 60 * 1000;
    const tenDaysAgo = now - 10 * 24 * 60 * 60 * 1000;

    // Kalyandurg alerts
    insertAlert.run(bKalyandurg, "drought", "high", "Soil Moisture: 12%", "open", threeDaysAgo, null);
    insertAlert.run(bKalyandurg, "pest", "medium", "Affected area: 1,200 Ha", "monitoring", threeDaysAgo, null);

    // Rayadurg alerts
    insertAlert.run(bRayadurg, "drought", "high", "Rainfall deficit: 28%", "open", tenDaysAgo, null);
    insertAlert.run(bRayadurg, "weather", "medium", "Mandi price drop: 24.5%", "resolved", tenDaysAgo, now - 2 * 24 * 60 * 60 * 1000);

    // Kadiri alerts
    insertAlert.run(bKadiri, "drought", "high", "Soil Moisture: 9.5%", "open", threeDaysAgo, null);
    insertAlert.run(bKadiri, "pest", "high", "Spodoptera frugiperda outbreak", "open", threeDaysAgo, null);

    // Penukonda alerts
    insertAlert.run(bPenukonda, "drought", "high", "Rainfall deficit: 26%", "open", threeDaysAgo, null);

    // 5. Insert Interventions
    const insertIntervention = db.prepare(`
      INSERT INTO interventions (block_id, type, detail, resources_deployed, status, notes, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Kalyandurg interventions
    insertIntervention.run(
      bKalyandurg, "Water tanker delivery", "Deploying 15 water tankers daily to critical mandal areas",
      "15 Tankers, 30,000 Litres", "active", "Coordinated with local panchayats.", userMap["officer"], threeDaysAgo
    );
    insertIntervention.run(
      bKalyandurg, "Seed distribution", "Distributing drought-resistant groundnut seeds",
      "5,000 Seed Minikits", "scheduled", "Distribution starts next Monday.", userMap["officer"], now - 1 * 24 * 60 * 60 * 1000
    );

    // Rayadurg interventions
    insertIntervention.run(
      bRayadurg, "Subsidy credit release", "Deploying financial subsidy for crop failure",
      "Rs. 2.4 Crores allocated", "completed", "Transferred directly to eligible cooperative society accounts.", userMap["officer"], tenDaysAgo
    );

    // Kadiri interventions
    insertIntervention.run(
      bKadiri, "Pesticide sprayers deployment", "Providing subsidized chemical sprayers to control pest infestation",
      "120 Sprayers, 500L Pesticide", "active", "Monitoring daily progress.", userMap["officer"], threeDaysAgo
    );

    // NOTE: Penukonda is purposely left with 0 interventions to test empty states!
    
    db.exec('COMMIT');
    console.log('Database seeded successfully.');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

try {
  seed();
} catch (err) {
  console.error('Error seeding database:', err);
  process.exit(1);
}
