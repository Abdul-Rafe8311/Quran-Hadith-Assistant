import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface IslamicKnowledge {
  id: string;
  content: string;
  source_type: 'quran' | 'hadith';
  lang: string;
  metadata: QuranMetadata | HadithMetadata;
}

export interface QuranMetadata {
  surah_number: number;
  ayah_number: number;
  surah_name: string;
  arabic_text?: string;
}

export interface HadithMetadata {
  book: string;
  hadith_number: number;
}

export interface SavedAnswer {
  id: string;
  question: string;
  answer: string;
  citations: CitationData;
  created_at: string;
}

export interface CitationData {
  quran_sources: QuranSource[];
  hadith_sources: HadithSource[];
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
  number: number;
  text: string;
}
