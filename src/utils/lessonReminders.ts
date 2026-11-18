import {
  ANNUAL_PLAN_CLASSES,
  ANNUAL_PLAN_SUBJECTS_BY_CLASS,
  buildDateWiseSchedule,
  CalendarDayType,
  clampPlanYear,
  TermKey,
} from '../data/dateWiseAnnualPlans2026';

export const LESSON_REMINDER_PREFS_KEY = 'lesson_reminder_prefs_v1';
export const LAST_SEEN_REMINDER_DATE_KEY = 'last_seen_lesson_reminder_date_v1';
export const DATEWISE_LP_OVERRIDES_KEY = 'datewise_lp_overrides_v1';

export interface LessonReminderPrefs {
  enabled: boolean;
  /** Map of classLevel -> selected subject names */
  selections: Record<string, string[]>;
}

export interface DateRowOverrideLike {
  sessionLabel?: string;
  chapterTitle?: string;
  topicDetail?: string;
  pageNumber?: string;
  remark?: string;
}

export const DEFAULT_LESSON_REMINDER_PREFS: LessonReminderPrefs = {
  enabled: true,
  selections: {
    'প্রথম শ্রেণি': ['আমার বাংলা বই', 'English for Today', 'প্রাথমিক গণিত'],
  },
};

export interface LessonReminderEntry {
  id: string;
  classLevel: string;
  subject: string;
  isoDate: string;
  dateBn: string;
  weekdayBn: string;
  term: TermKey;
  dayType: CalendarDayType;
  isScheduledForSubject: boolean;
  sessionLabel: string;
  chapterTitle: string;
  topicDetail: string;
  pageNumber: string;
  durationMinutes: number;
}

export interface DateReminderSummary {
  isoDate: string;
  year: number;
  resolvedIso: string;
  /** Backwards-compatible alias for resolvedIso */
  resolvedIso2026: string;
  dateBn: string;
  weekdayBn: string;
  term: TermKey;
  dayType: CalendarDayType;
  holidayOrExamBanner: string | null;
  totalConfiguredSubjects: number;
  scheduledLessons: LessonReminderEntry[];
  unscheduledRoutineSubjects: LessonReminderEntry[];
}

export function getLocalIsoDate(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function resolveCalendarIso(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate.trim());
  if (!match) return getLocalIsoDate();
  const y = clampPlanYear(Number(match[1]));
  const mm = match[2];
  const isLeap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  const dd = mm === '02' && match[3] === '29' && !isLeap ? '28' : match[3];
  return `${y}-${mm}-${dd}`;
}

export function resolveCalendarIso2026(isoDate: string): string {
  return resolveCalendarIso(isoDate);
}

export function normalizeReminderPrefs(raw: unknown): LessonReminderPrefs {
  if (!raw || typeof raw !== 'object') {
    return DEFAULT_LESSON_REMINDER_PREFS;
  }
  const obj = raw as Partial<LessonReminderPrefs>;
  const enabled = typeof obj.enabled === 'boolean' ? obj.enabled : true;
  const selections: Record<string, string[]> = {};

  if (obj.selections && typeof obj.selections === 'object') {
    for (const cls of ANNUAL_PLAN_CLASSES) {
      const list = (obj.selections as Record<string, unknown>)[cls];
      if (Array.isArray(list)) {
        const validSubjects = ANNUAL_PLAN_SUBJECTS_BY_CLASS[cls] || [];
        const cleaned = Array.from(
          new Set(
            list.filter(
              (item): item is string => typeof item === 'string' && validSubjects.includes(item)
            )
          )
        );
        if (cleaned.length > 0) {
          selections[cls] = cleaned;
        }
      }
    }
  }

  return { enabled, selections };
}

export function countSelectedReminderSubjects(prefs: LessonReminderPrefs): number {
  return Object.values(prefs.selections).reduce((sum, list) => sum + list.length, 0);
}

