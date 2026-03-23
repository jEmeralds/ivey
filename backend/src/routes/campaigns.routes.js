import express from 'express';
import { auth as authenticateToken } from '../middleware/auth.middleware.js';
import {
  getCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  generateIdeas,
  generateMarketingStrategy,
  generateVisual,
  generateCaption,
  generateVideoScript,
} from '../controllers/campaign.controller.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/',                        getCampaigns);
router.get('/:id',                     getCampaignById);
router.post('/',                       createCampaign);
router.put('/:id',                     updateCampaign);
router.delete('/:id',                  deleteCampaign);
router.post('/:id/generate',           generateIdeas);
router.post('/:id/generate-strategy',  generateMarketingStrategy);
router.post('/:id/generate-visual',    generateVisual);
router.post('/:id/caption',            generateCaption);
router.post('/:id/generate-script',    generateVideoScript);  // ← video script

export default router;