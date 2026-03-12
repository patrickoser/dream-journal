/**
 * KV-based rate limiting per user/IP.
 * Anonymous: 5 generations total (tracked by IP).
 * Authenticated free: 10 images/month.
 * Authenticated premium: unlimited images, 5 videos/month.
 */
import type { Context, Next } from 'hono';
import type { Env } from '../index';

const ANONYMOUS_IMAGE_LIMIT = 5;
const FREE_MONTHLY_IMAGE_LIMIT = 10;
const PREMIUM_MONTHLY_VIDEO_LIMIT = 5;

export async function rateLimitMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  const userId = c.get('userId') as string | null;
  const isAnonymous = c.get('isAnonymous') as boolean;
  const path = new URL(c.req.url).pathname;

  const isImageRoute = path === '/api/generate-image';
  const isVideoRoute = path === '/api/generate-video';

  if (isAnonymous && isImageRoute) {
    // Rate limit by CF-Connecting-IP for anonymous users
    const ip = c.req.header('CF-Connecting-IP') ?? 'unknown';
    const key = `anon:${ip}:images`;
    const current = parseInt((await c.env.RATE_LIMIT_KV.get(key)) ?? '0', 10);

    if (current >= ANONYMOUS_IMAGE_LIMIT) {
      return c.json({ error: 'Free generations exhausted. Sign up to continue.', code: 'ANON_LIMIT' }, 429);
    }

    // Increment (TTL: 30 days)
    await c.env.RATE_LIMIT_KV.put(key, String(current + 1), { expirationTtl: 60 * 60 * 24 * 30 });
    c.set('anonImageCount', current + 1);
  }

  if (!isAnonymous && userId) {
    // For authenticated users, check Supabase usage counts
    // The Supabase DB is the source of truth — Worker checks it for video limits
    if (isVideoRoute) {
      const userTier = await getUserTier(userId, c.env);
      if (userTier !== 'premium') {
        return c.json({ error: 'Video generation requires a premium subscription.', code: 'TIER_REQUIRED' }, 403);
      }
      const videoCount = await getVideoCount(userId, c.env);
      if (videoCount >= PREMIUM_MONTHLY_VIDEO_LIMIT) {
        return c.json({ error: 'Monthly video limit reached (5/month).', code: 'VIDEO_LIMIT' }, 429);
      }
    }
  }

  return next();
}

async function getUserTier(userId: string, env: Env): Promise<'free' | 'premium'> {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/users?id=eq.${userId}&select=subscription_tier`, {
    headers: {
      'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
  });
  const [user] = await res.json() as Array<{ subscription_tier: 'free' | 'premium' }>;
  return user?.subscription_tier ?? 'free';
}

async function getVideoCount(userId: string, env: Env): Promise<number> {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/dream_generations?user_id=eq.${userId}&type=eq.video&created_at=gte.${monthStart.toISOString()}&select=id`,
    {
      headers: {
        'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Prefer': 'count=exact',
      },
    }
  );
  const countHeader = res.headers.get('Content-Range');
  const total = countHeader ? parseInt(countHeader.split('/')[1] ?? '0', 10) : 0;
  return total;
}
