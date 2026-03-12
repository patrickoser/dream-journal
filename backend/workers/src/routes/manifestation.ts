import type { Context } from 'hono';
import type { Env } from '../index';
import Anthropic from '@anthropic-ai/sdk';
import { MANIFESTATION_SYSTEM_PROMPT } from '../constants/prompts';

export async function manifestation(c: Context<{ Bindings: Env }>) {
  const userId = c.get('userId') as string | null;
  if (!userId) return c.json({ error: 'Authentication required' }, 401);

  const body = await c.req.json<{ dreamText: string; entryId: string }>();
  if (!body.dreamText) return c.json({ error: 'Missing dreamText' }, 400);

  try {
    const client = new Anthropic({ apiKey: c.env.ANTHROPIC_API_KEY });

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      system: MANIFESTATION_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: body.dreamText }],
    });

    const manifestationText =
      message.content[0].type === 'text' ? message.content[0].text.trim() : '';

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
        type: 'manifestation',
        media_url: null,
        prompt_used: body.dreamText.slice(0, 500),
        is_saved: true,
      }),
    });

    return c.json({ manifestation: manifestationText });
  } catch (err: any) {
    console.error('manifestation error:', err);
    return c.json({ error: 'Manifestation generation failed' }, 500);
  }
}
