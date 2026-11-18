import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Plus,
  Printer,
  BookOpen,
  CheckCircle2,
  X,
  FileDown,
  Loader2,
  Pencil,
  Copy,
  Trash2,
  RotateCcw,
  Search,
  CalendarRange,
  CalendarDays,
  FileText,
  Filter,
  BellRing,
  BookMarked,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { PageShell } from '../components/PageShell';
import { OfficialA4Letterhead } from '../components/OfficialEmblems';
import { TeacherGuideModal } from '../components/TeacherGuideModal';
import { CLASS_LEVELS, INITIAL_LESSON_PLANS, SUBJECTS_BY_CLASS } from '../data/curriculum';
import {
  ANNUAL_PLAN_CLASSES,
  ANNUAL_PLAN_SUBJECTS_BY_CLASS,
  buildDailyLessonPlanFromRow,
  buildDateWiseSchedule,
  clampPlanYear,
  DateWisePlanRow,
  DEFAULT_PLAN_YEARS,
  getMonthsListForYear,
  MAX_PLAN_YEAR,
  MIN_PLAN_YEAR,
  TermKey,
} from '../data/dateWiseAnnualPlans2026';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { LessonPlanItem, RouteKey, TeacherProfile } from '../types';
import { getFormattedBanglaDate, toBanglaDigit } from '../utils/bangla';
import {
  DEFAULT_LESSON_REMINDER_PREFS,
  getLocalIsoDate,
  LESSON_REMINDER_PREFS_KEY,
  LessonReminderPrefs,
  normalizeReminderPrefs,
  resolveCalendarIso,
} from '../utils/lessonReminders';
import {
  guideInputFromDateRow,
  LessonTeacherGuideInput,
  resolveLessonTeacherGuide,
} from '../utils/teacherGuideLookup';
import { exportElementToA4Pdf } from '../utils/pdfExport';
import { triggerSmartPrint } from '../utils/printHelper';

interface LessonPlanPageProps {
  profile: TeacherProfile;
  onNavigate: (route: RouteKey) => void;
  printReady?: boolean;
  onTogglePrintReady?: () => void;
}

type TermOption = TermKey;
type ViewMode = 'datewise' | 'daily';

interface DateRowOverride {
  sessionLabel?: string;
  chapterTitle?: string;
  topicDetail?: string;
  pageNumber?: string;
  remark?: string;
  dayTypeOverride?: 'teaching' | 'govt_holiday';
}

interface PlanFormState {
  classLevel: string;
  subject: string;
  term: TermOption;
  chapter: string;
  lessonTitle: string;
  duration: string;
  learningOutcomes: string;
  materials: string;
  warmUp: string;
  presentation: string;
  evaluation: string;
  homework: string;
}

const TERM_TO_PART: Record<TermOption, 'পার্ট ১' | 'পার্ট ২' | 'পার্ট ৩'> = {
  '১ম প্রান্তিক': 'পার্ট ১',
  '২য় প্রান্তিক': 'পার্ট ২',
  '৩য় প্রান্তিক': 'পার্ট ৩',
};

const createEmptyForm = (classLevel = 'প্রথম শ্রেণি'): PlanFormState => ({
  classLevel,
  subject: (SUBJECTS_BY_CLASS[classLevel] || [])[0] || 'আমার বাংলা বই',
  term: '১ম প্রান্তিক',
  chapter: '',
  lessonTitle: '',
  duration: classLevel === 'প্রাক-প্রাথমিক' ? '৩০ মিনিট' : '৪০ মিনিট',
  learningOutcomes: '',
  materials: 'পাঠ্যবই, চক, ডাস্টার, ছবি ও ফ্ল্যাশকার্ড',
  warmUp: 'শিক্ষার্থীদের সাথে কুশল বিনিময়, ছড়া/গল্প ও পূর্বজ্ঞান যাচাই।',
  presentation: '',
  evaluation: '',
  homework: '',
});

const formFromPlan = (plan: LessonPlanItem): PlanFormState => ({
  classLevel: plan.classLevel,
  subject: plan.subject,
  term: plan.term || '১ম প্রান্তিক',
  chapter: plan.chapter,
  lessonTitle: plan.lessonTitle,
  duration: plan.duration,
  learningOutcomes: plan.learningOutcomes.join('\n'),
  materials: plan.materials.join(', '),
  warmUp: plan.warmUp,
  presentation: plan.presentation.join('\n'),
  evaluation: plan.evaluation.join('\n'),
  homework: plan.homework,
});

