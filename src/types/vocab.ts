export interface WordItem {
  id: string;
  korean: string;
  english: string;
  aliases?: string[];
  category: string;
  chapter: string;
  clinicalNotes?: string;
  pronunciation?: string;
  isCustom?: boolean;
}

export interface MistakeRecord {
  id: string;
  wordId: string;
  korean: string;
  correctEnglish: string;
  userAttempt: string;
  timestamp: number;
  errorCount: number;
  isMastered: boolean;
  category: string;
  chapter: string;
  studentNote?: string;
}

export interface ChapterStat {
  totalPracticed: number;
  correct: number;
}

export interface StudyStats {
  totalAttempts: number;
  correctAttempts: number;
  streak: number;
  bestStreak: number;
  lastStudiedAt: number;
  chapterStats: Record<string, ChapterStat>;
  dailyHistory: Record<string, { attempts: number; correct: number }>;
}

export type ViewTab = 'sheet' | 'card' | 'mistakes' | 'stats' | 'manage';
