import express from 'express';
import { uploadMedia, getCampaignMedia, deleteMedia, upload } from '../controllers/media.controller.js';
import { auth } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(auth);

// Upload media (with multer middleware)
router.post('/upload', upload.single('file'), uploadMedia);

// Get all media for a campaign
router.get('/campaign/:campaignId', getCampaignMedia);

// Delete media
router.delete('/:id', deleteMedia);

export default router;