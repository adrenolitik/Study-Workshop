import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  RefreshCw, 
  Sparkles, 
  Award, 
  ArrowRight, 
  ArrowLeft, 
  RotateCcw, 
  Quote, 
  Clock, 
  FileCheck,
  AlertCircle
} from 'lucide-react';
import { KitQuiz, QuizQuestion, QuizAttempt, KitSource } from '../types';
import { ApiService } from '../services/api';

interface QuizViewProps {
  quiz?: KitQuiz;
  source: KitSource;
  kitTitle: string;
  onOpenCitation: (citation: { page?: number; citationText: string; label?: string }) => void;
  onUpdateQuiz: (newQuiz: KitQuiz) => void;
}

export const QuizView: React.FC<QuizViewProps> = ({
  quiz,
  source,
  kitTitle,
  onOpenCitation,
  onUpdateQuiz,
}) => {
  // Test state machine: 'idle' (ready to start/view history) | 'in_progress' | 'review'
  const [testState, setTestState] = useState<'idle' | 'in_progress' | 'review'>('idle');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [currentAttempt, setCurrentAttempt] = useState<QuizAttempt | null>(null);

  // Regeneration state
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Active question list (can be shuffled for retake)
  const [activeQuestions, setActiveQuestions] = useState<QuizQuestion[]>(quiz?.questions || []);

  const questions = activeQuestions.length > 0 ? activeQuestions : (quiz?.questions || []);

  // Start test attempt
  const handleStartTest = (shuffle: boolean = false) => {
    let qList = [...(quiz?.questions || [])];
    if (shuffle) {
      qList = qList.sort(() => Math.random() - 0.5);
    }
    setActiveQuestions(qList);
    setSelectedAnswers({});
    setCurrentQuestionIndex(0);
    setCurrentAttempt(null);
    setTestState('in_progress');
  };

  // Select option for current question
  const handleSelectOption = (questionId: string, optionIndex: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  // Finish test and calculate results
  const handleFinishTest = () => {
    let score = 0;
    questions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctAnswerIndex) {
        score += 1;
      }
    });

    const percentage = Math.round((score / questions.length) * 100);
    const newAttempt: QuizAttempt = {
      id: `att-${Date.now()}`,
      date: new Date().toISOString(),
      score,
      totalQuestions: questions.length,
      percentage,
      userAnswers: { ...selectedAnswers },
    };

    setCurrentAttempt(newAttempt);
    setTestState('review');

    // Save attempt to quiz history
    if (quiz) {
      const updatedQuiz: KitQuiz = {
        ...quiz,
        attempts: [newAttempt, ...(quiz.attempts || [])],
      };
      onUpdateQuiz(updatedQuiz);
    }

    // Launch confetti if score >= 80%
    if (percentage >= 80) {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    }
  };

  // Regenerate questions with Gemini
  const handleRegenerateQuiz = async () => {
    setIsRegenerating(true);
    setErrorMsg(null);
    try {
      const res = await ApiService.regenerateComponent({
        component: 'quiz',
        title: kitTitle,
        rawText: source.rawText,
        pages: source.pages,
      });
      if (res.data?.questions) {
        const updated: KitQuiz = {
          questions: res.data.questions,
          attempts: quiz?.attempts || [],
          generatedAt: new Date().toISOString(),
        };
        setActiveQuestions(res.data.questions);
        onUpdateQuiz(updated);
        setTestState('idle');
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Ошибка генерации теста');
    } finally {
      setIsRegenerating(false);
    }
  };

  if (!quiz || questions.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4">
        <HelpCircle className="w-10 h-10 text-slate-300 mx-auto" />
        <div>
          <h3 className="font-semibold text-slate-900">Тест пока не сформирован</h3>
          <p className="text-xs text-slate-500 mt-1">
            Сгенерируйте вопросы для самопроверки по тексту источника.
          </p>
        </div>
        <button
          onClick={handleRegenerateQuiz}
          disabled={isRegenerating}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium inline-flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>Создать тест</span>
        </button>
      </div>
    );
  }

  // 1. STATE: TEST IN PROGRESS (Strict adherence: correct answers NEVER shown during test!)
  if (testState === 'in_progress') {
    const q = questions[currentQuestionIndex];
    const isAnswered = selectedAnswers[q.id] !== undefined;
    const answeredCount = Object.keys(selectedAnswers).length;

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Progress Header */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-between shadow-2xs">
          <div>
            <div className="text-xs text-slate-500 font-medium">
              Вопрос {currentQuestionIndex + 1} из {questions.length}
            </div>
            <div className="text-sm font-semibold text-slate-900 mt-0.5">
              {q.topicTag || kitTitle}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">
              Отвечено: {answeredCount} из {questions.length}
            </span>
            <button
              onClick={() => {
                if (confirm('Вы уверены, что хотите прервать прохождение теста?')) {
                  setTestState('idle');
                }
              }}
              className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-800 rounded-md"
            >
              Выйти
            </button>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 space-y-6 shadow-xs">
          <h3 className="text-base sm:text-lg font-semibold text-slate-900 leading-snug">
            {q.question}
          </h3>

          {/* Options */}
          <div className="space-y-3">
            {q.options.map((option, optIdx) => {
              const isSelected = selectedAnswers[q.id] === optIdx;
              const optionLetters = ['A', 'B', 'C', 'D'];

              return (
                <button
                  key={optIdx}
                  onClick={() => handleSelectOption(q.id, optIdx)}
                  className={`w-full p-4 rounded-xl text-left text-sm font-sans flex items-start gap-3.5 transition-all ${
                    isSelected
                      ? 'bg-indigo-50/80 border-2 border-indigo-600 text-indigo-950 font-medium shadow-xs'
                      : 'bg-slate-50/70 border border-slate-200 hover:border-slate-300 text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-lg text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5 ${
                      isSelected
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white border border-slate-300 text-slate-600'
                    }`}
                  >
                    {optionLetters[optIdx]}
                  </span>
                  <span className="leading-relaxed">{option}</span>
                </button>
              );
            })}
          </div>

          {/* Navigation Controls */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentQuestionIndex === 0}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 disabled:opacity-40"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Предыдущий
            </button>

            {currentQuestionIndex < questions.length - 1 ? (
              <button
                onClick={() => setCurrentQuestionIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition-colors"
              >
                Следующий
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={handleFinishTest}
                disabled={answeredCount === 0}
                className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                Завершить тест и проверить
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 2. STATE: TEST REVIEW (Разбор теста с объяснениями и ссылками)
  if (testState === 'review' && currentAttempt) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Score Banner */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-lg ${
                  currentAttempt.percentage >= 75
                    ? 'bg-emerald-100 text-emerald-700'
                    : currentAttempt.percentage >= 50
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-rose-100 text-rose-700'
                }`}
              >
                {currentAttempt.percentage}%
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {currentAttempt.percentage >= 80
                    ? 'Отличный результат!'
                    : currentAttempt.percentage >= 60
                    ? 'Хорошо, но есть что повторить'
                    : 'Рекомендуется повторить материал'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Правильно: {currentAttempt.score} из {currentAttempt.totalQuestions} вопросов
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleStartTest(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Пройти заново
              </button>
              <button
                onClick={() => setTestState('idle')}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium"
              >
                К списку попыток
              </button>
            </div>
          </div>
        </div>

        {/* Detailed Breakdown for Each Question */}
        <div className="space-y-4">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Подробный разбор каждого вопроса
          </h4>

          {questions.map((q, qIdx) => {
            const userChoice = currentAttempt.userAnswers[q.id];
            const isCorrect = userChoice === q.correctAnswerIndex;
            const optionLetters = ['A', 'B', 'C', 'D'];

            return (
              <div
                key={q.id}
                className={`bg-white rounded-2xl border p-5 sm:p-6 space-y-4 shadow-2xs ${
                  isCorrect ? 'border-emerald-200' : 'border-rose-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <span
                      className={`w-6 h-6 rounded-lg text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5 ${
                        isCorrect
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {qIdx + 1}
                    </span>
                    <h5 className="text-sm sm:text-base font-semibold text-slate-900 leading-snug">
                      {q.question}
                    </h5>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded ${
                      isCorrect
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {isCorrect ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" />
                        Верно
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3" />
                        Ошибка
                      </>
                    )}
                  </span>
                </div>

                {/* Options display */}
                <div className="space-y-2">
                  {q.options.map((opt, optIdx) => {
                    const isUserPick = userChoice === optIdx;
                    const isCorrectOpt = q.correctAnswerIndex === optIdx;

                    let rowStyle = 'bg-slate-50 border-slate-200 text-slate-700';
                    if (isCorrectOpt) {
                      rowStyle = 'bg-emerald-50/80 border-emerald-500 text-emerald-950 font-medium';
                    } else if (isUserPick && !isCorrect) {
                      rowStyle = 'bg-rose-50/80 border-rose-400 text-rose-950 line-through';
                    }

                    return (
                      <div
                        key={optIdx}
                        className={`p-3 rounded-xl border text-xs sm:text-sm flex items-start gap-3 ${rowStyle}`}
                      >
                        <span className="font-semibold shrink-0">
                          {optionLetters[optIdx]}.
                        </span>
                        <span className="flex-1">{opt}</span>
                        {isCorrectOpt && (
                          <span className="text-[11px] font-semibold text-emerald-700 shrink-0">
                            (Правильный ответ)
                          </span>
                        )}
                        {isUserPick && !isCorrectOpt && (
                          <span className="text-[11px] font-medium text-rose-700 shrink-0">
                            (Ваш выбор)
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation and Citation (Section 6.6) */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-2">
                  <div className="text-slate-800 leading-relaxed">
                    <span className="font-semibold text-slate-900">Объяснение: </span>
                    {q.explanation}
                  </div>

                  {q.sourceCitation && (
                    <div className="pt-1 flex items-center justify-between border-t border-slate-200/60">
                      <button
                        onClick={() =>
                          onOpenCitation({
                            page: q.sourcePage,
                            citationText: q.sourceCitation,
                            label: q.sourceCitation,
                          })
                        }
                        className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        <Quote className="w-3 h-3 text-indigo-500" />
                        <span>Подтверждение в источнике: {q.sourceCitation}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 3. STATE: IDLE (Start Screen with Attempts History)
  const bestScore = quiz.attempts && quiz.attempts.length > 0
    ? Math.max(...quiz.attempts.map((a) => a.percentage))
    : null;

  return (
    <div className="space-y-6">
      {/* Intro Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-2xs flex flex-wrap items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2 text-indigo-700 font-semibold text-xs tracking-wider uppercase">
            <Award className="w-4 h-4" />
            <span>Тест для самопроверки</span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900">
            Проверьте усвоение материала
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Тест содержит {questions.length} вопросов с 4 вариантами ответов. Правильные ответы скрыты до завершения попытки, после чего будет доступен полный разбор с цитатами из источника.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <button
            onClick={() => handleStartTest(false)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            <span>Начать тестирование</span>
          </button>
          <button
            onClick={handleRegenerateQuiz}
            disabled={isRegenerating}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
            <span>{isRegenerating ? 'Создаем...' : 'Обновить тест'}</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Attempts History (Section 6.6 & 6.9: История попыток сохраняется) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h4 className="font-semibold text-slate-900 text-sm">
            История попыток тестирования
          </h4>
          {bestScore !== null && (
            <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
              Лучший результат: {bestScore}%
            </span>
          )}
        </div>

        {quiz.attempts && quiz.attempts.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {quiz.attempts.map((att, idx) => (
              <div key={att.id || idx} className="py-3 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <span
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                      att.percentage >= 75
                        ? 'bg-emerald-100 text-emerald-800'
                        : att.percentage >= 50
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {att.percentage}%
                  </span>
                  <div>
                    <div className="font-medium text-slate-800">
                      Попытка {quiz.attempts.length - idx}: {att.score} из {att.totalQuestions} верно
                    </div>
                    <div className="text-slate-400 text-[11px] flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {new Date(att.date).toLocaleString('ru-RU', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setCurrentAttempt(att);
                    setTestState('review');
                  }}
                  className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-indigo-600 rounded-lg font-medium transition-colors border border-slate-200"
                >
                  Разбор ошибок
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-slate-500">
            Вы еще не проходили этот тест. Нажмите «Начать тестирование», чтобы проверить свои знания.
          </div>
        )}
      </div>
    </div>
  );
};
