import { ANNUAL_LESSON_PLANS } from '../data/annualLessonPlans';
import { DateWisePlanRow, TermKey } from '../data/dateWiseAnnualPlans2026';
import { NCTB_LIBRARY, NctbBookEntry, NctbPart } from '../data/nctbLibrary';
import { toBanglaDigit } from './bangla';

export interface LessonTeacherGuideInput {
  classLevel: string;
  subject: string;
  term?: TermKey;
  dateBn?: string;
  weekdayBn?: string;
  sessionLabel?: string;
  chapterTitle: string;
  topicDetail: string;
  pageNumber?: string;
  durationMinutes?: number;
  isoDate?: string;
}

export interface TeachingMethodStep {
  stepNumber: string;
  title: string;
  duration: string;
  methodDetails: string[];
}

export interface ResolvedTeacherGuide {
  title: string;
  editionNote: string;
  partLabel: string;
  termWindow: string;
  bookSummary: string;
  learningOutcomes: string[];
  teachingMaterials: string[];
  methodSteps: TeachingMethodStep[];
  nctbGuideSteps: string[];
  assessmentFocus: string;
  remedialTips: string[];
  homeworkSuggestion: string;
  nctbPortalUrl: string;
}

function getPartNumberFromTerm(term?: TermKey): 1 | 2 | 3 {
  if (term === '২য় প্রান্তিক') return 2;
  if (term === '৩য় প্রান্তিক') return 3;
  return 1;
}

function findNctbEntry(classLevel: string, subject: string): NctbBookEntry | undefined {
  const exact = NCTB_LIBRARY.find(
    (e) => e.classLevel === classLevel && e.subject === subject
  );
  if (exact) return exact;

  if (classLevel === 'প্রাক-প্রাথমিক') {
    return NCTB_LIBRARY.find((e) => e.classLevel === 'প্রাক-প্রাথমিক');
  }

  if (
    subject.includes('ইসলাম') ||
    subject.includes('হিন্দু') ||
    subject.includes('বৌদ্ধ') ||
    subject.includes('খ্রিষ্ট') ||
    subject.includes('ধর্ম')
  ) {
    return (
      NCTB_LIBRARY.find(
        (e) => e.classLevel === classLevel && e.subject === 'ধর্ম ও নৈতিক শিক্ষা'
      ) || NCTB_LIBRARY.find((e) => e.subject === 'ধর্ম ও নৈতিক শিক্ষা')
    );
  }

  if (subject.includes('সমন্বিত')) {
    return (
      NCTB_LIBRARY.find(
        (e) => e.classLevel === 'তৃতীয় শ্রেণি' && e.subject === 'প্রাথমিক বিজ্ঞান'
      ) || undefined
    );
  }

  return NCTB_LIBRARY.find((e) => e.subject === subject);
}

