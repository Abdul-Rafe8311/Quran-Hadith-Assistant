import { askQuestion, GeminiResponse } from './gemini';

export type { GeminiResponse };

export async function runRAGPipeline(
  question: string,
  language: 'en' | 'ur' = 'en'
): Promise<GeminiResponse> {
  return askQuestion(question, language);
}

export function detectLanguage(text: string): 'en' | 'ur' {
  const urduPattern = /[؀-ۿݐ-ݿ]/;
  return urduPattern.test(text) ? 'ur' : 'en';
}
