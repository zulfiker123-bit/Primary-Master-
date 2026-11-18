import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  ClipboardCheck,
  Eye,
  FileDown,
  Loader2,
  Plus,
  Printer,
  RotateCcw,
  Trash2,
  UserPlus,
  Calendar,
  BookOpen,
  AlertTriangle,
  FileText,
  EyeOff,
} from 'lucide-react';
import { PageShell } from '../components/PageShell';
import { OfficialA4Letterhead, OfficialWatermark } from '../components/OfficialEmblems';
import {
  buildInitialFlnRecords,
  FLN_INDICATORS_BY_CLASS,
  FLN_LEVEL_META,
  FLN_MONTHS,
  FlnDomain,
  FlnLevel,
  FlnMonthlyCheckEntry,
  FlnStudentRecord,
  getMonthTargetForClass,
  MONTH_FLN_MILESTONES,
} from '../data/flnFramework';
import { getMonthlyFlnQuestionSet } from '../data/flnMonthlyAssessments';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { RouteKey, Student, TeacherProfile } from '../types';
import { getFormattedBanglaDate, toBanglaDigit } from '../utils/bangla';
import {
  computeFlnClassSummary,
  computeFlnSchoolSummary,
  computeSuggestedMathScore,
  evaluateFlnEntryOverall,
  mergeRegisteredStudentsIntoFlnRecords,
} from '../utils/flnStudentSync';
import { exportElementToA4Pdf } from '../utils/pdfExport';
import { triggerSmartPrint } from '../utils/printHelper';

interface MonthlyFlnPageProps {
  profile: TeacherProfile;
  onNavigate: (route: RouteKey) => void;
}

type FlnTab = 'assess' | 'questions' | 'matrix' | 'preview';

const LEVEL_ORDER: FlnLevel[] = ['mastered', 'developing', 'remedial'];

