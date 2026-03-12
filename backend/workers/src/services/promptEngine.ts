/**
 * Two-step prompt pipeline:
 * 1. Claude Haiku extracts a vivid visual scene from the dream text
 * 2. Style anchors are appended for fal.ai
 *
 * The extracted visual prompt is cached so regeneration is cheaper.
 */
import Anthropic from '@anthropic-ai/sdk';
import { IMAGE_EXTRACTION_SYSTEM_PROMPT } from '../constants/prompts';

const STYLE_ANCHORS =
  'dreamlike, surreal, ethereal glow, soft focus edges, painterly impressionism, ' +
  'cinematic lighting, deep space cosmic background, aurora colors, 8k resolution, ' +
  'ultra detailed, atmospheric mist';

// Simple in-memory cache per Worker instance (short-lived, that's fine)
const promptCache = new Map<string, string>();

export async function buildImagePrompt(dreamText: string, apiKey: string): Promise<string> {
  const cacheKey = dreamText.slice(0, 100); // Use first 100 chars as key
  if (promptCache.has(cacheKey)) {
    return promptCache.get(cacheKey)!;
  }

  const client = new Anthropic({ apiKey });

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 150,
    system: IMAGE_EXTRACTION_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: dreamText }],
  });

  const extracted = message.content[0].type === 'text' ? message.content[0].text.trim() : '';
  const fullPrompt = `${extracted}, ${STYLE_ANCHORS}`;

  promptCache.set(cacheKey, fullPrompt);
  if (promptCache.size > 100) {
    // Evict oldest entry
    promptCache.delete(promptCache.keys().next().value);
  }

  return fullPrompt;
}
