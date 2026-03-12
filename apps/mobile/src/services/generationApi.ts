/**
 * Client-side API calls to the Cloudflare Worker.
 * The Worker handles: JWT validation, tier checks, prompt engineering, and fal.ai dispatch.
 */
import { supabase } from './supabase';

const WORKER_URL = process.env.EXPO_PUBLIC_WORKER_URL ?? '';

async function getAuthHeaders(isAnonymous = false): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (!isAnonymous) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
  }
  return headers;
}

async function generateImage(
  dreamText: string,
  options: { isAnonymous?: boolean; entryId?: string } = {}
): Promise<string> {
  const headers = await getAuthHeaders(options.isAnonymous);

  const res = await fetch(`${WORKER_URL}/api/generate-image`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      dreamText,
      entryId: options.entryId ?? null,
      isAnonymous: options.isAnonymous ?? false,
    }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message ?? `Generation failed: ${res.status}`);
  }

  const data = await res.json();
  return data.imageUrl as string;
}

async function interpretDream(dreamText: string, entryId: string): Promise<string> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${WORKER_URL}/api/interpret-dream`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ dreamText, entryId }),
  });
  if (!res.ok) throw new Error('Interpretation failed');
  const data = await res.json();
  return data.interpretation as string;
}

async function generateManifestation(dreamText: string, entryId: string): Promise<string> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${WORKER_URL}/api/manifestation`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ dreamText, entryId }),
  });
  if (!res.ok) throw new Error('Manifestation failed');
  const data = await res.json();
  return data.manifestation as string;
}

async function requestDreamVideo(entryId: string, imageUrls: string[]): Promise<string> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${WORKER_URL}/api/generate-video`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ entryId, imageUrls }),
  });
  if (!res.ok) throw new Error('Video request failed');
  const data = await res.json();
  return data.jobId as string;
}

export const generationApi = {
  generateImage,
  interpretDream,
  generateManifestation,
  requestDreamVideo,
};
