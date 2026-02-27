import express from 'express';
import {
  saveContent,
  getSavedContent,
  deleteSavedContent,
  createShareLink,
  getShareLinks,
  deactivateShareLink,
  getSharedContent
} from '../controllers/save.controller.js';
import { auth } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public route - no auth needed
router.get('/shared/:token', getSharedContent);

// Protected routes
router.use(auth);

router.post('/save', saveContent);
router.get('/saved', getSavedContent);
router.delete('/saved/:id', deleteSavedContent);

router.post('/share', createShareLink);
router.get('/shares', getShareLinks);
router.patch('/share/:token/deactivate', deactivateShareLink);

export default router;