import React, { useState } from 'react';
import { MistakeRecord } from '../types/vocab';
import { speakEnglishWord } from '../utils/speech';
import {
  Volume2,
  CheckCircle,
  AlertOctagon,
  Trash2,
  Play,
  RotateCcw,
  BookOpen,
  Filter,
  FileText
} from 'lucide-react';

interface MistakeNotebookProps {
  mistakes: MistakeRecord[];
  onUpdateMistakes: (updated: MistakeRecord[]) => void;
  onLaunchMistakeDrill: (wordIds: string[]) => void;
}

export const MistakeNotebook: React.FC<MistakeNotebookProps> = ({
  mistakes,
  onUpdateMistakes,
  onLaunchMistakeDrill,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'unresolved' | 'mastered'>('unresolved');
  const [sortBy, setSortBy] = useState<'errors' | 'recent'>('errors');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState<string>('');

  // Filtering
  const filtered = mistakes.filter((m) => {
    if (filterMode === 'unresolved') return !m.isMastered;
    if (filterMode === 'mastered') return m.isMastered;
    return true;
  });

  // Sorting
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'errors') return b.errorCount - a.errorCount;
    return b.timestamp - a.timestamp;
  });

  // Toggle master status
  const handleToggleMaster = (id: string) => {
    const updated = mistakes.map((m) =>
      m.id === id ? { ...m, isMastered: !m.isMastered } : m
    );
    onUpdateMistakes(updated);
  };

  // Delete single mistake
  const handleDelete = (id: string) => {
    const updated = mistakes.filter((m) => m.id !== id);
    onUpdateMistakes(updated);
  };

  // Clear all mastered
  const handleClearMastered = () => {
    if (confirm('마스터 완료된 오답 기록을 모두 정리하시겠습니까?')) {
      const updated = mistakes.filter((m) => !m.isMastered);
      onUpdateMistakes(updated);
    }
  };

  // Save student memo
  const handleSaveNote = (id: string) => {
    const updated = mistakes.map((m) =>
      m.id === id ? { ...m, studentNote: noteText } : m
    );
    onUpdateMistakes(updated);
    setEditingNoteId(null);
    setNoteText('');
  };

  const unresolvedCount = mistakes.filter((m) => !m.isMastered).length;
  const masteredCount = mistakes.filter((m) => m.isMastered).length;

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              오답 노트 & 정밀 피드백
            </h2>
            <span className="text-xs font-mono tabular-nums px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 font-semibold">
              미해결 {unresolvedCount}개
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            틀렸던 용어와 오타 패턴을 분석하고, 완벽히 마스터할 때까지 반복 훈련할 수 있습니다.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {unresolvedCount > 0 && (
            <button
              onClick={() => onLaunchMistakeDrill(mistakes.filter((m) => !m.isMastered).map((m) => m.wordId))}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>미해결 오답만 집중 드릴</span>
            </button>
          )}

          {masteredCount > 0 && (
            <button
              onClick={handleClearMastered}
              className="px-3 py-2 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              마스터 완료 항목 정리
            </button>
          )}
        </div>
      </div>

      {/* Filter and Sort Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
        {/* Segmented Filter */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <button
            onClick={() => setFilterMode('unresolved')}
            className={`px-3 py-1.5 font-medium rounded-md transition-colors cursor-pointer ${
              filterMode === 'unresolved'
                ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            미해결 ({unresolvedCount})
          </button>
          <button
            onClick={() => setFilterMode('mastered')}
            className={`px-3 py-1.5 font-medium rounded-md transition-colors cursor-pointer ${
              filterMode === 'mastered'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            마스터 완료 ({masteredCount})
          </button>
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 font-medium rounded-md transition-colors cursor-pointer ${
              filterMode === 'all'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            전체 보기 ({mistakes.length})
          </button>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2 text-slate-500">
          <Filter className="w-3.5 h-3.5" />
          <span>정렬:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-transparent font-medium text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="errors" className="bg-white dark:bg-slate-900">오답 횟수 많은 순</option>
            <option value="recent" className="bg-white dark:bg-slate-900">최근 오답 순</option>
          </select>
        </div>
      </div>

      {/* Mistake Items List */}
      {sorted.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-12 text-center border border-slate-200 dark:border-slate-800">
          <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center mb-3">
            <CheckCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {filterMode === 'unresolved' ? '미해결 오답이 없습니다!' : '해당하는 오답 기록이 없습니다.'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            워크시트나 스피드 카드에서 타이핑 연습 중 틀린 단어가 이곳에 자동 기록됩니다.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sorted.map((item) => (
            <div
              key={item.id}
              className={`p-5 rounded-xl border transition-all ${
                item.isMastered
                  ? 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-80'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300'
              }`}
            >
              {/* Header with tags and errors */}
              <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-teal-600 dark:text-teal-400">
                    {item.chapter}
                  </span>
                  <span>·</span>
                  <span>{item.category}</span>
                </div>

                <div className="flex items-center gap-1 font-mono text-rose-600 dark:text-rose-400 font-bold">
                  <AlertOctagon className="w-3.5 h-3.5" />
                  <span>{item.errorCount}회 틀림</span>
                </div>
              </div>

              {/* Main Terms Comparison */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-lg font-bold text-slate-900 dark:text-white">
                    {item.korean}
                  </div>
                  <button
                    onClick={() => speakEnglishWord(item.correctEnglish)}
                    className="p-1.5 text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 rounded transition-colors cursor-pointer"
                    title="발음 듣기"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Correct vs User attempt */}
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 space-y-1.5 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">정답:</span>
                    <span className="font-bold text-teal-700 dark:text-teal-300">
                      {item.correctEnglish}
                    </span>
                  </div>

                  {item.userAttempt && (
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-700">
                      <span className="text-rose-500">내 입력:</span>
                      <span className="text-rose-600 dark:text-rose-400 line-through">
                        {item.userAttempt}
                      </span>
                    </div>
                  )}
                </div>

                {/* Student Memo / Note */}
                {item.studentNote && editingNoteId !== item.id && (
                  <div className="p-2.5 rounded-lg bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-200 flex items-start justify-between gap-2">
                    <div className="flex items-start gap-1.5">
                      <FileText className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
                      <span>{item.studentNote}</span>
                    </div>
                    <button
                      onClick={() => {
                        setEditingNoteId(item.id);
                        setNoteText(item.studentNote || '');
                      }}
                      className="text-[10px] text-amber-700 hover:underline shrink-0"
                    >
                      수정
                    </button>
                  </div>
                )}

                {/* Memo Editor */}
                {editingNoteId === item.id && (
                  <div className="space-y-1.5 pt-1">
                    <input
                      type="text"
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="나만의 암기 팁이나 실수 원인을 적어두세요..."
                      className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      autoFocus
                    />
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setEditingNoteId(null)}
                        className="px-2 py-1 text-[11px] text-slate-500 hover:text-slate-800"
                      >
                        취소
                      </button>
                      <button
                        onClick={() => handleSaveNote(item.id)}
                        className="px-2.5 py-1 text-[11px] bg-teal-600 text-white rounded font-medium"
                      >
                        저장
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Card Controls */}
              <div className="flex items-center justify-between gap-2 pt-4 mt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                {editingNoteId !== item.id && !item.studentNote && (
                  <button
                    onClick={() => {
                      setEditingNoteId(item.id);
                      setNoteText('');
                    }}
                    className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    <BookOpen className="w-3 h-3" />
                    <span>암기 메모 추가</span>
                  </button>
                )}

                <div className="flex items-center gap-1.5 ml-auto">
                  <button
                    onClick={() => handleToggleMaster(item.id)}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer ${
                      item.isMastered
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {item.isMastered ? (
                      <>
                        <RotateCcw className="w-3 h-3" />
                        <span>미해결로 되돌리기</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-3 h-3 text-emerald-600" />
                        <span>마스터 완료</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded transition-colors cursor-pointer"
                    title="기록 삭제"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
