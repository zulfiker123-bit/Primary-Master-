export type FlnDomain = 'বাংলা' | 'English' | 'গণিত';

export type FlnLevel = 'mastered' | 'developing' | 'remedial';

export interface FlnIndicator {
  id: string;
  domain: FlnDomain;
  competencyCode: string;
  title: string;
  targetBenchmark: string;
  verificationTool: string;
}

export interface MonthlyFlnMilestone {
  monthIndex: number; // 0..11 (January..December)
  monthName: string;
  shortName: string;
  focusTheme: string;
  classTargets: Record<string, {
    literacyBanglaTarget: string;
    literacyEnglishTarget: string;
    numeracyMathTarget: string;
    readingWpmGoal: number;
    diagnosticPrompt: string;
    remedialAction: string;
  }>;
}

export interface FlnMonthlyCheckEntry {
  readingWpm?: number;
  mathScore?: number; // out of 100
  indicators: Record<string, FlnLevel>;
  remark?: string;
}

export interface FlnStudentRecord {
  id: string;
  classLevel: string;
  roll: string;
  studentName: string;
  /** Key: monthIndex as string ('0'..'11') */
  months: Record<string, FlnMonthlyCheckEntry>;
}

export const FLN_MONTHS = [
  { index: 0, name: 'জানুয়ারি', short: 'জানু' },
  { index: 1, name: 'ফেব্রুয়ারি', short: 'ফেব্রু' },
  { index: 2, name: 'মার্চ', short: 'মার্চ' },
  { index: 3, name: 'এপ্রিল', short: 'এপ্রিল' },
  { index: 4, name: 'মে', short: 'মে' },
  { index: 5, name: 'জুন', short: 'জুন' },
  { index: 6, name: 'জুলাই', short: 'জুলাই' },
  { index: 7, name: 'আগস্ট', short: 'আগস্ট' },
  { index: 8, name: 'সেপ্টেম্বর', short: 'সেপ্টে' },
  { index: 9, name: 'অক্টোবর', short: 'অক্টো' },
  { index: 10, name: 'নভেম্বর', short: 'নভে' },
  { index: 11, name: 'ডিসেম্বর', short: 'ডিসে' },
] as const;

export const FLN_LEVEL_META: Record<
  FlnLevel,
  { label: string; shortLabel: string; symbol: string; badgeClass: string; textClass: string }
> = {
  mastered: {
    label: 'অর্জিত (দক্ষ)',
    shortLabel: 'অর্জিত',
    symbol: '●',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    textClass: 'text-emerald-800',
  },
  developing: {
    label: 'অগ্রসরমান (মধ্যম)',
    shortLabel: 'অগ্রসরমান',
    symbol: '◐',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-300',
    textClass: 'text-amber-800',
  },
  remedial: {
    label: 'সহায়তা প্রয়োজন',
    shortLabel: 'নিরাময়',
    symbol: '▲',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-300',
    textClass: 'text-rose-800',
  },
};

