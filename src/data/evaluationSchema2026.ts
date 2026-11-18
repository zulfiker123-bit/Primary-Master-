import { EvaluationRecord, QuestionItem, SubjectAssessmentDetail } from '../types';

export type CaPartKey = 'textbookWork' | 'classActivity' | 'comprehension' | 'classTest';

export interface CaPartSchema {
  key: CaPartKey;
  code: string;
  label: string;
  max: number;
  note?: string;
}

export interface SaPartSchema {
  id: string;
  title: string;
  questionType: QuestionItem['type'];
  maxMarks: number;
  competencyNote: string;
}

export interface SubjectEvalSchema2026 {
  id: string;
  name: string;
  shortName: string;
  legacyAliases: string[];
  legacyField?: 'bangla' | 'english' | 'math' | 'science' | 'bgs' | 'religion';
  resourceType: 'textbook_and_tg' | 'tg_only';
  fullMarks: number;
  caMax: number;
  saMax: number;
  examDuration: string;
  caParts: CaPartSchema[];
  saParts: SaPartSchema[];
  note?: string;
}

export const EVALUATION_TERMS = [
  '১ম প্রান্তিক',
  '২য় প্রান্তিক',
  '৩য় প্রান্তিক',
] as const;

export const CONSOLIDATED_ANNUAL_TERM = 'বার্ষিক সমন্বিত (৩ প্রান্তিকের গড়)';

const CA_PARTS_50: CaPartSchema[] = [
  {
    key: 'textbookWork',
    code: '১.১',
    label: 'পাঠ্যপুস্তক / শিক্ষক সহায়িকার কাজ সম্পন্ন করা',
    max: 20,
  },
  {
    key: 'classActivity',
    code: '১.২',
    label: 'শ্রেণিকাজে সক্রিয়তা',
    max: 5,
  },
  {
    key: 'comprehension',
    code: '১.৩',
    label: 'ভাষাদক্ষতা / বিষয়বস্তুর বোধগম্যতা',
    max: 5,
  },
  {
    key: 'classTest',
    code: '১.৪',
    label: 'ক্লাস টেস্ট',
    max: 20,
  },
];

const CA_PARTS_30: CaPartSchema[] = [
  {
    key: 'textbookWork',
    code: '১.১',
    label: 'পাঠ্যপুস্তক / শিক্ষক সহায়িকার কাজ সম্পন্ন করা',
    max: 10,
  },
  {
    key: 'classActivity',
    code: '১.২',
    label: 'শ্রেণিকাজে সক্রিয়তা',
    max: 5,
  },
  {
    key: 'comprehension',
    code: '১.৩',
    label: 'ভাষাদক্ষতা / বিষয়বস্তুর বোধগম্যতা',
    max: 5,
  },
  {
    key: 'classTest',
    code: '১.৪',
    label: 'ক্লাস টেস্ট',
    max: 10,
  },
];

const CA_PARTS_SHILPAKALA_50: CaPartSchema[] = [
  {
    key: 'textbookWork',
    code: '১.১',
    label: 'পাঠ্যপুস্তক/শিক্ষক সহায়িকার কাজ (চারু ও কারুকলা ৫+সংগীত ৫+নৃত্য ৫+নাট্যকলা ৫)',
    max: 20,
  },
  {
    key: 'classActivity',
    code: '১.২',
    label: 'শ্রেণিকাজে সক্রিয়তা',
    max: 5,
  },
  {
    key: 'comprehension',
    code: '১.৩',
    label: 'বিষয়বস্তুর বোধগম্যতা ও শৈল্পিক প্রকাশ',
    max: 5,
  },
  {
    key: 'classTest',
    code: '১.৪',
    label: 'ক্লাস টেস্ট / ব্যবহারিক প্রদর্শনী (চারটি ক্ষেত্র সমন্বিত)',
    max: 20,
  },
];

