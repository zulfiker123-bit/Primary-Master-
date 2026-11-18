import {
  FLN_INDICATORS_BY_CLASS,
  FLN_MONTHS,
  FlnDomain,
  FlnLevel,
  FlnMonthlyCheckEntry,
  FlnStudentRecord,
  getMonthTargetForClass,
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

export const ALL_FLN_CLASSES = [
  'প্রাক-প্রাথমিক',
  'প্রথম শ্রেণি',
  'দ্বিতীয় শ্রেণি',
  'তৃতীয় শ্রেণি',
  'চতুর্থ শ্রেণি',
  'পঞ্চম শ্রেণি',
] as const;

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

/**
 * Largest-remainder rounding so percentage splits always sum to 100 when total > 0.
 */
export function allocatePercentagesTo100(counts: number[]): number[] {
  const total = counts.reduce((acc, c) => acc + c, 0);
  if (total <= 0) return counts.map(() => 0);

  const raw = counts.map((c) => (c / total) * 100);
  const floored = raw.map((v) => Math.floor(v));
  let remainder = 100 - floored.reduce((acc, v) => acc + v, 0);

  const order = raw
    .map((v, idx) => ({ idx, frac: v - floored[idx] }))
    .sort((a, b) => b.frac - a.frac);

  for (let i = 0; i < order.length && remainder > 0; i += 1) {
    floored[order[i].idx] += 1;
    remainder -= 1;
  }

  return floored;
}

export interface FlnEntryEvaluation {
  hasEntry: boolean;
  overall: FlnLevel;
  masteredCount: number;
  developingCount: number;
  remedialCount: number;
  totalIndicators: number;
  /** Weighted FLN attainment % (mastered = 100%, developing = 50%, remedial = 0%) */
  percent: number;
  /** Strict % of indicators fully mastered */
  masteryPercent: number;
  domainPercents: Record<FlnDomain, number>;
}

export interface StudentFlnSummary {
  hasData: boolean;
  monthIndex: number;
  monthName: string;
  isFallbackMonth: boolean;
  overall: FlnLevel | null;
  masteredCount: number;
  developingCount: number;
  remedialCount: number;
  totalIndicators: number;
  percent: number;
  masteryPercent: number;
  domainPercents: Record<FlnDomain, number>;
  readingWpm?: number;
  mathScore?: number;
  remark?: string;
}

export function evaluateFlnEntryOverall(
  entry: FlnMonthlyCheckEntry | undefined,
  classLevel: string,
  customIndicatorIds?: string[]
): FlnEntryEvaluation {
  const classIndicators =
    FLN_INDICATORS_BY_CLASS[classLevel] || FLN_INDICATORS_BY_CLASS['তৃতীয় শ্রেণি'];
  const targetIndicators = customIndicatorIds
    ? classIndicators.filter((ind) => customIndicatorIds.includes(ind.id))
    : classIndicators;
  const total = targetIndicators.length;

  const emptyDomains: Record<FlnDomain, number> = {
    'বাংলা': 0,
    English: 0,
    'গণিত': 0,
  };

  if (!entry || total === 0) {
    return {
      hasEntry: false,
      overall: 'remedial',
      masteredCount: 0,
      developingCount: 0,
      remedialCount: total,
      totalIndicators: total,
      percent: 0,
      masteryPercent: 0,
      domainPercents: emptyDomains,
    };
  }

  let mastered = 0;
  let developing = 0;
  let remedial = 0;

  const domainBuckets: Record<FlnDomain, { total: number; scoreSum: number }> = {
    'বাংলা': { total: 0, scoreSum: 0 },
    English: { total: 0, scoreSum: 0 },
    'গণিত': { total: 0, scoreSum: 0 },
  };

  targetIndicators.forEach((ind) => {
    const level = entry.indicators[ind.id];
    const bucket = domainBuckets[ind.domain];
    bucket.total += 1;

    if (level === 'mastered') {
      mastered += 1;
      bucket.scoreSum += 1;
    } else if (level === 'developing') {
      developing += 1;
      bucket.scoreSum += 0.5;
    } else {
      remedial += 1;
    }
  });

  const percent = Math.round(((mastered + developing * 0.5) / total) * 100);
  const masteryPercent = Math.round((mastered / total) * 100);
  const overall: FlnLevel =
    mastered === total
      ? 'mastered'
      : remedial > Math.floor(total / 2)
      ? 'remedial'
      : 'developing';

  const domainPercents: Record<FlnDomain, number> = {
    'বাংলা':
      domainBuckets['বাংলা'].total > 0
        ? Math.round((domainBuckets['বাংলা'].scoreSum / domainBuckets['বাংলা'].total) * 100)
        : 0,
    English:
      domainBuckets.English.total > 0
        ? Math.round((domainBuckets.English.scoreSum / domainBuckets.English.total) * 100)
        : 0,
    'গণিত':
      domainBuckets['গণিত'].total > 0
        ? Math.round((domainBuckets['গণিত'].scoreSum / domainBuckets['গণিত'].total) * 100)
        : 0,
  };

  return {
    hasEntry: true,
    overall,
    masteredCount: mastered,
    developingCount: developing,
    remedialCount: remedial,
    totalIndicators: total,
    percent,
    masteryPercent,
    domainPercents,
  };
}

/**
 * Computes a realistic math score (0..100) automatically from math FLN indicators.
 */
export function computeSuggestedMathScore(
  indicatorsMap: Record<string, FlnLevel>,
  classLevel: string
): number {
  const classIndicators =
    FLN_INDICATORS_BY_CLASS[classLevel] || FLN_INDICATORS_BY_CLASS['তৃতীয় শ্রেণি'];
  const mathInds = classIndicators.filter((ind) => ind.domain === 'গণিত');
  if (mathInds.length === 0) return 70;

  let scoreSum = 0;
  mathInds.forEach((ind) => {
    const lvl = indicatorsMap[ind.id];
    if (lvl === 'mastered') scoreSum += 92;
    else if (lvl === 'developing') scoreSum += 68;
    else scoreSum += 38;
  });

  return Math.round(scoreSum / mathInds.length);
}

/**
 * Automatically merges registered students (`students_list_v1`) into FLN records
 * without duplicating existing students or overwriting recorded months.
 */
export function mergeRegisteredStudentsIntoFlnRecords(
  records: FlnStudentRecord[],
  registeredStudents: Student[],
  dismissedIds: string[] = []
): { nextRecords: FlnStudentRecord[]; addedCount: number; changed: boolean } {
  const dismissedSet = new Set(dismissedIds);
  const nextRecords = records.map((r) => ({ ...r }));
  let addedCount = 0;
  let changed = false;

  registeredStudents.forEach((student) => {
    const expectedId = `fln-imp-${student.id}`;
    if (dismissedSet.has(expectedId) || dismissedSet.has(student.id)) return;

    const existing = findStudentFlnRecord(student, nextRecords);
    if (existing) {
      if (
        existing.id === expectedId &&
        (existing.studentName !== student.name ||
          existing.roll !== student.roll ||
          existing.classLevel !== student.classLevel)
      ) {
        const idx = nextRecords.findIndex((r) => r.id === existing.id);
        if (idx !== -1) {
          nextRecords[idx] = {
            ...existing,
            studentName: student.name,
            roll: student.roll,
            classLevel: student.classLevel,
          };
          changed = true;
        }
      }
      return;
    }

    nextRecords.push({
      id: expectedId,
      classLevel: student.classLevel,
      roll: student.roll,
      studentName: student.name,
      months: {},
    });
    addedCount += 1;
    changed = true;
  });

  return { nextRecords, addedCount, changed };
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
  const emptyDomains: Record<FlnDomain, number> = {
    'বাংলা': 0,
    English: 0,
    'গণিত': 0,
  };

  if (!record || !record.months) {
    return {
      hasData: false,
      monthIndex: preferredMonthIndex,
      monthName: preferredMonthMeta.name,
      isFallbackMonth: false,
      overall: null,
      masteredCount: 0,
      developingCount: 0,
      remedialCount: 0,
      totalIndicators,
      percent: 0,
      masteryPercent: 0,
      domainPercents: emptyDomains,
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
      developingCount: evalRes.developingCount,
      remedialCount: evalRes.remedialCount,
      totalIndicators: evalRes.totalIndicators,
      percent: evalRes.percent,
      masteryPercent: evalRes.masteryPercent,
      domainPercents: evalRes.domainPercents,
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
      developingCount: 0,
      remedialCount: 0,
      totalIndicators,
      percent: 0,
      masteryPercent: 0,
      domainPercents: emptyDomains,
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
    developingCount: evalRes.developingCount,
    remedialCount: evalRes.remedialCount,
    totalIndicators: evalRes.totalIndicators,
    percent: evalRes.percent,
    masteryPercent: evalRes.masteryPercent,
    domainPercents: evalRes.domainPercents,
    readingWpm: fallbackEntry.readingWpm,
    mathScore: fallbackEntry.mathScore,
    remark: fallbackEntry.remark,
  };
}

export interface FlnIndicatorAggregate {
  masteredCount: number;
  developingCount: number;
  remedialCount: number;
  assessedCount: number;
  attainmentPct: number;
  masteryPct: number;
}

export interface FlnClassSummary {
  classLevel: string;
  totalStudents: number;
  assessedCount: number;
  unassessedCount: number;
  assessedPct: number;
  masteredCount: number;
  developingCount: number;
  remedialCount: number;
  masteredPct: number;
  developingPct: number;
  remedialPct: number;
  masteredOfTotalPct: number;
  developingOfTotalPct: number;
  remedialOfTotalPct: number;
  unassessedOfTotalPct: number;
  avgWpm: number;
  targetWpmMetCount: number;
  targetWpmMetPct: number;
  avgMathScore: number;
  banglaAvgPct: number;
  englishAvgPct: number;
  mathIndicatorAvgPct: number;
  overallFlnPct: number;
  indicatorStats: Record<string, FlnIndicatorAggregate>;
}

export interface FlnSchoolSummary {
  classes: FlnClassSummary[];
  totals: Omit<FlnClassSummary, 'classLevel' | 'indicatorStats'>;
}

export function computeFlnClassSummary(
  records: FlnStudentRecord[],
  classLevel: string,
  monthIndex: number
): FlnClassSummary {
  const classStudents = records.filter((r) => r.classLevel === classLevel);
  const indicators =
    FLN_INDICATORS_BY_CLASS[classLevel] || FLN_INDICATORS_BY_CLASS['তৃতীয় শ্রেণি'];
  const monthTarget = getMonthTargetForClass(monthIndex, classLevel);
  const monthKey = String(monthIndex);

  let assessedCount = 0;
  let masteredCount = 0;
  let developingCount = 0;
  let remedialCount = 0;

  let wpmSum = 0;
  let wpmCount = 0;
  let targetWpmMetCount = 0;

  let mathScoreSum = 0;
  let mathScoreCount = 0;

  let banglaSum = 0;
  let englishSum = 0;
  let mathIndSum = 0;
  let overallPctSum = 0;

  const indicatorBuckets: Record<
    string,
    { mastered: number; developing: number; remedial: number; assessed: number }
  > = {};
  indicators.forEach((ind) => {
    indicatorBuckets[ind.id] = { mastered: 0, developing: 0, remedial: 0, assessed: 0 };
  });

  classStudents.forEach((rec) => {
    const entry = rec.months?.[monthKey];
    if (!entry) return;

    assessedCount += 1;
    const evalRes = evaluateFlnEntryOverall(entry, classLevel);

    if (evalRes.overall === 'mastered') masteredCount += 1;
    else if (evalRes.overall === 'developing') developingCount += 1;
    else remedialCount += 1;

    banglaSum += evalRes.domainPercents['বাংলা'];
    englishSum += evalRes.domainPercents.English;
    mathIndSum += evalRes.domainPercents['গণিত'];
    overallPctSum += evalRes.percent;

    if (typeof entry.readingWpm === 'number' && entry.readingWpm > 0) {
      wpmSum += entry.readingWpm;
      wpmCount += 1;
      if (entry.readingWpm >= monthTarget.readingWpmGoal) {
        targetWpmMetCount += 1;
      }
    }

    const effectiveMathScore =
      typeof entry.mathScore === 'number'
        ? entry.mathScore
        : evalRes.domainPercents['গণিত'];
    mathScoreSum += effectiveMathScore;
    mathScoreCount += 1;

    indicators.forEach((ind) => {
      const lvl = entry.indicators?.[ind.id];
      const b = indicatorBuckets[ind.id];
      b.assessed += 1;
      if (lvl === 'mastered') b.mastered += 1;
      else if (lvl === 'developing') b.developing += 1;
      else b.remedial += 1;
    });
  });

  const totalStudents = classStudents.length;
  const unassessedCount = Math.max(0, totalStudents - assessedCount);
  const assessedPct = totalStudents > 0 ? Math.round((assessedCount / totalStudents) * 100) : 0;

  const [masteredPct, developingPct, remedialPct] = allocatePercentagesTo100([
    masteredCount,
    developingCount,
    remedialCount,
  ]);
  const [
    masteredOfTotalPct,
    developingOfTotalPct,
    remedialOfTotalPct,
    unassessedOfTotalPct,
  ] = allocatePercentagesTo100([
    masteredCount,
    developingCount,
    remedialCount,
    unassessedCount,
  ]);

  const indicatorStats: Record<string, FlnIndicatorAggregate> = {};
  indicators.forEach((ind) => {
    const b = indicatorBuckets[ind.id];
    indicatorStats[ind.id] = {
      masteredCount: b.mastered,
      developingCount: b.developing,
      remedialCount: b.remedial,
      assessedCount: b.assessed,
      attainmentPct:
        b.assessed > 0
          ? Math.round(((b.mastered + b.developing * 0.5) / b.assessed) * 100)
          : 0,
      masteryPct: b.assessed > 0 ? Math.round((b.mastered / b.assessed) * 100) : 0,
    };
  });

  return {
    classLevel,
    totalStudents,
    assessedCount,
    unassessedCount,
    assessedPct,
    masteredCount,
    developingCount,
    remedialCount,
    masteredPct,
    developingPct,
    remedialPct,
    masteredOfTotalPct,
    developingOfTotalPct,
    remedialOfTotalPct,
    unassessedOfTotalPct,
    avgWpm: wpmCount > 0 ? Math.round(wpmSum / wpmCount) : 0,
    targetWpmMetCount,
    targetWpmMetPct: assessedCount > 0 ? Math.round((targetWpmMetCount / assessedCount) * 100) : 0,
    avgMathScore:
      mathScoreCount > 0 ? Math.round(mathScoreSum / mathScoreCount) : 0,
    banglaAvgPct: assessedCount > 0 ? Math.round(banglaSum / assessedCount) : 0,
    englishAvgPct: assessedCount > 0 ? Math.round(englishSum / assessedCount) : 0,
    mathIndicatorAvgPct: assessedCount > 0 ? Math.round(mathIndSum / assessedCount) : 0,
    overallFlnPct: assessedCount > 0 ? Math.round(overallPctSum / assessedCount) : 0,
    indicatorStats,
  };
}

export function computeFlnSchoolSummary(
  records: FlnStudentRecord[],
  monthIndex: number
): FlnSchoolSummary {
  const classes = ALL_FLN_CLASSES.map((cls) =>
    computeFlnClassSummary(records, cls, monthIndex)
  );

  let totalStudents = 0;
  let assessedCount = 0;
  let masteredCount = 0;
  let developingCount = 0;
  let remedialCount = 0;
  let targetWpmMetCount = 0;

  let weightedWpmSum = 0;
  let weightedMathSum = 0;
  let weightedBanglaSum = 0;
  let weightedEnglishSum = 0;
  let weightedMathIndSum = 0;
  let weightedOverallSum = 0;
  let wpmWeight = 0;

  classes.forEach((c) => {
    totalStudents += c.totalStudents;
    assessedCount += c.assessedCount;
    masteredCount += c.masteredCount;
    developingCount += c.developingCount;
    remedialCount += c.remedialCount;
    targetWpmMetCount += c.targetWpmMetCount;

    if (c.assessedCount > 0) {
      weightedMathSum += c.avgMathScore * c.assessedCount;
      weightedBanglaSum += c.banglaAvgPct * c.assessedCount;
      weightedEnglishSum += c.englishAvgPct * c.assessedCount;
      weightedMathIndSum += c.mathIndicatorAvgPct * c.assessedCount;
      weightedOverallSum += c.overallFlnPct * c.assessedCount;
    }
    if (c.avgWpm > 0 && c.assessedCount > 0) {
      weightedWpmSum += c.avgWpm * c.assessedCount;
      wpmWeight += c.assessedCount;
    }
  });

  const unassessedCount = Math.max(0, totalStudents - assessedCount);
  const assessedPct = totalStudents > 0 ? Math.round((assessedCount / totalStudents) * 100) : 0;

  const [masteredPct, developingPct, remedialPct] = allocatePercentagesTo100([
    masteredCount,
    developingCount,
    remedialCount,
  ]);
  const [
    masteredOfTotalPct,
    developingOfTotalPct,
    remedialOfTotalPct,
    unassessedOfTotalPct,
  ] = allocatePercentagesTo100([
    masteredCount,
    developingCount,
    remedialCount,
    unassessedCount,
  ]);

  return {
    classes,
    totals: {
      totalStudents,
      assessedCount,
      unassessedCount,
      assessedPct,
      masteredCount,
      developingCount,
      remedialCount,
      masteredPct,
      developingPct,
      remedialPct,
      masteredOfTotalPct,
      developingOfTotalPct,
      remedialOfTotalPct,
      unassessedOfTotalPct,
      avgWpm: wpmWeight > 0 ? Math.round(weightedWpmSum / wpmWeight) : 0,
      targetWpmMetCount,
      targetWpmMetPct:
        assessedCount > 0 ? Math.round((targetWpmMetCount / assessedCount) * 100) : 0,
      avgMathScore: assessedCount > 0 ? Math.round(weightedMathSum / assessedCount) : 0,
      banglaAvgPct: assessedCount > 0 ? Math.round(weightedBanglaSum / assessedCount) : 0,
      englishAvgPct: assessedCount > 0 ? Math.round(weightedEnglishSum / assessedCount) : 0,
      mathIndicatorAvgPct:
        assessedCount > 0 ? Math.round(weightedMathIndSum / assessedCount) : 0,
      overallFlnPct: assessedCount > 0 ? Math.round(weightedOverallSum / assessedCount) : 0,
    },
  };
}
