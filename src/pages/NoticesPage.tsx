import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowUpRight,
  Bell,
  BellRing,
  BookMarked,
  BookOpen,
  Calendar,
  CalendarDays,
  CheckCircle2,
  Clock,
  Settings2,
  SlidersHorizontal,
} from 'lucide-react';
import { LessonReminderConfigPanel } from '../components/LessonReminderConfigPanel';
import { PageShell } from '../components/PageShell';
import { TeacherGuideModal } from '../components/TeacherGuideModal';
import { NoticeItem, RouteKey } from '../types';
import { toBanglaDigit } from '../utils/bangla';
import {
  countSelectedReminderSubjects,
  DateRowOverrideLike,
  DEFAULT_LESSON_REMINDER_PREFS,
  getLessonRemindersForDate,
  getLocalIsoDate,
  LessonReminderEntry,
  LessonReminderPrefs,
} from '../utils/lessonReminders';
import { LessonTeacherGuideInput } from '../utils/teacherGuideLookup';

interface NoticesPageProps {
  notices: NoticeItem[];
  onNavigate: (route: RouteKey) => void;
  onMarkAllRead: () => void;
  reminderPrefs?: LessonReminderPrefs;
  onUpdateReminderPrefs?: (next: LessonReminderPrefs) => void;
  dateOverrides?: Record<string, DateRowOverrideLike>;
}