// Class 1 & 2 SA 50-mark question structures (NCTB 2026 Pages 19–25)
const SA_CLASS_1_2_BANGLA: SaPartSchema[] = [
  {
    id: 'c12-bn-1',
    title: '১। পঠন (পাঠ্যবই / সমপর্যায়ের পাঠ থেকে)',
    questionType: 'সংক্ষিপ্ত প্রশ্ন',
    maxMarks: 10,
    competencyNote: 'শুদ্ধ ও স্পষ্ট উচ্চারণে পঠন দক্ষতা',
  },
  {
    id: 'c12-bn-2',
    title: '২। ছবি দেখে বাক্য/শব্দ বলা ও অনুচ্ছেদ/শব্দ লিখন',
    questionType: 'রচনামূলক প্রশ্ন',
    maxMarks: 15,
    competencyNote: 'বর্ণ, শব্দ ও সরল বাক্য গঠন',
  },
  {
    id: 'c12-bn-3',
    title: '৩। শূন্যস্থান পূরণ, যুক্তবর্ণ/শব্দ মিলানো ও বিপরীত শব্দ',
    questionType: 'শূন্যস্থান পূরণ',
    maxMarks: 15,
    competencyNote: 'শব্দভাণ্ডার ও বাক্য সম্পূর্ণকরণ',
  },
  {
    id: 'c12-bn-4',
    title: '৪। সঠিক উত্তর ও এক কথায় প্রশ্নোত্তর',
    questionType: 'সঠিক উত্তর',
    maxMarks: 10,
    competencyNote: 'বোধগম্যতা ও সংক্ষিপ্ত উত্তর প্রদান',
  },
];

const SA_CLASS_1_2_ENGLISH: SaPartSchema[] = [
  {
    id: 'c12-en-1',
    title: '1. Listening & Speaking (Oral Reading / Rhyme / Commands)',
    questionType: 'সংক্ষিপ্ত প্রশ্ন',
    maxMarks: 10,
    competencyNote: 'শোনা, বলা ও সঠিক উচ্চারণে পঠন',
  },
  {
    id: 'c12-en-2',
    title: '2. Letters, Words, Spelling & Matching',
    questionType: 'শূন্যস্থান পূরণ',
    maxMarks: 15,
    competencyNote: 'বর্ণ, শব্দ গঠন ও শূন্যস্থান পূরণ',
  },
  {
    id: 'c12-en-3',
    title: '3. MCQ / Rearrange & Short Questions',
    questionType: 'সঠিক উত্তর',
    maxMarks: 15,
    competencyNote: 'ছবি ও পাঠ থেকে অর্থ বুঝে উত্তর দেওয়া',
  },
  {
    id: 'c12-en-4',
    title: '4. Guided Writing (Simple Sentences / Handwriting)',
    questionType: 'রচনামূলক প্রশ্ন',
    maxMarks: 10,
    competencyNote: 'ছবি/শব্দ ব্যবহার করে সহজ ইংরেজি বাক্য লেখা',
  },
];

const SA_CLASS_1_2_MATH: SaPartSchema[] = [
  {
    id: 'c12-mt-1',
    title: '১। সংখ্যা চেনা, তুলনা ও সঠিক উত্তর/বহুনির্বাচনি',
    questionType: 'সঠিক উত্তর',
    maxMarks: 10,
    competencyNote: 'সংখ্যা, স্থানীয় মান ও তুলনা ধারণা',
  },
  {
    id: 'c12-mt-2',
    title: '২। শূন্যস্থান পূরণ (সংখ্যার ক্রম, যোগ-বিয়োগ ও প্যাটার্ন)',
    questionType: 'শূন্যস্থান পূরণ',
    maxMarks: 10,
    competencyNote: 'গাণিতিক ফাঁকা ঘর পূরণ ও ক্রম',
  },
  {
    id: 'c12-mt-3',
    title: '৩। সংক্ষিপ্ত উত্তর ও যোগ-বিয়োগ/গুণ অঙ্ক কষা',
    questionType: 'সংক্ষিপ্ত প্রশ্ন',
    maxMarks: 15,
    competencyNote: 'প্রাথমিক গাণিতিক প্রক্রিয়া সমাধান',
  },
  {
    id: 'c12-mt-4',
    title: '৪। কাঠামোবদ্ধ/কথার অঙ্ক ও জ্যামিতিক আকৃতি',
    questionType: 'রচনামূলক প্রশ্ন',
    maxMarks: 15,
    competencyNote: 'দৈনন্দিন জীবনের সহজ গাণিতিক সমস্যা সমাধান',
  },
];

