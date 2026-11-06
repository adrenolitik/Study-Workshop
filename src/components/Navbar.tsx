import React from 'react';
import { BookOpen, Plus, Sparkles, GraduationCap } from 'lucide-react';

interface NavbarProps {
  activeView: 'kits' | 'create' | 'detail';
  onNavigate: (view: 'kits' | 'create') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeView,
  onNavigate,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div 
          onClick={() => onNavigate('kits')} 
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-200 group-hover:bg-indigo-700 transition-colors">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900 tracking-tight text-base sm:text-lg">
                Учебный комплект
              </span>
              <span className="text-[11px] font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                Open Notebook
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Персональные средства обучения студента
            </p>
          </div>
        </div>

        {/* Navigation Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => onNavigate('kits')}
            className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeView === 'kits'
                ? 'bg-slate-100 text-slate-900'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Мои комплекты
          </button>

          <button
            onClick={() => onNavigate('create')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Создать комплект</span>
          </button>

          <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

          {/* Educational mode indicator */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200/80 bg-slate-50/60 text-xs text-slate-700 select-none">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            <span className="font-medium">Самостоятельная подготовка</span>
          </div>
        </div>
      </div>
    </header>
  );
};