export const FLN_INDICATORS_BY_CLASS: Record<string, FlnIndicator[]> = {
  'প্রাক-প্রাথমিক': [
    {
      id: 'pp-bn-1',
      domain: 'বাংলা',
      competencyCode: 'প্রা-বাং-১',
      title: 'স্বর ও ব্যঞ্জন ধ্বনি শনাক্তকরণ ও ছড়া বলা',
      targetBenchmark: 'ছবির সাথে ১৫+ ধ্বনি মিলানো ও ২টি ছড়া বলা',
      verificationTool: 'ছবি-বর্ণ ফ্ল্যাশকার্ড ম্যাচিং ও মৌখিক অভিনয়',
    },
    {
      id: 'pp-en-1',
      domain: 'English',
      competencyCode: 'PP-Eng-1',
      title: 'Greeting & Alphabet Sound Recognition (A–Z)',
      targetBenchmark: 'মৌখিক কুশল বিনিময় ও A–Z ছবি দেখে শব্দ বলা',
      verificationTool: 'বর্ণ কার্ড ও ক্লাসরুম রিয়েলিয়া দেখিয়ে মৌখিক যাচাই',
    },
    {
      id: 'pp-math-1',
      domain: 'গণিত',
      competencyCode: 'প্রা-গণি-১',
      title: '১–২০ বাস্তব উপকরণ গণনা ও জ্যামিতিক আকার',
      targetBenchmark: 'কাঠি/পাতা গুনে ১–২০ সংখ্যা বলা ও গোল/ত্রিভুজ চেনা',
      verificationTool: 'হাতে-কলমে উপকরণ গণনা ও আকৃতি সাজানো',
    },
  ],
  'প্রথম শ্রেণি': [
    {
      id: 'c1-bn-1',
      domain: 'বাংলা',
      competencyCode: '১ম-বাং-১',
      title: 'সকল বর্ণ ও কার-চিহ্ন যোগে শব্দ গঠন ও পঠন',
      targetBenchmark: 'মিনিটে ১৫–২০টি সরল শব্দ শুদ্ধ উচ্চারণে পঠন',
      verificationTool: 'বর্ণ ও কার-কার্ড দিয়ে তাৎক্ষণিক ১ মিনিট পঠন যাচাই',
    },
    {
      id: 'c1-bn-2',
      domain: 'বাংলা',
      competencyCode: '১ম-বাং-২',
      title: 'শ্রুতলিপি ও ছোট বাক্য সুন্দর হস্তাক্ষরে লিখন',
      targetBenchmark: 'মাত্রাজ্ঞানসহ ৫টি সরল শব্দ ও ২টি বাক্য নির্ভুল লেখা',
      verificationTool: 'শ্রেণি খাতায় শ্রুতলিপি ও দেখে লেখার খাতা যাচাই',
    },
    {
      id: 'c1-en-1',
      domain: 'English',
      competencyCode: 'C1-Eng-1',
      title: 'Phonics A–Z Sounds & Simple 3-Letter Words',
      targetBenchmark: '২৬টি বর্ণের ধ্বনি ও ২০+ পরিচিত ইংরেজি শব্দ বলা-লেখা',
      verificationTool: 'Phonics কার্ড দেখিয়ে শব্দ উচ্চারণ ও লিখন পরীক্ষা',
    },
    {
      id: 'c1-math-1',
      domain: 'গণিত',
      competencyCode: '১ম-গণি-১',
      title: '১–১০০ সংখ্যা পঠন-লিখন ও অনূর্ধ্ব ৫০ যোগ-বিয়োগ',
      targetBenchmark: 'হাতে না রেখে এক-দুই অঙ্কের যোগ ও বিয়োগ ৮০%+ নির্ভুল',
      verificationTool: 'বাস্তব উপকরণ ও ৩ মিনিটের মানসাঙ্ক কার্ড টেস্ট',
    },
  ],
  'দ্বিতীয় শ্রেণি': [
    {
      id: 'c2-bn-1',
      domain: 'বাংলা',
      competencyCode: '২য়-বাং-১',
      title: 'যুক্তবর্ণ ভেঙে পড়া ও সাবলীল অনুচ্ছেদ পঠন',
      targetBenchmark: 'মিনিটে ২৫–৩০ শব্দ গতিতে বিরামচিহ্ন মেনে পঠন',
      verificationTool: 'অচেনা ৫ বাক্যের অনুচ্ছেদ থেকে ১ মিনিট Oral Reading',
    },
    {
      id: 'c2-bn-2',
      domain: 'বাংলা',
      competencyCode: '২য়-বাং-২',
      title: 'পঠনবোধগম্যতা ও নিজ ভাষায় বাক্য লিখন',
      targetBenchmark: 'ছোট গল্প পড়ে ৩টি প্রশ্নের উত্তর লেখা',
      verificationTool: 'লিখিত সংক্ষিপ্ত প্রশ্নোত্তর ও শ্রুতলিপি',
    },
    {
      id: 'c2-en-1',
      domain: 'English',
      competencyCode: 'C2-Eng-1',
      title: 'Simple Sentences Reading & Everyday Action Words',
      targetBenchmark: 'ছোট ৪–৫ বাক্যের পাঠ পড়ে অর্থ বোঝা ও উত্তর বলা',
      verificationTool: 'পাঠ্যাংশ পঠন ও Picture-Sentence Matching',
    },
    {
      id: 'c2-math-1',
      domain: 'গণিত',
      competencyCode: '২য়-গণি-১',
      title: 'হাতে রেখে যোগ-বিয়োগ, ১–১০ নামতা ও প্রাথমিক গুণ-ভাগ',
      targetBenchmark: 'তিন অঙ্ক পর্যন্ত যোগ-বিয়োগ ও সাধারণ কথার অঙ্ক সমাধান',
      verificationTool: '৫টি কাঠামোবদ্ধ অঙ্ক ও নামতা যাচাই কার্ড',
    },
  ],
  'তৃতীয় শ্রেণি': [
    {
      id: 'c3-bn-1',
      domain: 'বাংলা',
      competencyCode: '৩য়-বাং-প্রা.যো-১',
      title: 'বিরামচিহ্ন ও শুদ্ধ উচ্চারণে সাবলীল পঠন (WPM)',
      targetBenchmark: 'মিনিটে ৩৫–৪৫ শব্দ নির্ভুল ও স্বাভাবিক গতিতে পঠন',
      verificationTool: '১ মিনিট টাইমার Oral Reading Fluency (ORF) কার্ড ও বিরামচিহ্ন চেক',
    },
    {
      id: 'c3-bn-2',
      domain: 'বাংলা',
      competencyCode: '৩য়-বাং-প্রা.যো-২',
      title: 'যুক্তবর্ণ বিশ্লেষণ, পদ শনাক্ত ও বোধগম্যতা লিখন',
      targetBenchmark: 'অনুচ্ছেদ পড়ে ৩টি প্রশ্নের শুদ্ধ উত্তর ও যুক্তবর্ণে ৫টি বাক্য রচনা',
      verificationTool: 'অদেখা ৫–৬ বাক্যের অনুচ্ছেদ বোধগম্যতা ও যুক্তবর্ণ শিট',
    },
    {
      id: 'c3-en-1',
      domain: 'English',
      competencyCode: 'C3-Eng-TC-1',
      title: 'Fluent Reading & Short WH-Question Comprehension',
      targetBenchmark: 'মিনিটে ২৫+ ইংরেজি শব্দ পঠন এবং Who/What/Where প্রশ্নের উত্তর',
      verificationTool: '৩–৪ লাইনের টেক্সট পড়ে মৌখিক ও লিখিত WH-প্রশ্নোত্তর',
    },
    {
      id: 'c3-math-1',
      domain: 'গণিত',
      competencyCode: '৩য়-গণি-প্রা.যো-১',
      title: 'স্থানীয় মান (দশ হাজার পর্যন্ত) ও চার প্রক্রিয়া দক্ষতা',
      targetBenchmark: '৪ অঙ্কের যোগ-বিয়োগ ও ২ অঙ্ক দিয়ে গুণ-ভাগে ৮০%+ নির্ভুলতা',
      verificationTool: '৫টি মানসাঙ্ক + ২টি দৈনন্দিন কথার অঙ্ক যাচাই',
    },
    {
      id: 'c3-math-2',
      domain: 'গণিত',
      competencyCode: '৩য়-গণি-প্রা.যো-২',
      title: 'ভগ্নাংশ ধারণা, বাংলাদেশি মুদ্রা ও সময় পরিমাপ',
      targetBenchmark: 'সমহর ভগ্নাংশ তুলনা এবং টাকা-পয়সা ও ঘড়ি হিসাব সমাধান',
      verificationTool: 'ভগ্নাংশ চিত্র কার্ড ও বাজার-সময়ের ব্যবহারিক সমস্যা',
    },
  ],
  'চতুর্থ শ্রেণি': [
    {
      id: 'c4-bn-1',
      domain: 'বাংলা',
      competencyCode: '৪র্থ-বাং-প্রা.যো-১',
      title: 'অর্থবোধসহ প্রমিত উচ্চারণে সাবলীল পঠন ও আবৃত্তি',
      targetBenchmark: 'মিনিটে ৫০–৬০ শব্দ গতিতে প্রমিত পঠন ও মূলভাব অনুধাবন',
      verificationTool: '১ মিনিট আনসিন অনুচ্ছেদ পঠন (ORF) + মৌখিক সারাংশ',
    },
    {
      id: 'c4-bn-2',
      domain: 'বাংলা',
      competencyCode: '৪র্থ-বাং-প্রা.যো-২',
      title: 'বোধগম্যতা প্রশ্নোত্তর, ক্রিয়াপদ/কাল ও দরখাস্ত-অনুচ্ছেদ লিখন',
      targetBenchmark: 'পাঠ্যবই ও আনসিন অনুচ্ছেদ থেকে স্বাধীনভাবে ৬–৮ বাক্যের উত্তর/পত্র রচনা',
      verificationTool: 'অনুচ্ছেদ ভিত্তিক লিখিত প্রশ্নোত্তর ও শুদ্ধ বানান পরীক্ষা',
    },
    {
      id: 'c4-en-1',
      domain: 'English',
      competencyCode: 'C4-Eng-TC-1',
      title: 'Paragraph Reading, Punctuation & Guided Writing',
      targetBenchmark: 'মিনিটে ৩৫+ শব্দ পঠন, বিরামচিহ্ন প্রয়োগ ও ৪–৫ বাক্যের অনুচ্ছেদ লেখা',
      verificationTool: 'Short Passage Reading + 4 WH Questions & Punctuation Check',
    },
    {
      id: 'c4-math-1',
      domain: 'গণিত',
      competencyCode: '৪র্থ-গণি-প্রা.যো-১',
      title: 'বৃহৎ সংখ্যা, গুণিতক-গুণনীয়ক (লসাগু/গসাগু) ও চার প্রক্রিয়া',
      targetBenchmark: 'কোটি পর্যন্ত স্থানীয় মান এবং ৩-৪ ধাপের কথার অঙ্ক সমাধান',
      verificationTool: 'যোগ্যতাভিত্তিক বহুধাপ সমস্যা ও মানসাঙ্ক শিট',
    },
    {
      id: 'c4-math-2',
      domain: 'গণিত',
      competencyCode: '৪র্থ-গণি-প্রা.যো-২',
      title: 'সাধারণ ও দশমিক ভগ্নাংশ, পরিমাপ ও কোণ-ত্রিভুজ ধারণা',
      targetBenchmark: 'ভগ্নাংশ ও দশমিকের যোগ-বিয়োগ এবং চাঁদা দিয়ে কোণ পরিমাপ',
      verificationTool: 'ব্যবহারিক জ্যামিতি কার্ড ও ভগ্নাংশ তুলনামূলক টেস্ট',
    },
  ],
  'পঞ্চম শ্রেণি': [
    {
      id: 'c5-bn-1',
      domain: 'বাংলা',
      competencyCode: '৫ম-বাং-প্রা.যো-১',
      title: 'সমালোচনামূলক ও সাবলীল পঠন এবং আনসিন অনুচ্ছেদ বিশ্লেষণ',
      targetBenchmark: 'মিনিটে ৬৫+ শব্দ গতিতে পঠন, বিরামচিহ্ন ও যুক্তিনির্ভর বিশ্লেষণ',
      verificationTool: '১ মিনিট ORF টেস্ট + আনসিন অনুচ্ছেদ থেকে যোগ্যতাভিত্তিক প্রশ্ন',
    },
    {
      id: 'c5-bn-2',
      domain: 'বাংলা',
      competencyCode: '৫ম-বাং-প্রা.যো-২',
      title: 'শুদ্ধ বানানে প্রবন্ধ, ফরম পূরণ, ভাবসম্প্রসারণ ও পত্র লিখন',
      targetBenchmark: 'নির্ধারিত ফরম, আবেদনপত্র ও ১০+ বাক্যের সৃজনশীল অনুচ্ছেদ শুদ্ধভাবে লিখন',
      verificationTool: 'প্রাথমিক সমাপনী কাঠামো অনুযায়ী লিখিত লিখন-দক্ষতা যাচাই',
    },
    {
      id: 'c5-en-1',
      domain: 'English',
      competencyCode: 'C5-Eng-TC-1',
      title: 'Seen/Unseen Reading, WH-Making & Free Composition',
      targetBenchmark: 'মিনিটে ৪৫+ ইংরেজি শব্দ পঠন, WH-Question গঠন ও ৫+ বাক্যে Composition',
      verificationTool: 'Unseen Comprehension + WH Transformation + Letter/Composition Task',
    },
    {
      id: 'c5-math-1',
      domain: 'গণিত',
      competencyCode: '৫ম-গণি-প্রা.যো-১',
      title: 'চার প্রক্রিয়া, ঐকিক নিয়ম, গড় ও শতকরা (লাভ-ক্ষতি/সুদ)',
      targetBenchmark: 'ভগ্নাংশ-দশমিক-শতকরা ও গড় সংক্রান্ত বাস্তব যোগ্যতাভিত্তিক অঙ্ক সমাধান',
      verificationTool: '৫টি যোগ্যতাভিত্তিক সংক্ষিপ্ত + ২টি কাঠামোবদ্ধ অঙ্ক যাচাই',
    },
    {
      id: 'c5-math-2',
      domain: 'গণিত',
      competencyCode: '৫ম-গণি-প্রা.যো-২',
      title: 'জ্যামিতিক ক্ষেত্র (আয়ত/বর্গ/বৃত্ত), সময় ও উপাত্ত বিন্যস্তকরণ',
      targetBenchmark: 'ক্ষেত্রফল-পরিসীমা নির্ণয়, বৃত্ত অঙ্কন ও স্তম্ভলেখ পাঠ-বিশ্লেষণ',
      verificationTool: 'জ্যামিতি অঙ্কন পোর্টফোলিও ও উপাত্ত ছক বিশ্লেষণ',
    },
  ],
};