export default function NoticesPage({
  notices,
  onNavigate,
  onMarkAllRead,
  reminderPrefs = DEFAULT_LESSON_REMINDER_PREFS,
  onUpdateReminderPrefs,
  dateOverrides = {},
}: NoticesPageProps) {
  const [filterCat, setFilterCat] = useState<string>('সকল');
  const todayIso = useMemo(() => getLocalIsoDate(), []);
  const tomorrowIso = useMemo(() => getLocalIsoDate(new Date(Date.now() + 86400000)), []);
  const [selectedIsoDate, setSelectedIsoDate] = useState<string>(todayIso);
  const [reminderClassFilter, setReminderClassFilter] = useState<string>('সকল শ্রেণি');
  const [showConfig, setShowConfig] = useState<boolean>(
    () => countSelectedReminderSubjects(reminderPrefs) === 0
  );
  const [browserNotifyStatus, setBrowserNotifyStatus] = useState<string>('');
  const [activeGuideLesson, setActiveGuideLesson] = useState<LessonTeacherGuideInput | null>(null);

  const openGuideForReminder = (item: LessonReminderEntry) => {
    setActiveGuideLesson({
      classLevel: item.classLevel,
      subject: item.subject,
      term: item.term,
      dateBn: item.dateBn,
      weekdayBn: item.weekdayBn,
      sessionLabel: item.sessionLabel,
      chapterTitle: item.chapterTitle || item.subject,
      topicDetail: item.topicDetail,
      pageNumber: item.pageNumber,
      durationMinutes: item.durationMinutes,
      isoDate: item.isoDate,
    });
  };

  useEffect(() => {
    onMarkAllRead();
  }, [onMarkAllRead, notices.length]);

  const reminderSummary = useMemo(
    () => getLessonRemindersForDate(selectedIsoDate, reminderPrefs, dateOverrides),
    [selectedIsoDate, reminderPrefs, dateOverrides]
  );

  const configuredClasses = useMemo(
    () => Object.keys(reminderPrefs.selections || {}).filter((cls) => (reminderPrefs.selections[cls]?.length || 0) > 0),
    [reminderPrefs.selections]
  );

  const groupedLessons = useMemo(() => {
    const groups = new Map<string, typeof reminderSummary.scheduledLessons>();
    reminderSummary.scheduledLessons.forEach((item) => {
      if (reminderClassFilter !== 'সকল শ্রেণি' && item.classLevel !== reminderClassFilter) {
        return;
      }
      const list = groups.get(item.classLevel) || [];
      list.push(item);
      groups.set(item.classLevel, list);
    });
    return Array.from(groups.entries());
  }, [reminderSummary.scheduledLessons, reminderClassFilter]);

  const selectedCount = countSelectedReminderSubjects(reminderPrefs);

  const activeNotices = notices.filter((n) => n.isActive !== false);
  const filtered = activeNotices.filter(
    (n) => filterCat === 'সকল' || n.category === filterCat
  );

  const handleOpenInLessonPlan = (classLevel: string, subject: string, iso2026: string) => {
    try {
      window.sessionStorage.setItem(
        'lp_jump_target',
        JSON.stringify({ classLevel, subject, isoDate: iso2026 })
      );
    } catch {
      // Ignore storage edge cases
    }
    onNavigate('lesson_plan');
  };

  const handleTriggerBrowserNotification = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setBrowserNotifyStatus('এই ব্রাউজারে পুশ নোটিফিকেশন সমর্থিত নয়, তবে অ্যাপের ভেতরে রিমাইন্ডার সক্রিয় আছে।');
      return;
    }

    try {
      const permission =
        Notification.permission === 'granted'
          ? 'granted'
          : await Notification.requestPermission();

      if (permission !== 'granted') {
        setBrowserNotifyStatus('ব্রাউজার নোটিফিকেশন অনুমতি দেওয়া হয়নি। অ্যাপের ভেতরেই রিমাইন্ডার দেখা যাবে।');
        return;
      }

      const lessons = reminderSummary.scheduledLessons;
      const bodyText =
        lessons.length > 0
          ? lessons
              .slice(0, 3)
              .map((l) => `${l.classLevel} (${l.subject}): ${l.topicDetail}`)
              .join(' | ')
          : reminderSummary.holidayOrExamBanner ||
            'নির্বাচিত বিষয়গুলোর আজ নির্ধারিত পাঠ নেই।';

      new Notification(`পাঠ রিমাইন্ডার — ${reminderSummary.dateBn}`, {
        body: bodyText,
      });
      setBrowserNotifyStatus('ডিভাইস নোটিফিকেশন পাঠানো হয়েছে।');
    } catch {
      setBrowserNotifyStatus('ডিভাইস নোটিফিকেশন পাঠানো যায়নি, অ্যাপের ভেতরের রিমাইন্ডার সক্রিয় আছে।');
    }
  };

  return (
    <PageShell
      title="লাইভ নোটিশ ও পাঠ রিমাইন্ডার"
      subtitle="বার্ষিক পাঠ পরিকল্পনা অনুযায়ী তারিখভিত্তিক পাঠ রিমাইন্ডার এবং অফিসিয়াল বিজ্ঞপ্তি"
      onNavigate={onNavigate}
      actions={
        <button
          type="button"
          onClick={() => onNavigate('admin_dashboard')}
          className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0"
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          <span>নোটিশ পরিচালনা</span>
        </button>
      }
    >
      {/* SECTION 1: Annual Lesson Plan Reminders */}
      <section
        aria-label="বার্ষিক পাঠ পরিকল্পনা রিমাইন্ডার"
        className="mb-7 rounded-2xl bg-white border border-slate-200 p-4 sm:p-6 space-y-4 shadow-xs"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0F2922] text-emerald-300 shrink-0">
              <BellRing className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                তারিখ অনুযায়ী পাঠ পরিকল্পনা রিমাইন্ডার
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {reminderSummary.dateBn} ({reminderSummary.weekdayBn}) · {reminderSummary.term} ·
                নির্বাচিত বিষয়: {toBanglaDigit(selectedCount)}টি
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1 rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setSelectedIsoDate(todayIso)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                  selectedIsoDate === todayIso
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                আজ
              </button>
              <button
                type="button"
                onClick={() => setSelectedIsoDate(tomorrowIso)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                  selectedIsoDate === tomorrowIso
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                আগামীকাল
              </button>
            </div>

            <input
              type="date"
              value={selectedIsoDate}
              onChange={(e) => {
                if (e.target.value) setSelectedIsoDate(e.target.value);
              }}
              aria-label="রিমাইন্ডারের তারিখ নির্বাচন"
              className="h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-800"
            />

            {onUpdateReminderPrefs && (
              <button
                type="button"
                onClick={() => setShowConfig((v) => !v)}
                aria-expanded={showConfig}
                className={`inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition-colors whitespace-nowrap ${
                  showConfig
                    ? 'border-emerald-700 bg-emerald-700 text-white'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100'
                }`}
              >
                <Settings2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>নিজ শ্রেণি ও বিষয় ঠিক করুন</span>
              </button>
            )}

            {typeof window !== 'undefined' && 'Notification' in window && (
              <button
                type="button"
                onClick={handleTriggerBrowserNotification}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap"
              >
                <Bell className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />
                <span>অ্যালার্ট টেস্ট</span>
              </button>
            )}
          </div>
        </div>

        {browserNotifyStatus && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-medium text-blue-900">
            {browserNotifyStatus}
          </div>
        )}

        {/* User Class & Subject Selector */}
        {showConfig && onUpdateReminderPrefs && (
          <LessonReminderConfigPanel prefs={reminderPrefs} onChange={onUpdateReminderPrefs} />
        )}

        {/* Holiday / Exam Banner if applicable */}
        {reminderSummary.holidayOrExamBanner && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 flex items-center gap-2.5 text-xs sm:text-sm text-amber-950 font-medium">
            <CalendarDays className="h-4 w-4 text-amber-700 shrink-0" aria-hidden="true" />
            <span>
              <strong>{reminderSummary.dateBn}:</strong> {reminderSummary.holidayOrExamBanner}
            </span>
          </div>
        )}

        {/* Reminder Content */}
        {!reminderPrefs.enabled ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-center space-y-2">
            <p className="text-xs sm:text-sm text-slate-600">
              পাঠ পরিকল্পনা রিমাইন্ডার বর্তমানে বন্ধ আছে।
            </p>
            {onUpdateReminderPrefs && (
              <button
                type="button"
                onClick={() => onUpdateReminderPrefs({ ...reminderPrefs, enabled: true })}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800"
              >
                রিমাইন্ডার চালু করুন
              </button>
            )}
          </div>
        ) : selectedCount === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-center space-y-2">
            <p className="text-xs sm:text-sm text-slate-600">
              কোন শ্রেণির কোন বিষয়ের রিমাইন্ডার দেখতে চান তা এখনো নির্বাচন করা হয়নি।
            </p>
            <button
              type="button"
              onClick={() => setShowConfig(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800"
            >
              শ্রেণি ও বিষয় নির্বাচন করুন
            </button>
          </div>
        ) : reminderSummary.scheduledLessons.length > 0 ? (
          <div className="space-y-4">
            {configuredClasses.length > 1 && (
              <div className="flex flex-wrap items-center gap-1.5">
                {['সকল শ্রেণি', ...configuredClasses].map((cls) => (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => setReminderClassFilter(cls)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                      reminderClassFilter === cls
                        ? 'bg-[#0F2922] text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {cls}
                  </button>
                ))}
              </div>
            )}

            {groupedLessons.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
                {reminderClassFilter}-এর নির্বাচিত বিষয়ের জন্য এই তারিখে নির্ধারিত পাঠ নেই।
              </div>
            ) : (
              groupedLessons.map(([cls, classItems]) => (
                <div key={cls} className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5">
                    <h3 className="text-xs sm:text-sm font-bold text-emerald-900">
                      {cls} ({toBanglaDigit(classItems.length)}টি বিষয়)
                    </h3>
                    <span className="text-[11px] text-slate-500">
                      নির্বাচিত: {(reminderPrefs.selections[cls] || []).join(' · ')}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {classItems.map((item) => (
                      <article
                        key={item.id}
                        className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 flex flex-col justify-between gap-3 hover:border-emerald-600/60 hover:bg-emerald-50/20 transition-colors"
                      >
                        <button
                          type="button"
                          onClick={() => openGuideForReminder(item)}
                          className="w-full text-left space-y-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 rounded-lg"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                            <span className="font-bold text-emerald-900">
                              {item.subject}
                            </span>
                            <span className="font-semibold text-blue-700 tabular-nums">
                              {item.sessionLabel}
                            </span>
                          </div>

                          <div>
                            <h4 className="text-sm font-bold text-slate-900 leading-snug group-hover:text-emerald-800 transition-colors">
                              {item.chapterTitle || item.subject}
                            </h4>
                            <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                              {item.topicDetail}
                            </p>
                          </div>
                        </button>

                        <div className="pt-2.5 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
                          <div className="flex items-center gap-2.5 tabular-nums">
                            <span className="inline-flex items-center gap-1">
                              <BookOpen className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />
                              পৃষ্ঠা: {item.pageNumber || 'নির্ধারিত'}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
                              {toBanglaDigit(item.durationMinutes)} মিনিট
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openGuideForReminder(item)}
                              className="inline-flex items-center gap-1 rounded-lg bg-[#102A23] px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-900 transition-colors whitespace-nowrap"
                            >
                              <BookMarked className="h-3 w-3 text-amber-300" aria-hidden="true" />
                              <span>পাঠদান পদ্ধতি ও সহায়িকা</span>
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleOpenInLessonPlan(
                                  item.classLevel,
                                  item.subject,
                                  reminderSummary.resolvedIso
                                )
                              }
                              className="inline-flex items-center gap-0.5 font-semibold text-emerald-800 hover:underline whitespace-nowrap"
                            >
                              <span>বার্ষিক সারণি</span>
                              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          !reminderSummary.holidayOrExamBanner && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" aria-hidden="true" />
              <span>
                {reminderSummary.dateBn} ({reminderSummary.weekdayBn}) তারিখে আপনার নির্বাচিত
                বিষয়গুলোর নির্ধারিত সেশন নেই।
              </span>
            </div>
          )
        )}

        {reminderSummary.unscheduledRoutineSubjects.length > 0 && (
          <p className="text-[11px] text-slate-500 pt-1">
            {reminderSummary.weekdayBn}-এর রুটিন বহির্ভূত নির্বাচিত বিষয়:{' '}
            {reminderSummary.unscheduledRoutineSubjects
              .map((u) => `${u.classLevel} (${u.subject})`)
              .join(' · ')}
          </p>
        )}
      </section>

      {/* SECTION 2: Official Notices */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-bold text-slate-900">অফিসিয়াল নোটিশ বোর্ড</h2>
        <div className="flex flex-wrap gap-2">
          {['সকল', 'অফিসিয়াল নোটিশ', 'অ্যাপ আপডেট', 'প্রশিক্ষণ বিজ্ঞপ্তি'].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilterCat(cat)}
              className={`rounded-xl px-3.5 py-2 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 ${
                filterCat === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl bg-white border border-slate-200 p-8 text-center space-y-3">
          <p className="text-sm text-slate-500">
            এই বিভাগে বর্তমানে কোনো প্রকাশিত নোটিশ নেই।
          </p>
          <button
            type="button"
            onClick={() => onNavigate('admin_dashboard')}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
            <span>ড্যাশবোর্ড থেকে নতুন নোটিশ যোগ করুন</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((notice) => (
            <article
              key={notice.id}
              className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 shadow-xs space-y-2.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-blue-600" />
                  <span className="font-semibold text-blue-700">{notice.category}</span>
                  {notice.isImportant && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="font-semibold text-rose-600">গুরুত্বপূর্ণ</span>
                    </>
                  )}
                </div>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {notice.date}
                </span>
              </div>

              <h3 className="text-base sm:text-lg font-bold text-slate-900">{notice.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{notice.body}</p>
            </article>
          ))}
        </div>
      )}
      <TeacherGuideModal
        lesson={activeGuideLesson}
        onClose={() => setActiveGuideLesson(null)}
        onOpenInLessonPlan={(lesson) => {
          setActiveGuideLesson(null);
          handleOpenInLessonPlan(
            lesson.classLevel,
            lesson.subject,
            lesson.isoDate || reminderSummary.resolvedIso
          );
        }}
      />
    </PageShell>
  );
}
