import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, 
  Send, 
  Sparkles, 
  Bot, 
  User, 
  Quote, 
  Trash2, 
  ShieldAlert,
  Info
} from 'lucide-react';
import { ChatMessage, KitSource } from '../types';
import { ApiService } from '../services/api';

interface ChatViewProps {
  messages: ChatMessage[];
  source: KitSource;
  kitTitle: string;
  onSendMessage: (userText: string, assistantResponse: { text: string; citations?: any[] }) => void;
  onClearChat: () => void;
  onOpenCitation: (citation: { page?: number; citationText: string; label?: string }) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  messages,
  source,
  kitTitle,
  onSendMessage,
  onClearChat,
  onOpenCitation,
}) => {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    setInputText('');
    setIsLoading(true);
    setErrorMsg(null);

    // Save temporary user message locally
    const tempUserMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toISOString(),
    };

    try {
      const historyPayload = messages.map((m) => ({
        sender: m.sender,
        text: m.text,
      }));

      const res = await ApiService.sendChatMessage({
        message: text,
        history: historyPayload,
        rawText: source.rawText,
        title: kitTitle,
        pages: source.pages,
      });

      onSendMessage(text, {
        text: res.text,
        citations: res.citations || [],
      });
    } catch (e: any) {
      setErrorMsg(e.message || 'Ошибка обработки вопроса в чате.');
    } finally {
      setIsLoading(false);
    }
  };

  const sampleQuestions = [
    'Объясни ключевую идею темы простыми словами',
    'В чем главное отличие основных понятий?',
    'Приведи пример применения этих знаний из текста',
    'Какие типичные ошибки совершают студенты по этой теме?',
  ];

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[650px] bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
      {/* Chat Header */}
      <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 text-sm">
              Чат по учебному комплекту
            </h3>
            <p className="text-xs text-slate-500">
              Строгое заземление на текст источника · {source.fileName || 'Материал'}
            </p>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            onClick={onClearChat}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-500 hover:text-rose-600 hover:bg-slate-200/60 rounded-md transition-colors"
            title="Очистить историю переписки"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Очистить</span>
          </button>
        )}
      </div>

      {/* Grounding Notice as specified in ТЗ Section 6.8 & 7 */}
      <div className="px-6 py-2 bg-indigo-50/50 border-b border-indigo-100/60 text-[11px] text-indigo-900 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          <span>
            Ответы опираются исключительно на загруженный материал. Если данных недостаточно, ассистент сообщит об этом.
          </span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div className="max-w-md space-y-1">
              <h4 className="font-semibold text-slate-900 text-base">
                Задайте любой вопрос по теме
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Ассистент найдет подтверждающие фрагменты в документе и подробно объяснит сложные моменты.
              </p>
            </div>

            {/* Quick suggested questions */}
            <div className="w-full max-w-lg space-y-2 pt-2">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-left">
                Рекомендуемые вопросы:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {sampleQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(q)}
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-left text-xs text-slate-700 hover:text-indigo-900 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-indigo-600 text-white rounded-tr-xs shadow-2xs'
                      : 'bg-slate-50 border border-slate-200/90 text-slate-800 rounded-tl-xs shadow-2xs space-y-3'
                  }`}
                >
                  <div className="whitespace-pre-wrap font-sans">{msg.text}</div>

                  {/* Attached Citations */}
                  {!isUser && msg.citations && msg.citations.length > 0 && (
                    <div className="pt-2 border-t border-slate-200/70 space-y-1.5">
                      <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                        Источники в тексте:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.citations.map((c, cIdx) => (
                          <button
                            key={cIdx}
                            onClick={() =>
                              onOpenCitation({
                                page: c.page,
                                citationText: c.excerpt,
                                label: c.label,
                              })
                            }
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[11px] font-medium transition-colors"
                          >
                            <Quote className="w-2.5 h-2.5 text-indigo-500" />
                            <span>{c.label || `Стр. ${c.page || 1}`}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div
                    className={`text-[10px] ${
                      isUser ? 'text-indigo-200 text-right' : 'text-slate-400'
                    }`}
                  >
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-1">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {isLoading && (
          <div className="flex gap-3 items-center text-xs text-slate-500">
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.2s]" />
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.4s]" />
              <span className="text-slate-500 ml-1">Анализируем источник...</span>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
            {errorMsg}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Bar */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Спросите о терминах, процессах или деталях из документа..."
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all placeholder:text-slate-400 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !inputText.trim()}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Отправить</span>
          </button>
        </form>
      </div>
    </div>
  );
};
