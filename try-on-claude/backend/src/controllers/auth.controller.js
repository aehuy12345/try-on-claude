import { parseLoginInput, parseRegisterInput } from '../validators/auth.validator.js';
import * as authService from '../services/auth.service.js';

export async function register(req, res) {
  const input = parseRegisterInput(req.body);
  const result = await authService.register(input);
  res.set('Cache-Control', 'no-store');
  res.status(201).json(result);
}

export async function login(req, res) {
  const input = parseLoginInput(req.body);
  const result = await authService.login(input);
  res.set('Cache-Control', 'no-store');
  res.status(200).json(result);
}
