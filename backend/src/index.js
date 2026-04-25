// ============================================================
// CrisisSync Backend — Express Server Entry Point
// ============================================================

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { apiRateLimit } from './middleware/rateLimit.js';

import authRoutes from './routes/auth.js';
import incidentRoutes from './routes/incidents.js';
import hotelRoutes from './routes/hotels.js';
import userRoutes from './routes/users.js';
import notificationRoutes from './routes/notifications.js';
import reportRoutes from './routes/reports.js';

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ─────────────────────────────────────────────────
app.use(express.json());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
  credentials: true,
}));
app.use(apiRateLimit);

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const icon = res.statusCode < 400 ? '✅' : '❌';
    console.log(`${icon} ${req.method} ${req.path} → ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// ── Routes ─────────────────────────────────────────────────────
app.use('/v1/auth', authRoutes);
app.use('/v1/incidents', incidentRoutes);
app.use('/v1/hotels', hotelRoutes);
app.use('/v1/users', userRoutes);
app.use('/v1/notifications', notificationRoutes);
app.use('/v1/reports', reportRoutes);

// Health check
app.get('/v1/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'CrisisSync API',
    version: '1.0.0',
    mock: process.env.USE_MOCK_SERVICES !== 'false',
    uptime: process.uptime(),
  });
});

// SSE endpoint for real-time updates (mock mode replacement for Firebase RT DB)
const sseClients = new Map();

app.get('/v1/events/:hotelId', (req, res) => {
  const hotelId = req.params.hotelId;
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });
  res.write('data: {"type":"connected"}\n\n');

  const clientId = Date.now() + '-' + Math.random().toString(36).slice(2);
  if (!sseClients.has(hotelId)) sseClients.set(hotelId, new Map());
  sseClients.get(hotelId).set(clientId, res);

  req.on('close', () => {
    sseClients.get(hotelId)?.delete(clientId);
  });
});

// Broadcast SSE event to all connected clients for a hotel
export function broadcastSSE(hotelId, event) {
  const clients = sseClients.get(hotelId);
  if (!clients) return;
  const data = JSON.stringify(event);
  for (const [, res] of clients) {
    res.write(`data: ${data}\n\n`);
  }
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found', path: req.path });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start ──────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════╗
║           🚨 CrisisSync API Server v1.0             ║
║──────────────────────────────────────────────────────║
║  Port:     ${PORT}                                      ║
║  Mode:     ${process.env.USE_MOCK_SERVICES !== 'false' ? 'MOCK (no real API keys needed)      ' : 'LIVE (connected to real services)    '}║
║  Base URL: http://localhost:${PORT}/v1                  ║
║  SSE:      http://localhost:${PORT}/v1/events/:hotelId  ║
╚══════════════════════════════════════════════════════╝
  `);
});

export default app;
