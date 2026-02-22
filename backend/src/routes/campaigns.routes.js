import express from 'express';
import { auth } from '../middleware/auth.js';
import {
  getCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  generateIdeas,
  generateMarketingStrategy
} from '../controllers/campaign.controller.js';
import { campaignValidation } from '../config/security.config.js';
import { validationResult } from 'express-validator';

const router = express.Router();

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation failed',
      details: errors.array() 
    });
  }
  next();
};

// All routes require authentication
router.use(auth);

router.get('/', getCampaigns);
router.get('/:id', getCampaignById);
router.post('/', campaignValidation, validate, createCampaign);
router.put('/:id', campaignValidation, validate, updateCampaign);
router.delete('/:id', deleteCampaign);
router.post('/:id/generate', generateIdeas);
router.post('/:id/generate-strategy', generateMarketingStrategy);

export default router;

import { body } from 'express-validator';

export const campaignValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Campaign name is required')
    .isLength({ max: 100 })
    .withMessage('Campaign name must be under 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be under 500 characters'),
];