export const MONTH_FLN_MILESTONES: MonthlyFlnMilestone[] = [
  {
    monthIndex: 0,
    monthName: 'জানুয়ারি',
    shortName: 'জানু',
    focusTheme: 'ভিত্তি মূল্যায়ন (Baseline) ও পূর্বশ্রেণির পঠন-গণনা পুনরুদ্ধার',
    classTargets: {
      'তৃতীয় শ্রেণি': {
        literacyBanglaTarget: '২য় শ্রেণির যুক্তবর্ণ ও সহজ অনুচ্ছেদ সাবলীলভাবে পড়া (৩০+ WPM)',
        literacyEnglishTarget: 'A–Z phonics, 3-letter words ও সহজ দৈনন্দিন সংলাপ পড়া',
        numeracyMathTarget: '১–১০০০ সংখ্যা, স্থানীয় মান ও হাতে রেখে যোগ-বিয়োগ যাচাই',
        readingWpmGoal: 30,
        diagnosticPrompt: 'বর্ষারম্ভে শিক্ষার্থীর যুক্তবর্ণ চেনা, ১ মিনিটে পড়া শব্দসংখ্যা ও যোগ-বিয়োগ ভিত্তি নির্ণয় করুন।',
        remedialAction: 'পিছিয়ে থাকা শিক্ষার্থীদের জন্য ১৫ দিনের বর্ণ-কার ও সংখ্যারেখা নিরাময় দল গঠন।',
      },
      'চতুর্থ শ্রেণি': {
        literacyBanglaTarget: '৩য় শ্রেণির পাঠ্যাংশ বিরামচিহ্ন মেনে পড়া ও যুক্তবর্ণ ভাঙা (৪২+ WPM)',
        literacyEnglishTarget: 'WH-words চেনা ও ৪ বাক্যের সহজ ইংরেজি অনুচ্ছেদ পড়া',
        numeracyMathTarget: 'হাজার পর্যন্ত স্থানীয় মান ও ২ অঙ্কের গুণ-ভাগ যাচাই',
        readingWpmGoal: 42,
        diagnosticPrompt: 'গেল শ্রেণির প্রান্তিক যোগ্যতার কোন কোন অংশে ঘাটতি আছে তা Baseline কার্ডে লিপিবদ্ধ করুন।',
        remedialAction: 'জোড়ায় পাঠ অনুশীলন ও নামতা (১–১৫) দৈনিক ৫ মিনিট পুনরালোচনা।',
      },
      'পঞ্চম শ্রেণি': {
        literacyBanglaTarget: '৪র্থ শ্রেণির মান অনুযায়ী ৫০+ WPM গতিতে পড়া ও মূলভাব বলা',
        literacyEnglishTarget: 'Simple Present/Past বাক্য পঠন ও ৩৫+ WPM গতি নিশ্চিতকরণ',
        numeracyMathTarget: 'কোটি পর্যন্ত সংখ্যা, ৪ প্রক্রিয়ার ভিত্তি ও লসাগু-গসাগু স্মরণ',
        readingWpmGoal: 50,
        diagnosticPrompt: 'প্রাথমিক সমাপনী প্রস্তুতির ভিত্তি হিসেবে প্রতিটি শিক্ষার্থীর পঠন-লিখন-গণিত বেইজলাইন যাচাই করুন।',
        remedialAction: 'বেইজলাইনে লাল (নিরাময়) চিহ্নিত শিক্ষার্থীদের জন্য সাপ্তাহিক বিশেষ পঠন ও মানসাঙ্ক সেশন।',
      },
    },
  },
  {
    monthIndex: 1,
    monthName: 'ফেব্রুয়ারি',
    shortName: 'ফেব্রু',
    focusTheme: 'যুক্তবর্ণ-ধ্বনি দৃঢ়ীকরণ, সাবলীল পঠন ও সংখ্যা-প্রক্রিয়া অনুশীলন',
    classTargets: {
      'তৃতীয় শ্রেণি': {
        literacyBanglaTarget: 'নতুন পাঠের যুক্তবর্ণ (ঙ্গ, ন্ত, ষ্ঠ, ক্ষ) ভেঙে শব্দ-বাক্য ও ৩৩+ WPM পঠন',
        literacyEnglishTarget: 'Introducing Myself, Commands ও ছোট সংলাপ নির্ভুল উচ্চারণে বলা',
        numeracyMathTarget: 'হাজারের ঘর পর্যন্ত যোগ-বিয়োগ ও ২–১০ নামতা দ্রুত বলা',
        readingWpmGoal: 33,
        diagnosticPrompt: 'ভাষা শহিদ পাঠ থেকে ৬টি যুক্তবর্ণ ভেঙে পড়া ও অঙ্কে স্থানীয় মান যাচাই করুন।',
        remedialAction: 'ফ্ল্যাশকার্ড গেমে যুক্তবর্ণ জোড়া লাগানো ও সংখ্যা ব্লক ব্যবহার।',
      },
      'চতুর্থ শ্রেণি': {
        literacyBanglaTarget: 'প্রমিত উচ্চারণে অনুচ্ছেদ পঠন (৪৫+ WPM) ও শুদ্ধ শ্রুতলিপি',
        literacyEnglishTarget: 'Greetings, Numbers (1–1000) ও শূন্যস্থান পূরণ দক্ষতা',
        numeracyMathTarget: 'গুণ্য-গুণক-গুণফল ও ৪ অঙ্কের যোগ-বিয়োগের কথার অঙ্ক',
        readingWpmGoal: 45,
        diagnosticPrompt: 'বোধগম্যতাসহ পড়ার পাশাপাশি ৬ লাইনের শ্রুতলিপিতে বানান শুদ্ধতা যাচাই করুন।',
        remedialAction: 'দৈনিক ৩টি কঠিন বানান ডিক্টেশন ও খাতা পারস্পরিক মূল্যায়ন।',
      },
      'পঞ্চম শ্রেণি': {
        literacyBanglaTarget: '৫৪+ WPM পঠন গতি, সন্ধি/বিপরীত শব্দ ও মুক্তিযুদ্ধ বিষয়ক অনুচ্ছেদ বিশ্লেষণ',
        literacyEnglishTarget: 'Greeting, Asking Questions ও Short Dialogue পঠন',
        numeracyMathTarget: 'চার প্রক্রিয়ার মিশ্র হিসাব (বন্ধনী ব্যবহার) ও ঐকিক নিয়মের প্রাথমিক ধারণা',
        readingWpmGoal: 54,
        diagnosticPrompt: 'সরল বন্ধনী `( )` যুক্ত গাণিতিক বাক্য ও মুক্তিযুদ্ধের পাঠ থেকে ৫টি প্রশ্নোত্তর যাচাই।',
        remedialAction: 'BODMAS/ধারাবাহিক প্রক্রিয়ার বোর্ড অনুশীলন ও সহপাঠী দলগত কাজ।',
      },
    },
  },
  {
    monthIndex: 2,
    monthName: 'মার্চ',
    shortName: 'মার্চ',
    focusTheme: 'বোধগম্য পঠন (Comprehension) ও চার প্রক্রিয়ার বাস্তব প্রয়োগ',
    classTargets: {
      'তৃতীয় শ্রেণি': {
        literacyBanglaTarget: 'পাঠ্যাংশ পড়ে নিজে থেকে ৩টি প্রশ্নের উত্তর বলা-লেখা (৩৫+ WPM)',
        literacyEnglishTarget: 'Days of the week, Numbers & Capital letters/Full stop ব্যবহার',
        numeracyMathTarget: '২ ও ৩ অঙ্কের গুণ ও নামতার সাহায্যে প্রাথমিক ভাগ',
        readingWpmGoal: 35,
        diagnosticPrompt: 'গল্প পড়ে "কে, কী, কোথায়, কেন" প্রশ্নের উত্তর লিখতে পারছে কি না যাচাই।',
        remedialAction: 'বড় বই (Big Book) ব্যবহার করে প্রশ্ন করার কৌশল শেখানো।',
      },
      'চতুর্থ শ্রেণি': {
        literacyBanglaTarget: 'পাঠের সমার্থক-বিপরীত শব্দ ও বিরামচিহ্ন (দাঁড়ি, কমা, প্রশ্নবোধক) প্রয়োগ',
        literacyEnglishTarget: 'Days, Months ও Time-related WH Questions উত্তর লেখা',
        numeracyMathTarget: '২ অঙ্কের ভাজক দিয়ে ৩–৪ অঙ্কের ভাগ ও অবশেষ নির্ণয়',
        readingWpmGoal: 48,
        diagnosticPrompt: 'ভাগফল ও ভাগশেষ যাচাই এবং অনুচ্ছেদে সঠিক বিরামচিহ্ন বসানো পরীক্ষা করুন।',
        remedialAction: 'ভাগের ধাপ (অঙ্ক নামানো ও বিয়োগ) ধাপে ধাপে বোর্ডে দেখানো।',
      },
      'পঞ্চম শ্রেণি': {
        literacyBanglaTarget: '৫৬+ WPM গতিতে পঠন এবং আনসিন অনুচ্ছেদ থেকে বোধগম্য উত্তর',
        literacyEnglishTarget: 'Seen passage থেকে WH-Questions তৈরি ও Vocabulary ব্যবহার',
        numeracyMathTarget: 'গুণিতক-গুণনীয়ক, মৌলিক উৎপাদক, লসাগু ও গসাগু সমস্যা সমাধান',
        readingWpmGoal: 56,
        diagnosticPrompt: 'দুই বা তিনটি সংখ্যার গসাগু ও লসাগুর বাস্তব প্রয়োগের অঙ্ক যাচাই।',
        remedialAction: 'গুণনীয়ক গাছ ও সংক্ষিপ্ত ভাগ পদ্ধতিতে লসাগু অনুশীলন।',
      },
    },
  },
  {
    monthIndex: 3,
    monthName: 'এপ্রিল',
    shortName: 'এপ্রিল',
    focusTheme: '১ম প্রান্তিক সমাপনী প্রস্তুতি — লিখিত প্রকাশ ও কাঠামোবদ্ধ অঙ্ক',
    classTargets: {
      'তৃতীয় শ্রেণি': {
        literacyBanglaTarget: '৪–৫ বাক্যে নিজের গ্রাম/বিদ্যালয় অনুচ্ছেদ লেখা ও ৩৭+ WPM পঠন',
        literacyEnglishTarget: 'Simple Q&A, Punctuation ও ২০+ দৈনন্দিন ইংরেজি শব্দ বানান',
        numeracyMathTarget: 'চার প্রক্রিয়ার ১ম প্রান্তিক কথার অঙ্ক ও মানসাঙ্ক',
        readingWpmGoal: 37,
        diagnosticPrompt: '১ম প্রান্তিক প্রশ্নকাঠামো অনুযায়ী লিখিত প্রশ্নোত্তর ও সময়মতো সমাধান যাচাই।',
        remedialAction: '১ম প্রান্তিক পরীক্ষার আগে দুর্বল শিক্ষার্থীদের নিয়ে রিভিশন ক্লিনিক।',
      },
      'চতুর্থ শ্রেণি': {
        literacyBanglaTarget: '৫০+ WPM গতি, কবিতার মূলভাব ও সহজ আবেদনপত্রের কাঠামো অনুশীলন',
        literacyEnglishTarget: 'Paragraph (4 sentences) ও Capitalization-Punctuation নির্ভুল প্রয়োগ',
        numeracyMathTarget: 'মৌলিক সংখ্যা, বিভাজ্যতা ও চার প্রক্রিয়ার ২–৩ ধাপের অঙ্ক',
        readingWpmGoal: 50,
        diagnosticPrompt: 'মৌখিক পঠন + ১ম প্রান্তিক মডেল টেস্টে অর্জিত নম্বর মূল্যায়ন।',
        remedialAction: 'ভুল বানান ও অঙ্কের ধাপ চিহ্নিত করে ব্যক্তিগত ফিডব্যাক দেওয়া।',
      },
      'পঞ্চম শ্রেণি': {
        literacyBanglaTarget: '৫৮+ WPM গতি, যুক্তবর্ণ-এক কথায় প্রকাশ ও ফরম পূরণ দক্ষতা',
        literacyEnglishTarget: 'Time, Days ও Punctuation সহ Guided Writing (5+ sentences)',
        numeracyMathTarget: 'গাণিতিক প্রতীক, খোলা বাক্য, গসাগু-লসাগু ও প্রথম প্রান্তিক অঙ্ক',
        readingWpmGoal: 58,
        diagnosticPrompt: '১ম প্রান্তিক মূল্যায়নের আলোকে সমগ্র শ্রেণির FLN স্কোরকার্ড হালনাগাদ।',
        remedialAction: 'দুর্বল সূচকগুলোর জন্য অভিভাবক সংযোগ ও বিশেষ বাসার কাজ।',
      },
    },
  },
  {
    monthIndex: 4,
    monthName: 'মে',
    shortName: 'মে',
    focusTheme: 'মধ্য-বছর নিরাময় (Mid-Year Bridge) ও ভগ্নাংশ-ব্যাকরণ প্রবেশিকা',
    classTargets: {
      'তৃতীয় শ্রেণি': {
        literacyBanglaTarget: 'বিশেষ্য-বিশেষণ-ক্রিয়া পদ চেনা এবং মিনিটে ৩৮+ শব্দ পঠন',
        literacyEnglishTarget: 'What/Where/Who প্রশ্ন করা ও উত্তর লেখা',
        numeracyMathTarget: 'ভগ্নাংশের প্রাথমিক ধারণা (অর্ধেক, এক-চতুর্থাংশ) ও টাকা-পয়সার হিসাব',
        readingWpmGoal: 38,
        diagnosticPrompt: '১ম প্রান্তিকে যারা পিছিয়ে ছিল তাদের উন্নতি পুনঃযাচাই ও ভগ্নাংশের চিত্র বোঝা পরীক্ষা।',
        remedialAction: 'কাগজ ভাঁজ করে ভগ্নাংশ দেখানো ও পদ চেনার কার্ড খেলা।',
      },
      'চতুর্থ শ্রেণি': {
        literacyBanglaTarget: 'সমাপিকা-অসমাপিকা ক্রিয়া, কাল ও ৫২+ WPM গতিতে পঠন',
        literacyEnglishTarget: 'Pronouns, Verbs ও Short Letter পড়তে ও সাজাতে পারা',
        numeracyMathTarget: 'প্রকৃত-অপ্রকৃত ও মিশ্র ভগ্নাংশের রূপান্তর ও যোগ-বিয়োগ',
        readingWpmGoal: 52,
        diagnosticPrompt: 'সমহর ভগ্নাংশে রূপান্তর ও বাংলা বাক্যে ক্রিয়াপদের কাল পরিবর্তন যাচাই।',
        remedialAction: 'রঙিন ফিতা/বার মডেল দিয়ে ভগ্নাংশ সমতুল্যতা প্রদর্শন।',
      },
      'পঞ্চম শ্রেণি': {
        literacyBanglaTarget: '৬০+ WPM পঠন, কারক-বিভক্তি প্রাথমিক ধারণা ও কবিতার ভাবার্থ লেখা',
        literacyEnglishTarget: 'Unseen passage reading ও WH-question গঠন অনুশীলন',
        numeracyMathTarget: 'ভগ্নাংশের গুণ-ভাগ ও এর-ব্যবহারসহ মিশ্র সমস্যা',
        readingWpmGoal: 60,
        diagnosticPrompt: 'ভগ্নাংশের গুণ-ভাগের বিপরীত ভগ্নাংশ নিয়ম ও আনসিন বোঝার ক্ষমতা যাচাই।',
        remedialAction: 'ভগ্নাংশের নিয়ম প্রদর্শনী চার্ট ও ১০টি সহজ মানসাঙ্ক চর্চা।',
      },
    },
  },
  {
    monthIndex: 5,
    monthName: 'জুন',
    shortName: 'জুন',
    focusTheme: 'অর্ধবার্ষিক সাবলীলতা, দশমিক ভগ্নাংশ ও স্বাধীন লিখন বিকাশ',
    classTargets: {
      'তৃতীয় শ্রেণি': {
        literacyBanglaTarget: '৪০+ WPM গতি, কবিতা মুখস্থ ও যতিচিহ্ন মেনে পঠন',
        literacyEnglishTarget: 'Seasons, Weather & Singular-Plural শব্দ রূপান্তর',
        numeracyMathTarget: 'টাকা-পয়সা ও দৈর্ঘ্য-ওজন-তরলের সাধারণ পরিমাপ রূপান্তর',
        readingWpmGoal: 40,
        diagnosticPrompt: 'মিনিটে ৪০ শব্দ অর্জিত হয়েছে কি না এবং মিটার-সেন্টিমিটার রূপান্তর যাচাই।',
        remedialAction: 'স্কেল ও দাঁড়িপাল্লা ব্যবহার করে শ্রেণিকক্ষে বাস্তব পরিমাপ অনুশীলন।',
      },
      'চতুর্থ শ্রেণি': {
        literacyBanglaTarget: '৫৪+ WPM গতি, ফরম পূরণ ও ৬–৭ বাক্যে স্বাধীন অনুচ্ছেদ রচনা',
        literacyEnglishTarget: 'Prepositions, Tense (Present/Past) & Short Composition',
        numeracyMathTarget: 'দশমিক ভগ্নাংশ পরিচিতি, স্থানের মান ও দশমিকের যোগ-বিয়োগ',
        readingWpmGoal: 54,
        diagnosticPrompt: 'দশমিক বিন্দু ঠিক রেখে যোগ-বিয়োগ ও ইংরেজি Preposition ব্যবহার যাচাই।',
        remedialAction: 'টাকা-পয়সার উদাহরণের মাধ্যমে দশমিকের ধারণা সহজীকরণ।',
      },
      'পঞ্চম শ্রেণি': {
        literacyBanglaTarget: '৬২+ WPM গতি, বিপরীত-সমার্থক শব্দ ও ছুটির আবেদন/চিঠি লিখন',
        literacyEnglishTarget: 'Letter/Email writing format ও ৪২+ WPM ইংরেজি পঠন',
        numeracyMathTarget: 'দশমিকের গুণ-ভাগ এবং গড় নির্ণয়ের বাস্তব অঙ্ক',
        readingWpmGoal: 62,
        diagnosticPrompt: 'দশমিক সংখ্যার গুণ-ভাগে বিন্দু স্থাপন ও গড়ের কথার অঙ্ক পরীক্ষা।',
        remedialAction: 'প্রতিদিন বোর্ডে ২টি দশমিক গুণ-ভাগ ও ১টি গড় অঙ্ক একসাথে সমাধান।',
      },
    },
  },
  {
    monthIndex: 6,
    monthName: 'জুলাই',
    shortName: 'জুলাই',
    focusTheme: 'মধ্য-বার্ষিক সমন্বিত মূল্যায়ন (Midline) ও দুর্বলতা দূরীকরণ',
    classTargets: {
      'তৃতীয় শ্রেণি': {
        literacyBanglaTarget: '৪১+ WPM গতি ও ২–৩টি যুক্তবর্ণযুক্ত অদেখা অনুচ্ছেদ পড়া',
        literacyEnglishTarget: 'Paragraph reading (30+ words) & Simple dialogue speaking',
        numeracyMathTarget: 'জ্যামিতিক বিন্দু, রেখা, কোণ এবং সমতল ক্ষেত্র চেনা',
        readingWpmGoal: 41,
        diagnosticPrompt: 'বছরের অর্ধেক শেষে প্রতিটি সূচকে Baseline বনাম Midline অগ্রগতি পরিমাপ।',
        remedialAction: 'কোন শিক্ষার্থী এখনও বর্ণ/যুক্তবর্ণ বা যোগ-বিয়োগে আটকে আছে তার বিশেষ তালিকা।',
      },
      'চতুর্থ শ্রেণি': {
        literacyBanglaTarget: '৫৫+ WPM গতি ও যুক্তিনির্ভর বোধগম্যতা প্রশ্নের উত্তর',
        literacyEnglishTarget: 'Reading unseen text (40+ words) & Answering 3 WH questions',
        numeracyMathTarget: 'কোণ পরিমাপ (চাঁদার ব্যবহার), ত্রিভুজের প্রকারভেদ ও সময় পরিমাপ',
        readingWpmGoal: 55,
        diagnosticPrompt: 'চাঁদা ধরে সূক্ষ্ম, সম ও স্থূলকোণ আঁকা-মাপা এবং Midline FLN প্রোফাইল তৈরি।',
        remedialAction: 'ব্যবহারিক জ্যামিতি বক্স সেশন ও জোড়ায় পঠন স্পিড বুস্টার।',
      },
      'পঞ্চম শ্রেণি': {
        literacyBanglaTarget: '৬৩+ WPM গতি, বিরামচিহ্ন ও বাগধারা-শুদ্ধ বাক্য গঠন',
        literacyEnglishTarget: 'Rearranging words/sentences & Unseen passage comprehension',
        numeracyMathTarget: 'শতকরা ধারণা, ভগ্নাংশ-দশমিক-শতকরা রূপান্তর ও গড় প্রয়োগ',
        readingWpmGoal: 63,
        diagnosticPrompt: 'Midline যাচাই: শতকরা থেকে লাভ-ক্ষতি ও ইংরেজি বাক্য সাজানোর দক্ষতা পরীক্ষা।',
        remedialAction: '১০০-গ্রিড চার্ট দিয়ে শতকরা বোঝানো ও সাপ্তাহিক স্পোকেন অনুশীলন।',
      },
    },
  },
  {
    monthIndex: 7,
    monthName: 'আগস্ট',
    shortName: 'আগস্ট',
    focusTheme: '২য় প্রান্তিক দক্ষতা দৃঢ়ীকরণ — জ্যামিতি, পরিমাপ ও সৃজনশীল লিখন',
    classTargets: {
      'তৃতীয় শ্রেণি': {
        literacyBanglaTarget: '৪২+ WPM, ২ দিনের ছুটির আবেদন ও চিঠির কাঠামো লেখা',
        literacyEnglishTarget: '30+ WPM ইংরেজি পঠন ও Simple sentence punctuation',
        numeracyMathTarget: '২য় প্রান্তিক গুণ-ভাগ, ভগ্নাংশ তুলনা ও সময় (ঘণ্টা-মিনিট) হিসাব',
        readingWpmGoal: 42,
        diagnosticPrompt: 'আবেদনপত্রের সঠিক ঠিকানা-সমাপ্তি ও ঘড়ি দেখে সময় হিসাবের যাচাই।',
        remedialAction: 'আবেদন লেখার টেমপ্লেট কার্ড ও বাস্তব ঘড়ির মডেল অনুশীলন।',
      },
      'চতুর্থ শ্রেণি': {
        literacyBanglaTarget: '৫৬+ WPM, চিঠি লিখন ও তথ্যমূলক অনুচ্ছেদ থেকে প্রশ্ন তৈরি',
        literacyEnglishTarget: 'Simple Future Tense ও ৪–৫ বাক্যে অনুচ্ছেদ রচনা',
        numeracyMathTarget: 'ক্ষেত্রফল (আয়ত ও বর্গ), পরিসীমা ও উপাত্ত ট্যালি চিহ্ন',
        readingWpmGoal: 56,
        diagnosticPrompt: 'আয়ত ও বর্গের পরিসীমা-ক্ষেত্রফলের পার্থক্য ও ট্যালি টেবিল তৈরি যাচাই।',
        remedialAction: 'গ্রাফ/ছক কাগজে ক্ষেত্রফল গণনা ও ইংরেজি গাইডেড রাইটিং।',
      },
      'পঞ্চম শ্রেণি': {
        literacyBanglaTarget: '৬৪+ WPM, সমাপনী আনসিন অনুচ্ছেদ ও ভাবসম্প্রসারণ-রচনা',
        literacyEnglishTarget: 'শতভাগ প্রমিত উচ্চারণে পঠন (৪৫+ WPM) ও Application/Letter লেখা',
        numeracyMathTarget: 'শতকরা (লাভ-ক্ষতি, মুনাফা) ও সামান্তরিক-রম্বস-ট্রাপিজিয়াম জ্যামিতি',
        readingWpmGoal: 64,
        diagnosticPrompt: 'মুনাফা ও লাভ-ক্ষতির সূত্র প্রয়োগ এবং ৫ম শ্রেণির জ্যামিতিক চিত্রাঙ্কন যাচাই।',
        remedialAction: 'দলীয়ভাবে ৫ম শ্রেণির জ্যামিতি বৈশিষ্ট্য তুলনা পোস্টার তৈরি।',
      },
    },
  },
  {
    monthIndex: 8,
    monthName: 'সেপ্টেম্বর',
    shortName: 'সেপ্টে',
    focusTheme: 'উপাত্ত বিশ্লেষণ, প্রমিত লিখন ও ৩য় প্রান্তিক অগ্রযাত্রা',
    classTargets: {
      'তৃতীয় শ্রেণি': {
        literacyBanglaTarget: '৪৩+ WPM সাবলীল পঠন ও গল্পের চরিত্র-নৈতিকতা বিশ্লেষণ',
        literacyEnglishTarget: 'Occupation, Animals & 4–5 sentence guided paragraph',
        numeracyMathTarget: 'টাকা-পয়সা ও বাজারের হিসাব-নিকাশ এবং চতুর্ভুজ/ত্রিভুজ',
        readingWpmGoal: 43,
        diagnosticPrompt: 'রোল-প্লে (দোকানদার-ক্রেতা) খেলায় হিসাব ও নৈতিক গল্পের প্রশ্নোত্তর যাচাই।',
        remedialAction: 'নিরাময় শিক্ষার্থীদের জন্য ফ্ল্যাশকার্ড রিডিং ও ২ ধাপের কথার অঙ্ক।',
      },
      'চতুর্থ শ্রেণি': {
        literacyBanglaTarget: '৫৭+ WPM, এক কথায় প্রকাশ, ফরম পূরণ ও রচনা রচনাশৈলী',
        literacyEnglishTarget: '38+ WPM ইংরেজি পঠন, Punctuation & WH Questions',
        numeracyMathTarget: 'দশমিক-ভগ্নাংশের মিশ্র সমস্যা ও স্তম্ভলেখ পাঠ',
        readingWpmGoal: 57,
        diagnosticPrompt: 'স্তম্ভলেখ পড়ে ৫টি প্রশ্নের উত্তর এবং বাংলা ফরম পূরণ যাচাই।',
        remedialAction: 'বাস্তব শ্রেণি উপস্থিতি থেকে স্তম্ভলেখ আঁকার অনুশীলন।',
      },
      'পঞ্চম শ্রেণি': {
        literacyBanglaTarget: '৬৫+ WPM গতি ও সৃজনশীল প্রবন্ধ/অনুচ্ছেদে শব্দের সমৃদ্ধ ব্যবহার',
        literacyEnglishTarget: '46+ WPM পঠন, Matching, True/False & WH Questions mastery',
        numeracyMathTarget: 'বৃত্ত (কেন্দ্র, ব্যাস, ব্যাসার্ধ, জ্যা) ও পরিমাপের সকল একক রূপান্তর',
        readingWpmGoal: 65,
        diagnosticPrompt: 'কম্পাস দিয়ে বৃত্ত এঁকে ব্যাস-ব্যাসার্ধ চিহ্নিতকরণ ও একক রূপান্তর পরীক্ষা।',
        remedialAction: 'কিলো-হেক্টো-ডেকা সিঁড়ি চার্ট দিয়ে পরিমাপ একক দৃঢ়ীকরণ।',
      },
    },
  },
  {
    monthIndex: 9,
    monthName: 'অক্টোবর',
    shortName: 'অক্টো',
    focusTheme: 'সমন্বিত দক্ষতা ও যোগ্যতাভিত্তিক সমস্যা সমাধান চর্চা',
    classTargets: {
      'তৃতীয় শ্রেণি': {
        literacyBanglaTarget: '৪৪+ WPM, অদেখা অনুচ্ছেদ পঠন ও নিজ ভাষায় ৫ বাক্য লেখা',
        literacyEnglishTarget: '32+ WPM, Daily routine & Punctuation নির্ভুলতা',
        numeracyMathTarget: 'সকল প্রান্তিকের চার প্রক্রিয়া, ভগ্নাংশ ও জ্যামিতি সমন্বয়',
        readingWpmGoal: 44,
        diagnosticPrompt: 'শ্রেণির কোন কোন শিক্ষার্থী এখনও প্রান্তিক যোগ্যতার ৭৫% অর্জন করেনি তা চিহ্নিত।',
        remedialAction: 'টার্গেট-ভিত্তিক ওয়ান-টু-ওয়ান রিডিং ও নামতা বুস্টার।',
      },
      'চতুর্থ শ্রেণি': {
        literacyBanglaTarget: '৫৮+ WPM, যুক্তবর্ণ-বিরামচিহ্ন-রচনা ও বোধগম্যতায় পূর্ণ দক্ষতা',
        literacyEnglishTarget: '40+ WPM, Unseen comprehension & 5-sentence free writing',
        numeracyMathTarget: 'লসাগু-গসাগু, ভগ্নাংশ-দশমিক ও ক্ষেত্রফল সমস্যার মডেল চর্চা',
        readingWpmGoal: 58,
        diagnosticPrompt: '৩য় প্রান্তিকের পূর্ণ প্রশ্নকাঠামো ধরে পঠন ও গণিতের যোগ্যতাভিত্তিক মূল্যায়ন।',
        remedialAction: 'দুর্বল শিক্ষার্থীদের ছোট দলে এনে ৪৫ মিনিটের বিশেষ রিমিডিয়াল ক্লাস।',
      },
      'পঞ্চম শ্রেণি': {
        literacyBanglaTarget: '৬৬+ WPM, আনসিন অনুচ্ছেদ-আবেদনপত্র-রচনা নির্ভুল সময়-সচেতন লিখন',
        literacyEnglishTarget: '48+ WPM, Complete unseen passage + letter + composition',
        numeracyMathTarget: 'সময়, দূরত্ব-গতি, উপাত্ত বিন্যস্তকরণ (স্তম্ভলেখ) ও ক্যালকুলেটর-মুক্ত মানসাঙ্ক',
        readingWpmGoal: 66,
        diagnosticPrompt: 'সমাপনী উপযোগী পূর্ণাঙ্গ মক-FLN পরীক্ষা (সময়ের মধ্যে নির্ভুল পঠন ও সমাধান)।',
        remedialAction: 'প্রতি শিক্ষার্থীর দুর্বল ২টি অধ্যায়/যোগ্য়তা চিহ্নিত করে চূড়ান্ত নিরাময় পরিকল্পনা।',
      },
    },
  },
  {
    monthIndex: 10,
    monthName: 'নভেম্বর',
    shortName: 'নভে',
    focusTheme: 'বার্ষিক চূড়ান্ত প্রস্তুতি, মডেল যাচাই ও নিরাময় সমাপন',
    classTargets: {
      'তৃতীয় শ্রেণি': {
        literacyBanglaTarget: '৪৫+ WPM সাবলীল পঠন ও ৩য় শ্রেণির সকল প্রান্তিক যোগ্যতা অর্জন',
        literacyEnglishTarget: '৩য় শ্রেণির সকল মৌলিক শব্দ, সংলাপ ও সহজ পঠন অর্জন',
        numeracyMathTarget: '৪ অঙ্কের ৪ প্রক্রিয়া, সমহর ভগ্নাংশ ও পরিমাপে ৮৫%+ দক্ষতা',
        readingWpmGoal: 45,
        diagnosticPrompt: 'বার্ষিক মূল্যায়নের পূর্বে চূড়ান্ত FLN যাচাই: কেউ নিরাময় স্তরে রয়েছে কি না পরীক্ষা।',
        remedialAction: 'নিরাময় শিক্ষার্থীদের জন্য সহজবোধ্য মিনি ওয়ার্কশিট ও সার্বক্ষণিক ফিডব্যাক।',
      },
      'চতুর্থ শ্রেণি': {
        literacyBanglaTarget: '৬০+ WPM পঠন ও ৪র্থ শ্রেণির বাংলা প্রান্তিক যোগ্যতার পূর্ণ বাস্তবায়ন',
        literacyEnglishTarget: '৪২+ WPM পঠন, WH questions & Guided writing mastery',
        numeracyMathTarget: 'বৃহৎ সংখ্যা, ভগ্নাংশ-দশমিক, পরিসীমা-ক্ষেত্রফল ও উপাত্ত বিশ্লেষণ',
        readingWpmGoal: 60,
        diagnosticPrompt: 'প্রস্তুতিমূলক মডেল মূল্যায়নের মাধ্যমে প্রতিটি যোগ্যতার চূড়ান্ত যাচাই।',
        remedialAction: 'মডেল পরীক্ষার ভুলগুলো বোর্ডে হাতে-কলমে সমাধান করে দেওয়া।',
      },
      'পঞ্চম শ্রেণি': {
        literacyBanglaTarget: '৬৮+ WPM গতিতে পঠন, বানান নির্ভুলতা ও সৃজনশীল রচনার পূর্ণ দক্ষতা',
        literacyEnglishTarget: '৫০+ WPM পঠন ও উচ্চতর দক্ষতাসহ ইংরেজি প্রান্তিক যোগ্যতা অর্জন',
        numeracyMathTarget: 'শতকরা, ঐকিক, গড়, জ্যামিতি ও পরিমাপের সকল যোগ্যতাভিত্তিক সমাধান',
        readingWpmGoal: 68,
        diagnosticPrompt: 'পঞ্চম শ্রেণির সমাপ্তিসূচক প্রান্তিক যোগ্যতার ১০০% অর্জন যাচাই ও প্রত্যয়ন।',
        remedialAction: 'উচ্চতর ও মৌলিক উভয় স্তরের শিক্ষার্থীদের জন্য চূড়ান্ত প্র্যাকটিস শিট।',
      },
    },
  },
  {
    monthIndex: 11,
    monthName: 'ডিসেম্বর',
    shortName: 'ডিসে',
    focusTheme: 'বার্ষিক Endline প্রান্তিক যোগ্যতা প্রতিবেদন ও পরবর্তী শ্রেণির প্রস্তুতি',
    classTargets: {
      'তৃতীয় শ্রেণি': {
        literacyBanglaTarget: '৩য় শ্রেণির সমাপ্তি Endline — ৪৫+ WPM ও পূর্ণ বোধগম্য পঠন সনদ',
        literacyEnglishTarget: '৪র্থ শ্রেণিতে উত্তরণের উপযোগী ইংরেজি পঠন-লিখন ভিত্তি',
        numeracyMathTarget: '৩য় শ্রেণির সকল গণিত প্রান্তিক যোগ্যতার চূড়ান্ত Endline অর্জন',
        readingWpmGoal: 45,
        diagnosticPrompt: 'জানুয়ারি (Baseline) থেকে ডিসেম্বর (Endline) পর্যন্ত ১২ মাসের পূর্ণ অগ্রগতি লিপিবদ্ধ করুন।',
        remedialAction: 'পরবর্তী শ্রেণির শিক্ষকের জন্য হ্যান্ডওভার নিরাময় নোট ও অভিভাবক অবহিতকরণ।',
      },
      'চতুর্থ শ্রেণি': {
        literacyBanglaTarget: '৪র্থ শ্রেণির Endline — ৬০+ WPM ও স্বাধীন লিখন প্রান্তিক যোগ্যতা সমাপ্তি',
        literacyEnglishTarget: '৫ম শ্রেণির উপযোগী Reading Fluency & Comprehension প্রস্তুতি',
        numeracyMathTarget: '৪র্থ শ্রেণির সকল প্রান্তিক যোগ্যতা সমাপ্তি ও ৫ম শ্রেণির সেতুবন্ধন',
        readingWpmGoal: 60,
        diagnosticPrompt: '১২ মাসের FLN বার্ষিক ম্যাট্রিক্স পর্যালোচনা ও চূড়ান্ত Endline গ্রেডিং সম্পন্ন করুন।',
        remedialAction: 'অল্প ঘাটতি থাকা শিক্ষার্থীদের জন্য শীতকালীন ছুটির আনন্দদায়ক অনুশীলন কার্ড প্রদান।',
      },
      'পঞ্চম শ্রেণি': {
        literacyBanglaTarget: 'প্রাথমিক শিক্ষা সমাপনী Endline — ৬৮+ WPM ও উচ্চতর ভাষা দক্ষতা',
        literacyEnglishTarget: 'মাধ্যমিক (৬ষ্ঠ শ্রেণি) উত্তরণের পূর্ণাঙ্গ ইংরেজি সাক্ষরতা যোগ্যতা',
        numeracyMathTarget: 'প্রাথমিক স্তরের সকল গাণিতিক প্রান্তিক যোগ্যতার চূড়ান্ত অর্জন',
        readingWpmGoal: 68,
        diagnosticPrompt: '১২ মাসের প্রান্তিক যোগ্যতাভিত্তিক চূড়ান্ত FLN প্রতিবেদন প্রিন্ট ও সংরক্ষণ করুন।',
        remedialAction: 'প্রাথমিক শিক্ষা সমাপ্তি উপলক্ষে উত্তীর্ণদের জন্য পরবর্তী ধাপের নির্দেশনা প্রদান।',
      },
    },
  },
];

