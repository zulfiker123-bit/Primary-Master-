import { LessonPlanItem, QuestionItem } from '../types';
import { ANNUAL_LESSON_PLANS } from './annualLessonPlans';
import { QUESTION_BANK_PP_TO_2 } from './questionBankPrePrimaryTo2';
import { QUESTION_BANK_CLASS_3_4 } from './questionBankClass3And4';
import { QUESTION_BANK_CLASS_5 } from './questionBankClass5';
import { QUESTION_BANK_EXTRA_CURATED } from './questionBankExtraCurated';
import { QUESTION_BANK_COMPLETE_COVERAGE } from './questionBankCompleteCoverage';
import { QUESTION_BANK_ENRICHED_MASTERY } from './questionBankEnrichedMastery';

const HANDCRAFTED_BANK: QuestionItem[] = [
  ...QUESTION_BANK_PP_TO_2,
  ...QUESTION_BANK_CLASS_3_4,
  ...QUESTION_BANK_CLASS_5,
  ...QUESTION_BANK_EXTRA_CURATED,
  ...QUESTION_BANK_COMPLETE_COVERAGE,
  ...QUESTION_BANK_ENRICHED_MASTERY,
];

function cleanEvalQuestion(raw: string): string {
  return raw.replace(/^\d+[।.)]\s*/, '').trim();
}

/**
 * প্রতিটি বার্ষিক পাঠ পরিকল্পনার (১৭৯টি অধ্যায়/পাঠ) শিখনফল, মূল পাঠ ও মূল্যায়ন থেকে
 * পাঠভিত্তিক নির্ভুল প্রশ্ন তৈরি করে প্রশ্ন ভান্ডারের সাথে সমন্বয় করে—যাতে প্রাক-প্রাথমিক থেকে ৫ম
 * শ্রেণির কোনো অধ্যায় বা পাঠই প্রশ্ন ও সাজেশন থেকে বাদ না পড়ে।
 */
function buildCurriculumAlignedQuestions(plans: LessonPlanItem[]): QuestionItem[] {
  const derived: QuestionItem[] = [];

  plans.forEach((plan) => {
    const isPP = plan.classLevel === 'প্রাক-প্রাথমিক';
    const isEnglish = plan.subject === 'English for Today';
    const isMath = plan.subject === 'প্রাথমিক গণিত';
    const outcomesAnswer = plan.learningOutcomes.join(' ');
    const presentationSummary = plan.presentation.slice(0, 2).join(' ');

    // ১) পাঠ পরিকল্পনার প্রতিটি মূল্যায়ন আইটেম -> সংক্ষিপ্ত / যোগ্যতাভিত্তিক প্রশ্ন
    plan.evaluation.forEach((ev, idx) => {
      const qText = cleanEvalQuestion(ev);
      if (!qText || qText.length < 8) return;
      derived.push({
        id: `lpq-${plan.id}-ev-${idx + 1}`,
        classLevel: plan.classLevel,
        subject: plan.subject,
        term: plan.term,
        chapter: plan.chapter,
        type: idx === 0 && !isPP ? 'সংক্ষিপ্ত প্রশ্ন' : 'রচনামূলক প্রশ্ন',
        subCategory: isPP
          ? 'মৌখিক ও পর্যবেক্ষণ'
          : isEnglish
          ? 'Lesson Plan Q&A'
          : 'পাঠ পরিকল্পনা মূল্যায়ন',
        marks: isPP ? 5 : idx === 0 ? 5 : 10,
        question: qText,
        answer:
          presentationSummary ||
          outcomesAnswer ||
          `"${plan.lessonTitle}" পাঠের আলোকে শিক্ষার্থীরা উত্তর উপস্থাপন করবে।`,
      });
    });

    // ২) প্রতিটি পাঠের প্রধান শিখনফল -> কাঠামোবদ্ধ / বর্ণনামূলক সাজেশন প্রশ্ন
    const firstOutcome = plan.learningOutcomes[0];
    if (firstOutcome) {
      const cleanOutcome = firstOutcome.replace(/পারবে।?$/, '').trim();
      const questionText = isPP
        ? `(মৌখিক ও কর্মভিত্তিক) "${plan.chapter}" — শিশু ${cleanOutcome} কি না তা ক্লাসে যাচাই করো।`
        : isEnglish
        ? `Based on "${plan.chapter}" (${plan.lessonTitle}), write 4–5 key sentences or answers showing: ${cleanOutcome}.`
        : isMath
        ? `পাঠভিত্তিক যোগ্যতাভিত্তিক সমস্যা (${plan.chapter}): উদাহরণসহ ব্যাখ্যা ও সমাধান করো যেভাবে ${cleanOutcome} যায়।`
        : `"${plan.chapter}" পাঠের আলোকে বর্ণনা করো কীভাবে ${cleanOutcome} যায়।`;

      derived.push({
        id: `lpq-${plan.id}-lo`,
        classLevel: plan.classLevel,
        subject: plan.subject,
        term: plan.term,
        chapter: plan.chapter,
        type: 'রচনামূলক প্রশ্ন',
        subCategory: isPP
          ? 'পাঠ পরিকল্পনা পর্যবেক্ষণ'
          : isEnglish
          ? 'Competency Writing'
          : 'যোগ্যতাভিত্তিক সাজেশন',
        marks: 10,
        question: questionText,
        answer: `${plan.learningOutcomes.join(' ')} (${presentationSummary})`,
      });
    }

    // ৩) প্রতিটি পাঠের মূল ধারণা থেকে শূন্যস্থান / বহুনির্বাচনি (প্রাথমিক প্রস্তুতি)
    const warmUpClean = plan.warmUp?.trim();
    if (warmUpClean && warmUpClean.length > 10 && !isPP) {
      derived.push({
        id: `lpq-${plan.id}-wu`,
        classLevel: plan.classLevel,
        subject: plan.subject,
        term: plan.term,
        chapter: plan.chapter,
        type: 'সংক্ষিপ্ত প্রশ্ন',
        subCategory: isEnglish ? 'Warm-up / Oral Check' : 'পূর্বজ্ঞান ও সংক্ষিপ্ত যাচাই',
        marks: 5,
        question: isEnglish
          ? `Short Check (${plan.chapter}): ${warmUpClean}`
          : `${warmUpClean.endsWith('?') || warmUpClean.endsWith('।') ? warmUpClean : `${warmUpClean} — সংক্ষেপে উত্তর দাও।`}`,
        answer: outcomesAnswer || presentationSummary,
      });
    }

    // ৪) প্রতিটি পাঠের বাড়ির কাজ (Homework) -> অনুশীলন ও লিখিত সাজেশন
    const hwClean = plan.homework?.trim();
    if (hwClean && hwClean.length > 10) {
      derived.push({
        id: `lpq-${plan.id}-hw`,
        classLevel: plan.classLevel,
        subject: plan.subject,
        term: plan.term,
        chapter: plan.chapter,
        type: isPP ? 'সংক্ষিপ্ত প্রশ্ন' : 'রচনামূলক প্রশ্ন',
        subCategory: 'বাড়ির কাজ ও অনুশীলনী',
        marks: isPP ? 5 : 10,
        question: hwClean,
        answer: `${plan.lessonTitle} — ${outcomesAnswer}`,
      });
    }
  });

  return derived;
}

const DERIVED_LP_QUESTIONS = buildCurriculumAlignedQuestions(ANNUAL_LESSON_PLANS);

export const RICH_QUESTION_BANK: QuestionItem[] = [
  ...HANDCRAFTED_BANK,
  ...DERIVED_LP_QUESTIONS,
];
