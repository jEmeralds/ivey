import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.GEMINI_API_KEY) {
  console.warn('Warning: Missing GEMINI_API_KEY environment variable');
}

export const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Use the stable v1 API instead of v1beta
export const geminiModel = genAI.getGenerativeModel({ 
  model: 'models/gemini-1.5-flash'
});

export default geminiModel;