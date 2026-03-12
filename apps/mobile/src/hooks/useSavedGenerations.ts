import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase';

export interface SavedImage {
  id: string;
  mediaUrl: string;
  entryId: string;
  createdAt: string;
}

async function fetchSavedImages(): Promise<SavedImage[]> {
  const { data, error } = await supabase
    .from('dream_generations')
    .select('id, media_url, entry_id, created_at')
    .eq('type', 'image')
    .eq('is_saved', true)
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    id: row.id,
    mediaUrl: row.media_url,
    entryId: row.entry_id,
    createdAt: row.created_at,
  }));
}

export function useSavedGenerations() {
  const { data, isLoading } = useQuery({
    queryKey: ['saved-images'],
    queryFn: fetchSavedImages,
    staleTime: 1000 * 60 * 2,
  });

  return {
    images: data ?? [],
    isLoading,
  };
}
