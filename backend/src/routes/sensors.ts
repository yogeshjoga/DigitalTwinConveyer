import { Router } from 'express';
import { sensorHistory } from '../store/inMemory';

const router = Router();

// Latest single reading
router.get('/live', (_req, res) => {
  const latest = sensorHistory[sensorHistory.length - 1];
  if (!latest) return res.status(503).json({ error: 'No sensor data yet' });
  res.json(latest);
});

// History — last N minutes
router.get('/history', (req, res) => {
  const minutes = parseInt(req.query.minutes as string ?? '30', 10);
  const cutoff  = new Date(Date.now() - minutes * 60 * 1000).toISOString();
  const data    = sensorHistory.filter((r) => r.timestamp >= cutoff);
  res.json(data);
});

export default router;
