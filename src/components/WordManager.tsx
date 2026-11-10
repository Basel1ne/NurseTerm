import React, { useState } from 'react';
import { WordItem } from '../types/vocab';
import { speakEnglishWord } from '../utils/speech';
import { INITIAL_VOCAB_LIST } from '../data/defaultVocab';
import {
  Plus,
  Search,
  Volume2,
  Trash2,
  Download,
  Upload,
  RotateCcw,
  BookOpen
} from 'lucide-react';

interface WordManagerProps {
  words: WordItem[];
  onUpdateWords: (updated: WordItem[]) => void;
}

export const WordManager: React.FC<WordManagerProps> = ({ words, onUpdateWords }) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedChapter, setSelectedChapter] = useState<string>('전체');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showBatchModal, setShowBatchModal] = useState<boolean>(false);
  const [batchText, setBatchText] = useState<string>('');
  const [batchChapter, setBatchChapter] = useState<string>('사용자 추가 단어');

  // New Word Form State
  const [newKorean, setNewKorean] = useState<string>('');
  const [newEnglish, setNewEnglish] = useState<string>('');
  const [newAliases, setNewAliases] = useState<string>('');
  const [newChapter, setNewChapter] = useState<string>('R4 근육계');
  const [newCategory, setNewCategory] = useState<string>('사용자 등록');
  const [newNotes, setNewNotes] = useState<string>('');

  const chapters = ['전체', ...Array.from(new Set(words.map((w) => w.chapter)))];

  // Filter words
  const filteredWords = words.filter((w) => {
    const matchesChapter = selectedChapter === '전체' || w.chapter === selectedChapter;
    const query = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !query ||
      w.korean.toLowerCase().includes(query) ||
      w.english.toLowerCase().includes(query) ||
      (w.aliases && w.aliases.some((a) => a.toLowerCase().includes(query)));
    return matchesChapter && matchesQuery;
  });

  // Add single word
  const handleAddWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKorean.trim() || !newEnglish.trim()) return;

    const newItem: WordItem = {
      id: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      korean: newKorean.trim(),
      english: newEnglish.trim(),
      aliases: newAliases
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      chapter: newChapter.trim() || '기타',
      category: newCategory.trim() || '일반',
      clinicalNotes: newNotes.trim() || undefined,
      isCustom: true,
    };

    onUpdateWords([...words, newItem]);
    setShowAddModal(false);
    setNewKorean('');
    setNewEnglish('');
    setNewAliases('');
    setNewNotes('');
  };

  // Batch paste words
  const handleBatchImport = () => {
    if (!batchText.trim()) return;

    const lines = batchText.split('\n');
    const newItems: WordItem[] = [];

    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // Split by comma or tab
      const parts = trimmed.includes('\t')
        ? trimmed.split('\t')
        : trimmed.includes(',')
        ? trimmed.split(',')
        : [trimmed, ''];

      const kor = parts[0]?.trim();
      const eng = parts[1]?.trim();

      if (kor && eng) {
        newItems.push({
          id: `batch_${Date.now()}_${idx}`,
          korean: kor,
          english: eng,
          chapter: batchChapter.trim() || '사용자 추가 단어',
          category: '일괄 등록',
          isCustom: true,
        });
      }
    });

    if (newItems.length > 0) {
      onUpdateWords([...words, ...newItems]);
      setShowBatchModal(false);
      setBatchText('');
      alert(`총 ${newItems.length}개의 단어가 성공적으로 등록되었습니다.`);
    } else {
      alert('등록할 단어 형식을 확인해주세요. (예: 한글, 영문)');
    }
  };

  // Delete word
  const handleDeleteWord = (id: string) => {
    if (confirm('이 단어를 단어장에서 삭제하시겠습니까?')) {
      onUpdateWords(words.filter((w) => w.id !== id));
    }
  };

  // Reset to default
  const handleResetToDefault = () => {
    if (
      confirm(
        '단어장을 PDF 원본 교재 기본 단어로 초기화하시겠습니까? (직접 추가한 단어는 사라집니다)'
      )
    ) {
      onUpdateWords(INITIAL_VOCAB_LIST);
    }
  };

  // Export JSON
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(words, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'nurseterm_vocabulary.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Header and Action toolbar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              단어장 관리 및 추가
            </h2>
            <span className="text-xs font-mono tabular-nums px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
              총 {words.length}단어
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            수업 과제나 시험 대비용 의학용어를 직접 추가하거나 CSV/텍스트로 일괄 등록할 수 있습니다.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>새 단어 추가</span>
          </button>

          <button
            onClick={() => setShowBatchModal(true)}
            className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>일괄 붙여넣기</span>
          </button>

          <button
            onClick={handleExportJSON}
            className="p-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
            title="단어장 JSON 내보내기"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={handleResetToDefault}
            className="p-2 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
            title="PDF 교재 기본 단어로 초기화"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="한글 또는 영문 용어 검색..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-teal-500"
          />
        </div>

        {/* Chapter Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none">
          {chapters.map((ch) => (
            <button
              key={ch}
              onClick={() => setSelectedChapter(ch)}
              className={`px-3 py-1 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
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

      {/* Word Table List */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4 font-semibold w-12 text-center">번호</th>
                <th className="py-3 px-4 font-semibold w-40">우리말 용어</th>
                <th className="py-3 px-4 font-semibold w-64">English (전문 의학용어)</th>
                <th className="py-3 px-4 font-semibold w-40">영역 / 챕터</th>
                <th className="py-3 px-4 font-semibold">임상 설명 및 암기 팁</th>
                <th className="py-3 px-4 font-semibold w-20 text-center">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredWords.map((word, idx) => (
                <tr
                  key={word.id}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-3 px-4 text-center font-mono text-slate-400 tabular-nums">
                    {idx + 1}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                    {word.korean}
                  </td>
                  <td className="py-3 px-4 font-mono font-medium text-teal-700 dark:text-teal-300">
                    <div className="flex items-center gap-2">
                      <span>{word.english}</span>
                      <button
                        onClick={() => speakEnglishWord(word.english)}
                        className="text-slate-400 hover:text-teal-600 cursor-pointer"
                        title="발음 듣기"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {word.aliases && word.aliases.length > 0 && (
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        별칭: {word.aliases.join(', ')}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    <div className="font-medium text-slate-800 dark:text-slate-200">
                      {word.chapter}
                    </div>
                    <div className="text-[10px] text-slate-400">{word.category}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                    {word.clinicalNotes || '-'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleDeleteWord(word.id)}
                      className="p-1 text-slate-300 hover:text-rose-600 transition-colors cursor-pointer"
                      title="단어 삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Single Word Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              새 의학용어 추가
            </h3>

            <form onSubmit={handleAddWord} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  우리말 의학용어 *
                </label>
                <input
                  type="text"
                  value={newKorean}
                  onChange={(e) => setNewKorean(e.target.value)}
                  placeholder="예: 넙다리네갈래근, 대퇴사두근"
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  English / Latin 정답 철자 *
                </label>
                <input
                  type="text"
                  value={newEnglish}
                  onChange={(e) => setNewEnglish(e.target.value)}
                  placeholder="예: Quadriceps femoris"
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    챕터 / 교재
                  </label>
                  <input
                    type="text"
                    value={newChapter}
                    onChange={(e) => setNewChapter(e.target.value)}
                    placeholder="예: R4 근육계, 신경계"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    소분류 카테고리
                  </label>
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="예: 다리근육, 저작근"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  복수 인정 별칭 (콤마 구분)
                </label>
                <input
                  type="text"
                  value={newAliases}
                  onChange={(e) => setNewAliases(e.target.value)}
                  placeholder="예: Quadriceps, Quad muscle"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  임상 설명 또는 암기 메모
                </label>
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  rows={2}
                  placeholder="단어 기능이나 암기 팁을 적어두세요."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-500 hover:text-slate-800 font-semibold"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold"
                >
                  단어 등록
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Batch Import Modal */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              단어 일괄 등록 (CSV / 텍스트 붙여넣기)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              한 줄에 하나씩 <b>[한글 용어, 영문 용어]</b> 형식으로 붙여넣어 주세요. 엑셀이나 텍스트에서 복사한 탭 구분도 지원합니다.
            </p>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  등록할 챕터명
                </label>
                <input
                  type="text"
                  value={batchChapter}
                  onChange={(e) => setBatchChapter(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  단어 목록 붙여넣기
                </label>
                <textarea
                  value={batchText}
                  onChange={(e) => setBatchText(e.target.value)}
                  rows={8}
                  placeholder={`예시:
넙다리곧은근, Rectus femoris
가쪽넓은근, Vastus lateralis
안쪽넓은근, Vastus medialis
중간넓은근, Vastus intermedius`}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBatchModal(false)}
                  className="px-4 py-2 text-slate-500 hover:text-slate-800 font-semibold"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleBatchImport}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold"
                >
                  일괄 등록 실행
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
