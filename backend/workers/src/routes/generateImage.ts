import type { Context } from 'hono';
import type { Env } from '../index';
import { buildImagePrompt } from '../services/promptEngine';

const FALAI_IMAGE_ENDPOINT = 'https://fal.run/fal-ai/flux/schnell';

export async function generateImage(c: Context<{ Bindings: Env }>) {
  const body = await c.req.json<{
    dreamText: string;
    entryId: string | null;
    isAnonymous: boolean;
  }>();

  if (!body.dreamText || body.dreamText.trim().length < 10) {
    return c.json({ error: 'Dream text too short' }, 400);
  }

  try {
    // Step 1: Build optimized visual prompt via Claude Haiku
    const imagePrompt = await buildImagePrompt(body.dreamText, c.env.ANTHROPIC_API_KEY);

    // Step 2: Generate image via fal.ai FLUX
    const falRes = await fetch(FALAI_IMAGE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${c.env.FALAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: imagePrompt,
        image_size: 'portrait_4_3',
        num_inference_steps: 4,  // FLUX schnell is fast with 4 steps
        num_images: 1,
        enable_safety_checker: true,
      }),
    });

    if (!falRes.ok) {
      const err = await falRes.text();
      console.error('fal.ai error:', err);
      return c.json({ error: 'Image generation service unavailable' }, 502);
    }

    const falData = await falRes.json() as { images: Array<{ url: string }> };
    const imageUrl = falData.images?.[0]?.url;

    if (!imageUrl) {
      return c.json({ error: 'No image returned from generation service' }, 502);
    }

    // Step 3: Log to Supabase if authenticated
    const userId = c.get('userId') as string | null;
    if (userId && body.entryId) {
      await logGenerationToSupabase({
        userId,
        entryId: body.entryId,
        promptUsed: imagePrompt,
        mediaUrl: imageUrl,
        supabaseUrl: c.env.SUPABASE_URL,
        serviceRoleKey: c.env.SUPABASE_SERVICE_ROLE_KEY,
      });
    }

    return c.json({ imageUrl, promptUsed: imagePrompt });
  } catch (err: any) {
    console.error('generateImage error:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
}

async function logGenerationToSupabase(params: {
  userId: string;
  entryId: string;
  promptUsed: string;
  mediaUrl: string;
  supabaseUrl: string;
  serviceRoleKey: string;
}) {
  await fetch(`${params.supabaseUrl}/rest/v1/dream_generations`, {
    method: 'POST',
    headers: {
      'apikey': params.serviceRoleKey,
      'Authorization': `Bearer ${params.serviceRoleKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({
      user_id: params.userId,
      entry_id: params.entryId,
      type: 'image',
      prompt_used: params.promptUsed,
      media_url: params.mediaUrl,
      is_saved: false,
    }),
  });
}
