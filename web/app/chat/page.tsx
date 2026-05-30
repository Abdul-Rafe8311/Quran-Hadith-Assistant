'use client';
import { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AnswerBubble from '../../components/AnswerBubble';
import SkeletonLoader from '../../components/SkeletonLoader';
import { askQuestion, detectLanguage, GeminiResponse, ResponseSize } from '../../lib/api';

interface Message {
  id: string;
  type: 'user' | 'answer' | 'error';
  text?: string;
  response?: GeminiResponse;
  size?: ResponseSize;
}

const QUICK_QUESTIONS = [
  'What is Tawakkul?',
  'Rights of parents in Islam',
  'Virtues of Surah Al-Fatiha',
  'What is Zakat?',
];

const SIZE_OPTIONS: { value: ResponseSize; label: string; description: string; icon: string }[] = [
  {
    value: 'small',
    label: 'Quick',
    description: 'Short & direct — 2-4 sentences',
    icon: '⚡',
  },
  {
    value: 'medium',
    label: 'Normal',
    description: 'Balanced answer with evidence',
    icon: '📖',
  },
  {
    value: 'large',
    label: 'Detailed',
    description: 'Full explanation with Tafsir',
    icon: '🔍',
  },
];

function ChatContent() {
  const searchParams = useSearchParams();
  const prefill = searchParams.get('prefill') || '';

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState(prefill);
  const [loading, setLoading] = useState(false);
  const [responseSize, setResponseSize] = useState<ResponseSize>('medium');
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem('chat_history');
    if (stored) {
      try { setMessages(JSON.parse(stored).slice(0, 40)); } catch {}
    }
    const settings = localStorage.getItem('settings');
    if (settings) {
      try {
        const s = JSON.parse(settings);
        if (s.responseSize) setResponseSize(s.responseSize);
      } catch {}
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = `${Math.min(ta.scrollHeight, 128)}px`;
    }
  }, [input]);

  const sendMessage = useCallback(async () => {
    const q = input.trim();
    if (!q || loading) return;

    const userMsg: Message = { id: Date.now().toString(), type: 'user', text: q, size: responseSize };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const lang = detectLanguage(q);
      const response = await askQuestion(q, lang, responseSize);
      const answerMsg: Message = { id: (Date.now() + 1).toString(), type: 'answer', response, size: responseSize };
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
  }, [input, loading, messages, responseSize]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const activeSizeOption = SIZE_OPTIONS.find(o => o.value === responseSize)!;

  return (
    <div className="flex flex-col h-[calc(100vh-52px)] max-w-3xl mx-auto w-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto py-5 space-y-1">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            {/* Icon */}
            <div className="relative mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#0d3d25] to-[#1a5c38] flex items-center justify-center shadow-xl shadow-[#0d3d25]/30">
                <svg viewBox="0 0 40 40" width="32" height="32" fill="none">
                  <path d="M20 4C20 4 30 12 30 22C30 27.5 25.5 32 20 32C14.5 32 10 27.5 10 22C10 16.5 14.5 12 20 12" stroke="#c9a84c" strokeWidth="2.5" strokeLinecap="round"/>
                  <circle cx="32" cy="8" r="3.5" fill="#c9a84c"/>
                  <path d="M23 16 L26 13 L34 21 L26 29 L23 26 L28 21 Z" fill="#c9a84c" opacity="0.4"/>
                </svg>
              </div>
              <div className="absolute inset-0 rounded-full border-2 border-[#c9a84c]/20 animate-ping" style={{ animationDuration: '3s' }} />
            </div>

            <p className="arabic text-4xl text-[#1a5c38] mb-3 leading-loose">سبحان الله</p>
            <p className="text-gray-700 font-semibold text-base mb-1">Got a question about Islam?</p>
            <p className="text-gray-400 text-sm mb-2">Ask anything — in English or <span className="font-medium">اردو میں</span></p>
            <p className="text-xs text-[#1a5c38]/60 mb-7">Answers from Quran & authentic Hadith, explained simply</p>

            {/* Quick question chips */}
            <div className="flex flex-wrap justify-center gap-2 max-w-md">
              {QUICK_QUESTIONS.map(q => (
                <button
                  key={q}
                  onClick={() => setInput(q)}
                  className="text-xs bg-white border border-[#c9a84c]/25 text-[#1a5c38] font-medium px-4 py-2 rounded-full hover:border-[#1a5c38]/50 hover:bg-green-50 hover:-translate-y-0.5 transition-all duration-200 shadow-sm"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(msg => {
          if (msg.type === 'user') {
            const sizeOpt = SIZE_OPTIONS.find(o => o.value === msg.size);
            return (
              <div key={msg.id} className="flex justify-end px-4 py-1.5 fade-in">
                <div className="flex flex-col items-end gap-1">
                  {sizeOpt && (
                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                      {sizeOpt.icon} {sizeOpt.label} response
                    </span>
                  )}
                  <div className="bg-gradient-to-br from-[#1a5c38] to-[#0d3d25] text-white rounded-2xl rounded-br-sm px-4 py-3 max-w-xs sm:max-w-md text-sm leading-relaxed shadow-md shadow-[#0d3d25]/20">
                    {msg.text}
                  </div>
                </div>
              </div>
            );
          }
          if (msg.type === 'error') {
            return (
              <div key={msg.id} className="px-4 py-1.5 fade-in">
                <div className="flex items-start gap-3 bg-red-50 border border-red-200/80 text-red-800 rounded-xl px-4 py-3 text-sm max-w-md">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 shrink-0">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {msg.text}
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

      {/* Input bar */}
      <div className="border-t border-[#c9a84c]/15 bg-white/95 backdrop-blur-md">
        {/* Response size selector */}
        <div className="flex items-center gap-1.5 px-4 pt-3 pb-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider shrink-0 mr-1">Response size:</span>
          {SIZE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => {
                setResponseSize(opt.value);
                try {
                  const s = JSON.parse(localStorage.getItem('settings') || '{}');
                  localStorage.setItem('settings', JSON.stringify({ ...s, responseSize: opt.value }));
                } catch {}
              }}
              title={opt.description}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${
                responseSize === opt.value
                  ? 'bg-[#0d3d25] text-white border-[#0d3d25] shadow-sm'
                  : 'text-gray-500 border-gray-200 hover:border-[#c9a84c]/50 hover:bg-[#fdf6e3]/60'
              }`}
            >
              <span>{opt.icon}</span>
              {opt.label}
            </button>
          ))}
          <span className="ml-auto text-[10px] text-gray-400 hidden sm:block">{activeSizeOption.description}</span>
        </div>

        {/* Text input */}
        <div className="flex gap-2.5 items-end px-4 pb-3">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              className="w-full border border-[#c9a84c]/25 rounded-2xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-[#1a5c38]/60 focus:ring-2 focus:ring-[#1a5c38]/10 bg-[#fdf6e3]/50 max-h-32 placeholder-gray-400 transition-all duration-200 shadow-sm"
              rows={1}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask in English or اردو میں پوچھیں..."
              maxLength={500}
            />
            {input.length > 400 && (
              <span className="absolute bottom-3 right-3 text-[10px] text-gray-400">{input.length}/500</span>
            )}
          </div>
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="bg-gradient-to-br from-[#1a5c38] to-[#0d3d25] text-white rounded-full w-11 h-11 flex items-center justify-center disabled:opacity-35 hover:shadow-lg hover:shadow-[#0d3d25]/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex-shrink-0 shadow-md"
          >
            {loading
              ? <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
              : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
            }
          </button>
        </div>
        <p className="text-center text-[10px] text-gray-400 pb-2">Enter to send · Shift+Enter for new line</p>
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
