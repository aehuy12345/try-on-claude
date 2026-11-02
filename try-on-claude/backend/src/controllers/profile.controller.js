import { parseProfileInput } from '../validators/profile.validator.js';
import * as profileService from '../services/profile.service.js';

export async function getProfile(req, res) {
  const profile = await profileService.getProfile(req.userId);
  res.status(200).json(profile);
}

export async function updateProfile(req, res) {
  const input = parseProfileInput(req.body, req.file);
  const profile = await profileService.updateProfile(req.userId, input);
  res.status(200).json(profile);
}
