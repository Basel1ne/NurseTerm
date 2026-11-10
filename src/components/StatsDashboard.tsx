import React from 'react';
import { StudyStats, MistakeRecord, WordItem } from '../types/vocab';
import {
  Trophy,
  Flame,
  CheckCircle2,
  BarChart3,
  RotateCcw,
  BookOpen,
  Calendar
} from 'lucide-react';

interface StatsDashboardProps {
  stats: StudyStats;
  mistakes: MistakeRecord[];
  words: WordItem[];
  onResetStats: () => void;
  onLaunchMistakeDrill: (wordIds: string[]) => void;
}

export const StatsDashboard: React.FC<StatsDashboardProps> = ({
  stats,
  mistakes,
  words,
  onResetStats,
  onLaunchMistakeDrill,
}) => {
  const overallAccuracy =
    stats.totalAttempts > 0
      ? Math.round((stats.correctAttempts / stats.totalAttempts) * 100)
      : 0;

  // Mastered words count
  const masteredMistakesCount = mistakes.filter((m) => m.isMastered).length;
  const unresolvedMistakesCount = mistakes.filter((m) => !m.isMastered).length;

  // Most frequent mistakes
  const topMistakes = [...mistakes]
    .sort((a, b) => b.errorCount - a.errorCount)
    .slice(0, 5);

  // Group words by chapter to calculate chapter mastery
  const chapters = Array.from(new Set(words.map((w) => w.chapter)));

  // Generate last 7 days chart data
  const last7Days: { dateStr: string; label: string; attempts: number; correct: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    const label = `${d.getMonth() + 1}/${d.getDate()} (${dayNames[d.getDay()]})`;
    const rec = stats.dailyHistory[key] || { attempts: 0, correct: 0 };
    last7Days.push({
      dateStr: key,
      label,
      attempts: rec.attempts,
      correct: rec.correct,
    });
  }

  const maxDailyAttempts = Math.max(1, ...last7Days.map((d) => d.attempts));

  return (
    <div className="space-y-6">
      {/* Top Welcome & KPI strip */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              학습 통계 & 성취도 대시보드
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              간호 의학용어 타이핑 정확도, 연속 정답 기록, 영역별 숙련도를 실시간 분석합니다.
            </p>
          </div>

          <button
            onClick={() => {
              if (confirm('학습 통계를 초기화하시겠습니까? (오답 노트 기록은 유지됩니다)')) {
                onResetStats();
              }
            }}
            className="text-xs text-slate-400 hover:text-rose-600 flex items-center gap-1.5 transition-colors self-start sm:self-auto cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>통계 초기화</span>
          </button>
        </div>

        {/* 4 Primary KPI metric cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Accuracy */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span>종합 정답률</span>
              <Trophy className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-teal-600 dark:text-teal-400">
              {overallAccuracy}%
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-mono tabular-nums">
              {stats.correctAttempts} / {stats.totalAttempts} 회 정답
            </div>
          </div>

          {/* 2. Streak */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span>현재 스트릭</span>
              <Flame className="w-4 h-4 text-rose-500 fill-rose-500" />
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {stats.streak} <span className="text-sm font-normal text-slate-400">연속</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-mono tabular-nums">
              최고 기록: {stats.bestStreak} 회
            </div>
          </div>

          {/* 3. Total Practiced */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span>누적 타이핑</span>
              <BarChart3 className="w-4 h-4 text-teal-500" />
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {stats.totalAttempts} <span className="text-sm font-normal text-slate-400">회</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-mono tabular-nums">
              오답 발생: {stats.totalAttempts - stats.correctAttempts} 회
            </div>
          </div>

          {/* 4. Mastery Ratio */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span>오답 극복</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
              {masteredMistakesCount}{' '}
              <span className="text-xs font-normal text-slate-400">
                / {mistakes.length} 마스터
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-mono tabular-nums">
              미해결 오답: {unresolvedMistakesCount} 개
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chapter-by-Chapter Mastery Breakdown */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-teal-600" />
              <span>영역별 학습 숙련도</span>
            </h3>
            <span className="text-xs text-slate-400">진행도 및 정답률</span>
          </div>

          <div className="space-y-4">
            {chapters.map((ch) => {
              const chStat = stats.chapterStats[ch] || { totalPracticed: 0, correct: 0 };
              const chWordCount = words.filter((w) => w.chapter === ch).length;
              const chAccuracy =
                chStat.totalPracticed > 0
                  ? Math.round((chStat.correct / chStat.totalPracticed) * 100)
                  : 0;

              return (
                <div key={ch} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {ch}{' '}
                      <span className="text-[11px] font-normal text-slate-400">
                        ({chWordCount}단어)
                      </span>
                    </span>
                    <div className="flex items-center gap-2 font-mono tabular-nums text-slate-500">
                      <span>{chStat.totalPracticed}회 시도</span>
                      <span className="text-slate-300 dark:text-slate-700">·</span>
                      <span className="font-semibold text-teal-600 dark:text-teal-400">
                        {chAccuracy}%
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal-600 transition-all duration-500 rounded-full"
                      style={{ width: `${chAccuracy}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 7-Day Daily Typing Activity Chart */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-600" />
              <span>최근 7일 타이핑 학습량</span>
            </h3>
            <span className="text-xs text-slate-400">일일 연습 빈도</span>
          </div>

          <div className="flex items-end justify-between gap-2 h-44 pt-6 pb-2 border-b border-slate-100 dark:border-slate-800">
            {last7Days.map((day) => {
              const heightPercent = Math.round((day.attempts / maxDailyAttempts) * 100);
              const hasActivity = day.attempts > 0;

              return (
                <div key={day.dateStr} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <div className="font-mono tabular-nums text-[11px] text-slate-500 font-semibold">
                    {hasActivity ? day.attempts : ''}
                  </div>
                  <div className="w-full max-w-[28px] bg-slate-100 dark:bg-slate-800 rounded-t-md h-full flex items-end overflow-hidden">
                    <div
                      className={`w-full transition-all duration-500 rounded-t-md ${
                        hasActivity
                          ? 'bg-teal-500 hover:bg-teal-600'
                          : 'bg-transparent'
                      }`}
                      style={{ height: `${Math.max(hasActivity ? 12 : 0, heightPercent)}%` }}
                      title={`${day.label}: ${day.attempts}회 시도 (${day.correct}회 정답)`}
                    />
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                    {day.label.slice(0, 5)}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-3">
            <span>최근 7일 누적 연습: {last7Days.reduce((acc, cur) => acc + cur.attempts, 0)}회</span>
            <span className="text-teal-600 font-semibold">매일 꾸준한 타이핑이 기억 정착에 가장 효과적입니다</span>
          </div>
        </div>
      </div>

      {/* Weak Spots: Most Frequent Mistakes Top 5 */}
      {topMistakes.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>집중 보완 필요 단어 (최다 오답 TOP 5)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                반복적으로 오타나 오답이 발생한 용어입니다. 스펠링을 다시 한 번 확인하세요.
              </p>
            </div>

            <button
              onClick={() => onLaunchMistakeDrill(topMistakes.map((m) => m.wordId))}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>TOP 5 집중 훈련</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {topMistakes.map((item, index) => (
              <div
                key={item.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-rose-600 dark:text-rose-400 w-5">
                    0{index + 1}
                  </span>
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white text-sm">
                      {item.korean}
                    </div>
                    <div className="font-mono text-teal-700 dark:text-teal-300">
                      {item.correctEnglish}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-slate-400">
                  <span className="text-slate-400 font-mono text-[11px]">
                    {item.chapter} · {item.category}
                  </span>
                  <span className="font-mono font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded">
                    {item.errorCount}회 오답
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
