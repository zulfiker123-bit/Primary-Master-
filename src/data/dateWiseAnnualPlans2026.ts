import { LessonPlanItem } from '../types';
import { toBanglaDigit } from '../utils/bangla';

export type TermKey = '১ম প্রান্তিক' | '২য় প্রান্তিক' | '৩য় প্রান্তিক';

export type CalendarDayType =
  | 'preparatory'
  | 'teaching'
  | 'exam'
  | 'survey_result'
  | 'weekly_holiday'
  | 'govt_holiday';

export interface CalendarDay2026 {
  sl: number;
  isoDate: string; // YYYY-MM-DD
  dateBn: string; // DD/MM/YYYY in Bangla digits
  monthIndex: number; // 0-11
  monthNameBn: string;
  monthShortLabel: string;
  weekdayIdx: number; // 0=Sun..6=Sat
  weekdayBn: string;
  term: TermKey;
  dayType: CalendarDayType;
  holidayOrActivity?: string;
}

export interface LessonUnitSpec {
  term: TermKey;
  chapter: string;
  title: string;
  pages: string;
  sessionsCount: number;
  subLessons?: string[];
}

export interface SubjectAnnualSyllabus {
  classLevel: string;
  subject: string;
  authorityNote: string;
  /** Weekdays when this subject is scheduled: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu */
  scheduledWeekdays: number[];
  durationMinutes: number;
  termBanners: Record<TermKey, string>;
  prepDescription: (dayOffset: number, dateIso: string) => { topic: string; pages: string };
  units: LessonUnitSpec[];
}

export interface DateWisePlanRow {
  id: string;
  sl: number;
  isoDate: string;
  dateBn: string;
  monthIndex: number;
  monthNameBn: string;
  monthShortLabel: string;
  weekdayIdx: number;
  weekdayBn: string;
  term: TermKey;
  dayType: CalendarDayType;
  isScheduledForSubject: boolean;
  sessionLabel: string; // e.g., "সেশন-১০" / "পিরিয়ড-১৪" / "প্রথম প্রান্তিক মূল্যায়ন" / ""
  chapterTitle: string;
  topicDetail: string;
  pageNumber: string;
  remark: string;
  monthTotalWorkingDays: number;
  monthTotalSubjectClasses: number;
  isFirstDayOfMonth: boolean;
  termBannerBefore?: string;
}

const MONTH_NAMES_BN = [
  'জানুয়ারি',
  'ফেব্রুয়ারি',
  'মার্চ',
  'এপ্রিল',
  'মে',
  'জুন',
  'জুলাই',
  'আগস্ট',
  'সেপ্টেম্বর',
  'অক্টোবর',
  'নভেম্বর',
  'ডিসেম্বর',
];

const WEEKDAYS_BN = [
  'রবিবার',
  'সোমবার',
  'মঙ্গলবার',
  'বুধবার',
  'বৃহস্পতিবার',
  'শুক্রবার',
  'শনিবার',
];

export const MONTHS_LIST_2026 = MONTH_NAMES_BN.map((name, idx) => ({
  index: idx,
  name,
  shortLabel: `${name}-২৬`,
}));

export const MIN_PLAN_YEAR = 2020;
export const MAX_PLAN_YEAR = 2050;
export const DEFAULT_PLAN_YEARS = Array.from({ length: 12 }, (_, i) => 2024 + i);

export function clampPlanYear(year: number): number {
  if (!Number.isFinite(year)) return 2026;
  return Math.min(MAX_PLAN_YEAR, Math.max(MIN_PLAN_YEAR, Math.trunc(year)));
}

export function getMonthsListForYear(year: number) {
  const safeYear = clampPlanYear(year);
  const shortYearBn = toBanglaDigit(String(safeYear).slice(-2));
  return MONTH_NAMES_BN.map((name, idx) => ({
    index: idx,
    name,
    shortLabel: `${name}-${shortYearBn}`,
  }));
}

// Official 2026 NAPE Primary School Holidays & Academic Events (YYYY-MM-DD)
const GOVT_HOLIDAYS_2026: Record<string, string> = {
  '2026-02-01': 'ছুটি: মাঘী পূর্ণিমা',
  '2026-02-04': 'ছুটি: শব-ই-বরাত',
  '2026-02-15': 'ছুটি: শ্রী শ্রী শিবরাত্রি ব্রত',
  '2026-03-03': 'ছুটি: শুভ দোলযাত্রা',
  '2026-04-05': 'ছুটি: ইস্টার সানডে',
  '2026-04-12': 'ছুটি: বৈসাবি উৎসব',
  '2026-04-13': 'ছুটি: চৈত্র সংক্রান্তি',
  '2026-04-14': 'ছুটি: বাংলা নববর্ষ',
  '2026-07-29': 'ছুটি: আষাঢ়ী পূর্ণিমা',
  '2026-08-05': 'ছুটি: জুলাই গণঅভ্যুত্থান দিবস',
  '2026-08-12': 'ছুটি: আখেরি চাহার সোম্বা',
  '2026-08-26': 'ছুটি: পবিত্র ঈদ-ই-মিলাদুন্নবী (সা.)',
  '2026-09-24': 'ছুটি: ফাতেহা-ই-ইয়াজদাহম',
  '2026-10-25': 'ছুটি: শ্রী শ্রী লক্ষ্মীপূজা ও প্রবারণা পূর্ণিমা (আশ্বিনী পূর্ণিমা)',
  '2026-11-08': 'ছুটি: শ্রী শ্রী শ্যামা পূজা',
  '2026-12-16': 'মহান বিজয় দিবস',
};

// Weekly holiday special observances falling on Fri/Sat
const WEEKLY_HOLIDAY_NOTES_2026: Record<string, string> = {
  '2026-01-17': 'সাপ্তাহিক ছুটি (শব-ই-মিরাজ)',
  '2026-02-21': 'সাপ্তাহিক ছুটি (শহিদ দিবস ও আন্তর্জাতিক মাতৃভাষা দিবস)',
  '2026-05-01': 'সাপ্তাহিক ছুটি (মে দিবস ও বুদ্ধ পূর্ণিমা)',
  '2026-06-26': 'সাপ্তাহিক ছুটি (পবিত্র আশুরা)',
  '2026-09-04': 'সাপ্তাহিক ছুটি (শুভ জন্মাষ্টমী)',
  '2026-09-26': 'সাপ্তাহিক ছুটি (মধু পূর্ণিমা / ভাদ্র পূর্ণিমা)',
  '2026-10-10': 'সাপ্তাহিক ছুটি (শুভ মহালয়া)',
};

const DATE_RANGE_EVENTS_2026: Array<{
  start: string;
  end: string;
  type: CalendarDayType;
  label: string;
}> = [
  {
    start: '2026-03-08',
    end: '2026-03-26',
    type: 'govt_holiday',
    label:
      'ছুটি: পবিত্র রমজান, স্বাধীনতা ও জাতীয় দিবস, শ্রী শ্রী হরিচাঁদ ঠাকুরের আবির্ভাব, শব-ই-কদর, জুমাতুল বিদা ও ঈদ-উল-ফিতর',
  },
  {
    start: '2026-05-24',
    end: '2026-06-04',
    type: 'govt_holiday',
    label: 'পবিত্র ঈদ-উল-আযহা ও গ্রীষ্মকালীন অবকাশ',
  },
  {
    start: '2026-10-18',
    end: '2026-10-22',
    type: 'govt_holiday',
    label: 'ছুটি: শারদীয় দুর্গাপূজা',
  },
  {
    start: '2026-12-20',
    end: '2026-12-29',
    type: 'govt_holiday',
    label: 'শীতকালীন অবকাশ ও যিশু খ্রিস্টের জন্মদিন (বড়দিন)',
  },
];

const EXAM_AND_RESULT_ACTIVITIES_2026: Record<
  string,
  { type: CalendarDayType; label: string }
> = {
  '2026-05-05': { type: 'exam', label: 'প্রথম প্রান্তিক মূল্যায়ন — পরীক্ষা' },
  '2026-05-06': { type: 'exam', label: 'প্রথম প্রান্তিক মূল্যায়ন — পরীক্ষা' },
  '2026-05-07': { type: 'exam', label: 'প্রথম প্রান্তিক মূল্যায়ন — পরীক্ষা' },
  '2026-05-10': { type: 'exam', label: 'প্রথম প্রান্তিক মূল্যায়ন — পরীক্ষা ও মৌখিক/ব্যবহারিক' },
  '2026-05-11': { type: 'exam', label: 'প্রথম প্রান্তিক মূল্যায়ন — পরীক্ষা ও মৌখিক/ব্যবহারিক' },
  '2026-05-12': { type: 'exam', label: 'প্রথম প্রান্তিক মূল্যায়ন — পরীক্ষা ও মৌখিক/ব্যবহারিক' },
  '2026-05-13': { type: 'exam', label: 'প্রথম প্রান্তিক মূল্যায়ন — পরীক্ষা ও মৌখিক/ব্যবহারিক' },
  '2026-05-14': { type: 'exam', label: 'প্রথম প্রান্তিক মূল্যায়ন — পরীক্ষা ও মৌখিক/ব্যবহারিক' },

  '2026-08-17': { type: 'exam', label: 'দ্বিতীয় প্রান্তিক মূল্যায়ন — পরীক্ষা' },
  '2026-08-18': { type: 'exam', label: 'দ্বিতীয় প্রান্তিক মূল্যায়ন — পরীক্ষা' },
  '2026-08-19': { type: 'exam', label: 'দ্বিতীয় প্রান্তিক মূল্যায়ন — পরীক্ষা' },
  '2026-08-20': { type: 'exam', label: 'দ্বিতীয় প্রান্তিক মূল্যায়ন — পরীক্ষা' },
  '2026-08-23': { type: 'exam', label: 'দ্বিতীয় প্রান্তিক মূল্যায়ন — পরীক্ষা' },
  '2026-08-24': { type: 'exam', label: 'দ্বিতীয় প্রান্তিক মূল্যায়ন — পরীক্ষা' },
  '2026-08-25': { type: 'exam', label: 'দ্বিতীয় প্রান্তিক মূল্যায়ন — পরীক্ষা ও মৌখিক/ব্যবহারিক' },
  '2026-08-27': { type: 'exam', label: 'দ্বিতীয় প্রান্তিক মূল্যায়ন — পরীক্ষা ও মৌখিক/ব্যবহারিক' },

  '2026-12-01': { type: 'exam', label: 'তৃতীয় প্রান্তিক মূল্যায়ন — পরীক্ষা' },
  '2026-12-02': { type: 'exam', label: 'তৃতীয় প্রান্তিক মূল্যায়ন — পরীক্ষা' },
  '2026-12-03': { type: 'exam', label: 'তৃতীয় প্রান্তিক মূল্যায়ন — পরীক্ষা' },
  '2026-12-06': { type: 'exam', label: 'তৃতীয় প্রান্তিক মূল্যায়ন — পরীক্ষা' },
  '2026-12-07': { type: 'exam', label: 'তৃতীয় প্রান্তিক মূল্যায়ন — পরীক্ষা' },
  '2026-12-08': { type: 'exam', label: 'তৃতীয় প্রান্তিক মূল্যায়ন — পরীক্ষা' },
  '2026-12-09': { type: 'exam', label: 'তৃতীয় প্রান্তিক মূল্যায়ন — পরীক্ষা ও মৌখিক/ব্যবহারিক' },
  '2026-12-10': { type: 'exam', label: 'তৃতীয় প্রান্তিক মূল্যায়ন — পরীক্ষা ও মৌখিক/ব্যবহারিক' },

  '2026-12-13': { type: 'survey_result', label: 'শিশু জরিপ কার্যক্রম' },
  '2026-12-14': { type: 'survey_result', label: 'ফলাফল প্রস্তুত' },
  '2026-12-15': { type: 'survey_result', label: 'ফলাফল প্রস্তুত' },
  '2026-12-17': { type: 'survey_result', label: 'ফলাফল প্রস্তুত' },
  '2026-12-30': { type: 'survey_result', label: 'ফলাফল ও রিপোর্ট কার্ড প্রস্তুত' },
  '2026-12-31': { type: 'survey_result', label: 'ফলাফল প্রকাশ ও রেজাল্ট কার্ড প্রদান' },
};

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function formatUtcIso(dt: Date): string {
  return `${dt.getUTCFullYear()}-${pad2(dt.getUTCMonth() + 1)}-${pad2(dt.getUTCDate())}`;
}

function formatIsoShortBn(isoDate: string): string {
  const [, mm, dd] = isoDate.split('-');
  const monthIdx = Math.max(0, Math.min(11, Number(mm) - 1));
  return `${toBanglaDigit(dd)} ${MONTH_NAMES_BN[monthIdx]}`;
}

function shiftDateInYear(baseIso2026: string, deltaDays: number, targetYear: number): string {
  const [y, m, d] = baseIso2026.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + deltaDays));
  // Ensure shifted date falls within targetYear bounds when projecting nearby lunar cycles
  if (dt.getUTCFullYear() < targetYear) {
    dt.setUTCFullYear(targetYear);
  } else if (dt.getUTCFullYear() > targetYear) {
    dt.setUTCFullYear(targetYear);
  }
  return formatUtcIso(dt);
}

interface YearCalendarMeta {
  year: number;
  days: CalendarDay2026[];
  totalWorkingDays: number;
  term1EndIso: string;
  term2StartIso: string;
  term2EndIso: string;
  term3StartIso: string;
}

const yearCalendarCache = new Map<number, YearCalendarMeta>();

function buildNon2026HolidayAndEventMaps(year: number): {
  govtHolidays: Record<string, string>;
  weeklyNotes: Record<string, string>;
  rangeEvents: Array<{ start: string; end: string; type: CalendarDayType; label: string }>;
} {
  const govtHolidays: Record<string, string> = {};
  const weeklyNotes: Record<string, string> = {};

  // Fixed national & cultural annual dates (MM-DD)
  const fixedHolidays: Array<{ mmdd: string; label: string }> = [
    { mmdd: '02-21', label: 'শহিদ দিবস ও আন্তর্জাতিক মাতৃভাষা দিবস' },
    { mmdd: '03-26', label: 'মহান স্বাধীনতা ও জাতীয় দিবস' },
    { mmdd: '04-13', label: 'ছুটি: চৈত্র সংক্রান্তি' },
    { mmdd: '04-14', label: 'ছুটি: বাংলা নববর্ষ' },
    { mmdd: '05-01', label: 'মহান মে দিবস' },
    { mmdd: '08-05', label: 'জুলাই গণঅভ্যুত্থান দিবস' },
    { mmdd: '12-16', label: 'মহান বিজয় দিবস' },
  ];

  for (const item of fixedHolidays) {
    const iso = `${year}-${item.mmdd}`;
    const dt = new Date(`${iso}T00:00:00Z`);
    const wd = dt.getUTCDay();
    if (wd === 5 || wd === 6) {
      weeklyNotes[iso] = `সাপ্তাহিক ছুটি (${item.label.replace(/^ছুটি:\s*/, '')})`;
    } else {
      govtHolidays[iso] = item.label.startsWith('ছুটি:') ? item.label : `ছুটি: ${item.label}`;
    }
  }

  // Lunar/religious holidays & vacations (exact/projected per year from 2026 NAPE anchors)
  const deltaDays = Math.round((year - 2026) * -10.875);

  const YEAR_SPECIFIC_RANGES: Record<
    number,
    Array<{ start: string; end: string; type: CalendarDayType; label: string }>
  > = {
    2025: [
      {
        start: '2025-03-02',
        end: '2025-04-03',
        type: 'govt_holiday',
        label: 'ছুটি: পবিত্র রমজান, শব-ই-কদর, স্বাধীনতা দিবস ও ঈদ-উল-ফিতর',
      },
      {
        start: '2025-06-01',
        end: '2025-06-15',
        type: 'govt_holiday',
        label: 'পবিত্র ঈদ-উল-আযহা ও গ্রীষ্মকালীন অবকাশ',
      },
      {
        start: '2025-09-28',
        end: '2025-10-03',
        type: 'govt_holiday',
        label: 'ছুটি: শারদীয় দুর্গাপূজা',
      },
    ],
    2027: [
      {
        start: '2027-02-26',
        end: '2027-03-14',
        type: 'govt_holiday',
        label: 'ছুটি: পবিত্র রমজান, শব-ই-কদর, জুমাতুল বিদা ও ঈদ-উল-ফিতর (সম্ভাব্য)',
      },
      {
        start: '2027-05-13',
        end: '2027-05-25',
        type: 'govt_holiday',
        label: 'পবিত্র ঈদ-উল-আযহা ও গ্রীষ্মকালীন অবকাশ (সম্ভাব্য)',
      },
      {
        start: '2027-10-07',
        end: '2027-10-11',
        type: 'govt_holiday',
        label: 'ছুটি: শারদীয় দুর্গাপূজা',
      },
    ],
  };

  const rangeEvents: Array<{ start: string; end: string; type: CalendarDayType; label: string }> =
    YEAR_SPECIFIC_RANGES[year]
      ? [...YEAR_SPECIFIC_RANGES[year]]
      : [
          {
            start: shiftDateInYear('2026-03-08', deltaDays, year),
            end: shiftDateInYear('2026-03-26', deltaDays, year),
            type: 'govt_holiday',
            label: 'ছুটি: পবিত্র রমজান, শব-ই-কদর ও ঈদ-উল-ফিতর (চাঁদ দেখা সাপেক্ষে সমন্বয়যোগ্য)',
          },
          {
            start: shiftDateInYear('2026-05-24', deltaDays, year),
            end: shiftDateInYear('2026-06-04', deltaDays, year),
            type: 'govt_holiday',
            label: 'পবিত্র ঈদ-উল-আযহা ও গ্রীষ্মকালীন অবকাশ (সমন্বয়যোগ্য)',
          },
          {
            start: shiftDateInYear('2026-10-18', (year - 2026) % 3 === 0 ? -11 : 10, year),
            end: shiftDateInYear('2026-10-22', (year - 2026) % 3 === 0 ? -11 : 10, year),
            type: 'govt_holiday',
            label: 'ছুটি: শারদীয় দুর্গাপূজা (সরকারি ছুটি অনুযায়ী সমন্বয়যোগ্য)',
          },
        ];

  // Always include fixed winter vacation (Dec 20 – Dec 29)
  rangeEvents.push({
    start: `${year}-12-20`,
    end: `${year}-12-29`,
    type: 'govt_holiday',
    label: 'শীতকালীন অবকাশ ও যিশু খ্রিস্টের জন্মদিন (বড়দিন)',
  });

  // Projected single-day religious holidays (Shab-e-Barat, Buddha Purnima, Eid-e-Miladunnabi)
  const lunarSingles = [
    { base: '2026-02-04', label: 'ছুটি: শব-ই-বরাত (চাঁদ দেখা সাপেক্ষে)' },
    { base: '2026-05-01', label: 'ছুটি: বুদ্ধ পূর্ণিমা' },
    { base: '2026-08-26', label: 'ছুটি: পবিত্র ঈদ-ই-মিলাদুন্নবী (সা.) (চাঁদ দেখা সাপেক্ষে)' },
  ];
  for (const ls of lunarSingles) {
    const shifted = shiftDateInYear(ls.base, deltaDays, year);
    const dt = new Date(`${shifted}T00:00:00Z`);
    const wd = dt.getUTCDay();
    if (wd !== 5 && wd !== 6 && !govtHolidays[shifted]) {
      govtHolidays[shifted] = ls.label;
    }
  }

  return { govtHolidays, weeklyNotes, rangeEvents };
}

