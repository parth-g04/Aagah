const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'kisan_alert_super_secret_session_key_2026';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '12h';
const DEMO_MODE = process.env.DEMO_MODE === 'true';
const DEMO_OTP_CODE = process.env.DEMO_OTP_CODE || '246800';

// POST /api/auth/send-otp
router.post('/send-otp', (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  // 1. Look up user
  const user = db.prepare('SELECT * FROM users WHERE phone = ? AND active = 1').get(phone);
  if (!user) {
    return res.status(400).json({ error: 'Phone number not registered.' });
  }

  // 2. Check lock out
  if (user.otp_lock_until && user.otp_lock_until > Date.now()) {
    const minutesLeft = Math.ceil((user.otp_lock_until - Date.now()) / (60 * 1000));
    return res.status(403).json({ error: `Too many attempts. Try again in ${minutesLeft} minutes.` });
  }

  // 3. Rate-limiting check: 1 request per phone per 20 seconds
  const lastLog = db.prepare(`
    SELECT created_at FROM otp_logs 
    WHERE user_id = ? 
    ORDER BY created_at DESC LIMIT 1
  `).get(user.id);

  if (lastLog && (Date.now() - lastLog.created_at < 20 * 1000)) {
    const secondsLeft = Math.ceil((20 * 1000 - (Date.now() - lastLog.created_at)) / 1000);
    return res.status(429).json({ error: `Too many requests. Please wait ${secondsLeft} seconds.` });
  }

  // 4. Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  console.log(`[SMS STUB] OTP for ${phone}: ${otp}`);

  // Hash OTP
  const salt = bcrypt.genSaltSync(10);
  const codeHash = bcrypt.hashSync(otp, salt);
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 mins

  // Save log
  db.prepare(`
    INSERT INTO otp_logs (user_id, code_hash, expires_at, consumed)
    VALUES (?, ?, ?, 0)
  `).run(user.id, codeHash, expiresAt);

  return res.json({ message: 'OTP sent' });
});

// POST /api/auth/verify-otp
router.post('/verify-otp', (req, res) => {
  const { phone, code } = req.body;

  if (!phone || !code) {
    return res.status(400).json({ error: 'Phone number and code are required' });
  }

  // 1. Look up user
  const user = db.prepare('SELECT * FROM users WHERE phone = ? AND active = 1').get(phone);
  if (!user) {
    return res.status(400).json({ error: 'Phone number not registered.' });
  }

  // 2. Check lock out (skip if DEMO_MODE = true)
  if (!DEMO_MODE && user.otp_lock_until && user.otp_lock_until > Date.now()) {
    const minutesLeft = Math.ceil((user.otp_lock_until - Date.now()) / (60 * 1000));
    return res.status(403).json({ error: `Too many attempts. Try again in ${minutesLeft} minutes.` });
  }

  // 3. Verify OTP
  let isVerified = false;

  // Check demo bypass first
  if (DEMO_MODE && code === DEMO_OTP_CODE) {
    isVerified = true;
  } else {
    // Normal verification path
    // Get all valid active OTPs
    const logs = db.prepare(`
      SELECT * FROM otp_logs 
      WHERE user_id = ? AND expires_at > ? AND consumed = 0
      ORDER BY created_at DESC
    `).all(user.id, Date.now());

    for (const log of logs) {
      if (bcrypt.compareSync(code, log.code_hash)) {
        isVerified = true;
        // Consume this OTP
        db.prepare('UPDATE otp_logs SET consumed = 1 WHERE id = ?').run(log.id);
        break;
      }
    }
  }

  if (isVerified) {
    // Success: reset attempts & lock
    db.prepare('UPDATE users SET otp_attempts = 0, otp_lock_until = NULL WHERE id = ?').run(user.id);

    // Issue JWT
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    return res.json({
      token,
      user: {
        name: user.name,
        role: user.role,
        district: user.district,
        state: user.state
      }
    });
  } else {
    // Failure path
    if (DEMO_MODE) {
      return res.status(400).json({ error: 'Incorrect OTP. Try again.' });
    }

    // Increment attempts
    const newAttempts = user.otp_attempts + 1;
    if (newAttempts >= 3) {
      const lockUntil = Date.now() + 15 * 60 * 1000; // 15 mins lock
      db.prepare('UPDATE users SET otp_attempts = 0, otp_lock_until = ? WHERE id = ?').run(lockUntil, user.id);
      return res.status(403).json({ error: 'Too many attempts. Try again in 15 minutes.' });
    } else {
      db.prepare('UPDATE users SET otp_attempts = ? WHERE id = ?').run(newAttempts, user.id);
      return res.status(400).json({ error: 'Incorrect OTP. Try again.' });
    }
  }
});

// POST /api/auth/google
router.post('/google', async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    return res.status(400).json({ error: 'Google credential token is required' });
  }

  try {
    // 1. Verify the Google ID Token by calling Google's secure tokeninfo endpoint
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
    if (!response.ok) {
      return res.status(400).json({ error: 'Invalid Google credential signature' });
    }

    const payload = await response.json();
    
    // 2. Validate client ID to prevent audience spoofing attacks
    const expectedClientId = process.env.GOOGLE_CLIENT_ID || '1037903692253-i5ghg0lavqv67adc4249q7hfacc90r07.apps.googleusercontent.com';
    if (payload.aud !== expectedClientId) {
      return res.status(403).json({ error: 'Audience verification failed' });
    }

    const email = payload.email;
    const name = payload.name || 'Google User';

    // 3. Query database for user by name, or match default mock accounts based on names/emails
    let user = db.prepare('SELECT * FROM users WHERE name = ? AND active = 1').get(name);
    
    if (!user) {
      // Fallback matching logic for stage demo:
      if (email.toLowerCase().includes('mp') || name.toLowerCase().includes('ravi')) {
        // Fallback to Ravi Kumar (MP)
        user = db.prepare("SELECT * FROM users WHERE role = 'mp' LIMIT 1").get();
      } else {
        // Fallback to Priya Sharma (Officer)
        user = db.prepare("SELECT * FROM users WHERE role = 'officer' LIMIT 1").get();
      }
    }

    if (!user) {
      return res.status(404).json({ error: 'User mapping failed. Access denied.' });
    }

    // 4. Issue Kisan Alert JWT
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    return res.json({
      token,
      user: {
        name: user.name,
        role: user.role,
        district: user.district,
        state: user.state
      }
    });
  } catch (err) {
    console.error('Google Auth Error:', err);
    return res.status(500).json({ error: 'Google authentication processing failed.' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  return res.json({ message: 'Logged out' });
});

module.exports = router;
