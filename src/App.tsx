import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Headphones, 
  CheckCircle2, 
  Layers, 
  MessageSquare, 
  FileText, 
  ArrowLeft, 
  Plus, 
  AlertTriangle, 
  Search, 
  Sparkles
} from 'lucide-react';
import { StudyKit } from './types';
import { StorageService } from './services/storage';
import { Navbar } from './components/Navbar';
import { KitCard } from './components/KitCard';
import { CreateKitModal } from './components/CreateKitModal';
import { SummaryView } from './components/SummaryView';
import { PodcastView } from './components/PodcastView';
import { QuizView } from './components/QuizView';
import { FlashcardsView } from './components/FlashcardsView';
import { ChatView } from './components/ChatView';
import { SourceView } from './components/SourceView';
import { CitationModal } from './components/CitationModal';

export default function App() {
  // Global State
  const [kits, setKits] = useState<StudyKit[]>(() => StorageService.getKits());

  // Views & Routing (Dedicated for Student without registration/admin barriers)
  const [activeView, setActiveView] = useState<'kits' | 'detail'>('kits');
  const [activeKitId, setActiveKitId] = useState<string | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<'summary' | 'podcast' | 'quiz' | 'flashcards' | 'chat' | 'source'>('summary');
  const [initialSourcePage, setInitialSourcePage] = useState<number>(1);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeCitation, setActiveCitation] = useState<{
    page?: number;
    citationText: string;
    label?: string;
  } | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedMedicalSection, setSelectedMedicalSection] = useState<string>('all');

  // Sync state to local storage
  useEffect(() => {
    StorageService.saveKits(kits);
  }, [kits]);

  const activeKit = kits.find((k) => k.id === activeKitId);

  // Handlers for Kits
  const handleOpenKit = (kit: StudyKit) => {
    setActiveKitId(kit.id);
    setActiveView('detail');
    setActiveDetailTab('summary');
    // Update last accessed
    const updated = kits.map((k) =>
      k.id === kit.id ? { ...k, lastAccessedAt: new Date().toISOString() } : k
    );
    setKits(updated);
  };

  const handleRenameKit = (kitId: string, newTitle: string) => {
    const updated = kits.map((k) => (k.id === kitId ? { ...k, title: newTitle } : k));
    setKits(updated);
  };

  const handleDeleteKit = (kitId: string) => {
    setKits(kits.filter((k) => k.id !== kitId));
    if (activeKitId === kitId) {
      setActiveKitId(null);
      setActiveView('kits');
    }
  };

  const handleKitCreated = (newKit: StudyKit) => {
    setKits([newKit, ...kits]);
    setActiveKitId(newKit.id);
    setActiveView('detail');
    setActiveDetailTab('summary');
  };

  const handleUpdateActiveKit = (updates: Partial<StudyKit>) => {
    if (!activeKitId) return;
    const updated = kits.map((k) => (k.id === activeKitId ? { ...k, ...updates } : k));
    setKits(updated);
  };

  // Citation opening
  const handleOpenCitation = (cit: { page?: number; citationText: string; label?: string }) => {
    setActiveCitation(cit);
  };

  // Jump from citation modal directly to Source Text tab
  const handleJumpToSourcePage = (pageNum: number = 1) => {
    setInitialSourcePage(pageNum);
    setActiveDetailTab('source');
  };

  // Subjects list for filter (prioritizing Медицина first if present)
  const allSubjects = Array.from(
    new Set(kits.map((k) => k.subject).filter((s): s is string => Boolean(s)))
  ).sort((a, b) => (a === 'Медицина' ? -1 : b === 'Медицина' ? 1 : a.localeCompare(b)));

  // Medical sections present in kits
  const availableMedicalSections = Array.from(
    new Set(
      kits
        .filter((k) => k.subject === 'Медицина' && k.section)
        .map((k) => k.section as string)
    )
  );

  const filteredKits = kits.filter((kit) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      kit.title.toLowerCase().includes(query) ||
      (kit.subject && kit.subject.toLowerCase().includes(query)) ||
      (kit.section && kit.section.toLowerCase().includes(query));

    const matchesSubject = selectedSubject === 'all' || kit.subject === selectedSubject;
    const matchesSection =
      selectedSubject !== 'Медицина' ||
      selectedMedicalSection === 'all' ||
      kit.section === selectedMedicalSection;

    return matchesSearch && matchesSubject && matchesSection;
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Top Navigation */}
      <Navbar
        activeView={activeView === 'detail' ? 'detail' : activeView}
        onNavigate={(view) => {
          if (view === 'create') {
            setIsCreateModalOpen(true);
          } else {
            setActiveView(view);
          }
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* ========================================================= */}
        {/* VIEW 1: STUDY KIT CATALOG SCREEN («Мои комплекты»)        */}
        {/* ========================================================= */}
        {activeView === 'kits' && (
          <div className="space-y-6">
            {/* Hero / Overview Banner */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs flex flex-wrap items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2 text-indigo-700 font-semibold text-xs tracking-wider uppercase">
                  <BookOpen className="w-4 h-4" />
                  <span>Учебный комплект · Open Notebook</span>
                </div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
                  Персональные учебные комплекты
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Преобразуйте учебный материал (PDF до 50 страниц, лекции, методички) в полный набор средств обучения: интерактивный конспект с цитатами, аудиоподкаст, проверочный тест, карточки для повторения и чат по источнику. Без регистрации и ограничений.
                </p>
              </div>

              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm transition-all hover:shadow-indigo-200 hover:shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Создать учебный комплект</span>
              </button>
            </div>

            {/* Filter and Search Bar */}
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Subject Tabs */}
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto max-w-full">
                  <button
                    onClick={() => {
                      setSelectedSubject('all');
                      setSelectedMedicalSection('all');
                    }}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors shrink-0 ${
                      selectedSubject === 'all'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Все предметы ({kits.length})
                  </button>
                  {allSubjects.map((sub) => (
                    <button
                      key={sub}
                      onClick={() => {
                        setSelectedSubject(sub);
                        if (sub !== 'Медицина') {
                          setSelectedMedicalSection('all');
                        }
                      }}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors shrink-0 ${
                        selectedSubject === sub
                          ? sub === 'Медицина'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-white text-slate-900 shadow-xs'
                          : sub === 'Медицина'
                          ? 'text-emerald-700 font-medium hover:text-emerald-900'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>

                {/* Search Box */}
                <div className="relative w-full sm:w-72">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="Поиск по теме, разделу или медицине..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Medical Discipline Sub-filters when "Медицина" or "all" is active */}
              {(selectedSubject === 'Медицина' || (selectedSubject === 'all' && availableMedicalSections.length > 0)) && (
                <div className="flex items-center gap-1.5 p-1 bg-emerald-50/70 border border-emerald-100 rounded-xl overflow-x-auto max-w-full text-xs">
                  <span className="text-[11px] font-semibold text-emerald-800 px-2 shrink-0">
                    Разделы медицины:
                  </span>
                  <button
                    onClick={() => setSelectedMedicalSection('all')}
                    className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors shrink-0 ${
                      selectedMedicalSection === 'all'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'text-emerald-800 hover:bg-emerald-100/60'
                    }`}
                  >
                    Все разделы
                  </button>
                  {availableMedicalSections.map((sec) => (
                    <button
                      key={sec}
                      onClick={() => setSelectedMedicalSection(sec)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors shrink-0 ${
                        selectedMedicalSection === sec
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'text-emerald-800 hover:bg-emerald-100/60'
                      }`}
                    >
                      {sec}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Kits Grid */}
            {filteredKits.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredKits.map((kit) => (
                  <KitCard
                    key={kit.id}
                    kit={kit}
                    onOpen={handleOpenKit}
                    onRename={handleRenameKit}
                    onDelete={handleDeleteKit}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
                <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
                <div className="space-y-1">
                  <h3 className="font-semibold text-slate-900 text-base">
                    Комплекты не найдены
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    {searchQuery || selectedSubject !== 'all'
                      ? 'Попробуйте сбросить фильтры поиска.'
                      : 'Создайте свой первый учебный комплект, загрузив PDF до 50 страниц или вставив текст лекции.'}
                  </p>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-medium inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Создать учебный комплект</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: STUDY KIT DETAIL SCREEN («Страница комплекта»)     */}
        {/* ========================================================= */}
        {activeView === 'detail' && activeKit && (
          <div className="space-y-6">
            {/* Back Bar & Breadcrumbs */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => setActiveView('kits')}
                className="flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                <span>Назад ко всем комплектам</span>
              </button>

              <div className="text-xs text-slate-500">
                Последнее обращение:{' '}
                {new Date(activeKit.lastAccessedAt).toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>

            {/* Header Title Box */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-xs space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                {activeKit.subject && (
                  <span className={`font-semibold px-2.5 py-1 rounded-md border ${
                    activeKit.subject === 'Медицина'
                      ? 'text-emerald-800 bg-emerald-50 border-emerald-200'
                      : 'text-indigo-700 bg-indigo-50 border-indigo-100'
                  }`}>
                    {activeKit.subject}
                  </span>
                )}
                {activeKit.section && (
                  <span className="font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
                    {activeKit.section}
                  </span>
                )}
                <span>{activeKit.source.fileName || 'Текстовый источник'}</span>
                <span aria-hidden="true">·</span>
                <span>{activeKit.source.pageCount} стр.</span>
                <span aria-hidden="true">·</span>
                <span>{(activeKit.source.charCount / 1000).toFixed(1)}k символов</span>
              </div>

              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {activeKit.title}
              </h1>

              {/* Mandatory AI Warning Banner (ТЗ Section 7 & 8.2) */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-start gap-2.5 text-xs text-slate-600">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Материалы созданы с помощью ИИ и могут содержать ошибки. Проверяйте важные сведения по исходному источнику с помощью интерактивных ссылок.
                </span>
              </div>
            </div>

            {/* 6 Core Functional Tabs (Конспект, подкаст, тест, карточки, чат, исходный материал) */}
            <div className="border-b border-slate-200">
              <nav className="flex space-x-2 sm:space-x-4 overflow-x-auto pb-px">
                <button
                  onClick={() => setActiveDetailTab('summary')}
                  className={`flex items-center gap-2 py-3 px-3.5 border-b-2 text-xs sm:text-sm font-medium transition-colors shrink-0 ${
                    activeDetailTab === 'summary'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Конспект</span>
                </button>

                <button
                  onClick={() => setActiveDetailTab('podcast')}
                  className={`flex items-center gap-2 py-3 px-3.5 border-b-2 text-xs sm:text-sm font-medium transition-colors shrink-0 ${
                    activeDetailTab === 'podcast'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  <Headphones className="w-4 h-4" />
                  <span>Подкаст</span>
                </button>

                <button
                  onClick={() => setActiveDetailTab('quiz')}
                  className={`flex items-center gap-2 py-3 px-3.5 border-b-2 text-xs sm:text-sm font-medium transition-colors shrink-0 ${
                    activeDetailTab === 'quiz'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Тест для самопроверки</span>
                </button>

                <button
                  onClick={() => setActiveDetailTab('flashcards')}
                  className={`flex items-center gap-2 py-3 px-3.5 border-b-2 text-xs sm:text-sm font-medium transition-colors shrink-0 ${
                    activeDetailTab === 'flashcards'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>Карточки</span>
                </button>

                <button
                  onClick={() => setActiveDetailTab('chat')}
                  className={`flex items-center gap-2 py-3 px-3.5 border-b-2 text-xs sm:text-sm font-medium transition-colors shrink-0 ${
                    activeDetailTab === 'chat'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Чат по источнику</span>
                </button>

                <button
                  onClick={() => setActiveDetailTab('source')}
                  className={`flex items-center gap-2 py-3 px-3.5 border-b-2 text-xs sm:text-sm font-medium transition-colors shrink-0 ${
                    activeDetailTab === 'source'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Исходный материал</span>
                </button>
              </nav>
            </div>

            {/* TAB CONTENTS */}
            <div className="pt-2">
              {activeDetailTab === 'summary' && (
                <SummaryView
                  summary={activeKit.summary}
                  source={activeKit.source}
                  kitTitle={activeKit.title}
                  kitSubject={activeKit.subject}
                  kitSection={activeKit.section}
                  onOpenCitation={handleOpenCitation}
                  onUpdateSummary={(newSummary) => handleUpdateActiveKit({ summary: newSummary })}
                />
              )}

              {activeDetailTab === 'podcast' && (
                <PodcastView
                  podcast={activeKit.podcast}
                  source={activeKit.source}
                  kitTitle={activeKit.title}
                  onUpdatePodcast={(newPodcast) => handleUpdateActiveKit({ podcast: newPodcast })}
                />
              )}

              {activeDetailTab === 'quiz' && (
                <QuizView
                  quiz={activeKit.quiz}
                  source={activeKit.source}
                  kitTitle={activeKit.title}
                  onOpenCitation={handleOpenCitation}
                  onUpdateQuiz={(newQuiz) => handleUpdateActiveKit({ quiz: newQuiz })}
                />
              )}

              {activeDetailTab === 'flashcards' && (
                <FlashcardsView
                  flashcards={activeKit.flashcards}
                  source={activeKit.source}
                  kitTitle={activeKit.title}
                  onOpenCitation={handleOpenCitation}
                  onUpdateFlashcards={(newFlashcards) =>
                    handleUpdateActiveKit({ flashcards: newFlashcards })
                  }
                />
              )}

              {activeDetailTab === 'chat' && (
                <ChatView
                  messages={activeKit.chatMessages || []}
                  source={activeKit.source}
                  kitTitle={activeKit.title}
                  onSendMessage={(userText, assistantRes) => {
                    const now = new Date().toISOString();
                    const newMsgs = [
                      ...(activeKit.chatMessages || []),
                      {
                        id: `msg-${Date.now()}-u`,
                        sender: 'user' as const,
                        text: userText,
                        timestamp: now,
                      },
                      {
                        id: `msg-${Date.now()}-a`,
                        sender: 'assistant' as const,
                        text: assistantRes.text,
                        citations: assistantRes.citations,
                        timestamp: now,
                      },
                    ];
                    handleUpdateActiveKit({ chatMessages: newMsgs });
                  }}
                  onClearChat={() => handleUpdateActiveKit({ chatMessages: [] })}
                  onOpenCitation={handleOpenCitation}
                />
              )}

              {activeDetailTab === 'source' && (
                <SourceView
                  source={activeKit.source}
                  initialPage={initialSourcePage}
                />
              )}
            </div>
          </div>
        )}
      </main>

      {/* Global Citation Inspector Modal */}
      {activeKit && (
        <CitationModal
          citation={activeCitation}
          source={activeKit.source}
          onClose={() => setActiveCitation(null)}
          onOpenFullSource={handleJumpToSourcePage}
        />
      )}

      {/* Guided Create Kit Modal (up to 50 pages PDF, no auth required) */}
      <CreateKitModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onKitCreated={handleKitCreated}
        currentUserId="student-default"
      />
    </div>
  );
}
