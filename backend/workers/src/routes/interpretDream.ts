import type { Context } from 'hono';
import type { Env } from '../index';
import Anthropic from '@anthropic-ai/sdk';
import { DREAM_READING_SYSTEM_PROMPT } from '../constants/prompts';

export async function interpretDream(c: Context<{ Bindings: Env }>) {
  const userId = c.get('userId') as string | null;
  if (!userId) return c.json({ error: 'Authentication required' }, 401);

  const body = await c.req.json<{ dreamText: string; entryId: string }>();
  if (!body.dreamText) return c.json({ error: 'Missing dreamText' }, 400);

  try {
    const client = new Anthropic({ apiKey: c.env.ANTHROPIC_API_KEY });

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system: DREAM_READING_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: body.dreamText }],
    });

    const interpretation =
      message.content[0].type === 'text' ? message.content[0].text.trim() : '';

    // Save to Supabase
    await fetch(`${c.env.SUPABASE_URL}/rest/v1/dream_generations`, {
      method: 'POST',
      headers: {
        'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        user_id: userId,
        entry_id: body.entryId,
        type: 'interpretation',
        media_url: null,
        prompt_used: body.dreamText.slice(0, 500),
        is_saved: true,
      }),
    });

    return c.json({ interpretation });
  } catch (err: any) {
    console.error('interpretDream error:', err);
    return c.json({ error: 'Interpretation failed' }, 500);
  }
}
