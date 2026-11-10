import React, { useState, useEffect, useRef } from 'react';
import { WordItem } from '../types/vocab';
import { checkAnswer, CheckResult } from '../utils/checkAnswer';
import { speakEnglishWord } from '../utils/speech';
import confetti from 'canvas-confetti';
import {
  Volume2,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Shuffle,
  RotateCcw,
  Flame,
  ArrowRight
} from 'lucide-react';

interface CardDrillProps {
  words: WordItem[];
  onRecordResult: (word: WordItem, input: string, isCorrect: boolean) => void;
  onFinishDrill?: () => void;
  presetWordIds?: string[]; // for re-testing mistakes
}

export const CardDrill: React.FC<CardDrillProps> = ({
  words,
  onRecordResult,
  onFinishDrill,
  presetWordIds,
}) => {
  // Filter drill words
  const initialPool = presetWordIds && presetWordIds.length > 0
    ? words.filter((w) => presetWordIds.includes(w.id))
    : words;

  const [drillWords, setDrillWords] = useState<WordItem[]>(initialPool);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [inputVal, setInputVal] = useState<string>('');
  const [lastResult, setLastResult] = useState<CheckResult | null>(null);
  const [hasEvaluated, setHasEvaluated] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [streak, setStreak] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [selectedChapter, setSelectedChapter] = useState<string>('전체');

  const inputRef = useRef<HTMLInputElement | null>(null);

  // Available chapters
  const chapters = ['전체', ...Array.from(new Set(words.map((w) => w.chapter)))];

  // Apply chapter filter
  const applyChapterFilter = (ch: string) => {
    setSelectedChapter(ch);
    const filtered = ch === '전체' ? words : words.filter((w) => w.chapter === ch);
    setDrillWords(filtered);
    setCurrentIndex(0);
    setInputVal('');
    setLastResult(null);
    setHasEvaluated(false);
    setShowHint(false);
    setIsCompleted(false);
  };

  // Shuffle words
  const handleShuffle = () => {
    const shuffled = [...drillWords].sort(() => Math.random() - 0.5);
    setDrillWords(shuffled);
    setCurrentIndex(0);
    setInputVal('');
    setLastResult(null);
    setHasEvaluated(false);
    setShowHint(false);
  };

  const currentWord = drillWords[currentIndex];

  useEffect(() => {
    inputRef.current?.focus();
  }, [currentIndex, isCompleted]);

  // Handle submit answer
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentWord || !inputVal.trim()) return;

    if (hasEvaluated) {
      // If already shown evaluation, enter moves to next
      handleNextCard();
      return;
    }

    const res = checkAnswer(inputVal, currentWord, false);
    setLastResult(res);
    setHasEvaluated(true);

    onRecordResult(currentWord, inputVal, res.isCorrect);

    if (res.isCorrect) {
      setStreak((prev) => prev + 1);
      setCorrectCount((prev) => prev + 1);
      speakEnglishWord(currentWord.english);

      // Auto advance to next card after short delay
      setTimeout(() => {
        handleNextCard();
      }, 900);
    } else {
      setStreak(0);
    }
  };

  const handleNextCard = () => {
    if (currentIndex + 1 >= drillWords.length) {
      setIsCompleted(true);
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
      if (onFinishDrill) onFinishDrill();
    } else {
      setCurrentIndex((prev) => prev + 1);
      setInputVal('');
      setLastResult(null);
      setHasEvaluated(false);
      setShowHint(false);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setInputVal('');
    setLastResult(null);
    setHasEvaluated(false);
    setShowHint(false);
    setIsCompleted(false);
    setStreak(0);
    setCorrectCount(0);
  };

  if (!currentWord || drillWords.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl p-12 text-center border border-slate-200 dark:border-slate-800">
        <p className="text-slate-600 dark:text-slate-400 text-sm">연습할 단어가 없습니다.</p>
        <button
          onClick={() => applyChapterFilter('전체')}
          className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg text-xs font-semibold cursor-pointer"
        >
          전체 단어로 시작
        </button>
      </div>
    );
  }

  // Generate letter clue
  const getLetterClue = (english: string) => {
    return english
      .split(' ')
      .map((word) => `${word[0]}${'_'.repeat(Math.max(1, word.length - 1))}`)
      .join(' ');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Filter and Info Strip */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-500 font-semibold">범위:</span>
          <div className="flex items-center gap-1">
            {chapters.slice(0, 4).map((ch) => (
              <button
                key={ch}
                onClick={() => applyChapterFilter(ch)}
                className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  selectedChapter === ch
                    ? 'bg-teal-600 text-white font-semibold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {ch}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold font-mono tabular-nums">
            <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
            <span>{streak} 연속</span>
          </div>

          <button
            onClick={handleShuffle}
            className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            title="단어 순서 섞기"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>셔플</span>
          </button>
        </div>
      </div>

      {/* Main Flashcard Stage */}
      {!isCompleted ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md p-8 md:p-12 relative overflow-hidden">
          {/* Top Progress bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full bg-teal-600 transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / drillWords.length) * 100}%` }}
            />
          </div>

          {/* Card Header metadata */}
          <div className="flex items-center justify-between text-xs text-slate-400 mb-8">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-teal-600 dark:text-teal-400">
                {currentWord.chapter}
              </span>
              <span>·</span>
              <span>{currentWord.category}</span>
            </div>
            <div className="font-mono tabular-nums">
              {currentIndex + 1} / {drillWords.length}
            </div>
          </div>

          {/* Central Korean Question Display */}
          <div className="text-center my-6">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
              {currentWord.korean}
            </h2>

            {currentWord.clinicalNotes && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-lg mx-auto">
                {currentWord.clinicalNotes}
              </p>
            )}

            {/* Hint Box */}
            {showHint && (
              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-900 text-xs font-mono text-teal-800 dark:text-teal-300 animate-in fade-in">
                <span>철자 힌트: {getLetterClue(currentWord.english)}</span>
              </div>
            )}
          </div>

          {/* Typing Form */}
          <form onSubmit={handleSubmit} className="max-w-xl mx-auto mt-8 space-y-4">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="영문 철자를 직접 입력하세요..."
                autoFocus
                autoComplete="off"
                spellCheck={false}
                disabled={hasEvaluated && lastResult?.isCorrect}
                className={`w-full px-5 py-3.5 text-lg rounded-xl border text-center font-mono tracking-wide transition-all outline-none ${
                  hasEvaluated
                    ? lastResult?.isCorrect
                      ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200'
                      : 'border-rose-500 bg-rose-50/50 text-rose-900 dark:bg-rose-950/40 dark:text-rose-200'
                    : 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20'
                }`}
              />

              <button
                type="button"
                onClick={() => speakEnglishWord(currentWord.english)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 rounded-lg transition-colors cursor-pointer"
                title="발음 듣기"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>

            {/* Evaluation Feedback */}
            {hasEvaluated && (
              <div
                className={`p-4 rounded-xl text-center text-sm animate-in fade-in ${
                  lastResult?.isCorrect
                    ? 'bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800'
                    : 'bg-rose-100/70 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-800'
                }`}
              >
                {lastResult?.isCorrect ? (
                  <div className="flex items-center justify-center gap-2 font-semibold">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <span>완벽합니다! 정답: {currentWord.english}</span>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-center gap-2 font-semibold">
                      <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                      <span>오답입니다!</span>
                    </div>
                    <div className="text-xs">
                      정답:{' '}
                      <span className="font-mono font-bold text-base underline decoration-teal-500 underline-offset-4">
                        {currentWord.english}
                      </span>
                    </div>
                    {currentWord.pronunciation && (
                      <div className="text-[11px] font-mono text-slate-500">
                        발음: {currentWord.pronunciation}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowHint((prev) => !prev)}
                className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>{showHint ? '힌트 숨기기' : '철자 힌트 보기'}</span>
              </button>

              <div className="flex items-center gap-2">
                {!hasEvaluated ? (
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
                  >
                    정답 확인 (Enter)
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleNextCard}
                    className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>다음 단어</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      ) : (
        /* Completed Screen */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md p-10 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-teal-100 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
              드릴 세트 완료!
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              총 {drillWords.length}개 단어 중 {correctCount}개를 맞혔습니다.
            </p>
          </div>

          <div className="text-3xl font-mono font-bold text-teal-600 dark:text-teal-400">
            정답률 {Math.round((correctCount / drillWords.length) * 100)}%
          </div>

          <div className="flex items-center justify-center gap-3 pt-4">
            <button
              onClick={handleRestart}
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>처음부터 다시 연습</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
