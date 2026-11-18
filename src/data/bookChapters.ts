import { ANNUAL_LESSON_PLANS } from './annualLessonPlans';
import { NCTB_LIBRARY, NctbBookEntry } from './nctbLibrary';
import { LessonPlanItem } from '../types';

export interface BookChapterItem {
  id: string;
  bookId: string;
  chapterNumber: number;
  title: string;
  termLabel: '১ম প্রান্তিক' | '২য় প্রান্তিক' | '৩য় প্রান্তিক';
  termWindow: string;
  duration: string;
  bookSummary: string;
  learningOutcomes: string[];
  warmUp: string;
  teacherGuideSteps: string[];
  teachingMaterials: string[];
  evaluationPoints: string[];
  homework: string;
}

export interface ChapterOrganizedBook {
  entry: NctbBookEntry;
  chapters: BookChapterItem[];
}

function normalizeText(str: string): string {
  return str
    .replace(/অধ্যায়\s*[০-৯0-9]+[:ঃ।\-\s]*/gi, '')
    .replace(/পাঠ\s*[০-৯0-9–\-]+[:ঃ।\-\s]*/gi, '')
    .replace(/Unit\s*[0-9–\-]+[:ঃ।\-\s]*/gi, '')
    .replace(/[()[\].,।:ঃ\-–]/g, ' ')
    .trim()
    .toLowerCase();
}

function matchLessonPlan(
  chapterTitle: string,
  plans: LessonPlanItem[],
  partIndex: number
): LessonPlanItem | undefined {
  if (plans.length === 0) return undefined;
  const cleanChapter = normalizeText(chapterTitle);
  const words = cleanChapter.split(/\s+/).filter((w) => w.length >= 2);

  let bestMatch: LessonPlanItem | undefined;
  let bestScore = 0;

  for (const plan of plans) {
    const planText = normalizeText(`${plan.chapter} ${plan.lessonTitle}`);
    let score = 0;
    for (const w of words) {
      if (planText.includes(w)) {
        score += w.length;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = plan;
    }
  }

  if (bestMatch && bestScore >= 4) return bestMatch;

  // Fallback by term alignment if fuzzy text match had no strong token hit
  const termName =
    partIndex === 0 ? '১ম প্রান্তিক' : partIndex === 1 ? '২য় প্রান্তিক' : '৩য় প্রান্তিক';
  const termPlans = plans.filter((p) => p.term === termName);
  return termPlans[0];
}

function deriveTermLabel(partNumber: 1 | 2 | 3): '১ম প্রান্তিক' | '২য় প্রান্তিক' | '৩য় প্রান্তিক' {
  if (partNumber === 1) return '১ম প্রান্তিক';
  if (partNumber === 2) return '২য় প্রান্তিক';
  return '৩য় প্রান্তিক';
}

export function buildChaptersForBook(entry: NctbBookEntry): BookChapterItem[] {
  const subjectPlans = ANNUAL_LESSON_PLANS.filter(
    (p) => p.classLevel === entry.classLevel && p.subject === entry.subject
  );

  const chapters: BookChapterItem[] = [];
  let runningNum = 1;

  entry.parts.forEach((part, partIdx) => {
    const termLabel = deriveTermLabel(part.partNumber);
    part.chapters.forEach((rawTitle) => {
      const matchedPlan = matchLessonPlan(rawTitle, subjectPlans, partIdx);
      chapters.push({
        id: `${entry.id}-ch-${runningNum}`,
        bookId: entry.id,
        chapterNumber: runningNum,
        title: rawTitle,
        termLabel,
        termWindow: part.termWindow,
        duration: matchedPlan?.duration || (entry.classLevel === 'প্রাক-প্রাথমিক' ? '৩০ মিনিট' : '৪০ মিনিট'),
        bookSummary: matchedPlan
          ? `${matchedPlan.lessonTitle} — ${part.bookSummary}`
          : part.bookSummary,
        learningOutcomes:
          matchedPlan && matchedPlan.learningOutcomes.length > 0
            ? matchedPlan.learningOutcomes
            : [part.assessmentFocus],
        warmUp:
          matchedPlan?.warmUp ||
          'শিক্ষার্থীদের সাথে কুশল বিনিময় এবং ছবি বা বাস্তব প্রশ্নের মাধ্যমে পূর্বজ্ঞান যাচাই।',
        teacherGuideSteps:
          matchedPlan && matchedPlan.presentation.length > 0
            ? [...matchedPlan.presentation, ...part.teacherGuideSteps.slice(0, 2)]
            : part.teacherGuideSteps,
        teachingMaterials:
          matchedPlan && matchedPlan.materials.length > 0
            ? Array.from(new Set([...matchedPlan.materials, ...part.teachingMaterials]))
            : part.teachingMaterials,
        evaluationPoints:
          matchedPlan && matchedPlan.evaluation.length > 0
            ? matchedPlan.evaluation
            : [part.assessmentFocus],
        homework:
          matchedPlan?.homework ||
          'পাঠ্যবইয়ের অনুশীলনীর কাজ খাতায় সুন্দরভাবে অনুশীলন করে আনবে।',
      });
      runningNum += 1;
    });
  });

  return chapters;
}

export const CHAPTER_ORGANIZED_BOOKS: ChapterOrganizedBook[] = NCTB_LIBRARY.map((entry) => ({
  entry,
  chapters: buildChaptersForBook(entry),
}));

export const TOTAL_BOOK_CHAPTERS = CHAPTER_ORGANIZED_BOOKS.reduce(
  (sum, item) => sum + item.chapters.length,
  0
);
