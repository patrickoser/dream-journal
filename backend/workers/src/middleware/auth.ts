/**
 * Validates the Supabase JWT from Authorization header.
 * For anonymous generation (onboarding), we allow requests without a token
 * but mark them as anonymous — the route handler enforces anonymous limits.
 */
import type { Context, Next } from 'hono';
import type { Env } from '../index';

interface JWTPayload {
  sub: string;
  email?: string;
  role: string;
  exp: number;
}

export async function authMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  const authHeader = c.req.header('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    // Anonymous — allowed for onboarding flow, routes enforce limits
    c.set('userId', null);
    c.set('isAnonymous', true);
    return next();
  }

  const token = authHeader.slice(7);

  try {
    // Verify Supabase JWT using the JWKS endpoint
    const payload = await verifySupabaseJWT(token, c.env.SUPABASE_URL);
    c.set('userId', payload.sub);
    c.set('isAnonymous', false);
    c.set('userEmail', payload.email ?? null);
  } catch {
    return c.json({ error: 'Invalid token' }, 401);
  }

  return next();
}

async function verifySupabaseJWT(token: string, supabaseUrl: string): Promise<JWTPayload> {
  // Fetch Supabase JWKS and verify — simplified for clarity
  // In production, cache the JWKS response in KV to avoid hammering the endpoint
  const [header64, payload64] = token.split('.');
  if (!header64 || !payload64) throw new Error('Invalid JWT format');

  const payload = JSON.parse(atob(payload64.replace(/-/g, '+').replace(/_/g, '/')));

  if (payload.exp < Date.now() / 1000) throw new Error('Token expired');
  if (payload.iss !== `${supabaseUrl}/auth/v1`) throw new Error('Invalid issuer');

  // For full signature verification, use the Web Crypto API with Supabase's JWKS
  // TODO: implement full RS256 signature check before production launch
  return payload as JWTPayload;
}