function buildCalendarMetaForYear(rawYear: number): YearCalendarMeta {
  const year = clampPlanYear(rawYear);
  const cached = yearCalendarCache.get(year);
  if (cached) return cached;

  const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const totalDays = isLeap ? 366 : 365;
  const shortYearBn = toBanglaDigit(String(year).slice(-2));
  const start = new Date(Date.UTC(year, 0, 1));

  if (year === 2026) {
    const days: CalendarDay2026[] = [];
    for (let i = 0; i < 365; i++) {
      const dt = new Date(start.getTime() + i * 86400000);
      const y = dt.getUTCFullYear();
      const m = dt.getUTCMonth();
      const d = dt.getUTCDate();
      const weekdayIdx = dt.getUTCDay();
      const isoDate = `${y}-${pad2(m + 1)}-${pad2(d)}`;
      const dateBn = `${toBanglaDigit(pad2(d))}/${toBanglaDigit(pad2(m + 1))}/${toBanglaDigit(y)}`;
      const monthNameBn = MONTH_NAMES_BN[m];
      const monthShortLabel = `${monthNameBn}-২৬`;
      const weekdayBn = WEEKDAYS_BN[weekdayIdx];
      const term: TermKey =
        isoDate <= '2026-05-16'
          ? '১ম প্রান্তিক'
          : isoDate <= '2026-08-29'
          ? '২য় প্রান্তিক'
          : '৩য় প্রান্তিক';

      let dayType: CalendarDayType = 'teaching';
      let holidayOrActivity: string | undefined;

      const isFriSat = weekdayIdx === 5 || weekdayIdx === 6;
      const rangeMatch = DATE_RANGE_EVENTS_2026.find(
        (r) => isoDate >= r.start && isoDate <= r.end
      );

      if (rangeMatch) {
        dayType = rangeMatch.type;
        holidayOrActivity = isFriSat ? `${rangeMatch.label} (সাপ্তাহিক ছুটি)` : rangeMatch.label;
      } else if (isFriSat) {
        dayType = 'weekly_holiday';
        holidayOrActivity = WEEKLY_HOLIDAY_NOTES_2026[isoDate] || 'সাপ্তাহিক ছুটি';
      } else if (GOVT_HOLIDAYS_2026[isoDate]) {
        dayType = 'govt_holiday';
        holidayOrActivity = GOVT_HOLIDAYS_2026[isoDate];
      } else if (EXAM_AND_RESULT_ACTIVITIES_2026[isoDate]) {
        dayType = EXAM_AND_RESULT_ACTIVITIES_2026[isoDate].type;
        holidayOrActivity = EXAM_AND_RESULT_ACTIVITIES_2026[isoDate].label;
      } else if (isoDate <= '2026-01-13') {
        dayType = 'preparatory';
      }

      days.push({
        sl: i + 1,
        isoDate,
        dateBn,
        monthIndex: m,
        monthNameBn,
        monthShortLabel,
        weekdayIdx,
        weekdayBn,
        term,
        dayType,
        holidayOrActivity,
      });
    }

    const totalWorkingDays = days.filter(
      (d) =>
        d.dayType === 'preparatory' ||
        d.dayType === 'teaching' ||
        d.dayType === 'exam' ||
        d.dayType === 'survey_result'
    ).length;

    const meta: YearCalendarMeta = {
      year: 2026,
      days,
      totalWorkingDays,
      term1EndIso: '2026-05-16',
      term2StartIso: '2026-05-17',
      term2EndIso: '2026-08-29',
      term3StartIso: '2026-08-30',
    };
    yearCalendarCache.set(2026, meta);
    return meta;
  }

  // Dynamic calendar build for any other year (year !== 2026)
  const { govtHolidays, weeklyNotes, rangeEvents } = buildNon2026HolidayAndEventMaps(year);

  interface DraftDay {
    sl: number;
    isoDate: string;
    dateBn: string;
    monthIndex: number;
    monthNameBn: string;
    monthShortLabel: string;
    weekdayIdx: number;
    weekdayBn: string;
    dayType: CalendarDayType;
    holidayOrActivity?: string;
  }

  const drafts: DraftDay[] = [];
  for (let i = 0; i < totalDays; i++) {
    const dt = new Date(start.getTime() + i * 86400000);
    const y = dt.getUTCFullYear();
    const m = dt.getUTCMonth();
    const d = dt.getUTCDate();
    const weekdayIdx = dt.getUTCDay();
    const isoDate = `${y}-${pad2(m + 1)}-${pad2(d)}`;
    const dateBn = `${toBanglaDigit(pad2(d))}/${toBanglaDigit(pad2(m + 1))}/${toBanglaDigit(y)}`;
    const monthNameBn = MONTH_NAMES_BN[m];
    const monthShortLabel = `${monthNameBn}-${shortYearBn}`;
    const weekdayBn = WEEKDAYS_BN[weekdayIdx];
    const isFriSat = weekdayIdx === 5 || weekdayIdx === 6;

    let dayType: CalendarDayType = 'teaching';
    let holidayOrActivity: string | undefined;

    const rangeMatch = rangeEvents.find((r) => isoDate >= r.start && isoDate <= r.end);
    if (rangeMatch) {
      dayType = rangeMatch.type;
      holidayOrActivity = isFriSat ? `${rangeMatch.label} (সাপ্তাহিক ছুটি)` : rangeMatch.label;
    } else if (isFriSat) {
      dayType = 'weekly_holiday';
      holidayOrActivity = weeklyNotes[isoDate] || 'সাপ্তাহিক ছুটি';
    } else if (govtHolidays[isoDate]) {
      dayType = 'govt_holiday';
      holidayOrActivity = govtHolidays[isoDate];
    } else if (isoDate <= `${year}-01-13`) {
      dayType = 'preparatory';
    }

    drafts.push({
      sl: i + 1,
      isoDate,
      dateBn,
      monthIndex: m,
      monthNameBn,
      monthShortLabel,
      weekdayIdx,
      weekdayBn,
      dayType,
      holidayOrActivity,
    });
  }

  // Assign 8 working days each for Term 1 (May), Term 2 (Aug), and Term 3 (Dec) assessments
  const assignExamWindow = (
    startFromIso: string,
    count: number,
    baseLabel: string
  ): string => {
    let assigned = 0;
    let lastExamIso = startFromIso;
    for (const d of drafts) {
      if (d.isoDate < startFromIso) continue;
      if (d.dayType === 'teaching') {
        assigned += 1;
        d.dayType = 'exam';
        d.holidayOrActivity =
          assigned >= count - 2 ? `${baseLabel} — পরীক্ষা ও মৌখিক/ব্যবহারিক` : `${baseLabel} — পরীক্ষা`;
        lastExamIso = d.isoDate;
        if (assigned >= count) break;
      }
    }
    return lastExamIso;
  };

  const exam1EndIso = assignExamWindow(`${year}-05-03`, 8, 'প্রথম প্রান্তিক মূল্যায়ন');
  const exam2EndIso = assignExamWindow(`${year}-08-16`, 8, 'দ্বিতীয় প্রান্তিক মূল্যায়ন');
  const exam3EndIso = assignExamWindow(`${year}-12-01`, 8, 'তৃতীয় প্রান্তিক মূল্যায়ন');

  // Survey & result preparation days after Term 3 exam (up to Dec 19, plus Dec 30-31)
  let assignedSurvey = false;
  for (const d of drafts) {
    if (d.dayType === 'teaching' && d.isoDate > exam3EndIso && d.isoDate <= `${year}-12-19`) {
      d.dayType = 'survey_result';
      if (!assignedSurvey) {
        d.holidayOrActivity = 'শিশু জরিপ কার্যক্রম';
        assignedSurvey = true;
      } else {
        d.holidayOrActivity = 'ফলাফল প্রস্তুত';
      }
    } else if (d.dayType === 'teaching' && (d.isoDate === `${year}-12-30` || d.isoDate === `${year}-12-31`)) {
      d.dayType = 'survey_result';
      d.holidayOrActivity =
        d.isoDate === `${year}-12-31`
          ? 'ফলাফল প্রকাশ ও রেজাল্ট কার্ড প্রদান'
          : 'ফলাফল ও রিপোর্ট কার্ড প্রস্তুত';
    }
  }

  // Compute Term boundaries right after Exam 1 & Exam 2 (including trailing weekend if exam ends Thu)
  const computeTermBoundary = (examEndIso: string): { endIso: string; nextStartIso: string } => {
    const idx = drafts.findIndex((d) => d.isoDate === examEndIso);
    if (idx < 0) return { endIso: examEndIso, nextStartIso: examEndIso };
    let endIdx = idx;
    while (endIdx + 1 < drafts.length && drafts[endIdx + 1].dayType === 'weekly_holiday') {
      endIdx += 1;
    }
    const nextIdx = Math.min(drafts.length - 1, endIdx + 1);
    return {
      endIso: drafts[endIdx].isoDate,
      nextStartIso: drafts[nextIdx].isoDate,
    };
  };

  const t1 = computeTermBoundary(exam1EndIso);
  const t2 = computeTermBoundary(exam2EndIso);

  const days: CalendarDay2026[] = drafts.map((d) => ({
    ...d,
    term:
      d.isoDate <= t1.endIso
        ? '১ম প্রান্তিক'
        : d.isoDate <= t2.endIso
        ? '২য় প্রান্তিক'
        : '৩য় প্রান্তিক',
  }));

  const totalWorkingDays = days.filter(
    (d) =>
      d.dayType === 'preparatory' ||
      d.dayType === 'teaching' ||
      d.dayType === 'exam' ||
      d.dayType === 'survey_result'
  ).length;

  const meta: YearCalendarMeta = {
    year,
    days,
    totalWorkingDays,
    term1EndIso: t1.endIso,
    term2StartIso: t1.nextStartIso,
    term2EndIso: t2.endIso,
    term3StartIso: t2.nextStartIso,
  };
  yearCalendarCache.set(year, meta);
  return meta;
}

export function buildCalendarForYear(year: number): CalendarDay2026[] {
  return buildCalendarMetaForYear(year).days;
}

export const CALENDAR_2026_DAYS: CalendarDay2026[] = buildCalendarMetaForYear(2026).days;

export const ANNUAL_PLAN_CLASSES = [
  'প্রথম শ্রেণি',
  'দ্বিতীয় শ্রেণি',
  'তৃতীয় শ্রেণি',
  'চতুর্থ শ্রেণি',
  'পঞ্চম শ্রেণি',
  'প্রাক-প্রাথমিক',
] as const;

export const ANNUAL_PLAN_SUBJECTS_BY_CLASS: Record<string, string[]> = {
  'প্রথম শ্রেণি': [
    'আমার বাংলা বই',
    'English for Today',
    'প্রাথমিক গণিত',
    'সামাজিক বিজ্ঞান ও প্রাথমিক বিজ্ঞান (সমন্বিত)',
    'ইসলাম শিক্ষা',
    'হিন্দুধর্ম শিক্ষা',
    'বৌদ্ধধর্ম শিক্ষা',
    'খ্রিষ্টধর্ম শিক্ষা',
    'শারীরিক ও মানসিক স্বাস্থ্য শিক্ষা',
    'শিল্পকলা',
  ],
  'দ্বিতীয় শ্রেণি': [
    'আমার বাংলা বই',
    'English for Today',
    'প্রাথমিক গণিত',
    'সামাজিক বিজ্ঞান ও প্রাথমিক বিজ্ঞান (সমন্বিত)',
    'ইসলাম শিক্ষা',
    'হিন্দুধর্ম শিক্ষা',
    'বৌদ্ধধর্ম শিক্ষা',
    'খ্রিষ্টধর্ম শিক্ষা',
    'শারীরিক ও মানসিক স্বাস্থ্য শিক্ষা',
    'শিল্পকলা',
  ],
  'তৃতীয় শ্রেণি': [
    'আমার বাংলা বই',
    'English for Today',
    'প্রাথমিক গণিত',
    'প্রাথমিক বিজ্ঞান',
    'বাংলাদেশ ও বিশ্বপরিচয়',
    'ইসলাম শিক্ষা',
    'হিন্দুধর্ম শিক্ষা',
    'বৌদ্ধধর্ম শিক্ষা',
    'খ্রিষ্টধর্ম শিক্ষা',
    'শারীরিক ও মানসিক স্বাস্থ্য শিক্ষা',
    'শিল্পকলা',
  ],
  'চতুর্থ শ্রেণি': [
    'আমার বাংলা বই',
    'English for Today',
    'প্রাথমিক গণিত',
    'প্রাথমিক বিজ্ঞান',
    'বাংলাদেশ ও বিশ্বপরিচয়',
    'ইসলাম শিক্ষা',
    'হিন্দুধর্ম শিক্ষা',
    'বৌদ্ধধর্ম শিক্ষা',
    'খ্রিষ্টধর্ম শিক্ষা',
    'শারীরিক ও মানসিক স্বাস্থ্য শিক্ষা',
    'শিল্পকলা',
  ],
  'পঞ্চম শ্রেণি': [
    'আমার বাংলা বই',
    'English for Today',
    'প্রাথমিক গণিত',
    'প্রাথমিক বিজ্ঞান',
    'বাংলাদেশ ও বিশ্বপরিচয়',
    'ইসলাম শিক্ষা',
    'হিন্দুধর্ম শিক্ষা',
    'বৌদ্ধধর্ম শিক্ষা',
    'খ্রিষ্টধর্ম শিক্ষা',
    'শারীরিক ও মানসিক স্বাস্থ্য শিক্ষা',
    'শিল্পকলা',
  ],
  'প্রাক-প্রাথমিক': [
    'আমার বই',
    'এসো লিখতে শিখি (অনুশীলন খাতা)',
    'ছড়া, গল্প ও খেলা নির্দেশিকা',
  ],
};

const DEFAULT_TERM_BANNERS = (p1: string, p2: string, p3: string): Record<TermKey, string> => ({
  '১ম প্রান্তিক': `প্রথম প্রান্তিক মূল্যায়নের সিলেবাস: ${p1}। ০১ জানুয়ারি থেকে ০৪ মে ২০২৬ তারিখের মধ্যে সম্পন্ন করতে হবে।`,
  '২য় প্রান্তিক': `দ্বিতীয় প্রান্তিক মূল্যায়নের সিলেবাস: ${p2}। ১৭ মে থেকে ১৬ আগস্ট ২০২৬ তারিখের মধ্যে সম্পন্ন করতে হবে।`,
  '৩য় প্রান্তিক': `তৃতীয় প্রান্তিক মূল্যায়নের সিলেবাস: ${p3}। ৩০ আগস্ট থেকে ৩০ নভেম্বর ২০২৬ তারিখের মধ্যে সম্পন্ন করতে হবে।`,
});

const COMMON_PREP_BN = (idx: number, _iso: string): { topic: string; pages: string } => {
  if (idx === 0) {
    return {
      topic: 'পাঠ্যবই বিতরণ কার্যক্রম এবং শিক্ষার্থীদের সাথে শুভেচ্ছা বিনিময় ও পরিচয় পর্ব',
      pages: '০০',
    };
  }
  const steps = [
    { topic: 'প্রাক-পঠন ও পূর্বজ্ঞান যাচাই (ছবি ও কথোপকথন)', pages: '০০' },
    { topic: 'প্রাক-পঠন: প্রমিত উচ্চারণ ও শ্রবণ অনুশীলন', pages: '০০' },
    { topic: 'প্রাক-পঠন: পরিচিত শব্দ ও ধ্বনি সচেতনতা', pages: '০০' },
    { topic: 'প্রাক-পঠন ও লেখন দক্ষতা উন্নয়ন অনুশীলন', pages: '০০' },
    { topic: 'বর্ণ ও শব্দ জ্ঞান যাচাই (FLN ভিত্তিমূলক পাঠ)', pages: '০০' },
    { topic: 'বর্ণ অনুশীলন ও সুন্দর হাতের লেখার প্রস্তুতি', pages: '০০' },
    { topic: 'শ্রেণিভিত্তিক পাঠ্যবইয়ের অধ্যায় ও সূচিপত্র পরিচিতি', pages: '০০' },
    { topic: 'পঠন ও লিখন প্রস্তুতি মূল্যায়ন ও ফলাবর্তন', pages: '০০' },
  ];
  return steps[(idx - 1) % steps.length] || steps[0];
};

const COMMON_PREP_EN = (idx: number, _iso: string): { topic: string; pages: string } => {
  if (idx === 0) {
    return {
      topic: 'Book Distribution & Greetings (পাঠ্যবই বিতরণ ও শুভেচ্ছা বিনিময়)',
      pages: '00',
    };
  }
  const steps = [
    { topic: 'Preparatory Lesson: Greetings, Classroom Commands & Alphabet Review', pages: '00' },
    { topic: 'Preparatory Lesson: Phonics & Oral Fluency Practice', pages: '00' },
    { topic: 'Preparatory Lesson: Basic Vocabulary & Picture Naming', pages: '00' },
    { topic: 'Preparatory Lesson: Pre-Reading & Listening Comprehension', pages: '00' },
    { topic: 'Preparatory Lesson: Handwriting Readiness & Alphabet Matching', pages: '00' },
    { topic: 'Preparatory Lesson: Introduction to New English for Today Textbook', pages: '00' },
  ];
  return steps[(idx - 1) % steps.length] || steps[0];
};

