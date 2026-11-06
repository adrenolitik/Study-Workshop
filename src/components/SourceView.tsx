import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Copy, 
  Check, 
  Download,
  Calendar,
  Layers,
  Hash
} from 'lucide-react';
import { KitSource } from '../types';

interface SourceViewProps {
  source: KitSource;
  initialPage?: number;
}

export const SourceView: React.FC<SourceViewProps> = ({
  source,
  initialPage = 1,
}) => {
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);

  const pages = source.pages && source.pages.length > 0
    ? source.pages
    : [{ pageNumber: 1, text: source.rawText }];

  const activePageObj = pages.find((p) => p.pageNumber === currentPage) || pages[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(activePageObj.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([source.rawText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = source.fileName || 'source_document.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Simple text highlight for search query
  const renderHighlightedText = (text: string) => {
    if (!searchQuery.trim()) return text;
    const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === searchQuery.toLowerCase() ? (
        <mark key={i} className="bg-yellow-200 text-slate-900 rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="space-y-5">
      {/* Document Metadata Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 text-sm sm:text-base">
              {source.fileName || 'Исходный учебный материал'}
            </h3>
            <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
              <span className="flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                {source.pageCount} {source.pageCount === 1 ? 'страница' : 'страниц'}
              </span>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1">
                <Hash className="w-3.5 h-3.5 text-slate-400" />
                {source.charCount.toLocaleString('ru-RU')} символов
              </span>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {new Date(source.extractedAt).toLocaleDateString('ru-RU')}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Скопировано' : 'Копировать'}</span>
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Скачать</span>
          </button>
        </div>
      </div>

      {/* Viewer Container */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {/* Navigation Toolbar */}
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          {/* Page Selector */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage <= 1}
              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-200/60 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-medium text-slate-700">
              Страница {currentPage} из {pages.length}
            </span>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(pages.length, prev + 1))}
              disabled={currentPage >= pages.length}
              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-200/60 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Поиск по странице..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Text Area */}
        <div className="p-6 sm:p-8 min-h-[400px] max-h-[600px] overflow-y-auto font-sans text-sm text-slate-800 leading-relaxed whitespace-pre-wrap select-text">
          {renderHighlightedText(activePageObj.text)}
        </div>
      </div>
    </div>
  );
};
