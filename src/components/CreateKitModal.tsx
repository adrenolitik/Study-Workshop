import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileText, 
  Check, 
  AlertCircle, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft,
  Info,
  ShieldCheck,
  FileCheck
} from 'lucide-react';
import { ApiService, ExtractedResult } from '../services/api';
import { StudyKit, ProcessingStatus } from '../types';
import { 
  ALL_MEDICAL_DISCIPLINES, 
  MEDICAL_DISCIPLINE_GROUPS 
} from '../data/medicalSections';

interface CreateKitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKitCreated: (newKit: StudyKit) => void;
  currentUserId: string;
}

export const CreateKitModal: React.FC<CreateKitModalProps> = ({
  isOpen,
  onClose,
  onKitCreated,
  currentUserId,
}) => {
  const [step, setStep] = useState<1 | 2>(1); // 1 = Form & Upload, 2 = Preview Extracted Text
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Медицина');
  const [section, setSection] = useState('Фармакология');
  const [medicalSearch, setMedicalSearch] = useState('');
  const [inputMode, setInputMode] = useState<'file' | 'text'>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState('');
  
  // Mandatory checkboxes
  const [confirmedRights, setConfirmedRights] = useState(false);
  const [engineMode, setEngineMode] = useState<'open_notebook' | 'auto'>('open_notebook');

  // Extraction & Generation state
  const [isExtracting, setIsExtracting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>('extracting');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 20 * 1024 * 1024) {
        setErrorMessage('Размер файла превышает лимит 20 МБ.');
        return;
      }
      setSelectedFile(file);
      setErrorMessage(null);
      // Auto-populate title if empty
      if (!title) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
        setTitle(cleanName);
      }
    }
  };

  // Step 1 -> Step 2: Extract text and show preview
  const handleProceedToPreview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage('Пожалуйста, укажите название темы.');
      return;
    }
    if (!confirmedRights) {
      setErrorMessage('Необходимо подтвердить право использования материала.');
      return;
    }
    if (inputMode === 'file' && !selectedFile) {
      setErrorMessage('Пожалуйста, выберите файл PDF или TXT.');
      return;
    }
    if (inputMode === 'text' && pastedText.trim().length < 200) {
      setErrorMessage('Вставьте текст объемом не менее 200 символов (рекомендуется от 2 000).');
      return;
    }

    setIsExtracting(true);
    setProcessingStatus('extracting');
    setErrorMessage(null);

    try {
      const result = await ApiService.extractText(
        inputMode === 'file' ? (selectedFile || undefined) : undefined,
        inputMode === 'text' ? pastedText : undefined
      );

      setExtractedData(result);
      setProcessingStatus('waiting_confirmation');
      setStep(2); // Move to review step
    } catch (err: any) {
      setErrorMessage(err.message || 'Ошибка извлечения текста из источника.');
      setProcessingStatus('error');
    } finally {
      setIsExtracting(false);
    }
  };

  // Step 2: User confirms extracted text -> calls AI generation
  const handleConfirmAndGenerate = async () => {
    if (!extractedData) return;

    setIsGenerating(true);
    setProcessingStatus('generating');
    setErrorMessage(null);

    const kitId = `kit-${Date.now()}`;
    const timestamp = new Date().toISOString();

    try {
      const response = await ApiService.generateAll({
        title: title.trim(),
        subject: subject.trim() || undefined,
        section: (subject === 'Медицина' ? section : undefined) || (section ? section.trim() : undefined),
        rawText: extractedData.rawText,
        pages: extractedData.pages,
        engine: engineMode,
      });

      const newKit: StudyKit = {
        id: kitId,
        userId: currentUserId,
        title: title.trim(),
        subject: subject.trim() || undefined,
        section: (subject === 'Медицина' ? section : undefined) || (section ? section.trim() : undefined),
        createdAt: timestamp,
        updatedAt: timestamp,
        lastAccessedAt: timestamp,
        status: response.status || 'ready',
        source: {
          fileName: selectedFile ? selectedFile.name : 'Вставленный текст',
          fileType: selectedFile?.name.toLowerCase().endsWith('.pdf') ? 'pdf' : selectedFile ? 'txt' : 'text',
          charCount: extractedData.charCount,
          pageCount: extractedData.pageCount,
          rawText: extractedData.rawText,
          pages: extractedData.pages,
          extractedAt: timestamp,
        },
        summary: response.summary,
        podcast: response.podcast,
        quiz: response.quiz,
        flashcards: response.flashcards,
        chatMessages: [],
      };

      onKitCreated(newKit);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Ошибка генерации учебных материалов.');
      setProcessingStatus('error');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Создание учебного комплекта
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className={step === 1 ? 'font-medium text-indigo-600' : 'text-slate-500'}>
                  1. Параметры и источник
                </span>
                <span aria-hidden="true">&rarr;</span>
                <span className={step === 2 ? 'font-medium text-indigo-600' : 'text-slate-400'}>
                  2. Предпросмотр и проверка
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isGenerating || isExtracting}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {errorMessage && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>{errorMessage}</div>
            </div>
          )}

          {step === 1 ? (
            /* STEP 1: FORM & UPLOAD */
            <form onSubmit={handleProceedToPreview} className="space-y-5">
              {/* Field: Title */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-700">
                  Название темы <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Например: Основы макроэкономики: инфляция и денежная политика"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all placeholder:text-slate-400"
                />
              </div>

              {/* Field: Subject & Medical Disciplines */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-slate-700">
                    Предмет и дисциплина
                  </label>
                  {subject === 'Медицина' && section && (
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                      Медицина · {section}
                    </span>
                  )}
                </div>

                {/* Quick Subject Tabs */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {['Медицина', 'Экономика', 'Биология', 'Юриспруденция', 'Другой'].map((sub) => {
                    const isSelected = sub === 'Другой'
                      ? !['Медицина', 'Экономика', 'Биология', 'Юриспруденция'].includes(subject)
                      : subject === sub;
                    return (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => {
                          if (sub === 'Другой') {
                            setSubject('');
                          } else {
                            setSubject(sub);
                            if (sub === 'Медицина' && !section) {
                              setSection('Фармакология');
                            }
                          }
                        }}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                          isSelected
                            ? sub === 'Медицина'
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                              : 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {sub}
                      </button>
                    );
                  })}
                </div>

                {/* Custom subject input if not standard preset */}
                {!['Медицина', 'Экономика', 'Биология', 'Юриспруденция'].includes(subject) && (
                  <input
                    type="text"
                    placeholder="Введите название предмета..."
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all placeholder:text-slate-400 mt-1"
                  />
                )}

                {/* Dedicated Medical Disciplines Selector (from user's document) */}
                {subject === 'Медицина' && (
                  <div className="p-3.5 bg-slate-50/90 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs font-medium text-slate-800 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span>Выберите раздел медицины ({ALL_MEDICAL_DISCIPLINES.length} дисциплин):</span>
                      </div>
                      <input
                        type="text"
                        placeholder="Поиск раздела (напр. Фармакология)..."
                        value={medicalSearch}
                        onChange={(e) => setMedicalSearch(e.target.value)}
                        className="text-xs px-2.5 py-1 bg-white border border-slate-300 rounded-lg w-52 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>

                    {/* Filtered Disciplines */}
                    <div className="max-h-48 overflow-y-auto space-y-3 pr-1">
                      {MEDICAL_DISCIPLINE_GROUPS.map((group) => {
                        const filtered = group.disciplines.filter((d) =>
                          d.toLowerCase().includes(medicalSearch.toLowerCase())
                        );
                        if (filtered.length === 0) return null;

                        return (
                          <div key={group.category} className="space-y-1.5">
                            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                              {group.category}
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {filtered.map((disc) => (
                                <button
                                  key={disc}
                                  type="button"
                                  onClick={() => {
                                    setSection(disc);
                                    if (!title.trim()) {
                                      setTitle(`${disc}: основы и ключевые понятия`);
                                    }
                                  }}
                                  className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                                    section === disc
                                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                                      : 'bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 border-slate-200'
                                  }`}
                                >
                                  {disc}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Source Mode Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-700">
                  Источник учебного материала <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl w-fit">
                  <button
                    type="button"
                    onClick={() => setInputMode('file')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      inputMode === 'file'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Загрузить файл (PDF / TXT)
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMode('text')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      inputMode === 'text'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Вставить текст вручную
                  </button>
                </div>
              </div>

              {/* File Upload Zone */}
              {inputMode === 'file' ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-indigo-50/20 rounded-2xl p-6 text-center cursor-pointer transition-all space-y-2"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.txt,text/plain,application/pdf"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto">
                    <Upload className="w-5 h-5" />
                  </div>
                  {selectedFile ? (
                    <div>
                      <div className="text-sm font-medium text-slate-900 flex items-center justify-center gap-1.5">
                        <FileCheck className="w-4 h-4 text-emerald-600" />
                        {selectedFile.name}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} МБ · Нажмите, чтобы заменить
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-sm font-medium text-slate-800">
                        Перетащите или выберите PDF или TXT
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        PDF с текстовым слоем до 50 страниц (до 20 МБ)
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Paste Text Area */
                <div className="space-y-1.5">
                  <textarea
                    rows={6}
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder="Вставьте лекцию, главу учебника или методический конспект..."
                    className="w-full p-3.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-sans focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all leading-relaxed"
                  />
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Рекомендуемый объем: 2 000 — 120 000 символов</span>
                    <span className={pastedText.length < 2000 ? 'text-amber-600' : 'text-emerald-600 font-medium'}>
                      Символов: {pastedText.length}
                    </span>
                  </div>
                </div>
              )}

              {/* Engine Selector: Open Notebook vs Server AI */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-700">
                  Технологический режим обработки
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEngineMode('open_notebook')}
                    className={`p-3 rounded-xl border text-left text-xs transition-colors flex items-start gap-2.5 ${
                      engineMode === 'open_notebook'
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-medium shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-slate-50'
                    }`}
                  >
                    <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <div>
                      <div className="font-semibold text-slate-900">Open Notebook</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                        Семантическая генерация конспектов, тестов и карточек на платформе Open Notebook.
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEngineMode('auto')}
                    className={`p-3 rounded-xl border text-left text-xs transition-colors flex items-start gap-2.5 ${
                      engineMode === 'auto'
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-medium shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-slate-50'
                    }`}
                  >
                    <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                    <div>
                      <div className="font-semibold text-slate-900">Серверный ИИ</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                        Нейросетевая обработка через серверный шлюз с автоматической поддержкой Open Notebook.
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Informational and Disclaimers as required by ТЗ (section 6.2 & 6.3) */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 text-xs text-slate-600">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium text-slate-800">Обработка материалов: </span>
                    Учебные средства формируются на базе образовательной платформы Open Notebook.
                  </div>
                </div>
                <div className="text-[11px] text-slate-500 pl-6">
                  Внимание: извлечение работает с текстовым слоем. Таблицы, формулы и иллюстрации могут не передаваться в первой версии MVP.
                </div>
              </div>

              {/* Mandatory Copyright Confirmation Checkbox (section 6.2) */}
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={confirmedRights}
                  onChange={(e) => setConfirmedRights(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
                <span className="text-xs text-slate-700 leading-snug">
                  Подтверждаю право использования загружаемого учебного материала для личной образовательной подготовки <span className="text-rose-500">*</span>
                </span>
              </label>

              {/* Footer Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isExtracting || !title.trim() || !confirmedRights}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium shadow-xs transition-colors disabled:opacity-50"
                >
                  {isExtracting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Извлекаем текст...</span>
                    </>
                  ) : (
                    <>
                      <span>Проверить извлеченный текст</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* STEP 2: PREVIEW EXTRACTED TEXT & CONFIRM GENERATION */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Предпросмотр извлеченного текста
                  </h3>
                  <p className="text-xs text-slate-500">
                    Проверьте корректность распознавания перед запуском ИИ-генерации (согласно разделу 6.3 ТЗ).
                  </p>
                </div>
                <div className="text-xs text-slate-600 font-medium bg-slate-100 px-2.5 py-1 rounded-md">
                  Страниц: {extractedData?.pageCount} · Символов: {extractedData?.charCount}
                </div>
              </div>

              {/* Warnings from extraction */}
              {extractedData?.warnings && extractedData.warnings.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                  {extractedData.warnings.map((w, idx) => (
                    <div key={idx} className="text-xs text-amber-800 flex items-start gap-2">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span>{w}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Scrollable text preview with page markers */}
              <div className="max-h-80 overflow-y-auto p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 leading-relaxed font-sans space-y-3">
                {extractedData?.pages.map((p) => (
                  <div key={p.pageNumber} className="border-b border-slate-200/80 pb-3 last:border-none">
                    <div className="text-[11px] font-semibold text-indigo-700 mb-1">
                      [Страница {p.pageNumber}]
                    </div>
                    <div className="whitespace-pre-wrap">{p.text}</div>
                  </div>
                ))}
              </div>

              {/* Generation Status Indicator */}
              {isGenerating && (
                <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin shrink-0" />
                  <div className="text-xs text-indigo-900">
                    <div className="font-semibold">Создаем учебные материалы...</div>
                    <div className="text-indigo-700">
                      Формируем конспект с цитированием, сценарий подкаста, проверочный тест и карточки.
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={isGenerating}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 disabled:opacity-50"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Назад к параметрам
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isGenerating}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                  >
                    Отмена
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmAndGenerate}
                    disabled={isGenerating}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium shadow-xs transition-colors disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Подтвердить и создать материалы</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