const COMMON_PREP_MATH = (idx: number, _iso: string): { topic: string; pages: string } => {
  if (idx === 0) {
    return {
      topic: 'পাঠ্যবই বিতরণ কার্যক্রম এবং শিক্ষার্থীদের সাথে শুভেচ্ছা বিনিময় ও পরিচয় পর্ব',
      pages: '০০',
    };
  }
  const steps = [
    { topic: 'প্রস্তুতিমূলক পাঠ: পূর্বশ্রেণির সংখ্যাবোধ ও গণনা যাচাই', pages: '০০' },
    { topic: 'প্রস্তুতিমূলক পাঠ: সংখ্যার তুলনা (কম-বেশি, ছোট-বড়)', pages: '০০' },
    { topic: 'প্রস্তুতিমূলক পাঠ: যোগ-বিয়োগের প্রাথমিক ধারণা পুনরালোচনা', pages: '০০' },
    { topic: 'প্রস্তুতিমূলক পাঠ: সংখ্যা লিখন ও স্থানীয় মান প্রস্তুতি', pages: '০০' },
    { topic: 'প্রস্তুতিমূলক পাঠ: জ্যামিতিক আকৃতি ও বিন্যাস পরিচিতি', pages: '০০' },
    { topic: 'প্রস্তুতিমূলক পাঠ: প্রাথমিক গণিত পাঠ্যবই পরিচিতি', pages: '০০' },
  ];
  return steps[(idx - 1) % steps.length] || steps[0];
};

const COMMON_PREP_GENERAL = (subject: string) => (idx: number, _iso: string) =>
  idx === 0
    ? {
        topic: 'পাঠ্যবই বিতরণ কার্যক্রম এবং শিক্ষার্থীদের সাথে শুভেচ্ছা বিনিময় ও পরিচয় পর্ব',
        pages: '০০',
      }
    : {
        topic: `প্রস্তুতিমূলক বা পূর্ব ক্লাসের ${subject} বিষয়ক অভিজ্ঞতা বিনিময় ও বই পরিচিতি`,
        pages: '০০',
      };