// Class 3–5 SA 70-mark question structures (NCTB 2026 Pages 36–51)
const SA_CLASS_3_5_BANGLA: SaPartSchema[] = [
  {
    id: 'c35-bn-1',
    title: '১। সঠিক উত্তর নির্বাচন ও শব্দার্থ / এক কথায় প্রকাশ',
    questionType: 'সঠিক উত্তর',
    maxMarks: 15,
    competencyNote: 'পাঠ্যবই ও অনুচ্ছেদ ভিত্তিক বোধগম্যতা',
  },
  {
    id: 'c35-bn-2',
    title: '২। শূন্যস্থান পূরণ ও যুক্তবর্ণ বিশ্লেষণ / বিপরীত শব্দ',
    questionType: 'শূন্যস্থান পূরণ',
    maxMarks: 15,
    competencyNote: 'ব্যাকরণিক ও শব্দপ্রয়োগ দক্ষতা',
  },
  {
    id: 'c35-bn-3',
    title: '৩। অনুচ্ছেদ/কবিতা থেকে সংক্ষিপ্ত প্রশ্নোত্তর',
    questionType: 'সংক্ষিপ্ত প্রশ্ন',
    maxMarks: 20,
    competencyNote: 'পাঠের মূলভাব ও তথ্য বিশ্লেষণ',
  },
  {
    id: 'c35-bn-4',
    title: '৪। রচনামূলক / অনুচ্ছেদ লিখন, চিঠি/আবেদন ও ফরম পূরণ',
    questionType: 'রচনামূলক প্রশ্ন',
    maxMarks: 20,
    competencyNote: 'সৃজনশীল ও প্রায়োগিক লিখন দক্ষতা',
  },
];

const SA_CLASS_3_5_ENGLISH: SaPartSchema[] = [
  {
    id: 'c35-en-1',
    title: '1. Reading Comprehension (MCQ / True-False)',
    questionType: 'সঠিক উত্তর',
    maxMarks: 15,
    competencyNote: 'Seen & Unseen Passage বোধগম্যতা',
  },
  {
    id: 'c35-en-2',
    title: '2. Fill in the Blanks, Matching & Punctuation',
    questionType: 'শূন্যস্থান পূরণ',
    maxMarks: 15,
    competencyNote: 'Vocabulary ও সঠিক বাক্য গঠন',
  },
  {
    id: 'c35-en-3',
    title: '3. Short Answered Questions & WH-Questions',
    questionType: 'সংক্ষিপ্ত প্রশ্ন',
    maxMarks: 20,
    competencyNote: 'পাঠ বিশ্লেষণ ও প্রশ্ন তৈরি',
  },
  {
    id: 'c35-en-4',
    title: '4. Guided Composition / Letter / Form Completion',
    questionType: 'রচনামূলক প্রশ্ন',
    maxMarks: 20,
    competencyNote: 'মুক্ত ও নির্দেশিত ইংরেজি রচনা দক্ষতা',
  },
];

const SA_CLASS_3_5_MATH: SaPartSchema[] = [
  {
    id: 'c35-mt-1',
    title: '১। বহুনির্বাচনি / সঠিক উত্তর যাচাই',
    questionType: 'সঠিক উত্তর',
    maxMarks: 12,
    competencyNote: 'গাণিতিক ধারণা ও দ্রুত হিসাব',
  },
  {
    id: 'c35-mt-2',
    title: '২। শূন্যস্থান পূরণ ও ছোট গাণিতিক রূপান্তর',
    questionType: 'শূন্যস্থান পূরণ',
    maxMarks: 10,
    competencyNote: 'ভগ্নাংশ, পরিমাপ ও একক রূপান্তর',
  },
  {
    id: 'c35-mt-3',
    title: '৩। সংক্ষিপ্ত উত্তর প্রশ্ন',
    questionType: 'সংক্ষিপ্ত প্রশ্ন',
    maxMarks: 18,
    competencyNote: 'প্রক্রিয়া প্রতীক, গড়, শতকরা ও জ্যামিতি',
  },
  {
    id: 'c35-mt-4',
    title: '৪। যোগ্যতাভিত্তিক কাঠামোবদ্ধ ও জ্যামিতি অঙ্কন',
    questionType: 'রচনামূলক প্রশ্ন',
    maxMarks: 30,
    competencyNote: 'বাস্তব সমস্যা সমাধান ও চিত্র অঙ্কন',
  },
];

