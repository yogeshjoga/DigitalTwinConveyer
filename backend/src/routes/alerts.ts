import { Router } from 'express';
import { param } from 'express-validator';
import { alerts } from '../store/inMemory';

const router = Router();

router.get('/', (_req, res) => {
  res.json(alerts.slice(0, 100));
});

router.patch(
  '/:id/acknowledge',
  param('id').isUUID(),
  (req, res) => {
    const alert = alerts.find((a) => a.id === req.params.id);
    if (!alert) return res.status(404).json({ error: 'Alert not found' });
    alert.acknowledged = true;
    res.json(alert);
  }
);

export default router;
