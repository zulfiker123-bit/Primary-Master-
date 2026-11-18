import React, { useEffect, useMemo, useState } from 'react';
import { BookOpenCheck, CheckCircle2, ExternalLink, X } from 'lucide-react';
import {
  FLN_INDICATORS_BY_CLASS,
  FLN_LEVEL_META,
  FLN_MONTHS,
  FlnLevel,
  FlnMonthlyCheckEntry,
  FlnStudentRecord,
  getMonthTargetForClass,
} from '../data/flnFramework';
import { Student } from '../types';
import { toBanglaDigit } from '../utils/bangla';
import {
  computeSuggestedMathScore,
  evaluateFlnEntryOverall,
} from '../utils/flnStudentSync';

interface StudentFlnModalProps {
  student: Student | null;
  flnRecord: FlnStudentRecord | undefined;
  initialMonthIndex: number;
  onClose: () => void;
  onSaveMonthEntry: (student: Student, monthIndex: number, entry: FlnMonthlyCheckEntry) => void;
  onOpenFullFlnPage: () => void;
}

const LEVELS: FlnLevel[] = ['mastered', 'developing', 'remedial'];

export const StudentFlnModal: React.FC<StudentFlnModalProps> = ({
  student,
  flnRecord,
  initialMonthIndex,
  onClose,
  onSaveMonthEntry,
  onOpenFullFlnPage,
}) => {
  const [monthIndex, setMonthIndex] = useState(initialMonthIndex);

  useEffect(() => {
    setMonthIndex(initialMonthIndex);
  }, [initialMonthIndex, student?.id]);

  const classLevel = student?.classLevel || 'তৃতীয় শ্রেণি';
  const indicators = useMemo(
    () => FLN_INDICATORS_BY_CLASS[classLevel] || FLN_INDICATORS_BY_CLASS['তৃতীয় শ্রেণি'],
    [classLevel]
  );
  const monthTarget = useMemo(
    () => getMonthTargetForClass(monthIndex, classLevel),
    [monthIndex, classLevel]
  );

  const existingEntry = flnRecord?.months[String(monthIndex)];

  const [readingWpm, setReadingWpm] = useState<number>(monthTarget.readingWpmGoal);
  const [mathScore, setMathScore] = useState<number>(68);
  const [mathScoreManual, setMathScoreManual] = useState<boolean>(false);
  const [indicatorMap, setIndicatorMap] = useState<Record<string, FlnLevel>>({});
  const [remark, setRemark] = useState<string>('');

  useEffect(() => {
    if (!student) return;
    if (existingEntry) {
      setReadingWpm(existingEntry.readingWpm ?? monthTarget.readingWpmGoal);
      setMathScore(
        existingEntry.mathScore ??
          computeSuggestedMathScore(existingEntry.indicators || {}, classLevel)
      );
      setMathScoreManual(Boolean(existingEntry.mathScoreManual));
      setIndicatorMap({ ...existingEntry.indicators });
      setRemark(existingEntry.remark || '');
    } else {
      setReadingWpm(monthTarget.readingWpmGoal);
      const defaults: Record<string, FlnLevel> = {};
      indicators.forEach((ind) => {
        defaults[ind.id] = 'developing';
      });
      setIndicatorMap(defaults);
      setMathScore(computeSuggestedMathScore(defaults, classLevel));
      setMathScoreManual(false);
      setRemark('');
    }
  }, [student, monthIndex, existingEntry, indicators, classLevel, monthTarget.readingWpmGoal]);

  if (!student) return null;

  const previewSummary = evaluateFlnEntryOverall(
    { readingWpm, mathScore, mathScoreManual, indicators: indicatorMap, remark },
    classLevel
  );

  const handleIndicatorChange = (indicatorId: string, domain: string, lvl: FlnLevel) => {
    const nextMap = { ...indicatorMap, [indicatorId]: lvl };
    setIndicatorMap(nextMap);
    if (domain === 'গণিত' && !mathScoreManual) {
      setMathScore(computeSuggestedMathScore(nextMap, classLevel));
    }
  };

  const handleMarkAllMastered = () => {
    const nextMap: Record<string, FlnLevel> = {};
    indicators.forEach((ind) => {
      nextMap[ind.id] = 'mastered';
    });
    setIndicatorMap(nextMap);
    setReadingWpm((prev) => Math.max(prev || 0, monthTarget.readingWpmGoal));
    setMathScore((prev) =>
      mathScoreManual
        ? Math.max(prev || 0, 90)
        : computeSuggestedMathScore(nextMap, classLevel)
    );
    if (!remark.trim()) {
      setRemark('প্রান্তিক যোগ্যতা অর্জিত');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveMonthEntry(student, monthIndex, {
      readingWpm: Math.max(0, Number(readingWpm) || 0),
      mathScore: Math.max(0, Math.min(100, Number(mathScore) || 0)),
      mathScoreManual,
      indicators: indicatorMap,
      remark: remark.trim(),
    });
    onClose();
  };

  return (
    <div
      className="no-print fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="student-fln-modal-title"
    >
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl border border-slate-200 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 bg-slate-50/70">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 shrink-0">
              <BookOpenCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h3 id="student-fln-modal-title" className="text-base sm:text-lg font-bold text-slate-900 truncate">
                {student.name} — FLN মূল্যায়ন ও প্রোফাইল
              </h3>
              <p className="text-xs text-slate-500">
                {student.classLevel} · রোল: {toBanglaDigit(student.roll)} · {student.section}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="বন্ধ করুন"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/70 hover:text-slate-700 shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 space-y-5">
          {/* 12-Month Overview Strip */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold text-slate-700">
                ১২ মাসের FLN অবস্থা (মাস নির্বাচন করুন)
              </span>
              <button
                type="button"
                onClick={onOpenFullFlnPage}
                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:underline whitespace-nowrap"
              >
                <span>মাসিক FLN পাতায় যান</span>
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
              {FLN_MONTHS.map((m) => {
                const entry = flnRecord?.months[String(m.index)];
                const isSelected = monthIndex === m.index;
                const evalMonth = entry ? evaluateFlnEntryOverall(entry, classLevel) : null;
                const meta = evalMonth ? FLN_LEVEL_META[evalMonth.overall] : null;
                return (
                  <button
                    key={m.index}
                    type="button"
                    onClick={() => setMonthIndex(m.index)}
                    className={`rounded-xl border px-2 py-1.5 text-center transition-colors ${
                      isSelected
                        ? 'border-emerald-700 bg-[#0F2922] text-white'
                        : 'border-slate-200 bg-slate-50/70 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="text-[11px] font-bold">{m.short}</div>
                    <div
                      className={`text-[10px] mt-0.5 font-semibold ${
                        isSelected
                          ? 'text-emerald-200'
                          : meta
                          ? meta.textClass
                          : 'text-slate-400'
                      }`}
                    >
                      {meta ? `${meta.symbol} ${meta.shortLabel}` : '— বাকি'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Month Target Info */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 space-y-1 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold text-slate-900">
                {FLN_MONTHS[monthIndex]?.name} মাসের FLN লক্ষ্যমাত্রা
              </span>
              <span className="font-semibold text-emerald-800 tabular-nums">
                পঠন লক্ষ্য: {toBanglaDigit(monthTarget.readingWpmGoal)} শব্দ/মিনিট
              </span>
            </div>
            <p className="text-slate-600">
              বাংলা: {monthTarget.literacyBanglaTarget} · গণিত: {monthTarget.numeracyMathTarget}
            </p>
          </div>

          {/* Metrics Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                পঠন গতি (শব্দ/মিনিট - WPM)
              </label>
              <input
                type="number"
                min={0}
                max={200}
                value={readingWpm}
                onChange={(e) => setReadingWpm(Number(e.target.value) || 0)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold tabular-nums focus:border-emerald-700 focus:outline-none"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  গণিত সংখ্যাবোধ ও দক্ষতা (%)
                </label>
                {mathScoreManual ? (
                  <button
                    type="button"
                    onClick={() => {
                      setMathScoreManual(false);
                      setMathScore(computeSuggestedMathScore(indicatorMap, classLevel));
                    }}
                    className="text-[11px] font-semibold text-emerald-700 hover:underline"
                  >
                    অটো % বসান
                  </button>
                ) : (
                  <span className="text-[10px] font-semibold text-emerald-700">
                    সূচক থেকে অটো %
                  </span>
                )}
              </div>
              <input
                type="number"
                min={0}
                max={100}
                value={mathScore}
                onChange={(e) => {
                  setMathScoreManual(true);
                  setMathScore(Math.min(100, Math.max(0, Number(e.target.value) || 0)));
                }}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold tabular-nums focus:border-emerald-700 focus:outline-none"
              />
            </div>
          </div>

          {/* Indicators */}
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-800">
                সাক্ষরতা ও সংখ্যাজ্ঞান সূচক ({toBanglaDigit(previewSummary.masteredCount)}/
                {toBanglaDigit(previewSummary.totalIndicators)} অর্জিত · অটো:{' '}
                {toBanglaDigit(previewSummary.percent)}%)
              </span>
              <button
                type="button"
                onClick={handleMarkAllMastered}
                className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-100"
              >
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>সব অর্জিত করুন</span>
              </button>
            </div>

            <div className="space-y-2">
              {indicators.map((ind) => {
                const current = indicatorMap[ind.id] || 'developing';
                return (
                  <div
                    key={ind.id}
                    className="rounded-xl border border-slate-200 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900">
                        {ind.domain} ({ind.competencyCode}) — {ind.title}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{ind.targetBenchmark}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {LEVELS.map((lvl) => {
                        const meta = FLN_LEVEL_META[lvl];
                        const active = current === lvl;
                        return (
                          <button
                            key={lvl}
                            type="button"
                            onClick={() => handleIndicatorChange(ind.id, ind.domain, lvl)}
                            className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-colors whitespace-nowrap ${
                              active
                                ? meta.badgeClass
                                : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                            }`}
                          >
                            {meta.symbol} {meta.shortLabel}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Remark */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              শিক্ষকের মন্তব্য (ঐচ্ছিক)
            </label>
            <input
              type="text"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="যেমন: পঠন সাবলীল, নিয়মিত অনুশীলন প্রয়োজন..."
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <div className="text-xs font-semibold text-slate-600 space-y-0.5">
              <div>
                সর্বমোট অবস্থা:{' '}
                <span className={FLN_LEVEL_META[previewSummary.overall].textClass}>
                  {FLN_LEVEL_META[previewSummary.overall].symbol}{' '}
                  {FLN_LEVEL_META[previewSummary.overall].label} (
                  {toBanglaDigit(previewSummary.percent)}%)
                </span>
              </div>
              <div className="text-[11px] text-slate-500 tabular-nums">
                বাংলা: {toBanglaDigit(previewSummary.domainPercents['বাংলা'])}% · English:{' '}
                {toBanglaDigit(previewSummary.domainPercents.English)}% · গণিত:{' '}
                {toBanglaDigit(previewSummary.domainPercents['গণিত'])}%
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                বাতিল
              </button>
              <button
                type="submit"
                className="rounded-xl bg-[#0F2922] px-5 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-emerald-900"
              >
                FLN সংরক্ষণ করুন
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