const SA_CLASS_3_5_GENERAL: SaPartSchema[] = [
  {
    id: 'c35-gn-1',
    title: '১। সঠিক উত্তর নির্বাচন (বহুনির্বাচনি)',
    questionType: 'সঠিক উত্তর',
    maxMarks: 15,
    competencyNote: 'তথ্য ও মৌলিক ধারণা যাচাই',
  },
  {
    id: 'c35-gn-2',
    title: '২। শূন্যস্থান পূরণ ও বাম-ডান মিলকরণ',
    questionType: 'শূন্যস্থান পূরণ',
    maxMarks: 15,
    competencyNote: 'পাঠ্যবিষয়ের সংযোগ ও শব্দ প্রয়োগ',
  },
  {
    id: 'c35-gn-3',
    title: '৩। সংক্ষিপ্ত উত্তর প্রশ্ন',
    questionType: 'সংক্ষিপ্ত প্রশ্ন',
    maxMarks: 20,
    competencyNote: 'বৈজ্ঞানিক/সামাজিক/নৈতিক ধারণা ব্যাখ্যা',
  },
  {
    id: 'c35-gn-4',
    title: '৪। কাঠামোবদ্ধ ও যোগ্যতাভিত্তিক রচনামূলক প্রশ্ন',
    questionType: 'রচনামূলক প্রশ্ন',
    maxMarks: 20,
    competencyNote: 'বিশ্লেষণ, প্রয়োগ ও মূল্যবোধভিত্তিক উত্তর',
  },
];

const CLASS_1_2_SUBJECTS: SubjectEvalSchema2026[] = [
  {
    id: 'bangla',
    name: 'বাংলা',
    shortName: 'বাংলা',
    legacyAliases: ['আমার বাংলা বই', 'বাংলা'],
    legacyField: 'bangla',
    resourceType: 'textbook_and_tg',
    fullMarks: 100,
    caMax: 50,
    saMax: 50,
    examDuration: '১ ঘণ্টা',
    caParts: CA_PARTS_50,
    saParts: SA_CLASS_1_2_BANGLA,
  },
  {
    id: 'english',
    name: 'ইংরেজি',
    shortName: 'ইংরেজি',
    legacyAliases: ['English for Today', 'ইংরেজি'],
    legacyField: 'english',
    resourceType: 'textbook_and_tg',
    fullMarks: 100,
    caMax: 50,
    saMax: 50,
    examDuration: '১ ঘণ্টা',
    caParts: CA_PARTS_50,
    saParts: SA_CLASS_1_2_ENGLISH,
  },
  {
    id: 'math',
    name: 'গণিত',
    shortName: 'গণিত',
    legacyAliases: ['প্রাথমিক গণিত', 'গণিত'],
    legacyField: 'math',
    resourceType: 'textbook_and_tg',
    fullMarks: 100,
    caMax: 50,
    saMax: 50,
    examDuration: '১ ঘণ্টা',
    caParts: CA_PARTS_50,
    saParts: SA_CLASS_1_2_MATH,
  },
  {
    id: 'social_science',
    name: 'সামাজিক বিজ্ঞান ও বিজ্ঞান (সমন্বিত)',
    shortName: 'সা.বি ও বিজ্ঞান',
    legacyAliases: ['সামাজিক বিজ্ঞান ও বিজ্ঞান (সমন্বিত)', 'বিজ্ঞান', 'প্রাথমিক বিজ্ঞান'],
    legacyField: 'science',
    resourceType: 'tg_only',
    fullMarks: 50,
    caMax: 50,
    saMax: 0,
    examDuration: 'সামষ্টিক নেই (১০০% ধারাবাহিক)',
    caParts: CA_PARTS_50,
    saParts: [],
    note: 'শুধুমাত্র শিক্ষক সহায়িকা — ১০০% ধারাবাহিক মূল্যায়ন',
  },
  {
    id: 'religion',
    name: 'ধর্মশিক্ষা (ইসলাম, হিন্দু, বৌদ্ধ, খ্রিষ্ট)',
    shortName: 'ধর্মশিক্ষা',
    legacyAliases: ['ধর্মশিক্ষা', 'ধর্ম ও নৈতিক শিক্ষা', 'ধর্মশিক্ষা (ইসলাম, হিন্দু, বৌদ্ধ, খ্রিষ্ট)'],
    legacyField: 'religion',
    resourceType: 'tg_only',
    fullMarks: 50,
    caMax: 50,
    saMax: 0,
    examDuration: 'সামষ্টিক নেই (১০০% ধারাবাহিক)',
    caParts: CA_PARTS_50,
    saParts: [],
    note: 'শুধুমাত্র শিক্ষক সহায়িকা — ১০০% ধারাবাহিক মূল্যায়ন',
  },
  {
    id: 'arts',
    name: 'শিল্পকলা (চারু ও কারুকলা, সংগীত, নৃত্য, নাট্যকলা)',
    shortName: 'শিল্পকলা',
    legacyAliases: ['শিল্পকলা'],
    resourceType: 'tg_only',
    fullMarks: 50,
    caMax: 50,
    saMax: 0,
    examDuration: 'সামষ্টিক নেই (১০০% ধারাবাহিক)',
    caParts: CA_PARTS_SHILPAKALA_50,
    saParts: [],
    note: 'শুধুমাত্র শিক্ষক সহায়িকা — চারু ও কারুকলা, সংগীত, নৃত্য ও নাট্যকলা সমন্বিত ৫০ নম্বর',
  },
  {
    id: 'health',
    name: 'শারীরিক ও মানসিক স্বাস্থ্য শিক্ষা',
    shortName: 'স্বাস্থ্য শিক্ষা',
    legacyAliases: ['শারীরিক ও মানসিক স্বাস্থ্য শিক্ষা'],
    resourceType: 'tg_only',
    fullMarks: 50,
    caMax: 50,
    saMax: 0,
    examDuration: 'সামষ্টিক নেই (১০০% ধারাবাহিক)',
    caParts: CA_PARTS_50,
    saParts: [],
    note: 'শুধুমাত্র শিক্ষক সহায়িকা — ১০০% ধারাবাহিক মূল্যায়ন',
  },
];

