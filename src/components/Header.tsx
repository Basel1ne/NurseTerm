import React from 'react';
import { ViewTab } from '../types/vocab';
import { Moon, Sun, Play } from 'lucide-react';

interface HeaderProps {
  currentTab: ViewTab;
  onTabChange: (tab: ViewTab) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  mistakeCount: number;
  onStartQuickDrill: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  isDark,
  onToggleTheme,
  mistakeCount,
  onStartQuickDrill,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Strictly compliant Top Bar Contract: 3 zones separated by gap-8 */}
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text element wordmark */}
          <button
            onClick={() => onTabChange('sheet')}
            className="flex items-center gap-2.5 text-left group shrink-0 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white font-bold text-base shadow-sm">
              N
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
              NurseTerm <span className="text-teal-600 dark:text-teal-400 font-medium text-sm">의학용어</span>
            </span>
          </button>

          {/* Zone 2: 4-5 single-line clean navigation links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
            <button
              onClick={() => onTabChange('sheet')}
              className={`transition-colors whitespace-nowrap py-1 relative cursor-pointer ${
                currentTab === 'sheet'
                  ? 'text-teal-600 dark:text-teal-400 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              가리고 쓰기 (워크시트)
              {currentTab === 'sheet' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600 dark:bg-teal-400 rounded-full" />
              )}
            </button>

            <button
              onClick={() => onTabChange('card')}
              className={`transition-colors whitespace-nowrap py-1 relative cursor-pointer ${
                currentTab === 'card'
                  ? 'text-teal-600 dark:text-teal-400 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              스피드 카드 드릴
              {currentTab === 'card' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600 dark:bg-teal-400 rounded-full" />
              )}
            </button>

            <button
              onClick={() => onTabChange('mistakes')}
              className={`transition-colors whitespace-nowrap py-1 relative flex items-center gap-1.5 cursor-pointer ${
                currentTab === 'mistakes'
                  ? 'text-teal-600 dark:text-teal-400 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              오답 노트
              {mistakeCount > 0 && (
                <span className="text-xs font-mono tabular-nums text-rose-600 dark:text-rose-400 font-semibold">
                  ({mistakeCount})
                </span>
              )}
              {currentTab === 'mistakes' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600 dark:bg-teal-400 rounded-full" />
              )}
            </button>

            <button
              onClick={() => onTabChange('stats')}
              className={`transition-colors whitespace-nowrap py-1 relative cursor-pointer ${
                currentTab === 'stats'
                  ? 'text-teal-600 dark:text-teal-400 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              학습 통계
              {currentTab === 'stats' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600 dark:bg-teal-400 rounded-full" />
              )}
            </button>

            <button
              onClick={() => onTabChange('manage')}
              className={`transition-colors whitespace-nowrap py-1 relative cursor-pointer ${
                currentTab === 'manage'
                  ? 'text-teal-600 dark:text-teal-400 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              단어장 관리
              {currentTab === 'manage' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600 dark:bg-teal-400 rounded-full" />
              )}
            </button>
          </nav>

          {/* Zone 3: 1 primary action & theme switch */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onToggleTheme}
              aria-label={isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
              className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              onClick={onStartQuickDrill}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 active:bg-teal-800 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>드릴 시작</span>
            </button>
          </div>
        </div>

        {/* Mobile secondary nav bar */}
        <div className="md:hidden flex items-center justify-between overflow-x-auto py-2.5 border-t border-slate-200 dark:border-slate-800 text-xs font-medium gap-4 scrollbar-none">
          <button
            onClick={() => onTabChange('sheet')}
            className={`whitespace-nowrap cursor-pointer ${
              currentTab === 'sheet' ? 'text-teal-600 dark:text-teal-400 font-bold' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            가리고 쓰기
          </button>
          <button
            onClick={() => onTabChange('card')}
            className={`whitespace-nowrap cursor-pointer ${
              currentTab === 'card' ? 'text-teal-600 dark:text-teal-400 font-bold' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            스피드 카드
          </button>
          <button
            onClick={() => onTabChange('mistakes')}
            className={`whitespace-nowrap flex items-center gap-1 cursor-pointer ${
              currentTab === 'mistakes' ? 'text-teal-600 dark:text-teal-400 font-bold' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            오답 노트 {mistakeCount > 0 && <span className="text-rose-500 font-mono">({mistakeCount})</span>}
          </button>
          <button
            onClick={() => onTabChange('stats')}
            className={`whitespace-nowrap cursor-pointer ${
              currentTab === 'stats' ? 'text-teal-600 dark:text-teal-400 font-bold' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            학습 통계
          </button>
          <button
            onClick={() => onTabChange('manage')}
            className={`whitespace-nowrap cursor-pointer ${
              currentTab === 'manage' ? 'text-teal-600 dark:text-teal-400 font-bold' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            단어 관리
          </button>
        </div>
      </div>
    </header>
  );
};
