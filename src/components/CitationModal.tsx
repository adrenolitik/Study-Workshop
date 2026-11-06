import React from 'react';
import { X, ExternalLink, BookOpen, Quote } from 'lucide-react';
import { KitSource } from '../types';

interface CitationModalProps {
  citation: {
    page?: number;
    citationText: string;
    label?: string;
  } | null;
  source: KitSource;
  onClose: () => void;
  onOpenFullSource: (page?: number) => void;
}

export const CitationModal: React.FC<CitationModalProps> = ({
  citation,
  source,
  onClose,
  onOpenFullSource,
}) => {
  if (!citation) return null;

  const pageNum = citation.page || 1;
  const pageObj = source.pages.find((p) => p.pageNumber === pageNum) || source.pages[0];
  const pageText = pageObj ? pageObj.text : source.rawText;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">
                Подтверждающий фрагмент источника
              </h3>
              <p className="text-xs text-slate-500">
                {source.fileName || 'Исходный документ'} · Страница {pageNum}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Citation badge info */}
          <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs text-indigo-950 flex items-start gap-2.5">
            <Quote className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-medium">Ссылка в учебном материале: </span>
              <span className="text-indigo-800">{citation.label || citation.citationText}</span>
            </div>
          </div>

          {/* Source Excerpt */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-slate-700 uppercase tracking-wider">
              Текст страницы {pageNum} источника:
            </div>
            <div className="max-h-64 overflow-y-auto p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 leading-relaxed font-sans whitespace-pre-wrap select-text">
              {pageText}
            </div>
          </div>

          <p className="text-xs text-slate-500 italic">
            Согласно разделу 6.4 ТЗ: каждое смысловое положение и вопрос теста проверяются по тексту исходного документа.
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={() => {
              onClose();
              onOpenFullSource(pageNum);
            }}
            className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Открыть полный текст источника
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-medium transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