const CLASS_3_5_SUBJECTS: SubjectEvalSchema2026[] = [
  {
    id: 'bangla',
    name: 'বাংলা',
    shortName: 'বাংলা',
    legacyAliases: ['আমার বাংলা বই', 'বাংলা'],
    legacyField: 'bangla',
    resourceType: 'textbook_and_tg',
    fullMarks: 100,
    caMax: 30,
    saMax: 70,
    examDuration: '২ ঘণ্টা ৩০ মিনিট',
    caParts: CA_PARTS_30,
    saParts: SA_CLASS_3_5_BANGLA,
  },
  {
    id: 'english',
    name: 'ইংরেজি',
    shortName: 'ইংরেজি',
    legacyAliases: ['English for Today', 'ইংরেজি'],
    legacyField: 'english',
    resourceType: 'textbook_and_tg',
    fullMarks: 100,
    caMax: 30,
    saMax: 70,
    examDuration: '২ ঘণ্টা ৩০ মিনিট',
    caParts: CA_PARTS_30,
    saParts: SA_CLASS_3_5_ENGLISH,
  },
  {
    id: 'math',
    name: 'গণিত',
    shortName: 'গণিত',
    legacyAliases: ['প্রাথমিক গণিত', 'গণিত'],
    legacyField: 'math',
    resourceType: 'textbook_and_tg',
    fullMarks: 100,
    caMax: 30,
    saMax: 70,
    examDuration: '২ ঘণ্টা ৩০ মিনিট',
    caParts: CA_PARTS_30,
    saParts: SA_CLASS_3_5_MATH,
  },
  {
    id: 'bgs',
    name: 'বাংলাদেশ ও বিশ্বপরিচয়',
    shortName: 'বাবিপ্র',
    legacyAliases: ['বাংলাদেশ ও বিশ্বপরিচয়', 'বাবিপা'],
    legacyField: 'bgs',
    resourceType: 'textbook_and_tg',
    fullMarks: 100,
    caMax: 30,
    saMax: 70,
    examDuration: '২ ঘণ্টা ৩০ মিনিট',
    caParts: CA_PARTS_30,
    saParts: SA_CLASS_3_5_GENERAL,
  },
  {
    id: 'science',
    name: 'বিজ্ঞান',
    shortName: 'বিজ্ঞান',
    legacyAliases: ['প্রাথমিক বিজ্ঞান', 'বিজ্ঞান'],
    legacyField: 'science',
    resourceType: 'textbook_and_tg',
    fullMarks: 100,
    caMax: 30,
    saMax: 70,
    examDuration: '২ ঘণ্টা ৩০ মিনিট',
    caParts: CA_PARTS_30,
    saParts: SA_CLASS_3_5_GENERAL,
  },
  {
    id: 'religion',
    name: 'ধর্মশিক্ষা (ইসলাম, হিন্দু, বৌদ্ধ, খ্রিষ্ট)',
    shortName: 'ধর্মশিক্ষা',
    legacyAliases: ['ধর্ম ও নৈতিক শিক্ষা', 'ধর্মশিক্ষা', 'ধর্মশিক্ষা (ইসলাম, হিন্দু, বৌদ্ধ, খ্রিষ্ট)'],
    legacyField: 'religion',
    resourceType: 'textbook_and_tg',
    fullMarks: 100,
    caMax: 30,
    saMax: 70,
    examDuration: '২ ঘণ্টা ৩০ মিনিট',
    caParts: CA_PARTS_30,
    saParts: SA_CLASS_3_5_GENERAL,
  },
  {
    id: 'arts',
    name: 'শিল্পকলা',
    shortName: 'শিল্পকলা',
    legacyAliases: ['শিল্পকলা'],
    resourceType: 'tg_only',
    fullMarks: 50,
    caMax: 50,
    saMax: 0,
    examDuration: 'সামষ্টিক নেই (১০০% ধারাবাহিক)',
    caParts: CA_PARTS_SHILPAKALA_50,
    saParts: [],
    note: 'শুধুমাত্র শিক্ষক সহায়িকা — চারু ও কারুকলা, সংগীত, নৃত্য ও নাট্যকলা সমন্বিত ৫০ নম্বর',
  },
  {
    id: 'health',
    name: 'শারীরিক ও মানসিক স্বাস্থ্য শিক্ষা',
    shortName: 'স্বাস্থ্য শিক্ষা',
    legacyAliases: ['শারীরিক ও মানসিক স্বাস্থ্য শিক্ষা'],
    resourceType: 'tg_only',
    fullMarks: 50,
    caMax: 50,
    saMax: 0,
    examDuration: 'সামষ্টিক নেই (১০০% ধারাবাহিক)',
    caParts: CA_PARTS_50,
    saParts: [],
    note: 'শুধুমাত্র শিক্ষক সহায়িকা — ১০০% ধারাবাহিক মূল্যায়ন',
  },
];

