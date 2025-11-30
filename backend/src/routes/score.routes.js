import express from 'express';
import { auth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import * as scoreController from '../controllers/score.controller.js';

const router = express.Router();

router.use(auth); // Changed from authenticate to auth

router.post('/predict', asyncHandler(scoreController.scoreIdea));
router.get('/explain/:id', asyncHandler(scoreController.explainScore));

export default router;