function buildSubjectPedagogySteps(input: LessonTeacherGuideInput): TeachingMethodStep[] {
  const { subject, classLevel, chapterTitle, topicDetail, pageNumber, durationMinutes = 40 } = input;
  const pageNote = pageNumber ? `${pageNumber} নং পৃষ্ঠা` : 'নির্ধারিত পৃষ্ঠা';
  const totalMin = durationMinutes;
  const isPrePrimary = classLevel === 'প্রাক-প্রাথমিক';
  const isEnglish = subject === 'English for Today';
  const isMath = subject.includes('গণিত');
  const isBangla = subject.includes('বাংলা বই');
  const isScience = subject.includes('বিজ্ঞান');
  const isBgs = subject.includes('বিশ্বপরিচয়');
  const isArts = subject.includes('শিল্পকলা');
  const isHealth = subject.includes('স্বাস্থ্য');

  if (isPrePrimary) {
    return [
      {
        stepNumber: 'ধাপ ১',
        title: 'সকালের সমাবেশ, কুশল বিনিময় ও ছড়া',
        duration: '৫ মিনিট',
        methodDetails: [
          'শিশুদের হাসিমুখে স্বাগত জানিয়ে গোল হয়ে বসান এবং কুশল বিনিময় করুন।',
          `আজকের পাঠ "${topicDetail}" এর সাথে মিল রেখে একটি পরিচিত ছড়া বা অ্যাকশন গান পরিবেশন করুন।`,
        ],
      },
      {
        stepNumber: 'ধাপ ২',
        title: 'বাস্তব উপকরণ প্রদর্শন ও ছবি নিয়ে কথা বলা',
        duration: '১০ মিনিট',
        methodDetails: [
          `আমার বই-এর ${pageNote} থেকে ছবি/ফ্ল্যাশকার্ড দেখিয়ে শিশুদের মুক্তভাবে বলতে উৎসাহিত করুন।`,
          'সকল শিশুর কথা মনোযোগ দিয়ে শুনুন এবং সহজ বাংলায় প্রমিত শব্দ শোনান।',
        ],
      },
      {
        stepNumber: 'ধাপ ৩',
        title: 'শিখন কর্নারে খেলার ছলে অনুশীলন',
        duration: '১০ মিনিট',
        methodDetails: [
          'কল্পনা, ব্লক, বই ও আঁকার কর্নারে ছোট দলে শিশুদের হাতে-কলমে কাজ করতে দিন।',
          `মূল বিষয় "${chapterTitle || topicDetail}" আনন্দময় খেলার মাধ্যমে অনুশীলন করান।`,
        ],
      },
      {
        stepNumber: 'ধাপ ৪',
        title: 'পর্যবেক্ষণ ও বিদায় প্রস্তুতি',
        duration: '৫ মিনিট',
        methodDetails: [
          'কাজের মাধ্যমে শিশুর অংশগ্রহণ ও আনন্দ পর্যবেক্ষণ করুন (কোনো লিখিত পরীক্ষা নয়)।',
          'সবাইকে বাহবা দিয়ে উপকরণ গুছিয়ে রাখতে সাহায্য করুন।',
        ],
      },
    ];
  }

  if (isEnglish) {
    return [
      {
        stepNumber: 'Step 1',
        title: 'Warm-up & Greeting (আবেগ সৃষ্টি)',
        duration: '৫ মিনিট',
        methodDetails: [
          'Greet the class cheerfully ("Good morning, students!") and sing/recite a short rhyme.',
          `Connect with today's topic "${topicDetail}" using 2–3 simple oral questions or realia.`,
        ],
      },
      {
        stepNumber: 'Step 2',
        title: 'Input — Listen & Say (শিক্ষকের আদর্শ পাঠ)',
        duration: '১২ মিনিট',
        methodDetails: [
          `Ask students to open English for Today at ${pageNote} (${chapterTitle}).`,
          'Read aloud with clear pronunciation, stress, and intonation while pointing to pictures/words.',
          'Practice choral drill (teacher -> whole class -> small groups -> individual).',
        ],
      },
      {
        stepNumber: 'Step 3',
        title: 'Practice — Pair & Group Work (জোড়ায় ও দলীয় অনুশীলন)',
        duration: '১৩ মিনিট',
        methodDetails: [
          'Divide students into pairs/small groups to practice dialogues, vocabulary, or reading from the page.',
          'Move around the classroom to monitor pronunciation and assist shy or slow learners.',
        ],
      },
      {
        stepNumber: 'Step 4',
        title: 'Task / Assessment & Wrap-up (মূল্যায়ন ও সমাপ্তি)',
        duration: '১০ মিনিট',
        methodDetails: [
          'Check 4–5 students individually (oral reading / short notebook activity) to verify learning outcomes.',
          `Assign light home practice from ${pageNote} and close with encouraging feedback.`,
        ],
      },
    ];
  }

  if (isMath) {
    return [
      {
        stepNumber: 'ধাপ ১',
        title: 'কুশল বিনিময় ও পূর্বজ্ঞান যাচাই',
        duration: '৫ মিনিট',
        methodDetails: [
          'গণিতের মজার ধাঁধা বা দ্রুত মৌখিক গণনার মাধ্যমে শ্রেণিকক্ষে মনোযোগ আকর্ষণ করুন।',
          'পূর্বের শ্রেণি/পাঠের ২টি সহজ সমস্যা বোর্ডে সমাধান করে আজকের পাঠ ঘোষণা করুন।',
        ],
      },
      {
        stepNumber: 'ধাপ ২',
        title: 'বাস্তব পর্যায় (Concrete Stage — হাতে-কলমে)',
        duration: '১০ মিনিট',
        methodDetails: [
          `কাঠি, বীচি, কাগজের নোট বা বাস্তব উপকরণ ব্যবহার করে "${topicDetail}" এর মূল গাণিতিক ধারণাটি শিক্ষার্থীদের হাত দিয়ে অনুভব করান।`,
          'শিক্ষার্থীদের সামনে এনে উপকরণ সাজানো বা ভাগ/যোগ-বিয়োগ দেখানোর সুযোগ দিন।',
        ],
      },
      {
        stepNumber: 'ধাপ ৩',
        title: 'অর্ধবাস্তব ও বস্তুনিরপেক্ষ পর্যায় (Semi-Concrete & Abstract)',
        duration: '১৫ মিনিট',
        methodDetails: [
          `বইয়ের ${pageNote} খুলে ছবি/ব্লক/চিত্রের সাহায্যে ধারণাটি বুঝিয়ে দিন (অর্ধবাস্তব পর্যায়)।`,
          `এরপর বোর্ডে সংখ্যা ও প্রতীক ব্যবহার করে "${chapterTitle}" এর গাণিতিক প্রক্রিয়াটি ধাপে ধাপে সমাধান করে দেখান (বস্তুনিরপেক্ষ পর্যায়)।`,
        ],
      },
      {
        stepNumber: 'ধাপ ৪',
        title: 'দলীয় অনুশীলন, মূল্যায়ন ও নিরাময়',
        duration: `${Math.max(8, totalMin - 30)} মিনিট`,
        methodDetails: [
          `পাঠ্যবইয়ের ${pageNote} থেকে ১–২টি সমস্যা জোড়ায়/এককভাবে খাতায় করতে দিন।`,
          'পিছিয়ে পড়া শিক্ষার্থীদের পাশে বসে বুঝিয়ে দিন এবং বাড়ির কাজের নির্দেশনা দিন।',
        ],
      },
    ];
  }

  if (isBangla) {
    return [
      {
        stepNumber: 'ধাপ ১',
        title: 'আবেগ সৃষ্টি ও পূর্বজ্ঞান যাচাই',
        duration: '৫ মিনিট',
        methodDetails: [
          'পরিচিত ছড়া, গল্প বা পাঠ-সংশ্লিষ্ট ছবি দেখিয়ে শিক্ষার্থীদের কৌতূহল তৈরি করুন।',
          'ছবি সম্পর্কে ২–৩টি প্রশ্ন করে আজকের পাঠের শিরোনাম বোর্ডে লিখুন।',
        ],
      },
      {
        stepNumber: 'ধাপ ২',
        title: 'শিক্ষকের আদর্শ পাঠ ও শ্রবণ-কথন অনুশীলন',
        duration: '১২ মিনিট',
        methodDetails: [
          `আমার বাংলা বই-এর ${pageNote} খুলে প্রমিত বাংলা উচ্চারণ ও সঠিক বিরামচিহ্ন মেনে আদর্শ সরব পাঠ শোনান।`,
          `পাঠ্যাংশ "${topicDetail}" থেকে নতুন শব্দ ও যুক্তবর্ণ বোর্ডে ভেঙে (যেমন: বর্ণ + বর্ণ) উচ্চারণ ও অর্থ বুঝিয়ে দিন।`,
        ],
      },
      {
        stepNumber: 'ধাপ ৩',
        title: 'শিক্ষার্থীদের সরব, সমস্বর ও নীরব পাঠ',
        duration: '১৩ মিনিট',
        methodDetails: [
          'প্রথমে শিক্ষকের সাথে সমস্বরে, পরে জোড়ায় এবং এককভাবে সরব পাঠ অনুশীলন করান।',
          'দুর্বল পাঠকদের জন্য আলাদা ধ্বনি/বর্ণ ও শব্দ কার্ড ব্যবহার করে পড়তে সাহায্য করুন।',
        ],
      },
      {
        stepNumber: 'ধাপ ৪',
        title: 'বোধগম্যতা যাচাই, লিখন ও বাড়ির কাজ',
        duration: `${Math.max(8, totalMin - 30)} মিনিট`,
        methodDetails: [
          `পাঠের মূল ভাব নিয়ে মৌখিক প্রশ্ন এবং ${pageNote}-এর শূন্যস্থান/ছোট প্রশ্ন খাতায় লিখতে দিন।`,
          'খাতা মূল্যায়ন করে ধন্যবাদ জানান এবং বাড়িতে অনুশীলনের কাজ দিন।',
        ],
      },
    ];
  }

  if (isScience || isBgs) {
    return [
      {
        stepNumber: 'ধাপ ১',
        title: 'বাস্তব জীবনের অভিজ্ঞতা ও পাঠ পরিচিতি',
        duration: '৫ মিনিট',
        methodDetails: [
          `দৈনন্দিন পরিবেশ বা সমাজের বাস্তব ঘটনার সাথে "${topicDetail}" এর সম্পর্ক নিয়ে প্রশ্ন করে পাঠ শুরু করুন।`,
        ],
      },
      {
        stepNumber: 'ধাপ ২',
        title: 'অনুসন্ধান, পর্যবেক্ষণ ও ছবি/চার্ট বিশ্লেষণ',
        duration: '১৫ মিনিট',
        methodDetails: [
          `পাঠ্যবইয়ের ${pageNote} (${chapterTitle}) এর ছবি, ছক বা মানচিত্র পর্যবেক্ষণ করতে বলুন।`,
          isScience
            ? 'সম্ভব হলে শ্রেণিকক্ষে সহজ উপকরণে পর্যবেক্ষণ/পরীক্ষণ প্রদর্শন করে কারণ ও ফলাফল ব্যাখ্যা করুন।'
            : 'দলীয় আলোচনার মাধ্যমে ঐতিহাসিক বা সামাজিক দিকগুলো ছক আকারে বোর্ডে উপস্থাপন করুন।',
        ],
      },
      {
        stepNumber: 'ধাপ ৩',
        title: 'দলগত কাজ ও নীরব পাঠ',
        duration: '১২ মিনিট',
        methodDetails: [
          'শিক্ষার্থীদের ৩–৪টি দলে ভাগ করে মূল তথ্যগুলো খুঁজে বের করতে ও খাতায় সংক্ষেপে নোট করতে বলুন।',
          'প্রতিটি দল থেকে একজন উপস্থাপন করবে এবং শিক্ষক সংশোধনী ফিডব্যাক দেবেন।',
        ],
      },
      {
        stepNumber: 'ধাপ ৪',
        title: 'মূল্যায়ন ও সারসংক্ষেপ',
        duration: `${Math.max(6, totalMin - 32)} মিনিট`,
        methodDetails: [
          'মূল প্রশ্নগুলোর উত্তর মুখে ও খাতায় যাচাই করে পাঠের মূল বার্তা সংক্ষেপে পুনরালোচনা করুন।',
        ],
      },
    ];
  }

  if (isArts || isHealth) {
    return [
      {
        stepNumber: 'ধাপ ১',
        title: 'উপকরণ প্রস্তুতি ও প্রেরণা',
        duration: '৫ মিনিট',
        methodDetails: [
          `আজকের ব্যবহারিক কাজ "${topicDetail}" সম্পর্কে সংক্ষেপে ধারণা ও সুরক্ষা/পরিচ্ছন্নতা নিয়ম বলে দিন।`,
        ],
      },
      {
        stepNumber: 'ধাপ ২',
        title: 'শিক্ষকের সরাসরি প্রদর্শনী (Demonstration)',
        duration: '১০ মিনিট',
        methodDetails: [
          isArts
            ? `বোর্ডে ধাপে ধাপে রেখা, আকৃতি বা তাল-সুর প্রদর্শন করে ${pageNote} অনুযায়ী মডেল দেখান।`
            : `শরীরচর্চা, শ্বাস-প্রশ্বাস বা স্বাস্থ্যবিধির সঠিক ভঙ্গি ও ধাপগুলো নিজে করে দেখান।`,
        ],
      },
      {
        stepNumber: 'ধাপ ৩',
        title: 'ব্যবহারিক অনুশীলন ও পর্যবেক্ষণ',
        duration: '১৫ মিনিট',
        methodDetails: [
          'সব শিক্ষার্থীকে হাতে-কলমে অংশগ্রহণের সুযোগ দিন এবং ঘুরে ঘুরে উৎসাহ ও দিকনির্দেশনা দিন।',
        ],
      },
      {
        stepNumber: 'ধাপ ৪',
        title: 'প্রদর্শনী ও ধারাবাহিক মূল্যায়ন',
        duration: '৫ মিনিট',
        methodDetails: [
          'শিক্ষার্থীদের কাজ/অনুশীলনের প্রশংসা করুন এবং শিক্ষক সহায়িকার রুব্রিক্স অনুযায়ী দক্ষতা নোট করুন।',
        ],
      },
    ];
  }

  // Religion & Moral Education or General Subjects
  return [
    {
      stepNumber: 'ধাপ ১',
      title: 'কুশল বিনিময় ও নৈতিক গল্প/পূর্বজ্ঞান যাচাই',
      duration: '৫ মিনিট',
      methodDetails: [
        'পাঠের মূল নৈতিক শিক্ষার সাথে প্রাসঙ্গিক একটি ছোট বাস্তব উদাহরণ বা প্রশ্নের মাধ্যমে পাঠ শুরু করুন।',
      ],
    },
    {
      stepNumber: 'ধাপ ২',
      title: 'আদর্শ পাঠ, অর্থ বিশ্লেষণ ও মূল বক্তব্য উপস্থাপন',
      duration: '১৫ মিনিট',
      methodDetails: [
        `পাঠ্যবইয়ের ${pageNote} (${chapterTitle}) থেকে "${topicDetail}" অংশটি শুদ্ধ উচ্চারণে পড়ে অর্থ ও তাৎপর্য ব্যাখ্যা করুন।`,
        'ব্যক্তিগত ও সামাজিক জীবনে পাঠটির প্রয়োগ উদাহরণসহ আলোচনা করুন।',
      ],
    },
    {
      stepNumber: 'ধাপ ৩',
      title: 'সরব-নীরব পাঠ ও দলীয় আলোচনা',
      duration: '১২ মিনিট',
      methodDetails: [
        'শিক্ষার্থীদের দিয়ে পর্যায়ক্রমে পড়িয়ে উচ্চারণ সংশোধন করুন এবং অনুশীলনীর প্রশ্ন নিয়ে জোড়ায় আলোচনা করান।',
      ],
    },
    {
      stepNumber: 'ধাপ ৪',
      title: 'মূল্যায়ন ও আচরণিক প্রতিফলন',
      duration: `${Math.max(6, totalMin - 32)} মিনিট`,
      methodDetails: [
        'শূন্যস্থান, সংক্ষিপ্ত প্রশ্ন ও ভালো কাজের অঙ্গীকার যাচাই করে পাঠ সমাপ্ত করুন।',
      ],
    },
  ];
}

