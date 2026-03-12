/**
 * Manages an active dream journaling session:
 * - Creates/updates the Supabase dream_entries record
 * - Handles image generation (manual button or auto on pause)
 * - Tracks saved images for the session
 * - Supports auto-generate for premium users (3s debounce)
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../services/supabase';
import { generationApi } from '../services/generationApi';
import { useAuthStore } from '../store/authStore';

const AUTO_GENERATE_DEBOUNCE_MS = 3000;

export function useDreamSession() {
  const { session } = useAuthStore();
  const [entryId, setEntryId] = useState<string | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [savedImages, setSavedImages] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAutoGenerate] = useState(false); // TODO: read from subscription store

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastGeneratedText = useRef<string>('');

  // Create a draft entry in Supabase when session starts
  useEffect(() => {
    if (!session?.user?.id) return;
    createDraftEntry(session.user.id).then(setEntryId);
  }, [session]);

  const generate = useCallback(async (text: string) => {
    if (!entryId || isGenerating || text === lastGeneratedText.current) return;
    lastGeneratedText.current = text;
    setIsGenerating(true);
    setCurrentImageUrl(null);
    try {
      const url = await generationApi.generateImage(text, { entryId });
      setCurrentImageUrl(url);
    } catch (err) {
      console.error('Generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  }, [entryId, isGenerating]);

  // Auto-generate debounce (premium only)
  const onTextChange = useCallback((text: string) => {
    if (!isAutoGenerate || text.trim().length < 30) return;
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => generate(text), AUTO_GENERATE_DEBOUNCE_MS);
  }, [isAutoGenerate, generate]);

  const save = useCallback(() => {
    if (!currentImageUrl) return;
    setSavedImages((prev) => [...prev, currentImageUrl]);
    setCurrentImageUrl(null);
    // Mark as saved in Supabase
    if (entryId) {
      supabase
        .from('dream_generations')
        .update({ is_saved: true })
        .eq('entry_id', entryId)
        .eq('media_url', currentImageUrl)
        .then(() => {});
    }
  }, [currentImageUrl, entryId]);

  const reject = useCallback(() => {
    setCurrentImageUrl(null);
  }, []);

  const finishEntry = useCallback(async (bodyText: string): Promise<boolean> => {
    if (!entryId) return false;
    const { error } = await supabase
      .from('dream_entries')
      .update({ body_text: bodyText, updated_at: new Date().toISOString() })
      .eq('id', entryId);
    return !error;
  }, [entryId]);

  return {
    entryId,
    currentImageUrl,
    savedImages,
    isGenerating,
    isAutoGenerate,
    generate,
    onTextChange,
    save,
    reject,
    finishEntry,
  };
}

async function createDraftEntry(userId: string): Promise<string | null> {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('dream_entries')
    .insert({ user_id: userId, body_text: '', dream_date: today })
    .select('id')
    .single();

  if (error) {
    console.error('Failed to create draft entry:', error);
    return null;
  }
  return data.id;
}
