import { Router } from 'express';
import { sensorHistory, alerts, thermalZones } from '../store/inMemory';

const router = Router();

router.get('/summary', (_req, res) => {
  const latest = sensorHistory[sensorHistory.length - 1];
  const activeAlerts   = alerts.filter((a) => !a.acknowledged);
  const criticalAlerts = activeAlerts.filter((a) => a.severity === 'critical');

  // Compute belt health (0–100) from multiple factors
  const loadScore    = latest ? Math.max(0, 100 - (latest.loadCell / 600) * 100) : 100;
  const tempScore    = latest ? Math.max(0, 100 - ((latest.temperature - 20) / 100) * 100) : 100;
  const vibScore     = latest ? Math.max(0, 100 - (latest.vibration / 20) * 100) : 100;
  const alertPenalty = Math.min(criticalAlerts.length * 10, 40);
  const beltHealth   = Math.round(((loadScore + tempScore + vibScore) / 3) - alertPenalty);

  // Estimated remaining life (simplified)
  const remainingLifeHours = Math.max(0, beltHealth * 20);

  res.json({
    beltHealth:          Math.max(0, Math.min(100, beltHealth)),
    activeAlerts:        activeAlerts.length,
    criticalAlerts:      criticalAlerts.length,
    remainingLifeHours,
    currentLoad:         latest?.udl ?? 0,
    beltSpeed:           latest?.beltSpeed ?? 0,
    temperature:         latest?.temperature ?? 0,
    tearProbability:     Math.max(0, (100 - beltHealth) / 100),
    uptime:              Math.floor(process.uptime() / 3600),
    lastInspection:      new Date(Date.now() - 86400000 * 3).toISOString(),
  });
});

export default router;
