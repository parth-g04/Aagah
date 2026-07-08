require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

// Auto-seed if database has no users
try {
  const userCount = db.prepare('SELECT count(*) as count FROM users').all()[0].count;
  if (userCount === 0) {
    console.log('[Aagah Server] Users table is empty. Triggering auto-seed...');
    require('./seed/seed');
  }
} catch (err) {
  console.error('[Aagah Server] Error checking or seeding database:', err.message);
}

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend client
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));

app.use(express.json());

// Import Routes
const authRouter = require('./routes/auth');
const mpRouter = require('./routes/mp');
const officerRouter = require('./routes/officer');
const blocksRouter = require('./routes/blocks');
const alertsRouter = require('./routes/alerts');
const interventionsRouter = require('./routes/interventions');
const chatRouter = require('./routes/chat');

// Bind API Routes
app.use('/api/auth', authRouter);
app.use('/api/mp', mpRouter);
app.use('/api/officer', officerRouter);
app.use('/api/blocks', blocksRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/interventions', interventionsRouter);
app.use('/api/chat', chatRouter);

// Basic health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../client/dist');
  app.use(express.static(distPath));
  
  // Wildcard fallback for React client router
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(distPath, 'index.html'));
    }
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`[Aagah Server] Running on port ${PORT}`);
    console.log(`[Aagah Server] DEMO_MODE: ${process.env.DEMO_MODE}`);
    if (process.env.DEMO_MODE === 'true') {
      console.log(`[Aagah Server] DEMO_OTP_CODE: ${process.env.DEMO_OTP_CODE || '246800'}`);
    }
  });
}

module.exports = app;