export const ANNUAL_SUBJECT_SYLLABI_2026: SubjectAnnualSyllabus[] = [
  // ==================== ১ম শ্রেণি ====================
  {
    classLevel: 'প্রথম শ্রেণি',
    subject: 'আমার বাংলা বই',
    authorityNote: 'জাতীয় প্রাথমিক শিক্ষা একাডেমি (নেপ), ময়মনসিংহ — ২০২৬',
    scheduledWeekdays: [0, 1, 2, 3, 4],
    durationMinutes: 40,
    termBanners: DEFAULT_TERM_BANNERS(
      'পাঠ্যপুস্তকের ০১ থেকে ৩১ পৃষ্ঠা পর্যন্ত (পাঠ ১–২২)',
      'পাঠ্যপুস্তকের ৩২ থেকে ৫৪ পৃষ্ঠা পর্যন্ত (পাঠ ২৩–৩৮)',
      'পাঠ্যপুস্তকের ৫৫ থেকে ৭৯ পৃষ্ঠা (সমাপ্তি, পাঠ ৩৯–৫৪)'
    ),
    prepDescription: COMMON_PREP_BN,
    units: [
      // ১ম প্রান্তিক (approx 56 teaching days)
      { term: '১ম প্রান্তিক', chapter: 'পাঠ ১–২: আমার পরিচয় ও এসো রং করি', title: 'টিজি পিরিয়ড ১–৩: আমার পরিচয়, পতাকা ও শাপলা ফুল রং করি', pages: '১–২', sessionsCount: 3 },
      { term: '১ম প্রান্তিক', chapter: 'পাঠ ৩–৪: আমি ও আমার বিদ্যালয়, আমার সহপাঠীরা', title: 'টিজি পিরিয়ড ৪–৭: বিদ্যালয় পরিচিতি ও সহপাঠীদের সাথে কথা বলি', pages: '৩–৫', sessionsCount: 4 },
      { term: '১ম প্রান্তিক', chapter: 'পাঠ ৫–৭: আঁকাআঁকি ও আমরা কী কী করি', title: 'টিজি পিরিয়ড ৮–১২: যেমন ইচ্ছে দাগ, প্রয়োজনীয় রেখা ও নির্দেশিত আঁকাআঁকি', pages: '৬–১০', sessionsCount: 5 },
      { term: '১ম প্রান্তিক', chapter: 'পাঠ ৮–৯: ছড়া ও বাঘ ও রাখাল গল্প', title: 'টিজি পিরিয়ড ১৩–১৮: ছড়া অনুশীলন, ছবি দেখি নাম বলি ও গল্পাভিনয়', pages: '১১–১৪', sessionsCount: 7 },
      { term: '১ম প্রান্তিক', chapter: 'পাঠ ১০–১৫: বর্ণ শিখি (স্বরবর্ণ অ–ঔ)', title: 'টিজি পিরিয়ড ১৯–৩০: অ-আ, ই-ঈ, উ-ঊ, ঋ, এ-ঐ, ও-ঔ শোনা, বলা, পড়া ও লেখা', pages: '১৫–২২', sessionsCount: 14 },
      { term: '১ম প্রান্তিক', chapter: 'পাঠ ১৬–১৮: স্বরবর্ণ অনুশীলন, ইতল বিতল ও কারচিহ্ন দেখি', title: 'টিজি পিরিয়ড ৩১–৩৪: স্বরবর্ণ খুঁজে বের করি, ছড়া ও কারচিহ্নের সাথে পরিচয়', pages: '২২–২৫', sessionsCount: 5 },
      { term: '১ম প্রান্তিক', chapter: 'পাঠ ১৯–২০: বর্ণ শিখি (ক–ঙ, চ–ঞ)', title: 'টিজি পিরিয়ড ৩৫–৪৪: ক, খ, গ, ঘ, ঙ এবং চ, ছ, জ, ঝ, ঞ শোনা, পড়া ও লেখা', pages: '২৬–২৯', sessionsCount: 11 },
      { term: '১ম প্রান্তিক', chapter: 'পাঠ ২১–২২: আ-কার, ই-কার, ঈ-কার শিখি ও পুনরালোচনা', title: 'টিজি পিরিয়ড ৪৫–৪৬: কারচিহ্ন যোগে শব্দ গঠন ও ১ম প্রান্তিক মূল্যায়ন প্রস্তুতি', pages: '৩০–৩১', sessionsCount: 7 },
      // ২য় প্রান্তিক (approx 57 teaching days)
      { term: '২য় প্রান্তিক', chapter: 'পাঠ ২৩–২৪: বর্ণ শিখি (ট–ণ, ত–ন)', title: 'টিজি পিরিয়ড ৪৭–৫৬: ট, ঠ, ড, ঢ, ণ এবং ত, থ, দ, ধ, ন শোনা, পড়া ও লেখা', pages: '৩২–৩৫', sessionsCount: 13 },
      { term: '২য় প্রান্তিক', chapter: 'পাঠ ২৫–২৬: ট্রেন ছড়া ও বর্ণ শিখি (প–ম)', title: 'টিজি পিরিয়ড ৫৭–৬৪: ট্রেন ছড়া আবৃত্তি এবং প, ফ, ব, ভ, ম অনুশীলন', pages: '৩৬–৩৮', sessionsCount: 10 },
      { term: '২য় প্রান্তিক', chapter: 'পাঠ ২৭–২৯: উ-কার, ঊ-কার, ঋ-কার, এ-কার ও ঐ-কার', title: 'টিজি পিরিয়ড ৬৫–৬৯: কারচিহ্ন যোগে সহজ শব্দ ও বাক্য পঠন-লিখন', pages: '৩৯–৪১', sessionsCount: 6 },
      { term: '২য় প্রান্তিক', chapter: 'পাঠ ৩০–৩১: বর্ণ শিখি (য, র, ল) ও ও-কার, ঔ-কার', title: 'টিজি পিরিয়ড ৭০–৭৪: য, র, ল এবং ও-কার, ঔ-কার অনুশীলন', pages: '৪২–৪৪', sessionsCount: 7 },
      { term: '২য় প্রান্তিক', chapter: 'পাঠ ৩২–৩৪: বর্ণ শিখি (শ–হ, ড়–ৎ, ং–ঁ)', title: 'টিজি পিরিয়ড ৭৫–৮৫: শ, ষ, স, হ, ড়, ঢ়, য়, ৎ, ং, ঃ, ঁ শোনা, পড়া ও লেখা', pages: '৪৫–৫০', sessionsCount: 12 },
      { term: '২য় প্রান্তিক', chapter: 'পাঠ ৩৫–৩৮: ছবি দেখি শব্দ বানাই ও এসো পড়ি ও লিখি', title: 'টিজি পিরিয়ড ৮৬–৯২: কাক ডাকে, ফুল, ভোর হয়েছে অনুচ্ছেদ পঠন ও ২য় প্রান্তিক ফিডব্যাক', pages: '৫১–৫৪', sessionsCount: 9 },
      // ৩য় প্রান্তিক (approx 59 teaching days)
      { term: '৩য় প্রান্তিক', chapter: 'পাঠ ৩৯–৪২: মামার বাড়ি, তুলির ঘর ও পাঠবহির্ভূত ছবি', title: 'টিজি পিরিয়ড ৯৩–৯৮: ব্যঞ্জনবর্ণ সাজানো, মামার বাড়ি ছড়া ও ছবির বিষয়বস্তু বলা', pages: '৫৫–৫৯', sessionsCount: 7 },
      { term: '৩য় প্রান্তিক', chapter: 'পাঠ ৪৩–৪৪: ভোর হলো, পড়ি ও লিখি, যেতে যেতে পড়ি', title: 'টিজি পিরিয়ড ৯৯–১০৫: ছড়া আবৃত্তি, শব্দ বসানো ও ডিজিটাল/ছাপা নির্দেশনা পড়া', pages: '৬০–৬৪', sessionsCount: 9 },
      { term: '৩য় প্রান্তিক', chapter: 'পাঠ ৪৫–৪৭: সাত দিনের কথা, পিঁপড়া ও পায়রা, আজকের দিন', title: 'টিজি পিরিয়ড ১০৬–১১২: সপ্তাহের সাত দিন, গল্প বলা ও প্রশ্নের উত্তর লেখা', pages: '৬৫–৬৯', sessionsCount: 9 },
      { term: '৩য় প্রান্তিক', chapter: 'পাঠ ৪৮–৫১: ছুটি কবিতা, আমাদের দেশ, মাছের রাজা, সংখ্যা শিখি', title: 'টিজি পিরিয়ড ১১৩–১২৪: ছুটি কবিতা, ইলিশ, এক–বিশ বাংলা সংখ্যা কথায় লেখা', pages: '৭০–৭৬', sessionsCount: 12 },
      { term: '৩য় প্রান্তিক', chapter: 'পাঠ ৫২–৫৪: আমাদের মুক্তিযুদ্ধ, শব্দ নিয়ে খেলা ও আমার ঠিকানা', title: 'টিজি পিরিয়ড ১২৫–১৩২: ১৯৭১ সালের মুক্তিযুদ্ধ, বিজয় দিবস ও সমাপনী পুনরালোচনা', pages: '৭৭–৭৯', sessionsCount: 22 },
    ],
  },
  {
    classLevel: 'প্রথম শ্রেণি',
    subject: 'English for Today',
    authorityNote: 'জাতীয় প্রাথমিক শিক্ষা একাডেমি (নেপ), ময়মনসিংহ — ২০২৬',
    scheduledWeekdays: [0, 1, 2, 3], // রবি, সোম, মঙ্গল, বুধ (বৃহঃ X) — নেপ রুটিন অনুযায়ী ৪ দিন
    durationMinutes: 40,
    termBanners: DEFAULT_TERM_BANNERS(
      'Unit 1 & Unit 2 (Text Book Pages 01–42)',
      'Unit 3 & Unit 4 (Text Book Pages 43–76)',
      'Unit 5 & Full Review (Text Book Pages 77–95)'
    ),
    prepDescription: COMMON_PREP_EN,
    units: [
      { term: '১ম প্রান্তিক', chapter: 'Unit 1: Greetings & Introductions', title: 'Lessons 1–6: Good Morning, What Is Your Name?, Goodbye Rhyme', pages: '১–১৮', sessionsCount: 18 },
      { term: '১ম প্রান্তিক', chapter: 'Unit 2: Alphabet & Numbers (Aa–Mm, 1–5)', title: 'Lessons 1–10: Tracing, Sounds & Words with A–M, Counting 1–5', pages: '১৯–৪২', sessionsCount: 26 },
      { term: '২য় প্রান্তিক', chapter: 'Unit 3: Alphabet (Nn–Zz) & Numbers (6–10)', title: 'Lessons 1–10: Letter Sounds N–Z, Classroom Commands & Counting 6–10', pages: '৪৩–৬২', sessionsCount: 25 },
      { term: '২য় প্রান্তিক', chapter: 'Unit 4: Colours, Shapes & Classroom Objects', title: 'Lessons 1–6: Red-Green-Blue, Circle-Triangle, Asking Questions', pages: '৬৩–৭৬', sessionsCount: 21 },
      { term: '৩য় প্রান্তিক', chapter: 'Unit 5: My Family, Home & Rhymes', title: 'Lesson 1–3: Where Do You Live?, A Family Tree & Activity Review', pages: '৭৭–৯৫', sessionsCount: 47 },
    ],
  },
  {
    classLevel: 'প্রথম শ্রেণি',
    subject: 'প্রাথমিক গণিত',
    authorityNote: 'জাতীয় প্রাথমিক শিক্ষা একাডেমি (নেপ), ময়মনসিংহ — ২০২৬',
    scheduledWeekdays: [0, 1, 2, 3, 4],
    durationMinutes: 40,
    termBanners: DEFAULT_TERM_BANNERS(
      'অধ্যায় ১–৬: তুলনা, গণনা (১–১০), যোগ ও বিয়োগ (পৃষ্ঠা ১–৪৫)',
      'অধ্যায় ৭–১২: সংখ্যা (১১–৪০), যোগ-বিয়োগ, স্থানীয় মান ও আকৃতি (পৃষ্ঠা ৪৬–৭৮)',
      'অধ্যায় ১৩–১৮: সংখ্যা (৪১–১০০), দুই অঙ্কের যোগ-বিয়োগ ও মুদ্রা (পৃষ্ঠা ৭৯–১০৪)'
    ),
    prepDescription: COMMON_PREP_MATH,
    units: [
      { term: '১ম প্রান্তিক', chapter: 'অধ্যায় ১–২: তুলনা করি ও গণনা করি', title: 'কম-বেশি, বড়-ছোট, ভারী-হালকা ও ১–১০ পর্যন্ত বস্তু গণনা', pages: '১–১০', sessionsCount: 12 },
      { term: '১ম প্রান্তিক', chapter: 'অধ্যায় ৩–৪: সংখ্যা (১–১০) ও শূন্যের (০) ধারণা', title: 'সংখ্যা প্রতীক ১–১০ পড়া-লেখা, ছোট থেকে বড় সাজানো ও শূন্য (০)', pages: '১১–২৪', sessionsCount: 16 },
      { term: '১ম প্রান্তিক', chapter: 'অধ্যায় ৫: যোগের ধারণা (১ থেকে ১০)', title: 'একসাথে করা, বাড়ানো, যোগ চিহ্ন (+) ও এক অঙ্কের যোগ', pages: '২৫–৩৫', sessionsCount: 14 },
      { term: '১ম প্রান্তিক', chapter: 'অধ্যায় ৬: বিয়োগের ধারণা (১ থেকে ১০)', title: 'বাদ দেওয়া, তুলনা, বিয়োগ চিহ্ন (–) ও ১ম প্রান্তিক পুনরালোচনা', pages: '৩৬–৪৫', sessionsCount: 14 },
      { term: '২য় প্রান্তিক', chapter: 'অধ্যায় ৭–৯: সংখ্যা (১১–২০) ও ২০ পর্যন্ত যোগ-বিয়োগ', title: '১০-এর দল গঠন, ১১–২০ পড়া-লেখা এবং হাতে না রেখে যোগ ও বিয়োগ', pages: '৪৬–৬২', sessionsCount: 24 },
      { term: '২য় প্রান্তিক', chapter: 'অধ্যায় ১০–১২: সংখ্যা (২১–৪০), স্থানীয় মান ও জ্যামিতিক আকৃতি', title: 'দশক ও একক ধারণা, প্যাটার্ন, গোল-ত্রিকোণ-চতুর্কোণ আকৃতি', pages: '৬৩–৭৮', sessionsCount: 33 },
      { term: '৩য় প্রান্তিক', chapter: 'অধ্যায় ১৩–১৫: সংখ্যা (৪১–১০০) ও দুই অঙ্কের যোগ-বিয়োগ', title: '৪১–১০০ পর্যন্ত গণনা-লিখন, দশক-একক সাজিয়ে যোগ ও বিয়োগ', pages: '৭৯–৯২', sessionsCount: 32 },
      { term: '৩য় প্রান্তিক', chapter: 'অধ্যায় ১৬–১৮: বাংলাদেশী মুদ্রা, নোট ও নিজে করি', title: '১, ২, ৫, ১০, ২০ ও ৫০ টাকার মুদ্রা-নোট চেনা এবং বার্ষিক মূল্যায়ন অনুশীলন', pages: '৯৩–১০৪', sessionsCount: 27 },
    ],
  },
  {
    classLevel: 'প্রথম শ্রেণি',
    subject: 'সামাজিক বিজ্ঞান ও প্রাথমিক বিজ্ঞান (সমন্বিত)',
    authorityNote: 'জাতীয় প্রাথমিক শিক্ষা একাডেমি (নেপ), ময়মনসিংহ — ২০২৬',
    scheduledWeekdays: [0], // রবিবার (সপ্তাহে ১ দিন ~ ৩৫ পিরিয়ড) — নেপ রুটিন অনুযায়ী
    durationMinutes: 40,
    termBanners: DEFAULT_TERM_BANNERS(
      'অধ্যায় ১–৭: আমাদের পরিবেশ, জীব ও জড়, মানবদেহ ও পরিবার',
      'অধ্যায় ৮–১৪: নিরাপত্তা, ট্রাফিক নিয়ম, পৃথিবী ও মানচিত্র পরিচিতি',
      'অধ্যায় ১৫–২০: বস্তু, টান-ধাক্কা, প্রাকৃতিক সম্পদ ও প্রযুক্তি'
    ),
    prepDescription: COMMON_PREP_GENERAL('সামাজিক ও প্রাথমিক বিজ্ঞান'),
    units: [
      { term: '১ম প্রান্তিক', chapter: 'অধ্যায় ১–৪: আমাদের পরিবেশ, জীব ও জড়, মানবদেহ', title: 'পরিবেশের উপাদান, গাছপালা-প্রাণী চেনা ও দেহের বিভিন্ন অঙ্গের নাম', pages: '১–১৮', sessionsCount: 6 },
      { term: '১ম প্রান্তিক', chapter: 'অধ্যায় ৫–৭: পরিচ্ছন্নতা, পরিবার ও বিদ্যালয়', title: 'হাত ধোয়া, পরিচ্ছন্ন থাকা ও পরিবার-বিদ্যালয়ের সদস্যদের প্রতি শ্রদ্ধা', pages: '১৯–৩২', sessionsCount: 5 },
      { term: '২য় প্রান্তিক', chapter: 'অধ্যায় ৮–১১: নিরাপত্তা, ট্রাফিক বাতি ও ভালো-মন্দ কাজ', title: 'নিরাপদ রাস্তা পারাপার, লাল-হলুদ-সবুজ বাতি ও ভালো আচরণ অনুশীলন', pages: '৩৩–৪৮', sessionsCount: 6 },
      { term: '২য় প্রান্তিক', chapter: 'অধ্যায় ১২–১৪: পৃথিবী, দিন-রাত, আবহাওয়া ও জাতীয় পরিচয়', title: 'সূর্য-চাঁদ, রোদ-বৃষ্টি, বাংলাদেশের মানচিত্র ও জাতীয় প্রতীক', pages: '৪৯–৬২', sessionsCount: 6 },
      { term: '৩য় প্রান্তিক', chapter: 'অধ্যায় ১৫–২০: বস্তু, টান ও ধাক্কা, সম্পদ ও প্রযুক্তি', title: 'কঠিন-তরল বস্তু, বল প্রয়োগ (টান-ধাক্কা), পানি সংরক্ষণ ও দৈনন্দিন প্রযুক্তি', pages: '৬৩–৮৪', sessionsCount: 11 },
    ],
  },

  // ==================== ২য় শ্রেণি ====================
  {
    classLevel: 'দ্বিতীয় শ্রেণি',
    subject: 'আমার বাংলা বই',
    authorityNote: 'জাতীয় প্রাথমিক শিক্ষা একাডেমি (নেপ), ময়মনসিংহ — ২০২৬',
    scheduledWeekdays: [0, 1, 2, 3, 4],
    durationMinutes: 40,
    termBanners: DEFAULT_TERM_BANNERS(
      'পাঠ ১–১১: বর্ণমালা, কার-ফলা, যুক্তবর্ণ ও একুশের গান (পৃষ্ঠা ১–৩২)',
      'পাঠ ১২–২০: মুক্তিসেনা, নববর্ষ, দুখু মিয়ার গান ও ছোট নদী (পৃষ্ঠা ৩৩–৬০)',
      'পাঠ ২১–২৯: জলপরি ও কাঠুরে, সোনার হরিণ ও বিজয় দিবস (পৃষ্ঠা ৬১–৮৪)'
    ),
    prepDescription: COMMON_PREP_BN,
    units: [
      { term: '১ম প্রান্তিক', chapter: 'পাঠ ১–৪: আমার পরিচয়, স্কুল কেমন লাগছে, ডালিমকুমার ও কঙ্কাবতী', title: 'কথোপকথন, তপু ও মা পাঠ এবং ধারাবাহিক ছবি দেখে গল্প বলা', pages: '১–১১', sessionsCount: 15 },
      { term: '১ম প্রান্তিক', chapter: 'পাঠ ৫–৭: আবার পড়ি বর্ণমালা, আয় দেখে যা নাচ, কারচিহ্ন', title: 'স্বরবর্ণ-ব্যঞ্জনবর্ণ, ছড়া আবৃত্তি ও কারচিহ্ন দিয়ে নতুন শব্দ গঠন', pages: '১২–১৭', sessionsCount: 16 },
      { term: '১ম প্রান্তিক', chapter: 'পাঠ ৮–১১: সিংহ আর ইঁদুর, যুক্তবর্ণ, একুশের গান ও ফলাচিহ্ন', title: 'গল্প পঠন, যুক্তবর্ণ বিশ্লেষণ, ভাষা শহিদদের স্মরণ ও রেফ-ফলা অনুশীলন', pages: '১৮–৩২', sessionsCount: 25 },
      { term: '২য় প্রান্তিক', chapter: 'পাঠ ১২–১৫: রঙিন ফুল, মুক্তিসেনা, নববর্ষ ও দুখু মিয়ার গান', title: 'বৈশাখী মেলা, নজরুলের শৈশব, মুক্তিযুদ্ধের গল্প ও শব্দার্থ', pages: '৩৩–৪৫', sessionsCount: 28 },
      { term: '২য় প্রান্তিক', chapter: 'পাঠ ১৬–২০: বর্ষাকাল, আমাদের ছোট নদী, পাখি ও কাজের আনন্দ', title: 'রবীন্দ্রনাথের ছোট নদী আবৃত্তি, গ্রাম-বাংলার পাখি ও পরিশ্রমের মর্যাদা', pages: '৪৬–৬০', sessionsCount: 29 },
      { term: '৩য় প্রান্তিক', chapter: 'পাঠ ২১–২৪: জলপরি ও কাঠুরে, সোনার হরিণ, পিঁপড়ে আর ঘুঘু', title: 'সততা ও কৃতজ্ঞতার নৈতিক গল্প পঠন, প্রশ্নোত্তর ও শ্রুতলিপি', pages: '৬১–৭২', sessionsCount: 30 },
      { term: '৩য় প্রান্তিক', chapter: 'পাঠ ২৫–২৯: শীতের সকাল, আমার বাংলাদেশ ও মহান বিজয় দিবস', title: 'স্বদেশপ্রেম, ১৬ই ডিসেম্বর বিজয় দিবস ও সাবলীল পঠন অনুশীলন', pages: '৭৩–৮৪', sessionsCount: 29 },
    ],
  },
  {
    classLevel: 'দ্বিতীয় শ্রেণি',
    subject: 'English for Today',
    authorityNote: 'জাতীয় প্রাথমিক শিক্ষা একাডেমি (নেপ), ময়মনসিংহ — ২০২৬',
    scheduledWeekdays: [0, 1, 2, 3], // রবি, সোম, মঙ্গল, বুধ (৪ দিন)
    durationMinutes: 40,
    termBanners: DEFAULT_TERM_BANNERS(
      'Units 1–3: Greetings, Alphabet Words & Commands (Pages 01–34)',
      'Units 4–7: Asking/Answering, Days of Week, Sounds & Colours (Pages 35–68)',
      'Units 8–10: My Family, Animals & Birds, Story Time (Pages 69–96)'
    ),
    prepDescription: COMMON_PREP_EN,
    units: [
      { term: '১ম প্রান্তিক', chapter: 'Units 1–3: Greetings, Alphabet Words, Commands & Numbers', title: 'Introducing Friends, Numbers 1–30, Following Classroom Instructions', pages: '১–৩৪', sessionsCount: 44 },
      { term: '২য় প্রান্তিক', chapter: 'Units 4–7: Days of Week, Phonics, Colours, Shapes & Signs', title: '7 Days of Week Rhyme, Sound Patterns, Traffic Signs & Shapes', pages: '৩৫–৬৮', sessionsCount: 46 },
      { term: '৩য় প্রান্তিক', chapter: 'Units 8–10: My Family, Animals & Birds, Story Time', title: 'Talking About Family, Identifying Domestic Animals & Reading Short Stories', pages: '৬৯–৯৬', sessionsCount: 47 },
    ],
  },
  {
    classLevel: 'দ্বিতীয় শ্রেণি',
    subject: 'প্রাথমিক গণিত',
    authorityNote: 'জাতীয় প্রাথমিক শিক্ষা একাডেমি (নেপ), ময়মনসিংহ — ২০২৬',
    scheduledWeekdays: [0, 1, 2, 3, 4],
    durationMinutes: 40,
    termBanners: DEFAULT_TERM_BANNERS(
      'অধ্যায় ১–৩: সংখ্যা (১–১০০০), দুই ও তিন অঙ্কের যোগ এবং বিয়োগ',
      'অধ্যায় ৪–৬: গুণ (১–১০ নামতা), ভাগ ও জ্যামিতিক আকৃতি',
      'অধ্যায় ৭–১০: ভগ্নাংশ, পরিমাপ, বাংলাদেশী মুদ্রা ও উপাত্ত'
    ),
    prepDescription: COMMON_PREP_MATH,
    units: [
      { term: '১ম প্রান্তিক', chapter: 'অধ্যায় ১: সংখ্যা ও স্থানীয় মান (১–১০০০)', title: 'শতক, দশক ও একক, সংখ্যার তুলনা এবং জোড়-বিজোড় সংখ্যা', pages: '১–১৬', sessionsCount: 18 },
      { term: '১ম প্রান্তিক', chapter: 'অধ্যায় ২–৩: হাতে রেখে যোগ ও বিয়োগ', title: 'দুই ও তিন অঙ্কের যোগ-বিয়োগ এবং কথার অঙ্ক সমাধান', pages: '১৭–৪৫', sessionsCount: 38 },
      { term: '২য় প্রান্তিক', chapter: 'অধ্যায় ৪–৫: গুণের ধারণা (১–১০ নামতা) ও ভাগের ধারণা', title: 'নামতা গঠন, গুণ ও ভাগের বিপরীত সম্পর্ক ও সমস্যাসমাধান', pages: '৪৬–৭৬', sessionsCount: 42 },
      { term: '২য় প্রান্তিক', chapter: 'অধ্যায় ৬: জ্যামিতিক আকৃতি ও প্যাটার্ন', title: 'ত্রিভুজ, চতুর্ভুজ, বৃত্ত ও ঘনবস্তু পরিচিতি', pages: '৭৭–৮৬', sessionsCount: 15 },
      { term: '৩য় প্রান্তিক', chapter: 'অধ্যায় ৭–১০: ভগ্নাংশ, পরিমাপ, মুদ্রা ও উপাত্ত', title: 'অর্ধেক-চতুর্থাংশ, মিটার-কেজি-লিটার-ঘণ্টা পরিমাপ ও টাকার হিসাব', pages: '৮৭–১০৮', sessionsCount: 59 },
    ],
  },
  {
    classLevel: 'দ্বিতীয় শ্রেণি',
    subject: 'সামাজিক বিজ্ঞান ও প্রাথমিক বিজ্ঞান (সমন্বিত)',
    authorityNote: 'জাতীয় প্রাথমিক শিক্ষা একাডেমি (নেপ), ময়মনসিংহ — ২০২৬',
    scheduledWeekdays: [0], // রবিবার (১ দিন)
    durationMinutes: 40,
    termBanners: DEFAULT_TERM_BANNERS(
      'অধ্যায় ১–৮: জীববৈচিত্র্য, খাদ্য ও পুষ্টি, পরিবার ও প্রতিবেশী',
      'অধ্যায় ৯–১৬: প্রাকৃতিক পরিবেশ, পানি, বায়ু, আবহাওয়া ও সামাজিক সম্প্রীতি',
      'অধ্যায় ১৭–২৩: বিদ্যুৎ-জ্বালানি সাশ্রয়, দুর্যোগ সচেতনতা ও প্রযুক্তি'
    ),
    prepDescription: COMMON_PREP_GENERAL('সামাজিক ও প্রাথমিক বিজ্ঞান'),
    units: [
      { term: '১ম প্রান্তিক', chapter: 'অধ্যায় ১–৮: উদ্ভিদ-প্রাণী, সুষম খাদ্য ও সামাজিক সম্পর্ক', title: 'পরিবেশের বিভিন্ন জীব, সুস্থ থাকার খাদ্য ও প্রতিবেশীর সাথে সুসম্পর্ক', pages: '১–৩০', sessionsCount: 11 },
      { term: '২য় প্রান্তিক', chapter: 'অধ্যায় ৯–১৬: পানি, বায়ু, আবহাওয়া ও ঐতিহ্য', title: 'নিরাপদ পানি, বায়ুর ব্যবহার, বাংলাদেশের ঋতু ও জাতীয় উৎসব', pages: '৩১–৬০', sessionsCount: 12 },
      { term: '৩য় প্রান্তিক', chapter: 'অধ্যায় ১৭–২৩: সম্পদ রক্ষা, নিরাপত্তা ও প্রযুক্তি', title: 'বন্যাদুর্গতের সহায়তা, ট্রাফিক ও যোগাযোগ প্রযুক্তির ব্যবহার', pages: '৬১–৮৮', sessionsCount: 11 },
    ],
  },

  // ==================== ৩য় শ্রেণি ====================
  {
    classLevel: 'তৃতীয় শ্রেণি',
    subject: 'আমার বাংলা বই',
    authorityNote: 'জাতীয় প্রাথমিক শিক্ষা একাডেমি (নেপ), ময়মনসিংহ — ২০২৬',
    scheduledWeekdays: [0, 1, 2, 3, 4],
    durationMinutes: 40,
    termBanners: DEFAULT_TERM_BANNERS(
      'পাঠ ১–১০: আমাদের কথা থেকে রাষ্ট্রভাষা বাংলা চাই (পৃষ্ঠা ১–৩২)',
      'পাঠ ১১–১৯: বাক্য পড়ি ও লিখি থেকে আজিকার শিশু (পৃষ্ঠা ৩৩–৬৩)',
      'পাঠ ২০–২৯: ঢাকাই মসলিন থেকে প্রতিযোগিতায় নাম লিখি (পৃষ্ঠা ৬৪–৯৪)'
    ),
    prepDescription: COMMON_PREP_BN,
    units: [
      { term: '১ম প্রান্তিক', chapter: 'পাঠ ১–৫: আমাদের কথা, পরিবার, ময়লার বাস্কো, কার-ফলা', title: 'পরিচ্ছন্নতা, পরিবার ও কার-ফলা চিহ্ন (ব-ফলা, ম-ফলা, য-ফলা, র-ফলা) অনুশীলন', pages: '১–১৮', sessionsCount: 22 },
      { term: '১ম প্রান্তিক', chapter: 'পাঠ ৬–১০: দেখে বুঝে কাজ করি, ঘাসফড়িং ও পিঁপড়া, আমি হব, ব্যাঙের সাজা, রাষ্ট্রভাষা', title: 'সতর্কতা সাইন, কর্মঠ পিঁপড়ার গল্প, কাজী নজরুলের আমি হব ও ভাষা আন্দোলন', pages: '১৯–৩২', sessionsCount: 34 },
      { term: '২য় প্রান্তিক', chapter: 'পাঠ ১১–১৫: বাক্য পড়ি ও লিখি, আনন্দের দিন, বালুচরে একদিন, আমাদের গ্রাম, নদীর দেশ', title: 'যতিচিহ্ন, উৎসবের আনন্দ, বন্দে আলী মিয়ার কবিতা ও নদীমাতৃক বাংলাদেশ', pages: '৩৩–৪৮', sessionsCount: 30 },
      { term: '২য় প্রান্তিক', chapter: 'পাঠ ১৬–১৯: হার-জিতের গল্প, হাসি, উৎসব ও আজিকার শিশু', title: 'ক্রীড়া মানসিকতা, হাসি কবিতা ও কুসুমকুমারী দাশের আজিকার শিশু', pages: '৪৯–৬৩', sessionsCount: 27 },
      { term: '৩য় প্রান্তিক', chapter: 'পাঠ ২০–২৪: ঢাকাই মসলিন, হজরত আবু বকর, আমার পণ, মানব জয়ের গল্প, তালগাছ', title: 'ঐতিহ্যবাহী মসলিন, মহাপুরুষ জীবনী, আমার পণ ও রবীন্দ্রনাথের তালগাছ', pages: '৬৪–৭৮', sessionsCount: 31 },
      { term: '৩য় প্রান্তিক', chapter: 'পাঠ ২৫–২৯: রবীন্দ্রনাথ, আদর্শ ছেলে, মুক্তিযুদ্ধে রাজারবাগ, নিজের মতো লিখি', title: 'মুক্তিযুদ্ধের সূচনা, আদর্শ ছেলে কবিতা, অনুচ্ছেদ লিখন ও ফরম পূরণ', pages: '৭৯–৯৪', sessionsCount: 28 },
    ],
  },
  {
    classLevel: 'তৃতীয় শ্রেণি',
    subject: 'English for Today',
    authorityNote: 'জাতীয় প্রাথমিক শিক্ষা একাডেমি (নেপ), ময়মনসিংহ — ২০২৬',
    scheduledWeekdays: [0, 1, 2, 3, 4],
    durationMinutes: 40,
    termBanners: DEFAULT_TERM_BANNERS(
      'Unit 1–2: Greetings, Numbers & My Family and Friends (Pages 01–34)',
      'Unit 3–5: Commands/Requests, Sounds & Numbers, Their Days (Pages 35–68)',
      'Unit 6–7: Cleanliness & Save Our Planet (Pages 69–92)'
    ),
    prepDescription: COMMON_PREP_EN,
    units: [
      { term: '১ম প্রান্তিক', chapter: 'Unit 1–2: Greetings, Numbers & My Family and Friends', title: 'Introducing Oneself, Counting 1–100, Family Members & Occupations', pages: '১–৩৪', sessionsCount: 56 },
      { term: '২য় প্রান্তিক', chapter: 'Unit 3–5: Commands, Sounds & Numbers, Their Days', title: 'Following Instructions, Vowel-Consonant Sounds & Daily Routines', pages: '৩৫–৬৮', sessionsCount: 57 },
      { term: '৩য় প্রান্তিক', chapter: 'Unit 6–7: Cleanliness & Save Our Planet', title: 'Personal Hygiene, Planting Trees, Caring for Nature & Assessment Review', pages: '৬৯–৯২', sessionsCount: 59 },
    ],
  },
  {
    classLevel: 'তৃতীয় শ্রেণি',
    subject: 'প্রাথমিক গণিত',
    authorityNote: 'জাতীয় প্রাথমিক শিক্ষা একাডেমি (নেপ), ময়মনসিংহ — ২০২৬',
    scheduledWeekdays: [0, 1, 2, 3, 4],
    durationMinutes: 40,
    termBanners: DEFAULT_TERM_BANNERS(
      'অধ্যায় ১–৩: সংখ্যা (১০০০০ পর্যন্ত), যোগ ও বিয়োগ (পৃষ্ঠা ১–৩৬)',
      'অধ্যায় ৪–৭: গুণ, ভাগ ও চার প্রক্রিয়ার সমস্যা (পৃষ্ঠা ৩৭–৭৬)',
      'অধ্যায় ৮–১২: ভগ্নাংশ, মুদ্রা, পরিমাপ, জ্যামিতি ও উপাত্ত (পৃষ্ঠা ৭৭–১১৫)'
    ),
    prepDescription: COMMON_PREP_MATH,
    units: [
      { term: '১ম প্রান্তিক', chapter: 'অধ্যায় ১: সংখ্যা (১০০০০ পর্যন্ত)', title: 'সহস্র, শতক, দশক, একক স্থানীয় মান, সংখ্যারেখা ও তুলনা', pages: '১–১২', sessionsCount: 20 },
      { term: '১ম প্রান্তিক', chapter: 'অধ্যায় ২–৩: যোগ, বিয়োগ ও যোগ-বিয়োগের সম্পর্ক', title: 'চার অঙ্কের হাতে রেখে যোগ-বিয়োগ ও খালি ঘর পূরণ', pages: '১৩–৩৬', sessionsCount: 36 },
      { term: '২য় প্রান্তিক', chapter: 'অধ্যায় ৪–৫: গুণ ও ভাগ', title: 'দুই/তিন অঙ্কের সংখ্যাকে এক/দুই অঙ্ক দিয়ে গুণ এবং ভাগশেষসহ ভাগ', pages: '৩৭–৬২', sessionsCount: 38 },
      { term: '২য় প্রান্তিক', chapter: 'অধ্যায় ৬–৭: গুণ-ভাগের সম্পর্ক ও চার প্রক্রিয়া সমস্যা', title: 'ঐকিক ধারণার সূচনা ও মিশ্র গাণিতিক সমস্যা সমাধান', pages: '৬৩–৭৬', sessionsCount: 19 },
      { term: '৩য় প্রান্তিক', chapter: 'অধ্যায় ৮–৯: ভগ্নাংশ ও বাংলাদেশী মুদ্রা', title: 'সমহর ভগ্নাংশ চেনা, যোগ-বিয়োগ এবং টাকা ও পয়সার হিসাব', pages: '৭৭–৯২', sessionsCount: 28 },
      { term: '৩য় প্রান্তিক', chapter: 'অধ্যায় ১০–১২: পরিমাপ, জ্যামিতি ও উপাত্ত সংগ্রহ', title: 'দৈর্ঘ্য-ওজন-সময়, বিন্দু-রেখা-কোণ-ত্রিভুজ ও ট্যালি চিহ্ন', pages: '৯৩–১১৫', sessionsCount: 31 },
    ],
  },
  {
    classLevel: 'তৃতীয় শ্রেণি',
    subject: 'প্রাথমিক বিজ্ঞান',
    authorityNote: 'জাতীয় প্রাথমিক শিক্ষা একাডেমি (নেপ), ময়মনসিংহ — ২০২৬',
    scheduledWeekdays: [0, 1, 2, 3], // রবি, সোম, মঙ্গল, বুধ (নেপ রুটিন অনুযায়ী ৪ দিন)
    durationMinutes: 40,
    termBanners: DEFAULT_TERM_BANNERS(
      'অধ্যায় ১–৪: উদ্ভিদ, প্রাণী, খাদ্য ও পদার্থ (পৃষ্ঠা ১–৩২)',
      'অধ্যায় ৫–৮: শক্তি, বল, পানি ও মাটি (পৃষ্ঠা ৩৩–৬৮)',
      'অধ্যায় ৯–১১: জীবনের জন্য সূর্য, প্রযুক্তি ও তথ্য-যোগাযোগ (পৃষ্ঠা ৬৯–৯২)'
    ),
    prepDescription: COMMON_PREP_GENERAL('প্রাথমিক বিজ্ঞান'),
    units: [
      { term: '১ম প্রান্তিক', chapter: 'অধ্যায় ১–২: উদ্ভিদ ও প্রাণী', title: 'মেরুদণ্ডী ও অমেরুদণ্ডী প্রাণী, সপুষ্পক ও অপুষ্পক উদ্ভিদের শ্রেণিবিভাগ', pages: '১–১৫', sessionsCount: 16 },
      { term: '১ম প্রান্তিক', chapter: 'অধ্যায় ৩–৪: সুস্বাস্থ্যের জন্য খাদ্য ও পদার্থ', title: 'পুষ্টি উপাদান, মৌসুমি ফল-সবজি এবং কঠিন, তরল ও বায়বীয় পদার্থ', pages: '১৬–৩২', sessionsCount: 18 },
      { term: '২য় প্রান্তিক', chapter: 'অধ্যায় ৫–৬: শক্তি ও বস্তুর উপর বলের প্রভাব', title: 'শক্তির বিভিন্ন রূপ ও অপচয় রোধ; গতি ও আকৃতি পরিবর্তনে বল', pages: '৩৩–৫২', sessionsCount: 18 },
      { term: '২য় প্রান্তিক', chapter: 'অধ্যায় ৭–৮: পানি ও মাটি', title: 'পানির উৎস ও দূষণ রোধ; বেলে, দোআঁশ ও এঁটেল মাটির বৈশিষ্ট্য', pages: '৫৩–৬৮', sessionsCount: 16 },
      { term: '৩য় প্রান্তিক', chapter: 'অধ্যায় ৯–১১: সূর্য, প্রযুক্তি ও তথ্য ও যোগাযোগ', title: 'তাপ ও আলোর উৎস সূর্য, কৃষি-চিকিৎসা-শিক্ষা প্রযুক্তি ও নিরাপদ তথ্য বিনিময়', pages: '৬৯–৯২', sessionsCount: 35 },
    ],
  },
  {
    classLevel: 'তৃতীয় শ্রেণি',
    subject: 'বাংলাদেশ ও বিশ্বপরিচয়',
    authorityNote: 'জাতীয় প্রাথমিক শিক্ষা একাডেমি (নেপ), ময়মনসিংহ — ২০২৬',
    scheduledWeekdays: [0, 1, 4], // রবি, সোম ও বৃহঃ (নেপ রুটিন অনুযায়ী ৩ দিন)
    durationMinutes: 40,
    termBanners: DEFAULT_TERM_BANNERS(
      'অধ্যায় ১–৪: পরিবেশ, সবাই মানুষ, ইতিহাস ও সংস্কৃতি (পৃষ্ঠা ১–২৮)',
      'অধ্যায় ৫–৮: মহাদেশ ও মহাসাগর, ভূমিকা, শিশু অধিকার ও নৈতিক গুণ (পৃষ্ঠা ২৯–৫৮)',
      'অধ্যায় ৯–১২: আমাদের দেশ, পেশা, টাকার ব্যবহার ও দুর্যোগ মোকাবিলা (পৃষ্ঠা ৫৯–৮৪)'
    ),
    prepDescription: COMMON_PREP_GENERAL('বাংলাদেশ ও বিশ্বপরিচয়'),
    units: [
      { term: '১ম প্রান্তিক', chapter: 'অধ্যায় ১–২: আমাদের পরিবেশ ও সবাই মানুষ', title: 'প্রাকৃতিক ও সামাজিক পরিবেশ সংরক্ষণ এবং বিশেষ চাহিদাসম্পন্ন শিশুর প্রতি সহমর্মিতা', pages: '১–১৪', sessionsCount: 11 },
      { term: '১ম প্রান্তিক', chapter: 'অধ্যায় ৩–৪: বাংলাদেশের ইতিহাস ও আমাদের সংস্কৃতি', title: 'ভাষা আন্দোলন, মুক্তিযুদ্ধ ও বাংলাদেশের বিভিন্ন উৎসব-সংস্কৃতি', pages: '১৫–২৮', sessionsCount: 11 },
      { term: '২য় প্রান্তিক', chapter: 'অধ্যায় ৫–৬: মহাদেশ-মহাসাগর ও পরিবার-বিদ্যালয়ে ভূমিকা', title: '৭টি মহাদেশ ও ৫টি মহাসাগর পরিচিতি এবং পারিবারিক দায়িত্ব পালন', pages: '২৯–৪৪', sessionsCount: 12 },
      { term: '২য় প্রান্তিক', chapter: 'অধ্যায় ৭–৮: শিশু অধিকার, নিরাপত্তা ও নৈতিক গুণ', title: 'মৌলিক শিশু অধিকার, নিরাপদ পথ চলা ও ন্যায়-অন্যায় বোধ', pages: '৪৫–৫৮', sessionsCount: 12 },
      { term: '৩য় প্রান্তিক', chapter: 'অধ্যায় ৯–১২: আমাদের দেশ, পেশা, টাকা ও দুর্যোগ', title: 'মানচিত্রে বাংলাদেশ, শ্রমজীবী পেশার মর্যাদা, সঞ্চয় ও বন্যা-ঘূর্ণিঝড় সতর্কতা', pages: '৫৯–৮৪', sessionsCount: 23 },
    ],
  },

  // ==================== ৪র্থ শ্রেণি ====================
  {
    classLevel: 'চতুর্থ শ্রেণি',
    subject: 'আমার বাংলা বই',
    authorityNote: 'জাতীয় প্রাথমিক শিক্ষা একাডেমি (নেপ), ময়মনসিংহ — ২০২৬',
    scheduledWeekdays: [0, 1, 2, 3, 4],
    durationMinutes: 40,
    termBanners: DEFAULT_TERM_BANNERS(
      'পাঠ ১–৮: রূপময় বাংলাদেশ থেকে চিলি ও বিড়াল (পৃষ্ঠা ১–৩৬)',
      'পাঠ ৯–১৫: বৃষ্টির ছড়া থেকে প্রিয় স্বাধীনতা (পৃষ্ঠা ৩৭–৬৮)',
      'পাঠ ১৬–২৩: সোনার থালা থেকে পাঠাগারের সদস্য হই (পৃষ্ঠা ৬৯–৯৮)'
    ),
    prepDescription: COMMON_PREP_BN,
    units: [
      { term: '১ম প্রান্তিক', chapter: 'পাঠ ১–৪: রূপময় বাংলাদেশ, কেমন বড়াই, শুভেচ্ছা জানাই ও ভাষার খেলা', title: 'ছয় ঋতুর দেশ, কথোপকথন ও শব্দ-বাক্যের মজার খেলা', pages: '১–২১', sessionsCount: 28 },
      { term: '১ম প্রান্তিক', chapter: 'পাঠ ৫–৮: জন্মেছি এই দেশে, দোয়েল পাখি, একুশের কবিতা, চিলি ও বিড়াল', title: 'দেশপ্রেম কবিতা, জাতীয় পাখি, একুশের চেতনা ও ব্যাকরণ চর্চা', pages: '২২–৩৬', sessionsCount: 28 },
      { term: '২য় প্রান্তিক', chapter: 'পাঠ ৯–১২: বৃষ্টির ছড়া, ময়নামতি, বাঘখেকো শিয়ালের ছানা, কাজলা দিদি', title: 'প্রত্নতাত্ত্বিক নিদর্শন ময়নামতি, লোকগল্প ও যতীন্দ্রমোহন বাগচীর কবিতা', pages: '৩৭–৫৪', sessionsCount: 29 },
      { term: '২য় প্রান্তিক', chapter: 'পাঠ ১৩–১৫: দানবীর মুহসিন, অমল ও দইওয়ালা, প্রিয় স্বাধীনতা', title: 'হাজী মুহাম্মদ মুহসীনের দানশীলতা, নাট্যাংশ ও স্বাধীনতার আনন্দ', pages: '৫৫–৬৮', sessionsCount: 28 },
      { term: '৩য় প্রান্তিক', chapter: 'পাঠ ১৬–১৯: সোনার থালা, লিচু-চোর, মহীয়সী নারী, লাল জামা', title: 'কাজী নজরুলের লিচু-চোর, বেগম রোকেয়া ও অন্যান্য অনুপ্রেরণাদায়ী নারী', pages: '৬৯–৮৩', sessionsCount: 30 },
      { term: '৩য় প্রান্তিক', chapter: 'পাঠ ২০–২৩: চারিদিকে দেখি, ভয় পেয়ো না, খলিফা উমর (রা.), পাঠাগারের সদস্য হই', title: 'ন্যায়পরায়ণতা, প্রতিবেদন-চিঠিপত্র ও পাঠাগার ব্যবহারের নিয়ম', pages: '৮৪–৯৮', sessionsCount: 29 },
    ],
  },
  {
    classLevel: 'চতুর্থ শ্রেণি',
    subject: 'English for Today',
    authorityNote: 'জাতীয় প্রাথমিক শিক্ষা একাডেমি (নেপ), ময়মনসিংহ — ২০২৬',
    scheduledWeekdays: [0, 1, 2, 3, 4],
    durationMinutes: 40,
    termBanners: DEFAULT_TERM_BANNERS(
      'Units 1–6: Introducing One Another to Sounds & Numbers',
      'Units 7–12: Telling Time to Making Friends',
      'Units 13–18: Visit Book Fair to Caring for Others'
    ),
    prepDescription: COMMON_PREP_EN,
    units: [
      { term: '১ম প্রান্তিক', chapter: 'Units 1–6: Introductions, Assembly, Sports, Little Doctor & Phonics', title: 'Self-Introduction, School Activities, Health Habits & Numbers 100–500', pages: '১–৩৪', sessionsCount: 56 },
      { term: '২য় প্রান্তিক', chapter: 'Units 7–12: Telling Time, My Family, Gardening, Letter & Holiday Trip', title: 'Clock Reading (am/pm), Writing Friendly Letters & Travel Dialogue', pages: '৩৫–৬৮', sessionsCount: 57 },
      { term: '৩য় প্রান্তিক', chapter: 'Units 13–18: Book Fair, Tears of Earth, Environment Pollution & Caring', title: 'Environmental Awareness, Cultural Exchange & Paragraph Writing', pages: '৬৯–৯৮', sessionsCount: 59 },
    ],
  },
  {
    classLevel: 'চতুর্থ শ্রেণি',
    subject: 'প্রাথমিক গণিত',
    authorityNote: 'জাতীয় প্রাথমিক শিক্ষা একাডেমি (নেপ), ময়মনসিংহ — ২০২৬',
    scheduledWeekdays: [0, 1, 2, 3, 4],
    durationMinutes: 40,
    termBanners: DEFAULT_TERM_BANNERS(
      'অধ্যায় ১–৪: বড় সংখ্যা, যোগ-বিয়োগ, গুণ ও ভাগ',
      'অধ্যায় ৫–৮: গাণিতিক বাক্য, গুণিতক-গুণনীয়ক, সাধারণ ও দশমিক ভগ্নাংশ',
      'অধ্যায় ৯–১১: পরিমাপ, জ্যামিতি ও উপাত্ত বিন্যস্তকরণ'
    ),
    prepDescription: COMMON_PREP_MATH,
    units: [
      { term: '১ম প্রান্তিক', chapter: 'অধ্যায় ১–২: বড় সংখ্যা (কোটি পর্যন্ত) ও যোগ-বিয়োগ', title: 'অযুত-লক্ষ-নিযুত-কোটি স্থানীয় মান এবং পাঁচ অঙ্কের যোগ-বিয়োগ', pages: '১–৩৪', sessionsCount: 28 },
      { term: '১ম প্রান্তিক', chapter: 'অধ্যায় ৩–৪: গুণ ও ভাগ প্রক্রিয়া', title: 'তিন ও চার অঙ্কের গুণ-ভাগ এবং সহজ পদ্ধতিতে হিসাব', pages: '৩৫–৫৭', sessionsCount: 28 },
      { term: '২য় প্রান্তিক', chapter: 'অধ্যায় ৫–৬: গাণিতিক বাক্য ও গুণিতক-গুণনীয়ক', title: 'হিসাবের ক্রম (বন্ধনী), মৌলিক সংখ্যা, গ.সা.গু ও ল.সা.গু', pages: '৫৮–৮৬', sessionsCount: 28 },
      { term: '২য় প্রান্তিক', chapter: 'অধ্যায় ৭–৮: সাধারণ ভগ্নাংশ ও দশমিক ভগ্নাংশ', title: 'প্রকৃত-অপ্রকৃত-মিশ্র ভগ্নাংশ, সমতুল ভগ্নাংশ ও দশমিকের যোগ-বিয়োগ', pages: '৮৭–১২০', sessionsCount: 29 },
      { term: '৩য় প্রান্তিক', chapter: 'অধ্যায় ৯–১১: পরিমাপ, জ্যামিতি ও উপাত্ত সংগ্রহ', title: 'ক্ষেত্রফল (আয়ত-বর্গ), সূক্ষ্ম-সম-স্থূল কোণ, ত্রিভুজ ও স্তম্ভলেখ', pages: '১২১–১৪৪', sessionsCount: 59 },
    ],
  },
  {
    classLevel: 'চতুর্থ শ্রেণি',
    subject: 'প্রাথমিক বিজ্ঞান',
    authorityNote: 'জাতীয় প্রাথমিক শিক্ষা একাডেমি (নেপ), ময়মনসিংহ — ২০২৬',
    scheduledWeekdays: [0, 1, 3, 4], // রবি, সোম, বুধ, বৃহঃ (নেপ রুটিন অনুযায়ী ৪ দিন)
    durationMinutes: 40,
    termBanners: DEFAULT_TERM_BANNERS(
      'অধ্যায় ১–৪: জীবের বৃদ্ধি, স্বাস্থ্য সুরক্ষা, প্রাথমিক চিকিৎসা ও পদার্থ',
      'অধ্যায় ৫–৮: শক্তি, গতি-বল, প্রাকৃতিক সম্পদ ও মহাবিশ্ব',
      'অধ্যায় ৯–১১: আবহাওয়া-জলবায়ু, প্রযুক্তি ও স্ক্র্যাচ আইসিটি'
    ),
    prepDescription: COMMON_PREP_GENERAL('প্রাথমিক বিজ্ঞান'),
    units: [
      { term: '১ম প্রান্তিক', chapter: 'অধ্যায় ১–৪: জীব, স্বাস্থ্যবিধি, প্রাথমিক চিকিৎসা ও পদার্থ', title: 'উদ্ভিদ-প্রাণীর বৃদ্ধি, পানিবাহিত রোগ প্রতিরোধ ও পদার্থের অবস্থা পরিবর্তন', pages: '১–৩৪', sessionsCount: 34 },
      { term: '২য় প্রান্তিক', chapter: 'অধ্যায় ৫–৮: শক্তি, বল, প্রাকৃতিক সম্পদ ও সৌরজগৎ', title: 'শক্তির রূপান্তর, ঘর্ষণ বল, নবায়নযোগ্য সম্পদ, গ্রহ-নক্ষত্র ও চাঁদের দশা', pages: '৩৫–৬৮', sessionsCount: 34 },
      { term: '৩য় প্রান্তিক', chapter: 'অধ্যায় ৯–১১: আবহাওয়া, প্রযুক্তি ও সমস্যাসমাধানে স্ক্র্যাচ', title: 'বায়ুপ্রবাহ ও বৃষ্টিপাত, আধুনিক কৃষি প্রযুক্তি এবং ব্লক কোডিং (Scratch)', pages: '৬৯–৯৬', sessionsCount: 35 },
    ],
  },
  {
    classLevel: 'চতুর্থ শ্রেণি',
    subject: 'বাংলাদেশ ও বিশ্বপরিচয়',
    authorityNote: 'জাতীয় প্রাথমিক শিক্ষা একাডেমি (নেপ), ময়মনসিংহ — ২০২৬',
    scheduledWeekdays: [0, 2, 3], // রবি, মঙ্গল, বুধ (নেপ রুটিন অনুযায়ী ৩ দিন)
    durationMinutes: 40,
    termBanners: DEFAULT_TERM_BANNERS(
      'অধ্যায় ১–৫: আমাদের পরিবেশ-সমাজ থেকে মূল্যবোধ ও আচরণ',
      'অধ্যায় ৬–১০: পরমতসহিষ্ণুতা থেকে এশিয়ার বিভিন্ন অঞ্চল',
      'অধ্যায় ১১–১৪: বাংলাদেশের ভূপ্রকৃতি, দুর্যোগ, জনসংখ্যা ও ইতিহাস'
    ),
    prepDescription: COMMON_PREP_GENERAL('বাংলাদেশ ও বিশ্বপরিচয়'),
    units: [
      { term: '১ম প্রান্তিক', chapter: 'অধ্যায় ১–৫: পরিবেশ, সমাজে পরস্পরের সহযোগিতা ও মূল্যবোধ', title: 'সামাজিক বৈচিত্র্য, নারী-পুরুষ সমতা, নাগরিক অধিকার ও দায়িত্ব', pages: '১–২৮', sessionsCount: 22 },
      { term: '২য় প্রান্তিক', chapter: 'অধ্যায় ৬–১০: পরমতসহিষ্ণুতা, কাজের মর্যাদা ও এশিয়া মহাদেশ', title: 'মতামতের প্রতি শ্রদ্ধা, ঐতিহাসিক নিদর্শন ও এশিয়ার দেশসমূহ', pages: '২৯–৫৮', sessionsCount: 24 },
      { term: '৩য় প্রান্তিক', chapter: 'অধ্যায় ১১–১৪: বাংলাদেশের ভূপ্রকৃতি, দুর্যোগ, জনসংখ্যা ও গৌরবময় ইতিহাস', title: 'নদ-নদী, পাহাড়-সমতল, দুর্যোগ ব্যবস্থাপনা এবং পলাশী থেকে একাত্তর', pages: '৫৯–৮৬', sessionsCount: 23 },
    ],
  },

  // ==================== ৫ম শ্রেণি ====================
  {
    classLevel: 'পঞ্চম শ্রেণি',
    subject: 'আমার বাংলা বই',
    authorityNote: 'জাতীয় প্রাথমিক শিক্ষা একাডেমি (নেপ), ময়মনসিংহ — ২০২৬',
    scheduledWeekdays: [0, 1, 2, 3, 4],
    durationMinutes: 45,
    termBanners: DEFAULT_TERM_BANNERS(
      'পাঠ ১–৮: বৈচিত্র্যময় বাংলাদেশ থেকে রয়েল বেঙ্গল টাইগার',
      'পাঠ ৯–১৫: টুকটুক ও চিকু থেকে সংকল্প কবিতা',
      'পাঠ ১৬–২৩: স্মরণীয় যাঁরা বরণীয় যাঁরা থেকে পোস্টার ও প্ল্যাকার্ড লিখি'
    ),
    prepDescription: COMMON_PREP_BN,
    units: [
      { term: '১ম প্রান্তিক', chapter: 'পাঠ ১–৪: বৈচিত্র্যময় বাংলাদেশ, তিতুমীর, দূরের পাল্লা, আবেদনপত্র লিখি', title: 'ক্ষুদ্র নৃগোষ্ঠীর সংস্কৃতি, বাঁশের কেল্লার বীরত্ব, ছন্দময় কবিতা ও আনুষ্ঠানিক চিঠি', pages: '১–২৬', sessionsCount: 28 },
      { term: '১ম প্রান্তিক', chapter: 'পাঠ ৫–৮: ঠিক আছে, সুখ আর দুখু, সাইক্লোন, রয়েল বেঙ্গল টাইগার', title: 'দুর্যোগ সচেতনতা, লোকগল্প ও সুন্দরবনের জীববৈচিত্র্য রক্ষা', pages: '২৭–৪৪', sessionsCount: 28 },
      { term: '২য় প্রান্তিক', chapter: 'পাঠ ৯–১২: টুকটুক ও চিকু, রাখাল ছেলে, কুটির শিল্প, শিষ্যের সাধনা', title: 'জসীমউদ্দীনের রাখাল ছেলে, বাংলাদেশের মৃৎ-তাঁতশিল্প ও গুরুভক্তি', pages: '৪৫–৬৪', sessionsCount: 29 },
      { term: '২য় প্রান্তিক', chapter: 'পাঠ ১৩–১৫: পাখির মতো, কুপোকাত ও সংকল্প', title: 'মানবিক অনুভূতি, হাস্যরস ও কাজী নজরুলের সংকল্প কবিতার মূলভাব', pages: '৬৫–৭৮', sessionsCount: 28 },
      { term: '৩য় প্রান্তিক', chapter: 'পাঠ ১৬–১৯: স্মরণীয় যাঁরা বরণীয় যাঁরা, মাটির নিচে পুরানো নগর, ইছামতী, ভাষার খেলা', title: 'বুদ্ধিজীবী দিবস, উয়ারী-বটেশ্বর প্রত্ননগর ও প্রবাদ-বাগধারা', pages: '৭৯–৯৬', sessionsCount: 30 },
      { term: '৩য় প্রান্তিক', chapter: 'পাঠ ২০–২৩: শিক্ষাগুরুর মর্যাদা, বিদায় হজের ভাষণ, আমরা তোমাদের ভুলবো না, পোস্টার লিখি', title: 'শিক্ষকের সম্মান, বিশ্বমানবতার সনদ, শহিদ মুক্তিযোদ্ধা ও সৃজনশীল পোস্টার লিখন', pages: '৯৭–১১২', sessionsCount: 29 },
    ],
  },
  {
    classLevel: 'পঞ্চম শ্রেণি',
    subject: 'English for Today',
    authorityNote: 'জাতীয় প্রাথমিক শিক্ষা একাডেমি (নেপ), ময়মনসিংহ — ২০২৬',
    scheduledWeekdays: [0, 1, 2, 3, 4],
    durationMinutes: 45,
    termBanners: DEFAULT_TERM_BANNERS(
      'Units 1–7: At the Library to The Sundarbans',
      'Units 8–14: Field Trip to Champion Girl',
      'Units 15–20: Secret Song to Writing a Story'
    ),
    prepDescription: COMMON_PREP_EN,
    units: [
      { term: '১ম প্রান্তিক', chapter: 'Units 1–7: Library, School Garden, Home District, Student Council & Sundarbans', title: 'Reading Comprehension, WH-Questions, Email Writing & Mangrove Forest', pages: '১–৩৬', sessionsCount: 56 },
      { term: '২য় প্রান্তিক', chapter: 'Units 8–14: Field Trip, The Swing, Making Requests, Eating Healthy & Champion Girl', title: 'Polite Requests, Food Pyramid, Grammar (Tense/Modal) & Short Composition', pages: '৩৭–৭২', sessionsCount: 57 },
      { term: '৩য় প্রান্তিক', chapter: 'Units 15–20: Secret Song, Giving Tree, Nakshi Kantha, Wind and Sun & Story Writing', title: 'Literary Appreciation, Traditional Crafts, Fables & Guided Story Writing', pages: '৭৩–১০৪', sessionsCount: 59 },
    ],
  },
  {
    classLevel: 'পঞ্চম শ্রেণি',
    subject: 'প্রাথমিক গণিত',
    authorityNote: 'জাতীয় প্রাথমিক শিক্ষা একাডেমি (নেপ), ময়মনসিংহ — ২০২৬',
    scheduledWeekdays: [0, 1, 2, 3, 4],
    durationMinutes: 45,
    termBanners: DEFAULT_TERM_BANNERS(
      'অধ্যায় ১–৩: গুণ ও ভাগ, চার প্রক্রিয়া ও গুণিতক-গুণনীয়ক (পৃষ্ঠা ১–৪০)',
      'অধ্যায় ৪–৭: সাধারণ ভগ্নাংশ, দশমিক ভগ্নাংশ, শতকরা ও গড় (পৃষ্ঠা ৪১–৯৪)',
      'অধ্যায় ৮–১০: পরিমাপ, জ্যামিতি ও উপাত্ত বিন্যস্তকরণ (পৃষ্ঠা ৯৫–১৪৮)'
    ),
    prepDescription: COMMON_PREP_MATH,
    units: [
      { term: '১ম প্রান্তিক', chapter: 'অধ্যায় ১–২: গুণ-ভাগ ও চার প্রক্রিয়া সম্পর্কিত সমস্যাবলি', title: 'সহজ পদ্ধতিতে গুণ-ভাগ, ঐকিক নিয়ম ও বন্ধনীযুক্ত গাণিতিক বাক্য', pages: '১–২৫', sessionsCount: 28 },
      { term: '১ম প্রান্তিক', chapter: 'অধ্যায় ৩: গুণিতক ও গুণনীয়ক (ল.সা.গু ও গ.সা.গু)', title: 'মৌলিক উৎপাদকে বিশ্লেষণ এবং বাস্তবভিত্তিক ল.সা.গু ও গ.সা.গু সমস্যা', pages: '২৬–৪০', sessionsCount: 28 },
      { term: '২য় প্রান্তিক', chapter: 'অধ্যায় ৪–৫: সাধারণ ও দশমিক ভগ্নাংশ', title: 'ভগ্নাংশের গুণ-ভাগ, দশমিকের গুণ-ভাগ ও সৃজনশীল যোগ্যতাভিত্তিক সমস্যা', pages: '৪১–৭৪', sessionsCount: 34 },
      { term: '২য় প্রান্তিক', chapter: 'অধ্যায় ৬–৭: শতকরা ও গড়', title: 'ভগ্নাংশকে শতকরায় প্রকাশ, সুদ-আসল, লাভ-ক্ষতি ও গড় নির্ণয়', pages: '৭৫–৯৪', sessionsCount: 23 },
      { term: '৩য় প্রান্তিক', chapter: 'অধ্যায় ৮–১০: পরিমাপ, জ্যামিতি ও উপাত্ত বিন্যস্তকরণ', title: 'আয়ত ও ত্রিভুজের ক্ষেত্রফল, বৃত্ত-চতুর্ভুজ অঙ্কন, আয়তলেখ ও জনসংখ্যা ঘনত্ব', pages: '৯৫–১৪৮', sessionsCount: 59 },
    ],
  },
  {
    classLevel: 'পঞ্চম শ্রেণি',
    subject: 'প্রাথমিক বিজ্ঞান',
    authorityNote: 'জাতীয় প্রাথমিক শিক্ষা একাডেমি (নেপ), ময়মনসিংহ — ২০২৬',
    scheduledWeekdays: [0, 1, 2, 4], // রবি, সোম, মঙ্গল, বৃহঃ (নেপ রুটিন অনুযায়ী ৪ দিন)
    durationMinutes: 40,
    termBanners: DEFAULT_TERM_BANNERS(
      'অধ্যায় ১–৪: জীবের আবাসস্থল, পারস্পরিক নির্ভরশীলতা, খাদ্য ও বয়ঃসন্ধিকাল',
      'অধ্যায় ৫–৯: পদার্থের গঠন, শক্তির রূপান্তর, বল, ভূমিরূপ ও পরিবেশ সংরক্ষণ',
      'অধ্যায় ১০–১৩: পৃথিবীর গতি, জলবায়ু পরিবর্তন, প্রযুক্তি ও স্ক্র্যাচ প্রোগ্রামিং'
    ),
    prepDescription: COMMON_PREP_GENERAL('প্রাথমিক বিজ্ঞান'),
    units: [
      { term: '১ম প্রান্তিক', chapter: 'অধ্যায় ১–৪: জীবের আবাসস্থল, খাদ্যশৃঙ্খল, খাদ্য ও বয়ঃসন্ধিকাল', title: 'খাদ্যজাল, সালোকসংশ্লেষণ, সুষম খাদ্য ও জাঙ্কফুড বর্জন, বয়ঃসন্ধির পরিবর্তন', pages: '১–৩৪', sessionsCount: 34 },
      { term: '২য় প্রান্তিক', chapter: 'অধ্যায় ৫–৯: পদার্থ, শক্তির রূপান্তর, বল, ভূমিরূপ ও পরিবেশ সংরক্ষণ', title: 'পরমাণু-অণু ধারণা, তাপ সঞ্চালন, মহাকর্ষ, ভূমিক্ষয় ও বর্জ্য ব্যবস্থাপনা', pages: '৩৫–৭০', sessionsCount: 35 },
      { term: '৩য় প্রান্তিক', chapter: 'অধ্যায় ১০–১৩: পৃথিবীর গতি, জলবায়ু পরিবর্তন ও প্রযুক্তি-স্ক্র্যাচ', title: 'আহ্নিক ও বার্ষিক গতি, গ্রিনহাউস প্রভাব, বৈজ্ঞানিক অনুসন্ধান ও কোডিং', pages: '৭১–১০২', sessionsCount: 35 },
    ],
  },
  {
    classLevel: 'পঞ্চম শ্রেণি',
    subject: 'বাংলাদেশ ও বিশ্বপরিচয়',
    authorityNote: 'জাতীয় প্রাথমিক শিক্ষা একাডেমি (নেপ), ময়মনসিংহ — ২০২৬',
    scheduledWeekdays: [0, 1, 4], // রবি, সোম ও বৃহঃ (নেপ রুটিন অনুযায়ী ৩ দিন)
    durationMinutes: 40,
    termBanners: DEFAULT_TERM_BANNERS(
      'অধ্যায় ১–৫: মুক্তিযুদ্ধ, ব্রিটিশ শাসন, ঐতিহাসিক নিদর্শন ও অর্থনীতি',
      'অধ্যায় ৬–১০: জলবায়ু-দুর্যোগ, মানবাধিকার, নারী-পুরুষ সমতা ও গণতন্ত্র',
      'অধ্যায় ১১–১৬: ক্ষুদ্র নৃগোষ্ঠী, বাংলাদেশ ও বিশ্ব (জাতিসংঘ ও সার্ক)'
    ),
    prepDescription: COMMON_PREP_GENERAL('বাংলাদেশ ও বিশ্বপরিচয়'),
    units: [
      { term: '১ম প্রান্তিক', chapter: 'অধ্যায় ১–৫: আমাদের মুক্তিযুদ্ধ, ব্রিটিশ শাসন ও ঐতিহাসিক নিদর্শন', title: 'অপারেশন সার্চলাইট, মুজিবনগর সরকার, মহাস্থানগড়-পাহাড়পুর ও কৃষি-শিল্প অর্থনীতি', pages: '১–৩৪', sessionsCount: 22 },
      { term: '২য় প্রান্তিক', chapter: 'অধ্যায় ৬–১০: জলবায়ু, মানবাধিকার, দায়িত্ব-কর্তব্য ও গণতন্ত্র', title: 'নদীভাঙন-খরা-ভূমিকম্প, মৌলিক মানবাধিকার ও গণতান্ত্রিক আচরণ', pages: '৩৫–৬৪', sessionsCount: 23 },
      { term: '৩য় প্রান্তিক', chapter: 'অধ্যায় ১১–১৬: বাংলাদেশের ক্ষুদ্র নৃগোষ্ঠী ও আন্তর্জাতিক সংস্থা', title: 'গারো-খাসি-ম্রো-সাঁওতাল সংস্কৃতি এবং জাতিসংঘ, ইউনিসেফ ও সার্কের ভূমিকা', pages: '৬৫–৯৬', sessionsCount: 23 },
    ],
  },

  // ==================== প্রাক-প্রাথমিক ====================
  {
    classLevel: 'প্রাক-প্রাথমিক',
    subject: 'আমার বই',
    authorityNote: 'এনসিটিবি / জাতীয় প্রাথমিক শিক্ষা একাডেমি — প্রাক-প্রাথমিক ২০২৬',
    scheduledWeekdays: [0, 1, 2, 3, 4],
    durationMinutes: 30,
    termBanners: DEFAULT_TERM_BANNERS(
      'পার্ট ১: নিজের পরিচয়, পরিবার, ছবি দেখা ও প্রাক-লেখন আঁচড় (পৃষ্ঠা ১–২০)',
      'পার্ট ২: স্বরবর্ণ পরিচিতি, রং-আকৃতি ও ১–১০ গণনা (পৃষ্ঠা ২১–৪৪)',
      'পার্ট ৩: ব্যঞ্জনবর্ণ, ১১–২০ গণনা ও পরিচ্ছন্নতা-প্রস্তুতি (পৃষ্ঠা ৪৫–৬৪)'
    ),
    prepDescription: COMMON_PREP_BN,
    units: [
      { term: '১ম প্রান্তিক', chapter: 'পাঠ ১–৪: পরিচয়, গল্প শোনা ও প্রাক-লেখন', title: 'নিজের নাম ও পরিবার পরিচিতি, বড় ছবি দেখে বলা, সোজা-বাঁকা-গোল দাগ', pages: '১–২০', sessionsCount: 56 },
      { term: '২য় প্রান্তিক', chapter: 'পাঠ ৫–৮: স্বরবর্ণ (অ–ঔ), মৌলিক রং ও ১–১০ গণনা', title: 'ধ্বনি ও ছবির সাথে স্বরবর্ণ, লাল-নীল-হলুদ রং এবং বাস্তব উপকরণ গণনা', pages: '২১–৪৪', sessionsCount: 57 },
      { term: '৩য় প্রান্তিক', chapter: 'পাঠ ৯–১২: ব্যঞ্জনবর্ণ (ক–ন), ১১–২০ গণনা ও স্বাস্থ্যবিধি', title: 'বর্ণ-ছবি মেলানো, ১১–২০ গণনা, হাত ধোয়া ও ১ম শ্রেণির প্রস্তুতি', pages: '৪৫–৬৪', sessionsCount: 59 },
    ],
  },
  {
    classLevel: 'প্রাক-প্রাথমিক',
    subject: 'এসো লিখতে শিখি (অনুশীলন খাতা)',
    authorityNote: 'এনসিটিবি প্রাক-প্রাথমিক অনুশীলন নির্দেশিকা — ২০২৬',
    scheduledWeekdays: [0, 2, 4],
    durationMinutes: 30,
    termBanners: DEFAULT_TERM_BANNERS(
      'অনুশীলন ১–৩: পেন্সিল ধরা, রেখা যোগ ও রং করা',
      'অনুশীলন ৪–৬: স্বরবর্ণ, A–M ও ১–১০ সংখ্যা লিখন',
      'অনুশীলন ৭–৯: ব্যঞ্জনবর্ণ, N–Z, ১১–২০ ও মুক্ত অঙ্কন'
    ),
    prepDescription: COMMON_PREP_GENERAL('এসো লিখতে শিখি'),
    units: [
      { term: '১ম প্রান্তিক', chapter: 'অনুশীলন ১–৩: প্রাক-লেখন আঁচড় ও রং করা', title: 'মোটা পেন্সিল গ্রিপ, বিন্দু যোগে রেখা ও দাগের ভেতরে রং করা', pages: '১–১৬', sessionsCount: 33 },
      { term: '২য় প্রান্তিক', chapter: 'অনুশীলন ৪–৬: স্বরবর্ণ, A–M ও ১–১০ লেখা', title: 'বালির ট্রে ও অনুশীলন খাতায় তীরচিহ্ন ধরে বর্ণ ও সংখ্যা লেখা', pages: '১৭–৩৬', sessionsCount: 34 },
      { term: '৩য় প্রান্তিক', chapter: 'অনুশীলন ৭–৯: ব্যঞ্জনবর্ণ, N–Z ও ১১–২০ লেখা', title: 'অক্ষর ও সংখ্যা অনুশীলন এবং নিজের নাম ও ছবি আঁকা', pages: '৩৭–৫৬', sessionsCount: 35 },
    ],
  },
  {
    classLevel: 'প্রাক-প্রাথমিক',
    subject: 'ছড়া, গল্প ও খেলা নির্দেশিকা',
    authorityNote: 'এনসিটিবি প্রাক-প্রাথমিক সহায়ক নির্দেশিকা — ২০২৬',
    scheduledWeekdays: [1, 3],
    durationMinutes: 30,
    termBanners: DEFAULT_TERM_BANNERS(
      'পার্ট ১: সকালের সমাবেশ, পরিচিত ছড়া ও কল্পনা কর্নার',
      'পার্ট ২: নৈতিক গল্প, দেশীয় খেলা ও পাতা-কাগজের কোলাজ',
      'পার্ট ৩: কণ্ঠভিনয়, সৃজনশীল নাচ-গান ও প্রদর্শনী'
    ),
    prepDescription: COMMON_PREP_GENERAL('ছড়া, গল্প ও খেলা'),
    units: [
      { term: '১ম প্রান্তিক', chapter: 'সমাবেশ ও ছড়া: আয় আয় চাঁদ মামা, হাট্টিমাটিম টিম', title: 'সকালের ব্যায়াম, অঙ্গভঙ্গিসহ ছড়া আবৃত্তি ও ব্লক কর্নারের খেলা', pages: '১–১৫', sessionsCount: 22 },
      { term: '২য় প্রান্তিক', chapter: 'গল্প বলা ও দেশীয় খেলা: শিয়াল-কাক, রুমাল চোর', title: 'বড় বই থেকে গল্প শোনা, দলীয় খেলা ও শুকনো পাতার কোলাজ তৈরি', pages: '১৬–৩০', sessionsCount: 24 },
      { term: '৩য় প্রান্তিক', chapter: 'শিশু আনন্দমেলা ও সৃজনশীল পরিবেশনা', title: 'গল্প অভিনয়, দলগত গান ও প্রাক-প্রাথমিক সমাপনী প্রদর্শনী', pages: '৩১–৪৫', sessionsCount: 23 },
    ],
  },
];

