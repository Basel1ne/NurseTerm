import React, { useState, useEffect } from 'react';
import { WordItem, MistakeRecord, StudyStats, ViewTab } from './types/vocab';
import {
  loadStoredWords,
  saveStoredWords,
  loadStoredMistakes,
  saveStoredMistakes,
  loadStoredStats,
  saveStoredStats,
  recordAttemptResult,
} from './utils/storage';
import { Header } from './components/Header';
import { SheetPractice } from './components/SheetPractice';
import { CardDrill } from './components/CardDrill';
import { MistakeNotebook } from './components/MistakeNotebook';
import { StatsDashboard } from './components/StatsDashboard';
import { WordManager } from './components/WordManager';

export default function App() {
  const [currentTab, setCurrentTab] = useState<ViewTab>('sheet');
  const [words, setWords] = useState<WordItem[]>(() => loadStoredWords());
  const [mistakes, setMistakes] = useState<MistakeRecord[]>(() => loadStoredMistakes());
  const [stats, setStats] = useState<StudyStats>(() => loadStoredStats());
  const [presetDrillIds, setPresetDrillIds] = useState<string[] | undefined>(undefined);

  // Theme setup with localStorage persistence and system preference
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('nurseterm_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('nurseterm_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('nurseterm_theme', 'light');
    }
  }, [isDark]);

  const handleToggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  // Record an answer attempt
  const handleRecordResult = (word: WordItem, input: string, isCorrect: boolean) => {
    const { updatedStats, updatedMistakes } = recordAttemptResult(
      word,
      input,
      isCorrect,
      stats,
      mistakes
    );
    setStats(updatedStats);
    setMistakes(updatedMistakes);
  };

  // Launch speed card drill with all words or selected words
  const handleStartQuickDrill = () => {
    setPresetDrillIds(undefined);
    setCurrentTab('card');
  };

  // Launch mistake-specific drill
  const handleLaunchMistakeDrill = (wordIds: string[]) => {
    setPresetDrillIds(wordIds);
    setCurrentTab('card');
  };

  // Reset stats
  const handleResetStats = () => {
    const emptyStats: StudyStats = {
      totalAttempts: 0,
      correctAttempts: 0,
      streak: 0,
      bestStreak: 0,
      lastStudiedAt: Date.now(),
      chapterStats: {},
      dailyHistory: {},
    };
    setStats(emptyStats);
    saveStoredStats(emptyStats);
  };

  // Update words
  const handleUpdateWords = (updated: WordItem[]) => {
    setWords(updated);
    saveStoredWords(updated);
  };

  // Update mistakes
  const handleUpdateMistakes = (updated: MistakeRecord[]) => {
    setMistakes(updated);
    saveStoredMistakes(updated);
  };

  const unresolvedMistakesCount = mistakes.filter((m) => !m.isMastered).length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Header complying with Top Bar Contract */}
      <Header
        currentTab={currentTab}
        onTabChange={(tab) => {
          if (tab !== 'card') {
            setPresetDrillIds(undefined);
          }
          setCurrentTab(tab);
        }}
        isDark={isDark}
        onToggleTheme={handleToggleTheme}
        mistakeCount={unresolvedMistakesCount}
        onStartQuickDrill={handleStartQuickDrill}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'sheet' && (
          <SheetPractice
            words={words}
            onRecordResult={handleRecordResult}
            stats={stats}
            mistakes={mistakes}
          />
        )}

        {currentTab === 'card' && (
          <CardDrill
            words={words}
            onRecordResult={handleRecordResult}
            presetWordIds={presetDrillIds}
            onFinishDrill={() => {}}
          />
        )}

        {currentTab === 'mistakes' && (
          <MistakeNotebook
            mistakes={mistakes}
            onUpdateMistakes={handleUpdateMistakes}
            onLaunchMistakeDrill={handleLaunchMistakeDrill}
          />
        )}

        {currentTab === 'stats' && (
          <StatsDashboard
            stats={stats}
            mistakes={mistakes}
            words={words}
            onResetStats={handleResetStats}
            onLaunchMistakeDrill={handleLaunchMistakeDrill}
          />
        )}

        {currentTab === 'manage' && (
          <WordManager
            words={words}
            onUpdateWords={handleUpdateWords}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 text-xs text-slate-500 dark:text-slate-400 no-print transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300">NurseTerm</span>
            <span>·</span>
            <span>간호학과 의학용어 가리고 쓰기 타이핑 훈련기</span>
          </div>
          <div className="text-slate-400">
            R4 근육계 및 임상 핵심 의학용어 수록 · 오답 노트 및 통계 지원
          </div>
        </div>
      </footer>
    </div>
  );
}
