import { anthropic, CLAUDE_MODEL } from '../config/anthropic.js';
import { openai, GPT_MODEL } from '../config/openai.js';
import { geminiModel } from '../config/gemini.js';

// Available AI providers
export const AI_PROVIDERS = {
  CLAUDE: 'claude',
  OPENAI: 'openai',
  GEMINI: 'gemini',
};

// Generate content using selected AI provider
export const generateWithAI = async (prompt, provider = AI_PROVIDERS.CLAUDE) => {
  switch (provider) {
    case AI_PROVIDERS.OPENAI:
      return await generateWithOpenAI(prompt);
    case AI_PROVIDERS.GEMINI:
      return await generateWithGemini(prompt);
    case AI_PROVIDERS.CLAUDE:
    default:
      return await generateWithClaude(prompt);
  }
};

// Claude (Anthropic)
const generateWithClaude = async (prompt) => {
  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 4096,
    temperature: 0.9,
    messages: [{ role: 'user', content: prompt }],
  });
  return response.content[0].text;
};

// OpenAI GPT-4o
const generateWithOpenAI = async (prompt) => {
  const response = await openai.chat.completions.create({
    model: GPT_MODEL,
    max_tokens: 4096,
    temperature: 0.9,
    messages: [{ role: 'user', content: prompt }],
  });
  return response.choices[0].message.content;
};

// Google Gemini
const generateWithGemini = async (prompt) => {
  const result = await geminiModel.generateContent(prompt);
  const response = await result.response;
  return response.text();
};

// Get list of available providers
export const getAvailableProviders = () => {
  const providers = [];
  
  if (process.env.ANTHROPIC_API_KEY) {
    providers.push({ id: AI_PROVIDERS.CLAUDE, name: 'Claude (Anthropic)', available: true });
  }
  if (process.env.OPENAI_API_KEY) {
    providers.push({ id: AI_PROVIDERS.OPENAI, name: 'GPT-4o (OpenAI)', available: true });
  }
  if (process.env.GEMINI_API_KEY) {
    providers.push({ id: AI_PROVIDERS.GEMINI, name: 'Gemini (Google)', available: true });
  }
  
  return providers;
};

export default { generateWithAI, getAvailableProviders, AI_PROVIDERS };