export function getMonthTargetForClass(monthIndex: number, classLevel: string) {
  const milestone = MONTH_FLN_MILESTONES[monthIndex] || MONTH_FLN_MILESTONES[0];
  if (milestone.classTargets[classLevel]) {
    return milestone.classTargets[classLevel];
  }
  // Sensible adaptive benchmark for PP, Class 1, Class 2 using the 12-month theme
  const wpmByClass: Record<string, number> = {
    'প্রাক-প্রাথমিক': Math.min(15, 5 + monthIndex),
    'প্রথম শ্রেণি': 12 + Math.round((monthIndex / 11) * 12),
    'দ্বিতীয় শ্রেণি': 20 + Math.round((monthIndex / 11) * 14),
  };
  const goalWpm = wpmByClass[classLevel] ?? 30;
  return {
    literacyBanglaTarget:
      classLevel === 'প্রাক-প্রাথমিক'
        ? `${milestone.monthName} মাসে ধ্বনি-বর্ণ-ছবি মিলানো ও মৌখিক প্রকাশ যাচাই`
        : `${milestone.monthName} মাসে ${goalWpm}+ শব্দ/মিনিট গতিতে শুদ্ধ বাংলা পঠন ও বানান`,
    literacyEnglishTarget:
      classLevel === 'প্রাক-প্রাথমিক'
        ? `A–Z পরিচিতি, ছবি দেখে ইংরেজি শব্দ বলা ও কুশল বিনিময়`
        : `Phonics, Vocabulary ও পরিচিত ইংরেজি বাক্য পঠন-লিখন`,
    numeracyMathTarget:
      classLevel === 'প্রাক-প্রাথমিক'
        ? `১–২০ গণনা, তুলনা ও জ্যামিতিক আকার শনাক্তকরণ`
        : `${classLevel}-এর প্রান্তিক যোগ্যতা অনুযায়ী সংখ্যা ধারণা, যোগ-বিয়োগ-গুণ-ভাগ যাচাই`,
    readingWpmGoal: goalWpm,
    diagnosticPrompt: `${milestone.focusTheme} — ${classLevel}-এর মৌলিক সাক্ষরতা ও সংখ্যাবোধ যাচাই করুন।`,
    remedialAction: 'বর্ণ/কার্ড ও বাস্তব উপকরণ (কাঠি/মার্বেল) ব্যবহার করে সহায়ক অনুশীলন।',
  };
}

