import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (typeof window === 'undefined') return null; // never run on server/build
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  if (!_client) _client = createClient(url, key);
  return _client;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_t, prop) {
    const client = getSupabase();
    if (!client) return () => ({ data: null, error: new Error('No Supabase client') });
    return (client as unknown as Record<string, unknown>)[prop as string];
  },
});

export interface SavedAnswer {
  id: string;
  question: string;
  answer: string;
  citations: {
    quran_sources: QuranSource[];
    hadith_sources: HadithSource[];
  };
  created_at: string;
}

export interface QuranSource {
  surah_name: string;
  chapter: number;
  verse: number;
  text: string;
  arabic_text?: string;
  explanation?: string;
}

export interface HadithSource {
  book: string;
  number: string | number;
  text: string;
  explanation?: string;
}