export function getLessonRemindersForDate(
  isoDate: string,
  rawPrefs: LessonReminderPrefs,
  overrides: Record<string, DateRowOverrideLike> = {}
): DateReminderSummary {
  const prefs = normalizeReminderPrefs(rawPrefs);
  const resolvedIso = resolveCalendarIso(isoDate);
  const year = clampPlanYear(Number(resolvedIso.slice(0, 4)));

  const scheduledLessons: LessonReminderEntry[] = [];
  const unscheduledRoutineSubjects: LessonReminderEntry[] = [];

  let dateBn = '';
  let weekdayBn = '';
  let term: TermKey = '১ম প্রান্তিক';
  let dayType: CalendarDayType = 'teaching';
  let holidayOrExamBanner: string | null = null;
  let totalConfiguredSubjects = 0;

  // Inspect calendar metadata even if user has 0 subjects selected
  const fallbackMeta = buildDateWiseSchedule('প্রথম শ্রেণি', 'আমার বাংলা বই', year).rows.find(
    (r) => r.isoDate === resolvedIso
  );
  if (fallbackMeta) {
    dateBn = fallbackMeta.dateBn;
    weekdayBn = fallbackMeta.weekdayBn;
    term = fallbackMeta.term;
    dayType = fallbackMeta.dayType;
    if (
      fallbackMeta.dayType === 'weekly_holiday' ||
      fallbackMeta.dayType === 'govt_holiday' ||
      fallbackMeta.dayType === 'exam' ||
      fallbackMeta.dayType === 'survey_result'
    ) {
      holidayOrExamBanner =
        fallbackMeta.sessionLabel && fallbackMeta.dayType === 'exam'
          ? `${fallbackMeta.sessionLabel} — ${fallbackMeta.topicDetail}`
          : fallbackMeta.topicDetail;
    }
  }

  if (!prefs.enabled) {
    return {
      isoDate,
      year,
      resolvedIso,
      resolvedIso2026: resolvedIso,
      dateBn,
      weekdayBn,
      term,
      dayType,
      holidayOrExamBanner,
      totalConfiguredSubjects: 0,
      scheduledLessons: [],
      unscheduledRoutineSubjects: [],
    };
  }

  for (const classLevel of ANNUAL_PLAN_CLASSES) {
    const subjects = prefs.selections[classLevel] || [];
    for (const subject of subjects) {
      totalConfiguredSubjects += 1;
      const { syllabus, rows } = buildDateWiseSchedule(classLevel, subject, year);
      const row = rows.find((r) => r.isoDate === resolvedIso);
      if (!row) continue;

      const ov = overrides[row.id];
      const sessionLabel = ov?.sessionLabel ?? row.sessionLabel;
      const chapterTitle = ov?.chapterTitle ?? row.chapterTitle;
      const topicDetail = ov?.topicDetail ?? row.topicDetail;
      const pageNumber = ov?.pageNumber ?? row.pageNumber;

      const entry: LessonReminderEntry = {
        id: row.id,
        classLevel,
        subject,
        isoDate: resolvedIso,
        dateBn: row.dateBn,
        weekdayBn: row.weekdayBn,
        term: row.term,
        dayType: row.dayType,
        isScheduledForSubject: row.isScheduledForSubject,
        sessionLabel,
        chapterTitle,
        topicDetail,
        pageNumber,
        durationMinutes: syllabus?.durationMinutes || 40,
      };

      if (row.isScheduledForSubject) {
        scheduledLessons.push(entry);
      } else if (row.dayType === 'teaching' || row.dayType === 'preparatory') {
        unscheduledRoutineSubjects.push(entry);
      }
    }
  }

  return {
    isoDate,
    year,
    resolvedIso,
    resolvedIso2026: resolvedIso,
    dateBn,
    weekdayBn,
    term,
    dayType,
    holidayOrExamBanner,
    totalConfiguredSubjects,
    scheduledLessons,
    unscheduledRoutineSubjects,
  };
}
