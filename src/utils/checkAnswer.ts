import { WordItem } from '../types/vocab';

export interface DiffSegment {
  char: string;
  type: 'correct' | 'wrong' | 'missing' | 'extra';
}

export interface CheckResult {
  isCorrect: boolean;
  isNearMatch: boolean;
  matchedName: string;
  cleanInput: string;
  similarity: number; // 0 to 1
  diffs: DiffSegment[];
}

// Levenshtein distance for typo tolerance and difference analysis
export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1, // deletion
          dp[i][j - 1] + 1, // insertion
          dp[i - 1][j - 1] + 1 // substitution
        );
      }
    }
  }
  return dp[m][n];
}

export function normalizeText(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .replace(/[\s\-_]+/g, ' ')
    .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '')
    .trim();
}

export function buildCharacterDiff(input: string, target: string): DiffSegment[] {
  const diffs: DiffSegment[] = [];
  const inNorm = input.trim();
  const tgt = target.trim();
  const maxLen = Math.max(inNorm.length, tgt.length);

  for (let i = 0; i < maxLen; i++) {
    const inChar = inNorm[i];
    const tgtChar = tgt[i];

    if (inChar === undefined) {
      diffs.push({ char: tgtChar, type: 'missing' });
    } else if (tgtChar === undefined) {
      diffs.push({ char: inChar, type: 'extra' });
    } else if (inChar.toLowerCase() === tgtChar.toLowerCase()) {
      diffs.push({ char: inChar, type: 'correct' });
    } else {
      diffs.push({ char: inChar, type: 'wrong' });
    }
  }

  return diffs;
}

export function checkAnswer(
  userInput: string,
  word: WordItem,
  lenientTypoAllowed: boolean = false
): CheckResult {
  const cleanUser = normalizeText(userInput);
  const candidates = [word.english, ...(word.aliases || [])];

  if (!cleanUser) {
    return {
      isCorrect: false,
      isNearMatch: false,
      matchedName: word.english,
      cleanInput: '',
      similarity: 0,
      diffs: [],
    };
  }

  // 1. Direct match check
  for (const candidate of candidates) {
    const cleanCand = normalizeText(candidate);
    if (cleanUser === cleanCand) {
      return {
        isCorrect: true,
        isNearMatch: false,
        matchedName: candidate,
        cleanInput: cleanUser,
        similarity: 1,
        diffs: buildCharacterDiff(userInput, candidate),
      };
    }
  }

  // 2. Fuzzy / typo analysis
  let bestCandidate = word.english;
  let bestDistance = Infinity;

  for (const candidate of candidates) {
    const cleanCand = normalizeText(candidate);
    const dist = levenshteinDistance(cleanUser, cleanCand);
    if (dist < bestDistance) {
      bestDistance = dist;
      bestCandidate = candidate;
    }
  }

  const targetLength = normalizeText(bestCandidate).length;
  const similarity = Math.max(0, 1 - bestDistance / Math.max(targetLength, cleanUser.length));
  
  // Allow 1 typo for words >= 5 chars, or 2 typos for words >= 10 chars
  const isNear = (targetLength >= 10 && bestDistance <= 2) || (targetLength >= 5 && bestDistance === 1);
  const isCorrect = lenientTypoAllowed ? isNear : false;

  return {
    isCorrect,
    isNearMatch: isNear,
    matchedName: bestCandidate,
    cleanInput: cleanUser,
    similarity,
    diffs: buildCharacterDiff(userInput, bestCandidate),
  };
}
