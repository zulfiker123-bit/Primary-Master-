import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Lightbulb,
  FileText,
  FilePenLine,
  ClipboardList,
  ClipboardCheck,
  BookMarked,
  Award,
  Users,
  MessagesSquare,
  Youtube,
  Compass,
  ArrowUpRight,
  Search,
  Database,
  SlidersHorizontal,
  ShieldCheck,
  Monitor,
  UserCheck,
  Bell,
  Target,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ANNUAL_LESSON_PLANS } from '../data/annualLessonPlans';
import { INITIAL_QUESTIONS } from '../data/curriculum';
import { FeatureSettings, ManagedModuleKey, NoticeItem, RouteKey, TeacherProfile } from '../types';
import { getFormattedBanglaDate, toBanglaDigit } from '../utils/bangla';
import { DateReminderSummary, LessonReminderEntry } from '../utils/lessonReminders';
import { LessonTeacherGuideInput } from '../utils/teacherGuideLookup';
import { GOVT_MONOGRAM_SRC, DPE_LOGO_SRC } from './OfficialEmblems';
import { TeacherGuideModal } from './TeacherGuideModal';

interface HomeDashboardProps {
  profile: TeacherProfile;
  notices: NoticeItem[];
  featureSettings: FeatureSettings;
  todayReminderSummary?: DateReminderSummary;
  onNavigate: (route: RouteKey) => void;
  onPrefetch: (route: RouteKey) => void;
  onOpenProfile: () => void;
  onOpenBackup: () => void;
  onOpenDesktop: () => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
}

type ServiceCategory = 'সব' | 'পাঠ ও পরীক্ষা' | 'দাপ্তরিক ও নথি' | 'শিক্ষার্থী ও বই' | 'সহায়ক ও পোর্টাল';

interface WorkspaceModuleDef {
  route: RouteKey;
  indexNo: string;
  title: string;
  subtitle: string;
  category: Exclude<ServiceCategory, 'সব'>;
  icon: React.ComponentType<{ className?: string }>;
  toneClass: string;
}