// Helper generator for Religion, Health Education, and Art & Craft across Classes 1–5
function buildCoCurricularAndReligionSyllabi(): SubjectAnnualSyllabus[] {
  const classes = [
    {
      name: 'প্রথম শ্রেণি',
      levelLabel: '১ম',
      religionDays: [1, 4], // সোম ও বৃহঃ (সপ্তাহে ২ দিন)
      healthDays: [3], // বুধ (১ দিন)
      artDays: [2], // মঙ্গল (১ দিন)
    },
    {
      name: 'দ্বিতীয় শ্রেণি',
      levelLabel: '২য়',
      religionDays: [1, 4], // সোম ও বৃহঃ (সপ্তাহে ২ দিন)
      healthDays: [2], // মঙ্গল (১ দিন)
      artDays: [3], // বুধ (১ দিন)
    },
    {
      name: 'তৃতীয় শ্রেণি',
      levelLabel: '৩য়',
      religionDays: [0, 3, 4], // রবি, বুধ, বৃহঃ (সপ্তাহে ৩ দিন)
      healthDays: [2, 4], // মঙ্গল, বৃহঃ (সপ্তাহে ২ দিন)
      artDays: [1, 3], // সোম, বুধ (সপ্তাহে ২ দিন)
    },
    {
      name: 'চতুর্থ শ্রেণি',
      levelLabel: '৪র্থ',
      religionDays: [1, 2, 3], // সোম, মঙ্গল, বুধ (সপ্তাহে ৩ দিন)
      healthDays: [0, 4], // রবি, বৃহঃ (সপ্তাহে ২ দিন)
      artDays: [1, 2], // সোম, মঙ্গল (সপ্তাহে ২ দিন)
    },
    {
      name: 'পঞ্চম শ্রেণি',
      levelLabel: '৫ম',
      religionDays: [0, 2, 4], // রবি, মঙ্গল, বৃহঃ (সপ্তাহে ৩ দিন)
      healthDays: [3], // বুধ (সপ্তাহে ১ দিন)
      artDays: [2, 4], // মঙ্গল, বৃহঃ (সপ্তাহে ২ দিন)
    },
  ];
  const out: SubjectAnnualSyllabus[] = [];

  for (const cls of classes) {
    // ইসলাম শিক্ষা
    out.push({
      classLevel: cls.name,
      subject: 'ইসলাম শিক্ষা',
      authorityNote: `জাতীয় প্রাথমিক শিক্ষা একাডেমি (নেপ), ময়মনসিংহ — ${cls.levelLabel} শ্রেণি ২০২৬`,
      scheduledWeekdays: cls.religionDays,
      durationMinutes: 40,
      termBanners: DEFAULT_TERM_BANNERS(
        'প্রথম ও দ্বিতীয় অধ্যায় (স্রষ্টা ও সৃষ্টি, ইবাদত ও পবিত্রতা)',
        'তৃতীয় ও চতুর্থ অধ্যায় (আখলাক, সত্যবাদিতা ও কুরআন-সূরা শিক্ষা)',
        'পঞ্চম অধ্যায় ও পুনরালোচনা (নবি-রাসুলদের জীবনাদর্শ ও মানবসেবা)'
      ),
      prepDescription: COMMON_PREP_GENERAL('ইসলাম শিক্ষা'),
      units: [
        { term: '১ম প্রান্তিক', chapter: '১ম–২য় অধ্যায়: ইমান ও ইবাদত', title: 'মহান আল্লাহর পরিচয়, কালিমা, অজু-পবিত্রতা ও সালাতের গুরুত্ব', pages: '১–২৮', sessionsCount: 22 },
        { term: '২য় প্রান্তিক', chapter: '৩য়–৪র্থ অধ্যায়: আখলাক ও কুরআন শিক্ষা', title: 'সত্যবাদিতা, মাতা-পিতার প্রতি সম্মান, সহপাঠীর সাথে সদাচরণ ও ছোট সূরা', pages: '২৯–৫৬', sessionsCount: 23 },
        { term: '৩য় প্রান্তিক', chapter: '৫ম অধ্যায়: জীবনাদর্শ ও সম্প্রীতি', title: 'মহানবি (সা.)-এর আদর্শ, পরিবেশ-জীবজগতের প্রতি ভালোবাসা ও সমাপনী অনুশীলন', pages: '৫৭–৭৬', sessionsCount: 23 },
      ],
    });

    // হিন্দুধর্ম শিক্ষা
    out.push({
      classLevel: cls.name,
      subject: 'হিন্দুধর্ম শিক্ষা',
      authorityNote: `জাতীয় প্রাথমিক শিক্ষা একাডেমি (নেপ), ময়মনসিংহ — ${cls.levelLabel} শ্রেণি ২০২৬`,
      scheduledWeekdays: cls.religionDays,
      durationMinutes: 40,
      termBanners: DEFAULT_TERM_BANNERS(
        'প্রথম ও দ্বিতীয় অধ্যায় (স্রষ্টা, ধর্মগ্রন্থ ও আদর্শ জীবনচরিত)',
        'তৃতীয় ও চতুর্থ অধ্যায় (ধর্মীয় উৎসব, পূজা-পার্বণ ও নৈতিক শিক্ষা)',
        'পঞ্চম অধ্যায় ও পুনরালোচনা (সদাচার, পরোপকার ও পরিবেশ রক্ষা)'
      ),
      prepDescription: COMMON_PREP_GENERAL('হিন্দুধর্ম শিক্ষা'),
      units: [
        { term: '১ম প্রান্তিক', chapter: '১ম–২য় অধ্যায়: ঈশ্বর ও ধর্মগ্রন্থ পরিচয়', title: 'স্রষ্টার মহিমা, প্রার্থনা-শ্লোক ও মহাপুরুষ-মহীয়সী নারীর জীবনী', pages: '১–২৬', sessionsCount: 22 },
        { term: '২য় প্রান্তিক', chapter: '৩য়–৪র্থ অধ্যায়: পূজা-পার্বণ ও নৈতিক গুণাবলি', title: 'শারদীয় উৎসব, গুরুজনের প্রতি শ্রদ্ধা ও সত্য ও ন্যায়ের পথ অনুসরণ', pages: '২৭–৫৪', sessionsCount: 23 },
        { term: '৩য় প্রান্তিক', chapter: '৫ম অধ্যায়: সদাচার ও সামাজিক সম্প্রীতি', title: 'জীবের প্রতি দয়া, পরিচ্ছন্নতা ও সামগ্রিক পুনরালোচনা', pages: '৫৫–৭৪', sessionsCount: 22 },
      ],
    });

    // বৌদ্ধধর্ম শিক্ষা
    out.push({
      classLevel: cls.name,
      subject: 'বৌদ্ধধর্ম শিক্ষা',
      authorityNote: `জাতীয় প্রাথমিক শিক্ষা একাডেমি (নেপ), ময়মনসিংহ — ${cls.levelLabel} শ্রেণি ২০২৬`,
      scheduledWeekdays: cls.religionDays,
      durationMinutes: 40,
      termBanners: DEFAULT_TERM_BANNERS(
        'প্রথম ও দ্বিতীয় অধ্যায় (গৌতম বুদ্ধের জীবনী ও ত্রিশরণ বন্দনা)',
        'তৃতীয় ও চতুর্থ অধ্যায় (পঞ্চশীল, মৈত্রী-করুণা ও জাতকের গল্প)',
        'পঞ্চম অধ্যায় ও পুনরালোচনা (বৌদ্ধ উৎসব, অহিংসা ও সুশৃঙ্খল জীবন)'
      ),
      prepDescription: COMMON_PREP_GENERAL('বৌদ্ধধর্ম শিক্ষা'),
      units: [
        { term: '১ম প্রান্তিক', chapter: '১ম–২য় অধ্যায়: বুদ্ধ জীবনী ও ত্রিরত্ন', title: 'সিদ্ধার্থের শৈশব, বুদ্ধ-ধর্ম-সংঘ বন্দনা ও পঞ্চশীলের প্রাথমিক শিক্ষা', pages: '১–২৬', sessionsCount: 22 },
        { term: '২য় প্রান্তিক', chapter: '৩য়–৪র্থ অধ্যায়: জাতকের গল্প ও মৈত্রী ভাবনা', title: 'সকল প্রাণীর প্রতি দয়া, সত্য কথা বলা ও নৈতিক শিক্ষামূলক জাতক', pages: '২৭–৫৪', sessionsCount: 23 },
        { term: '৩য় প্রান্তিক', chapter: '৫ম অধ্যায়: পূর্ণিমা উৎসব ও কুশলকর্ম', title: 'বুদ্ধ পূর্ণিমা, প্রবারণা পূর্ণিমা ও মানবকল্যাণমূলক আচরণ অনুশীলন', pages: '৫৫–৭৪', sessionsCount: 23 },
      ],
    });

    // খ্রিষ্টধর্ম শিক্ষা
    out.push({
      classLevel: cls.name,
      subject: 'খ্রিষ্টধর্ম শিক্ষা',
      authorityNote: `জাতীয় প্রাথমিক শিক্ষা একাডেমি (নেপ), ময়মনসিংহ — ${cls.levelLabel} শ্রেণি ২০২৬`,
      scheduledWeekdays: cls.religionDays,
      durationMinutes: 40,
      termBanners: DEFAULT_TERM_BANNERS(
        'প্রথম ও দ্বিতীয় অধ্যায় (সৃষ্টিকর্তা ঈশ্বর ও যিশু খ্রিষ্টের শৈশব)',
        'তৃতীয় ও চতুর্থ অধ্যায় (ক্ষমা, ভালোবাসা ও প্রতিবেশীর সেবা)',
        'পঞ্চম অধ্যায় ও পুনরালোচনা (ধর্মীয় উৎসব, সৎ জীবন ও কৃতজ্ঞতা)'
      ),
      prepDescription: COMMON_PREP_GENERAL('খ্রিষ্টধর্ম শিক্ষা'),
      units: [
        { term: '১ম প্রান্তিক', chapter: '১ম–২য় অধ্যায়: ঈশ্বরের সৃষ্টি ও যিশুর শিক্ষা', title: 'প্রার্থনা, ঈশ্বরের ভালোবাসা ও যিশু খ্রিষ্টের শৈশব ও করুণা', pages: '১–২৫', sessionsCount: 22 },
        { term: '২য় প্রান্তিক', chapter: '৩য়–৪র্থ অধ্যায়: ক্ষমা, সহমর্মিতা ও সত্যবাদিতা', title: 'উত্তম শমরীয়ের উপমা, মাতা-পিতার বাধ্যতা ও শান্তি প্রতিষ্ঠা', pages: '২৬–৫২', sessionsCount: 23 },
        { term: '৩য় প্রান্তিক', chapter: '৫ম অধ্যায়: বড়দিন, ইস্টার ও মানবসেবা', title: 'সৃষ্টি ও প্রকৃতির যত্ন, কৃতজ্ঞতা প্রকাশ ও বার্ষিক পুনরালোচনা', pages: '৫৩–৭২', sessionsCount: 23 },
      ],
    });

    // শারীরিক ও মানসিক স্বাস্থ্য শিক্ষা
    out.push({
      classLevel: cls.name,
      subject: 'শারীরিক ও মানসিক স্বাস্থ্য শিক্ষা',
      authorityNote: `জাতীয় প্রাথমিক শিক্ষা একাডেমি (নেপ), ময়মনসিংহ — ${cls.levelLabel} শ্রেণি ২০২৬`,
      scheduledWeekdays: cls.healthDays,
      durationMinutes: 35,
      termBanners: DEFAULT_TERM_BANNERS(
        '১ম প্রান্তিক: প্রাত্যহিক সমাবেশ, পিটি, দেহভঙ্গি ও ব্যক্তিগত পরিচ্ছন্নতা',
        '২য় প্রান্তিক: দলীয় খেলাধুলা, মানসিক প্রশান্তি ও পুষ্টিকর খাদ্যাভ্যাস',
        '৩য় প্রান্তিক: প্রাথমিক চিকিৎসা, নিরাপদ ক্রীড়া ও বার্ষিক ক্রীড়া প্রস্তুতি'
      ),
      prepDescription: COMMON_PREP_GENERAL('শারীরিক ও মানসিক স্বাস্থ্য শিক্ষা'),
      units: [
        { term: '১ম প্রান্তিক', chapter: 'অংশ ১: প্রাত্যহিক সমাবেশ ও পিটি (১–৬)', title: 'সঠিক দেহভঙ্গিতে দাঁড়ানো, শপথ, জাতীয় সংগীত ও হাত-পায়ের ব্যায়াম', pages: '১–২০', sessionsCount: 11 },
        { term: '২য় প্রান্তিক', chapter: 'অংশ ২: দেশীয় খেলা ও মানসিক স্বাস্থ্য', title: 'কানামাছি, গোল্লাছুট, দৌড়-ঝাঁপ, রাগ নিয়ন্ত্রণ ও বন্ধুত্বপূর্ণ আচরণ', pages: '২১–৪২', sessionsCount: 11 },
        { term: '৩য় প্রান্তিক', chapter: 'অংশ ৩: নিরাপদ আচরণ ও প্রাথমিক স্বাস্থ্যরক্ষা', title: 'ছোট আঘাতে প্রাথমিক যত্ন, বিশ্রাম-ঘুম ও ক্রীড়ানৈপুণ্য প্রদর্শন', pages: '৪৩–৬০', sessionsCount: 11 },
      ],
    });

    // শিল্পকলা
    out.push({
      classLevel: cls.name,
      subject: 'শিল্পকলা',
      authorityNote: `জাতীয় প্রাথমিক শিক্ষা একাডেমি (নেপ), ময়মনসিংহ — ${cls.levelLabel} শ্রেণি ২০২৬`,
      scheduledWeekdays: cls.artDays,
      durationMinutes: 35,
      termBanners: DEFAULT_TERM_BANNERS(
        '১ম প্রান্তিক: চারু ও কারুকলা (রেখা, আকৃতি, প্রাকৃতিক ছবি অঙ্কন)',
        '২য় প্রান্তিক: সংগীত ও নৃত্যকলা (দেশাত্মবোধক গান ও ছন্দ-তাল)',
        '৩য় প্রান্তিক: কাগজের কারুকাজ, মাটির মডেল ও নাট্যকলা অভিনয়'
      ),
      prepDescription: COMMON_PREP_GENERAL('শিল্পকলা'),
      units: [
        { term: '১ম প্রান্তিক', chapter: 'ইউনিট ১: চারু ও কারুকলা — রঙ ও রেখার খেলা', title: 'জাতীয় পতাকা, শাপলা ফুল, ফল-সবজি ও গ্রামের দৃশ্য অঙ্কন-রঙ করা', pages: '১–২৪', sessionsCount: 12 },
        { term: '২য় প্রান্তিক', chapter: 'ইউনিট ২: সংগীত ও নৃত্যকলা অনুশীলন', title: 'জাতীয় সংগীত, রবীন্দ্র-নজরুল ও লোকগীতির তাল-সুর এবং সহজ ছন্দ', pages: '২৫–৪৮', sessionsCount: 11 },
        { term: '৩য় প্রান্তিক', chapter: 'ইউনিট ৩: কারুশিল্প ও নাট্যকলা', title: 'কাগজের নৌকা/ফুল, মাটির খেলনা তৈরি ও গল্পভিত্তিক ছোট নাট্যাভিনয়', pages: '৪৯–৭২', sessionsCount: 12 },
      ],
    });
  }

  return out;
}

