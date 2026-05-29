import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(url, key);

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
}

export interface HadithSource {
  book: string;
  number: string | number;
  text: string;
}
