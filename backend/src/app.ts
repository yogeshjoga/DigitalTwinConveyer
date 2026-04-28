import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import dashboardRouter from './routes/dashboard';
import beltsRouter     from './routes/belts';
import sensorsRouter   from './routes/sensors';
import loadRouter      from './routes/load';
import thermalRouter   from './routes/thermal';
import visionRouter    from './routes/vision';
import alertsRouter    from './routes/alerts';
import plcRouter       from './routes/plc';

const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(helmet({
  // Allow framing from same origin (needed for some dashboard embeds)
  frameguard: { action: 'sameorigin' },
  // Relax CSP so the React frontend can load from any ngrok URL
  contentSecurityPolicy: false,
}));

// Open CORS to all origins — covers any ngrok / local / production URL
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning'],
}));

// Bypass the ngrok "visitor warning" interstitial page.
// Any request that includes the header (or any request to this server)
// gets the bypass header echoed back so ngrok skips its HTML warning page.
app.use((_req, res, next) => {
  res.setHeader('ngrok-skip-browser-warning', 'true');
  next();
});

app.use(morgan('dev'));
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/dashboard', dashboardRouter);
app.use('/api/belts',     beltsRouter);
app.use('/api/sensors',   sensorsRouter);
app.use('/api/load',      loadRouter);
app.use('/api/thermal',   thermalRouter);
app.use('/api/vision',    visionRouter);
app.use('/api/alerts',    alertsRouter);
app.use('/api/plc',       plcRouter);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

export default app;
