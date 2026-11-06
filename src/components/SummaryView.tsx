import React, { useState } from 'react';
import { 
  BookOpen, 
  RefreshCw, 
  Printer, 
  Download, 
  Quote, 
  Bookmark, 
  Sparkles, 
  CheckCircle,
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { KitSummary, KitSource } from '../types';
import { ApiService } from '../services/api';

interface SummaryViewProps {
  summary?: KitSummary;
  source: KitSource;
  kitTitle: string;
  kitSubject?: string;
  kitSection?: string;
  onOpenCitation: (citation: { page?: number; citationText: string; label?: string }) => void;
  onUpdateSummary: (newSummary: KitSummary) => void;
}

export const SummaryView: React.FC<SummaryViewProps> = ({
  summary,
  source,
  kitTitle,
  kitSubject,
  kitSection,
  onOpenCitation,
  onUpdateSummary,
}) => {
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    setErrorMsg(null);
    try {
      const res = await ApiService.regenerateComponent({
        component: 'summary',
        title: kitTitle,
        subject: kitSubject,
        section: kitSection,
        rawText: source.rawText,
        pages: source.pages,
      });
      if (res.data) {
        onUpdateSummary({
          ...res.data,
          generatedAt: new Date().toISOString(),
        });
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Ошибка обновления конспекта');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadTxt = () => {
    if (!summary) return;
    let content = `${summary.title}\n${'='.repeat(summary.title.length)}\n\n`;
    content += `КРАТКОЕ РЕЗЮМЕ:\n${summary.brief}\n\n`;
    content += `ОСНОВНЫЕ ПОЛОЖЕНИЯ:\n`;
    summary.sections.forEach((s, idx) => {
      content += `\n${idx + 1}. ${s.heading} [${s.sourceCitation}]\n${s.content}\n`;
      s.keyPoints.forEach((kp) => {
        content += `  - ${kp}\n`;
      });
    });
    content += `\nКЛЮЧЕВЫЕ ПОНЯТИЯ:\n`;
    summary.keyTerms.forEach((t) => {
      content += `- ${t.term}: ${t.definition} [${t.sourceCitation}]\n`;
    });
    content += `\nЧТО НУЖНО ЗАПОМНИТЬ:\n`;
    summary.mustRemember.forEach((mr) => {
      content += `- ${mr}\n`;
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Конспект_${kitTitle.slice(0, 30)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!summary) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4">
        <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
        <div>
          <h3 className="font-semibold text-slate-900">Конспект пока не создан</h3>
          <p className="text-xs text-slate-500 mt-1">
            Нажмите кнопку ниже, чтобы сгенерировать конспект по источнику.
          </p>
        </div>
        <button
          onClick={handleRegenerate}
          disabled={isRegenerating}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium inline-flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>Создать конспект</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-slate-500">
          Сформирован на основе {source.fileName || 'источника'} ({source.pageCount} стр.)
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadTxt}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium transition-colors"
            title="Скачать конспект как TXT"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Скачать TXT</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium transition-colors"
            title="Печать конспекта"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Печать</span>
          </button>
          <button
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
            title="Пересоздать конспект"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
            <span>{isRegenerating ? 'Обновляем...' : 'Пересоздать'}</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 1. Executive Summary Brief */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 space-y-3 shadow-2xs">
        <div className="flex items-center gap-2 text-indigo-700 font-semibold text-xs tracking-wider uppercase">
          <Bookmark className="w-4 h-4" />
          <span>Краткое резюме темы</span>
        </div>
        <p className="text-slate-800 text-sm sm:text-base leading-relaxed font-sans font-normal">
          {summary.brief}
        </p>
      </div>

      {/* 2. Structured Sections with Citations */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-900 tracking-tight uppercase text-xs text-slate-500">
          Основные положения по разделам
        </h3>

        <div className="space-y-4">
          {summary.sections.map((section, index) => (
            <div
              key={section.id || index}
              className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 space-y-4 shadow-2xs"
            >
              <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center shrink-0">
                    {index + 1}
                  </span>
                  <h4 className="text-base font-semibold text-slate-900">
                    {section.heading}
                  </h4>
                </div>

                {section.sourceCitation && (
                  <button
                    onClick={() =>
                      onOpenCitation({
                        page: section.sourcePage,
                        citationText: section.sourceCitation,
                        label: section.sourceCitation,
                      })
                    }
                    className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 bg-indigo-50/70 hover:bg-indigo-100 px-2.5 py-1 rounded-md border border-indigo-100 transition-colors"
                  >
                    <Quote className="w-3 h-3 text-indigo-500" />
                    <span>{section.sourceCitation}</span>
                  </button>
                )}
              </div>

              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {section.content}
              </p>

              {section.keyPoints && section.keyPoints.length > 0 && (
                <div className="bg-slate-50/80 rounded-xl p-3.5 space-y-2 border border-slate-100">
                  <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                    Ключевые тезисы раздела:
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {section.keyPoints.map((point, pIdx) => (
                      <li key={pIdx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 3. Key Concepts & Definitions */}
      {summary.keyTerms && summary.keyTerms.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-indigo-600" />
              <span>Ключевые понятия и определения</span>
            </h3>
            <span className="text-xs text-slate-500">
              {summary.keyTerms.length} терминов
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {summary.keyTerms.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-50/60 border border-slate-200/80 space-y-2 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-slate-900 text-sm">
                    {item.term}
                  </span>
                  {item.sourceCitation && (
                    <button
                      onClick={() =>
                        onOpenCitation({
                          page: item.sourcePage,
                          citationText: item.sourceCitation,
                          label: item.sourceCitation,
                        })
                      }
                      className="text-[11px] text-indigo-600 hover:underline flex items-center gap-1"
                    >
                      <span>{item.sourceCitation}</span>
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {item.definition}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. "Что нужно запомнить" */}
      {summary.mustRemember && summary.mustRemember.length > 0 && (
        <div className="bg-amber-50/60 rounded-2xl border border-amber-200/80 p-6 space-y-3">
          <div className="flex items-center gap-2 text-amber-900 font-semibold text-sm">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>Что нужно обязательно запомнить к зачету/экзамену</span>
          </div>
          <ul className="space-y-2">
            {summary.mustRemember.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-amber-950">
                <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-900 text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className="leading-snug">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