const ALL_SYLLABI: SubjectAnnualSyllabus[] = [
  ...ANNUAL_SUBJECT_SYLLABI_2026,
  ...buildCoCurricularAndReligionSyllabi(),
];

export function getSubjectAnnualSyllabus(
  classLevel: string,
  subject: string
): SubjectAnnualSyllabus | undefined {
  return ALL_SYLLABI.find((s) => s.classLevel === classLevel && s.subject === subject);
}

const scheduleCache = new Map<string, DateWisePlanRow[]>();

export interface BuildDateWiseScheduleResult {
  year: number;
  syllabus: SubjectAnnualSyllabus | undefined;
  localizedAuthorityNote: string;
  termDateLabels: Record<TermKey, string>;
  rows: DateWisePlanRow[];
  totalWorkingDays: number;
  totalSubjectSessions: number;
}

export function buildDateWiseSchedule(
  classLevel: string,
  subject: string,
  year: number = 2026
): BuildDateWiseScheduleResult {
  const safeYear = clampPlanYear(year);
  const yearBn = toBanglaDigit(safeYear);
  const calMeta = buildCalendarMetaForYear(safeYear);
  const baseSyllabus = getSubjectAnnualSyllabus(classLevel, subject);

  const termDateLabels: Record<TermKey, string> = {
    '১ম প্রান্তিক': `০১ জানুয়ারি – ${formatIsoShortBn(calMeta.term1EndIso)}`,
    '২য় প্রান্তিক': `${formatIsoShortBn(calMeta.term2StartIso)} – ${formatIsoShortBn(calMeta.term2EndIso)}`,
    '৩য় প্রান্তিক': `${formatIsoShortBn(calMeta.term3StartIso)} – ৩১ ডিসেম্বর`,
  };

  if (!baseSyllabus) {
    return {
      year: safeYear,
      syllabus: undefined,
      localizedAuthorityNote: `জাতীয় প্রাথমিক শিক্ষা একাডেমি (নেপ) কাঠামো — ${yearBn}`,
      termDateLabels,
      rows: [],
      totalWorkingDays: calMeta.totalWorkingDays,
      totalSubjectSessions: 0,
    };
  }

  const localizedAuthorityNote = baseSyllabus.authorityNote.replace(/২০২৬/g, yearBn);
  const syllabus: SubjectAnnualSyllabus =
    safeYear === 2026
      ? baseSyllabus
      : {
          ...baseSyllabus,
          authorityNote: localizedAuthorityNote,
          termBanners: {
            '১ম প্রান্তিক': baseSyllabus.termBanners['১ম প্রান্তিক'].replace(/২০২৬/g, yearBn),
            '২য় প্রান্তিক': baseSyllabus.termBanners['২য় প্রান্তিক'].replace(/২০২৬/g, yearBn),
            '৩য় প্রান্তিক': baseSyllabus.termBanners['৩য় প্রান্তিক'].replace(/২০২৬/g, yearBn),
          },
        };

  const cacheKey = `${safeYear}__${classLevel}__${subject}`;
  const cached = scheduleCache.get(cacheKey);
  if (cached) {
    const totalSubjectSessions = cached.filter(
      (r) => r.dayType === 'preparatory' || (r.dayType === 'teaching' && r.isScheduledForSubject)
    ).length;
    return {
      year: safeYear,
      syllabus,
      localizedAuthorityNote,
      termDateLabels,
      rows: cached,
      totalWorkingDays: calMeta.totalWorkingDays,
      totalSubjectSessions,
    };
  }

  const isDailyCoreSubject = syllabus.scheduledWeekdays.length === 5;
  const yearDays = calMeta.days;
  const firstPrepDayIso =
    yearDays.find((d) => d.dayType === 'preparatory')?.isoDate || `${safeYear}-01-01`;

  // Group scheduled teaching dates per term
  const teachingDaysByTerm: Record<TermKey, CalendarDay2026[]> = {
    '১ম প্রান্তিক': [],
    '২য় প্রান্তিক': [],
    '৩য় প্রান্তিক': [],
  };
  const prepDays: CalendarDay2026[] = [];

  for (const day of yearDays) {
    if (day.dayType === 'preparatory') {
      if (
        day.isoDate === firstPrepDayIso ||
        isDailyCoreSubject ||
        syllabus.scheduledWeekdays.includes(day.weekdayIdx)
      ) {
        prepDays.push(day);
      }
    } else if (day.dayType === 'teaching') {
      if (syllabus.scheduledWeekdays.includes(day.weekdayIdx)) {
        teachingDaysByTerm[day.term].push(day);
      }
    }
  }

  // Assign a lesson entry to every scheduled teaching day in each term
  interface AssignedLesson {
    chapterTitle: string;
    topicDetail: string;
    pageNumber: string;
    sessionNum: number;
  }

  const assignedByIso = new Map<string, AssignedLesson>();
  let runningSession = 0;

  // Assign Prep Phase (Jan 1 – Jan 13)
  let prepCount = 0;
  for (const day of prepDays) {
    if (day.isoDate === firstPrepDayIso) {
      const info = syllabus.prepDescription(0, day.isoDate);
      assignedByIso.set(day.isoDate, {
        chapterTitle: 'শুভেচ্ছা বিনিময় ও পাঠ্যবই বিতরণ',
        topicDetail: info.topic,
        pageNumber: info.pages,
        sessionNum: 0,
      });
    } else {
      prepCount += 1;
      runningSession += 1;
      const info = syllabus.prepDescription(prepCount, day.isoDate);
      assignedByIso.set(day.isoDate, {
        chapterTitle: 'প্রস্তুতিমূলক পাঠ (পঠন ও লিখন দক্ষতা উন্নয়ন)',
        topicDetail: info.topic,
        pageNumber: info.pages,
        sessionNum: runningSession,
      });
    }
  }

  // Distribute Units smoothly across each Term's teaching days
  (['১ম প্রান্তিক', '২য় প্রান্তিক', '৩য় প্রান্তিক'] as TermKey[]).forEach((termKey) => {
    const termDays = teachingDaysByTerm[termKey];
    const termUnits = syllabus.units.filter((u) => u.term === termKey);
    if (termDays.length === 0 || termUnits.length === 0) return;

    const totalUnitWeight = termUnits.reduce((acc, u) => acc + Math.max(1, u.sessionsCount), 0);
    // Reserve last 2 days of each term for পুনরালোচনা / মূল্যায়ন ও ফলাবর্তন if termDays > 5
    const reviewSlots = termDays.length >= 8 ? 2 : termDays.length >= 4 ? 1 : 0;
    const lessonSlotsCount = termDays.length - reviewSlots;

    // Allocate day counts proportionally to unit weights
    const allocatedCounts = termUnits.map((u) =>
      Math.max(1, Math.floor((u.sessionsCount / totalUnitWeight) * lessonSlotsCount))
    );
    let currentSum = allocatedCounts.reduce((a, b) => a + b, 0);
    let idx = 0;
    while (currentSum < lessonSlotsCount) {
      allocatedCounts[idx % allocatedCounts.length] += 1;
      currentSum += 1;
      idx += 1;
    }
    while (currentSum > lessonSlotsCount && allocatedCounts.some((c) => c > 1)) {
      const maxIdx = allocatedCounts.indexOf(Math.max(...allocatedCounts));
      allocatedCounts[maxIdx] -= 1;
      currentSum -= 1;
    }

    let dayCursor = 0;
    termUnits.forEach((unit, uIdx) => {
      const count = allocatedCounts[uIdx];
      for (let part = 1; part <= count && dayCursor < lessonSlotsCount; part++) {
        const day = termDays[dayCursor];
        dayCursor += 1;
        runningSession += 1;
        const partLabel =
          count === 1
            ? unit.title
            : part === count && count >= 3
            ? `${unit.title} — অনুশীলন ও পুনরালোচনা`
            : `${unit.title} (পর্ব-${toBanglaDigit(part)}/${toBanglaDigit(count)})`;

        assignedByIso.set(day.isoDate, {
          chapterTitle: unit.chapter,
          topicDetail: partLabel,
          pageNumber: unit.pages,
          sessionNum: runningSession,
        });
      }
    });

    // Review / Feedback days right before Term Exam
    for (let r = dayCursor; r < termDays.length; r++) {
      const day = termDays[r];
      runningSession += 1;
      const isLast = r === termDays.length - 1;
      assignedByIso.set(day.isoDate, {
        chapterTitle: `${termKey} পুনরালোচনা`,
        topicDetail: isLast
          ? `${termKey} মূল্যায়ন/ফিডব্যাক ও প্রস্তুতি`
          : `${termKey} সিলেবাসের সার্বিক পুনরালোচনা ও সংশোধনমূলক কাজ`,
        pageNumber: termUnits[termUnits.length - 1]?.pages || '',
        sessionNum: runningSession,
      });
    }
  });

  // Precompute monthly working day counts & monthly subject class counts
  const monthWorkingDays = new Array(12).fill(0);
  const monthSubjectClasses = new Array(12).fill(0);

  for (const day of yearDays) {
    const isWorking =
      day.dayType === 'preparatory' ||
      day.dayType === 'teaching' ||
      day.dayType === 'exam' ||
      day.dayType === 'survey_result';
    if (isWorking) {
      monthWorkingDays[day.monthIndex] += 1;
    }
    if (assignedByIso.has(day.isoDate) && (assignedByIso.get(day.isoDate)?.sessionNum || 0) > 0) {
      monthSubjectClasses[day.monthIndex] += 1;
    }
  }

  let seenTerm2Banner = false;
  let seenTerm3Banner = false;
  let prevMonth = -1;

  const rows: DateWisePlanRow[] = yearDays.map((day) => {
    const isFirstDayOfMonth = day.monthIndex !== prevMonth;
    prevMonth = day.monthIndex;

    let termBannerBefore: string | undefined;
    if (day.sl === 1) {
      termBannerBefore = syllabus.termBanners['১ম প্রান্তিক'];
    } else if (!seenTerm2Banner && day.term === '২য় প্রান্তিক') {
      seenTerm2Banner = true;
      termBannerBefore = syllabus.termBanners['২য় প্রান্তিক'];
    } else if (!seenTerm3Banner && day.term === '৩য় প্রান্তিক') {
      seenTerm3Banner = true;
      termBannerBefore = syllabus.termBanners['৩য় প্রান্তিক'];
    }

    const assigned = assignedByIso.get(day.isoDate);
    let sessionLabel = '';
    let chapterTitle = '';
    let topicDetail = '';
    let pageNumber = '';
    let isScheduledForSubject = false;

    if (day.dayType === 'weekly_holiday' || day.dayType === 'govt_holiday') {
      topicDetail = day.holidayOrActivity || 'সরকারি ছুটি';
    } else if (day.dayType === 'exam') {
      sessionLabel =
        day.term === '১ম প্রান্তিক'
          ? 'প্রথম প্রান্তিক মূল্যায়ন'
          : day.term === '২য় প্রান্তিক'
          ? 'দ্বিতীয় প্রান্তিক মূল্যায়ন'
          : 'তৃতীয় প্রান্তিক মূল্যায়ন';
      topicDetail = day.holidayOrActivity || 'পরীক্ষা';
    } else if (day.dayType === 'survey_result') {
      topicDetail = day.holidayOrActivity || 'শিশু জরিপ / ফলাফল';
    } else if (assigned) {
      isScheduledForSubject = true;
      if (assigned.sessionNum === 0) {
        sessionLabel = 'বই বিতরণ';
      } else {
        sessionLabel = `সেশন-${toBanglaDigit(assigned.sessionNum)}`;
      }
      chapterTitle = assigned.chapterTitle;
      topicDetail = assigned.topicDetail;
      pageNumber = assigned.pageNumber;
    } else {
      // Working day when this subject does not have a routine slot (marked × in NAPE plan)
      sessionLabel = '—';
      topicDetail = '× (রুটিন অনুযায়ী অন্য বিষয়ের পাঠদান)';
    }

    const remark = isFirstDayOfMonth
      ? `মোট কর্মদিবস ${toBanglaDigit(monthWorkingDays[day.monthIndex])} দিন; ${subject} ক্লাস ${toBanglaDigit(monthSubjectClasses[day.monthIndex])}টি`
      : '';

    return {
      id: `${classLevel}__${subject}__${day.isoDate}`,
      sl: day.sl,
      isoDate: day.isoDate,
      dateBn: day.dateBn,
      monthIndex: day.monthIndex,
      monthNameBn: day.monthNameBn,
      monthShortLabel: day.monthShortLabel,
      weekdayIdx: day.weekdayIdx,
      weekdayBn: day.weekdayBn,
      term: day.term,
      dayType: day.dayType,
      isScheduledForSubject,
      sessionLabel,
      chapterTitle,
      topicDetail,
      pageNumber,
      remark,
      monthTotalWorkingDays: monthWorkingDays[day.monthIndex],
      monthTotalSubjectClasses: monthSubjectClasses[day.monthIndex],
      isFirstDayOfMonth,
      termBannerBefore,
    };
  });

  scheduleCache.set(cacheKey, rows);

  return {
    year: safeYear,
    syllabus,
    localizedAuthorityNote,
    termDateLabels,
    rows,
    totalWorkingDays: calMeta.totalWorkingDays,
    totalSubjectSessions: runningSession,
  };
}

