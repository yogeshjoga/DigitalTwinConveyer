import { Router } from 'express';
import { thermalZones } from '../store/inMemory';

const router = Router();

router.get('/zones', (_req, res) => {
  res.json(thermalZones);
});

export default router;
