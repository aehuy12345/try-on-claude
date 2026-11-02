import { Router } from 'express';
import { getProfile, updateProfile } from '../controllers/profile.controller.js';
import { requireAuth } from '../middlewares/requireAuth.js';
import { parseBodyPhotoUpload, requireMultipart } from '../middlewares/uploadBodyPhoto.js';

const router = Router();

// Profile data is private: keep it out of shared and browser caches, errors included.
router.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

router.get('/profile', requireAuth, getProfile);
router.put('/profile', requireAuth, requireMultipart, parseBodyPhotoUpload, updateProfile);

export default router;
