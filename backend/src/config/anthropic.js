import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn('Warning: Missing ANTHROPIC_API_KEY environment variable');
}

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export const CLAUDE_MODEL = 'claude-sonnet-4-20250514';
export const MAX_TOKENS = 4096;

export default anthropic;