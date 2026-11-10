import { WordItem, MistakeRecord, StudyStats } from '../types/vocab';
import { INITIAL_VOCAB_LIST } from '../data/defaultVocab';

const STORAGE_KEYS = {
  WORDS: 'nurseterm_words_v1',
  MISTAKES: 'nurseterm_mistakes_v1',
  STATS: 'nurseterm_stats_v1',
  THEME: 'nurseterm_theme_v1',
  SETTINGS: 'nurseterm_settings_v1',
};

export interface AppSettings {
  instantCheck: boolean;
  lenientTypo: boolean;
  autoSpeak: boolean;
  caseSensitive: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  instantCheck: false, // matches PDF worksheet mode by default
  lenientTypo: false,
  autoSpeak: true,
  caseSensitive: false,
};

const DEFAULT_STATS: StudyStats = {
  totalAttempts: 0,
  correctAttempts: 0,
  streak: 0,
  bestStreak: 0,
  lastStudiedAt: Date.now(),
  chapterStats: {},
  dailyHistory: {},
};

export function loadStoredWords(): WordItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.WORDS);
    if (!raw) return INITIAL_VOCAB_LIST;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_VOCAB_LIST;
  } catch {
    return INITIAL_VOCAB_LIST;
  }
}

export function saveStoredWords(words: WordItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.WORDS, JSON.stringify(words));
  } catch (e) {
    console.error('Failed to save words', e);
  }
}

export function loadStoredMistakes(): MistakeRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MISTAKES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveStoredMistakes(mistakes: MistakeRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.MISTAKES, JSON.stringify(mistakes));
  } catch (e) {
    console.error('Failed to save mistakes', e);
  }
}

export function loadStoredStats(): StudyStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STATS);
    if (!raw) return DEFAULT_STATS;
    return { ...DEFAULT_STATS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_STATS;
  }
}

export function saveStoredStats(stats: StudyStats): void {
  try {
    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
  } catch (e) {
    console.error('Failed to save stats', e);
  }
}

export function loadAppSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveAppSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings', e);
  }
}

export function recordAttemptResult(
  word: WordItem,
  userInput: string,
  isCorrect: boolean,
  currentStats: StudyStats,
  currentMistakes: MistakeRecord[]
): { updatedStats: StudyStats; updatedMistakes: MistakeRecord[] } {
  const todayKey = new Date().toISOString().slice(0, 10);
  const now = Date.now();

  // 1. Update Stats
  const newTotalAttempts = currentStats.totalAttempts + 1;
  const newCorrectAttempts = isCorrect ? currentStats.correctAttempts + 1 : currentStats.correctAttempts;
  const newStreak = isCorrect ? currentStats.streak + 1 : 0;
  const newBestStreak = Math.max(currentStats.bestStreak, newStreak);

  // Chapter stat update
  const chapterName = word.chapter || '기타';
  const prevChapter = currentStats.chapterStats[chapterName] || { totalPracticed: 0, correct: 0 };
  const updatedChapterStats = {
    ...currentStats.chapterStats,
    [chapterName]: {
      totalPracticed: prevChapter.totalPracticed + 1,
      correct: prevChapter.correct + (isCorrect ? 1 : 0),
    },
  };

  // Daily history
  const prevDaily = currentStats.dailyHistory[todayKey] || { attempts: 0, correct: 0 };
  const updatedDaily = {
    ...currentStats.dailyHistory,
    [todayKey]: {
      attempts: prevDaily.attempts + 1,
      correct: prevDaily.correct + (isCorrect ? 1 : 0),
    },
  };

  const updatedStats: StudyStats = {
    totalAttempts: newTotalAttempts,
    correctAttempts: newCorrectAttempts,
    streak: newStreak,
    bestStreak: newBestStreak,
    lastStudiedAt: now,
    chapterStats: updatedChapterStats,
    dailyHistory: updatedDaily,
  };

  // 2. Update Mistakes
  let updatedMistakes = [...currentMistakes];
  const existingIdx = updatedMistakes.findIndex((m) => m.wordId === word.id);

  if (isCorrect) {
    if (existingIdx !== -1) {
      // If answered correctly in mistake mode, mark as mastered or decrement error status
      // We don't remove immediately so they can see progress, but flag isMastered if streak improves
      updatedMistakes[existingIdx] = {
        ...updatedMistakes[existingIdx],
        isMastered: true,
      };
    }
  } else {
    if (existingIdx !== -1) {
      updatedMistakes[existingIdx] = {
        ...updatedMistakes[existingIdx],
        userAttempt: userInput,
        timestamp: now,
        errorCount: updatedMistakes[existingIdx].errorCount + 1,
        isMastered: false,
      };
    } else {
      updatedMistakes.unshift({
        id: `mistake_${Date.now()}_${word.id}`,
        wordId: word.id,
        korean: word.korean,
        correctEnglish: word.english,
        userAttempt: userInput,
        timestamp: now,
        errorCount: 1,
        isMastered: false,
        category: word.category,
        chapter: word.chapter,
      });
    }
  }

  saveStoredStats(updatedStats);
  saveStoredMistakes(updatedMistakes);

  return { updatedStats, updatedMistakes };
}
