import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  RotateCw, 
  Check, 
  HelpCircle, 
  Shuffle, 
  RotateCcw, 
  Sparkles, 
  Quote, 
  Filter, 
  ArrowRight, 
  ArrowLeft,
  Keyboard,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { KitFlashcards, Flashcard, KitSource } from '../types';
import { ApiService } from '../services/api';

interface FlashcardsViewProps {
  flashcards?: KitFlashcards;
  source: KitSource;
  kitTitle: string;
  onOpenCitation: (citation: { page?: number; citationText: string; label?: string }) => void;
  onUpdateFlashcards: (newFlashcards: KitFlashcards) => void;
}

export const FlashcardsView: React.FC<FlashcardsViewProps> = ({
  flashcards,
  source,
  kitTitle,
  onOpenCitation,
  onUpdateFlashcards,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'repeat'>('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const rawCards = flashcards?.cards || [];
  
  // Filter cards based on tab
  const activeCards = filterMode === 'repeat'
    ? rawCards.filter((c) => c.status === 'repeat')
    : rawCards;

  const currentCard: Flashcard | undefined = activeCards[currentIndex];

  // Reset index if filter changes or exceeds
  useEffect(() => {
    if (currentIndex >= activeCards.length) {
      setCurrentIndex(0);
    }
    setIsFlipped(false);
  }, [filterMode, activeCards.length]);

  // Keyboard navigation shortcuts (Section 8.2)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is in an input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.code === 'ArrowRight' && currentCard) {
        e.preventDefault();
        handleMark('known');
      } else if (e.code === 'ArrowLeft' && currentCard) {
        e.preventDefault();
        handleMark('repeat');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentCard, activeCards, currentIndex]);

  // Mark card status
  const handleMark = (status: 'known' | 'repeat') => {
    if (!currentCard || !flashcards) return;

    const updatedList = rawCards.map((c) =>
      c.id === currentCard.id ? { ...c, status } : c
    );

    onUpdateFlashcards({
      ...flashcards,
      cards: updatedList,
    });

    // Move to next card
    setIsFlipped(false);
    if (currentIndex < activeCards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  // Shuffle cards
  const handleShuffle = () => {
    if (!flashcards) return;
    const shuffled = [...rawCards].sort(() => Math.random() - 0.5);
    onUpdateFlashcards({
      ...flashcards,
      cards: shuffled,
    });
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  // Reset all cards to unseen
  const handleResetStatuses = () => {
    if (!flashcards) return;
    const reset = rawCards.map((c) => ({ ...c, status: 'unseen' as const }));
    onUpdateFlashcards({
      ...flashcards,
      cards: reset,
    });
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  // Regenerate cards
  const handleRegenerate = async () => {
    setIsRegenerating(true);
    setErrorMsg(null);
    try {
      const res = await ApiService.regenerateComponent({
        component: 'flashcards',
        title: kitTitle,
        rawText: source.rawText,
        pages: source.pages,
      });
      if (res.data?.cards) {
        onUpdateFlashcards({
          cards: res.data.cards,
          generatedAt: new Date().toISOString(),
        });
        setCurrentIndex(0);
        setIsFlipped(false);
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Ошибка генерации карточек');
    } finally {
      setIsRegenerating(false);
    }
  };

  const knownCount = rawCards.filter((c) => c.status === 'known').length;
  const repeatCount = rawCards.filter((c) => c.status === 'repeat').length;

  if (!flashcards || rawCards.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4">
        <Layers className="w-10 h-10 text-slate-300 mx-auto" />
        <div>
          <h3 className="font-semibold text-slate-900">Карточки пока не сформированы</h3>
          <p className="text-xs text-slate-500 mt-1">
            Сгенерируйте карточки «вопрос — ответ» для интервального повторения.
          </p>
        </div>
        <button
          onClick={handleRegenerate}
          disabled={isRegenerating}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium inline-flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>Создать карточки</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Bar: Controls & Statistics */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Interactive Filter Tabs (functional segmented buttons) */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filterMode === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Все карточки ({rawCards.length})
          </button>
          <button
            onClick={() => setFilterMode('repeat')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filterMode === 'repeat'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Только для повторения ({repeatCount})
          </button>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleShuffle}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium transition-colors"
            title="Перемешать карточки"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Перемешать</span>
          </button>
          <button
            onClick={handleResetStatuses}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium transition-colors"
            title="Сбросить отметки"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Сбросить отметки</span>
          </button>
          <button
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
            title="Пересоздать карточки"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Progress & Card Counters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2 shadow-2xs">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-500 font-medium">
            <span>Карточка {activeCards.length > 0 ? currentIndex + 1 : 0} из {activeCards.length}</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-700 font-semibold">{knownCount} знаю</span>
            <span aria-hidden="true">·</span>
            <span className="text-amber-700 font-semibold">{repeatCount} повторить</span>
          </div>

          <div className="text-slate-400 hidden sm:flex items-center gap-1.5 text-[11px]">
            <Keyboard className="w-3.5 h-3.5" />
            <span>Пробел — перевернуть · &rarr; Знаю · &larr; Повторить</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-indigo-600 h-full transition-all duration-300 rounded-full"
            style={{
              width: `${activeCards.length > 0 ? ((currentIndex + 1) / activeCards.length) * 100 : 0}%`,
            }}
          />
        </div>
      </div>

      {/* FLASHCARD INTERACTIVE 3D FLIP CONTAINER */}
      {currentCard ? (
        <div className="perspective-1000">
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className={`min-h-[280px] sm:min-h-[320px] bg-white rounded-3xl border-2 p-8 sm:p-10 flex flex-col justify-between cursor-pointer select-none transition-all duration-200 shadow-md hover:shadow-lg ${
              isFlipped
                ? 'border-indigo-400 bg-indigo-50/10'
                : 'border-slate-200/90 hover:border-slate-300'
            }`}
          >
            {/* Card Header */}
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-medium text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
                {currentCard.topic || kitTitle}
              </span>

              <span className="text-slate-400 text-xs flex items-center gap-1">
                <RotateCw className="w-3 h-3" />
                <span>{isFlipped ? 'Определение / Ответ' : 'Нажмите, чтобы перевернуть'}</span>
              </span>
            </div>

            {/* Card Body (Front or Back) */}
            <div className="my-auto py-6 text-center space-y-4">
              {!isFlipped ? (
                <div className="space-y-2">
                  <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                    Вопрос / Термин:
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
                    {currentCard.front}
                  </h3>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-xs uppercase tracking-wider text-indigo-600 font-semibold">
                    Точный ответ / Определение:
                  </div>
                  <p className="text-base sm:text-lg text-slate-800 leading-relaxed font-sans font-medium max-w-xl mx-auto">
                    {currentCard.back}
                  </p>
                </div>
              )}
            </div>

            {/* Card Footer: Citation Link */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
              <div>
                {currentCard.sourceCitation && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenCitation({
                        page: currentCard.sourcePage,
                        citationText: currentCard.sourceCitation,
                        label: currentCard.sourceCitation,
                      });
                    }}
                    className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    <Quote className="w-3 h-3 text-indigo-500" />
                    <span>Источник: {currentCard.sourceCitation}</span>
                  </button>
                )}
              </div>

              {/* Status indicator on card */}
              <div>
                {currentCard.status === 'known' && (
                  <span className="text-emerald-700 font-medium text-xs flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    Отмечено «Знаю»
                  </span>
                )}
                {currentCard.status === 'repeat' && (
                  <span className="text-amber-700 font-medium text-xs flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                    На повторение
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons: "Повторить", "Перевернуть", "Знаю" */}
          <div className="grid grid-cols-3 gap-3 pt-4">
            <button
              onClick={() => handleMark('repeat')}
              className="py-3 px-4 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-2xs"
            >
              <HelpCircle className="w-4 h-4 text-amber-600" />
              <span>Повторить</span>
            </button>

            <button
              onClick={() => setIsFlipped(!isFlipped)}
              className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs sm:text-sm font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <RotateCw className="w-4 h-4 text-slate-600" />
              <span>Перевернуть</span>
            </button>

            <button
              onClick={() => handleMark('known')}
              className="py-3 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-2xs"
            >
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Знаю</span>
            </button>
          </div>

          {/* Stepper navigation */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => {
                setIsFlipped(false);
                setCurrentIndex((prev) => Math.max(0, prev - 1));
              }}
              disabled={currentIndex === 0}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 disabled:opacity-30"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Предыдущая
            </button>
            <button
              onClick={() => {
                setIsFlipped(false);
                setCurrentIndex((prev) => Math.min(activeCards.length - 1, prev + 1));
              }}
              disabled={currentIndex >= activeCards.length - 1}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 disabled:opacity-30"
            >
              Следующая
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
          <Check className="w-10 h-10 text-emerald-500 mx-auto" />
          <h4 className="font-semibold text-slate-900">
            Все карточки освоены!
          </h4>
          <p className="text-xs text-slate-500">
            В категории «Только для повторения» нет карточек. Переключитесь на «Все карточки», чтобы освежить знания.
          </p>
          <button
            onClick={() => setFilterMode('all')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium"
          >
            Показать все карточки
          </button>
        </div>
      )}
    </div>
  );
};
