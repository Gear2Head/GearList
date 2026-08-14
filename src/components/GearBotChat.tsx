import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  User,
  Clock,
  Flame,
  Film,
  Tv,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { ChatMessage, MediaItem, UserProfile } from '../types';
import { sendChatMessageAI } from '../services/api';
import { calculateTotalWatchStats } from '../utils/calculations';

interface GearBotChatProps {
  mediaItems: MediaItem[];
  userProfile: UserProfile;
  onOpenAddModal: () => void;
}

export const GearBotChat: React.FC<GearBotChatProps> = ({
  mediaItems,
  userProfile,
  onOpenAddModal,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'model',
      text: `Selam ${userProfile.displayName}! 🎬 Ben **GearBot**, sinema, anime ve seyir süresi uzmanı yapay zeka asistanınım.\n\nKütüphanendeki yapımları inceledim; sana tam zevkine uygun dizi/anime/film tavsiyesi verebilir, hafta sonu izleme maratonu planlayabilir veya kütüphanen hakkında analizler yapabilirim. Nereden başlayalım? ✨`,
      timestamp: 'Az önce',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const stats = calculateTotalWatchStats(
    mediaItems,
    userProfile.connectedAccounts?.spotify?.totalListeningMinutes || 0
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const quickPrompts = [
    '🔥 Hafta sonu 6 saatim var, hangi 12 bölümlük animeyi bitirebilirim?',
    '🧠 Christopher Nolan ve Steins;Gate tarzı beyin yakan 3 film öner',
    '⚡ Kütüphanemdeki izlenmekte olan yapımları bitirmem kaç gün sürer?',
    '🍿 Akşam arkadaşlarla izlenecek sürükleyici 1.5 saatlik bir film öner',
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      text: query.trim(),
      timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const userStatsSummary = `
Kullanıcı: ${userProfile.displayName} (Lv.${userProfile.level}, ${userProfile.rankTitle})
Toplam İzlenen Süre: ${stats.totalHours} Saat (${stats.animeMinutes / 60}s Anime, ${stats.tvMinutes / 60}s Dizi, ${stats.movieMinutes / 60}s Film, ${stats.musicMinutes / 60}s Müzik)
Kütüphanedeki Başlıklar: ${mediaItems.map((i) => `${i.title} (${i.type}, ${i.status}, Puan:${i.userRating || 'yok'})`).join(', ')}
`;

    try {
      const historyPayload = messages.concat(userMsg).map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const replyText = await sendChatMessageAI(historyPayload, userStatsSummary);

      const botMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'model',
        text: replyText,
        timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] min-h-[500px] rounded-3xl bg-[#161618] border border-white/5 shadow-2xl overflow-hidden animate-in fade-in duration-300">
      {/* Chat Header */}
      <div className="p-4 sm:p-5 border-b border-white/5 bg-[#0A0A0B]/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-blue-600 p-0.5 shadow-lg shadow-blue-950/40">
            <div className="w-full h-full bg-[#161618] rounded-[14px] flex items-center justify-center">
              <Bot className="w-5 h-5 text-blue-400" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-[#0A0A0B]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base text-white">GearBot AI</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Gemini 3.7 Flash
              </span>
            </div>
            <p className="text-xs text-gray-400">Akıllı Film, Dizi & Anime Tavsiye Motoru</p>
          </div>
        </div>

        <button
          onClick={onOpenAddModal}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 text-xs font-semibold transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-blue-400" />
          <span>Kütüphaneye Ekle</span>
        </button>
      </div>

      {/* Messages Thread Container */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map((msg) => {
          const isBot = msg.role === 'model';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isBot ? 'justify-start' : 'justify-end'}`}
            >
              {isBot && (
                <div className="w-8 h-8 rounded-xl bg-blue-600 p-0.5 shrink-0 mt-0.5">
                  <div className="w-full h-full bg-[#161618] rounded-[10px] flex items-center justify-center">
                    <Bot className="w-4 h-4 text-blue-400" />
                  </div>
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-lg ${
                  isBot
                    ? 'bg-[#0D0D0E] border border-white/5 text-gray-200'
                    : 'bg-blue-600 text-white font-medium ml-auto'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>
                <div
                  className={`text-[10px] mt-2 text-right ${
                    isBot ? 'text-gray-500' : 'text-blue-200/80'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>

              {!isBot && (
                <img
                  src={userProfile.avatarUrl}
                  alt={userProfile.displayName}
                  className="w-8 h-8 rounded-xl object-cover shrink-0 mt-0.5 border border-white/10"
                />
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#0D0D0E] flex items-center justify-center border border-white/5">
              <Bot className="w-4 h-4 text-blue-400 animate-pulse" />
            </div>
            <div className="p-3 rounded-2xl bg-[#0D0D0E] border border-white/5 flex items-center gap-2 text-xs text-gray-400">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
              <span>GearBot önerileri ve süreleri hesaplıyor...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Bar */}
      <div className="px-4 py-2 border-t border-white/5 bg-[#0A0A0B]/60 flex items-center gap-2 overflow-x-auto scrollbar-none">
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(prompt)}
            disabled={isLoading}
            className="text-[11px] px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5 whitespace-nowrap transition cursor-pointer shrink-0 disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Box Footer */}
      <div className="p-3 sm:p-4 border-t border-white/5 bg-[#0A0A0B]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Bir soru sor veya tavsiye iste (Örn: 2 saatlik beyin yakan bir film öner)..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            className="flex-1 px-4 py-3 bg-[#161618] border border-white/10 focus:border-blue-500 rounded-2xl text-xs sm:text-sm text-gray-100 placeholder-gray-500 outline-none transition disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition disabled:opacity-40 cursor-pointer shadow-lg shadow-blue-950/50 shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
