import React, { useState, useEffect, useRef } from 'react';
import { WordItem, MistakeRecord, StudyStats } from '../types/vocab';
import { checkAnswer } from '../utils/checkAnswer';
import { speakEnglishWord } from '../utils/speech';
import confetti from 'canvas-confetti';
import {
  Volume2,
  Check,
  X,
  Eye,
  EyeOff,
  RotateCcw,
  Printer,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface SheetPracticeProps {
  words: WordItem[];
  onRecordResult: (word: WordItem, input: string, isCorrect: boolean) => void;
  stats: StudyStats;
  mistakes: MistakeRecord[];
}

interface RowState {
  userInput: string;
  checked: boolean;
  revealed: boolean;
  isCorrect?: boolean;
  isNearMatch?: boolean;
  retypedInput?: string; // For "다른 색으로 다시 적기"
}

export const SheetPractice: React.FC<SheetPracticeProps> = ({
  words,
  onRecordResult,
}) => {
  // Available chapters & categories
  const chapters = Array.from(new Set(words.map((w) => w.chapter)));
  const [selectedChapter, setSelectedChapter] = useState<string>(
    chapters.includes('R4 근육계') ? 'R4 근육계' : chapters[0] || '전체'
  );

  const filteredByChapter = words.filter((w) => w.chapter === selectedChapter);
  const categories = ['전체', ...Array.from(new Set(filteredByChapter.map((w) => w.category)))];
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');

  // Filter words for current view
  const displayWords = filteredByChapter.filter(
    (w) => selectedCategory === '전체' || w.category === selectedCategory
  );

  // Row states dictionary keyed by word.id
  const [rowStates, setRowStates] = useState<Record<string, RowState>>({});
  const [isInstantCheck, setIsInstantCheck] = useState<boolean>(false);
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const [onlyShowMistakes, setOnlyShowMistakes] = useState<boolean>(false);
  const [showSummaryModal, setShowSummaryModal] = useState<boolean>(false);
  const [lastBatchScore, setLastBatchScore] = useState<{ total: number; correct: number; wrong: number } | null>(null);

  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Reset category selection when chapter changes
  useEffect(() => {
    setSelectedCategory('전체');
  }, [selectedChapter]);

  // Handle typing input
  const handleInputChange = (wordId: string, val: string) => {
    setRowStates((prev) => ({
      ...prev,
      [wordId]: {
        ...(prev[wordId] || { checked: false, revealed: false }),
        userInput: val,
      },
    }));
  };

  const handleRetypeChange = (wordId: string, val: string) => {
    setRowStates((prev) => ({
      ...prev,
      [wordId]: {
        ...(prev[wordId] || { userInput: '', checked: true, revealed: true }),
        retypedInput: val,
      },
    }));
  };

  // Check single row
  const evaluateRow = (word: WordItem, input: string) => {
    const res = checkAnswer(input, word, false);
    setRowStates((prev) => ({
      ...prev,
      [word.id]: {
        ...(prev[word.id] || { userInput: input, revealed: false }),
        checked: true,
        isCorrect: res.isCorrect,
        isNearMatch: res.isNearMatch,
      },
    }));
    onRecordResult(word, input, res.isCorrect);
    return res.isCorrect;
  };

  // Keyboard Enter navigation: jumps to next row in current table
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, wordId: string, currentIndex: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const currentWord = displayWords[currentIndex];
      const state = rowStates[wordId];
      const inputVal = state?.userInput || '';

      if (isInstantCheck) {
        evaluateRow(currentWord, inputVal);
      }

      // Focus next row's input
      const nextWord = displayWords[currentIndex + 1];
      if (nextWord && inputRefs.current[nextWord.id]) {
        inputRefs.current[nextWord.id]?.focus();
      }
    }
  };

  // Toggle reveal for a row
  const toggleReveal = (wordId: string) => {
    setRowStates((prev) => {
      const cur = prev[wordId] || { userInput: '', checked: false, revealed: false };
      return {
        ...prev,
        [wordId]: {
          ...cur,
          revealed: !cur.revealed,
        },
      };
    });
  };

  // Batch grade all displayed words (PDF Exam mode)
  const handleBatchCheckAll = () => {
    let correctCount = 0;
    let wrongCount = 0;
    const nextStates: Record<string, RowState> = { ...rowStates };

    displayWords.forEach((word) => {
      const cur = nextStates[word.id] || { userInput: '', checked: false, revealed: false };
      const inputVal = cur.userInput || '';
      const res = checkAnswer(inputVal, word, false);

      nextStates[word.id] = {
        ...cur,
        checked: true,
        revealed: true, // reveal answer comparison
        isCorrect: res.isCorrect,
        isNearMatch: res.isNearMatch,
      };

      if (res.isCorrect) {
        correctCount++;
      } else {
        wrongCount++;
      }
      onRecordResult(word, inputVal, res.isCorrect);
    });

    setRowStates(nextStates);
    setLastBatchScore({ total: displayWords.length, correct: correctCount, wrong: wrongCount });
    setShowSummaryModal(true);

    if (correctCount === displayWords.length && displayWords.length > 0) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  // Toggle select all checkboxes
  const handleToggleSelectAll = () => {
    const allSelected = displayWords.every((w) => selectedIds[w.id]);
    const next: Record<string, boolean> = { ...selectedIds };
    displayWords.forEach((w) => {
      next[w.id] = !allSelected;
    });
    setSelectedIds(next);
  };

  // Reset entire sheet
  const handleResetSheet = () => {
    if (confirm('현재 입력한 내용을 모두 지우고 다시 시작하시겠습니까?')) {
      const next: Record<string, RowState> = {};
      displayWords.forEach((w) => {
        next[w.id] = { userInput: '', checked: false, revealed: false, retypedInput: '' };
      });
      setRowStates(next);
      setLastBatchScore(null);
    }
  };

  // Toggle reveal all answers
  const handleToggleRevealAll = () => {
    const anyRevealed = displayWords.some((w) => rowStates[w.id]?.revealed);
    const next: Record<string, RowState> = { ...rowStates };
    displayWords.forEach((w) => {
      const cur = next[w.id] || { userInput: '', checked: false, revealed: false };
      next[w.id] = { ...cur, revealed: !anyRevealed };
    });
    setRowStates(next);
  };

  // Filter list if onlyShowMistakes is active
  const wordsToRender = onlyShowMistakes
    ? displayWords.filter((w) => rowStates[w.id]?.checked && !rowStates[w.id]?.isCorrect)
    : displayWords;

  // Group by category if "전체" is selected
  const groupedCategories = selectedCategory === '전체'
    ? Array.from(new Set(wordsToRender.map((w) => w.category)))
    : [selectedCategory];

  // Quick stats for current view
  const completedCount = displayWords.filter((w) => rowStates[w.id]?.checked).length;
  const correctCount = displayWords.filter((w) => rowStates[w.id]?.checked && rowStates[w.id]?.isCorrect).length;
  const accuracy = completedCount > 0 ? Math.round((correctCount / completedCount) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Chapter & Control Toolbar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs no-print">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Chapter Selector */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              챕터 선택
            </span>
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
              {chapters.map((ch) => (
                <button
                  key={ch}
                  onClick={() => setSelectedChapter(ch)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    selectedChapter === ch
                      ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  {ch}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Metrics & Mode Toggles */}
          <div className="flex items-center gap-4 flex-wrap text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <span>진행률</span>
              <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-slate-100">
                {completedCount} / {displayWords.length}
              </span>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <span>정답률</span>
              <span className="font-mono tabular-nums font-semibold text-teal-600 dark:text-teal-400">
                {accuracy}%
              </span>
            </div>

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />

            {/* Instant Check Toggle */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isInstantCheck}
                onChange={(e) => setIsInstantCheck(e.target.checked)}
                className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-3.5 h-3.5"
              />
              <span>타이핑 즉시 자동 채점</span>
            </label>

            {/* Mistakes Only Filter */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyShowMistakes}
                onChange={(e) => setOnlyShowMistakes(e.target.checked)}
                className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 w-3.5 h-3.5"
              />
              <span className={onlyShowMistakes ? 'text-rose-600 dark:text-rose-400 font-semibold' : ''}>
                틀린 문제만 모아보기
              </span>
            </label>
          </div>
        </div>

        {/* Sub-Category Filter Bar */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            {categories.map((cat) => {
              const count = cat === '전체'
                ? filteredByChapter.length
                : filteredByChapter.filter((w) => w.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 text-xs rounded-full transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-teal-600 text-white font-medium shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {cat} <span className="opacity-80 font-mono tabular-nums text-[10px]">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleRevealAll}
              className="px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {displayWords.some((w) => rowStates[w.id]?.revealed) ? (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>정답 모두 가리기</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span>정답 전체 확인</span>
                </>
              )}
            </button>

            <button
              onClick={() => window.print()}
              className="px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
              title="과제 제출용 출력 및 PDF 저장"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>워크시트 인쇄</span>
            </button>

            <button
              onClick={handleResetSheet}
              className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              title="입력 내용 초기화"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Authentic PDF Worksheet Area */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm print-area overflow-hidden">
        {/* PDF-like Header Section */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div>
              <div className="text-xs font-semibold text-teal-600 dark:text-teal-400 tracking-wide uppercase">
                {selectedChapter} | 단어장
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                가리고 쓰기 · Recall practice{' '}
                <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
                  (영문을 가리고 쓰세요)
                </span>
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleBatchCheckAll}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer no-print"
              >
                <Sparkles className="w-4 h-4" />
                <span>전체 채점 및 정답 대조</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tables by Category */}
        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {groupedCategories.map((cat) => {
            const catWords = wordsToRender.filter((w) => w.category === cat);
            if (catWords.length === 0) return null;

            return (
              <div key={cat} className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-teal-600 rounded-sm inline-block" />
                    {cat}
                  </h3>
                  <span className="text-xs text-slate-400 font-mono tabular-nums">
                    총 {catWords.length}문항
                  </span>
                </div>

                <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-800 text-white dark:bg-slate-950 dark:border-b dark:border-slate-800 text-xs font-semibold">
                        <th className="py-3 px-3 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={catWords.every((w) => selectedIds[w.id])}
                            onChange={handleToggleSelectAll}
                            className="rounded border-slate-400 text-teal-500 focus:ring-0 w-3.5 h-3.5"
                          />
                        </th>
                        <th className="py-3 px-4 w-44 md:w-56 font-semibold">우리말</th>
                        <th className="py-3 px-4 min-w-[240px] font-semibold">English (직접 쓰기)</th>
                        <th className="py-3 px-4 w-48 text-center font-semibold">정답 확인</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                      {catWords.map((word, idx) => {
                        const state = rowStates[word.id] || {
                          userInput: '',
                          checked: false,
                          revealed: false,
                          retypedInput: '',
                        };
                        const isEvaluated = state.checked;
                        const isCorrect = state.isCorrect;
                        const isWrong = isEvaluated && !isCorrect;

                        return (
                          <tr
                            key={word.id}
                            className={`transition-colors ${
                              isWrong
                                ? 'bg-rose-50/40 dark:bg-rose-950/20'
                                : isCorrect
                                ? 'bg-emerald-50/30 dark:bg-emerald-950/20'
                                : idx % 2 === 1
                                ? 'bg-slate-50/50 dark:bg-slate-900/40'
                                : 'bg-white dark:bg-slate-900'
                            }`}
                          >
                            {/* Checkbox column matching PDF */}
                            <td className="py-3 px-3 text-center align-middle">
                              <input
                                type="checkbox"
                                checked={!!selectedIds[word.id]}
                                onChange={(e) =>
                                  setSelectedIds((prev) => ({ ...prev, [word.id]: e.target.checked }))
                                }
                                className="rounded border-slate-300 dark:border-slate-700 text-teal-600 focus:ring-0 w-3.5 h-3.5"
                              />
                            </td>

                            {/* Korean Term */}
                            <td className="py-3 px-4 align-middle">
                              <div className="font-medium text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                                <span>{word.korean}</span>
                                {word.clinicalNotes && (
                                  <span
                                    title={word.clinicalNotes}
                                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-help"
                                  >
                                    <HelpCircle className="w-3.5 h-3.5 inline opacity-70" />
                                  </span>
                                )}
                              </div>
                              {word.pronunciation && (
                                <div className="text-[11px] font-mono text-slate-400 dark:text-slate-500 mt-0.5">
                                  {word.pronunciation}
                                </div>
                              )}
                            </td>

                            {/* English Typing Input */}
                            <td className="py-3 px-4 align-middle">
                              <div className="space-y-1.5">
                                <div className="relative flex items-center">
                                  <input
                                    ref={(el) => {
                                      inputRefs.current[word.id] = el;
                                    }}
                                    type="text"
                                    value={state.userInput}
                                    onChange={(e) => handleInputChange(word.id, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(e, word.id, idx)}
                                    onBlur={() => {
                                      if (isInstantCheck && state.userInput.trim()) {
                                        evaluateRow(word, state.userInput);
                                      }
                                    }}
                                    placeholder="영문 직접 입력 (Enter로 다음 이동)"
                                    autoComplete="off"
                                    spellCheck={false}
                                    className={`w-full px-3 py-1.5 text-sm rounded-md border transition-all outline-none font-mono ${
                                      isWrong
                                        ? 'border-rose-400 bg-rose-50/50 text-rose-900 dark:bg-rose-950/40 dark:text-rose-200 dark:border-rose-800'
                                        : isCorrect
                                        ? 'border-emerald-400 bg-emerald-50/50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800'
                                        : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-teal-500 focus:ring-1 focus:ring-teal-500'
                                    }`}
                                  />

                                  {/* Row Status Indicator */}
                                  {isEvaluated && (
                                    <div className="absolute right-2.5 flex items-center gap-1.5">
                                      {isCorrect ? (
                                        <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                      ) : (
                                        <X className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                                      )}
                                    </div>
                                  )}
                                </div>

                                {/* PDF Instruction Implementation: "틀린 용어는 다른 색으로 다시 적으세요" */}
                                {isWrong && (
                                  <div className="p-2 rounded bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-xs">
                                    <div className="flex items-center justify-between text-amber-800 dark:text-amber-300 mb-1">
                                      <span className="font-semibold flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3 text-amber-600" />
                                        오답 피드백: 정답은{' '}
                                        <span className="font-mono font-bold text-teal-700 dark:text-teal-400">
                                          {word.english}
                                        </span>
                                      </span>
                                      <button
                                        onClick={() => speakEnglishWord(word.english)}
                                        className="text-amber-700 dark:text-amber-300 hover:text-amber-900 p-0.5 rounded cursor-pointer"
                                        title="정답 발음 듣기"
                                      >
                                        <Volume2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>

                                    {/* Re-typing input in distinct color */}
                                    <div className="flex items-center gap-2 mt-1.5">
                                      <span className="text-[11px] text-amber-700 dark:text-amber-400 whitespace-nowrap">
                                        자기점검 재작성:
                                      </span>
                                      <input
                                        type="text"
                                        value={state.retypedInput || ''}
                                        onChange={(e) => handleRetypeChange(word.id, e.target.value)}
                                        placeholder="정답을 보고 다시 타이핑하세요"
                                        className="w-full px-2.5 py-1 text-xs rounded border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-900 text-teal-800 dark:text-teal-200 font-mono font-medium focus:outline-none focus:border-teal-500"
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* Answer Reveal & Check Column */}
                            <td className="py-3 px-4 text-center align-middle">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => toggleReveal(word.id)}
                                  className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                  title={state.revealed ? '정답 가리기' : '정답 확인'}
                                >
                                  {state.revealed ? (
                                    <EyeOff className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                                  ) : (
                                    <Eye className="w-4 h-4" />
                                  )}
                                </button>

                                <button
                                  onClick={() => speakEnglishWord(word.english)}
                                  className="p-1.5 text-slate-500 hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-400 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                  title="발음 듣기"
                                >
                                  <Volume2 className="w-4 h-4" />
                                </button>

                                {state.revealed && (
                                  <div className="text-left font-mono font-semibold text-xs text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/50 px-2 py-1 rounded border border-teal-200 dark:border-teal-900">
                                    {word.english}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>

        {/* Authentic Footnote directly replicated from the user's PDF */}
        <div className="p-6 bg-slate-50 dark:bg-slate-950/70 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              💡 학습 도움말:
            </span>
            <span>
              다 쓴 뒤 앞쪽 표와 대조해 틀린 용어는 다른 색으로 다시 적으세요 (과제 18·19번 자기점검 활용).
            </span>
          </div>
          <div className="text-slate-400 font-mono text-[11px] shrink-0">
            {selectedChapter} | 단어장
          </div>
        </div>
      </div>

      {/* Summary Score Modal after batch check */}
      {showSummaryModal && lastBatchScore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs no-print">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-teal-100 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 mx-auto flex items-center justify-center mb-4">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              채점 결과 확인
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {selectedChapter} {selectedCategory !== '전체' ? `· ${selectedCategory}` : ''}
            </p>

            <div className="grid grid-cols-3 gap-3 my-6">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <div className="text-xs text-slate-500">총 문항</div>
                <div className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                  {lastBatchScore.total}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50">
                <div className="text-xs text-emerald-600 dark:text-emerald-400">정답</div>
                <div className="text-xl font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-300">
                  {lastBatchScore.correct}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50">
                <div className="text-xs text-rose-600 dark:text-rose-400">오답</div>
                <div className="text-xl font-bold font-mono tabular-nums text-rose-700 dark:text-rose-300">
                  {lastBatchScore.wrong}
                </div>
              </div>
            </div>

            <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-6">
              정답률:{' '}
              <span className="font-mono text-lg text-teal-600 dark:text-teal-400">
                {Math.round((lastBatchScore.correct / lastBatchScore.total) * 100)}%
              </span>
            </div>

            <div className="flex items-center gap-3">
              {lastBatchScore.wrong > 0 && (
                <button
                  onClick={() => {
                    setOnlyShowMistakes(true);
                    setShowSummaryModal(false);
                  }}
                  className="flex-1 py-2.5 px-4 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer"
                >
                  틀린 문제만 다시 풀기
                </button>
              )}
              <button
                onClick={() => setShowSummaryModal(false)}
                className="flex-1 py-2.5 px-4 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white text-white transition-colors cursor-pointer"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
