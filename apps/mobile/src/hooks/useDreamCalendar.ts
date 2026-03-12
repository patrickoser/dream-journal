import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase';

export interface CalendarEntry {
  date: string;
  entryId: string;
  imageCount: number;
}

async function fetchCalendarEntries(): Promise<CalendarEntry[]> {
  const { data, error } = await supabase
    .from('dream_entries')
    .select(`
      id,
      dream_date,
      dream_generations(count)
    `)
    .eq('dream_generations.type', 'image')
    .eq('dream_generations.is_saved', true)
    .order('dream_date', { ascending: false })
    .limit(90);  // Last 90 days

  if (error) throw error;

  return (data ?? []).map((entry: any) => ({
    date: entry.dream_date,
    entryId: entry.id,
    imageCount: entry.dream_generations?.[0]?.count ?? 0,
  }));
}

export function useDreamCalendar() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['dream-calendar'],
    queryFn: fetchCalendarEntries,
    staleTime: 1000 * 60 * 5,
  });

  return {
    entries: data ?? [],
    isLoading,
    refetch,
  };
}
