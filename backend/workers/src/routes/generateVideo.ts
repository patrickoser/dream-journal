/**
 * Post-session "Weave this dream" — img2vid using saved images as reference frames.
 * This is async: we create a job record and return a jobId immediately.
 * A Supabase Edge Function polls Kling for completion and sends a push notification.
 */
import type { Context } from 'hono';
import type { Env } from '../index';

const KLING_IMG2VID_ENDPOINT = 'https://fal.run/fal-ai/kling-video/v1/standard/image-to-video';

export async function generateVideo(c: Context<{ Bindings: Env }>) {
  const userId = c.get('userId') as string | null;
  if (!userId) return c.json({ error: 'Authentication required' }, 401);

  const body = await c.req.json<{ entryId: string; imageUrls: string[] }>();

  if (!body.entryId || !body.imageUrls?.length) {
    return c.json({ error: 'Missing entryId or imageUrls' }, 400);
  }

  if (body.imageUrls.length < 1 || body.imageUrls.length > 5) {
    return c.json({ error: 'Provide 1-5 images for video generation' }, 400);
  }

  try {
    // Use the first image as the reference (Kling img2vid animates from a single reference)
    const referenceImageUrl = body.imageUrls[0];

    // Dispatch to Kling asynchronously (queue mode)
    const falRes = await fetch(KLING_IMG2VID_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${c.env.FALAI_API_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'respond-async',  // Non-blocking — returns request_id
      },
      body: JSON.stringify({
        image_url: referenceImageUrl,
        prompt: 'ethereal dream sequence, slow cinematic motion, soft light, surreal atmosphere',
        duration: '5',
        aspect_ratio: '9:16',
      }),
    });

    const falData = await falRes.json() as { request_id?: string; status?: string };
    const providerJobId = falData.request_id ?? null;

    // Create job record in Supabase
    const jobRes = await fetch(`${c.env.SUPABASE_URL}/rest/v1/generation_jobs`, {
      method: 'POST',
      headers: {
        'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        user_id: userId,
        entry_id: body.entryId,
        type: 'video',
        status: 'pending',
        provider: 'kling',
        provider_job_id: providerJobId,
      }),
    });

    const [job] = await jobRes.json() as Array<{ id: string }>;

    return c.json({ jobId: job.id, message: 'Your dream is crystallizing. We\'ll notify you when it\'s ready.' });
  } catch (err: any) {
    console.error('generateVideo error:', err);
    return c.json({ error: 'Video request failed' }, 500);
  }
}
