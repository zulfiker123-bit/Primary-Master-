import {
  FLN_INDICATORS_BY_CLASS,
  FLN_MONTHS,
  FlnLevel,
  FlnMonthlyCheckEntry,
  FlnStudentRecord,
} from '../data/flnFramework';
import { Student } from '../types';

const BN_TO_EN_MAP: Record<string, string> = {
  '০': '0',
  '১': '1',
  '২': '2',
  '৩': '3',
  '৪': '4',
  '৫': '5',
  '৬': '6',
  '৭': '7',
  '৮': '8',
  '৯': '9',
};

export function normalizeRollForMatch(roll: string): string {
  const ascii = String(roll || '')
    .trim()
    .replace(/[০-৯]/g, (ch) => BN_TO_EN_MAP[ch] ?? ch)
    .replace(/^0+/, '');
  return ascii || '0';
}

export function findStudentFlnRecord(
  student: Student,
  records: FlnStudentRecord[]
): FlnStudentRecord | undefined {
  const directId = `fln-imp-${student.id}`;
  const byDirectId = records.find((r) => r.id === directId);
  if (byDirectId) return byDirectId;

  const targetName = student.name.trim().toLowerCase();
  const byName = records.find(
    (r) =>
      r.classLevel === student.classLevel &&
      r.studentName.trim().toLowerCase() === targetName
  );
  if (byName) return byName;

  const targetRoll = normalizeRollForMatch(student.roll);
  if (!targetRoll) return undefined;

  return records.find(
    (r) =>
      r.classLevel === student.classLevel &&
      !r.id.startsWith('fln-imp-') &&
      normalizeRollForMatch(r.roll) === targetRoll
  );
}

export interface StudentFlnSummary {
  hasData: boolean;
  monthIndex: number;
  monthName: string;
  isFallbackMonth: boolean;
  overall: FlnLevel | null;
  masteredCount: number;
  totalIndicators: number;
  percent: number;
  readingWpm?: number;
  mathScore?: number;
  remark?: string;
}

export function evaluateFlnEntryOverall(
  entry: FlnMonthlyCheckEntry | undefined,
  classLevel: string
): { overall: FlnLevel; masteredCount: number; totalIndicators: number; percent: number } {
  const indicators =
    FLN_INDICATORS_BY_CLASS[classLevel] || FLN_INDICATORS_BY_CLASS['তৃতীয় শ্রেণি'];
  const total = indicators.length;

  if (!entry || total === 0) {
    return { overall: 'remedial', masteredCount: 0, totalIndicators: total, percent: 0 };
  }

  let mastered = 0;
  let remedial = 0;

  indicators.forEach((ind) => {
    const level = entry.indicators[ind.id];
    if (level === 'mastered') mastered += 1;
    else if (level === 'remedial' || !level) remedial += 1;
  });

  const percent = Math.round((mastered / total) * 100);
  const overall: FlnLevel =
    mastered === total
      ? 'mastered'
      : remedial > Math.floor(total / 2)
      ? 'remedial'
      : 'developing';

  return { overall, masteredCount: mastered, totalIndicators: total, percent };
}

export function summarizeStudentFlnMonth(
  record: FlnStudentRecord | undefined,
  classLevel: string,
  preferredMonthIndex: number
): StudentFlnSummary {
  const indicators =
    FLN_INDICATORS_BY_CLASS[classLevel] || FLN_INDICATORS_BY_CLASS['তৃতীয় শ্রেণি'];
  const totalIndicators = indicators.length;
  const preferredMonthMeta = FLN_MONTHS[preferredMonthIndex] || FLN_MONTHS[0];

  if (!record || !record.months) {
    return {
      hasData: false,
      monthIndex: preferredMonthIndex,
      monthName: preferredMonthMeta.name,
      isFallbackMonth: false,
      overall: null,
      masteredCount: 0,
      totalIndicators,
      percent: 0,
    };
  }

  const exactEntry = record.months[String(preferredMonthIndex)];
  if (exactEntry) {
    const evalRes = evaluateFlnEntryOverall(exactEntry, classLevel);
    return {
      hasData: true,
      monthIndex: preferredMonthIndex,
      monthName: preferredMonthMeta.name,
      isFallbackMonth: false,
      overall: evalRes.overall,
      masteredCount: evalRes.masteredCount,
      totalIndicators: evalRes.totalIndicators,
      percent: evalRes.percent,
      readingWpm: exactEntry.readingWpm,
      mathScore: exactEntry.mathScore,
      remark: exactEntry.remark,
    };
  }

  const recordedIndices = Object.keys(record.months)
    .map((k) => Number(k))
    .filter((n) => Number.isInteger(n) && n >= 0 && n <= 11 && Boolean(record.months[String(n)]))
    .sort((a, b) => b - a);

  if (recordedIndices.length === 0) {
    return {
      hasData: false,
      monthIndex: preferredMonthIndex,
      monthName: preferredMonthMeta.name,
      isFallbackMonth: false,
      overall: null,
      masteredCount: 0,
      totalIndicators,
      percent: 0,
    };
  }

  const fallbackIdx = recordedIndices[0];
  const fallbackEntry = record.months[String(fallbackIdx)];
  const fallbackMonthMeta = FLN_MONTHS[fallbackIdx] || preferredMonthMeta;
  const evalRes = evaluateFlnEntryOverall(fallbackEntry, classLevel);

  return {
    hasData: true,
    monthIndex: fallbackIdx,
    monthName: fallbackMonthMeta.name,
    isFallbackMonth: true,
    overall: evalRes.overall,
    masteredCount: evalRes.masteredCount,
    totalIndicators: evalRes.totalIndicators,
    percent: evalRes.percent,
    readingWpm: fallbackEntry.readingWpm,
    mathScore: fallbackEntry.mathScore,
    remark: fallbackEntry.remark,
  };
}