const WORKSPACE_MODULES: WorkspaceModuleDef[] = [
  {
    route: 'lesson_plan',
    indexNo: '০১',
    title: 'বার্ষিক পাঠ পরিকল্পনা',
    subtitle: 'প্রাক-প্রাথমিক থেকে ৫ম শ্রেণির সম্পাদনাযোগ্য পাঠ পরিকল্পনা ও ডায়েরি',
    category: 'পাঠ ও পরীক্ষা',
    icon: BookOpen,
    toneClass: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
  },
  {
    route: 'questions',
    indexNo: '০২',
    title: 'অধ্যায়ভিত্তিক প্রশ্ন ও সমাধান',
    subtitle: 'প্রাক–৫ম শ্রেণির সকল বিষয়ের অধ্যায়ভিত্তিক প্রশ্ন ভান্ডার',
    category: 'পাঠ ও পরীক্ষা',
    icon: Lightbulb,
    toneClass: 'bg-amber-50 text-amber-800 border-amber-200/80',
  },
  {
    route: 'suggestions',
    indexNo: '০৩',
    title: 'প্রশ্নপত্র ও সাজেশন স্টুডিও',
    subtitle: 'NCTB প্রশ্নকাঠামো অনুযায়ী ১-ক্লিক A4 প্রশ্নপত্র ও উত্তরমালা',
    category: 'পাঠ ও পরীক্ষা',
    icon: FileText,
    toneClass: 'bg-teal-50 text-teal-800 border-teal-200/80',
  },
  {
    route: 'evaluation',
    indexNo: '০৪',
    title: 'ধারাবাহিক মূল্যায়ন রেকর্ড',
    subtitle: 'শিক্ষার্থীর মূল্যায়ন, নম্বরপত্র ও প্রগতি রিপোর্ট সংরক্ষণ',
    category: 'পাঠ ও পরীক্ষা',
    icon: ClipboardCheck,
    toneClass: 'bg-rose-50 text-rose-800 border-rose-200/80',
  },
  {
    route: 'monthly_fln',
    indexNo: '০৫',
    title: 'মাসিক FLN (১২ মাস)',
    subtitle: '৩য়–৫ম শ্রেণিসহ সকল শ্রেণির প্রান্তিক যোগ্যতাভিত্তিক FLN যাচাই',
    category: 'পাঠ ও পরীক্ষা',
    icon: ClipboardList,
    toneClass: 'bg-orange-50 text-orange-800 border-orange-200/80',
  },
  {
    route: 'terminal_competencies',
    indexNo: '০৬',
    title: 'প্রান্তিক যোগ্যতা',
    subtitle: 'প্রাক–৫ম শ্রেণির মাসভিত্তিক অর্জিতব্য প্রান্তিক যোগ্যতা',
    category: 'পাঠ ও পরীক্ষা',
    icon: Target,
    toneClass: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
  },
  {
    route: 'applications',
    indexNo: '০৭',
    title: 'দাপ্তরিক আবেদন সমূহ',
    subtitle: 'নৈমিত্তিক ছুটি, হোম ভিজিট ও দাপ্তরিক ফরম্যাট প্রিন্ট',
    category: 'দাপ্তরিক ও নথি',
    icon: FilePenLine,
    toneClass: 'bg-sky-50 text-sky-800 border-sky-200/80',
  },
  {
    route: 'certificates',
    indexNo: '০৮',
    title: 'সনদ ও প্রত্যয়নপত্র',
    subtitle: 'প্রশংসাপত্র, ছাড়পত্র (TC) ও অধ্যয়ন সনদ PDF তৈরি',
    category: 'দাপ্তরিক ও নথি',
    icon: Award,
    toneClass: 'bg-slate-100 text-slate-800 border-slate-200/90',
  },
  {
    route: 'books',
    indexNo: '০৯',
    title: 'NCTB মূল বই ও শিক্ষক সহায়িকা',
    subtitle: 'প্রাক–৫ম শ্রেণির পাঠ্যবই ও সহায়িকার পার্টভিত্তিক সংকলন',
    category: 'শিক্ষার্থী ও বই',
    icon: BookMarked,
    toneClass: 'bg-indigo-50 text-indigo-800 border-indigo-200/80',
  },
  {
    route: 'students',
    indexNo: '১০',
    title: 'শিক্ষার্থীর তথ্য ও হাজিরা খাতা',
    subtitle: 'শ্রেণিভিত্তিক শিক্ষার্থী তালিকা, প্রোফাইল কার্ড ও প্রিন্ট',
    category: 'শিক্ষার্থী ও বই',
    icon: Users,
    toneClass: 'bg-cyan-50 text-cyan-800 border-cyan-200/80',
  },
  {
    route: 'forum',
    indexNo: '১১',
    title: 'শিক্ষক ফোরাম ও অভিজ্ঞতা',
    subtitle: 'সহকর্মী শিক্ষকদের সাথে পাঠদান অভিজ্ঞতা ও পরামর্শ বিনিময়',
    category: 'সহায়ক ও পোর্টাল',
    icon: MessagesSquare,
    toneClass: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
  },
  {
    route: 'videos',
    indexNo: '১২',
    title: 'শিক্ষামূলক ভিডিও পাঠশালা',
    subtitle: 'শ্রেণিকক্ষ পাঠদান কৌশল, ছড়া ও শিক্ষক প্রশিক্ষণ ভিডিও',
    category: 'সহায়ক ও পোর্টাল',
    icon: Youtube,
    toneClass: 'bg-red-50 text-red-800 border-red-200/80',
  },
  {
    route: 'portals',
    indexNo: '১৩',
    title: 'অফিশিয়াল পোর্টাল ও নির্দেশিকা',
    subtitle: 'IPEMIS, PESP উপবৃত্তি, DPE ও বার্ষিক ছুটির ক্যালেন্ডার',
    category: 'সহায়ক ও পোর্টাল',
    icon: Compass,
    toneClass: 'bg-stone-100 text-stone-800 border-stone-200',
  },
];

const CATEGORIES: ServiceCategory[] = [
  'সব',
  'পাঠ ও পরীক্ষা',
  'দাপ্তরিক ও নথি',
  'শিক্ষার্থী ও বই',
  'সহায়ক ও পোর্টাল',
];

