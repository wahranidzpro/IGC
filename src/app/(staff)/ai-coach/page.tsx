'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/auth/context';
import { useLanguage } from '@/lib/context/language-context';
import { getCoachResponse, getInitialCoachMessage, type MemberContext } from '@/lib/ai-coach/responses';
import { Bot, Send } from 'lucide-react';

interface Message {
  role: 'coach' | 'user';
  content: string;
}

export default function AICoachPage() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const memberCtx: MemberContext | undefined = user && 'firstName' in user ? {
    firstName: user.firstName || '',
    fitnessGoal: (user as { username?: string; fitnessGoal?: string; experienceLevel?: string; sessionsLeft?: number }).fitnessGoal,
    experienceLevel: (user as { username?: string; fitnessGoal?: string; experienceLevel?: string; sessionsLeft?: number }).experienceLevel,
    sessionsLeft: (user as { username?: string; fitnessGoal?: string; experienceLevel?: string; sessionsLeft?: number }).sessionsLeft,
  } : undefined;

  const initial = getInitialCoachMessage(memberCtx);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'coach', content: lang === 'ar' ? initial.ar : initial.fr },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setInput('');
    setIsTyping(true);
    setTimeout(() => {
      const reply = getCoachResponse(text, memberCtx);
      setMessages(prev => [...prev, { role: 'coach', content: reply }]);
      setIsTyping(false);
    }, 600 + Math.random() * 400);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0" dir="ltr">
      {/* Header Telegram */}
      <div className="flex items-center gap-3 px-4 py-3 border-b flex-shrink-0" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20 flex-shrink-0">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <h1 className="text-base font-semibold truncate" style={{ color: 'var(--text)' }}>Coach IA</h1>
          <p className="text-[11px] text-green-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
            en ligne
          </p>
        </div>
      </div>

      {/* Messages - style Telegram */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1.5" style={{ background: 'var(--background)' }}>
        {messages.map((msg, i) => {
          const isUser = msg.role === 'user';
          const isConsecutive = i > 0 && messages[i - 1].role === msg.role;
          return (
            <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[78%] px-3.5 py-2 text-[15px] leading-relaxed whitespace-pre-line break-words ${
                  isUser
                    ? 'rounded-[18px] rounded-br-[6px] text-white'
                    : 'rounded-[18px] rounded-bl-[6px]'
                } ${isConsecutive ? (isUser ? 'rounded-tr-[6px]' : 'rounded-tl-[6px]') : ''}`}
                style={{
                  background: isUser ? 'var(--primary)' : 'var(--surface)',
                  color: isUser ? '#fff' : 'var(--text)',
                  border: !isUser ? '1px solid var(--border)' : 'none',
                }}
              >
                {msg.content}
              </div>
            </div>
          );
        })}
        {isTyping && (
          <div className="flex justify-start">
            <div className="rounded-[18px] rounded-bl-[6px] px-4 py-3 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input - style Telegram */}
      <div className="px-3 py-2 border-t flex-shrink-0" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message..."
              className="w-full px-4 py-2.5 rounded-2xl text-[15px] outline-none transition-all"
              style={{
                background: 'rgba(255,255,255,0.07)',
                color: 'var(--text)',
                border: '1px solid transparent',
              }}
              onFocus={e => { e.target.style.borderColor = 'var(--primary)'; }}
              onBlur={e => { e.target.style.borderColor = 'transparent'; }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="w-10 h-10 rounded-full bg-orange-500 hover:bg-orange-600 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all cursor-pointer flex-shrink-0"
          >
            <Send className="w-[18px] h-[18px] text-white ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
