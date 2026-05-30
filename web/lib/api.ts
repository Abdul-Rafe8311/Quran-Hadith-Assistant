export interface GeminiResponse {
  answer: string;
  quran_sources: {
    surah_name: string;
    chapter: number;
    verse: number;
    text: string;
    arabic_text?: string;
  }[];
  hadith_sources: {
    book: string;
    number: string | number;
    text: string;
  }[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export type ResponseSize = 'small' | 'medium' | 'large';

export async function askQuestion(question: string, language: 'en' | 'ur' = 'en', responseSize: ResponseSize = 'medium'): Promise<GeminiResponse> {
  const res = await fetch(`${API_URL}/api/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, language, responseSize }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to get answer');
  return data;
}

export function detectLanguage(text: string): 'en' | 'ur' {
  return /[؀-ۿݐ-ݿ]/.test(text) ? 'ur' : 'en';
}
