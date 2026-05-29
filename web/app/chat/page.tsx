'use client';
import { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AnswerBubble from '../../components/AnswerBubble';
import SkeletonLoader from '../../components/SkeletonLoader';
import { askQuestion, detectLanguage, GeminiResponse } from '../../lib/api';

interface Message {
  id: string;
  type: 'user' | 'answer' | 'error';
  text?: string;
  response?: GeminiResponse;
}

function ChatContent() {
  const searchParams = useSearchParams();
  const prefill = searchParams.get('prefill') || '';

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState(prefill);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem('chat_history');
    if (stored) {
      try { setMessages(JSON.parse(stored).slice(0, 40)); } catch {}
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = useCallback(async () => {
    const q = input.trim();
    if (!q || loading) return;

    const userMsg: Message = { id: Date.now().toString(), type: 'user', text: q };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const lang = detectLanguage(q);
      const response = await askQuestion(q, lang);
      const answerMsg: Message = { id: (Date.now() + 1).toString(), type: 'answer', response };
      const updated = [...newMessages, answerMsg];
      setMessages(updated);
      localStorage.setItem('chat_history', JSON.stringify(updated.slice(0, 40)));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to get answer.';
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        type: 'error',
        text: msg.includes('429') || msg.includes('Too many')
          ? 'Rate limit reached. Please wait a moment and try again.'
          : msg,
      };
      const updated = [...newMessages, errorMsg];
      setMessages(updated);
      localStorage.setItem('chat_history', JSON.stringify(updated.slice(0, 40)));
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] max-w-3xl mx-auto w-full">
      <div className="flex-1 overflow-y-auto py-4 space-y-1">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-6 pt-10">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#0d3d25] to-[#1a5c38] flex items-center justify-center mb-5 shadow-lg">
              <span className="text-[#c9a84c] text-4xl">☪</span>
            </div>
            <p className="arabic text-3xl text-[#1a5c38] mb-3 leading-loose">سبحان الله</p>
            <p className="text-gray-600 font-semibold text-base mb-1">Ask a question about the Quran or Hadith</p>
            <p className="text-gray-400 text-sm mb-6">in English or اردو میں</p>
            <div className="flex flex-wrap justify-center gap-2 max-w-sm">
              {['What is Tawakkul?', 'Rights of parents in Islam', 'Virtues of Surah Al-Fatiha'].map(q => (
                <button key={q} onClick={() => setInput(q)}
                  className="text-xs bg-white border border-[#c9a84c]/30 text-[#1a5c38] font-medium px-3 py-1.5 rounded-full hover:border-[#1a5c38] hover:bg-green-50 transition-all">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(msg => {
          if (msg.type === 'user') {
            return (
              <div key={msg.id} className="flex justify-end px-4 py-1">
                <div className="bg-gradient-to-br from-[#1a5c38] to-[#0d3d25] text-white rounded-2xl rounded-br-none px-4 py-3 max-w-xs sm:max-w-md text-sm leading-relaxed shadow-sm">
                  {msg.text}
                </div>
              </div>
            );
          }
          if (msg.type === 'error') {
            return (
              <div key={msg.id} className="px-4 py-1">
                <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl px-4 py-3 text-sm max-w-md">
                  ⚠️ {msg.text}
                </div>
              </div>
            );
          }
          if (msg.type === 'answer' && msg.response) {
            const idx = messages.findIndex(m => m.id === msg.id);
            const question = messages[idx - 1]?.text || '';
            return (
              <AnswerBubble
                key={msg.id}
                question={question}
                answer={msg.response.answer}
                quranSources={msg.response.quran_sources}
                hadithSources={msg.response.hadith_sources}
              />
            );
          }
          return null;
        })}

        {loading && <SkeletonLoader />}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-[#c9a84c]/20 bg-white/90 backdrop-blur px-4 py-3">
        <div className="flex gap-2 items-end max-w-4xl mx-auto">
          <textarea
            className="flex-1 border border-[#c9a84c]/30 rounded-2xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-[#1a5c38] focus:ring-2 focus:ring-[#1a5c38]/10 bg-[#fdf6e3]/60 max-h-32 placeholder-gray-400 transition-all"
            rows={1}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask in English or اردو میں پوچھیں..."
            maxLength={500}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="bg-gradient-to-br from-[#1a5c38] to-[#0d3d25] text-white rounded-full w-11 h-11 flex items-center justify-center disabled:opacity-40 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex-shrink-0"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
        <p className="text-center text-xs text-gray-400 mt-2">Press Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense>
      <ChatContent />
    </Suspense>
  );
}
