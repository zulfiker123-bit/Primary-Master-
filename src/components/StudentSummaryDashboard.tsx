import React, { useMemo, useState } from 'react';
import { ArrowUpRight, BookOpenCheck, Users } from 'lucide-react';
import { FLN_LEVEL_META, FLN_MONTHS, FlnStudentRecord } from '../data/flnFramework';
import { Student } from '../types';
import { toBanglaDigit } from '../utils/bangla';
import {
  allocatePercentagesTo100,
  findStudentFlnRecord,
  summarizeStudentFlnMonth,
} from '../utils/flnStudentSync';

interface StudentSummaryDashboardProps {
  allStudents: Student[];
  filteredStudents: Student[];
  selectedClass: string;
  selectedSection: string;
  flnRecords?: FlnStudentRecord[];
  selectedFlnMonth?: number;
  onOpenFlnPage?: () => void;
}

type DashboardScope = 'class' | 'all';

export const StudentSummaryDashboard: React.FC<StudentSummaryDashboardProps> = ({
  allStudents,
  filteredStudents,
  selectedClass,
  selectedSection,
  flnRecords = [],
  selectedFlnMonth = new Date().getMonth(),
  onOpenFlnPage,
}) => {
  const [scope, setScope] = useState<DashboardScope>('class');

  const stats = useMemo(() => {
    const source = scope === 'class' ? filteredStudents : allStudents;
    const total = source.length;
    const boys = source.filter((s) => s.gender === 'ছাত্র').length;
    const girls = source.filter((s) => s.gender === 'ছাত্রী').length;
    const boysPct = total > 0 ? Math.round((boys / total) * 100) : 0;
    const girlsPct = total > 0 ? 100 - boysPct : 0;

    let flnMastered = 0;
    let flnDeveloping = 0;
    let flnRemedial = 0;
    let flnPending = 0;
    let wpmSum = 0;
    let wpmCount = 0;
    let flnPctSum = 0;
    let flnAssessed = 0;

    source.forEach((student) => {
      const rec = findStudentFlnRecord(student, flnRecords);
      const summary = summarizeStudentFlnMonth(rec, student.classLevel, selectedFlnMonth);
      if (!summary.hasData || !summary.overall) {
        flnPending += 1;
      } else {
        flnAssessed += 1;
        flnPctSum += summary.percent;
        if (summary.overall === 'mastered') flnMastered += 1;
        else if (summary.overall === 'developing') flnDeveloping += 1;
        else flnRemedial += 1;
        if (typeof summary.readingWpm === 'number' && summary.readingWpm > 0) {
          wpmSum += summary.readingWpm;
          wpmCount += 1;
        }
      }
    });

    const avgWpm = wpmCount > 0 ? Math.round(wpmSum / wpmCount) : 0;
    const avgFlnPct = flnAssessed > 0 ? Math.round(flnPctSum / flnAssessed) : 0;
    const [flnMasteredPct, flnDevelopingPct, flnRemedialPct, flnPendingPct] =
      allocatePercentagesTo100([flnMastered, flnDeveloping, flnRemedial, flnPending]);

    return {
      total,
      boys,
      girls,
      boysPct,
      girlsPct,
      flnMastered,
      flnDeveloping,
      flnRemedial,
      flnPending,
      flnMasteredPct,
      flnDevelopingPct,
      flnRemedialPct,
      flnPendingPct,
      avgWpm,
      avgFlnPct,
    };
  }, [allStudents, filteredStudents, flnRecords, scope, selectedFlnMonth]);

  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const boysStroke = stats.total > 0 ? (stats.boys / stats.total) * circumference : 0;
  const girlsStroke = stats.total > 0 ? (stats.girls / stats.total) * circumference : 0;

  const scopeLabel =
    scope === 'all'
      ? `সকল শ্রেণি · ${toBanglaDigit(allStudents.length)} জন`
      : `${selectedClass} · ${selectedSection}`;

  return (
    <section
      aria-label="শিক্ষার্থী সারসংক্ষেপ ড্যাশবোর্ড"
      className="no-print mb-5 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5"
    >
      {/* Header row with scope toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3.5 mb-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 shrink-0">
            <Users className="h-4.5 w-4.5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              শিক্ষার্থী পরিসংখ্যান ও লিঙ্গভিত্তিক অনুপাত
            </h2>
            <p className="text-xs text-slate-500 truncate">{scopeLabel}</p>
          </div>
        </div>

        <div
          role="group"
          aria-label="পরিসংখ্যান পরিসর নির্বাচন"
          className="inline-flex items-center gap-1 rounded-xl bg-slate-100 p-1 shrink-0"
        >
          <button
            type="button"
            onClick={() => setScope('class')}
            aria-pressed={scope === 'class'}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              scope === 'class'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            নির্বাচিত শ্রেণি ({toBanglaDigit(filteredStudents.length)})
          </button>
          <button
            type="button"
            onClick={() => setScope('all')}
            aria-pressed={scope === 'all'}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              scope === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            সকল শ্রেণি ({toBanglaDigit(allStudents.length)})
          </button>
        </div>
      </div>

      {/* Main Content: 3 KPI metrics + SVG Gender Distribution Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
        {/* KPI Stat Cells */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 rounded-xl bg-slate-50/70 border border-slate-200/80">
          <div className="p-4">
            <p className="text-xs font-medium text-slate-500">মোট শিক্ষার্থী</p>
            <p className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums">
              {toBanglaDigit(stats.total)}
              <span className="ml-1 text-xs font-medium text-slate-500">জন</span>
            </p>
            <p className="mt-1 text-xs text-slate-500 tabular-nums">
              বিদ্যালয়ে মোট: {toBanglaDigit(allStudents.length)} জন
            </p>
          </div>

          <div className="p-4">
            <p className="text-xs font-medium text-slate-500">মোট ছাত্র</p>
            <p className="mt-1 text-2xl sm:text-3xl font-bold text-blue-700 tabular-nums">
              {toBanglaDigit(stats.boys)}
              <span className="ml-1 text-xs font-medium text-slate-500">জন</span>
            </p>
            <p className="mt-1 text-xs font-medium text-blue-700 tabular-nums">
              শতকরা হার: {toBanglaDigit(stats.boysPct)}%
            </p>
          </div>

          <div className="p-4">
            <p className="text-xs font-medium text-slate-500">মোট ছাত্রী</p>
            <p className="mt-1 text-2xl sm:text-3xl font-bold text-emerald-700 tabular-nums">
              {toBanglaDigit(stats.girls)}
              <span className="ml-1 text-xs font-medium text-slate-500">জন</span>
            </p>
            <p className="mt-1 text-xs font-medium text-emerald-700 tabular-nums">
              শতকরা হার: {toBanglaDigit(stats.girlsPct)}%
            </p>
          </div>
        </div>

        {/* Gender Distribution Donut & Bar Visualization */}
        <div className="lg:col-span-5 flex items-center gap-4 sm:gap-5">
          <div className="relative h-24 w-24 shrink-0">
            <svg
              viewBox="0 0 100 100"
              className="h-full w-full -rotate-90"
              role="img"
              aria-label={`ছাত্র ${stats.boysPct} শতাংশ এবং ছাত্রী ${stats.girlsPct} শতাংশ`}
            >
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="12"
              />
              {stats.total > 0 && stats.boys > 0 && (
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="12"
                  strokeDasharray={`${boysStroke} ${circumference}`}
                  strokeDashoffset={0}
                />
              )}
              {stats.total > 0 && stats.girls > 0 && (
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke="#059669"
                  strokeWidth="12"
                  strokeDasharray={`${girlsStroke} ${circumference}`}
                  strokeDashoffset={-boysStroke}
                />
              )}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-base font-bold text-slate-900 leading-none tabular-nums">
                {toBanglaDigit(stats.total)}
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5">মোট</span>
            </div>
          </div>

          <div className="flex-1 min-w-0 space-y-2.5">
            {stats.total === 0 ? (
              <p className="text-xs text-slate-500">
                এই পরিসরে এখনো কোনো শিক্ষার্থীর তথ্য নেই। নতুন ভর্তি বা Excel আপলোড করলে অনুপাত দেখা যাবে।
              </p>
            ) : (
              <>
                <svg
                  viewBox="0 0 100 8"
                  preserveAspectRatio="none"
                  className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100"
                  aria-hidden="true"
                >
                  {stats.boysPct > 0 && (
                    <rect x={0} y={0} width={stats.boysPct} height={8} fill="#2563eb" />
                  )}
                  {stats.girlsPct > 0 && (
                    <rect
                      x={stats.boysPct}
                      y={0}
                      width={stats.girlsPct}
                      height={8}
                      fill="#059669"
                    />
                  )}
                </svg>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-2 font-medium text-slate-700">
                      <span className="h-2.5 w-2.5 rounded-xs bg-blue-600 shrink-0" aria-hidden="true" />
                      <span>ছাত্র</span>
                    </span>
                    <span className="font-semibold text-slate-900 tabular-nums">
                      {toBanglaDigit(stats.boys)} জন ({toBanglaDigit(stats.boysPct)}%)
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-2 font-medium text-slate-700">
                      <span className="h-2.5 w-2.5 rounded-xs bg-emerald-600 shrink-0" aria-hidden="true" />
                      <span>ছাত্রী</span>
                    </span>
                    <span className="font-semibold text-slate-900 tabular-nums">
                      {toBanglaDigit(stats.girls)} জন ({toBanglaDigit(stats.girlsPct)}%)
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* FLN Summary Strip */}
      <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800 shrink-0">
            <BookOpenCheck className="h-4 w-4" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-800">
              শিক্ষার্থীদের FLN অবস্থা ({FLN_MONTHS[selectedFlnMonth]?.name || 'চলতি মাস'})
            </p>
            <p className="text-[11px] text-slate-500">
              {stats.avgWpm > 0 || stats.avgFlnPct > 0
                ? `সার্বিক FLN: ${toBanglaDigit(stats.avgFlnPct)}% · গড় পঠন গতি: ${toBanglaDigit(stats.avgWpm)} শব্দ/মিনিট`
                : 'মাসিক FLN মূল্যায়ন থেকে স্বয়ংক্রিয়ভাবে % হিসাবকৃত'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold tabular-nums ${FLN_LEVEL_META.mastered.badgeClass}`}
          >
            <span>{FLN_LEVEL_META.mastered.symbol}</span>
            <span>
              অর্জিত: {toBanglaDigit(stats.flnMastered)} জন ({toBanglaDigit(stats.flnMasteredPct)}%)
            </span>
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold tabular-nums ${FLN_LEVEL_META.developing.badgeClass}`}
          >
            <span>{FLN_LEVEL_META.developing.symbol}</span>
            <span>
              অগ্রসরমান: {toBanglaDigit(stats.flnDeveloping)} জন ({toBanglaDigit(stats.flnDevelopingPct)}%)
            </span>
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold tabular-nums ${FLN_LEVEL_META.remedial.badgeClass}`}
          >
            <span>{FLN_LEVEL_META.remedial.symbol}</span>
            <span>
              সহায়তা প্রয়োজন: {toBanglaDigit(stats.flnRemedial)} জন ({toBanglaDigit(stats.flnRemedialPct)}%)
            </span>
          </span>
          <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600 tabular-nums">
            <span>
              মূল্যায়ন বাকি: {toBanglaDigit(stats.flnPending)} জন ({toBanglaDigit(stats.flnPendingPct)}%)
            </span>
          </span>
          {onOpenFlnPage && (
            <button
              type="button"
              onClick={onOpenFlnPage}
              className="inline-flex items-center gap-1 rounded-lg border border-emerald-700/30 bg-emerald-50/70 px-2.5 py-1 text-xs font-semibold text-emerald-900 hover:bg-emerald-100 whitespace-nowrap"
            >
              <span>মাসিক FLN</span>
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </section>
  );
};
