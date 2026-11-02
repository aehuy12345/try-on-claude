import express, { Router } from 'express';
import { login, register } from '../controllers/auth.controller.js';

const router = Router();
// JSON is parsed only here (D20): other routes must not read a body before authentication.
router.use(express.json({ limit: '1mb' }));
router.post('/register', register);
router.post('/login', login);

export default router;