function makeDefaultMonthEntry(
  indicators: FlnIndicator[],
  baseLevel: FlnLevel,
  wpm: number,
  mathScore: number
): FlnMonthlyCheckEntry {
  const indMap: Record<string, FlnLevel> = {};
  indicators.forEach((ind, idx) => {
    indMap[ind.id] = idx === indicators.length - 1 && baseLevel === 'mastered' ? 'mastered' : baseLevel;
  });
  return {
    readingWpm: wpm,
    mathScore,
    indicators: indMap,
    remark:
      baseLevel === 'mastered'
        ? 'প্রান্তিক যোগ্যতা অর্জিত'
        : baseLevel === 'developing'
        ? 'নিয়মিত চর্চা চলমান'
        : 'নিরাময়মূলক সহায়তা চালু',
  };
}

export function buildInitialFlnRecords(): FlnStudentRecord[] {
  const c3Inds = FLN_INDICATORS_BY_CLASS['তৃতীয় শ্রেণি'];
  const c4Inds = FLN_INDICATORS_BY_CLASS['চতুর্থ শ্রেণি'];
  const c5Inds = FLN_INDICATORS_BY_CLASS['পঞ্চম শ্রেণি'];

  return [
    {
      id: 'fln-c3-1',
      classLevel: 'তৃতীয় শ্রেণি',
      roll: '০১',
      studentName: 'তাসনিম জাহান',
      months: {
        '0': makeDefaultMonthEntry(c3Inds, 'developing', 32, 76),
        '1': makeDefaultMonthEntry(c3Inds, 'developing', 35, 80),
        '2': makeDefaultMonthEntry(c3Inds, 'mastered', 38, 84),
        '3': makeDefaultMonthEntry(c3Inds, 'mastered', 41, 88),
        '4': makeDefaultMonthEntry(c3Inds, 'mastered', 42, 89),
        '5': makeDefaultMonthEntry(c3Inds, 'mastered', 44, 90),
        '6': makeDefaultMonthEntry(c3Inds, 'mastered', 45, 92),
        '7': makeDefaultMonthEntry(c3Inds, 'mastered', 46, 93),
        '8': makeDefaultMonthEntry(c3Inds, 'mastered', 47, 94),
        '9': makeDefaultMonthEntry(c3Inds, 'mastered', 48, 95),
        '10': makeDefaultMonthEntry(c3Inds, 'mastered', 49, 96),
      },
    },
    {
      id: 'fln-c3-2',
      classLevel: 'তৃতীয় শ্রেণি',
      roll: '০২',
      studentName: 'রাফি আহমেদ',
      months: {
        '0': makeDefaultMonthEntry(c3Inds, 'remedial', 19, 48),
        '1': makeDefaultMonthEntry(c3Inds, 'remedial', 23, 55),
        '2': makeDefaultMonthEntry(c3Inds, 'developing', 28, 64),
        '3': makeDefaultMonthEntry(c3Inds, 'developing', 31, 68),
        '4': makeDefaultMonthEntry(c3Inds, 'developing', 34, 72),
        '5': makeDefaultMonthEntry(c3Inds, 'developing', 36, 75),
        '6': makeDefaultMonthEntry(c3Inds, 'mastered', 40, 80),
        '7': makeDefaultMonthEntry(c3Inds, 'mastered', 41, 82),
        '8': makeDefaultMonthEntry(c3Inds, 'mastered', 43, 84),
        '9': makeDefaultMonthEntry(c3Inds, 'mastered', 44, 86),
        '10': makeDefaultMonthEntry(c3Inds, 'mastered', 46, 88),
      },
    },
    {
      id: 'fln-c3-3',
      classLevel: 'তৃতীয় শ্রেণি',
      roll: '০৩',
      studentName: 'নুসরাত মীম',
      months: {
        '0': makeDefaultMonthEntry(c3Inds, 'developing', 29, 70),
        '1': makeDefaultMonthEntry(c3Inds, 'developing', 31, 74),
        '2': makeDefaultMonthEntry(c3Inds, 'developing', 33, 76),
        '3': makeDefaultMonthEntry(c3Inds, 'mastered', 38, 82),
        '4': makeDefaultMonthEntry(c3Inds, 'mastered', 39, 84),
        '5': makeDefaultMonthEntry(c3Inds, 'mastered', 40, 85),
        '6': makeDefaultMonthEntry(c3Inds, 'developing', 40, 79),
        '7': makeDefaultMonthEntry(c3Inds, 'mastered', 43, 85),
        '8': makeDefaultMonthEntry(c3Inds, 'mastered', 44, 87),
        '9': makeDefaultMonthEntry(c3Inds, 'mastered', 45, 89),
        '10': makeDefaultMonthEntry(c3Inds, 'mastered', 47, 91),
      },
    },
    {
      id: 'fln-c4-1',
      classLevel: 'চতুর্থ শ্রেণি',
      roll: '০১',
      studentName: 'মেহেদী হাসান',
      months: {
        '0': makeDefaultMonthEntry(c4Inds, 'developing', 40, 74),
        '1': makeDefaultMonthEntry(c4Inds, 'mastered', 46, 82),
        '2': makeDefaultMonthEntry(c4Inds, 'mastered', 49, 85),
        '3': makeDefaultMonthEntry(c4Inds, 'mastered', 51, 87),
        '4': makeDefaultMonthEntry(c4Inds, 'mastered', 53, 88),
        '5': makeDefaultMonthEntry(c4Inds, 'mastered', 55, 90),
        '6': makeDefaultMonthEntry(c4Inds, 'mastered', 56, 91),
        '7': makeDefaultMonthEntry(c4Inds, 'mastered', 58, 92),
        '8': makeDefaultMonthEntry(c4Inds, 'mastered', 59, 93),
        '9': makeDefaultMonthEntry(c4Inds, 'mastered', 61, 94),
        '10': makeDefaultMonthEntry(c4Inds, 'mastered', 63, 95),
      },
    },
    {
      id: 'fln-c4-2',
      classLevel: 'চতুর্থ শ্রেণি',
      roll: '০২',
      studentName: 'ফারহানা ইসলাম',
      months: {
        '0': makeDefaultMonthEntry(c4Inds, 'remedial', 27, 50),
        '1': makeDefaultMonthEntry(c4Inds, 'remedial', 32, 56),
        '2': makeDefaultMonthEntry(c4Inds, 'developing', 38, 65),
        '3': makeDefaultMonthEntry(c4Inds, 'developing', 42, 70),
        '4': makeDefaultMonthEntry(c4Inds, 'developing', 45, 74),
        '5': makeDefaultMonthEntry(c4Inds, 'developing', 48, 77),
        '6': makeDefaultMonthEntry(c4Inds, 'mastered', 52, 81),
        '7': makeDefaultMonthEntry(c4Inds, 'mastered', 54, 83),
        '8': makeDefaultMonthEntry(c4Inds, 'mastered', 56, 85),
        '9': makeDefaultMonthEntry(c4Inds, 'mastered', 58, 86),
        '10': makeDefaultMonthEntry(c4Inds, 'mastered', 60, 88),
      },
    },
    {
      id: 'fln-c5-1',
      classLevel: 'পঞ্চম শ্রেণি',
      roll: '০১',
      studentName: 'সাদিয়া আক্তার',
      months: {
        '0': makeDefaultMonthEntry(c5Inds, 'mastered', 54, 86),
        '1': makeDefaultMonthEntry(c5Inds, 'mastered', 57, 88),
        '2': makeDefaultMonthEntry(c5Inds, 'mastered', 59, 90),
        '3': makeDefaultMonthEntry(c5Inds, 'mastered', 61, 91),
        '4': makeDefaultMonthEntry(c5Inds, 'mastered', 63, 92),
        '5': makeDefaultMonthEntry(c5Inds, 'mastered', 64, 93),
        '6': makeDefaultMonthEntry(c5Inds, 'mastered', 66, 94),
        '7': makeDefaultMonthEntry(c5Inds, 'mastered', 68, 95),
        '8': makeDefaultMonthEntry(c5Inds, 'mastered', 69, 96),
        '9': makeDefaultMonthEntry(c5Inds, 'mastered', 70, 96),
        '10': makeDefaultMonthEntry(c5Inds, 'mastered', 72, 97),
      },
    },
    {
      id: 'fln-c5-2',
      classLevel: 'পঞ্চম শ্রেণি',
      roll: '০২',
      studentName: 'তানভীর ইসলাম',
      months: {
        '0': makeDefaultMonthEntry(c5Inds, 'remedial', 34, 52),
        '1': makeDefaultMonthEntry(c5Inds, 'developing', 40, 62),
        '2': makeDefaultMonthEntry(c5Inds, 'developing', 45, 68),
        '3': makeDefaultMonthEntry(c5Inds, 'developing', 48, 72),
        '4': makeDefaultMonthEntry(c5Inds, 'developing', 51, 75),
        '5': makeDefaultMonthEntry(c5Inds, 'developing', 54, 78),
        '6': makeDefaultMonthEntry(c5Inds, 'mastered', 59, 82),
        '7': makeDefaultMonthEntry(c5Inds, 'mastered', 61, 84),
        '8': makeDefaultMonthEntry(c5Inds, 'mastered', 63, 86),
        '9': makeDefaultMonthEntry(c5Inds, 'mastered', 65, 88),
        '10': makeDefaultMonthEntry(c5Inds, 'mastered', 68, 90),
      },
    },
    {
      id: 'fln-c5-3',
      classLevel: 'পঞ্চম শ্রেণি',
      roll: '০৩',
      studentName: 'মাহফুজ রহমান',
      months: {
        '0': makeDefaultMonthEntry(c5Inds, 'developing', 44, 72),
        '1': makeDefaultMonthEntry(c5Inds, 'developing', 47, 74),
        '2': makeDefaultMonthEntry(c5Inds, 'mastered', 53, 80),
        '3': makeDefaultMonthEntry(c5Inds, 'mastered', 56, 82),
        '4': makeDefaultMonthEntry(c5Inds, 'mastered', 58, 84),
        '5': makeDefaultMonthEntry(c5Inds, 'mastered', 60, 86),
        '6': makeDefaultMonthEntry(c5Inds, 'mastered', 61, 87),
        '7': makeDefaultMonthEntry(c5Inds, 'mastered', 63, 88),
        '8': makeDefaultMonthEntry(c5Inds, 'mastered', 64, 90),
        '9': makeDefaultMonthEntry(c5Inds, 'mastered', 66, 91),
        '10': makeDefaultMonthEntry(c5Inds, 'mastered', 69, 92),
      },
    },
  ];
}
