import { Router } from 'express';
import { sensorHistory } from '../store/inMemory';

const router = Router();

const G = 9.81; // m/s²

router.get('/live', (_req, res) => {
  const latest = sensorHistory[sensorHistory.length - 1];
  if (!latest) return res.status(503).json({ error: 'No sensor data yet' });

  // Physics calculations
  const dropHeight     = 2.5;  // m — configurable per chute
  const impactVelocity = Math.sqrt(2 * G * dropHeight);
  const massFlowRate   = latest.loadCell * latest.beltSpeed;
  const depositionRate = massFlowRate / (1.2 * 1.0); // per m² (width × depth)
  const peakStress     = (latest.loadCell * G) / (1200 * 20); // N/mm²

  res.json({
    timestamp:    latest.timestamp,
    pointLoad:    latest.impactForce,
    udl:          latest.udl,
    peakStress:   peakStress * 1000, // MPa
    impactVelocity,
    dropHeight,
    massFlowRate,
    depositionRate,
  });
});

export default router;