const PRE_PRIMARY_SUBJECTS: SubjectEvalSchema2026[] = [
  {
    id: 'amar_boi',
    name: 'আমার বই',
    shortName: 'আমার বই',
    legacyAliases: ['আমার বই'],
    legacyField: 'bangla',
    resourceType: 'tg_only',
    fullMarks: 50,
    caMax: 50,
    saMax: 0,
    examDuration: 'মৌখিক ও পর্যবেক্ষণভিত্তিক',
    caParts: CA_PARTS_50,
    saParts: [],
  },
  {
    id: 'eso_likhte',
    name: 'এসো লিখতে শিখি (অনুশীলন খাতা)',
    shortName: 'এসো লিখতে শিখি',
    legacyAliases: ['এসো লিখতে শিখি (অনুশীলন খাতা)'],
    legacyField: 'english',
    resourceType: 'tg_only',
    fullMarks: 50,
    caMax: 50,
    saMax: 0,
    examDuration: 'মৌখিক ও প্রাক-লেখন পর্যবেক্ষণ',
    caParts: CA_PARTS_50,
    saParts: [],
  },
  {
    id: 'chora_khela',
    name: 'ছড়া, গল্প ও খেলা নির্দেশিকা',
    shortName: 'ছড়া, গল্প ও খেলা',
    legacyAliases: ['ছড়া, গল্প ও খেলা নির্দেশিকা'],
    legacyField: 'math',
    resourceType: 'tg_only',
    fullMarks: 50,
    caMax: 50,
    saMax: 0,
    examDuration: 'ছড়া, গল্প ও দলীয় খেলা',
    caParts: CA_PARTS_50,
    saParts: [],
  },
];

