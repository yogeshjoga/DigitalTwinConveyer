import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { v4 as uuid } from 'uuid';
import { belts } from '../store/inMemory';

const router = Router();

router.get('/', (_req, res) => {
  res.json(belts);
});

router.get('/:id', param('id').isUUID(), (req, res) => {
  const belt = belts.find((b) => b.id === req.params.id);
  if (!belt) return res.status(404).json({ error: 'Belt not found' });
  res.json(belt);
});

const beltValidation = [
  body('name').isString().trim().notEmpty(),
  body('width').isFloat({ min: 200, max: 3000 }),
  body('thickness').isFloat({ min: 5, max: 50 }),
  body('length').isFloat({ min: 5, max: 500 }),
  body('speed').isFloat({ min: 1, max: 6 }),
  body('materialType').isString().notEmpty(),
  body('tensileStrength').isFloat({ min: 100, max: 5000 }),
  body('hardness').isFloat({ min: 30, max: 100 }),
  body('elasticModulus').isFloat({ min: 0.001, max: 10 }),
];

router.post('/', beltValidation, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const belt = { id: uuid(), createdAt: new Date().toISOString(), ...req.body };
  belts.push(belt);
  res.status(201).json(belt);
});

router.put('/:id', param('id').isUUID(), beltValidation, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const idx = belts.findIndex((b) => b.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Belt not found' });

  belts[idx] = { ...belts[idx], ...req.body };
  res.json(belts[idx]);
});

router.delete('/:id', param('id').isUUID(), (req, res) => {
  const idx = belts.findIndex((b) => b.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Belt not found' });
  belts.splice(idx, 1);
  res.status(204).send();
});

export default router;
