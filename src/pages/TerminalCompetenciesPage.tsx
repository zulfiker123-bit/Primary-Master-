import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowUpRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Printer,
  Search,
  Target,
  X,
} from 'lucide-react';
import { OfficialA4Letterhead, OfficialWatermark } from '../components/OfficialEmblems';
import { PageShell } from '../components/PageShell';
import { CLASS_LEVELS, SUBJECTS_BY_CLASS } from '../data/curriculum';
import { TermKey } from '../data/dateWiseAnnualPlans2026';
import {
  getAllYearTerminalCompetenciesForClass,
  getMonthlyTerminalCompetencyPlan,
  TERMINAL_MONTHS,
} from '../data/terminalCompetenciesData';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { RouteKey, TeacherProfile } from '../types';
import { getFormattedBanglaDate, toBanglaDigit } from '../utils/bangla';
import { exportElementToA4Pdf } from '../utils/pdfExport';
import { triggerSmartPrint } from '../utils/printHelper';

interface TerminalCompetenciesPageProps {
  profile: TeacherProfile;
  onNavigate: (route: RouteKey) => void;
}

type ViewMode = 'month_detail' | 'annual_matrix';

export default function TerminalCompetenciesPage({
  profile,
  onNavigate,
}: TerminalCompetenciesPageProps) {
  const [selectedClass, setSelectedClass] = useState<string>('তৃতীয় শ্রেণি');
  const [selectedMonth, setSelectedMonth] = useState<number>(() => new Date().getMonth());
  const [subjectFilter, setSubjectFilter] = useState<string>('সকল বিষয়');
  const [termFilter, setTermFilter] = useState<'সকল' | TermKey>('সকল');
  const [viewMode, setViewMode] = useState<ViewMode>('month_detail');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [exportingPdf, setExportingPdf] = useState(false);

  const [completedMap, setCompletedMap] = useLocalStorage<Record<string, boolean>>(
    'terminal_competency_checked_v1',
    {}
  );

  const sheetRef = useRef<HTMLDivElement>(null);

  const classSubjects = useMemo(
    () => SUBJECTS_BY_CLASS[selectedClass] || SUBJECTS_BY_CLASS['তৃতীয় শ্রেণি'],
    [selectedClass]
  );

  const activeSubjectFilter = useMemo(() => {
    if (subjectFilter === 'সকল বিষয়') return 'সকল বিষয়';
    return classSubjects.includes(subjectFilter) ? subjectFilter : 'সকল বিষয়';
  }, [classSubjects, subjectFilter]);

  const monthPlan = useMemo(
    () => getMonthlyTerminalCompetencyPlan(selectedClass, selectedMonth),
    [selectedClass, selectedMonth]
  );

  const annualPlans = useMemo(
    () => getAllYearTerminalCompetenciesForClass(selectedClass),
    [selectedClass]
  );

  const filteredMonthSubjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return monthPlan.subjects.filter((item) => {
      const matchSub =
        activeSubjectFilter === 'সকল বিষয়' || item.subject === activeSubjectFilter;
      const matchQuery =
        !q ||
        item.subject.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        item.chapterOrTheme.toLowerCase().includes(q) ||
        item.competencies.some((c) => c.toLowerCase().includes(q));
      return matchSub && matchQuery;
    });
  }, [monthPlan.subjects, activeSubjectFilter, searchQuery]);

  const filteredAnnualPlans = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return annualPlans
      .filter((plan) => termFilter === 'সকল' || plan.term === termFilter)
      .map((plan) => ({
        ...plan,
        subjects: plan.subjects.filter((item) => {
          const matchSub =
            activeSubjectFilter === 'সকল বিষয়' || item.subject === activeSubjectFilter;
          const matchQuery =
            !q ||
            plan.monthName.toLowerCase().includes(q) ||
            plan.monthTheme.toLowerCase().includes(q) ||
            item.subject.toLowerCase().includes(q) ||
            item.code.toLowerCase().includes(q) ||
            item.chapterOrTheme.toLowerCase().includes(q) ||
            item.competencies.some((c) => c.toLowerCase().includes(q));
          return matchSub && matchQuery;
        }),
      }))
      .filter((plan) => plan.subjects.length > 0);
  }, [annualPlans, termFilter, activeSubjectFilter, searchQuery]);

  const progressStats = useMemo(() => {
    const totalClassItems = annualPlans.reduce((acc, p) => acc + p.subjects.length, 0);
    const doneClassItems = annualPlans.reduce(
      (acc, p) => acc + p.subjects.filter((s) => Boolean(completedMap[s.id])).length,
      0
    );
    const monthTotal = monthPlan.subjects.length;
    const monthDone = monthPlan.subjects.filter((s) => Boolean(completedMap[s.id])).length;
    return {
      totalClassItems,
      doneClassItems,
      classPct:
        totalClassItems > 0 ? Math.round((doneClassItems / totalClassItems) * 100) : 0,
      monthTotal,
      monthDone,
      monthPct: monthTotal > 0 ? Math.round((monthDone / monthTotal) * 100) : 0,
    };
  }, [annualPlans, monthPlan.subjects, completedMap]);

  const toggleItemCompleted = (id: string) => {
    setCompletedMap((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleMarkMonthDone = () => {
    setCompletedMap((prev) => {
      const next = { ...prev };
      const allDone = monthPlan.subjects.every((s) => Boolean(prev[s.id]));
      monthPlan.subjects.forEach((s) => {
        next[s.id] = !allDone;
      });
      return next;
    });
  };

  const handlePrint = () => {
    triggerSmartPrint({
      element: sheetRef.current,
      filename: `terminal-competencies-${selectedClass}-${
        viewMode === 'month_detail' ? monthPlan.monthName : 'annual'
      }`,
      orientation: 'portrait',
    });
  };

  const handleExportPdf = async () => {
    if (exportingPdf || !sheetRef.current) return;
    setExportingPdf(true);
    try {
      await exportElementToA4Pdf(
        sheetRef.current,
        `prantik-jogyota-${selectedClass}-${
          viewMode === 'month_detail' ? monthPlan.monthName : '12-months'
        }`.replace(/\s+/g, '-'),
        { orientation: 'portrait' }
      );
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <PageShell
      title="প্রান্তিক যোগ্যতা (শ্রেণি ও মাসভিত্তিক)"
      subtitle="প্রাক-প্রাথমিক থেকে ৫ম শ্রেণির সকল বিষয়ের মাসভিত্তিক অর্জিতব্য প্রান্তিক যোগ্যতা, যাচাই কৌশল ও অগ্রগতি ট্র্যাকার"
      onNavigate={onNavigate}
      onPrint={handlePrint}
      printLabel="A4 প্রিন্ট"
      onExportPdf={handleExportPdf}
      exportingPdf={exportingPdf}
      pdfLabel="PDF সংরক্ষণ"
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate('monthly_fln')}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-900 hover:bg-emerald-100 whitespace-nowrap"
          >
            <ClipboardCheck className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">মাসিক FLN যাচাই</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('lesson_plan')}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap"
          >
            <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">পাঠ পরিকল্পনা</span>
          </button>
        </div>
      }
    >
      {/* Controls Card */}
      <div className="no-print mb-5 rounded-2xl bg-white border border-stone-200 p-4 space-y-4">
        {/* Row 1: Class selector + View mode toggle */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="space-y-1.5">
            <span className="block text-xs font-semibold text-slate-600">
              শ্রেণি নির্বাচন করুন:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {CLASS_LEVELS.map((cls) => {
                const active = selectedClass === cls;
                return (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => setSelectedClass(cls)}
                    className={`min-h-[38px] rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                      active
                        ? 'bg-[#102A23] text-white'
                        : 'bg-stone-100 text-slate-700 hover:bg-stone-200/80'
                    }`}
                  >
                    {cls}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1 p-1 bg-stone-100 rounded-xl self-start">
            <button
              type="button"
              onClick={() => setViewMode('month_detail')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
                viewMode === 'month_detail'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Target className="h-3.5 w-3.5" aria-hidden="true" />
              <span>মাসভিত্তিক বিস্তারিত</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('annual_matrix')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
                viewMode === 'annual_matrix'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
              <span>১২ মাসের পূর্ণাঙ্গ তালিকা</span>
            </button>
          </div>
        </div>

        {/* Row 2: 12-month selector strip (when in month_detail) OR Term filter (when in annual_matrix) */}
        {viewMode === 'month_detail' ? (
          <div className="border-t border-stone-100 pt-3.5 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-slate-700">
                মাস নির্বাচন করুন ({monthPlan.monthName} · {monthPlan.term}):
              </span>
              <span className="text-emerald-800 font-semibold tabular-nums">
                চলতি মাসের অর্জন: {toBanglaDigit(progressStats.monthDone)}/
                {toBanglaDigit(progressStats.monthTotal)} ({toBanglaDigit(progressStats.monthPct)}%)
              </span>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-1.5">
              {TERMINAL_MONTHS.map((m) => {
                const active = selectedMonth === m.index;
                const plan = annualPlans[m.index];
                const doneCount = plan.subjects.filter((s) => Boolean(completedMap[s.id])).length;
                const allDone = plan.subjects.length > 0 && doneCount === plan.subjects.length;
                return (
                  <button
                    key={m.index}
                    type="button"
                    onClick={() => setSelectedMonth(m.index)}
                    className={`min-h-[42px] rounded-xl px-2 py-1.5 text-xs font-semibold transition-colors flex flex-col items-center justify-center ${
                      active
                        ? 'bg-emerald-700 text-white'
                        : allDone
                        ? 'bg-emerald-50 border border-emerald-300 text-emerald-900'
                        : 'bg-stone-50 border border-stone-200 text-slate-700 hover:bg-emerald-50 hover:border-emerald-300'
                    }`}
                  >
                    <span>{m.short}</span>
                    <span
                      className={`text-[10px] tabular-nums ${
                        active ? 'text-emerald-100' : 'text-slate-500'
                      }`}
                    >
                      {toBanglaDigit(doneCount)}/{toBanglaDigit(plan.subjects.length)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="border-t border-stone-100 pt-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {(['সকল', '১ম প্রান্তিক', '২য় প্রান্তিক', '৩য় প্রান্তিক'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTermFilter(t)}
                  className={`h-9 rounded-xl px-3.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                    termFilter === t
                      ? 'bg-emerald-700 text-white'
                      : 'bg-stone-100 text-slate-700 hover:bg-stone-200'
                  }`}
                >
                  {t === 'সকল' ? 'সকল প্রান্তিক (জানু–ডিসে)' : t}
                </button>
              ))}
            </div>
            <span className="text-xs font-semibold text-emerald-800 tabular-nums">
              বার্ষিক সামগ্রিক অর্জন: {toBanglaDigit(progressStats.doneClassItems)}/
              {toBanglaDigit(progressStats.totalClassItems)} ({toBanglaDigit(progressStats.classPct)}%)
            </span>
          </div>
        )}

        {/* Row 3: Subject filter & Search */}
        <div className="border-t border-stone-100 pt-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {['সকল বিষয়', ...classSubjects].map((sub) => {
              const active = activeSubjectFilter === sub;
              return (
                <button
                  key={sub}
                  type="button"
                  onClick={() => setSubjectFilter(sub)}
                  className={`h-9 rounded-xl px-3 text-xs font-semibold transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-[#102A23] text-white'
                      : 'bg-stone-100 text-slate-700 hover:bg-stone-200'
                  }`}
                >
                  {sub}
                </button>
              );
            })}
          </div>

          <div className="relative w-full md:w-72 shrink-0">
            <Search
              className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="যোগ্যতা, অধ্যায় বা কোড খুঁজুন..."
              className="w-full h-9 rounded-xl border border-stone-200 bg-stone-50/50 pl-9 pr-8 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-700 focus:bg-white focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="অনুসন্ধান মুছুন"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Progress Summary Strip (no-print) */}
      <div className="no-print mb-5 rounded-2xl bg-white border border-stone-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-950">
              {selectedClass}
            </span>
            <span className="inline-flex items-center gap-1 rounded-lg bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-950">
              {viewMode === 'month_detail'
                ? `${monthPlan.monthName} · ${monthPlan.term}`
                : 'জানুয়ারি–ডিসেম্বর (১২ মাস)'}
            </span>
          </div>
          <p className="text-xs sm:text-sm font-bold text-slate-900">
            {viewMode === 'month_detail'
              ? monthPlan.monthTheme
              : `${selectedClass}-এর ১২ মাসের প্রান্তিক যোগ্যতাভিত্তিক কর্মপরিকল্পনা`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {viewMode === 'month_detail' && (
            <button
              type="button"
              onClick={handleMarkMonthDone}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-900 hover:bg-emerald-100"
            >
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>
                {progressStats.monthDone === progressStats.monthTotal
                  ? 'এই মাসের টিক সরান'
                  : 'এই মাসের সব সম্পন্ন করুন'}
              </span>
            </button>
          )}
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#102A23] px-3.5 text-xs font-semibold text-white hover:bg-emerald-950"
          >
            <Printer className="h-3.5 w-3.5" aria-hidden="true" />
            <span>প্রিন্ট শীট</span>
          </button>
        </div>
      </div>

      {/* Main Content + Printable A4 Sheet */}
      <div
        ref={sheetRef}
        className="relative overflow-hidden print-only-sheet rounded-2xl bg-white border border-stone-200 p-4 sm:p-7 text-slate-900"
      >
        <OfficialWatermark opacityClass="opacity-[0.04]" />

        <div className="relative z-10 space-y-4">
          <OfficialA4Letterhead
            schoolName={profile.school || '৮২ নং কোলা সরকারি প্রাথমিক বিদ্যালয়'}
            addressLine={`${profile.villagePost ? profile.villagePost + ', ' : ''}${profile.upazila || 'আশাশুনি'}, ${profile.district || 'সাতক্ষীরা'}`}
            documentTitle={
              viewMode === 'month_detail'
                ? `মাসভিত্তিক প্রান্তিক যোগ্যতা বিবরণী — ${selectedClass} (${monthPlan.monthName})`
                : `বার্ষিক (১২ মাস) শ্রেণিভিত্তিক প্রান্তিক যোগ্যতা ছক — ${selectedClass}`
            }
            subtitle={
              viewMode === 'month_detail'
                ? `প্রান্তিক: ${monthPlan.term} · মূল থিম: ${monthPlan.monthTheme}`
                : `জানুয়ারি থেকে ডিসেম্বর (১ম, ২য় ও ৩য় প্রান্তিক) · মোট বিষয়ভিত্তিক ইউনিট: ${toBanglaDigit(progressStats.totalClassItems)}টি`
            }
            compact
          />

          {viewMode === 'month_detail' ? (
            filteredMonthSubjects.length === 0 ? (
              <div className="rounded-xl border border-stone-200 bg-stone-50 p-8 text-center text-xs text-slate-600">
                নির্বাচিত ফিল্টার বা অনুসন্ধানে কোনো প্রান্তিক যোগ্যতা পাওয়া যায়নি।
              </div>
            ) : (
              <div className="space-y-3">
                {filteredMonthSubjects.map((item) => {
                  const isDone = Boolean(completedMap[item.id]);
                  return (
                    <div
                      key={item.id}
                      style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
                      className={`rounded-xl border p-3.5 sm:p-4 transition-colors ${
                        isDone
                          ? 'border-emerald-300 bg-emerald-50/40'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-200/80 pb-2 mb-2.5">
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-md bg-[#102A23] px-2 py-0.5 text-[11px] font-bold text-white tabular-nums">
                              {item.code}
                            </span>
                            <h3 className="text-sm font-bold text-slate-900">{item.subject}</h3>
                          </div>
                          <p className="text-xs font-semibold text-emerald-900">
                            অধ্যায় / বিষয়বস্তু: {item.chapterOrTheme}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleItemCompleted(item.id)}
                          className={`no-print inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors shrink-0 ${
                            isDone
                              ? 'border-emerald-600 bg-emerald-700 text-white'
                              : 'border-stone-300 bg-stone-50 text-slate-700 hover:bg-emerald-50'
                          }`}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>{isDone ? 'অর্জিত / সম্পন্ন' : 'সম্পন্ন চিহ্নিত করুন'}</span>
                        </button>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div>
                          <p className="font-bold text-slate-800 mb-1">
                            মাসভিত্তিক অর্জিতব্য প্রান্তিক যোগ্যতা:
                          </p>
                          <ul className="list-disc pl-5 space-y-1 text-slate-800 leading-relaxed">
                            {item.competencies.map((comp, idx) => (
                              <li key={idx}>{comp}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-[11px] text-slate-700 flex flex-wrap items-center justify-between gap-2">
                          <span>
                            <strong className="text-slate-900">যাচাই ও মূল্যায়ন কৌশল: </strong>
                            {item.verificationCriteria}
                          </span>
                          <span className="hidden print:inline font-bold text-slate-800">
                            অবস্থা: {isDone ? '☑ অর্জিত' : '☐ চলমান'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : filteredAnnualPlans.length === 0 ? (
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-8 text-center text-xs text-slate-600">
              নির্বাচিত ফিল্টার বা অনুসন্ধানে কোনো মাসিক প্রান্তিক যোগ্যতা পাওয়া যায়নি।
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[11px] border-collapse border border-slate-700">
                <thead>
                  <tr className="bg-slate-100 text-slate-900">
                    <th className="border border-slate-700 py-2 px-2 text-center w-24">মাস ও প্রান্তিক</th>
                    <th className="border border-slate-700 py-2 px-2 text-left w-32">বিষয় ও কোড</th>
                    <th className="border border-slate-700 py-2 px-2.5 text-left">
                      অধ্যায় ও মাসভিত্তিক অর্জিতব্য প্রান্তিক যোগ্যতা
                    </th>
                    <th className="border border-slate-700 py-2 px-2 text-left w-44">
                      যাচাই কৌশল
                    </th>
                    <th className="no-print border border-slate-700 py-2 px-2 text-center w-20">
                      অবস্থা
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAnnualPlans.map((plan) =>
                    plan.subjects.map((item, sIdx) => {
                      const isDone = Boolean(completedMap[item.id]);
                      return (
                        <tr
                          key={item.id}
                          className={isDone ? 'bg-emerald-50/40' : 'hover:bg-stone-50/60'}
                        >
                          {sIdx === 0 && (
                            <td
                              rowSpan={plan.subjects.length}
                              className="border border-slate-700 py-2 px-2 text-center align-top bg-slate-50/70"
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedMonth(plan.monthIndex);
                                  setViewMode('month_detail');
                                }}
                                className="font-bold text-emerald-900 hover:underline inline-flex items-center gap-0.5"
                                title="এই মাসের বিস্তারিত দেখুন"
                              >
                                <span>{plan.monthName}</span>
                                <ArrowUpRight className="no-print h-3 w-3" aria-hidden="true" />
                              </button>
                              <div className="text-[10px] text-slate-600 mt-0.5">{plan.term}</div>
                            </td>
                          )}
                          <td className="border border-slate-700 py-1.5 px-2 align-top">
                            <p className="font-bold text-slate-900">{item.subject}</p>
                            <span className="text-[10px] font-semibold text-emerald-800 tabular-nums">
                              {item.code}
                            </span>
                          </td>
                          <td className="border border-slate-700 py-1.5 px-2.5 align-top space-y-1">
                            <p className="font-semibold text-slate-900">{item.chapterOrTheme}</p>
                            <ul className="list-disc pl-4 text-slate-700 space-y-0.5">
                              {item.competencies.map((comp, idx) => (
                                <li key={idx}>{comp}</li>
                              ))}
                            </ul>
                          </td>
                          <td className="border border-slate-700 py-1.5 px-2 align-top text-slate-700">
                            {item.verificationCriteria}
                          </td>
                          <td className="no-print border border-slate-700 py-1.5 px-2 text-center align-middle">
                            <button
                              type="button"
                              onClick={() => toggleItemCompleted(item.id)}
                              className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-semibold ${
                                isDone
                                  ? 'border-emerald-600 bg-emerald-700 text-white'
                                  : 'border-stone-300 bg-white text-slate-600 hover:bg-emerald-50'
                              }`}
                            >
                              <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                              <span>{isDone ? 'অর্জিত' : 'বাকি'}</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Print Signatures */}
          <div className="hidden print:flex pt-8 items-end justify-between text-xs">
            <div>
              <p className="text-[11px] text-slate-600 mb-4">
                প্রস্তুতের তারিখ: {getFormattedBanglaDate()}
              </p>
              <p className="border-t border-slate-700 pt-1 px-4 font-semibold">
                {profile.name || 'জুলফিকার রহমান'} ({profile.designation || 'সহকারী শিক্ষক'})
              </p>
            </div>
            <div className="text-center">
              <p className="border-t border-slate-700 pt-1 px-6 font-semibold">
                প্রধান শিক্ষকের স্বাক্ষর ও সিল
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
