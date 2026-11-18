import { QuestionItem } from '../types';

export interface BlueprintSection {
  id: string;
  title: string;
  questionType: QuestionItem['type'];
  subCategories?: string[];
  questionCount: number;
  marksPerQuestion: number;
  totalMarks: number;
  competencyNote: string;
}

export interface SubjectBlueprint {
  classGroup: string;
  subject: string;
  fullMarks: number;
  duration: string;
  passingMarks: number;
  evaluationStyle: string;
  sections: BlueprintSection[];
}

export function getBlueprintFor(classLevel: string, subject: string): SubjectBlueprint {
  // প্রাক-প্রাথমিক
  if (classLevel === 'প্রাক-প্রাথমিক') {
    if (subject.includes('লিখতে')) {
      return {
        classGroup: 'প্রাক-প্রাথমিক',
        subject,
        fullMarks: 50,
        duration: '৪৫ মিনিট (মৌখিক ও ব্যবহারিক)',
        passingMarks: 20,
        evaluationStyle: 'ধারাবাহিক পর্যবেক্ষণ ও সূক্ষ্ম পেশি/প্রাক-লেখন যাচাই',
        sections: [
          {
            id: 'pp-w-1',
            title: '১। সোজা, বাঁকা, ঢেউ ও বৃত্তাকার আঁচড় ও বিন্দু মিলানো',
            questionType: 'রচনামূলক প্রশ্ন',
            subCategories: ['প্রাক-লেখন ও আঁচড়'],
            questionCount: 2,
            marksPerQuestion: 10,
            totalMarks: 20,
            competencyNote: 'পেন্সিল ধরা ও স্বাধীনভাবে আঁচড় কাটার দক্ষতা',
          },
          {
            id: 'pp-w-2',
            title: '২। স্বরবর্ণ ও ব্যঞ্জনবর্ণ (বিন্দু মিলিয়ে ও দেখে লেখা)',
            questionType: 'সংক্ষিপ্ত প্রশ্ন',
            subCategories: ['বর্ণ লিখন', 'মৌখিক যাচাই'],
            questionCount: 4,
            marksPerQuestion: 5,
            totalMarks: 20,
            competencyNote: 'প্রবাহচিহ্ন অনুযায়ী সঠিকভাবে বর্ণ ও মাত্রা লেখা',
          },
          {
            id: 'pp-w-3',
            title: '৩। সংখ্যা লেখা (১–২০) ও ছবি রং করা',
            questionType: 'শূন্যস্থান পূরণ',
            subCategories: ['সংখ্যা ও গণনা'],
            questionCount: 2,
            marksPerQuestion: 5,
            totalMarks: 10,
            competencyNote: 'সংখ্যার ক্রম পূরণ ও দাগ ধরে রং করা',
          },
        ],
      };
    }
    if (subject.includes('ছড়া')) {
      return {
        classGroup: 'প্রাক-প্রাথমিক',
        subject,
        fullMarks: 50,
        duration: '৪০ মিনিট (মৌখিক ও দলীয় খেলা)',
        passingMarks: 20,
        evaluationStyle: 'আনন্দদায়ক পরিবেশে ছড়া, গল্প, কল্পনা ও সামাজিক দক্ষতা পর্যবেক্ষণ',
        sections: [
          {
            id: 'pp-r-1',
            title: '১। অভিনয় ও তালের সাথে ছড়া-গান আবৃত্তি',
            questionType: 'সংক্ষিপ্ত প্রশ্ন',
            subCategories: ['ছড়া ও গান'],
            questionCount: 3,
            marksPerQuestion: 5,
            totalMarks: 15,
            competencyNote: 'স্পষ্ট উচ্চারণ, ছন্দ ও অঙ্গভঙ্গি',
          },
          {
            id: 'pp-r-2',
            title: '২। গল্প শুনে প্রশ্নের মৌখিক উত্তর ও নৈতিকতা বলা',
            questionType: 'রচনামূলক প্রশ্ন',
            subCategories: ['গল্প ও নৈতিক শিক্ষা'],
            questionCount: 2,
            marksPerQuestion: 10,
            totalMarks: 20,
            competencyNote: 'মনোযোগ সহকারে শ্রবণ ও নিজ ভাষায় প্রকাশ',
          },
          {
            id: 'pp-r-3',
            title: '৩। ছবি/কার্ড মিলানো ও সঠিক উত্তর বাছাই (মৌখিক)',
            questionType: 'সঠিক উত্তর',
            subCategories: ['মৌখিক যাচাই', 'খেলা ও সামাজিকতা'],
            questionCount: 3,
            marksPerQuestion: 5,
            totalMarks: 15,
            competencyNote: 'খেলায় অংশগ্রহণ, নিয়ম মানা ও পরিবেশ চেনা',
          },
        ],
      };
    }
    return {
      classGroup: 'প্রাক-প্রাথমিক',
      subject: 'আমার বই',
      fullMarks: 50,
      duration: '৪৫ মিনিট (মৌখিক ও ছবি ভিত্তিক)',
      passingMarks: 20,
      evaluationStyle: '১০০% ধারাবাহিক ও মৌখিক-কর্মভিত্তিক পর্যবেক্ষণ (শিশুবান্ধব)',
      sections: [
        {
          id: 'pp-ab-1',
          title: '১। নিজের পরিচয়, পরিবার, পরিচ্ছন্নতা ও ছবি দেখে কথা বলা',
          questionType: 'সংক্ষিপ্ত প্রশ্ন',
          subCategories: ['মৌখিক যাচাই', 'স্বাস্থ্য ও নিরাপত্তা'],
          questionCount: 4,
          marksPerQuestion: 5,
          totalMarks: 20,
          competencyNote: 'স্পষ্টভাবে পরিচয় বলা ও ছবি পর্যবেক্ষণ',
        },
        {
          id: 'pp-ab-2',
          title: '২। সঠিক ছবি, রং, আকৃতি ও বর্ণ/শব্দ শনাক্তকরণ',
          questionType: 'সঠিক উত্তর',
          subCategories: ['বর্ণ ও ধ্বনি', 'রং ও আকৃতি'],
          questionCount: 4,
          marksPerQuestion: 5,
          totalMarks: 20,
          competencyNote: 'অ-আ, ক-খ ধ্বনি ও লাল-সবুজ-নীল-হলুদ রং চেনা',
        },
        {
          id: 'pp-ab-3',
          title: '৩। ১–২০ গণনা ও পরবর্তী সংখ্যা/বর্ণ পূরণ',
          questionType: 'শূন্যস্থান পূরণ',
          subCategories: ['সংখ্যা ও গণনা', 'বর্ণ ও ধ্বনি'],
          questionCount: 2,
          marksPerQuestion: 5,
          totalMarks: 10,
          competencyNote: 'বাস্তব বস্তু গুনে সংখ্যা বলা ও শূন্যস্থান পূরণ',
        },
      ],
    };
  }

  // ১ম ও ২য় শ্রেণি
  const isLowerPrimary = classLevel === 'প্রথম শ্রেণি' || classLevel === 'দ্বিতীয় শ্রেণি';

  if (subject === 'আমার বাংলা বই') {
    if (isLowerPrimary) {
      return {
        classGroup: classLevel,
        subject,
        fullMarks: 100,
        duration: '২ ঘণ্টা',
        passingMarks: 40,
        evaluationStyle: 'পাঠ্যবইয়ের বর্ণ, শব্দ, কবিতা, অনুচ্ছেদ ও মৌলিক লিখিত দক্ষতা',
        sections: [
          {
            id: 'lp-bn-1',
            title: '১। সঠিক উত্তরটি খাতায় লেখ (পাঠ ও ছড়া ভিত্তিক)',
            questionType: 'সঠিক উত্তর',
            subCategories: ['বহুনির্বাচনি'],
            questionCount: 5,
            marksPerQuestion: 2,
            totalMarks: 10,
            competencyNote: 'পাঠ্যবইয়ের গল্প ও কবিতা থেকে জ্ঞানমূলক যাচাই',
          },
          {
            id: 'lp-bn-2',
            title: '২। শূন্যস্থান পূরণ করো (কার-চিহ্ন, ফলা ও পাঠের বাক্য)',
            questionType: 'শূন্যস্থান পূরণ',
            subCategories: ['শূন্যস্থান', 'কার-চিহ্ন ও ফলা'],
            questionCount: 5,
            marksPerQuestion: 3,
            totalMarks: 15,
            competencyNote: 'সঠিক বর্ণ, কার-চিহ্ন ও শব্দ বসিয়ে বাক্য সম্পূর্ণ করা',
          },
          {
            id: 'lp-bn-3',
            title: '৩। শব্দার্থ, বিপরীত শব্দ, যুক্তবর্ণ ও এক কথায় সংক্ষিপ্ত উত্তর',
            questionType: 'সংক্ষিপ্ত প্রশ্ন',
            subCategories: ['শব্দার্থ ও বিপরীত', 'যুক্তবর্ণ', 'সংক্ষিপ্ত উত্তর'],
            questionCount: 7,
            marksPerQuestion: 5,
            totalMarks: 35,
            competencyNote: 'পাঠের শব্দের অর্থ, যুক্তবর্ণ ও ১-২ বাক্যে উত্তর লেখা',
          },
          {
            id: 'lp-bn-4',
            title: '৪। কবিতা লেখা, বাক্য গঠন ও ৫ বাক্যে অনুচ্ছেদ লিখন',
            questionType: 'রচনামূলক প্রশ্ন',
            subCategories: ['কবিতা ও মূলভাব', 'অনুচ্ছেদ ও রচনা'],
            questionCount: 4,
            marksPerQuestion: 10,
            totalMarks: 40,
            competencyNote: 'শুদ্ধ বানানে কবিতার চরণ ও ছোট অনুচ্ছেদ রচনা',
          },
        ],
      };
    }

    // ৩য়–৫ম শ্রেণি আমার বাংলা বই (NCTB ১০০ নম্বর)
    return {
      classGroup: classLevel,
      subject,
      fullMarks: 100,
      duration: '২ ঘণ্টা ৩০ মিনিট',
      passingMarks: 40,
      evaluationStyle: 'NCTB ও NAPE অনুমোদিত যোগ্যতাভিত্তিক ও পাঠ্যবই-বহির্ভূত অনুচ্ছেদ কাঠামো',
      sections: [
        {
          id: 'up-bn-1',
          title: '১। পাঠ্যবইয়ের অনুচ্ছেদ ভিত্তিক বহুনির্বাচনি (সঠিক উত্তর)',
          questionType: 'সঠিক উত্তর',
          subCategories: ['বহুনির্বাচনি', 'পাঠভিত্তিক অনুচ্ছেদ'],
          questionCount: 5,
          marksPerQuestion: 2,
          totalMarks: 10,
          competencyNote: 'পাঠ্যবইয়ের গদ্যাংশ/অনুচ্ছেদ বুঝে সঠিক উত্তর নির্বাচন',
        },
        {
          id: 'up-bn-2',
          title: '২। পাঠ্যবই ও বহির্ভূত অনুচ্ছেদ হতে শূন্যস্থান পূরণ ও ব্যাকরণ',
          questionType: 'শূন্যস্থান পূরণ',
          subCategories: ['শূন্যস্থান', 'বিরামচিহ্ন ও ব্যাকরণ'],
          questionCount: 5,
          marksPerQuestion: 3,
          totalMarks: 15,
          competencyNote: 'প্রদত্ত শব্দ/জ্ঞান ব্যবহার করে শূন্যস্থান পূরণ',
        },
        {
          id: 'up-bn-3',
          title: '৩। সংক্ষিপ্ত প্রশ্ন, যুক্তবর্ণ, বিপরীত শব্দ, এক কথায় প্রকাশ ও ক্রিয়ার কাল',
          questionType: 'সংক্ষিপ্ত প্রশ্ন',
          subCategories: [
            'যুক্তবর্ণ বিভাজন',
            'এক কথায় প্রকাশ ও বিপরীত',
            'ক্রিয়ার কাল ও পদ',
            'বিরামচিহ্ন',
            'সংক্ষিপ্ত উত্তর',
          ],
          questionCount: 7,
          marksPerQuestion: 5,
          totalMarks: 35,
          competencyNote: 'যুক্তবর্ণ ভেঙে শব্দ-বাক্য, ব্যাকরণ ও অনুচ্ছেদভিত্তিক উত্তর',
        },
        {
          id: 'up-bn-4',
          title: '৪। কবিতার মূলভাব, ফরম পূরণ, চিঠি/আবেদন ও সংকেতভিত্তিক রচনা',
          questionType: 'রচনামূলক প্রশ্ন',
          subCategories: ['কবিতা ও মূলভাব', 'ফরম ও চিঠি', 'রচনা ও যোগ্যতাভিত্তিক'],
          questionCount: 4,
          marksPerQuestion: 10,
          totalMarks: 40,
          competencyNote: 'সৃজনশীল ও যোগ্যতাভিত্তিক রচনা, চিঠি ও মূলভাব বিশ্লেষণ',
        },
      ],
    };
  }

  if (subject === 'English for Today') {
    if (isLowerPrimary) {
      return {
        classGroup: classLevel,
        subject,
        fullMarks: 100,
        duration: '২ ঘণ্টা',
        passingMarks: 40,
        evaluationStyle: 'Basic Phonics, Vocabulary, Rhyme, Matching & Simple Sentences',
        sections: [
          {
            id: 'lp-en-1',
            title: '1. Multiple Choice Questions (Words, Meanings & Pictures)',
            questionType: 'সঠিক উত্তর',
            subCategories: ['MCQ & Matching'],
            questionCount: 5,
            marksPerQuestion: 2,
            totalMarks: 10,
            competencyNote: 'Alphabet recognition, numbers & everyday vocabulary',
          },
          {
            id: 'lp-en-2',
            title: '2. Fill in the Blanks (Missing Letters, Words & Days)',
            questionType: 'শূন্যস্থান পূরণ',
            subCategories: ['Missing Letters & Blanks'],
            questionCount: 5,
            marksPerQuestion: 3,
            totalMarks: 15,
            competencyNote: 'Spelling & sequence completion',
          },
          {
            id: 'lp-en-3',
            title: '3. Short Answer, Word Meaning, Translation & Rearrange',
            questionType: 'সংক্ষিপ্ত প্রশ্ন',
            subCategories: ['Word Meaning & Translation', 'Short Q&A', 'Rearrange'],
            questionCount: 7,
            marksPerQuestion: 5,
            totalMarks: 35,
            competencyNote: 'Answering simple greetings, commands & short questions',
          },
          {
            id: 'lp-en-4',
            title: '4. Rhyme Writing, Alphabet Sequence & Guided Paragraph (5 Sentences)',
            questionType: 'রচনামূলক প্রশ্ন',
            subCategories: ['Rhyme & Guided Writing', 'Composition'],
            questionCount: 4,
            marksPerQuestion: 10,
            totalMarks: 40,
            competencyNote: 'Writing cursive/print letters & 5-sentence guided paragraphs',
          },
        ],
      };
    }

    // Class 3-5 English for Today
    return {
      classGroup: classLevel,
      subject,
      fullMarks: 100,
      duration: '২ ঘণ্টা ৩০ মিনিট',
      passingMarks: 40,
      evaluationStyle: 'NCTB Seen/Unseen Comprehension, WH-Questions, Rearrange, Punctuation & Composition',
      sections: [
        {
          id: 'up-en-1',
          title: '1. Seen & Unseen MCQ / True-False Verification',
          questionType: 'সঠিক উত্তর',
          subCategories: ['Seen MCQ', 'True/False'],
          questionCount: 5,
          marksPerQuestion: 2,
          totalMarks: 10,
          competencyNote: 'Understanding key facts from Seen & Unseen passages',
        },
        {
          id: 'up-en-2',
          title: '2. Fill in the Gaps with Clues (Unseen & Grammar)',
          questionType: 'শূন্যস্থান পূরণ',
          subCategories: ['Gap Filling', 'Preposition & Tense'],
          questionCount: 5,
          marksPerQuestion: 3,
          totalMarks: 15,
          competencyNote: 'Contextual vocabulary & grammar application',
        },
        {
          id: 'up-en-3',
          title: '3. Short Q&A, WH-Questions, Rearrange & Punctuation',
          questionType: 'সংক্ষিপ্ত প্রশ্ন',
          subCategories: ['Short Q&A', 'WH-Question', 'Rearrange', 'Punctuation'],
          questionCount: 7,
          marksPerQuestion: 5,
          totalMarks: 35,
          competencyNote: 'Framing WH-questions, rearranging words & punctuation marks',
        },
        {
          id: 'up-en-4',
          title: '4. Short Composition, Letter Writing & Form Completion',
          questionType: 'রচনামূলক প্রশ্ন',
          subCategories: ['Composition', 'Letter & Form', 'Dialogue'],
          questionCount: 4,
          marksPerQuestion: 10,
          totalMarks: 40,
          competencyNote: 'Writing 5-sentence compositions, friendly letters & forms',
        },
      ],
    };
  }

  if (subject === 'প্রাথমিক গণিত') {
    if (isLowerPrimary) {
      return {
        classGroup: classLevel,
        subject,
        fullMarks: 100,
        duration: '২ ঘণ্টা',
        passingMarks: 40,
        evaluationStyle: 'সংখ্যা, স্থানীয় মান, যোগ-বিয়োগ-গুণ-ভাগ, কথার অঙ্ক ও প্রাথমিক জ্যামিতি',
        sections: [
          {
            id: 'lp-mt-1',
            title: '১। সঠিক উত্তর নির্ণয় (সংখ্যা, জোড়-বিজোড় ও প্রতীক)',
            questionType: 'সঠিক উত্তর',
            subCategories: ['বহুনির্বাচনি'],
            questionCount: 5,
            marksPerQuestion: 2,
            totalMarks: 10,
            competencyNote: 'মৌলিক গাণিতিক ধারণা যাচাই',
          },
          {
            id: 'lp-mt-2',
            title: '২। খালি ঘর / শূন্যস্থান পূরণ (সংখ্যা ও নামতা)',
            questionType: 'শূন্যস্থান পূরণ',
            subCategories: ['শূন্যস্থান ও খালি ঘর'],
            questionCount: 5,
            marksPerQuestion: 3,
            totalMarks: 15,
            competencyNote: 'সংখ্যার ক্রম, স্থানীয় মান ও হিসাবের খালি ঘর পূরণ',
          },
          {
            id: 'lp-mt-3',
            title: '৩। সংক্ষিপ্ত গাণিতিক প্রশ্ন ও হিসাব',
            questionType: 'সংক্ষিপ্ত প্রশ্ন',
            subCategories: ['সংক্ষিপ্ত হিসাব', 'পরিমাপ ও সময়'],
            questionCount: 7,
            marksPerQuestion: 5,
            totalMarks: 35,
            competencyNote: 'দ্রুত যোগ, বিয়োগ, গুণ, ভাগ, মুদ্রা ও সময় হিসাব',
          },
          {
            id: 'lp-mt-4',
            title: '৪। কথার অঙ্ক (যোগ্যতাভিত্তিক) ও জ্যামিতিক আকৃতি',
            questionType: 'রচনামূলক প্রশ্ন',
            subCategories: ['কথার অঙ্ক', 'জ্যামিতি'],
            questionCount: 4,
            marksPerQuestion: 10,
            totalMarks: 40,
            competencyNote: 'বাস্তব জীবনের কথার সমস্যা সমাধান ও চিত্রসহ আকৃতি চেনা',
          },
        ],
      };
    }

    // Class 3-5 গণিত
    return {
      classGroup: classLevel,
      subject,
      fullMarks: 100,
      duration: '২ ঘণ্টা ৩০ মিনিট',
      passingMarks: 40,
      evaluationStyle: 'NCTB সংক্ষিপ্ত প্রশ্ন, যোগ্যতাভিত্তিক কাঠামোবদ্ধ সমস্যা ও জ্যামিতি',
      sections: [
        {
          id: 'up-mt-1',
          title: '১। সঠিক উত্তর বাছাই (গাণিতিক প্রতীক ও মৌলিক ধারণা)',
          questionType: 'সঠিক উত্তর',
          subCategories: ['বহুনির্বাচনি'],
          questionCount: 5,
          marksPerQuestion: 2,
          totalMarks: 10,
          competencyNote: 'অধ্যায়ভিত্তিক সূত্র, একক ও প্রতীকের সঠিক প্রয়োগ',
        },
        {
          id: 'up-mt-2',
          title: '২। শূন্যস্থান পূরণ (একক রূপান্তর, গড়, শতকরা ও সূত্র)',
          questionType: 'শূন্যস্থান পূরণ',
          subCategories: ['শূন্যস্থান ও সূত্র'],
          questionCount: 5,
          marksPerQuestion: 3,
          totalMarks: 15,
          competencyNote: 'সঠিক গাণিতিক মান ও সম্পর্ক নির্ণয়',
        },
        {
          id: 'up-mt-3',
          title: '৩। সংক্ষিপ্ত উত্তর প্রশ্ন (সরাসরি হিসাব ও নিয়ম)',
          questionType: 'সংক্ষিপ্ত প্রশ্ন',
          subCategories: ['সংক্ষিপ্ত হিসাব', 'জ্যামিতি ও পরিমাপ'],
          questionCount: 7,
          marksPerQuestion: 5,
          totalMarks: 35,
          competencyNote: 'সংক্ষিপ্ত প্রশ্নকাঠামোর আদলে ১ লাইনে নির্ভুল উত্তর',
        },
        {
          id: 'up-mt-4',
          title: '৪। যোগ্যতাভিত্তিক কাঠামোবদ্ধ সমস্যা ও চিত্রসহ জ্যামিতি',
          questionType: 'রচনামূলক প্রশ্ন',
          subCategories: ['যোগ্যতাভিত্তিক কাঠামোবদ্ধ', 'জ্যামিতি অঙ্কন ও বৈশিষ্ট্য'],
          questionCount: 4,
          marksPerQuestion: 10,
          totalMarks: 40,
          competencyNote: 'ধাপে ধাপে (ক, খ, গ) সমস্যার সমাধান ও জ্যামিতিক চিত্র-বৈশিষ্ট্য',
        },
      ],
    };
  }

  // ৩য়–৫ম শ্রেণি: প্রাথমিক বিজ্ঞান, বাংলাদেশ ও বিশ্বপরিচয়, ধর্ম ও নৈতিক শিক্ষা
  return {
    classGroup: classLevel,
    subject,
    fullMarks: 100,
    duration: '২ ঘণ্টা ৩০ মিনিট',
    passingMarks: 40,
    evaluationStyle: 'NCTB যোগ্যতাভিত্তিক কাঠামো: সঠিক উত্তর, শূন্যস্থান, সংক্ষিপ্ত ও বর্ণনামূলক প্রশ্ন',
    sections: [
      {
        id: 'up-gen-1',
        title: '১। সঠিক উত্তরটি খাতায় লেখ (বহুনির্বাচনি)',
        questionType: 'সঠিক উত্তর',
        subCategories: ['বহুনির্বাচনি'],
        questionCount: 5,
        marksPerQuestion: 2,
        totalMarks: 10,
        competencyNote: 'পাঠ্যবইয়ের মূল তথ্য ও ধারণা যাচাই',
      },
      {
        id: 'up-gen-2',
        title: '২। উপযুক্ত শব্দ দিয়ে শূন্যস্থান পূরণ করো',
        questionType: 'শূন্যস্থান পূরণ',
        subCategories: ['শূন্যস্থান'],
        questionCount: 5,
        marksPerQuestion: 3,
        totalMarks: 15,
        competencyNote: 'পাঠের গুরুত্বপূর্ণ পরিভাষা ও তথ্য স্মরণ',
      },
      {
        id: 'up-gen-3',
        title: '৩। সংক্ষেপে উত্তর দাও (বাম-ডান মিলকরণ ও জ্ঞানমূলক)',
        questionType: 'সংক্ষিপ্ত প্রশ্ন',
        subCategories: ['সংক্ষিপ্ত উত্তর', 'কারণ ও পার্থক্য'],
        questionCount: 7,
        marksPerQuestion: 5,
        totalMarks: 35,
        competencyNote: '২–৩ বাক্যে স্পষ্ট ও যথাযথ সংক্ষিপ্ত উত্তর',
      },
      {
        id: 'up-gen-4',
        title: '৪। কাঠামোবদ্ধ / বর্ণনামূলক প্রশ্ন (যোগ্যতাভিত্তিক)',
        questionType: 'রচনামূলক প্রশ্ন',
        subCategories: ['যোগ্যতাভিত্তিক কাঠামোবদ্ধ', 'বর্ণনামূলক ও প্রয়োগমূলক'],
        questionCount: 4,
        marksPerQuestion: 10,
        totalMarks: 40,
        competencyNote: 'দৈনন্দিন জীবনে জ্ঞানের প্রয়োগ, কারণ বিশ্লেষণ ও ৫–৬ বাক্যে বর্ণনা',
      },
    ],
  };
}