export function getEvaluationSchemasForClass(classLevel: string): SubjectEvalSchema2026[] {
  if (classLevel === 'প্রাক-প্রাথমিক') return PRE_PRIMARY_SUBJECTS;
  if (classLevel === 'প্রথম শ্রেণি' || classLevel === 'দ্বিতীয় শ্রেণি') {
    return CLASS_1_2_SUBJECTS;
  }
  return CLASS_3_5_SUBJECTS;
}

export function getClassGrandFullMarks(classLevel: string): {
  totalFullMarks: number;
  totalCaMax: number;
  totalSaMax: number;
} {
  const list = getEvaluationSchemasForClass(classLevel);
  return {
    totalFullMarks: list.reduce((s, item) => s + item.fullMarks, 0),
    totalCaMax: list.reduce((s, item) => s + item.caMax, 0),
    totalSaMax: list.reduce((s, item) => s + item.saMax, 0),
  };
}

export function buildDetailForSchema2026(
  schema: SubjectEvalSchema2026,
  targetTotal: number
): SubjectAssessmentDetail {
  const clampedTotal = Math.max(0, Math.min(schema.fullMarks, Math.round(targetTotal)));
  const caTarget =
    schema.saMax === 0
      ? Math.min(schema.caMax, clampedTotal)
      : Math.min(schema.caMax, Math.round((clampedTotal / schema.fullMarks) * schema.caMax));
  const saTarget =
    schema.saMax === 0 ? 0 : Math.max(0, Math.min(schema.saMax, clampedTotal - caTarget));

  const caBreakdown: Record<CaPartKey, number> = {
    textbookWork: 0,
    classActivity: 0,
    comprehension: 0,
    classTest: 0,
  };
  let caAllocated = 0;
  schema.caParts.forEach((part, idx) => {
    if (idx === schema.caParts.length - 1) {
      caBreakdown[part.key] = Math.max(0, Math.min(part.max, caTarget - caAllocated));
    } else {
      const val = Math.min(part.max, Math.round((part.max / schema.caMax) * caTarget));
      caBreakdown[part.key] = val;
      caAllocated += val;
    }
  });
  // Handle rounding remainder if any
  const caSum = Object.values(caBreakdown).reduce((a, b) => a + b, 0);
  if (caSum < caTarget) {
    let rem = caTarget - caSum;
    for (const part of schema.caParts) {
      const room = part.max - caBreakdown[part.key];
      if (room > 0 && rem > 0) {
        const add = Math.min(room, rem);
        caBreakdown[part.key] += add;
        rem -= add;
      }
    }
  }

  const saPartScores: Record<string, number> = {};
  const saSections: Partial<Record<QuestionItem['type'], number>> = {};
  if (schema.saMax > 0 && schema.saParts.length > 0) {
    let saAllocated = 0;
    schema.saParts.forEach((part, idx) => {
      const val =
        idx === schema.saParts.length - 1
          ? Math.max(0, Math.min(part.maxMarks, saTarget - saAllocated))
          : Math.min(part.maxMarks, Math.round((part.maxMarks / schema.saMax) * saTarget));
      saPartScores[part.id] = val;
      saSections[part.questionType] = (saSections[part.questionType] || 0) + val;
      saAllocated += val;
    });
  }

  const pct = schema.fullMarks > 0 ? (clampedTotal / schema.fullMarks) * 100 : 0;
  return {
    continuousMarks: Object.values(caBreakdown).reduce((a, b) => a + b, 0),
    caBreakdown,
    summativeMarks: saTarget,
    saSections,
    saPartScores,
    piRemark:
      pct >= 80
        ? 'অতি উত্তম পারদর্শিতা'
        : pct >= 60
        ? 'উত্তম ও সন্তোষজনক অর্জন'
        : pct >= 40
        ? 'সন্তোষজনক (মৌলিক যোগ্যতা অর্জিত)'
        : 'সহায়তা ও নিরাময়মূলক অনুশীলন প্রয়োজন',
  };
}