export function resolveLessonTeacherGuide(input: LessonTeacherGuideInput): ResolvedTeacherGuide {
  const nctbEntry = findNctbEntry(input.classLevel, input.subject);
  const partNumber = getPartNumberFromTerm(input.term);
  const matchedPart: NctbPart | undefined =
    nctbEntry?.parts.find((p) => p.partNumber === partNumber) || nctbEntry?.parts[0];

  const matchedAnnualPlan = ANNUAL_LESSON_PLANS.find(
    (p) =>
      p.classLevel === input.classLevel &&
      p.subject === input.subject &&
      (!input.term || p.term === input.term)
  );

  const methodSteps = buildSubjectPedagogySteps(input);
  const pageNote = input.pageNumber ? `${input.pageNumber} নং পৃষ্ঠা` : 'নির্ধারিত পৃষ্ঠা';
  const isEnglish = input.subject === 'English for Today';

  const learningOutcomes = isEnglish
    ? [
        `Students will be able to understand, pronounce, and practice "${input.topicDetail}" accurately.`,
        `Students will actively participate in pair/group work using ${input.subject} (${pageNote}).`,
      ]
    : [
        `"${input.topicDetail}" পাঠের মূল ধারণা স্পষ্টভাবে বুঝতে, বলতে ও ব্যাখ্যা করতে পারবে।`,
        `পাঠ্যবইয়ের (${pageNote}) সংশ্লিষ্ট কাজ, পঠন ও অনুশীলন সঠিকভাবে সম্পন্ন করতে পারবে।`,
        ...(matchedAnnualPlan?.learningOutcomes?.slice(0, 1) || []),
      ];

  const teachingMaterials = Array.from(
    new Set([
      `${input.subject} পাঠ্যবই (${input.classLevel})`,
      'শিক্ষক সহায়িকা (TG — NCTB)',
      ...(matchedPart?.teachingMaterials || ['ফ্ল্যাশকার্ড / চার্ট / বাস্তব উপকরণ']),
      'চক, ডাস্টার ও বোর্ড',
    ])
  );

  const remedialTips = [
    'দুর্বল বা ধীরগতির শিক্ষার্থীদের সামনের সারিতে বসিয়ে অতিরিক্ত ৫ মিনিট একক সহায়তা দিন।',
    'দলীয় কাজে অগ্রসরমান শিক্ষার্থীদের সাথে পিছিয়ে পড়া শিক্ষার্থীদের জোড়া (Peer Learning) করে দিন।',
    'কোনো শিক্ষার্থী মূল ধারণা বুঝতে না পারলে বাস্তব উপকরণ ও ছবির সাহায্যে পুনরায় অনুশীলন করান।',
  ];

  return {
    title:
      nctbEntry?.teacherGuideTitle ||
      `শিক্ষক সহায়িকা (TG): ${input.subject} (${input.classLevel})`,
    editionNote:
      nctbEntry?.editionNote ||
      `NCTB ও নেপ ২০২৬ কাঠামো অনুযায়ী ${input.classLevel} শ্রেণির পাঠদান নির্দেশিকা`,
    partLabel: matchedPart?.partLabel || 'বার্ষিক পাঠ',
    termWindow: matchedPart?.termWindow || input.term || '২০২৬ শিক্ষাবর্ষ',
    bookSummary:
      matchedPart?.bookSummary ||
      `${input.chapterTitle || input.subject} অধ্যায়ে "${input.topicDetail}" বিষয়ের নির্ধারিত শিখনফল ও শ্রেণি কার্যক্রম।`,
    learningOutcomes,
    teachingMaterials,
    methodSteps,
    nctbGuideSteps: matchedPart?.teacherGuideSteps || [
      `পাঠ্যবইয়ের ${pageNote} অনুযায়ী ধাপে ধাপে আদর্শ উপস্থাপন ও দলীয় অনুশীলন পরিচালনা করুন।`,
      'শিক্ষার্থীদের সক্রিয় অংশগ্রহণ নিশ্চিত করে তাৎক্ষণিক সংশোধনী ফিডব্যাক দিন।',
    ],
    assessmentFocus:
      matchedPart?.assessmentFocus ||
      `পাঠ শেষে ${pageNote}-এর ওপর মৌখিক প্রশ্ন ও সংক্ষিপ্ত লিখিত কাজের মাধ্যমে শিখনফল যাচাই।`,
    remedialTips,
    homeworkSuggestion: isEnglish
      ? `Practice "${input.topicDetail}" from ${pageNote} cleanly at home and write 3–5 words/sentences in your notebook.`
      : `বাড়ি থেকে "${input.topicDetail}" (${pageNote}) ভালোভাবে পড়ে আসবে এবং সংশ্লিষ্ট অনুশীলন খাতায় লিখে আনবে।`,
    nctbPortalUrl:
      nctbEntry?.nctbPortalUrl ||
      'https://nctb.portal.gov.bd/site/page/4134572c-d370-4895-b9c6-771f662b4b5f',
  };
}

export function guideInputFromDateRow(
  row: DateWisePlanRow,
  classLevel: string,
  subject: string,
  durationMinutes = 40
): LessonTeacherGuideInput {
  return {
    classLevel,
    subject,
    term: row.term,
    dateBn: row.dateBn,
    weekdayBn: row.weekdayBn,
    sessionLabel: row.sessionLabel,
    chapterTitle: row.chapterTitle || subject,
    topicDetail: row.topicDetail,
    pageNumber: row.pageNumber,
    durationMinutes,
    isoDate: row.isoDate,
  };
}
