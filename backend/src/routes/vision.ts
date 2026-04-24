import { Router } from 'express';
import { visionDetections } from '../store/inMemory';

const router = Router();

router.get('/detections', (_req, res) => {
  res.json(visionDetections.slice(0, 20));
});

export default router;