export default function MonthlyFlnPage({ profile, onNavigate }: MonthlyFlnPageProps) {
  const [records, setRecords] = useLocalStorage<FlnStudentRecord[]>(
    'monthly_fln_records_v1',
    buildInitialFlnRecords()
  );
  const [dismissedIds, setDismissedIds] = useLocalStorage<string[]>(
    'monthly_fln_dismissed_ids_v1',
    []
  );
  const [registeredStudents] = useLocalStorage<Student[]>('students_list_v1', []);
  const [previewIncludeSchoolSummary, setPreviewIncludeSchoolSummary] = useState(true);

  // Default to Class 3 (one of the primary requested FLN classes: 3rd, 4th, 5th)
  const [selectedClass, setSelectedClass] = useState<string>('তৃতীয় শ্রেণি');
  const [selectedMonth, setSelectedMonth] = useState<number>(() => new Date().getMonth());
  const [domainFilter, setDomainFilter] = useState<'সব' | FlnDomain>('সব');
  const [activeTab, setActiveTab] = useState<FlnTab>('assess');
  const [questionSubjectFilter, setQuestionSubjectFilter] = useState<'সব' | 'বাংলা' | 'English' | 'গণিত'>('সব');
  const [showQuestionAnswers, setShowQuestionAnswers] = useState(true);
  const [newRoll, setNewRoll] = useState('');
  const [newName, setNewName] = useState('');
  const [exportingPdf, setExportingPdf] = useState(false);
  const [statusNotice, setStatusNotice] = useState('');
  const reportRef = useRef<HTMLDivElement>(null);
  const questionSheetRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setStatusNotice(msg);
    window.setTimeout(() => {
      setStatusNotice((curr) => (curr === msg ? '' : curr));
    }, 3200);
  };

  const classIndicators = useMemo(
    () => FLN_INDICATORS_BY_CLASS[selectedClass] || FLN_INDICATORS_BY_CLASS['তৃতীয় শ্রেণি'],
    [selectedClass]
  );

  const filteredIndicators = useMemo(
    () =>
      domainFilter === 'সব'
        ? classIndicators
        : classIndicators.filter((ind) => ind.domain === domainFilter),
    [classIndicators, domainFilter]
  );

  const classRecords = useMemo(
    () =>
      records
        .filter((r) => r.classLevel === selectedClass)
        .sort((a, b) => a.roll.localeCompare(b.roll, 'bn', { numeric: true })),
    [records, selectedClass]
  );

  const currentMilestone = MONTH_FLN_MILESTONES[selectedMonth] || MONTH_FLN_MILESTONES[0];
  const monthTarget = useMemo(
    () => getMonthTargetForClass(selectedMonth, selectedClass),
    [selectedMonth, selectedClass]
  );
  const currentQuestionSet = useMemo(
    () => getMonthlyFlnQuestionSet(selectedClass, selectedMonth),
    [selectedClass, selectedMonth]
  );

  // Automatically keep all registered students (`students_list_v1`) synced into FLN records
  useEffect(() => {
    if (registeredStudents.length === 0) return;
    setRecords((prev) => {
      const res = mergeRegisteredStudentsIntoFlnRecords(prev, registeredStudents, dismissedIds);
      return res.changed ? res.nextRecords : prev;
    });
  }, [registeredStudents, dismissedIds, setRecords]);

  const monthStats = useMemo(
    () => computeFlnClassSummary(records, selectedClass, selectedMonth),
    [records, selectedClass, selectedMonth]
  );

  const schoolSummary = useMemo(
    () => computeFlnSchoolSummary(records, selectedMonth),
    [records, selectedMonth]
  );

  const matrixMonthSummaries = useMemo(
    () => FLN_MONTHS.map((m) => computeFlnClassSummary(records, selectedClass, m.index)),
    [records, selectedClass]
  );

  const updateStudentMonth = (
    studentId: string,
    updater: (prev: FlnMonthlyCheckEntry) => FlnMonthlyCheckEntry
  ) => {
    const key = String(selectedMonth);
    setRecords((prev) =>
      prev.map((rec) => {
        if (rec.id !== studentId) return rec;
        const currentEntry: FlnMonthlyCheckEntry = rec.months[key] || {
          readingWpm: monthTarget.readingWpmGoal,
          mathScore: computeSuggestedMathScore({}, selectedClass),
          mathScoreManual: false,
          indicators: {},
          remark: '',
        };
        return {
          ...rec,
          months: {
            ...rec.months,
            [key]: updater(currentEntry),
          },
        };
      })
    );
  };

  const cycleIndicatorLevel = (studentId: string, indicatorId: string) => {
    const targetInd = classIndicators.find((i) => i.id === indicatorId);
    updateStudentMonth(studentId, (entry) => {
      const curr = entry.indicators[indicatorId] || 'remedial';
      const next = LEVEL_ORDER[(LEVEL_ORDER.indexOf(curr) + 1) % LEVEL_ORDER.length];
      const nextIndicators = {
        ...entry.indicators,
        [indicatorId]: next,
      };
      const nextMathScore =
        targetInd?.domain === 'গণিত' && !entry.mathScoreManual
          ? computeSuggestedMathScore(nextIndicators, selectedClass)
          : entry.mathScore;
      return {
        ...entry,
        mathScore: nextMathScore,
        indicators: nextIndicators,
      };
    });
  };

  const setIndicatorLevel = (studentId: string, indicatorId: string, level: FlnLevel) => {
    const targetInd = classIndicators.find((i) => i.id === indicatorId);
    updateStudentMonth(studentId, (entry) => {
      const nextIndicators = {
        ...entry.indicators,
        [indicatorId]: level,
      };
      const nextMathScore =
        targetInd?.domain === 'গণিত' && !entry.mathScoreManual
          ? computeSuggestedMathScore(nextIndicators, selectedClass)
          : entry.mathScore;
      return {
        ...entry,
        mathScore: nextMathScore,
        indicators: nextIndicators,
      };
    });
  };

  const handleMarkAllMasteredForStudent = (studentId: string) => {
    updateStudentMonth(studentId, (entry) => {
      const nextInds = { ...entry.indicators };
      classIndicators.forEach((ind) => {
        nextInds[ind.id] = 'mastered';
      });
      return {
        ...entry,
        readingWpm: Math.max(entry.readingWpm || 0, monthTarget.readingWpmGoal),
        mathScore: entry.mathScoreManual
          ? Math.max(entry.mathScore || 0, 90)
          : computeSuggestedMathScore(nextInds, selectedClass),
        indicators: nextInds,
        remark: 'সকল প্রান্তিক যোগ্যতা অর্জিত',
      };
    });
  };

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const rollStr =
      newRoll.trim() || toBanglaDigit(String(classRecords.length + 1).padStart(2, '0'));
    const nextRec: FlnStudentRecord = {
      id: `fln-${Date.now()}`,
      classLevel: selectedClass,
      roll: rollStr,
      studentName: newName.trim(),
      months: {},
    };
    setRecords((prev) => [...prev, nextRec]);
    setNewName('');
    setNewRoll('');
    showToast(`${selectedClass}-এ নতুন শিক্ষার্থী FLN তালিকায় যুক্ত হয়েছে।`);
  };

  const handleImportFromStudents = () => {
    const classList = registeredStudents.filter((s) => s.classLevel === selectedClass);
    if (classList.length === 0) return;

    const classImpIds = new Set(classList.map((s) => `fln-imp-${s.id}`));
    const nextDismissed = dismissedIds.filter((id) => !classImpIds.has(id));
    if (nextDismissed.length !== dismissedIds.length) {
      setDismissedIds(nextDismissed);
    }

    const merged = mergeRegisteredStudentsIntoFlnRecords(records, classList, nextDismissed);
    if (!merged.changed) {
      showToast(`${selectedClass}-এর নিবন্ধিত শিক্ষার্থীরা ইতিমধ্যেই FLN তালিকায় যুক্ত আছে।`);
      return;
    }
    setRecords(merged.nextRecords);
    showToast(
      merged.addedCount > 0
        ? `${toBanglaDigit(merged.addedCount)} জন শিক্ষার্থী তালিকা থেকে সিঙ্ক হয়েছে।`
        : `${selectedClass}-এর শিক্ষার্থীর তথ্য হালনাগাদ হয়েছে।`
    );
  };

  const handleRemoveStudent = (id: string) => {
    if (id.startsWith('fln-imp-')) {
      setDismissedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    }
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  const handleResetDemo = () => {
    setDismissedIds([]);
    const base = buildInitialFlnRecords();
    const synced = mergeRegisteredStudentsIntoFlnRecords(base, registeredStudents, []);
    setRecords(synced.nextRecords);
    showToast('ডিফল্ট নমুনা ও নিবন্ধিত শিক্ষার্থী রেকর্ড পুনরায় লোড হয়েছে।');
  };

  const handleExportPdf = async () => {
    if (exportingPdf) return;
    if (activeTab === 'questions') {
      if (!questionSheetRef.current) return;
      setExportingPdf(true);
      try {
        await exportElementToA4Pdf(
          questionSheetRef.current,
          `fln-question-${selectedClass}-${currentMilestone.monthName}`.replace(/\s+/g, '-'),
          { orientation: 'portrait' }
        );
      } finally {
        setExportingPdf(false);
      }
      return;
    }

    setActiveTab('preview');
    setExportingPdf(true);
    setTimeout(async () => {
      try {
        if (reportRef.current) {
          await exportElementToA4Pdf(
            reportRef.current,
            `monthly-fln-${selectedClass}-${currentMilestone.monthName}`.replace(/\s+/g, '-'),
            { orientation: 'landscape' }
          );
        }
      } finally {
        setExportingPdf(false);
      }
    }, 150);
  };

  const handlePrint = () => {
    if (activeTab === 'questions') {
      triggerSmartPrint({
        element: questionSheetRef.current,
        filename: `fln-question-${selectedClass}-${currentMilestone.monthName}`,
        orientation: 'portrait',
      });
      return;
    }

    setActiveTab('preview');
    setTimeout(() => {
      triggerSmartPrint({
        element: reportRef.current,
        filename: `monthly-fln-${selectedClass}-${currentMilestone.monthName}`,
        orientation: 'landscape',
      });
    }, 150);
  };

  const matchingClassStudentsCount = useMemo(
    () => registeredStudents.filter((s) => s.classLevel === selectedClass).length,
    [registeredStudents, selectedClass]
  );

  return (
    <PageShell
      title="মাসিক FLN, যাচাই অনুচ্ছেদ ও প্রান্তিক যোগ্যতা (১২ মাস)"
      subtitle="প্রান্তিক যোগ্যতার ভিত্তিতে ৩য়, ৪র্থ ও ৫ম শ্রেণিসহ সকল শ্রেণির ১২ মাসের FLN যাচাই অনুচ্ছেদ, প্রশ্নপত্র ও প্রতিবেদন"
      onNavigate={onNavigate}
      onPrint={handlePrint}
      printLabel={activeTab === 'questions' ? 'FLN প্রশ্ন প্রিন্ট (A4)' : 'FLN প্রতিবেদন প্রিন্ট (A4)'}
      onExportPdf={handleExportPdf}
      exportingPdf={exportingPdf}
      pdfLabel={activeTab === 'questions' ? 'প্রশ্ন PDF (A4)' : 'PDF সংরক্ষণ (A4)'}
      actions={
        <button
          type="button"
          onClick={handleResetDemo}
          className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">ডিফল্ট রিসেট</span>
        </button>
      }
    >
      {statusNotice && (
        <div
          role="status"
          className="no-print mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs sm:text-sm font-semibold text-emerald-900 flex items-center gap-2"
        >
          <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" aria-hidden="true" />
          <span>{statusNotice}</span>
        </div>
      )}

      {/* Top Navigation: Classes + View Tabs */}
      <div className="no-print mb-5 rounded-2xl bg-white border border-stone-200 p-4 space-y-4">
        {/* Class Selector (Highlighting 3rd, 4th, 5th + All Primary Classes) */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="space-y-1.5">
            <span className="block text-xs font-semibold text-slate-600">
              শ্রেণি নির্বাচন করুন (বিশেষত ৩য়, ৪র্থ, ৫ম সহ সকল শ্রেণি):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {['তৃতীয় শ্রেণি', 'চতুর্থ শ্রেণি', 'পঞ্চম শ্রেণি', 'প্রাক-প্রাথমিক', 'প্রথম শ্রেণি', 'দ্বিতীয় শ্রেণি'].map(
                (cls) => {
                  const active = selectedClass === cls;
                  const count = records.filter((r) => r.classLevel === cls).length;
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
                      {cls} ({toBanglaDigit(count)})
                    </button>
                  );
                }
              )}
            </div>
          </div>

          {/* Interactive View Tabs */}
          <div className="flex flex-wrap items-center gap-1 p-1 bg-stone-100 rounded-xl self-start">
            {[
              { id: 'assess' as FlnTab, label: 'মাসিক যাচাই এন্ট্রি', icon: ClipboardCheck },
              { id: 'questions' as FlnTab, label: 'মাসিক FLN প্রশ্ন ও অনুচ্ছেদ', icon: FileText },
              { id: 'matrix' as FlnTab, label: '১২ মাসের বার্ষিক ছক', icon: Calendar },
              { id: 'preview' as FlnTab, label: 'A4 প্রতিবেদন প্রিভিউ', icon: Eye },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
                    active ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 12-Month Selector Strip */}
        <div className="border-t border-stone-100 pt-3.5 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-semibold text-slate-700">
              ১২ মাসের যাচাই সময়কাল ({currentMilestone.monthName} নির্বাচিত):
            </span>
            <span className="text-emerald-800 font-medium">{currentMilestone.focusTheme}</span>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-1.5">
            {FLN_MONTHS.map((m) => {
              const active = selectedMonth === m.index;
              return (
                <button
                  key={m.index}
                  type="button"
                  onClick={() => setSelectedMonth(m.index)}
                  className={`min-h-[38px] rounded-xl px-2 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-emerald-700 text-white'
                      : 'bg-stone-50 border border-stone-200 text-slate-700 hover:bg-emerald-50 hover:border-emerald-300'
                  }`}
                >
                  {m.short}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Month Prantik Jogyota Verification Rubric + Quick KPI Row */}
      <div className="no-print mb-5 grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        <div className="lg:col-span-7 rounded-2xl bg-white border border-stone-200 p-4 sm:p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-2.5">
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              {selectedClass} — {currentMilestone.monthName} মাসের প্রান্তিক যোগ্যতাভিত্তিক FLN লক্ষ্য
            </h2>
            <span className="text-xs font-semibold text-emerald-800 tabular-nums">
              লক্ষ্য পঠন গতি: {toBanglaDigit(monthTarget.readingWpmGoal)}+ শব্দ/মিনিট
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            <div className="rounded-xl bg-emerald-50/70 border border-emerald-200/70 p-3 space-y-1">
              <p className="font-bold text-emerald-950">বাংলা সাক্ষরতা</p>
              <p className="text-slate-700 leading-relaxed">{monthTarget.literacyBanglaTarget}</p>
            </div>
            <div className="rounded-xl bg-sky-50/70 border border-sky-200/70 p-3 space-y-1">
              <p className="font-bold text-sky-950">English সাক্ষরতা</p>
              <p className="text-slate-700 leading-relaxed">{monthTarget.literacyEnglishTarget}</p>
            </div>
            <div className="rounded-xl bg-amber-50/70 border border-amber-200/70 p-3 space-y-1">
              <p className="font-bold text-amber-950">গণিত সংখ্যাবোধ</p>
              <p className="text-slate-700 leading-relaxed">{monthTarget.numeracyMathTarget}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs pt-1">
            <div className="rounded-xl bg-stone-50 border border-stone-200/80 px-3 py-2.5 text-slate-700">
              <strong className="text-slate-900">যাচাই কৌশল: </strong>
              {monthTarget.diagnosticPrompt}
            </div>
            <div className="rounded-xl bg-rose-50/60 border border-rose-200/70 px-3 py-2.5 text-slate-700">
              <strong className="text-rose-900">নিরাময়মূলক ব্যবস্থা: </strong>
              {monthTarget.remedialAction}
            </div>
          </div>
        </div>

        {/* Summary KPI Metrics Card (Auto % from all students) */}
        <div className="lg:col-span-5 rounded-2xl bg-white border border-stone-200 p-4 sm:p-5 flex flex-col justify-between gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-2.5">
            <h2 className="text-sm font-bold text-slate-900">
              {currentMilestone.monthName} মাসের অর্জন সারসংক্ষেপ (অটো %)
            </h2>
            <span className="text-xs text-slate-600 font-medium tabular-nums">
              মূল্যায়িত: {toBanglaDigit(monthStats.assessedCount)}/
              {toBanglaDigit(monthStats.totalStudents)} জন ({toBanglaDigit(monthStats.assessedPct)}%)
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3">
              <p className="text-emerald-900 font-medium">● অর্জিত (দক্ষ)</p>
              <p className="text-xl font-bold text-emerald-950 tabular-nums mt-0.5">
                {toBanglaDigit(monthStats.masteredCount)} জন ({toBanglaDigit(monthStats.masteredPct)}%)
              </p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3">
              <p className="text-amber-900 font-medium">◐ অগ্রসরমান (মধ্যম)</p>
              <p className="text-xl font-bold text-amber-950 tabular-nums mt-0.5">
                {toBanglaDigit(monthStats.developingCount)} জন ({toBanglaDigit(monthStats.developingPct)}%)
              </p>
            </div>
            <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-3">
              <p className="text-rose-900 font-medium">▲ নিরাময় প্রয়োজন</p>
              <p className="text-xl font-bold text-rose-950 tabular-nums mt-0.5">
                {toBanglaDigit(monthStats.remedialCount)} জন ({toBanglaDigit(monthStats.remedialPct)}%)
              </p>
            </div>
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
              <p className="text-slate-600 font-medium">সার্বিক FLN ও গতি</p>
              <p className="text-xl font-bold text-slate-900 tabular-nums mt-0.5">
                {toBanglaDigit(monthStats.overallFlnPct)}% · {toBanglaDigit(monthStats.avgWpm)} WPM
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-emerald-50/60 border border-emerald-200/70 px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-[11px] font-semibold text-emerald-950 tabular-nums">
            <span>বাংলা: {toBanglaDigit(monthStats.banglaAvgPct)}%</span>
            <span>English: {toBanglaDigit(monthStats.englishAvgPct)}%</span>
            <span>গণিত: {toBanglaDigit(monthStats.avgMathScore)}%</span>
            <span>লক্ষ্য WPM অর্জন: {toBanglaDigit(monthStats.targetWpmMetPct)}%</span>
          </div>
        </div>
      </div>

      {/* TAB 1: Monthly FLN Assessment Entry & Prantik Jogyota Checklist */}
      {activeTab === 'assess' && (
        <div className="space-y-4">
          {/* Student Add / Import + Domain Filter */}
          <div className="no-print rounded-2xl bg-white border border-stone-200 p-4 flex flex-col lg:flex-row lg:items-end justify-between gap-3">
            <form onSubmit={handleAddStudent} className="flex flex-wrap items-end gap-2 flex-1">
              <div className="w-20">
                <label className="block text-xs font-semibold text-slate-600 mb-1">রোল</label>
                <input
                  type="text"
                  value={newRoll}
                  onChange={(e) => setNewRoll(e.target.value)}
                  placeholder="০৪"
                  className="w-full h-10 rounded-xl border border-stone-200 px-3 text-sm"
                />
              </div>
              <div className="flex-1 min-w-[170px]">
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  শিক্ষার্থীর নাম ({selectedClass})
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="শিক্ষার্থীর নাম লিখুন"
                  className="w-full h-10 rounded-xl border border-stone-200 px-3 text-sm"
                />
              </div>
              <button
                type="submit"
                className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-emerald-800 px-4 text-xs font-semibold text-white hover:bg-emerald-900"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                <span>যোগ করুন</span>
              </button>
              {matchingClassStudentsCount > 0 && (
                <button
                  type="button"
                  onClick={handleImportFromStudents}
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-900 hover:bg-emerald-100"
                >
                  <UserPlus className="h-4 w-4" aria-hidden="true" />
                  <span>তালিকা থেকে আমদানি ({toBanglaDigit(matchingClassStudentsCount)})</span>
                </button>
              )}
            </form>

            {/* Domain Filter */}
            <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-xl self-start lg:self-end">
              {(['সব', 'বাংলা', 'English', 'গণিত'] as const).map((dom) => (
                <button
                  key={dom}
                  type="button"
                  onClick={() => setDomainFilter(dom)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                    domainFilter === dom
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {dom === 'সব' ? 'সকল বিষয়' : dom}
                </button>
              ))}
            </div>
          </div>

          {/* Indicator Reference Tools Guide */}
          <div className="no-print rounded-2xl bg-white border border-stone-200 p-4 space-y-2.5">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-emerald-700" aria-hidden="true" />
              <span>{selectedClass}-এর প্রান্তিক যোগ্যতা ভিত্তিক FLN যাচাই সূচক ও টুলস</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
              {filteredIndicators.map((ind) => (
                <div
                  key={ind.id}
                  className="rounded-xl border border-stone-200/90 bg-stone-50/70 p-3 space-y-1"
                >
                  <div className="flex items-center justify-between text-[11px] font-bold text-emerald-900">
                    <span>{ind.competencyCode}</span>
                    <span>{ind.domain}</span>
                  </div>
                  <p className="font-semibold text-slate-900 leading-snug">{ind.title}</p>
                  <p className="text-slate-600">লক্ষ্য: {ind.targetBenchmark}</p>
                  <p className="text-slate-500">টুলস: {ind.verificationTool}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Student Assessment Table */}
          {classRecords.length === 0 ? (
            <div className="rounded-2xl bg-white border border-stone-200 p-8 text-center space-y-2">
              <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto" aria-hidden="true" />
              <p className="text-sm font-semibold text-slate-800">
                {selectedClass}-এ এখনো কোনো শিক্ষার্থী যোগ করা হয়নি।
              </p>
              <p className="text-xs text-slate-500">
                উপরের ফরম থেকে শিক্ষার্থী যোগ করুন অথবা নিবন্ধিত শিক্ষার্থী তালিকা থেকে আমদানি করুন।
              </p>
            </div>
          ) : (
            <div className="rounded-2xl bg-white border border-stone-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-stone-50 border-b border-stone-200 text-slate-700">
                    <tr>
                      <th className="py-3 px-3 font-bold w-14">রোল</th>
                      <th className="py-3 px-3 font-bold min-w-[140px]">শিক্ষার্থীর নাম</th>
                      <th className="py-3 px-2 font-bold text-center w-24">
                        পঠন গতি (WPM)
                      </th>
                      <th className="py-3 px-2 font-bold text-center w-24">
                        গণিত স্কোর (%)
                      </th>
                      {filteredIndicators.map((ind) => (
                        <th key={ind.id} className="py-3 px-2 font-bold min-w-[145px]">
                          <span className="block text-[10px] text-emerald-800">
                            {ind.competencyCode}
                          </span>
                          <span className="block truncate max-w-[160px]" title={ind.title}>
                            {ind.title}
                          </span>
                        </th>
                      ))}
                      <th className="py-3 px-2 font-bold text-center min-w-[100px]">সার্বিক স্তর</th>
                      <th className="py-3 px-2 font-bold text-right w-24">কার্যক্রম</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {classRecords.map((rec) => {
                      const entry = rec.months[String(selectedMonth)];
                      const summary = evaluateFlnEntryOverall(entry, selectedClass);
                      const overallMeta = FLN_LEVEL_META[summary.overall];

                      return (
                        <tr key={rec.id} className="hover:bg-stone-50/70">
                          <td className="py-2.5 px-3 font-bold text-slate-800 tabular-nums">
                            {rec.roll}
                          </td>
                          <td className="py-2.5 px-3">
                            <p className="font-semibold text-slate-900">{rec.studentName}</p>
                            {summary.hasEntry ? (
                              <p className="text-[10px] text-slate-500 tabular-nums">
                                অর্জন: {toBanglaDigit(summary.masteredCount)}/{toBanglaDigit(summary.totalIndicators)} ({toBanglaDigit(summary.percent)}%) · বাংলা {toBanglaDigit(summary.domainPercents['বাংলা'])}% · Eng {toBanglaDigit(summary.domainPercents.English)}%
                              </p>
                            ) : (
                              <p className="text-[10px] text-amber-700 font-medium">
                                মূল্যায়ন বাকি — মান নির্বাচন করুন
                              </p>
                            )}
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <input
                              type="number"
                              min={0}
                              max={200}
                              value={entry?.readingWpm ?? ''}
                              placeholder={String(monthTarget.readingWpmGoal)}
                              onChange={(e) => {
                                const val = Math.max(0, Number(e.target.value) || 0);
                                updateStudentMonth(rec.id, (prev) => ({ ...prev, readingWpm: val }));
                              }}
                              className="w-16 h-8 rounded-lg border border-stone-200 px-2 text-center text-xs font-semibold tabular-nums"
                            />
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <div className="inline-flex flex-col items-center gap-0.5">
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={entry?.mathScore ?? ''}
                                placeholder={String(
                                  computeSuggestedMathScore(entry?.indicators || {}, selectedClass)
                                )}
                                onChange={(e) => {
                                  const val = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                                  updateStudentMonth(rec.id, (prev) => ({
                                    ...prev,
                                    mathScore: val,
                                    mathScoreManual: true,
                                  }));
                                }}
                                className="w-16 h-8 rounded-lg border border-stone-200 px-2 text-center text-xs font-semibold tabular-nums"
                              />
                              {entry?.mathScoreManual && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateStudentMonth(rec.id, (prev) => ({
                                      ...prev,
                                      mathScoreManual: false,
                                      mathScore: computeSuggestedMathScore(
                                        prev.indicators || {},
                                        selectedClass
                                      ),
                                    }))
                                  }
                                  className="text-[10px] font-semibold text-emerald-700 hover:underline"
                                >
                                  অটো %
                                </button>
                              )}
                            </div>
                          </td>
                          {filteredIndicators.map((ind) => {
                            const lvl: FlnLevel = entry?.indicators[ind.id] || 'remedial';
                            const meta = FLN_LEVEL_META[lvl];
                            return (
                              <td key={ind.id} className="py-2.5 px-2">
                                <div className="flex flex-col gap-1">
                                  <button
                                    type="button"
                                    onClick={() => cycleIndicatorLevel(rec.id, ind.id)}
                                    title="মান পরিবর্তন করতে ক্লিক করুন"
                                    className={`w-full rounded-lg border px-2 py-1 text-[11px] font-semibold text-left transition-colors ${
                                      summary.hasEntry
                                        ? meta.badgeClass
                                        : 'border-stone-200 bg-stone-50 text-slate-500'
                                    }`}
                                  >
                                    {summary.hasEntry ? `${meta.symbol} ${meta.shortLabel}` : '— বাকি'}
                                  </button>
                                  <div className="flex gap-1">
                                    {LEVEL_ORDER.map((opt) => (
                                      <button
                                        key={opt}
                                        type="button"
                                        onClick={() => setIndicatorLevel(rec.id, ind.id, opt)}
                                        className={`flex-1 rounded px-1 py-0.5 text-[10px] font-medium border ${
                                          summary.hasEntry && lvl === opt
                                            ? 'border-slate-800 bg-slate-800 text-white'
                                            : 'border-stone-200 bg-white text-slate-500 hover:bg-stone-100'
                                        }`}
                                      >
                                        {opt === 'mastered'
                                          ? 'দক্ষ'
                                          : opt === 'developing'
                                          ? 'মধ্যম'
                                          : 'নিরাময়'}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </td>
                            );
                          })}
                          <td className="py-2.5 px-2 text-center">
                            {summary.hasEntry ? (
                              <span
                                className={`inline-block rounded-lg border px-2 py-1 text-[11px] font-bold whitespace-nowrap tabular-nums ${overallMeta.badgeClass}`}
                              >
                                {overallMeta.symbol} {overallMeta.shortLabel} · {toBanglaDigit(summary.percent)}%
                              </span>
                            ) : (
                              <span className="inline-block rounded-lg border border-stone-200 bg-stone-50 px-2 py-1 text-[11px] font-semibold text-slate-500 whitespace-nowrap">
                                — বাকি
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-2 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleMarkAllMasteredForStudent(rec.id)}
                              title="সব সূচকে অর্জিত চিহ্নিত করুন"
                              className="inline-flex h-8 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 px-2 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-100 mr-1"
                            >
                              সব দক্ষ
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveStudent(rec.id)}
                              title="মুছে ফেলুন"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-emerald-50/80 border-t-2 border-emerald-200 text-emerald-950 font-bold">
                    <tr>
                      <td className="py-3 px-3 text-center" colSpan={2}>
                        শ্রেণির গড় ও অটো % ({toBanglaDigit(monthStats.assessedCount)}/
                        {toBanglaDigit(monthStats.totalStudents)} জন মূল্যায়িত ·{' '}
                        {toBanglaDigit(monthStats.assessedPct)}%)
                      </td>
                      <td className="py-3 px-2 text-center tabular-nums">
                        {toBanglaDigit(monthStats.avgWpm)} WPM
                      </td>
                      <td className="py-3 px-2 text-center tabular-nums">
                        {toBanglaDigit(monthStats.avgMathScore)}%
                      </td>
                      {filteredIndicators.map((ind) => {
                        const st = monthStats.indicatorStats[ind.id];
                        return (
                          <td key={ind.id} className="py-3 px-2 text-center tabular-nums">
                            <div>{toBanglaDigit(st?.attainmentPct ?? 0)}%</div>
                            <div className="text-[10px] font-medium text-emerald-800">
                              দক্ষ: {toBanglaDigit(st?.masteredCount ?? 0)}/{toBanglaDigit(st?.assessedCount ?? 0)} ({toBanglaDigit(st?.masteryPct ?? 0)}%)
                            </div>
                          </td>
                        );
                      })}
                      <td className="py-3 px-2 text-center tabular-nums">
                        <div>{toBanglaDigit(monthStats.overallFlnPct)}%</div>
                        <div className="text-[10px] font-medium text-emerald-800">
                          ● {toBanglaDigit(monthStats.masteredPct)}%
                        </div>
                      </td>
                      <td className="py-3 px-2 text-right text-[10px] font-semibold text-emerald-800">
                        অটো হিসাব
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 1.5: Month-wise FLN Passages & Question Paper (Printable A4 Portrait Narrow Margin) */}
      {activeTab === 'questions' && (
        <div className="space-y-4">
          {/* Control Strip */}
          <div className="no-print rounded-2xl bg-white border border-stone-200 p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {(['সব', 'বাংলা', 'English', 'গণিত'] as const).map((sub) => (
                <button
                  key={sub}
                  type="button"
                  onClick={() => setQuestionSubjectFilter(sub)}
                  className={`h-9 rounded-xl px-3.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                    questionSubjectFilter === sub
                      ? 'bg-[#102A23] text-white'
                      : 'bg-stone-100 text-slate-700 hover:bg-stone-200'
                  }`}
                >
                  {sub === 'সব' ? 'সকল বিষয় (পূর্ণ সেট)' : sub}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowQuestionAnswers((v) => !v)}
                className={`inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition-colors whitespace-nowrap ${
                  showQuestionAnswers
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                    : 'border-amber-300 bg-amber-50 text-amber-900'
                }`}
              >
                {showQuestionAnswers ? (
                  <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                <span>
                  {showQuestionAnswers ? 'শিক্ষক কপি (উত্তরসহ)' : 'শিক্ষার্থী কপি (উত্তর ছাড়া)'}
                </span>
              </button>

              <button
                type="button"
                onClick={handleExportPdf}
                disabled={exportingPdf}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-emerald-700 px-3.5 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-60 whitespace-nowrap"
              >
                {exportingPdf ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <FileDown className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                <span>{exportingPdf ? 'PDF হচ্ছে...' : 'প্রশ্ন PDF (A4)'}</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#102A23] px-3.5 text-xs font-semibold text-white hover:bg-emerald-950 whitespace-nowrap"
              >
                <Printer className="h-3.5 w-3.5" aria-hidden="true" />
                <span>প্রিন্ট (A4 মার্জিনবিহীন)</span>
              </button>
            </div>
          </div>

          {/* Printable A4 Portrait Sheet (Narrow Margin 12.7mm) */}
          <div
            ref={questionSheetRef}
            className="relative overflow-hidden print-only-sheet rounded-2xl bg-white border border-stone-200 p-5 sm:p-7 text-slate-900 max-w-[900px] mx-auto"
          >
            <OfficialWatermark opacityClass="opacity-[0.04]" />

            <div className="relative z-10 space-y-4">
              <OfficialA4Letterhead
                schoolName={profile.school || '৮২ নং কোলা সরকারি প্রাথমিক বিদ্যালয়'}
                addressLine={`${profile.villagePost ? profile.villagePost + ', ' : ''}${profile.upazila || 'আশাশুনি'}, ${profile.district || 'সাতক্ষীরা'}`}
                documentTitle={currentQuestionSet.title}
                subtitle={`লক্ষ্য পঠন গতি: ${toBanglaDigit(currentQuestionSet.targetWpm)}+ শব্দ/মিনিট · প্রান্তিক যোগ্যতা ভিত্তিক মাসিক FLN যাচাই (${showQuestionAnswers ? 'শিক্ষক নির্দেশিকা ও উত্তরসহ' : 'শিক্ষার্থী মূল্যায়ন কপি'})`}
                compact
              />

              {/* Student Test Header Line */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border border-slate-500 rounded-md px-3 py-2 text-xs bg-slate-50/70">
                <div>
                  <strong>শিক্ষার্থীর নাম:</strong> ..............................
                </div>
                <div>
                  <strong>শ্রেণি ও রোল:</strong> {selectedClass}, .........
                </div>
                <div>
                  <strong>মাস:</strong> {currentQuestionSet.monthName} ২০২৬
                </div>
                <div>
                  <strong>তারিখ:</strong> ............................
                </div>
              </div>

              {/* BANGLA PASSAGE & QUESTIONS */}
              {(questionSubjectFilter === 'সব' || questionSubjectFilter === 'বাংলা') && (
                <section
                  style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
                  className="border border-slate-400 rounded-lg p-3.5 space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-300 pb-1.5">
                    <h3 className="text-sm font-extrabold text-emerald-950">
                      ক) বাংলা সাবলীল পঠন (ORF) অনুচ্ছেদ ও বোধগম্যতা যাচাই
                    </h3>
                    <span className="text-[11px] font-semibold text-slate-600 tabular-nums">
                      অনুচ্ছেদ শব্দসংখ্যা: {toBanglaDigit(currentQuestionSet.bangla.wordCount)} শব্দ · লক্ষ্য: ১ মিনিটে {toBanglaDigit(currentQuestionSet.targetWpm)}+ শব্দ
                    </span>
                  </div>

                  <div className="rounded-md bg-emerald-50/40 border border-emerald-200 p-3">
                    <p className="text-xs font-bold text-slate-800 mb-1">
                      পাঠ শিরোনাম: {currentQuestionSet.bangla.passageTitle}
                    </p>
                    <p className="text-[14px] leading-[1.75] text-slate-950 font-medium">
                      {currentQuestionSet.bangla.passageText}
                    </p>
                  </div>

                  <div className="text-xs text-slate-700">
                    <strong>যুক্তবর্ণ / ধ্বনি যাচাই: </strong>
                    {currentQuestionSet.bangla.juktobornoPractice.join(' · ')}
                  </div>

                  <div className="space-y-1.5 text-xs pt-1">
                    <p className="font-bold text-slate-900">বোধগম্যতা ও লিখন প্রশ্নোত্তর:</p>
                    {currentQuestionSet.bangla.questions.map((item, idx) => (
                      <div key={idx} className="pl-2 space-y-0.5">
                        <p className="font-semibold text-slate-900">
                          {toBanglaDigit(idx + 1)}। {item.q}
                        </p>
                        {showQuestionAnswers ? (
                          <p className="text-emerald-900 font-medium pl-3">
                            উত্তর: {item.a}
                          </p>
                        ) : (
                          <p className="text-slate-400 pl-3">
                            উত্তর: .................................................................................................................................
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* ENGLISH PASSAGE & QUESTIONS */}
              {(questionSubjectFilter === 'সব' || questionSubjectFilter === 'English') && (
                <section
                  style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
                  className="border border-slate-400 rounded-lg p-3.5 space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-300 pb-1.5">
                    <h3 className="text-sm font-extrabold text-sky-950">
                      খ) English Reading Fluency &amp; Comprehension Verification
                    </h3>
                    <span className="text-[11px] font-semibold text-slate-600 tabular-nums">
                      Words: {toBanglaDigit(currentQuestionSet.english.wordCount)} · Key Words:{' '}
                      {currentQuestionSet.english.vocabulary.join(', ')}
                    </span>
                  </div>

                  <div className="rounded-md bg-sky-50/40 border border-sky-200 p-3">
                    <p className="text-xs font-bold text-slate-800 mb-1">
                      Title: {currentQuestionSet.english.passageTitle}
                    </p>
                    <p className="text-[13.5px] leading-[1.65] text-slate-950 font-medium">
                      {currentQuestionSet.english.passageText}
                    </p>
                  </div>

                  <div className="space-y-1.5 text-xs pt-1">
                    <p className="font-bold text-slate-900">Short WH-Questions:</p>
                    {currentQuestionSet.english.questions.map((item, idx) => (
                      <div key={idx} className="pl-2 space-y-0.5">
                        <p className="font-semibold text-slate-900">
                          {idx + 1}. {item.q}
                        </p>
                        {showQuestionAnswers ? (
                          <p className="text-sky-900 font-medium pl-3">Ans: {item.a}</p>
                        ) : (
                          <p className="text-slate-400 pl-3">
                            Ans: .................................................................................................................................
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* MATH NUMERACY & WORD PROBLEMS */}
              {(questionSubjectFilter === 'সব' || questionSubjectFilter === 'গণিত') && (
                <section
                  style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
                  className="border border-slate-400 rounded-lg p-3.5 space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-300 pb-1.5">
                    <h3 className="text-sm font-extrabold text-amber-950">
                      গ) গণিত সংখ্যাবোধ, মানসাঙ্ক ও কথার অঙ্ক যাচাই
                    </h3>
                    <span className="text-[11px] font-semibold text-slate-600">
                      মূল বিষয়বস্তু: {currentQuestionSet.math.topicFocus}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    {currentQuestionSet.math.mentalMath.map((m, idx) => (
                      <div
                        key={idx}
                        className="rounded border border-amber-200 bg-amber-50/40 p-2 space-y-1"
                      >
                        <p className="font-semibold text-slate-900">
                          {toBanglaDigit(idx + 1)}) {m.q}
                        </p>
                        {showQuestionAnswers ? (
                          <p className="text-amber-950 font-bold">উত্তর: {m.a}</p>
                        ) : (
                          <p className="text-slate-400">উত্তর: .................</p>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="space-y-1.5 text-xs pt-1">
                    <p className="font-bold text-slate-900">কাঠামোবদ্ধ / কথার অঙ্ক সমাধান:</p>
                    {currentQuestionSet.math.wordProblems.map((wp, idx) => (
                      <div key={idx} className="pl-2 space-y-0.5">
                        <p className="font-semibold text-slate-900">
                          {toBanglaDigit(idx + 1)}। {wp.q}
                        </p>
                        {showQuestionAnswers ? (
                          <p className="text-emerald-900 font-semibold pl-3">
                            সমাধান: {wp.a}
                          </p>
                        ) : (
                          <div className="pl-3 pt-2 pb-1 border-b border-dotted border-slate-400 text-[11px] text-slate-400">
                            সমাধানের স্থান:
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Oral & WPM Assessment Rubric Box */}
              <div
                style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
                className="border border-slate-700 rounded-md p-3 bg-slate-50/80 text-xs space-y-2"
              >
                <p className="font-bold text-slate-900">
                  শিক্ষকের তাৎক্ষণিক FLN মূল্যায়ন রেকর্ড ({currentQuestionSet.monthName}):
                </p>
                <p className="text-[11px] text-slate-600">
                  <strong>যাচাই নির্দেশনা: </strong>
                  {currentQuestionSet.oralCheckNote}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px] font-semibold">
                  <div className="border border-slate-300 bg-white px-2 py-1.5 rounded">
                    বাংলা পঠন গতি: ........ / {toBanglaDigit(currentQuestionSet.targetWpm)} WPM
                  </div>
                  <div className="border border-slate-300 bg-white px-2 py-1.5 rounded">
                    গণিত প্রাপ্ত নম্বর: .......... / ১০০
                  </div>
                  <div className="border border-slate-300 bg-white px-2 py-1.5 rounded col-span-2">
                    অর্জন স্তর: [ ] ● অর্জিত &nbsp;&nbsp; [ ] ◐ অগ্রসরমান &nbsp;&nbsp; [ ] ▲ নিরাময়
                  </div>
                </div>
                <div className="pt-5 flex items-end justify-between text-[11px]">
                  <span className="text-slate-600">তারিখ: {getFormattedBanglaDate()}</span>
                  <span className="border-t border-slate-700 pt-1 px-4 font-bold">
                    মূল্যায়নকারী শিক্ষকের স্বাক্ষর ({profile.name || 'জুলফিকার রহমান'})
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: 12-Month Annual FLN Tracking Matrix */}
      {activeTab === 'matrix' && (
        <div className="rounded-2xl bg-white border border-stone-200 p-4 sm:p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-3">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                {selectedClass} — ১২ মাসের (জানুয়ারি–ডিসেম্বর) প্রান্তিক যোগ্যতাভিত্তিক FLN অগ্রগতি ম্যাট্রিক্স
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                যেকোনো মাসের ঘরে ক্লিক করে সেই মাসের বিস্তারিত মূল্যায়ন এন্ট্রি খুলতে পারবেন
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="text-emerald-800">● অর্জিত</span>
              <span className="text-amber-800">◐ অগ্রসরমান</span>
              <span className="text-rose-800">▲ নিরাময়</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse border border-stone-200">
              <thead>
                <tr className="bg-stone-50 text-slate-800">
                  <th className="border border-stone-200 py-2.5 px-2 text-center w-12">রোল</th>
                  <th className="border border-stone-200 py-2.5 px-3 text-left min-w-[140px]">
                    শিক্ষার্থীর নাম
                  </th>
                  {FLN_MONTHS.map((m) => (
                    <th
                      key={m.index}
                      className={`border border-stone-200 py-2 px-1.5 text-center min-w-[54px] ${
                        m.index === selectedMonth ? 'bg-emerald-100 text-emerald-950' : ''
                      }`}
                    >
                      {m.short}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {classRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-stone-50/70">
                    <td className="border border-stone-200 py-2 px-2 text-center font-bold tabular-nums">
                      {rec.roll}
                    </td>
                    <td className="border border-stone-200 py-2 px-3 font-semibold text-slate-900">
                      {rec.studentName}
                    </td>
                    {FLN_MONTHS.map((m) => {
                      const entry = rec.months[String(m.index)];
                      if (!entry) {
                        return (
                          <td
                            key={m.index}
                            className="border border-stone-200 py-2 px-1 text-center text-slate-400"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedMonth(m.index);
                                setActiveTab('assess');
                              }}
                              className="w-full py-1 hover:text-emerald-800"
                              title={`${m.name} এন্ট্রি করুন`}
                            >
                              —
                            </button>
                          </td>
                        );
                      }
                      const summary = evaluateFlnEntryOverall(entry, selectedClass);
                      const meta = FLN_LEVEL_META[summary.overall];
                      return (
                        <td
                          key={m.index}
                          className={`border border-stone-200 py-1.5 px-1 text-center ${
                            m.index === selectedMonth ? 'ring-1 ring-inset ring-emerald-500' : ''
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedMonth(m.index);
                              setActiveTab('assess');
                            }}
                            className={`w-full rounded px-1 py-1 text-[11px] font-bold tabular-nums ${meta.badgeClass}`}
                            title={`${m.name}: ${meta.label} · ${entry.readingWpm || 0} WPM`}
                          >
                            {meta.symbol} {toBanglaDigit(summary.percent)}%
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-emerald-50/80 text-emerald-950 font-bold">
                  <td className="border border-stone-200 py-2.5 px-3 text-center" colSpan={2}>
                    মাসভিত্তিক শ্রেণির গড় FLN (%)
                  </td>
                  {matrixMonthSummaries.map((mSum, idx) => (
                    <td
                      key={idx}
                      className={`border border-stone-200 py-2 px-1 text-center tabular-nums ${
                        idx === selectedMonth ? 'bg-emerald-100' : ''
                      }`}
                    >
                      {mSum.assessedCount > 0 ? `${toBanglaDigit(mSum.overallFlnPct)}%` : '—'}
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Official A4 Landscape Narrow Margin Print & PDF Report (Auto FLN Form) */}
      {activeTab === 'preview' && (
        <div className="space-y-4">
          <div className="no-print flex flex-wrap items-center justify-between gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-xs text-emerald-950">
            <span className="font-semibold">
              অফিসিয়াল A4 Landscape (মার্জিনবিহীন: ০ মিমি) অটো পূরণকৃত FLN ফরম ও প্রতিবেদন
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setPreviewIncludeSchoolSummary((v) => !v)}
                className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition-colors ${
                  previewIncludeSchoolSummary
                    ? 'border-emerald-700 bg-white text-emerald-900'
                    : 'border-stone-300 bg-white/70 text-slate-700'
                }`}
              >
                <span>
                  {previewIncludeSchoolSummary
                    ? '✓ সকল শ্রেণিসহ স্কুল ফরম যুক্ত আছে'
                    : 'সকল শ্রেণির সারসংক্ষেপ যোগ করুন'}
                </span>
              </button>
              <button
                type="button"
                onClick={handleExportPdf}
                disabled={exportingPdf}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-700 px-3 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
              >
                {exportingPdf ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <FileDown className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                <span>{exportingPdf ? 'PDF হচ্ছে...' : 'PDF ডাউনলোড (A4)'}</span>
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#102A23] px-3 text-xs font-semibold text-white hover:bg-emerald-950"
              >
                <Printer className="h-3.5 w-3.5" aria-hidden="true" />
                <span>প্রিন্ট (A4 মার্জিনবিহীন)</span>
              </button>
            </div>
          </div>

          <div
            ref={reportRef}
            className="relative overflow-hidden print-only-sheet rounded-2xl bg-white border border-stone-200 p-5 sm:p-7 text-slate-900"
          >
            <OfficialWatermark opacityClass="opacity-[0.04]" />

            <div className="relative z-10 space-y-4">
              <OfficialA4Letterhead
                schoolName={profile.school || '৮২ নং কোলা সরকারি প্রাথমিক বিদ্যালয়'}
                addressLine={`${profile.villagePost ? profile.villagePost + ', ' : ''}${profile.upazila || 'আশাশুনি'}, ${profile.district || 'সাতক্ষীরা'}`}
                documentTitle={`মাসিক ও বার্ষিক FLN (প্রান্তিক যোগ্যতাভিত্তিক) তথ্য ফরম ও প্রতিবেদন — ${selectedClass}`}
                subtitle={`প্রতিবেদনের মাস: ${currentMilestone.monthName} ২০২৬ · সকল শিক্ষার্থীর ডাটা থেকে স্বয়ংক্রিয়ভাবে % হিসাবকৃত`}
                compact
              />

              {/* Auto-Calculated FLN Summary Form Box */}
              <div className="border border-slate-700 rounded-md p-2.5 bg-emerald-50/40 space-y-2">
                <p className="text-[11px] font-bold text-slate-900">
                  ক) {selectedClass}-এর মাসিক FLN সারসংক্ষেপ ফরম (সকল শিক্ষার্থীর ডাটা থেকে অটো %):
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-1.5 text-[10px] tabular-nums">
                  <div className="border border-slate-400 bg-white px-2 py-1.5 rounded">
                    <p className="text-slate-500">মোট শিক্ষার্থী</p>
                    <p className="font-bold text-slate-900">{toBanglaDigit(monthStats.totalStudents)} জন</p>
                  </div>
                  <div className="border border-slate-400 bg-white px-2 py-1.5 rounded">
                    <p className="text-slate-500">মূল্যায়িত (%)</p>
                    <p className="font-bold text-slate-900">
                      {toBanglaDigit(monthStats.assessedCount)} জন ({toBanglaDigit(monthStats.assessedPct)}%)
                    </p>
                  </div>
                  <div className="border border-emerald-500 bg-emerald-50 px-2 py-1.5 rounded">
                    <p className="text-emerald-900">● অর্জিত (দক্ষ)</p>
                    <p className="font-bold text-emerald-950">
                      {toBanglaDigit(monthStats.masteredCount)} জন ({toBanglaDigit(monthStats.masteredPct)}%)
                    </p>
                  </div>
                  <div className="border border-amber-500 bg-amber-50 px-2 py-1.5 rounded">
                    <p className="text-amber-900">◐ অগ্রসরমান</p>
                    <p className="font-bold text-amber-950">
                      {toBanglaDigit(monthStats.developingCount)} জন ({toBanglaDigit(monthStats.developingPct)}%)
                    </p>
                  </div>
                  <div className="border border-rose-500 bg-rose-50 px-2 py-1.5 rounded">
                    <p className="text-rose-900">▲ নিরাময়</p>
                    <p className="font-bold text-rose-950">
                      {toBanglaDigit(monthStats.remedialCount)} জন ({toBanglaDigit(monthStats.remedialPct)}%)
                    </p>
                  </div>
                  <div className="border border-slate-400 bg-white px-2 py-1.5 rounded">
                    <p className="text-slate-500">বাংলা / English</p>
                    <p className="font-bold text-slate-900">
                      {toBanglaDigit(monthStats.banglaAvgPct)}% / {toBanglaDigit(monthStats.englishAvgPct)}%
                    </p>
                  </div>
                  <div className="border border-slate-400 bg-white px-2 py-1.5 rounded">
                    <p className="text-slate-500">গণিত / পঠন গতি</p>
                    <p className="font-bold text-slate-900">
                      {toBanglaDigit(monthStats.avgMathScore)}% / {toBanglaDigit(monthStats.avgWpm)} WPM
                    </p>
                  </div>
                  <div className="border border-slate-700 bg-slate-900 text-white px-2 py-1.5 rounded">
                    <p className="text-emerald-200">সার্বিক FLN %</p>
                    <p className="font-bold text-sm">{toBanglaDigit(monthStats.overallFlnPct)}%</p>
                  </div>
                </div>
              </div>

              {/* Month Target Summary Box inside Sheet */}
              <div className="grid grid-cols-3 gap-2 text-[11px] border border-slate-400 p-2.5 bg-slate-50/70">
                <div>
                  <p className="font-bold text-slate-900">বাংলা প্রান্তিক লক্ষ্য:</p>
                  <p className="text-slate-700">{monthTarget.literacyBanglaTarget}</p>
                </div>
                <div>
                  <p className="font-bold text-slate-900">English প্রান্তিক লক্ষ্য:</p>
                  <p className="text-slate-700">{monthTarget.literacyEnglishTarget}</p>
                </div>
                <div>
                  <p className="font-bold text-slate-900">গণিত প্রান্তিক লক্ষ্য:</p>
                  <p className="text-slate-700">{monthTarget.numeracyMathTarget}</p>
                </div>
              </div>

              {/* Monthly Indicator Table */}
              <div>
                <p className="text-xs font-bold text-slate-900 mb-1.5">
                  খ) {currentMilestone.monthName} মাসের প্রান্তিক যোগ্যতাভিত্তিক FLN যাচাই বিবরণী ({selectedClass}):
                </p>
                <table className="w-full text-[11px] border-collapse border border-slate-700">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border border-slate-700 py-1.5 px-2 text-center">রোল</th>
                      <th className="border border-slate-700 py-1.5 px-2 text-left">শিক্ষার্থীর নাম</th>
                      <th className="border border-slate-700 py-1.5 px-2 text-center">পঠন (WPM)</th>
                      <th className="border border-slate-700 py-1.5 px-2 text-center">গণিত (%)</th>
                      {classIndicators.map((ind) => (
                        <th key={ind.id} className="border border-slate-700 py-1.5 px-2 text-center">
                          {ind.competencyCode}
                        </th>
                      ))}
                      <th className="border border-slate-700 py-1.5 px-2 text-center">অর্জন স্তর (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classRecords.map((rec) => {
                      const entry = rec.months[String(selectedMonth)];
                      const summary = evaluateFlnEntryOverall(entry, selectedClass);
                      const overallMeta = FLN_LEVEL_META[summary.overall];
                      return (
                        <tr key={rec.id}>
                          <td className="border border-slate-700 py-1 px-2 text-center tabular-nums font-semibold">
                            {rec.roll}
                          </td>
                          <td className="border border-slate-700 py-1 px-2 font-medium">
                            {rec.studentName}
                          </td>
                          <td className="border border-slate-700 py-1 px-2 text-center tabular-nums">
                            {entry?.readingWpm ? toBanglaDigit(entry.readingWpm) : '—'}
                          </td>
                          <td className="border border-slate-700 py-1 px-2 text-center tabular-nums">
                            {entry?.mathScore !== undefined ? `${toBanglaDigit(entry.mathScore)}%` : '—'}
                          </td>
                          {classIndicators.map((ind) => {
                            if (!summary.hasEntry) {
                              return (
                                <td key={ind.id} className="border border-slate-700 py-1 px-2 text-center text-slate-400">
                                  —
                                </td>
                              );
                            }
                            const lvl: FlnLevel = entry?.indicators[ind.id] || 'remedial';
                            const meta = FLN_LEVEL_META[lvl];
                            return (
                              <td key={ind.id} className="border border-slate-700 py-1 px-2 text-center">
                                {meta.symbol} {meta.shortLabel}
                              </td>
                            );
                          })}
                          <td className="border border-slate-700 py-1 px-2 text-center font-bold tabular-nums">
                            {summary.hasEntry
                              ? `${overallMeta.shortLabel} (${toBanglaDigit(summary.percent)}%)`
                              : '— বাকি'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-bold tabular-nums">
                      <td className="border border-slate-700 py-1.5 px-2 text-center" colSpan={2}>
                        শ্রেণির গড় ও অটো % ({toBanglaDigit(monthStats.assessedCount)}/
                        {toBanglaDigit(monthStats.totalStudents)} জন)
                      </td>
                      <td className="border border-slate-700 py-1.5 px-2 text-center">
                        {toBanglaDigit(monthStats.avgWpm)}
                      </td>
                      <td className="border border-slate-700 py-1.5 px-2 text-center">
                        {toBanglaDigit(monthStats.avgMathScore)}%
                      </td>
                      {classIndicators.map((ind) => {
                        const st = monthStats.indicatorStats[ind.id];
                        return (
                          <td key={ind.id} className="border border-slate-700 py-1.5 px-2 text-center">
                            {toBanglaDigit(st?.attainmentPct ?? 0)}%
                          </td>
                        );
                      })}
                      <td className="border border-slate-700 py-1.5 px-2 text-center">
                        {toBanglaDigit(monthStats.overallFlnPct)}% (● {toBanglaDigit(monthStats.masteredPct)}%)
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* School-wide All-Class Auto % Summary Form */}
              {previewIncludeSchoolSummary && (
                <div style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                  <p className="text-xs font-bold text-slate-900 mb-1.5">
                    গ) বিদ্যালয়ভিত্তিক সকল শ্রেণির FLN সারসংক্ষেপ ফরম — {currentMilestone.monthName} ২০২৬ (সকল শিক্ষার্থীর ডাটা থেকে স্বয়ংক্রিয় %):
                  </p>
                  <table className="w-full text-[10px] border-collapse border border-slate-700 tabular-nums">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="border border-slate-700 py-1 px-2 text-left">শ্রেণি</th>
                        <th className="border border-slate-700 py-1 px-1.5 text-center">মোট</th>
                        <th className="border border-slate-700 py-1 px-1.5 text-center">মূল্যায়িত (%)</th>
                        <th className="border border-slate-700 py-1 px-1.5 text-center">● অর্জিত (%)</th>
                        <th className="border border-slate-700 py-1 px-1.5 text-center">◐ অগ্রসরমান (%)</th>
                        <th className="border border-slate-700 py-1 px-1.5 text-center">▲ নিরাময় (%)</th>
                        <th className="border border-slate-700 py-1 px-1.5 text-center">বাংলা (%)</th>
                        <th className="border border-slate-700 py-1 px-1.5 text-center">English (%)</th>
                        <th className="border border-slate-700 py-1 px-1.5 text-center">গণিত (%)</th>
                        <th className="border border-slate-700 py-1 px-1.5 text-center">গড় WPM</th>
                        <th className="border border-slate-700 py-1 px-1.5 text-center">সার্বিক FLN (%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schoolSummary.classes.map((clsRow) => (
                        <tr
                          key={clsRow.classLevel}
                          className={clsRow.classLevel === selectedClass ? 'bg-emerald-50/70 font-semibold' : ''}
                        >
                          <td className="border border-slate-700 py-1 px-2 font-semibold">
                            {clsRow.classLevel}
                          </td>
                          <td className="border border-slate-700 py-1 px-1.5 text-center">
                            {toBanglaDigit(clsRow.totalStudents)}
                          </td>
                          <td className="border border-slate-700 py-1 px-1.5 text-center">
                            {toBanglaDigit(clsRow.assessedCount)} ({toBanglaDigit(clsRow.assessedPct)}%)
                          </td>
                          <td className="border border-slate-700 py-1 px-1.5 text-center">
                            {toBanglaDigit(clsRow.masteredCount)} ({toBanglaDigit(clsRow.masteredPct)}%)
                          </td>
                          <td className="border border-slate-700 py-1 px-1.5 text-center">
                            {toBanglaDigit(clsRow.developingCount)} ({toBanglaDigit(clsRow.developingPct)}%)
                          </td>
                          <td className="border border-slate-700 py-1 px-1.5 text-center">
                            {toBanglaDigit(clsRow.remedialCount)} ({toBanglaDigit(clsRow.remedialPct)}%)
                          </td>
                          <td className="border border-slate-700 py-1 px-1.5 text-center">
                            {clsRow.assessedCount > 0 ? `${toBanglaDigit(clsRow.banglaAvgPct)}%` : '—'}
                          </td>
                          <td className="border border-slate-700 py-1 px-1.5 text-center">
                            {clsRow.assessedCount > 0 ? `${toBanglaDigit(clsRow.englishAvgPct)}%` : '—'}
                          </td>
                          <td className="border border-slate-700 py-1 px-1.5 text-center">
                            {clsRow.assessedCount > 0 ? `${toBanglaDigit(clsRow.avgMathScore)}%` : '—'}
                          </td>
                          <td className="border border-slate-700 py-1 px-1.5 text-center">
                            {clsRow.avgWpm > 0 ? toBanglaDigit(clsRow.avgWpm) : '—'}
                          </td>
                          <td className="border border-slate-700 py-1 px-1.5 text-center font-bold">
                            {clsRow.assessedCount > 0 ? `${toBanglaDigit(clsRow.overallFlnPct)}%` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-200 font-bold">
                        <td className="border border-slate-700 py-1.5 px-2">সর্বমোট / বিদ্যালয় গড়</td>
                        <td className="border border-slate-700 py-1.5 px-1.5 text-center">
                          {toBanglaDigit(schoolSummary.totals.totalStudents)}
                        </td>
                        <td className="border border-slate-700 py-1.5 px-1.5 text-center">
                          {toBanglaDigit(schoolSummary.totals.assessedCount)} ({toBanglaDigit(schoolSummary.totals.assessedPct)}%)
                        </td>
                        <td className="border border-slate-700 py-1.5 px-1.5 text-center">
                          {toBanglaDigit(schoolSummary.totals.masteredCount)} ({toBanglaDigit(schoolSummary.totals.masteredPct)}%)
                        </td>
                        <td className="border border-slate-700 py-1.5 px-1.5 text-center">
                          {toBanglaDigit(schoolSummary.totals.developingCount)} ({toBanglaDigit(schoolSummary.totals.developingPct)}%)
                        </td>
                        <td className="border border-slate-700 py-1.5 px-1.5 text-center">
                          {toBanglaDigit(schoolSummary.totals.remedialCount)} ({toBanglaDigit(schoolSummary.totals.remedialPct)}%)
                        </td>
                        <td className="border border-slate-700 py-1.5 px-1.5 text-center">
                          {toBanglaDigit(schoolSummary.totals.banglaAvgPct)}%
                        </td>
                        <td className="border border-slate-700 py-1.5 px-1.5 text-center">
                          {toBanglaDigit(schoolSummary.totals.englishAvgPct)}%
                        </td>
                        <td className="border border-slate-700 py-1.5 px-1.5 text-center">
                          {toBanglaDigit(schoolSummary.totals.avgMathScore)}%
                        </td>
                        <td className="border border-slate-700 py-1.5 px-1.5 text-center">
                          {toBanglaDigit(schoolSummary.totals.avgWpm)}
                        </td>
                        <td className="border border-slate-700 py-1.5 px-1.5 text-center">
                          {toBanglaDigit(schoolSummary.totals.overallFlnPct)}%
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}

              {/* 12-Month Summary Matrix inside A4 Sheet */}
              <div>
                <p className="text-xs font-bold text-slate-900 mb-1.5">
                  {previewIncludeSchoolSummary ? 'ঘ' : 'গ'}) ১২ মাসের (জানুয়ারি–ডিসেম্বর) বার্ষিক FLN অর্জনের তুলনামূলক ছক:
                </p>
                <table className="w-full text-[10px] border-collapse border border-slate-700">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border border-slate-700 py-1 px-1.5 text-center">রোল</th>
                      <th className="border border-slate-700 py-1 px-2 text-left">নাম</th>
                      {FLN_MONTHS.map((m) => (
                        <th key={m.index} className="border border-slate-700 py-1 px-1 text-center">
                          {m.short}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {classRecords.map((rec) => (
                      <tr key={rec.id}>
                        <td className="border border-slate-700 py-1 px-1.5 text-center tabular-nums">
                          {rec.roll}
                        </td>
                        <td className="border border-slate-700 py-1 px-2">{rec.studentName}</td>
                        {FLN_MONTHS.map((m) => {
                          const entry = rec.months[String(m.index)];
                          if (!entry) {
                            return (
                              <td key={m.index} className="border border-slate-700 py-1 px-1 text-center">
                                —
                              </td>
                            );
                          }
                          const summary = evaluateFlnEntryOverall(entry, selectedClass);
                          return (
                            <td
                              key={m.index}
                              className="border border-slate-700 py-1 px-1 text-center tabular-nums"
                            >
                              {toBanglaDigit(summary.percent)}%
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-bold tabular-nums">
                      <td className="border border-slate-700 py-1 px-2 text-center" colSpan={2}>
                        মাসভিত্তিক শ্রেণির গড় (%)
                      </td>
                      {matrixMonthSummaries.map((mSum, idx) => (
                        <td key={idx} className="border border-slate-700 py-1 px-1 text-center">
                          {mSum.assessedCount > 0 ? `${toBanglaDigit(mSum.overallFlnPct)}%` : '—'}
                        </td>
                      ))}
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Signatures */}
              <div className="pt-8 flex items-end justify-between text-xs">
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
        </div>
      )}
    </PageShell>
  );
}