function safeCount(storageKey: string, fallbackCount: number): number {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return fallbackCount;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.length : fallbackCount;
  } catch {
    return fallbackCount;
  }
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  profile,
  notices,
  featureSettings,
  todayReminderSummary,
  onNavigate,
  onPrefetch,
  onOpenProfile,
  onOpenBackup,
  onOpenDesktop,
  onOpenAuth,
}) => {
  const { user, accountMeta } = useAuth();
  const todayBangla = getFormattedBanglaDate();
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory>('সব');
  const [searchQuery, setSearchQuery] = useState('');
  const [storageTick, setStorageTick] = useState(0);
  const [activeGuideLesson, setActiveGuideLesson] = useState<LessonReminderEntry | null>(null);

  const activeGuideInput = useMemo<LessonTeacherGuideInput | null>(() => {
    if (!activeGuideLesson) return null;
    return {
      classLevel: activeGuideLesson.classLevel,
      subject: activeGuideLesson.subject,
      term: activeGuideLesson.term,
      dateBn: activeGuideLesson.dateBn,
      weekdayBn: activeGuideLesson.weekdayBn,
      sessionLabel: activeGuideLesson.sessionLabel,
      chapterTitle: activeGuideLesson.chapterTitle || activeGuideLesson.subject,
      topicDetail: activeGuideLesson.topicDetail,
      pageNumber: activeGuideLesson.pageNumber,
      durationMinutes: activeGuideLesson.durationMinutes,
      isoDate: activeGuideLesson.isoDate,
    };
  }, [activeGuideLesson]);

  const handleOpenLessonInPlan = (lesson: LessonTeacherGuideInput) => {
    try {
      window.sessionStorage.setItem(
        'lp_jump_target',
        JSON.stringify({
          classLevel: lesson.classLevel,
          subject: lesson.subject,
          isoDate: lesson.isoDate || todayReminderSummary?.resolvedIso,
        })
      );
    } catch {
      // ignore storage failure
    }
    setActiveGuideLesson(null);
    onNavigate('lesson_plan');
  };

  useEffect(() => {
    const onSync = () => setStorageTick((t) => t + 1);
    window.addEventListener('local-storage-sync', onSync);
    return () => window.removeEventListener('local-storage-sync', onSync);
  }, []);

  const activeNotices = useMemo(
    () => notices.filter((n) => n.isActive !== false),
    [notices]
  );
  const latestNotice = activeNotices[0] || null;

  const counts = useMemo(
    () => ({
      lessonPlans: safeCount('custom_lesson_plans_v1', ANNUAL_LESSON_PLANS.length),
      questions: safeCount('custom_questions_v1', INITIAL_QUESTIONS.length),
      students: safeCount('students_list_v1', 2),
      notices: activeNotices.length,
    }),
    [activeNotices.length, storageTick]
  );

  const visibleModules = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return WORKSPACE_MODULES.filter((mod) => {
      const enabled = featureSettings.enabledModules[mod.route as ManagedModuleKey] !== false;
      if (!enabled) return false;
      const matchesCat = selectedCategory === 'সব' || mod.category === selectedCategory;
      const matchesSearch =
        !q ||
        mod.title.toLowerCase().includes(q) ||
        mod.subtitle.toLowerCase().includes(q) ||
        mod.category.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [featureSettings.enabledModules, selectedCategory, searchQuery]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-5 pb-20 md:pb-12 space-y-8">
      {/* SECTION 1: Architectural Dark Ink Teacher Command Desk + Live School Ledger */}
      <section
        aria-label="শিক্ষক কর্মক্ষেত্র ও বিদ্যালয় সারসংক্ষেপ"
        className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch"
      >
        {/* Left: Dark Botanical Charcoal Command Masthead */}
        <div className="lg:col-span-8 rounded-3xl bg-[#102A23] text-white p-6 sm:p-8 flex flex-col justify-between gap-6">
          <div className="space-y-4">
            {/* Unboxed Metadata Line */}
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-medium text-emerald-200/85">
              <span>{todayBangla}</span>
              <span aria-hidden="true">·</span>
              <span>
                {profile.upazila || 'আশাশুনি'}, {profile.district || 'সাতক্ষীরা'}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {user
                  ? `ক্লাউড সিঙ্কড (${accountMeta?.loginId || user.displayName || 'লগিনকৃত'})`
                  : 'অফলাইন বিদ্যালয় ব্যবস্থাপনা'}
              </span>
            </div>

            {/* Teacher Identity Lockup with Two-Side Official Emblems */}
            <div className="flex items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                <img
                  src={GOVT_MONOGRAM_SRC}
                  alt="গণপ্রজাতন্ত্রী বাংলাদেশ সরকার মনোগ্রাম"
                  className="h-14 w-14 sm:h-16 sm:w-16 rounded-full object-contain ring-2 ring-amber-300/50 bg-white p-0.5 shrink-0"
                />
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-3xl font-bold tracking-tight text-white leading-snug">
                    {profile.name || 'জুলফিকার রহমান'}
                  </h1>
                  <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 leading-relaxed">
                    {profile.designation || 'সহকারী শিক্ষক'} ·{' '}
                    {profile.school || '৮২ নং কোলা সরকারি প্রাথমিক বিদ্যালয়'}
                  </p>
                  <p className="text-xs text-emerald-200/75 mt-1 tabular-nums">
                    {profile.villagePost || 'কোলা, মাড়িয়ালা'} · মোবাইল:{' '}
                    {profile.phone || '০১৭৬৭৭৯২২৪৯'}
                  </p>
                </div>
              </div>
              <img
                src={DPE_LOGO_SRC}
                alt="প্রাথমিক শিক্ষা অধিদপ্তর লোগো"
                className="h-14 w-14 sm:h-16 sm:w-16 rounded-xl object-contain ring-2 ring-emerald-300/40 bg-white p-0.5 shrink-0"
              />
            </div>
          </div>

          {/* Primary Desk Utility Controls (>= 44px touch targets) */}
          <div className="border-t border-white/15 pt-5 flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={onOpenProfile}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-emerald-500 transition-colors whitespace-nowrap shrink-0"
            >
              <UserCheck className="h-4 w-4" aria-hidden="true" />
              <span>তথ্য সম্পাদনা</span>
            </button>
            <button
              type="button"
              onClick={onOpenBackup}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-white/20 transition-colors whitespace-nowrap shrink-0"
            >
              <Database className="h-4 w-4 text-emerald-300" aria-hidden="true" />
              <span>ডাটা ব্যাকআপ ও রিস্টোর</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('admin_dashboard')}
              onMouseEnter={() => onPrefetch('admin_dashboard')}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-white/10 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-white/20 transition-colors whitespace-nowrap shrink-0"
            >
              <SlidersHorizontal className="h-4 w-4 text-emerald-300" aria-hidden="true" />
              <span>ড্যাশবোর্ড</span>
            </button>
            <button
              type="button"
              onClick={onOpenDesktop}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-white/10 px-3.5 py-2 text-xs sm:text-sm font-semibold text-emerald-100 hover:bg-white/20 transition-colors whitespace-nowrap shrink-0"
            >
              <Monitor className="h-4 w-4 text-emerald-300" aria-hidden="true" />
              <span>পিসি লিংক</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenAuth('login')}
              aria-label="লগিন ও অ্যাকাউন্ট পরিচালনা"
              title={user ? `লগিনকৃত: ${accountMeta?.loginId || 'অ্যাকাউন্ট'}` : 'লগিন ও নতুন ইউজার রেজিস্ট্রেশন'}
              className="relative inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-white/10 px-3 text-amber-300 hover:bg-white/20 transition-colors shrink-0"
            >
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              {user && (
                <span
                  aria-hidden="true"
                  className="absolute top-2 right-2 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-[#102A23]"
                />
              )}
            </button>
          </div>
        </div>

        {/* Right: Live Local Database Ledger & Latest Notice */}
        <div className="lg:col-span-4 rounded-3xl bg-white border border-stone-200/90 p-5 sm:p-6 flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-slate-900">বিদ্যালয়ের রেকর্ড ও তথ্য</h2>
            <button
              type="button"
              onClick={() => onNavigate('notices')}
              onMouseEnter={() => onPrefetch('notices')}
              className="text-xs font-semibold text-emerald-800 hover:underline underline-offset-4 whitespace-nowrap"
            >
              সকল নোটিশ
            </button>
          </div>

          {/* Clean 2x2 Hairline Ledger */}
          <div className="grid grid-cols-2 border border-stone-200/80 rounded-2xl overflow-hidden divide-x divide-y divide-stone-200/80">
            <button
              type="button"
              onClick={() => onNavigate('lesson_plan')}
              onMouseEnter={() => onPrefetch('lesson_plan')}
              className="p-3.5 text-left hover:bg-stone-50 transition-colors"
            >
              <p className="text-xs text-slate-500">পাঠ পরিকল্পনা</p>
              <p className="text-xl font-bold text-slate-900 tabular-nums mt-0.5">
                {toBanglaDigit(counts.lessonPlans)}
              </p>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('questions')}
              onMouseEnter={() => onPrefetch('questions')}
              className="p-3.5 text-left hover:bg-stone-50 transition-colors"
            >
              <p className="text-xs text-slate-500">প্রশ্ন ভান্ডার</p>
              <p className="text-xl font-bold text-slate-900 tabular-nums mt-0.5">
                {toBanglaDigit(counts.questions)}
              </p>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('students')}
              onMouseEnter={() => onPrefetch('students')}
              className="p-3.5 text-left hover:bg-stone-50 transition-colors"
            >
              <p className="text-xs text-slate-500">নিবন্ধিত শিক্ষার্থী</p>
              <p className="text-xl font-bold text-slate-900 tabular-nums mt-0.5">
                {toBanglaDigit(counts.students)}
              </p>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('notices')}
              onMouseEnter={() => onPrefetch('notices')}
              className="p-3.5 text-left hover:bg-stone-50 transition-colors"
            >
              <p className="text-xs text-slate-500">সক্রিয় নোটিশ</p>
              <p className="text-xl font-bold text-emerald-800 tabular-nums mt-0.5">
                {toBanglaDigit(counts.notices)}
              </p>
            </button>
          </div>

          {/* Today's Lesson Plan Reminder Preview (Click any today's lesson for Teacher's Guide) */}
          {todayReminderSummary && (
            <div className="w-full border-t border-stone-100 pt-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800 min-w-0">
                  <BookOpen className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>আজকের পাঠ পরিকল্পনা</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-slate-500 font-normal truncate">
                    {todayReminderSummary.dateBn}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('notices')}
                  onMouseEnter={() => onPrefetch('notices')}
                  className="text-[11px] font-semibold text-emerald-800 hover:underline underline-offset-4 whitespace-nowrap shrink-0"
                >
                  রিমাইন্ডার সেটিংস
                </button>
              </div>

              {todayReminderSummary.scheduledLessons.length > 0 ? (
                <div className="space-y-1.5">
                  {todayReminderSummary.scheduledLessons.slice(0, 3).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveGuideLesson(item)}
                      className="group w-full rounded-xl border border-stone-200/80 bg-stone-50/70 px-3 py-2 text-left hover:border-emerald-700/60 hover:bg-emerald-50/50 transition-colors flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate group-hover:text-emerald-900">
                          {item.classLevel} · {item.subject}
                        </p>
                        <p className="text-[11px] text-slate-600 truncate mt-0.5">
                          {item.topicDetail}
                        </p>
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-800 whitespace-nowrap shrink-0 inline-flex items-center gap-0.5">
                        <span>সহায়িকা</span>
                        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </span>
                    </button>
                  ))}
                  {todayReminderSummary.scheduledLessons.length > 3 && (
                    <button
                      type="button"
                      onClick={() => onNavigate('notices')}
                      className="text-[11px] font-semibold text-blue-700 hover:underline pl-1"
                    >
                      আরও {toBanglaDigit(todayReminderSummary.scheduledLessons.length - 3)}টি আজকের পাঠ দেখুন →
                    </button>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onNavigate('notices')}
                  onMouseEnter={() => onPrefetch('notices')}
                  className="group w-full text-left flex items-center justify-between gap-2 text-xs font-semibold text-slate-700 hover:text-emerald-800"
                >
                  <span className="line-clamp-2">
                    {todayReminderSummary.totalConfiguredSubjects === 0
                      ? 'আপনার শ্রেণি ও বিষয় নির্বাচন করে দৈনিক পাঠ রিমাইন্ডার চালু করুন'
                      : todayReminderSummary.holidayOrExamBanner ||
                        'নির্বাচিত বিষয়গুলোর আজ নির্ধারিত পাঠ নেই'}
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-slate-400 shrink-0" aria-hidden="true" />
                </button>
              )}
            </div>
          )}

          {/* Latest Notice Preview (clickable row instead of ticker strip) */}
          {featureSettings.showNoticeTicker !== false && latestNotice && (
            <button
              type="button"
              onClick={() => onNavigate('notices')}
              onMouseEnter={() => onPrefetch('notices')}
              className="group w-full border-t border-stone-100 pt-3.5 text-left flex items-start justify-between gap-3"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-800">
                  <Bell className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>{featureSettings.tickerLabel || 'সাম্প্রতিক নোটিশ'}</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-slate-500 font-normal">{latestNotice.date}</span>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-slate-900 line-clamp-2 group-hover:text-emerald-800 transition-colors">
                  {latestNotice.title}
                </p>
              </div>
              <ArrowUpRight
                className="h-4 w-4 text-slate-400 group-hover:text-emerald-700 shrink-0 mt-1 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </button>
          )}
        </div>
      </section>

      {/* SECTION 2: Categorized Horizontal Utility Module Directory */}
      <section aria-labelledby="workspace-modules-heading" className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-stone-200 pb-4">
          <div>
            <h2
              id="workspace-modules-heading"
              className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight"
            >
              প্রধান সেবাসমূহ
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              শ্রেণিকক্ষের পাঠ, পরীক্ষা ও দাপ্তরিক কাজের সব সেবা বাটন আকারে
            </p>
          </div>

          {/* Interactive Search Input */}
          <div className="relative w-full md:w-80 shrink-0">
            <Search
              className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="মডিউল খুঁজুন (যেমন: পাঠ, প্রশ্ন, ছুটি)..."
              className="w-full h-11 rounded-xl border border-stone-200 bg-white pl-10 pr-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-700 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="অনুসন্ধান মুছুন"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Functional Category Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`min-h-[40px] rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-[#102A23] text-white'
                    : 'bg-white border border-stone-200 text-slate-700 hover:bg-stone-100'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Medium-Size Service Action Buttons Grid */}
        {visibleModules.length === 0 ? (
          <div className="rounded-2xl bg-white border border-stone-200 p-8 text-center space-y-3">
            <p className="text-sm text-slate-600">
              নির্বাচিত বিভাগ বা অনুসন্ধানে কোনো মডিউল পাওয়া যায়নি।
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('সব');
                setSearchQuery('');
              }}
              className="inline-flex min-h-[40px] items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800"
            >
              <span>সব সেবা দেখুন</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3">
            {visibleModules.map((mod) => {
              const Icon = mod.icon;
              return (
                <button
                  key={mod.route}
                  type="button"
                  onClick={() => onNavigate(mod.route)}
                  onMouseEnter={() => onPrefetch(mod.route)}
                  onTouchStart={() => onPrefetch(mod.route)}
                  className="card-interactive group w-full min-h-[60px] sm:min-h-[64px] text-left rounded-xl bg-white border border-stone-200/90 px-3 py-2.5 sm:px-3.5 sm:py-3 hover:border-emerald-700 hover:bg-emerald-50/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700/30 flex items-center gap-2.5 sm:gap-3 shadow-xs"
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${mod.toneClass} transition-transform duration-150 group-hover:scale-105`}
                  >
                    <Icon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" aria-hidden="true" />
                  </span>

                  <span className="flex-1 min-w-0">
                    <span className="block text-xs sm:text-sm font-bold text-slate-900 leading-tight truncate group-hover:text-emerald-900 transition-colors">
                      {mod.title}
                    </span>
                    <span className="block text-[10px] sm:text-[11px] text-slate-500 leading-tight truncate mt-0.5">
                      {mod.category}
                    </span>
                  </span>

                  <ArrowUpRight
                    className="h-3.5 w-3.5 text-slate-300 group-hover:text-emerald-700 shrink-0 transition-transform group-hover:translate-x-0.5 hidden sm:block"
                    aria-hidden="true"
                  />
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* SECTION 3: Two-Column Quick Shortcut Strip */}
      <section aria-label="দৈনন্দিন দ্রুত কার্যক্রম" className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-white border border-stone-200/90 p-5 space-y-3.5">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
            <h2 className="text-sm font-bold text-slate-900">শ্রেণিকক্ষ ও মূল্যায়ন শর্টকাট</h2>
            <span className="text-xs text-slate-500">প্রাক–৫ম শ্রেণি</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { route: 'lesson_plan' as RouteKey, label: 'নতুন পাঠ পরিকল্পনা' },
              { route: 'suggestions' as RouteKey, label: 'NCTB প্রশ্নপত্র তৈরি' },
              { route: 'evaluation' as RouteKey, label: 'মূল্যায়ন নম্বর এন্ট্রি' },
              { route: 'books' as RouteKey, label: 'মূল বই ও পাঠটীকা' },
            ].map((item) => (
              <button
                key={item.route}
                type="button"
                onClick={() => onNavigate(item.route)}
                onMouseEnter={() => onPrefetch(item.route)}
                className="min-h-[44px] rounded-xl border border-stone-200 bg-stone-50/70 px-3 py-2 text-left text-xs font-semibold text-slate-800 hover:border-emerald-700 hover:bg-emerald-50/50 hover:text-emerald-900 transition-colors flex items-center justify-between gap-2"
              >
                <span className="truncate">{item.label}</span>
                <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 shrink-0" aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-stone-200/90 p-5 space-y-3.5">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
            <h2 className="text-sm font-bold text-slate-900">অফিসিয়াল কাগজপত্র ও প্রিন্ট</h2>
            <span className="text-xs text-slate-500">A4 রেডি ফরম্যাট</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { route: 'monthly_fln' as RouteKey, label: 'মাসিক FLN যাচাই (১২ মাস)' },
              { route: 'applications' as RouteKey, label: 'ছুটি ও ভিজিট আবেদন' },
              { route: 'certificates' as RouteKey, label: 'প্রত্যয়ন ও ছাড়পত্র' },
              { route: 'students' as RouteKey, label: 'শিক্ষার্থী প্রোফাইল' },
            ].map((item) => (
              <button
                key={item.route}
                type="button"
                onClick={() => onNavigate(item.route)}
                onMouseEnter={() => onPrefetch(item.route)}
                className="min-h-[44px] rounded-xl border border-stone-200 bg-stone-50/70 px-3 py-2 text-left text-xs font-semibold text-slate-800 hover:border-emerald-700 hover:bg-emerald-50/50 hover:text-emerald-900 transition-colors flex items-center justify-between gap-2"
              >
                <span className="truncate">{item.label}</span>
                <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 shrink-0" aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4: Editorial Split Footer */}
      <footer className="rounded-2xl bg-white border border-stone-200/90 p-5 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Brand & Copyright */}
          <div className="md:col-span-5 space-y-2.5">
            <div className="flex items-center gap-2.5">
              <img
                src={DPE_LOGO_SRC}
                alt="প্রাইমারি মাস্টার"
                className="h-9 w-9 rounded-xl object-contain border border-stone-200 bg-white p-0.5 shrink-0"
              />
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">প্রাইমারি মাস্টার</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              © ২০২৬ · সম্পূর্ণ অফলাইন ও স্থানীয় ফোন স্টোরেজে সুরক্ষিত
            </p>
          </div>

          {/* Info & Policy Links */}
          <div className="md:col-span-3">
            <h2 className="text-xs font-semibold text-slate-500 mb-2.5">তথ্য ও নীতিমালা</h2>
            <nav aria-label="ফুটার নেভিগেশন" className="flex flex-col items-start gap-1.5">
              {[
                { route: 'about' as RouteKey, label: 'আমাদের সম্পর্কে' },
                { route: 'contact' as RouteKey, label: 'যোগাযোগ করুন' },
                { route: 'privacy_policy' as RouteKey, label: 'গোপনীয়তা ও নীতি' },
                ...(featureSettings.showDeveloperSpotlight
                  ? [{ route: 'portfolio' as RouteKey, label: 'ডেভেলপার পরিচিতি' }]
                  : []),
              ].map((link) => (
                <button
                  key={link.route}
                  type="button"
                  onClick={() => onNavigate(link.route)}
                  onMouseEnter={() => onPrefetch(link.route)}
                  className="text-xs font-semibold text-slate-700 hover:text-emerald-800 hover:underline underline-offset-4 transition-colors py-0.5 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 rounded"
                >
                  {link.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Teacher Community Groups */}
          <div className="md:col-span-4">
            <h2 className="text-xs font-semibold text-slate-500 mb-2.5">শিক্ষক কমিউনিটি</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-2">
              <a
                href="https://www.facebook.com/share/g/1MSv9rwTH2/"
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[42px] rounded-xl border border-stone-200 bg-stone-50/70 px-3.5 py-2 flex items-center justify-between gap-2.5 text-xs font-semibold text-slate-800 hover:border-blue-600/40 hover:bg-blue-50/60 hover:text-blue-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                <span className="flex items-center gap-2 min-w-0">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4 text-blue-600 shrink-0 fill-current"
                    aria-hidden="true"
                  >
                    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                  </svg>
                  <span className="truncate">ফেসবুক গ্রুপ</span>
                </span>
                <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 shrink-0" aria-hidden="true" />
              </a>

              <a
                href="https://chat.whatsapp.com/JPdpnoqmdEo6YVrUs3KlvO?s=cl&p=a&iam=2"
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[42px] rounded-xl border border-stone-200 bg-stone-50/70 px-3.5 py-2 flex items-center justify-between gap-2.5 text-xs font-semibold text-slate-800 hover:border-emerald-700/50 hover:bg-emerald-50/60 hover:text-emerald-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
              >
                <span className="flex items-center gap-2 min-w-0">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4 text-emerald-600 shrink-0 fill-current"
                    aria-hidden="true"
                  >
                    <path d="M12.031 2c-5.516 0-9.969 4.453-9.969 9.969 0 1.766.469 3.484 1.344 5l-1.406 5.156 5.281-1.391c1.469.797 3.109 1.219 4.75 1.219 5.516 0 9.969-4.453 9.969-9.969S17.547 2 12.031 2zm5.813 14.125c-.25.703-1.438 1.344-2 1.422-.516.078-1.172.109-1.891-.125-.438-.141-.984-.328-1.688-.641-2.969-1.281-4.906-4.266-5.047-4.469-.141-.188-1.203-1.609-1.203-3.063s.766-2.172 1.031-2.469c.266-.297.578-.375.781-.375.188 0 .391 0 .563.016.172.016.422-.063.656.5.25.594.844 2.047.922 2.203.078.141.125.313.031.5-.094.188-.141.313-.297.484-.141.172-.313.391-.438.516-.141.141-.297.297-.125.594.172.297.766 1.266 1.641 2.047 1.125 1 2.078 1.313 2.375 1.469.297.141.469.125.641-.078.172-.188.734-.859.938-1.156.188-.297.391-.25.656-.156.266.094 1.688.797 1.984.938.297.156.484.219.563.344.078.125.078.734-.172 1.438z" />
                  </svg>
                  <span className="truncate">হোয়াটসঅ্যাপ গ্রুপ</span>
                </span>
                <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 shrink-0" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </footer>
      <TeacherGuideModal
        lesson={activeGuideInput}
        onClose={() => setActiveGuideLesson(null)}
        onOpenInLessonPlan={handleOpenLessonInPlan}
      />
    </div>
  );
};