export function buildDailyLessonPlanFromRow(
  row: DateWisePlanRow,
  classLevel: string,
  subject: string,
  durationMinutes = 40
): LessonPlanItem {
  const isEnglish = subject === 'English for Today';
  return {
    id: `dw-daily-${row.id}`,
    classLevel,
    subject,
    term: row.term,
    partLabel: row.term === '১ম প্রান্তিক' ? 'পার্ট ১' : row.term === '২য় প্রান্তিক' ? 'পার্ট ২' : 'পার্ট ৩',
    chapter: `${row.chapterTitle || subject} (${row.dateBn}, ${row.weekdayBn}${row.pageNumber ? ` · পৃষ্ঠা: ${row.pageNumber}` : ''})`,
    lessonTitle: `${row.sessionLabel ? `${row.sessionLabel}: ` : ''}${row.topicDetail}`,
    duration: `${toBanglaDigit(durationMinutes)} মিনিট`,
    learningOutcomes: isEnglish
      ? [
          `Students will be able to understand and practice "${row.topicDetail}" accurately.`,
          'Students will participate actively in pair/group work and oral-written activities.',
        ]
      : [
          `"${row.topicDetail}" বিষয়ের মূল ধারণা স্পষ্টভাবে বুঝতে ও বলতে পারবে।`,
          `পাঠ্যবইয়ের (${row.pageNumber || 'নির্ধারিত'} পৃষ্ঠা) সংশ্লিষ্ট কাজ ও অনুশীলনী সঠিকভাবে সম্পন্ন করতে পারবে।`,
        ],
    materials: [
      `${subject} পাঠ্যবই (${classLevel})`,
      'শিক্ষক সহায়িকা (TG)',
      'ফ্ল্যাশকার্ড / চার্ট / বাস্তব উপকরণ',
      'চক, ডাস্টার ও বোর্ড',
    ],
    warmUp: isEnglish
      ? 'Greeting students warmly, checking prior knowledge through 2–3 quick questions and a short rhyme/action song.'
      : 'শিক্ষার্থীদের সাথে কুশল বিনিময়, পরিচিত ছড়া/গল্প ও পূর্বদিনের পাঠের ওপর ২–৩টি প্রশ্নের মাধ্যমে পূর্বজ্ঞান যাচাই।',
    presentation: isEnglish
      ? [
          `Introduce today's lesson (${row.chapterTitle}) on page ${row.pageNumber || 'relevant page'} clearly with visual aids.`,
          `Demonstrate pronunciation/concept step by step: ${row.topicDetail}.`,
          'Conduct pair work and small-group guided practice while monitoring slow learners.',
        ]
      : [
          `বাস্তব ও অর্ধবাস্তব (ছবি/চার্ট) উপকরণের সাহায্যে "${row.chapterTitle || subject}" পাঠটি উপস্থাপন।`,
          `পাঠ্যবইয়ের ${row.pageNumber ? `${row.pageNumber} নং` : 'নির্ধারিত'} পৃষ্ঠা খুলে শিক্ষক আদর্শ পাঠ/সমাধান প্রদর্শন করবেন: ${row.topicDetail}।`,
          'জোড়ায় ও ছোট দলে শিক্ষার্থীদের অনুশীলনের সুযোগ দিয়ে ঘুরে ঘুরে ফিডব্যাক প্রদান।',
        ],
    evaluation: isEnglish
      ? [
          'Ask 3–4 students randomly to read/answer orally from today’s activity.',
          'Check written classwork of at least 5 students and provide immediate corrective feedback.',
        ]
      : [
          'দৈবচয়নে ৩–৪ জন শিক্ষার্থীকে পাঠের মূল অংশ মৌখিকভাবে বলতে/পড়তে বলা।',
          'খাতায় বা বোর্ডে নির্ধারিত সংক্ষিপ্ত কাজ লিখিয়ে সঠিকতা যাচাই ও ফলাবর্তন দেওয়া।',
        ],
    homework: isEnglish
      ? `Practice today's lesson (${row.topicDetail}, page ${row.pageNumber || 'textbook'}) cleanly in the notebook at home.`
      : `বাড়ি থেকে "${row.topicDetail}" অংশটি (পৃষ্ঠা: ${row.pageNumber || 'নির্ধারিত'}) ভালোভাবে পড়ে ও অনুশীলনী খাতায় লিখে আনবে।`,
  };
}
