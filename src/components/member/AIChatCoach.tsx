'use client';

import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/lib/context/language-context';
import { getCoachResponse, type MemberContext } from '@/lib/ai-coach/responses';
import { X, Send, Bot, Sparkles } from 'lucide-react';
import { db } from '@/lib/db/dexie-db';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIChatCoachProps {
  memberId?: number;
  memberName: string;
  memberGoal?: string;
  memberLevel?: string;
  sessionsLeft?: number;
}

export function AIChatCoach({ memberId, memberName, memberGoal, memberLevel, sessionsLeft }: AIChatCoachProps) {
  const { t, lang } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const memberCtx: MemberContext = {
    firstName: memberName,
    fitnessGoal: memberGoal,
    experienceLevel: memberLevel,
    sessionsLeft,
  };

  const quickReplies = lang === 'ar'
    ? [
        { label: '💪 تمارين الصدر', value: 'تمارين الصدر' },
        { label: '💪 الظهر', value: 'الظهر' },
        { label: '🍎 تغذية', value: 'تغذية' },
        { label: '🏠 المنزل', value: 'المنزل' },
        { label: '🎯 الهدف', value: 'الهدف' },
      ]
    : [
        { label: '💪 Poitrine', value: 'pectoraux' },
        { label: '💪 Dos', value: 'dos' },
        { label: '🍎 Nutrition', value: 'nutrition' },
        { label: '🏠 Maison', value: 'maison' },
        { label: '🎯 Objectif', value: 'objectif' },
      ];

  useEffect(() => {
    const msg = lang === 'ar'
      ? `مرحباً ${memberName}! 👋\n\nأنا مدربك الذكي Infinity Gym!\n\nيمكنني مساعدتك في:\n• 💪 التمارين والبرامج\n• 🏠 التمرين في المنزل\n• 🍎 التغذية والنظام\n• 🎯 تحقيق أهدافك\n\nلديك ${sessionsLeft || 0} حصة متبقية هذا الأسبوع.\n\nلا تتردد في طرح أسئلتك!`
      : `Salut ${memberName}! 👋\n\nJe suis ton Coach AI personnel Infinity Gym!\n\nJe peux t'aider avec :\n• 💪 Exercices et programmes\n• 🏠 Entraînement à la maison\n• 🍎 Nutrition et régime\n• 🎯 Atteindre tes objectifs\n\nTu as ${sessionsLeft || 0} sessions restantes cette semaine.\n\nN'hésite pas à me poser des questions!`;

    const initialMsg: Message = { id: '1', role: 'assistant', content: msg, timestamp: new Date() };
    setMessages([initialMsg]);
  }, [memberName, sessionsLeft, lang]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    const topicMap: Record<string, string> = {
      'pectoraux': 'Exercices', 'poitrine': 'Exercices', 'dos': 'Exercices', 'jambes': 'Exercices',
      'epaules': 'Exercices', 'biceps': 'Exercices', 'triceps': 'Exercices', 'abdos': 'Exercices',
      'nutrition': 'Nutrition', 'manger': 'Nutrition', 'proteine': 'Nutrition', 'repas': 'Nutrition',
      'maison': 'Maison', 'domicile': 'Maison', 'sans materiel': 'Maison',
      'objectif': 'Objectif', 'motivation': 'Motivation', 'progression': 'Objectif',
      'etirement': 'Recuperation', 'recuperation': 'Recuperation', 'repos': 'Recuperation',
      'cardio': 'Cardio', 'course': 'Cardio', 'endurance': 'Cardio',
    };
    const lowerMsg = messageText.toLowerCase();
    let detectedTopic = 'General';
    for (const [keyword, topic] of Object.entries(topicMap)) {
      if (lowerMsg.includes(keyword)) { detectedTopic = topic; break; }
    }

    setTimeout(async () => {
      const response = getCoachResponse(messageText, memberCtx, lang);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);

      if (memberId) {
        try {
          await db.aiChatLogs.add({
            memberId,
            memberName,
            topic: detectedTopic,
            query: messageText,
            timestamp: new Date(),
          });
        } catch (e) {
          // Silently fail if DB not ready
        }
      }

      setIsTyping(false);
    }, 600 + Math.random() * 600);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full shadow-2xl shadow-orange-500/30 flex items-center justify-center hover:scale-110 transition-transform"
      >
        <Sparkles className="w-8 h-8 text-white" />
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[380px] h-[550px] bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold">AI Coach</h3>
                <p className="text-white/70 text-xs">
                  {lang === 'ar' ? 'مساعد اللياقة الذكي' : 'Assistant Fitness Personnel'}
                </p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-4 py-2 bg-gray-800/50 flex gap-2 overflow-x-auto">
            {quickReplies.map((reply) => (
              <button
                key={reply.value}
                onClick={() => handleSend(reply.value)}
                className="px-3 py-1.5 bg-gray-700 hover:bg-orange-500/50 text-xs text-white rounded-full whitespace-nowrap transition-colors"
              >
                {reply.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl p-3 ${
                  msg.role === 'user' ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-100'
                }`}>
                  <div className="flex items-start gap-2">
                    {msg.role === 'assistant' && <Bot className="w-4 h-4 text-orange-400 mt-1 shrink-0" />}
                    <p className="text-sm whitespace-pre-line leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-800 rounded-2xl p-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                    <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-gray-800">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={lang === 'ar' ? 'اسأل عن التمارين، التغذية...' : 'Question sur fitness, nutrition...'}
                className="flex-1 bg-gray-800 border border-gray-700 rounded-full px-4 py-2 text-white text-sm focus:outline-none focus:border-orange-500"
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isTyping}
                className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white hover:bg-orange-600 disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
