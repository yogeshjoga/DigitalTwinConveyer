import { Router } from 'express';
import { visionDetections, alerts } from '../store/inMemory';

const router = Router();

router.get('/detections', (_req, res) => {
  res.json(visionDetections.slice(0, 20));
});

// ── Demo: clear all defect detections + related alerts ────────────────────────
router.delete('/detections', (_req, res) => {
  visionDetections.splice(0, visionDetections.length);
  // Also clear vision-related alerts so the alert count resets
  const before = alerts.length;
  const keep = alerts.filter((a) => a.type !== 'tear_risk');
  alerts.splice(0, alerts.length, ...keep);
  res.json({ cleared: true, detectionsRemoved: before - alerts.length });
});

export default router;