export default function LessonPlanPage({
  profile,
  onNavigate,
  printReady = false,
  onTogglePrintReady,
}: LessonPlanPageProps) {
  // Primary mode: Date-wise Annual Plan vs Daily Lesson Plan Studio
  const [viewMode, setViewMode] = useState<ViewMode>('datewise');

  // ==================== Date-Wise Annual Plan State ====================
  const currentCalendarYear = useMemo(() => clampPlanYear(new Date().getFullYear()), []);
  const [rawDwYear, setDwYear] = useLocalStorage<number>(
    'annual_lp_selected_year_v1',
    currentCalendarYear
  );
  const dwYear = clampPlanYear(Number(rawDwYear));

  const [dwClass, setDwClass] = useState<string>('প্রথম শ্রেণি');
  const [dwSubject, setDwSubject] = useState<string>('আমার বাংলা বই');
  const [dwMonth, setDwMonth] = useState<number | 'all'>('all');
  const [dwTerm, setDwTerm] = useState<'all' | TermKey>('all');
  const [dwDateFilter, setDwDateFilter] = useState<string>('');
  const [dwSearch, setDwSearch] = useState<string>('');
  const [dwOnlyTeachingDays, setDwOnlyTeachingDays] = useState<boolean>(false);

  const [dateRowOverrides, setDateRowOverrides] = useLocalStorage<Record<string, DateRowOverride>>(
    'datewise_lp_overrides_v1',
    {}
  );
  const [reminderPrefs, setReminderPrefs] = useLocalStorage<LessonReminderPrefs>(
    LESSON_REMINDER_PREFS_KEY,
    DEFAULT_LESSON_REMINDER_PREFS
  );
  const [editingDateRow, setEditingDateRow] = useState<DateWisePlanRow | null>(null);
  const [dateEditForm, setDateEditForm] = useState<DateRowOverride>({});
  const [activeGuideLesson, setActiveGuideLesson] = useState<LessonTeacherGuideInput | null>(null);
  const todayRealIso = useMemo(() => resolveCalendarIso(getLocalIsoDate()), []);

  const handleYearChange = (nextYearRaw: number) => {
    const nextYear = clampPlanYear(nextYearRaw);
    setDwYear(nextYear);
    if (dwDateFilter && !dwDateFilter.startsWith(`${nextYear}-`)) {
      setDwDateFilter('');
    }
  };

  // Jump from Notification Reminder to exact Class/Subject/Year/Date
  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem('lp_jump_target');
      if (!raw) return;
      window.sessionStorage.removeItem('lp_jump_target');
      const parsed = JSON.parse(raw) as {
        classLevel?: string;
        subject?: string;
        isoDate?: string;
      };
      if (parsed.classLevel && ANNUAL_PLAN_SUBJECTS_BY_CLASS[parsed.classLevel]) {
        setViewMode('datewise');
        setDwClass(parsed.classLevel);
        if (
          parsed.subject &&
          ANNUAL_PLAN_SUBJECTS_BY_CLASS[parsed.classLevel].includes(parsed.subject)
        ) {
          setDwSubject(parsed.subject);
        }
        if (parsed.isoDate) {
          const parsedYear = Number(parsed.isoDate.slice(0, 4));
          if (Number.isFinite(parsedYear) && parsedYear >= MIN_PLAN_YEAR) {
            setDwYear(clampPlanYear(parsedYear));
          }
          setDwMonth('all');
          setDwTerm('all');
          setDwOnlyTeachingDays(false);
          setDwDateFilter(parsed.isoDate);
        }
      }
    } catch {
      // ignore invalid session payload
    }
  }, [setDwYear]);

  // ==================== Daily Lesson Plan State ====================
  const [plans, setPlans] = useLocalStorage<LessonPlanItem[]>(
    'custom_lesson_plans_v1',
    INITIAL_LESSON_PLANS
  );

  const [selectedClass, setSelectedClass] = useState<string>('সকল শ্রেণি');
  const [selectedSubject, setSelectedSubject] = useState<string>('সকল বিষয়');
  const [selectedTerm, setSelectedTerm] = useState<string>('সকল প্রান্তিক');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activePlanId, setActivePlanId] = useState<string>(plans[0]?.id || '');

  // Modal state for Create & Edit Daily Plan
  const [editorMode, setEditorMode] = useState<'create' | 'edit' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState<PlanFormState>(() => createEmptyForm('প্রথম শ্রেণি'));

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [exportingPdf, setExportingPdf] = useState(false);
  const [pdfError, setPdfError] = useState('');

  const annualSheetRef = useRef<HTMLDivElement>(null);
  const dailySheetRef = useRef<HTMLDivElement>(null);

  // One-time safe seed merge for daily plans
  useEffect(() => {
    try {
      const seededFlag = localStorage.getItem('annual_lp_seeded_v3');
      if (seededFlag === '1') return;

      setPlans((prev) => {
        const existingMap = new Map(prev.map((p) => [p.id, p]));
        const merged: LessonPlanItem[] = [];
        const seedIds = new Set(INITIAL_LESSON_PLANS.map((p) => p.id));
        prev.forEach((p) => {
          if (!seedIds.has(p.id)) merged.push(p);
        });
        INITIAL_LESSON_PLANS.forEach((annualPlan) => {
          const existing = existingMap.get(annualPlan.id);
          if (existing) {
            merged.push({
              ...annualPlan,
              ...existing,
              term: existing.term || annualPlan.term,
              partLabel: existing.partLabel || annualPlan.partLabel,
            });
          } else {
            merged.push(annualPlan);
          }
        });
        return merged;
      });

      localStorage.setItem('annual_lp_seeded_v3', '1');
    } catch {
      // Ignore storage edge cases
    }
  }, [setPlans]);

  const showToast = (msg: string) => {
    setStatusMessage(msg);
    window.setTimeout(() => {
      setStatusMessage((curr) => (curr === msg ? '' : curr));
    }, 3200);
  };

  useEffect(() => {
    if (!printReady || !onTogglePrintReady) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onTogglePrintReady();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [printReady, onTogglePrintReady]);

  // Ensure selected subject exists when switching class in Date-Wise mode
  const dwSubjectsForClass = useMemo(
    () => ANNUAL_PLAN_SUBJECTS_BY_CLASS[dwClass] || [],
    [dwClass]
  );

  useEffect(() => {
    if (!dwSubjectsForClass.includes(dwSubject)) {
      setDwSubject(dwSubjectsForClass[0] || 'আমার বাংলা বই');
    }
  }, [dwClass, dwSubject, dwSubjectsForClass]);

  const dateWiseData = useMemo(
    () => buildDateWiseSchedule(dwClass, dwSubject, dwYear),
    [dwClass, dwSubject, dwYear]
  );

  const monthsListForYear = useMemo(() => getMonthsListForYear(dwYear), [dwYear]);

  const yearOptionsList = useMemo(() => {
    const set = new Set<number>(DEFAULT_PLAN_YEARS);
    set.add(dwYear);
    set.add(currentCalendarYear);
    return Array.from(set).sort((a, b) => a - b);
  }, [dwYear, currentCalendarYear]);

  const mergedDateRows = useMemo(() => {
    return dateWiseData.rows.map((row) => {
      const ov = dateRowOverrides[row.id];
      if (!ov) return row;
      const dayType = ov.dayTypeOverride ?? row.dayType;
      const isScheduledForSubject =
        ov.dayTypeOverride === 'govt_holiday'
          ? false
          : ov.dayTypeOverride === 'teaching'
          ? true
          : row.isScheduledForSubject;
      return {
        ...row,
        dayType,
        isScheduledForSubject,
        sessionLabel: ov.sessionLabel ?? row.sessionLabel,
        chapterTitle: ov.chapterTitle ?? row.chapterTitle,
        topicDetail: ov.topicDetail ?? row.topicDetail,
        pageNumber: ov.pageNumber ?? row.pageNumber,
        remark: ov.remark ?? row.remark,
      };
    });
  }, [dateWiseData.rows, dateRowOverrides]);

  const filteredDateRows = useMemo(() => {
    const q = dwSearch.trim().toLowerCase();
    return mergedDateRows.filter((row) => {
      if (dwMonth !== 'all' && row.monthIndex !== dwMonth) return false;
      if (dwTerm !== 'all' && row.term !== dwTerm) return false;
      if (dwDateFilter && row.isoDate !== dwDateFilter) return false;
      if (dwOnlyTeachingDays && !row.isScheduledForSubject) return false;
      if (!q) return true;
      const hay = [
        row.dateBn,
        row.weekdayBn,
        row.monthNameBn,
        row.sessionLabel,
        row.chapterTitle,
        row.topicDetail,
        row.pageNumber,
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [mergedDateRows, dwMonth, dwTerm, dwDateFilter, dwOnlyTeachingDays, dwSearch]);

  // Daily Plan Computed
  const classCounts = useMemo(() => {
    const counts: Record<string, number> = { 'সকল শ্রেণি': plans.length };
    CLASS_LEVELS.forEach((cls) => {
      counts[cls] = 0;
    });
    plans.forEach((p) => {
      counts[p.classLevel] = (counts[p.classLevel] || 0) + 1;
    });
    return counts;
  }, [plans]);

  const availableSubjects = useMemo(() => {
    const set = new Set<string>();
    if (selectedClass === 'সকল শ্রেণি') {
      Object.values(SUBJECTS_BY_CLASS).forEach((list) => list.forEach((s) => set.add(s)));
      plans.forEach((p) => set.add(p.subject));
    } else {
      (SUBJECTS_BY_CLASS[selectedClass] || []).forEach((s) => set.add(s));
      plans
        .filter((p) => p.classLevel === selectedClass)
        .forEach((p) => set.add(p.subject));
    }
    return ['সকল বিষয়', ...Array.from(set)];
  }, [selectedClass, plans]);

  const filteredPlans = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return plans.filter((p) => {
      const matchClass = selectedClass === 'সকল শ্রেণি' || p.classLevel === selectedClass;
      const matchSub = selectedSubject === 'সকল বিষয়' || p.subject === selectedSubject;
      const matchTerm = selectedTerm === 'সকল প্রান্তিক' || p.term === selectedTerm;
      if (!matchClass || !matchSub || !matchTerm) return false;
      if (!q) return true;
      const hay = [
        p.classLevel,
        p.subject,
        p.term || '',
        p.chapter,
        p.lessonTitle,
        ...p.learningOutcomes,
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [plans, selectedClass, selectedSubject, selectedTerm, searchQuery]);

  const activePlan = useMemo(() => {
    const found = filteredPlans.find((p) => p.id === activePlanId);
    return found || filteredPlans[0] || null;
  }, [filteredPlans, activePlanId]);

  const defaultPlanMatch = useMemo(() => {
    if (!activePlan) return undefined;
    return INITIAL_LESSON_PLANS.find((p) => p.id === activePlan.id);
  }, [activePlan]);

  const activePlanTeacherGuide = useMemo(() => {
    if (!activePlan) return null;
    return resolveLessonTeacherGuide({
      classLevel: activePlan.classLevel,
      subject: activePlan.subject,
      term: activePlan.term,
      chapterTitle: activePlan.chapter,
      topicDetail: activePlan.lessonTitle,
      durationMinutes: activePlan.duration.includes('৩০') ? 30 : 40,
    });
  }, [activePlan]);

  // Open a date row as a full Daily Lesson Plan (saving/updating seamlessly so it can be edited & printed)
  const handleOpenDailyFromDateRow = (row: DateWisePlanRow) => {
    const generated = buildDailyLessonPlanFromRow(
      row,
      dwClass,
      dwSubject,
      dateWiseData.syllabus?.durationMinutes || 40
    );
    setPlans((prev) => {
      const exists = prev.some((p) => p.id === generated.id);
      if (exists) {
        return prev.map((p) => (p.id === generated.id ? { ...generated, ...p } : p));
      }
      return [generated, ...prev];
    });
    setSelectedClass(dwClass);
    setSelectedSubject('সকল বিষয়');
    setSelectedTerm('সকল প্রান্তিক');
    setSearchQuery('');
    setActivePlanId(generated.id);
    setViewMode('daily');
    showToast(`${row.dateBn} তারিখের "${dwSubject}" দৈনিক পাঠ পরিকল্পনা খোলা হয়েছে।`);
  };

  // Date row override editing
  const openDateRowEditor = (row: DateWisePlanRow) => {
    const existingOv = dateRowOverrides[row.id];
    setEditingDateRow(row);
    setDateEditForm({
      sessionLabel: row.sessionLabel,
      chapterTitle: row.chapterTitle,
      topicDetail: row.topicDetail,
      pageNumber: row.pageNumber,
      remark: row.remark,
      dayTypeOverride: existingOv?.dayTypeOverride,
    });
  };

  const handleSaveDateRowEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDateRow) return;
    setDateRowOverrides((prev) => ({
      ...prev,
      [editingDateRow.id]: {
        sessionLabel: dateEditForm.sessionLabel?.trim() ?? editingDateRow.sessionLabel,
        chapterTitle: dateEditForm.chapterTitle?.trim() ?? editingDateRow.chapterTitle,
        topicDetail: dateEditForm.topicDetail?.trim() ?? editingDateRow.topicDetail,
        pageNumber: dateEditForm.pageNumber?.trim() ?? editingDateRow.pageNumber,
        remark: dateEditForm.remark?.trim() ?? editingDateRow.remark,
        ...(dateEditForm.dayTypeOverride ? { dayTypeOverride: dateEditForm.dayTypeOverride } : {}),
      },
    }));
    showToast(`${editingDateRow.dateBn} তারিখের পাঠ বিবরণ সংরক্ষিত হয়েছে।`);
    setEditingDateRow(null);
  };

  const handleResetDateRow = (rowId: string) => {
    setDateRowOverrides((prev) => {
      const copy = { ...prev };
      delete copy[rowId];
      return copy;
    });
    setEditingDateRow(null);
    showToast('তারিখটির পাঠ মূল কাঠামোতে ফিরিয়ে আনা হয়েছে।');
  };

  // Print & PDF Handlers (context-aware for active viewMode)
  const handleActivePrint = () => {
    if (viewMode === 'datewise') {
      triggerSmartPrint({
        element: annualSheetRef.current,
        filename: `annual-plan-${dwYear}-${dwClass}-${dwSubject}`.replace(/\s+/g, '-'),
      });
    } else {
      triggerSmartPrint({
        element: dailySheetRef.current,
        filename: activePlan
          ? `lesson-plan-${activePlan.classLevel}-${activePlan.subject}`.replace(/\s+/g, '-')
          : 'lesson-plan',
      });
    }
  };

  const handleExportPdf = async () => {
    if (exportingPdf) return;
    const targetEl = viewMode === 'datewise' ? annualSheetRef.current : dailySheetRef.current;
    if (!targetEl) return;
    if (viewMode === 'daily' && !activePlan) return;

    setExportingPdf(true);
    setPdfError('');
    try {
      const safeTitle =
        viewMode === 'datewise'
          ? `annual-plan-${dwYear}-${dwClass}-${dwSubject}`.replace(/\s+/g, '-')
          : `lesson-plan-${activePlan!.classLevel}-${activePlan!.subject}`.replace(/\s+/g, '-');
      await exportElementToA4Pdf(targetEl, safeTitle);
    } catch {
      setPdfError(
        'PDF তৈরি করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন অথবা প্রিন্ট অপশন ব্যবহার করুন।'
      );
    } finally {
      setExportingPdf(false);
    }
  };

  const openCreateModal = () => {
    const defaultClass = selectedClass === 'সকল শ্রেণি' ? 'প্রথম শ্রেণি' : selectedClass;
    const base = createEmptyForm(defaultClass);
    if (selectedSubject !== 'সকল বিষয়') {
      base.subject = selectedSubject;
    }
    if (selectedTerm !== 'সকল প্রান্তিক') {
      base.term = selectedTerm as TermOption;
    }
    setFormState(base);
    setEditingId(null);
    setEditorMode('create');
  };

  const openEditModal = (plan: LessonPlanItem) => {
    setFormState(formFromPlan(plan));
    setEditingId(plan.id);
    setEditorMode('edit');
  };

  const handleDuplicatePlan = (plan: LessonPlanItem) => {
    const duplicated: LessonPlanItem = {
      ...plan,
      id: `lp-${Date.now()}`,
      lessonTitle: `${plan.lessonTitle} (কপি)`,
    };
    const index = plans.findIndex((p) => p.id === plan.id);
    const updated = [...plans];
    updated.splice(index >= 0 ? index + 1 : 0, 0, duplicated);
    setPlans(updated);
    setActivePlanId(duplicated.id);
    showToast('পাঠ পরিকল্পনার একটি কপি তৈরি হয়েছে—এখন নিজের মতো সম্পাদনা করতে পারেন।');
  };

  const handleResetSinglePlan = (planId: string) => {
    const original = INITIAL_LESSON_PLANS.find((p) => p.id === planId);
    if (!original) return;
    setPlans((prev) => prev.map((p) => (p.id === planId ? original : p)));
    showToast('পাঠ পরিকল্পনাটি মূল বার্ষিক কাঠামোতে ফিরিয়ে আনা হয়েছে।');
  };

  const handleDeletePlan = (planId: string) => {
    setPlans((prev) => prev.filter((p) => p.id !== planId));
    setDeleteConfirmId(null);
    showToast('পাঠ পরিকল্পনাটি তালিকা থেকে মুছে ফেলা হয়েছে।');
  };

  const handleSyncMissingAnnualPlans = () => {
    setPlans((prev) => {
      const existingIds = new Set(prev.map((p) => p.id));
      const missing = INITIAL_LESSON_PLANS.filter((p) => !existingIds.has(p.id));
      if (missing.length === 0) {
        showToast('সকল বার্ষিক পাঠ পরিকল্পনা ইতিমধ্যেই সংযুক্ত রয়েছে।');
        return prev;
      }
      showToast(`${toBanglaDigit(missing.length)}টি অনুপস্থিত বার্ষিক পাঠ পরিকল্পনা যুক্ত করা হয়েছে।`);
      return [...prev, ...missing];
    });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedOutcomes = formState.learningOutcomes
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    const parsedMaterials = formState.materials
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const parsedPresentation = formState.presentation
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    const parsedEvaluation = formState.evaluation
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const payload: LessonPlanItem = {
      id: editorMode === 'edit' && editingId ? editingId : `lp-${Date.now()}`,
      classLevel: formState.classLevel,
      subject: formState.subject.trim() || 'সাধারণ',
      term: formState.term,
      partLabel: TERM_TO_PART[formState.term],
      chapter: formState.chapter.trim(),
      lessonTitle: formState.lessonTitle.trim(),
      duration: formState.duration.trim() || '৪০ মিনিট',
      learningOutcomes:
        parsedOutcomes.length > 0 ? parsedOutcomes : ['পাঠের মূল বিষয়বস্তু বলতে পারবে।'],
      materials: parsedMaterials.length > 0 ? parsedMaterials : ['পাঠ্যবই, চক ও ডাস্টার'],
      warmUp: formState.warmUp.trim() || 'কুশল বিনিময় ও পূর্বজ্ঞান যাচাই।',
      presentation:
        parsedPresentation.length > 0
          ? parsedPresentation
          : ['আদর্শ পাঠ, দলীয় আলোচনা ও অনুশীলন।'],
      evaluation:
        parsedEvaluation.length > 0 ? parsedEvaluation : ['মৌখিক ও লিখিত প্রশ্নোত্তর।'],
      homework: formState.homework.trim() || 'পাঠের অনুশীলনী খাতায় সমাধান করে আনবে।',
    };

    if (editorMode === 'edit' && editingId) {
      setPlans((prev) => prev.map((p) => (p.id === editingId ? payload : p)));
      setActivePlanId(payload.id);
      showToast('পাঠ পরিকল্পনাটি সফলভাবে সম্পাদনা ও সংরক্ষণ করা হয়েছে।');
    } else {
      setPlans((prev) => [payload, ...prev]);
      setActivePlanId(payload.id);
      setSelectedClass(payload.classLevel);
      setSelectedSubject('সকল বিষয়');
      setSelectedTerm('সকল প্রান্তিক');
      setViewMode('daily');
      showToast('নতুন পাঠ পরিকল্পনা তৈরি ও সংরক্ষণ করা হয়েছে।');
    }
    setEditorMode(null);
    setEditingId(null);
  };

  const formClassSubjects = useMemo(() => {
    const list = SUBJECTS_BY_CLASS[formState.classLevel] || [];
    if (formState.subject && !list.includes(formState.subject)) {
      return [formState.subject, ...list];
    }
    return list;
  }, [formState.classLevel, formState.subject]);

  const dwYearBn = toBanglaDigit(dwYear);

  const activeMonthTitle =
    dwMonth === 'all'
      ? `জানুয়ারি – ডিসেম্বর ${dwYearBn} (পূর্ণাঙ্গ বার্ষিক ছক)`
      : `${monthsListForYear[dwMonth]?.name || ''} ${dwYearBn}`;

  return (
    <PageShell
      title={`বার্ষিক ও তারিখ অনুযায়ী পাঠ পরিকল্পনা (${dwYearBn})`}
      subtitle={`জাতীয় প্রাথমিক শিক্ষা একাডেমি (নেপ) কাঠামো অনুযায়ী ${dwYearBn} শিক্ষাবর্ষের শ্রেণি ও বিষয়ভিত্তিক তারিখ অনুযায়ী পাঠ বিভাজন এবং দৈনিক পাঠ পরিকল্পনা`}
      onNavigate={onNavigate}
      onPrint={handleActivePrint}
      printLabel="প্রিন্ট করুন"
      printReady={printReady}
      onTogglePrintReady={onTogglePrintReady}
      onExportPdf={viewMode === 'datewise' || activePlan ? handleExportPdf : undefined}
      exportingPdf={exportingPdf}
      pdfLabel="PDF সংরক্ষণ"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {viewMode === 'daily' && (
            <button
              type="button"
              onClick={handleSyncMissingAnnualPlans}
              title="বাদ পড়া কোনো বার্ষিক পাঠ পরিকল্পনা থাকলে পুনরায় যুক্ত করুন"
              className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap"
            >
              <RotateCcw className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
              <span className="hidden sm:inline">বার্ষিক সিঙ্ক</span>
            </button>
          )}
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3.5 text-xs sm:text-sm font-semibold text-blue-700 hover:bg-blue-100 transition-colors whitespace-nowrap"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>নতুন দৈনিক পাঠ</span>
          </button>
        </div>
      }
    >
      {statusMessage && (
        <div className="no-print mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs sm:text-sm font-semibold text-emerald-800 flex items-center justify-between gap-2">
          <span>{statusMessage}</span>
          <button
            type="button"
            onClick={() => setStatusMessage('')}
            className="text-emerald-700 hover:text-emerald-950"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {pdfError && (
        <div className="no-print mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-medium text-red-700">
          {pdfError}
        </div>
      )}

      {/* Primary View Mode Switcher */}
      {!printReady && (
        <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white border border-slate-200 p-2.5">
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode('datewise')}
              className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs sm:text-sm font-bold transition-colors whitespace-nowrap ${
                viewMode === 'datewise'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarDays className="h-4 w-4" aria-hidden="true" />
              <span>তারিখ অনুযায়ী বার্ষিক পাঠ পরিকল্পনা ({dwYearBn})</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('daily')}
              className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs sm:text-sm font-bold transition-colors whitespace-nowrap ${
                viewMode === 'daily'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="h-4 w-4" aria-hidden="true" />
              <span>দৈনিক পাঠ পরিকল্পনা ({toBanglaDigit(plans.length)}টি)</span>
            </button>
          </div>

          <div className="text-xs text-slate-600 font-medium px-2 tabular-nums">
            {dwYearBn} শিক্ষাবর্ষ · মোট কর্মদিবস {toBanglaDigit(dateWiseData.totalWorkingDays)} দিন · ১ম–৩য় প্রান্তিক সূচি সমন্বিত
          </div>
        </div>
      )}

      {/* ==================== MODE 1: DATE-WISE ANNUAL PLAN ==================== */}
      {viewMode === 'datewise' && (
        <div className="space-y-4">
          {!printReady && (
            <div className="no-print space-y-3">
              {/* Year Switcher + Class Tabs */}
              <div className="rounded-2xl bg-white border border-slate-200 p-3.5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100">
                  <div>
                    <div className="text-xs font-bold text-slate-800">
                      শিক্ষাবর্ষ (সাল) নির্বাচন করুন — প্রতি বছর ব্যবহারযোগ্য
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      যেকোনো সাল পরিবর্তন করলে সেই বছরের প্রকৃত বার, অধিবর্ষ ও প্রান্তিক সূচি অনুযায়ী পাঠ বিভাজন স্বয়ংক্রিয়ভাবে হালনাগাদ হবে
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleYearChange(dwYear - 1)}
                      disabled={dwYear <= MIN_PLAN_YEAR}
                      aria-label="পূর্ববর্তী সাল"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                    >
                      <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                    </button>

                    <select
                      value={dwYear}
                      onChange={(e) => handleYearChange(Number(e.target.value))}
                      aria-label="শিক্ষাবর্ষ সাল"
                      className="h-9 rounded-xl border border-emerald-300 bg-emerald-50/70 px-3 text-xs sm:text-sm font-bold text-emerald-950 focus:border-emerald-700 focus:outline-none tabular-nums"
                    >
                      {yearOptionsList.map((yr) => (
                        <option key={yr} value={yr}>
                          {toBanglaDigit(yr)} শিক্ষাবর্ষ{yr === 2026 ? ' (নেপ মূল)' : ''}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => handleYearChange(dwYear + 1)}
                      disabled={dwYear >= MAX_PLAN_YEAR}
                      aria-label="পরবর্তী সাল"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                    >
                      <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </button>

                    {dwYear !== currentCalendarYear && (
                      <button
                        type="button"
                        onClick={() => handleYearChange(currentCalendarYear)}
                        className="inline-flex h-9 items-center rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                      >
                        চলতি সাল ({toBanglaDigit(currentCalendarYear)})
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-bold text-slate-600 mb-2">
                    ১. শ্রেণি নির্বাচন করুন:
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {ANNUAL_PLAN_CLASSES.map((cls) => {
                      const active = dwClass === cls;
                      return (
                        <button
                          key={cls}
                          type="button"
                          onClick={() => setDwClass(cls)}
                          className={`rounded-xl px-3.5 py-2 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${
                            active
                              ? 'bg-emerald-700 text-white shadow-xs'
                              : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                          }`}
                        >
                          {cls}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Subject Tabs + Quick Reminder Toggle */}
                <div className="flex flex-wrap items-center justify-between gap-2 mt-3.5 mb-2">
                  <div className="text-xs font-bold text-slate-600">
                    ২. বিষয় নির্বাচন করুন ({dwClass}):
                  </div>
                  {(() => {
                    const safePrefs = normalizeReminderPrefs(reminderPrefs);
                    const isTracked = (safePrefs.selections[dwClass] || []).includes(dwSubject);
                    return (
                      <button
                        type="button"
                        onClick={() => {
                          const curr = safePrefs.selections[dwClass] || [];
                          const nextList = isTracked
                            ? curr.filter((s) => s !== dwSubject)
                            : [...curr, dwSubject];
                          const nextSelections = { ...safePrefs.selections };
                          if (nextList.length > 0) {
                            nextSelections[dwClass] = nextList;
                          } else {
                            delete nextSelections[dwClass];
                          }
                          setReminderPrefs({
                            ...safePrefs,
                            enabled: true,
                            selections: nextSelections,
                          });
                          showToast(
                            isTracked
                              ? `${dwClass} · ${dwSubject} রিমাইন্ডার থেকে বাদ দেওয়া হয়েছে।`
                              : `${dwClass} · ${dwSubject} নোটিফিকেশন রিমাইন্ডারে যুক্ত হয়েছে।`
                          );
                        }}
                        className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1 text-xs font-semibold transition-colors whitespace-nowrap ${
                          isTracked
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-900 hover:bg-emerald-100'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <BellRing className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />
                        <span>
                          {isTracked ? 'রিমাইন্ডারে যুক্ত আছে ✓' : 'নোটিফিকেশন রিমাইন্ডারে যুক্ত করুন'}
                        </span>
                      </button>
                    );
                  })()}
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {dwSubjectsForClass.map((sub) => {
                    const active = dwSubject === sub;
                    return (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => setDwSubject(sub)}
                        className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                          active
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        {sub}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Month Quick Selector + Filters */}
              <div className="rounded-2xl bg-white border border-slate-200 p-3.5 space-y-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setDwYear(currentCalendarYear);
                      setDwMonth('all');
                      setDwTerm('all');
                      setDwOnlyTeachingDays(false);
                      setDwDateFilter(todayRealIso);
                    }}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                      dwDateFilter === todayRealIso
                        ? 'bg-[#102A23] text-white'
                        : 'bg-emerald-50 border border-emerald-200 text-emerald-900 hover:bg-emerald-100'
                    }`}
                  >
                    আজকের পাঠ
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDwMonth('all');
                      setDwDateFilter('');
                    }}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                      dwMonth === 'all' && !dwDateFilter
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    সকল মাস ({toBanglaDigit(dateWiseData.rows.length)} দিন)
                  </button>
                  {monthsListForYear.map((m) => (
                    <button
                      key={m.index}
                      type="button"
                      onClick={() => {
                        setDwMonth(m.index);
                        setDwDateFilter('');
                      }}
                      className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                        dwMonth === m.index && !dwDateFilter
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {m.name}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      প্রান্তিক অনুযায়ী ফিল্টার
                    </label>
                    <select
                      value={dwTerm}
                      onChange={(e) => setDwTerm(e.target.value as 'all' | TermKey)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs sm:text-sm text-slate-800 focus:border-blue-600 focus:outline-none"
                    >
                      <option value="all">সকল প্রান্তিক (১ম–৩য়)</option>
                      <option value="১ম প্রান্তিক">
                        ১ম প্রান্তিক ({dateWiseData.termDateLabels['১ম প্রান্তিক']})
                      </option>
                      <option value="২য় প্রান্তিক">
                        ২য় প্রান্তিক ({dateWiseData.termDateLabels['২য় প্রান্তিক']})
                      </option>
                      <option value="৩য় প্রান্তিক">
                        ৩য় প্রান্তিক ({dateWiseData.termDateLabels['৩য় প্রান্তিক']})
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      নির্দিষ্ট তারিখ দেখুন ({dwYearBn})
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="date"
                        min={`${dwYear}-01-01`}
                        max={`${dwYear}-12-31`}
                        value={dwDateFilter}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val) {
                            const pickedYear = Number(val.slice(0, 4));
                            if (Number.isFinite(pickedYear)) setDwYear(clampPlanYear(pickedYear));
                            setDwMonth('all');
                          }
                          setDwDateFilter(val);
                        }}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs sm:text-sm text-slate-800 focus:border-blue-600 focus:outline-none tabular-nums"
                      />
                      {dwDateFilter && (
                        <button
                          type="button"
                          onClick={() => setDwDateFilter('')}
                          title="তারিখ ফিল্টার মুছুন"
                          className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-slate-600 hover:bg-slate-100"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      পাঠ, অধ্যায় বা ছুটি খুঁজুন
                    </label>
                    <div className="relative">
                      <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="search"
                        value={dwSearch}
                        onChange={(e) => setDwSearch(e.target.value)}
                        placeholder="যেমন: ভগ্নাংশ, বর্ণ, ঈদ..."
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-800 focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => setDwOnlyTeachingDays((v) => !v)}
                      className={`w-full inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                        dwOnlyTeachingDays
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Filter className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>
                        {dwOnlyTeachingDays
                          ? 'শুধু পাঠদান দিবস প্রদর্শিত হচ্ছে'
                          : 'ছুটিসহ সকল দিন প্রদর্শিত হচ্ছে'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Summary metadata bar (clean unboxed typography per design guidelines) */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 tabular-nums">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-slate-900">{dwClass}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-semibold text-emerald-800">{dwSubject}</span>
                    <span aria-hidden="true">·</span>
                    <span>মোট কর্মদিবস: {toBanglaDigit(dateWiseData.totalWorkingDays)} দিন</span>
                    <span aria-hidden="true">·</span>
                    <span>
                      নির্ধারিত সেশন/ক্লাস: {toBanglaDigit(dateWiseData.totalSubjectSessions)}টি
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>প্রদর্শিত সারি: {toBanglaDigit(filteredDateRows.length)}টি</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    যেকোনো নির্ধারিত পাঠের ওপর ক্লিক করে "পাঠদান পদ্ধতি ও শিক্ষক সহায়িকা" এবং "দৈনিক পাঠ" দেখতে পারেন
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Printable Official NAPE 2026 Date-Wise Table Sheet */}
          <div
            ref={annualSheetRef}
            className={
              printReady
                ? 'a4-paper-sheet'
                : 'print-only-sheet rounded-2xl bg-white border border-slate-200 p-4 sm:p-6 shadow-xs'
            }
          >
            <OfficialA4Letterhead
              schoolName={profile.school}
              addressLine={`${profile.upazila}, ${profile.district}`}
              documentTitle={`বার্ষিক পাঠ পরিকল্পনা ${dwYearBn} — শ্রেণি: ${dwClass}, বিষয়: ${dwSubject}`}
              subtitle={`${activeMonthTitle} · ${dateWiseData.localizedAuthorityNote} · মোট কর্মদিবস: ${toBanglaDigit(dateWiseData.totalWorkingDays)} দিন · মোট ক্লাস: ${toBanglaDigit(dateWiseData.totalSubjectSessions)}টি`}
              compact
              className="mb-3"
            />

            <p className="text-[11px] text-slate-600 mb-3 leading-snug">
              [বি.দ্র. প্রধান শিক্ষক প্রাকৃতিক সমস্যা/স্থানীয় চাহিদা অনুযায়ী বার্ষিক পাঠ পরিকল্পনার দিন ও পাঠের বিষয়বস্তু পরিবর্তন (আগে/পরে) করতে পারবেন। তবে প্রতিটি প্রান্তিক মূল্যায়নের জন্য সময়ানুযায়ী পাঠের বিষয়বস্তু নির্দিষ্ট থাকবে।
              {dwYear !== 2026
                ? ` ${dwYearBn} শিক্ষাবর্ষের প্রকৃত বার ও অধিবর্ষ অনুযায়ী পাঠ বিভাজন সমন্বিত হয়েছে—চাঁদ দেখা বা সরকারি ছুটির পরিবর্তন প্রয়োজনে পেন্সিল (✎) আইকন থেকে সম্পাদনা করা যাবে।]`
                : ']'}
            </p>

            {filteredDateRows.length === 0 ? (
              <div className="rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-500">
                নির্বাচিত তারিখ বা ফিল্টারে কোনো পাঠ সারণি পাওয়া যায়নি। অনুগ্রহ করে ফিল্টার রিসেট করুন।
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs text-slate-900">
                  <thead>
                    <tr className="bg-slate-100 text-slate-900">
                      <th className="border border-slate-400 px-1.5 py-1.5 text-center font-bold w-10">
                        ক্রম
                      </th>
                      <th className="border border-slate-400 px-2 py-1.5 text-center font-bold w-20">
                        মাসের নাম
                      </th>
                      <th className="border border-slate-400 px-2 py-1.5 text-center font-bold w-24">
                        তারিখ
                      </th>
                      <th className="border border-slate-400 px-2 py-1.5 text-center font-bold w-20">
                        দিন
                      </th>
                      <th className="border border-slate-400 px-2 py-1.5 text-center font-bold w-24">
                        পিরিয়ড/সেশন
                      </th>
                      <th className="border border-slate-400 px-2.5 py-1.5 text-left font-bold">
                        পাঠ/অধ্যায়/বিষয়বস্তু ও পাঠ বিভাজন
                      </th>
                      <th className="border border-slate-400 px-1.5 py-1.5 text-center font-bold w-16">
                        পৃষ্ঠা নং
                      </th>
                      <th className="border border-slate-400 px-2 py-1.5 text-left font-bold w-32">
                        মন্তব্য
                      </th>
                      <th className="no-print border border-slate-400 px-2 py-1.5 text-center font-bold w-28">
                        কার্যক্রম
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDateRows.map((row, idx) => {
                      const isWeeklyHoliday = row.dayType === 'weekly_holiday';
                      const isHoliday =
                        isWeeklyHoliday || row.dayType === 'govt_holiday';
                      const isExam = row.dayType === 'exam';
                      const isSurvey = row.dayType === 'survey_result';
                      const isCrossDay = row.dayType === 'teaching' && !row.isScheduledForSubject;
                      const isTodayRow = row.isoDate === todayRealIso;
                      const prevRow = idx > 0 ? filteredDateRows[idx - 1] : null;
                      const showMonthCell = !prevRow || prevRow.monthIndex !== row.monthIndex;

                      return (
                        <React.Fragment key={row.id}>
                          {row.termBannerBefore && !dwDateFilter && (
                            <tr className="bg-emerald-50/90 text-emerald-950">
                              <td
                                colSpan={8}
                                className="border border-slate-400 px-3 py-1.5 text-center font-bold text-[11px] sm:text-xs"
                              >
                                {row.termBannerBefore}
                              </td>
                              <td className="no-print border border-slate-400 bg-emerald-50/90" />
                            </tr>
                          )}
                          <tr
                            className={
                              isTodayRow
                                ? 'bg-emerald-50/85 ring-1 ring-inset ring-emerald-600/40'
                                : isHoliday
                                ? 'bg-rose-50/35 text-slate-600'
                                : isExam
                                ? 'bg-amber-50/75 font-semibold text-amber-950'
                                : isSurvey
                                ? 'bg-blue-50/60 font-semibold text-blue-950'
                                : isCrossDay
                                ? 'bg-slate-50/40 text-slate-400'
                                : 'bg-white hover:bg-slate-50/70'
                            }
                          >
                            <td className="border border-slate-400 px-1.5 py-1.5 text-center tabular-nums">
                              {toBanglaDigit(row.sl)}.
                            </td>
                            <td className="border border-slate-400 px-2 py-1.5 text-center font-semibold">
                              {showMonthCell ? row.monthShortLabel : ''}
                            </td>
                            <td className="border border-slate-400 px-2 py-1.5 text-center tabular-nums whitespace-nowrap font-medium">
                              <div>{row.dateBn}</div>
                              {isTodayRow && (
                                <span className="inline-block mt-0.5 text-[10px] font-bold text-emerald-800">
                                  আজকের পাঠ
                                </span>
                              )}
                            </td>
                            <td className="border border-slate-400 px-2 py-1.5 text-center whitespace-nowrap">
                              {row.weekdayBn}
                            </td>
                            <td className="border border-slate-400 px-2 py-1.5 text-center tabular-nums font-medium">
                              {row.sessionLabel}
                            </td>
                            <td className="border border-slate-400 px-2.5 py-1.5 leading-snug">
                              {row.isScheduledForSubject ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setActiveGuideLesson(
                                      guideInputFromDateRow(
                                        row,
                                        dwClass,
                                        dwSubject,
                                        dateWiseData.syllabus?.durationMinutes || 40
                                      )
                                    )
                                  }
                                  className="w-full text-left group rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
                                  title="এই পাঠের পাঠদান পদ্ধতি ও শিক্ষক সহায়িকা দেখুন"
                                >
                                  {row.chapterTitle && (
                                    <div className="font-bold text-slate-900 text-[11px] group-hover:text-emerald-800 group-hover:underline">
                                      {row.chapterTitle}
                                    </div>
                                  )}
                                  <div className="text-slate-800 group-hover:text-emerald-900">
                                    {row.topicDetail}
                                  </div>
                                  <div className="no-print text-[10px] font-semibold text-emerald-700 mt-0.5 opacity-85 group-hover:opacity-100">
                                    ক্লিক করে পাঠদান পদ্ধতি ও শিক্ষক সহায়িকা দেখুন →
                                  </div>
                                </button>
                              ) : (
                                <>
                                  {row.chapterTitle && (
                                    <div className="font-bold text-slate-900 text-[11px]">
                                      {row.chapterTitle}
                                    </div>
                                  )}
                                  <div className={isHoliday ? 'font-medium text-rose-800' : ''}>
                                    {row.topicDetail}
                                  </div>
                                </>
                              )}
                            </td>
                            <td className="border border-slate-400 px-1.5 py-1.5 text-center tabular-nums">
                              {row.pageNumber}
                            </td>
                            <td className="border border-slate-400 px-2 py-1.5 text-[11px] leading-snug text-slate-700">
                              {row.remark}
                            </td>
                            <td className="no-print border border-slate-400 px-1.5 py-1.5 text-center">
                              <div className="flex flex-wrap items-center justify-center gap-1">
                                {row.isScheduledForSubject && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setActiveGuideLesson(
                                          guideInputFromDateRow(
                                            row,
                                            dwClass,
                                            dwSubject,
                                            dateWiseData.syllabus?.durationMinutes || 40
                                          )
                                        )
                                      }
                                      title="পাঠদান পদ্ধতি ও শিক্ষক সহায়িকা (TG) দেখুন"
                                      className="rounded-lg bg-[#102A23] px-2 py-1 text-[11px] font-semibold text-white hover:bg-emerald-900 whitespace-nowrap"
                                    >
                                      সহায়িকা
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenDailyFromDateRow(row)}
                                      title="এই দিনের পূর্ণাঙ্গ দৈনিক পাঠ পরিকল্পনা দেখুন ও প্রিন্ট করুন"
                                      className="rounded-lg bg-blue-50 border border-blue-200 px-2 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-100 whitespace-nowrap"
                                    >
                                      দৈনিক পাঠ
                                    </button>
                                  </>
                                )}
                                {!isWeeklyHoliday && (
                                  <button
                                    type="button"
                                    onClick={() => openDateRowEditor(row)}
                                    title="এই তারিখের পাঠ বা ছুটি সম্পাদনা করুন"
                                    className="rounded-lg bg-slate-50 border border-slate-200 p-1 text-slate-700 hover:bg-slate-100"
                                  >
                                    <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="pt-8 mt-6 border-t border-slate-300 flex items-center justify-between text-xs text-slate-700">
              <div>
                <p className="border-t border-slate-600 pt-1 px-4">শ্রেণি শিক্ষকের স্বাক্ষর</p>
              </div>
              <div className="text-[11px] text-slate-500 text-center">
                মোট কর্মদিবস: {toBanglaDigit(dateWiseData.totalWorkingDays)} দিন · মোট পাঠদান সেশন:{' '}
                {toBanglaDigit(dateWiseData.totalSubjectSessions)}টি
              </div>
              <div>
                <p className="border-t border-slate-600 pt-1 px-4">প্রধান শিক্ষকের স্বাক্ষর</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODE 2: DAILY LESSON PLAN STUDIO ==================== */}
      {viewMode === 'daily' && (
        <>
          {!printReady && (
            <div className="no-print mb-5 space-y-3">
              {/* Class Quick Tabs with Counts */}
              <div className="flex flex-wrap items-center gap-1.5 rounded-2xl bg-white border border-slate-200 p-2.5">
                {['সকল শ্রেণি', ...CLASS_LEVELS].map((cls) => {
                  const active = selectedClass === cls;
                  return (
                    <button
                      key={cls}
                      type="button"
                      onClick={() => {
                        setSelectedClass(cls);
                        setSelectedSubject('সকল বিষয়');
                      }}
                      className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                        active
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {cls} ({toBanglaDigit(classCounts[cls] || 0)})
                    </button>
                  );
                })}
              </div>

              {/* Subject, Term & Search Filter Bar */}
              <div className="rounded-2xl bg-white border border-slate-200 p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    বিষয় নির্বাচন
                  </label>
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-blue-600 focus:outline-none"
                  >
                    {availableSubjects.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    প্রান্তিক / পার্ট (বার্ষিক ছক)
                  </label>
                  <select
                    value={selectedTerm}
                    onChange={(e) => setSelectedTerm(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-blue-600 focus:outline-none"
                  >
                    <option value="সকল প্রান্তিক">সকল প্রান্তিক (বার্ষিক পূর্ণাঙ্গ)</option>
                    <option value="১ম প্রান্তিক">১ম প্রান্তিক (জানুয়ারি–মে)</option>
                    <option value="২য় প্রান্তিক">২য় প্রান্তিক (মে–আগস্ট)</option>
                    <option value="৩য় প্রান্তিক">৩য় প্রান্তিক (আগস্ট–ডিসেম্বর)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    পাঠ, অধ্যায় বা শিখনফল খুঁজুন ({toBanglaDigit(filteredPlans.length)}টি পাওয়া গেছে)
                  </label>
                  <div className="relative">
                    <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="যেমন: স্বরবর্ণ, ভগ্নাংশ, মুক্তিযুদ্ধ, Food Pyramid..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-sm text-slate-800 focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Master-Detail Layout */}
          <div
            className={
              printReady ? 'block' : 'grid grid-cols-1 lg:grid-cols-12 gap-5 items-start'
            }
          >
            {/* Left: Plan List */}
            {!printReady && (
              <div className="no-print lg:col-span-4 space-y-2.5 lg:max-h-[82vh] lg:overflow-y-auto lg:pr-1">
                {filteredPlans.length === 0 ? (
                  <div className="rounded-2xl bg-white border border-slate-200 p-6 text-center space-y-3">
                    <p className="text-sm text-slate-500">
                      নির্বাচিত ফিল্টারে কোনো পাঠ পরিকল্পনা পাওয়া যায়নি।
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedClass('সকল শ্রেণি');
                        setSelectedSubject('সকল বিষয়');
                        setSelectedTerm('সকল প্রান্তিক');
                        setSearchQuery('');
                      }}
                      className="rounded-xl bg-slate-100 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                    >
                      ফিল্টার রিসেট করুন
                    </button>
                  </div>
                ) : (
                  filteredPlans.map((plan) => {
                    const isSelected = activePlan?.id === plan.id;
                    return (
                      <div
                        key={plan.id}
                        className={`rounded-2xl border p-3.5 transition-colors ${
                          isSelected
                            ? 'bg-blue-50/75 border-blue-500 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-blue-300'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setActivePlanId(plan.id)}
                          className="w-full text-left"
                        >
                          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                            <span className="font-bold text-blue-700">{plan.classLevel}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-medium text-slate-700">{plan.subject}</span>
                            {plan.term && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="text-emerald-700 font-semibold">{plan.term}</span>
                              </>
                            )}
                          </div>
                          <h3 className="text-sm font-bold text-slate-900 mt-1 leading-snug">
                            {plan.lessonTitle}
                          </h3>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-1">{plan.chapter}</p>
                        </button>

                        <div className="mt-2.5 pt-2 border-t border-slate-200/70 flex items-center justify-between gap-2">
                          <span className="text-[11px] text-slate-500 tabular-nums">
                            সময়: {plan.duration}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => openEditModal(plan)}
                              title="এই পাঠ পরিকল্পনাটি সম্পাদনা করুন"
                              className="inline-flex items-center gap-1 rounded-lg bg-white border border-slate-200 px-2 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-50"
                            >
                              <Pencil className="h-3 w-3" aria-hidden="true" />
                              <span>ইডিট</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDuplicatePlan(plan)}
                              title="কপি করে নতুন করুন"
                              className="inline-flex items-center gap-1 rounded-lg bg-white border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              <Copy className="h-3 w-3" aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Right: Editable Action Bar + Printable Lesson Plan A4 Sheet */}
            {activePlan && (
              <div className={printReady ? 'block' : 'lg:col-span-8 space-y-3'}>
                {!printReady && (
                  <div className="no-print rounded-2xl bg-white border border-slate-200 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                      <CalendarRange className="h-4 w-4 text-blue-600" aria-hidden="true" />
                      <span>
                        {activePlan.classLevel} · {activePlan.subject}
                        {activePlan.term ? ` · ${activePlan.term}` : ''}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setActiveGuideLesson({
                            classLevel: activePlan.classLevel,
                            subject: activePlan.subject,
                            term: activePlan.term,
                            chapterTitle: activePlan.chapter,
                            topicDetail: activePlan.lessonTitle,
                            durationMinutes: activePlan.duration.includes('৩০') ? 30 : 40,
                          })
                        }
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#102A23] px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-900 transition-colors"
                      >
                        <BookMarked className="h-3.5 w-3.5 text-amber-300" aria-hidden="true" />
                        <span>শিক্ষক সহায়িকা (TG)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditModal(activePlan)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>সম্পাদনা (Edit)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDuplicatePlan(activePlan)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                      >
                        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>কপি</span>
                      </button>
                      {defaultPlanMatch && (
                        <button
                          type="button"
                          onClick={() => handleResetSinglePlan(activePlan.id)}
                          title="মূল NCTB বার্ষিক পাঠ পরিকল্পনায় ফিরিয়ে আনুন"
                          className="inline-flex items-center gap-1 rounded-xl border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition-colors"
                        >
                          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>মূল রূপ</span>
                        </button>
                      )}
                      {deleteConfirmId === activePlan.id ? (
                        <div className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-2.5 py-1">
                          <span className="text-[11px] font-semibold text-red-700">মুছবেন?</span>
                          <button
                            type="button"
                            onClick={() => handleDeletePlan(activePlan.id)}
                            className="rounded-lg bg-red-600 px-2 py-0.5 text-[11px] font-bold text-white hover:bg-red-700"
                          >
                            হ্যাঁ
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(null)}
                            className="rounded-lg bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-700 border border-slate-200"
                          >
                            না
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(activePlan.id)}
                          className="inline-flex items-center gap-1 rounded-xl border border-red-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>মুছুন</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div
                  ref={dailySheetRef}
                  className={
                    printReady
                      ? 'a4-paper-sheet'
                      : 'print-only-sheet rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 shadow-xs'
                  }
                >
                  <div>
                    <OfficialA4Letterhead
                      schoolName={profile.school}
                      addressLine={`${profile.upazila}, ${profile.district}`}
                      documentTitle="দৈনিক পাঠ পরিকল্পনা"
                      subtitle={`শিক্ষক: ${profile.name} (${profile.designation}) · তারিখ: ${getFormattedBanglaDate()}`}
                      compact
                      className="mb-5"
                    />

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 rounded-xl bg-slate-50 border border-slate-300 p-3.5 text-xs mb-6">
                      <div>
                        <span className="text-slate-500 block">শ্রেণি</span>
                        <span className="font-bold text-slate-900">{activePlan.classLevel}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">বিষয়</span>
                        <span className="font-bold text-slate-900">{activePlan.subject}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">প্রান্তিক</span>
                        <span className="font-bold text-slate-900">
                          {activePlan.term || 'বার্ষিক'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">পাঠ/অধ্যায়</span>
                        <span className="font-bold text-slate-900">{activePlan.chapter}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">সময়</span>
                        <span className="font-bold text-slate-900">{activePlan.duration}</span>
                      </div>
                    </div>

                    <div className="space-y-5 text-sm text-slate-800">
                      <div>
                        <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-2">
                          <BookOpen className="h-4 w-4 text-blue-700" />
                          <span>পাঠের শিরোনাম: {activePlan.lessonTitle}</span>
                        </h3>
                      </div>

                      <div>
                        <h4 className="font-bold text-slate-900 border-b border-slate-200 pb-1 mb-2">
                          ১. শিখনফল
                        </h4>
                        <ul className="space-y-1.5 pl-4 list-disc">
                          {activePlan.learningOutcomes.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-bold text-slate-900 border-b border-slate-200 pb-1 mb-2">
                          ২. শিক্ষা উপকরণ
                        </h4>
                        <p>{activePlan.materials.join(' · ')}</p>
                      </div>

                      <div>
                        <h4 className="font-bold text-slate-900 border-b border-slate-200 pb-1 mb-2">
                          ৩. আবেগ সৃষ্টি ও পূর্বজ্ঞান যাচাই
                        </h4>
                        <p className="leading-relaxed">{activePlan.warmUp}</p>
                      </div>

                      <div>
                        <h4 className="font-bold text-slate-900 border-b border-slate-200 pb-1 mb-2">
                          ৪. পাঠ উপস্থাপন (বাস্তব, অর্ধবাস্তব ও বস্তুনিরপেক্ষ পর্যায়)
                        </h4>
                        <ol className="space-y-1.5 pl-4 list-decimal">
                          {activePlan.presentation.map((step, i) => (
                            <li key={i} className="leading-relaxed">
                              {step}
                            </li>
                          ))}
                        </ol>
                      </div>

                      <div>
                        <h4 className="font-bold text-slate-900 border-b border-slate-200 pb-1 mb-2">
                          ৫. মূল্যায়ন
                        </h4>
                        <ul className="space-y-1.5">
                          {activePlan.evaluation.map((ev, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
                              <span>{ev}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-bold text-slate-900 border-b border-slate-200 pb-1 mb-2">
                          ৬. বাড়ির কাজ
                        </h4>
                        <p className="leading-relaxed">{activePlan.homework}</p>
                      </div>

                      {activePlanTeacherGuide && (
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-2">
                          <h4 className="font-bold text-emerald-950 border-b border-emerald-200/80 pb-1">
                            ৭. অফিসিয়াল NCTB শিক্ষক সহায়িকা (TG) নির্দেশনা — {activePlanTeacherGuide.partLabel}
                          </h4>
                          <ol className="space-y-1 pl-4 list-decimal text-xs sm:text-sm text-slate-800">
                            {activePlanTeacherGuide.nctbGuideSteps.map((step, i) => (
                              <li key={i} className="leading-relaxed">
                                {step}
                              </li>
                            ))}
                          </ol>
                          <p className="text-xs text-emerald-900 font-medium pt-1">
                            মূল্যায়ন ফোকাস: {activePlanTeacherGuide.assessmentFocus}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="pt-10 mt-8 border-t border-slate-300 flex items-center justify-between text-xs text-slate-700">
                      <div>
                        <p className="border-t border-slate-600 pt-1 px-4">শ্রেণি শিক্ষকের স্বাক্ষর</p>
                      </div>
                      <div>
                        <p className="border-t border-slate-600 pt-1 px-4">প্রধান শিক্ষকের স্বাক্ষর</p>
                      </div>
                    </div>

                    {!printReady && (
                      <div className="no-print mt-6 flex flex-wrap justify-end gap-2.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(activePlan)}
                          className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                        >
                          <Pencil className="h-4 w-4" />
                          <span>তথ্য সম্পাদনা করুন</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleExportPdf}
                          disabled={exportingPdf}
                          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                        >
                          {exportingPdf ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <FileDown className="h-4 w-4" />
                          )}
                          <span>{exportingPdf ? 'PDF তৈরি হচ্ছে...' : 'PDF ডাউনলোড'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleActivePrint}
                          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800"
                        >
                          <Printer className="h-4 w-4" />
                          <span>A4 পেজে প্রিন্ট করুন</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Edit Date-Wise Row Modal */}
      {editingDateRow && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 sm:p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  তারিখভিত্তিক পাঠ সম্পাদনা ({editingDateRow.dateBn} · {editingDateRow.weekdayBn})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {dwClass} · {dwSubject}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingDateRow(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDateRowEdit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    পিরিয়ড / সেশন সংখ্যা
                  </label>
                  <input
                    type="text"
                    value={dateEditForm.sessionLabel || ''}
                    onChange={(e) =>
                      setDateEditForm({ ...dateEditForm, sessionLabel: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    পাঠ্যপুস্তকের পৃষ্ঠা নম্বর
                  </label>
                  <input
                    type="text"
                    value={dateEditForm.pageNumber || ''}
                    onChange={(e) =>
                      setDateEditForm({ ...dateEditForm, pageNumber: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  অধ্যায় / পাঠের শিরোনাম
                </label>
                <input
                  type="text"
                  value={dateEditForm.chapterTitle || ''}
                  onChange={(e) =>
                    setDateEditForm({ ...dateEditForm, chapterTitle: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  পাঠের বিষয়বস্তু / বিভাজন
                </label>
                <textarea
                  rows={3}
                  value={dateEditForm.topicDetail || ''}
                  onChange={(e) =>
                    setDateEditForm({ ...dateEditForm, topicDetail: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  দিবসের ধরন (পাঠদান / সরকারি ছুটি সমন্বয়)
                </label>
                <select
                  value={dateEditForm.dayTypeOverride || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDateEditForm({
                      ...dateEditForm,
                      dayTypeOverride:
                        val === 'teaching' || val === 'govt_holiday' ? val : undefined,
                    });
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800"
                >
                  <option value="">মূল ক্যালেন্ডার অনুযায়ী রাখুন</option>
                  <option value="teaching">পাঠদান দিবস (সেশন নির্ধারিত)</option>
                  <option value="govt_holiday">সরকারি / ঐচ্ছিক ছুটি (চাঁদ দেখা বা স্থানীয় সমন্বয়)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">মন্তব্য</label>
                <input
                  type="text"
                  value={dateEditForm.remark || ''}
                  onChange={(e) => setDateEditForm({ ...dateEditForm, remark: e.target.value })}
                  placeholder="যেমন: সম্পন্ন / আগামী ক্লাসে পুনরালোচনা"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
                {dateRowOverrides[editingDateRow.id] ? (
                  <button
                    type="button"
                    onClick={() => handleResetDateRow(editingDateRow.id)}
                    className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-100"
                  >
                    মূল রূপে ফিরুন
                  </button>
                ) : (
                  <span />
                )}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingDateRow(null)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800"
                  >
                    সংরক্ষণ করুন
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create / Edit Daily Lesson Plan Modal */}
      {editorMode && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-2xl rounded-2xl bg-white p-5 sm:p-6 shadow-xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editorMode === 'edit' ? 'পাঠ পরিকল্পনা সম্পাদনা করুন' : 'নতুন পাঠ পরিকল্পনা তৈরি'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  পরিবর্তনসমূহ সরাসরি আপনার ফোনের অফলাইন স্টোরেজে সংরক্ষিত হবে
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditorMode(null);
                  setEditingId(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">শ্রেণি</label>
                  <select
                    value={formState.classLevel}
                    onChange={(e) => {
                      const nextClass = e.target.value;
                      const nextSubjects = SUBJECTS_BY_CLASS[nextClass] || [];
                      setFormState({
                        ...formState,
                        classLevel: nextClass,
                        subject: nextSubjects.includes(formState.subject)
                          ? formState.subject
                          : nextSubjects[0] || formState.subject,
                      });
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                  >
                    {CLASS_LEVELS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">বিষয়</label>
                  <select
                    value={formState.subject}
                    onChange={(e) => setFormState({ ...formState, subject: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                  >
                    {formClassSubjects.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">প্রান্তিক</label>
                  <select
                    value={formState.term}
                    onChange={(e) =>
                      setFormState({ ...formState, term: e.target.value as TermOption })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                  >
                    <option value="১ম প্রান্তিক">১ম প্রান্তিক (পার্ট ১)</option>
                    <option value="২য় প্রান্তিক">২য় প্রান্তিক (পার্ট ২)</option>
                    <option value="৩য় প্রান্তিক">৩য় প্রান্তিক (পার্ট ৩)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    অধ্যায় / পাঠ
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: অধ্যায় ৩: ভগ্নাংশ"
                    value={formState.chapter}
                    onChange={(e) => setFormState({ ...formState, chapter: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">সময়</label>
                  <input
                    type="text"
                    required
                    value={formState.duration}
                    onChange={(e) => setFormState({ ...formState, duration: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  পাঠের শিরোনাম
                </label>
                <input
                  type="text"
                  required
                  value={formState.lessonTitle}
                  onChange={(e) => setFormState({ ...formState, lessonTitle: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ১. শিখনফল (প্রতি লাইনে একটি)
                </label>
                <textarea
                  rows={2}
                  required
                  value={formState.learningOutcomes}
                  onChange={(e) =>
                    setFormState({ ...formState, learningOutcomes: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ২. শিক্ষা উপকরণ (কমা দিয়ে আলাদা করুন)
                  </label>
                  <input
                    type="text"
                    value={formState.materials}
                    onChange={(e) => setFormState({ ...formState, materials: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ৩. আবেগ সৃষ্টি ও পূর্বজ্ঞান যাচাই
                  </label>
                  <input
                    type="text"
                    required
                    value={formState.warmUp}
                    onChange={(e) => setFormState({ ...formState, warmUp: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ৪. পাঠ উপস্থাপন ধাপ (প্রতি লাইনে একটি ধাপ)
                </label>
                <textarea
                  rows={3}
                  required
                  value={formState.presentation}
                  onChange={(e) => setFormState({ ...formState, presentation: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ৫. মূল্যায়ন (প্রতি লাইনে একটি প্রশ্ন/কাজ)
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="মূল্যায়ন প্রশ্ন..."
                    value={formState.evaluation}
                    onChange={(e) => setFormState({ ...formState, evaluation: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ৬. বাড়ির কাজ
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="বাড়ির কাজ..."
                    value={formState.homework}
                    onChange={(e) => setFormState({ ...formState, homework: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setEditorMode(null);
                    setEditingId(null);
                  }}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  {editorMode === 'edit' ? 'পরিবর্তন সংরক্ষণ করুন' : 'সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <TeacherGuideModal
        lesson={activeGuideLesson}
        onClose={() => setActiveGuideLesson(null)}
      />
    </PageShell>
  );
}
