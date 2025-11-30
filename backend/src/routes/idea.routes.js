import express from 'express';
import { auth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import * as ideaController from '../controllers/idea.controller.js';

const router = express.Router();

router.use(auth); // Changed from authenticate to auth

router.get('/campaign/:campaignId', asyncHandler(ideaController.getIdeasByCampaign));
router.get('/:id', asyncHandler(ideaController.getIdeaById));
router.post('/:id/regenerate', asyncHandler(ideaController.regenerateIdea));
router.post('/:id/track', asyncHandler(ideaController.trackAnalytics));

export default router;