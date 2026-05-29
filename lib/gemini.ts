export interface GeminiResponse {
  answer: string;
  quran_sources: QuranSource[];
  hadith_sources: HadithSource[];
  language: 'en' | 'ur';
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

export async function askQuestion(
  question: string,
  language: 'en' | 'ur' = 'en'
): Promise<GeminiResponse> {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
  const response = await fetch(`${apiUrl}/api/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, language }),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Server error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  return response.json();
}