/**
 * Resolves a SubjectAssessmentDetail from an EvaluationRecord with full backward compatibility
 * for legacy subject names, legacy 3-part CA breakdown, or flat legacy subject scores.
 */
export function resolveSubjectDetail2026(
  record: EvaluationRecord,
  schema: SubjectEvalSchema2026
): SubjectAssessmentDetail {
  const detailsMap = record.subjectDetails || {};
  const candidateKeys = [schema.name, ...schema.legacyAliases];
  let existing: SubjectAssessmentDetail | undefined;
  for (const key of candidateKeys) {
    if (detailsMap[key]) {
      existing = detailsMap[key];
      break;
    }
  }

  if (existing) {
    const bd = existing.caBreakdown || {};
    const has2026Ca =
      bd.textbookWork !== undefined ||
      bd.classActivity !== undefined ||
      bd.comprehension !== undefined ||
      bd.classTest !== undefined;

    if (has2026Ca) {
      const textbookWork = Math.min(
        schema.caParts[0].max,
        Math.max(0, Math.round(bd.textbookWork ?? 0))
      );
      const classActivity = Math.min(
        schema.caParts[1].max,
        Math.max(0, Math.round(bd.classActivity ?? 0))
      );
      const comprehension = Math.min(
        schema.caParts[2].max,
        Math.max(0, Math.round(bd.comprehension ?? 0))
      );
      const classTest = Math.min(
        schema.caParts[3].max,
        Math.max(0, Math.round(bd.classTest ?? 0))
      );
      const continuousMarks = textbookWork + classActivity + comprehension + classTest;

      // Normalize SA parts if saMax === 0 or if existing SA exceeds new schema.saMax
      const summativeMarks =
        schema.saMax === 0
          ? 0
          : Math.min(schema.saMax, Math.max(0, Math.round(existing.summativeMarks ?? 0)));

      let saPartScores = existing.saPartScores;
      if (schema.saMax > 0 && (!saPartScores || Object.keys(saPartScores).length === 0)) {
        saPartScores = {};
        let allocated = 0;
        schema.saParts.forEach((p, idx) => {
          const val =
            idx === schema.saParts.length - 1
              ? Math.max(0, Math.min(p.maxMarks, summativeMarks - allocated))
              : Math.min(p.maxMarks, Math.round((p.maxMarks / schema.saMax) * summativeMarks));
          saPartScores![p.id] = val;
          allocated += val;
        });
      }

      return {
        ...existing,
        continuousMarks,
        caBreakdown: { textbookWork, classActivity, comprehension, classTest },
        summativeMarks,
        saPartScores: schema.saMax === 0 ? {} : saPartScores,
      };
    }

    // Legacy 3-part CA detail: scale cleanly to the 2026 schema
    const legacySum = Math.min(
      schema.fullMarks,
      Math.max(0, Math.round((existing.continuousMarks || 0) + (existing.summativeMarks || 0)))
    );
    const converted = buildDetailForSchema2026(schema, legacySum);
    return {
      ...converted,
      piRemark: existing.piRemark || converted.piRemark,
    };
  }

  // Fallback to legacy flat fields (or reasonable default for new TG-only subjects)
  let rawScore = schema.legacyField ? Number(record[schema.legacyField] ?? 0) : 0;
  if (!schema.legacyField) {
    // For newly added TG-only subjects (শিল্পকলা / স্বাস্থ্য শিক্ষা) on pre-existing records,
    // initialize proportionally from average of core subjects so existing students aren't penalized as 0-fail unintentionally.
    const coreScores = [
      record.bangla,
      record.english,
      record.math,
      record.science,
      record.bgs,
      record.religion,
    ].filter((n) => typeof n === 'number' && n > 0);
    const avgPct =
      coreScores.length > 0
        ? coreScores.reduce((a, b) => a + b, 0) / coreScores.length
        : 75;
    rawScore = Math.round((avgPct / 100) * schema.fullMarks);
  } else if (schema.fullMarks === 50 && rawScore > 50) {
    rawScore = Math.round(rawScore / 2);
  }

  return buildDetailForSchema2026(schema, rawScore);
}

export function normalizeTermName(term: string): string {
  if (term === 'বার্ষিক মূল্যায়ন') return '৩য় প্রান্তিক';
  return term;
}
