import React, { useState } from 'react';
import { 
  BookOpen, 
  Headphones, 
  CheckCircle2, 
  Layers, 
  MessageSquare, 
  Trash2, 
  Edit3, 
  Clock, 
  FileText,
  AlertCircle
} from 'lucide-react';
import { StudyKit } from '../types';

interface KitCardProps {
  kit: StudyKit;
  onOpen: (kit: StudyKit) => void;
  onRename: (kitId: string, newTitle: string) => void;
  onDelete: (kitId: string) => void;
}

export const KitCard: React.FC<KitCardProps> = ({
  kit,
  onOpen,
  onRename,
  onDelete,
}) => {
  const [isRenaming, setIsRenaming] = useState(false);
  const [titleDraft, setTitleDraft] = useState(kit.title);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSaveRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (titleDraft.trim()) {
      onRename(kit.id, titleDraft.trim());
      setIsRenaming(false);
    }
  };

  const getStatusBadge = () => {
    switch (kit.status) {
      case 'ready':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Готово
          </span>
        );
      case 'generating':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
            Создаем материалы...
          </span>
        );
      case 'partially_ready':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
            Частично готово
          </span>
        );
      case 'extracting':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
            Извлекаем текст
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200">
            <AlertCircle className="w-3.5 h-3.5" />
            Не удалось создать
          </span>
        );
      default:
        return null;
    }
  };

  const bestQuizScore = kit.quiz?.attempts && kit.quiz.attempts.length > 0
    ? Math.max(...kit.quiz.attempts.map((a) => a.percentage))
    : null;

  const totalCards = kit.flashcards?.cards.length || 0;
  const knownCards = kit.flashcards?.cards.filter((c) => c.status === 'known').length || 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 hover:border-slate-300 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group">
      <div className="p-5 sm:p-6 space-y-4">
        {/* Top bar: Subject & Status */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap text-xs text-slate-500">
            {kit.subject && (
              <span className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                kit.subject === 'Медицина'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'text-slate-700 bg-slate-100 border border-slate-200'
              }`}>
                {kit.subject}
              </span>
            )}
            {kit.section && (
              <span className="text-[11px] font-medium text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
                {kit.section}
              </span>
            )}
            {!kit.subject && !kit.section && <span>Без предмета</span>}
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span className="flex items-center gap-1 text-slate-400 text-[11px]">
              <Clock className="w-3 h-3 text-slate-400" />
              {new Date(kit.createdAt).toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'short',
              })}
            </span>
          </div>
          <div>{getStatusBadge()}</div>
        </div>

        {/* Title or Renaming input */}
        {isRenaming ? (
          <form onSubmit={handleSaveRename} className="space-y-2">
            <input
              type="text"
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              className="w-full px-3 py-1.5 border border-indigo-500 rounded-lg text-sm font-semibold focus:outline-none ring-2 ring-indigo-200"
              autoFocus
            />
            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="px-2.5 py-1 bg-indigo-600 text-white rounded text-xs font-medium"
              >
                Сохранить
              </button>
              <button
                type="button"
                onClick={() => setIsRenaming(false)}
                className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded text-xs"
              >
                Отмена
              </button>
            </div>
          </form>
        ) : (
          <h3 
            onClick={() => onOpen(kit)}
            className="text-base sm:text-lg font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors cursor-pointer line-clamp-2 leading-snug"
          >
            {kit.title}
          </h3>
        )}

        {/* Source metadata */}
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
          <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate max-w-[180px]">
            {kit.source.fileName || 'Вставленный текст'}
          </span>
          <span aria-hidden="true">·</span>
          <span>{kit.source.pageCount} стр.</span>
          <span aria-hidden="true">·</span>
          <span>{(kit.source.charCount / 1000).toFixed(1)}k симв.</span>
        </div>

        {/* Kit Modules Status Highlights */}
        <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50/70 border border-slate-100/80">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <div>
              <span className="text-slate-500 block text-[10px]">Тест:</span>
              <span className="font-medium text-slate-800">
                {bestQuizScore !== null ? `Лучший: ${bestQuizScore}%` : `${kit.quiz?.questions.length || 0} вопр.`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50/70 border border-slate-100/80">
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            <div>
              <span className="text-slate-500 block text-[10px]">Карточки:</span>
              <span className="font-medium text-slate-800">
                {knownCards > 0 ? `${knownCards} из ${totalCards} освоено` : `${totalCards} карточек`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="px-5 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsRenaming(true)}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-md transition-colors"
            title="Переименовать комплект"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
            title="Удалить комплект"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          onClick={() => onOpen(kit)}
          className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-900 border border-slate-200 rounded-lg text-xs font-medium shadow-2xs transition-colors flex items-center gap-1.5"
        >
          <span>Изучать</span>
          <span aria-hidden="true">&rarr;</span>
        </button>
      </div>

      {/* Delete confirmation modal as required by ТЗ (section 6.10: "удалять комплект после подтверждения") */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl border border-slate-200 space-y-4">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="text-center space-y-1">
              <h4 className="font-semibold text-slate-900 text-base">
                Удалить учебный комплект?
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Комплект «{kit.title}», исходные материалы, конспект, подкаст, история тестов и чата будут безвозвратно удалены.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  onDelete(kit.id);
                }}
                className="flex-1 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-medium transition-colors"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
