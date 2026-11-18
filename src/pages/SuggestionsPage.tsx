import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Plus,
  Trash2,
  Printer,
  FilePlus2,
  Sparkles,
  BookOpen,
  Layers,
  FileText,
  Search,
  Check,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  RotateCcw,
} from 'lucide-react';
import { PageShell } from '../components/PageShell';
import { OfficialA4Letterhead } from '../components/OfficialEmblems';
import { CLASS_LEVELS, INITIAL_QUESTIONS, SUBJECTS_BY_CLASS } from '../data/curriculum';
import { getBlueprintFor } from '../data/questionStructures';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { QuestionItem, RouteKey, TeacherProfile } from '../types';
import { getFormattedBanglaDate, toBanglaDigit } from '../utils/bangla';
import { exportElementToA4Pdf } from '../utils/pdfExport';
import { triggerSmartPrint } from '../utils/printHelper';

interface SuggestionsPageProps {
  profile: TeacherProfile;
  onNavigate: (route: RouteKey) => void;
}

interface PaperQuestion {
  id: string;
  sourceId?: string;
  type: QuestionItem['type'];
  subCategory?: string;
  chapter?: string;
  text: string;
  options?: string[];
  answer?: string;
  marks: number;
}

type StudioTab = 'bank' | 'blueprint' | 'paper';

const SECTION_ORDER: {
  type: QuestionItem['type'];
  heading: string;
  engHeading: string;
}[] = [
  {
    type: 'সঠিক উত্তর',
    heading: '১। সঠিক উত্তরটি খাতায় লেখ (বহুনির্বাচনি)',
    engHeading: '1. Choose the correct answer (MCQ):',
  },
  {
    type: 'শূন্যস্থান পূরণ',
    heading: '২। উপযুক্ত শব্দ দিয়ে শূন্যস্থান পূরণ করো',
    engHeading: '2. Fill in the blanks with appropriate words:',
  },
  {
    type: 'সংক্ষিপ্ত প্রশ্ন',
    heading: '৩। সংক্ষিপ্ত উত্তর প্রশ্ন ও ব্যাকরণ / অনুশীলন',
    engHeading: '3. Answer the short questions / WH / Grammar:',
  },
  {
    type: 'রচনামূলক প্রশ্ন',
    heading: '৪। যোগ্যতাভিত্তিক, কাঠামোবদ্ধ ও রচনামূলক প্রশ্ন',
    engHeading: '4. Competency-based, Letter / Form & Composition:',
  },
];

export default function SuggestionsPage({ profile, onNavigate }: SuggestionsPageProps) {
  const [bankQuestions, setBankQuestions] = useLocalStorage<QuestionItem[]>(
    'custom_questions_v1',
    INITIAL_QUESTIONS
  );

  // Sync rich bank into existing localStorage once
  useEffect(() => {
    try {
      const seeded = window.localStorage.getItem('rich_qb_seeded_v4');
      if (seeded) return;
      setBankQuestions((prev) => {
        const existingMap = new Map(prev.map((q) => [q.id, q]));
        const legacyCustom = prev.filter(
          (q) => !INITIAL_QUESTIONS.some((init) => init.id === q.id) && !q.id.startsWith('q-')
        );
        const merged = INITIAL_QUESTIONS.map((init) => existingMap.get(init.id) || init);
        return [...legacyCustom, ...merged];
      });
      window.localStorage.setItem('rich_qb_seeded_v4', '1');
    } catch {
      // Ignore storage error
    }
  }, [setBankQuestions]);

  const [activeTab, setActiveTab] = useState<StudioTab>('bank');

  // Curriculum selectors
  const [classLevel, setClassLevel] = useState('পঞ্চম শ্রেণি');
  const [subject, setSubject] = useState('আমার বাংলা বই');
  const [termFilter, setTermFilter] = useState<string>('সব প্রান্তিক');
  const [chapterFilter, setChapterFilter] = useState<string>('সকল অধ্যায়');
  const [typeFilter, setTypeFilter] = useState<string>('সব ধরন');
  const [subCatFilter, setSubCatFilter] = useState<string>('সব উপ-ধরন');
  const [search, setSearch] = useState('');
  const [showBankAnswers, setShowBankAnswers] = useState(true);

  // Paper Header & Configuration
  const [schoolName, setSchoolName] = useState(
    profile.school || '৮২ নং কোলা সরকারি প্রাথমিক বিদ্যালয়'
  );
  const [schoolAddress, setSchoolAddress] = useState(
    `${profile.villagePost || 'কোলা, মাড়িয়ালা'}, ${profile.upazila || 'আশাশুনি'}, ${profile.district || 'সাতক্ষীরা'}`
  );
  const [examName, setExamName] = useState('বার্ষিক মূল্যায়ন পরীক্ষা - ২০২৬');
  const [examDate, setExamDate] = useState(getFormattedBanglaDate());
  const [duration, setDuration] = useState('২ ঘণ্টা ৩০ মিনিট');
  const [includeAnswerSheet, setIncludeAnswerSheet] = useState(false);

  const [paperQuestions, setPaperQuestions] = useState<PaperQuestion[]>([]);
  const [statusNotice, setStatusNotice] = useState('');
  const [exportingPdf, setExportingPdf] = useState(false);
  const paperRef = useRef<HTMLDivElement>(null);

  // Custom question composer
  const [customType, setCustomType] = useState<QuestionItem['type']>('সংক্ষিপ্ত প্রশ্ন');
  const [customMarks, setCustomMarks] = useState(5);
  const [customText, setCustomText] = useState('');
  const [customAnswer, setCustomAnswer] = useState('');
  const [saveToBankAlso, setSaveToBankAlso] = useState(true);

  // Subject list for selected class
  const subjectsForClass = useMemo(
    () => SUBJECTS_BY_CLASS[classLevel] || [],
    [classLevel]
  );

  // Blueprint for selected class & subject
  const blueprint = useMemo(
    () => getBlueprintFor(classLevel, subject),
    [classLevel, subject]
  );

  const buildStarterPaper = (cls: string, sub: string) => {
    const bp = getBlueprintFor(cls, sub);
    const pool = bankQuestions.filter((q) => q.classLevel === cls && q.subject === sub);
    const used = new Set<string>();
    const starter: PaperQuestion[] = [];
    bp.sections.forEach((sec) => {
      const matches = pool.filter((q) => q.type === sec.questionType && !used.has(q.id));
      let count = 0;
      for (const item of matches) {
        if (count >= sec.questionCount) break;
        used.add(item.id);
        starter.push({
          id: `auto-${item.id}-${count}`,
          sourceId: item.id,
          type: sec.questionType,
          subCategory: item.subCategory,
          chapter: item.chapter,
          text: item.question,
          options: item.options,
          answer: item.answer,
          marks: sec.marksPerQuestion,
        });
        count += 1;
      }
    });
    return starter;
  };

  // When class changes, align subject, duration & update paper questions cleanly
  const handleClassChange = (nextClass: string) => {
    setClassLevel(nextClass);
    const subs = SUBJECTS_BY_CLASS[nextClass] || [];
    const nextSub = subs.includes(subject) ? subject : subs[0] || '';
    setSubject(nextSub);
    setChapterFilter('সকল অধ্যায়');
    setSubCatFilter('সব উপ-ধরন');
    const bp = getBlueprintFor(nextClass, nextSub);
    setDuration(bp.duration);
    setPaperQuestions(buildStarterPaper(nextClass, nextSub));
  };

  const handleSubjectChange = (nextSub: string) => {
    setSubject(nextSub);
    setChapterFilter('সকল অধ্যায়');
    setSubCatFilter('সব উপ-ধরন');
    const bp = getBlueprintFor(classLevel, nextSub);
    setDuration(bp.duration);
    setPaperQuestions(buildStarterPaper(classLevel, nextSub));
  };

  // All questions matching selected Class + Subject (+ Term)
  const subjectPool = useMemo(() => {
    return bankQuestions.filter((q) => {
      const mClass = q.classLevel === classLevel;
      const mSub = q.subject === subject;
      const mTerm = termFilter === 'সব প্রান্তিক' || q.term === termFilter;
      return mClass && mSub && mTerm;
    });
  }, [bankQuestions, classLevel, subject, termFilter]);

  // Chapters and subcategories available inside this Class + Subject
  const availableChapters = useMemo(() => {
    const set = new Set<string>();
    subjectPool.forEach((q) => {
      if (q.chapter) set.add(q.chapter);
    });
    return Array.from(set);
  }, [subjectPool]);

  const availableSubCats = useMemo(() => {
    const set = new Set<string>();
    subjectPool.forEach((q) => {
      if (q.subCategory) set.add(q.subCategory);
    });
    return Array.from(set);
  }, [subjectPool]);

  // Filtered bank list for browsing
  const filteredBank = useMemo(() => {
    const qLower = search.trim().toLowerCase();
    return subjectPool.filter((q) => {
      const mChap = chapterFilter === 'সকল অধ্যায়' || q.chapter === chapterFilter;
      const mType = typeFilter === 'সব ধরন' || q.type === typeFilter;
      const mSubCat = subCatFilter === 'সব উপ-ধরন' || q.subCategory === subCatFilter;
      const mSearch =
        !qLower ||
        q.question.toLowerCase().includes(qLower) ||
        q.chapter.toLowerCase().includes(qLower) ||
        q.answer.toLowerCase().includes(qLower);
      return mChap && mType && mSubCat && mSearch;
    });
  }, [subjectPool, chapterFilter, typeFilter, subCatFilter, search]);

  const totalMarks = useMemo(
    () => paperQuestions.reduce((acc, q) => acc + Number(q.marks || 0), 0),
    [paperQuestions]
  );

  // Initialize starter blueprint paper on first open if empty
  useEffect(() => {
    if (paperQuestions.length === 0 && bankQuestions.length > 0) {
      setPaperQuestions(buildStarterPaper(classLevel, subject));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showToast = (msg: string) => {
    setStatusNotice(msg);
    window.setTimeout(() => setStatusNotice(''), 3200);
  };

  // Add single question from bank
  const addFromBank = (q: QuestionItem) => {
    if (paperQuestions.some((pq) => pq.sourceId === q.id)) {
      setPaperQuestions((prev) => prev.filter((pq) => pq.sourceId !== q.id));
      return;
    }
    const defaultMark =
      q.marks || (q.type === 'রচনামূলক প্রশ্ন' ? 10 : q.type === 'সঠিক উত্তর' ? 2 : 5);
    setPaperQuestions((prev) => [
      ...prev,
      {
        id: `pq-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        sourceId: q.id,
        type: q.type,
        subCategory: q.subCategory,
        chapter: q.chapter,
        text: q.question,
        options: q.options,
        answer: q.answer,
        marks: defaultMark,
      },
    ]);
  };

  // 1-Click Official NCTB Blueprint Paper Generator
  const handleAutoBuildBlueprintPaper = () => {
    // Pool across selected term (or fallback to full subject if a term has fewer items)
    const primaryPool = subjectPool;
    const fullSubjectPool = bankQuestions.filter(
      (q) => q.classLevel === classLevel && q.subject === subject
    );

    const usedIds = new Set<string>();
    const generated: PaperQuestion[] = [];

    blueprint.sections.forEach((sec) => {
      // Prioritize exact type & term match, then type from full subject, then any unmatched
      const exactTermMatches = primaryPool.filter(
        (q) => q.type === sec.questionType && !usedIds.has(q.id)
      );
      const fallbackSubjectMatches = fullSubjectPool.filter(
        (q) => q.type === sec.questionType && !usedIds.has(q.id)
      );
      const anyTermMatches = primaryPool.filter((q) => !usedIds.has(q.id));
      const anyFullMatches = fullSubjectPool.filter((q) => !usedIds.has(q.id));

      const candidates = [
        ...exactTermMatches,
        ...fallbackSubjectMatches,
        ...anyTermMatches,
        ...anyFullMatches,
      ];

      let picked = 0;
      for (const item of candidates) {
        if (picked >= sec.questionCount) break;
        if (usedIds.has(item.id)) continue;
        usedIds.add(item.id);
        generated.push({
          id: `auto-${item.id}-${picked}`,
          sourceId: item.id,
          type: sec.questionType,
          subCategory: item.subCategory,
          chapter: item.chapter,
          text: item.question,
          options: item.options,
          answer: item.answer,
          marks: sec.marksPerQuestion,
        });
        picked += 1;
      }
    });

    setPaperQuestions(generated);
    setExamName(
      termFilter === 'সব প্রান্তিক'
        ? 'বার্ষিক মূল্যায়ন ও মডেল প্রশ্নপত্র - ২০২৬'
        : `${termFilter} মূল্যায়ন পরীক্ষা - ২০২৬`
    );
    setDuration(blueprint.duration);
    setIncludeAnswerSheet(false);
    setActiveTab('paper');
    showToast(
      `প্রশ্নকাঠামো অনুযায়ী ${toBanglaDigit(generated.length)}টি প্রশ্নে পূর্ণাঙ্গ প্রশ্নপত্র (পূর্ণমান ${toBanglaDigit(
        generated.reduce((s, q) => s + q.marks, 0)
      )}) তৈরি হয়েছে!`
    );
  };

  // 1-Click 100% Suggestion Sheet Builder (with answers)
  const handleBuildSuggestionSheet = () => {
    const items: PaperQuestion[] = subjectPool.slice(0, 32).map((q, idx) => ({
      id: `sug-${q.id}-${idx}`,
      sourceId: q.id,
      type: q.type,
      subCategory: q.subCategory,
      chapter: q.chapter,
      text: q.question,
      options: q.options,
      answer: q.answer,
      marks: q.marks || (q.type === 'রচনামূলক প্রশ্ন' ? 10 : q.type === 'সঠিক উত্তর' ? 2 : 5),
    }));
    setPaperQuestions(items);
    setExamName(
      `শতভাগ প্রস্তুতি সাজেশন ও উত্তরমালা (${termFilter === 'সব প্রান্তিক' ? 'সম্পূর্ণ বই' : termFilter}) - ২০২৬`
    );
    setIncludeAnswerSheet(true);
    setActiveTab('paper');
    showToast(
      `অধ্যায়ভিত্তিক ${toBanglaDigit(items.length)}টি গুরুত্বপূর্ণ প্রশ্ন ও উত্তরসহ সাজেশন শিট প্রস্তুত!`
    );
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customText.trim()) return;
    const newId = `custom-pq-${Date.now()}`;
    setPaperQuestions((prev) => [
      ...prev,
      {
        id: newId,
        type: customType,
        chapter: chapterFilter !== 'সকল অধ্যায়' ? chapterFilter : 'শিক্ষকের সংযোজিত প্রশ্ন',
        text: customText.trim(),
        answer: customAnswer.trim() || undefined,
        marks: customMarks,
      },
    ]);

    if (saveToBankAlso) {
      setBankQuestions((prev) => [
        {
          id: `custom-q-${Date.now()}`,
          classLevel,
          subject,
          term:
            termFilter === 'সব প্রান্তিক'
              ? '১ম প্রান্তিক'
              : (termFilter as '১ম প্রান্তিক' | '২য় প্রান্তিক' | '৩য় প্রান্তিক'),
          chapter: chapterFilter !== 'সকল অধ্যায়' ? chapterFilter : 'সাধারণ অধ্যায়',
          type: customType,
          subCategory: 'শিক্ষক সংযোজিত',
          marks: customMarks,
          question: customText.trim(),
          answer: customAnswer.trim() || 'পাঠ্যবই অনুসারে উত্তর লিখতে হবে।',
        },
        ...prev,
      ]);
    }
    setCustomText('');
    setCustomAnswer('');
    showToast('নতুন প্রশ্নটি প্রশ্নপত্রে যুক্ত হয়েছে।');
  };

  const moveQuestion = (id: string, dir: -1 | 1) => {
    setPaperQuestions((prev) => {
      const idx = prev.findIndex((q) => q.id === id);
      const nextIdx = idx + dir;
      if (idx === -1 || nextIdx < 0 || nextIdx >= prev.length) return prev;
      const copy = [...prev];
      const [moved] = copy.splice(idx, 1);
      copy.splice(nextIdx, 0, moved);
      return copy;
    });
  };

  const handleExportPdf = async () => {
    if (!paperRef.current || exportingPdf) return;
    setExportingPdf(true);
    try {
      await exportElementToA4Pdf(
        paperRef.current,
        `question-paper-${classLevel}-${subject}`
      );
    } finally {
      setExportingPdf(false);
    }
  };

  const isEnglishSubject = subject === 'English for Today';

  // Group paper questions cleanly by NCTB section order
  const groupedPaperSections = useMemo(() => {
    return SECTION_ORDER.map((sec) => ({
      ...sec,
      items: paperQuestions.filter((q) => q.type === sec.type),
    })).filter((g) => g.items.length > 0);
  }, [paperQuestions]);

  let runningNumber = 0;

  return (
    <PageShell
      title="প্রশ্ন ও সাজেশন ভান্ডার (NCTB প্রশ্নকাঠামো)"
      subtitle="প্রাক-প্রাথমিক থেকে পঞ্চম শ্রেণির সকল বিষয় ও পাঠ পরিকল্পনা ভিত্তিক সমৃদ্ধ প্রশ্ন ভান্ডার এবং ১-ক্লিক A4 প্রশ্নপত্র মেকার"
      onNavigate={onNavigate}
      onPrint={() => {
        setActiveTab('paper');
        setTimeout(
          () =>
            triggerSmartPrint({
              element: paperRef.current,
              filename: `question-paper-${classLevel}-${subject}`,
            }),
          150
        );
      }}
      printLabel="প্রশ্নপত্র প্রিন্ট"
      onExportPdf={() => {
        setActiveTab('paper');
        setTimeout(() => {
          void handleExportPdf();
        }, 180);
      }}
      exportingPdf={exportingPdf}
      pdfLabel="PDF সংরক্ষণ"
    >
      {statusNotice && (
        <div
          role="status"
          className="no-print mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs sm:text-sm font-semibold text-emerald-900 flex items-center gap-2"
        >
          <Sparkles className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{statusNotice}</span>
        </div>
      )}

      {/* Global Class, Subject, Term Bar */}
      <section className="no-print mb-5 rounded-2xl bg-white border border-slate-200 p-4 sm:p-5 space-y-4 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              ১. শ্রেণি নির্বাচন করুন (প্রাক–৫ম)
            </label>
            <select
              value={classLevel}
              onChange={(e) => handleClassChange(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none"
            >
              {CLASS_LEVELS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              ২. বিষয় নির্বাচন করুন
            </label>
            <select
              value={subject}
              onChange={(e) => handleSubjectChange(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none"
            >
              {subjectsForClass.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              ৩. প্রান্তিক / সময়সীমা
            </label>
            <select
              value={termFilter}
              onChange={(e) => {
                setTermFilter(e.target.value);
                setChapterFilter('সকল অধ্যায়');
              }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none"
            >
              <option value="সব প্রান্তিক">সম্পূর্ণ বার্ষিক পাঠ্যক্রম</option>
              <option value="১ম প্রান্তিক">১ম প্রান্তিক</option>
              <option value="২য় প্রান্তিক">২য় প্রান্তিক</option>
              <option value="৩য় প্রান্তিক">৩য় প্রান্তিক</option>
            </select>
          </div>
        </div>

        {/* Summary Metrics & Quick 1-Click Auto Builders */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3.5">
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
            <span className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 font-semibold text-blue-800">
              ভান্ডারে প্রশ্ন: {toBanglaDigit(subjectPool.length)}টি
            </span>
            <span className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 font-medium text-slate-700">
              কভারকৃত অধ্যায়/পাঠ: {toBanglaDigit(availableChapters.length)}টি
            </span>
            <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-800">
              কাঠামো পূর্ণমান: {toBanglaDigit(blueprint.fullMarks)}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleAutoBuildBlueprintPaper}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors shadow-xs"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>প্রশ্নকাঠামো অনুযায়ী পূর্ণাঙ্গ প্রশ্নপত্র তৈরি</span>
            </button>
            <button
              type="button"
              onClick={handleBuildSuggestionSheet}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors shadow-xs"
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>শতভাগ সাজেশন শিট</span>
            </button>
          </div>
        </div>
      </section>

      {/* Workspace Tabs */}
      <div className="no-print mb-5 flex flex-wrap gap-2">
        {[
          {
            id: 'bank' as StudioTab,
            label: `অধ্যায়ভিত্তিক প্রশ্ন ভান্ডার (${toBanglaDigit(filteredBank.length)})`,
            icon: BookOpen,
          },
          {
            id: 'blueprint' as StudioTab,
            label: 'NCTB প্রশ্নকাঠামো ও নম্বর বণ্টন',
            icon: Layers,
          },
          {
            id: 'paper' as StudioTab,
            label: `প্রশ্নপত্র ও প্রিন্ট প্রিভিউ (${toBanglaDigit(paperQuestions.length)}টি · ${toBanglaDigit(totalMarks)} নম্বর)`,
            icon: FileText,
          },
        ].map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold transition-colors ${
                active
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: QUESTION BANK & CHAPTER SUGGESTIONS */}
      {activeTab === 'bank' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-white border border-slate-200 p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            <div className="relative lg:col-span-2">
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="অধ্যায়, প্রশ্ন বা উত্তর খুঁজুন..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
              />
            </div>
            <select
              value={chapterFilter}
              onChange={(e) => setChapterFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800"
            >
              <option value="সকল অধ্যায়">সকল অধ্যায় / পাঠ</option>
              {availableChapters.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800"
            >
              <option value="সব ধরন">সব প্রশ্নের ধরন</option>
              <option value="সঠিক উত্তর">সঠিক উত্তর (MCQ)</option>
              <option value="শূন্যস্থান পূরণ">শূন্যস্থান পূরণ</option>
              <option value="সংক্ষিপ্ত প্রশ্ন">সংক্ষিপ্ত / ব্যাকরণ / মৌখিক</option>
              <option value="রচনামূলক প্রশ্ন">যোগ্যতাভিত্তিক / রচনামূলক</option>
            </select>
            <div className="flex items-center gap-2">
              <select
                value={subCatFilter}
                onChange={(e) => setSubCatFilter(e.target.value)}
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-800"
              >
                <option value="সব উপ-ধরন">সব উপ-ধরন</option>
                {availableSubCats.map((sc) => (
                  <option key={sc} value={sc}>
                    {sc}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowBankAnswers((v) => !v)}
                title={showBankAnswers ? 'উত্তর লুকান' : 'উত্তর দেখান'}
                className="h-9 w-9 shrink-0 flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
              >
                {showBankAnswers ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {filteredBank.length === 0 ? (
            <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center space-y-2">
              <p className="text-sm text-slate-600">
                নির্বাচিত ফিল্টারে কোনো প্রশ্ন পাওয়া যায়নি।
              </p>
              <button
                type="button"
                onClick={() => {
                  setChapterFilter('সকল অধ্যায়');
                  setTypeFilter('সব ধরন');
                  setSubCatFilter('সব উপ-ধরন');
                  setSearch('');
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>ফিল্টার রিসেট করুন</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredBank.map((q, idx) => {
                const alreadyInPaper = paperQuestions.some((pq) => pq.sourceId === q.id);
                return (
                  <article
                    key={q.id}
                    className={`rounded-2xl bg-white border p-4 sm:p-5 flex flex-col justify-between gap-3 transition-colors ${
                      alreadyInPaper ? 'border-blue-500 ring-1 ring-blue-500/20' : 'border-slate-200'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                        <span className="font-semibold text-blue-700 line-clamp-1">
                          {q.chapter}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {q.term && (
                            <span className="rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-emerald-700 font-medium">
                              {q.term}
                            </span>
                          )}
                          <span className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-slate-700 font-medium">
                            {q.subCategory || q.type}
                          </span>
                        </div>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 leading-relaxed">
                        {toBanglaDigit(idx + 1)}. {q.question}
                      </h3>

                      {q.options && (
                        <div className="grid grid-cols-2 gap-1.5 text-xs text-slate-700">
                          {q.options.map((opt, i) => (
                            <div
                              key={i}
                              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1"
                            >
                              {opt}
                            </div>
                          ))}
                        </div>
                      )}

                      {showBankAnswers && (
                        <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/70 px-3 py-2 text-xs text-emerald-950 leading-relaxed">
                          <span className="font-bold">উত্তর: </span>
                          {q.answer}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-2.5">
                      <span className="text-xs font-medium text-slate-500">
                        মান: {toBanglaDigit(q.marks || (q.type === 'রচনামূলক প্রশ্ন' ? 10 : 5))} ·{' '}
                        {q.type}
                      </span>
                      <button
                        type="button"
                        onClick={() => addFromBank(q)}
                        className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                          alreadyInPaper
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                            : 'bg-slate-900 text-white hover:bg-blue-600'
                        }`}
                      >
                        {alreadyInPaper ? (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            <span>যুক্ত হয়েছে</span>
                          </>
                        ) : (
                          <>
                            <Plus className="h-3.5 w-3.5" />
                            <span>প্রশ্নপত্রে যোগ</span>
                          </>
                        )}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: OFFICIAL NCTB BLUEPRINT & MARKS STRUCTURE */}
      {activeTab === 'blueprint' && (
        <div className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {blueprint.classGroup} · {blueprint.subject} — প্রশ্নকাঠামো ও নম্বর বণ্টন
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                মূল্যায়ন পদ্ধতি: {blueprint.evaluationStyle}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 font-bold text-blue-800">
                পূর্ণমান: {toBanglaDigit(blueprint.fullMarks)}
              </span>
              <span className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 font-semibold text-slate-800">
                পাস নম্বর: {toBanglaDigit(blueprint.passingMarks)}
              </span>
              <span className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 font-semibold text-slate-800">
                সময়: {blueprint.duration}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-slate-200 text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-100 text-slate-800 text-left">
                  <th className="border border-slate-200 p-3">প্রশ্নকাঠামোর অংশ / বিভাগ</th>
                  <th className="border border-slate-200 p-3">প্রশ্নের ধরন</th>
                  <th className="border border-slate-200 p-3 text-center">প্রশ্ন সংখ্যা</th>
                  <th className="border border-slate-200 p-3 text-center">প্রতিটির মান</th>
                  <th className="border border-slate-200 p-3 text-center">মোট নম্বর</th>
                  <th className="border border-slate-200 p-3">যোগ্যতা ও মূল্যায়ন নির্দেশক</th>
                </tr>
              </thead>
              <tbody>
                {blueprint.sections.map((sec) => (
                  <tr key={sec.id} className="hover:bg-slate-50">
                    <td className="border border-slate-200 p-3 font-semibold text-slate-900">
                      {sec.title}
                    </td>
                    <td className="border border-slate-200 p-3 text-slate-700">
                      {sec.questionType}
                    </td>
                    <td className="border border-slate-200 p-3 text-center tabular-nums font-semibold">
                      {toBanglaDigit(sec.questionCount)}টি
                    </td>
                    <td className="border border-slate-200 p-3 text-center tabular-nums">
                      {toBanglaDigit(sec.marksPerQuestion)}
                    </td>
                    <td className="border border-slate-200 p-3 text-center tabular-nums font-bold text-blue-700">
                      {toBanglaDigit(sec.totalMarks)}
                    </td>
                    <td className="border border-slate-200 p-3 text-slate-600 text-xs">
                      {sec.competencyNote}
                    </td>
                  </tr>
                ))}
                <tr className="bg-blue-50/70 font-bold text-slate-900">
                  <td colSpan={4} className="border border-slate-200 p-3 text-right">
                    সর্বমোট নির্ধারিত নম্বর:
                  </td>
                  <td className="border border-slate-200 p-3 text-center text-blue-800 tabular-nums">
                    {toBanglaDigit(blueprint.fullMarks)}
                  </td>
                  <td className="border border-slate-200 p-3 text-xs text-slate-600">
                    NCTB বার্ষিক পাঠ পরিকল্পনা ও মূল্যায়ন নির্দেশিকা অনুযায়ী
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 border border-slate-200 p-4">
            <p className="text-xs sm:text-sm text-slate-700">
              উপরের প্রশ্নকাঠামো এবং আপনার নির্বাচিত প্রান্তিকের পাঠ পরিকল্পনা মিলিয়ে এক ক্লিকে পূর্ণাঙ্গ প্রশ্নপত্র তৈরি করুন।
            </p>
            <button
              type="button"
              onClick={handleAutoBuildBlueprintPaper}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              <Sparkles className="h-4 w-4" />
              <span>এই কাঠামোতে অটো প্রশ্নপত্র তৈরি করুন</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: A4 QUESTION PAPER MAKER & PRINT / PDF PREVIEW */}
      {activeTab === 'paper' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Controls */}
          <div className="no-print lg:col-span-5 space-y-4">
            <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h2 className="text-base font-bold text-slate-900">পরীক্ষার শিরোনাম ও তথ্য</h2>
                <button
                  type="button"
                  onClick={() => setIncludeAnswerSheet((v) => !v)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold border transition-colors ${
                    includeAnswerSheet
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {includeAnswerSheet ? 'উত্তরমালা: চালু ✓' : 'উত্তরমালা: বন্ধ'}
                </button>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  বিদ্যালয়ের নাম
                </label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  ঠিকানা (গ্রাম, ডাকঘর, উপজেলা, জেলা)
                </label>
                <input
                  type="text"
                  value={schoolAddress}
                  onChange={(e) => setSchoolAddress(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  পরীক্ষার নাম
                </label>
                <input
                  type="text"
                  value={examName}
                  onChange={(e) => setExamName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">সময়</label>
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">তারিখ</label>
                  <input
                    type="text"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>

            <form
              onSubmit={handleAddCustom}
              className="rounded-2xl bg-white border border-slate-200 p-5 space-y-3"
            >
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <FilePlus2 className="h-4 w-4 text-blue-600" />
                <span>কাস্টম নতুন প্রশ্ন যোগ করুন</span>
              </h3>
              <div className="grid grid-cols-2 gap-2.5">
                <select
                  value={customType}
                  onChange={(e) => setCustomType(e.target.value as QuestionItem['type'])}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs"
                >
                  <option value="সঠিক উত্তর">সঠিক উত্তর</option>
                  <option value="শূন্যস্থান পূরণ">শূন্যস্থান পূরণ</option>
                  <option value="সংক্ষিপ্ত প্রশ্ন">সংক্ষিপ্ত প্রশ্ন</option>
                  <option value="রচনামূলক প্রশ্ন">রচনামূলক প্রশ্ন</option>
                </select>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={customMarks}
                  onChange={(e) => setCustomMarks(Number(e.target.value))}
                  placeholder="নম্বর"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs tabular-nums"
                />
              </div>
              <textarea
                rows={2}
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="প্রশ্নটি লিখুন..."
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
              <input
                type="text"
                value={customAnswer}
                onChange={(e) => setCustomAnswer(e.target.value)}
                placeholder="সঠিক উত্তর (ঐচ্ছিক)"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
              />
              <label className="flex items-center gap-2 text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={saveToBankAlso}
                  onChange={(e) => setSaveToBankAlso(e.target.checked)}
                />
                <span>স্থায়ী প্রশ্ন ভান্ডারেও সংরক্ষণ করুন</span>
              </label>
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2.5 text-xs font-semibold text-white hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                <span>প্রশ্নপত্রে যোগ করুন</span>
              </button>
            </form>

            <div className="rounded-2xl bg-white border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('bank')}
                className="text-xs font-semibold text-blue-700 hover:underline"
              >
                + ভান্ডার থেকে আরও প্রশ্ন বেছে নিন
              </button>
              {paperQuestions.length > 0 && (
                <button
                  type="button"
                  onClick={() => setPaperQuestions([])}
                  className="text-xs font-semibold text-red-600 hover:underline"
                >
                  প্রশ্নপত্র খালি করুন
                </button>
              )}
            </div>
          </div>

          {/* Right Official A4 Paper Sheet */}
          <div className="lg:col-span-7 space-y-4">
            <div
              ref={paperRef}
              className="print-only-sheet rounded-2xl bg-white border border-slate-200 p-6 sm:p-9 shadow-xs text-slate-900"
            >
              {/* Official Exam Header with Govt Monogram & DPE Emblem */}
              <div className="mb-5">
                <OfficialA4Letterhead
                  schoolName={schoolName}
                  addressLine={schoolAddress}
                  documentTitle={examName}
                  compact
                  className="mb-3"
                />
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm font-semibold text-slate-800">
                  <span>শ্রেণি: {classLevel}</span>
                  <span>বিষয়: {subject}</span>
                  <span>সময়: {duration}</span>
                  <span className="tabular-nums">পূর্ণমান: {toBanglaDigit(totalMarks)}</span>
                </div>
                <p className="mt-1 text-center text-[11px] text-slate-500">তারিখ: {examDate}</p>
              </div>

              {paperQuestions.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <p className="text-sm text-slate-500">
                    এখনো কোনো প্রশ্ন যোগ করা হয়নি।
                  </p>
                  <button
                    type="button"
                    onClick={handleAutoBuildBlueprintPaper}
                    className="no-print inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>স্বয়ংক্রিয় প্রশ্নপত্র তৈরি করুন</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {groupedPaperSections.map((group) => {
                    const groupTotal = group.items.reduce((s, item) => s + Number(item.marks || 0), 0);
                    return (
                      <section key={group.type} className="space-y-3">
                        <div className="flex items-center justify-between gap-2 border-b border-slate-300 pb-1">
                          <h4 className="text-sm font-bold text-slate-900">
                            {isEnglishSubject ? group.engHeading : group.heading}
                          </h4>
                          <span className="text-xs font-bold text-slate-700 tabular-nums shrink-0">
                            মোট: {toBanglaDigit(groupTotal)}
                          </span>
                        </div>

                        <div className="space-y-3">
                          {group.items.map((pq) => {
                            runningNumber += 1;
                            return (
                              <div
                                key={pq.id}
                                className="flex items-start justify-between gap-3 border-b border-slate-100 pb-2.5 last:border-b-0"
                              >
                                <div className="flex-1 space-y-1.5 text-sm leading-relaxed">
                                  <div>
                                    <span className="font-bold mr-1.5">
                                      {toBanglaDigit(runningNumber)}।
                                    </span>
                                    <span>{pq.text}</span>
                                  </div>
                                  {pq.options && (
                                    <div className="pl-5 grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs text-slate-700">
                                      {pq.options.map((opt, oi) => (
                                        <span key={oi}>{opt}</span>
                                      ))}
                                    </div>
                                  )}
                                  {includeAnswerSheet && pq.answer && (
                                    <div className="ml-5 rounded-lg bg-emerald-50/80 border border-emerald-200 px-2.5 py-1.5 text-xs text-emerald-950">
                                      <strong>উত্তর:</strong> {pq.answer}
                                    </div>
                                  )}
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  <input
                                    type="number"
                                    min={1}
                                    max={50}
                                    value={pq.marks}
                                    onChange={(e) => {
                                      const val = Math.max(1, Number(e.target.value) || 1);
                                      setPaperQuestions((prev) =>
                                        prev.map((x) => (x.id === pq.id ? { ...x, marks: val } : x))
                                      );
                                    }}
                                    aria-label="প্রশ্নের নম্বর"
                                    className="no-print w-12 rounded border border-slate-200 px-1.5 py-0.5 text-center text-xs font-bold tabular-nums"
                                  />
                                  <span className="hidden print:inline text-xs font-bold text-slate-900 tabular-nums">
                                    ({toBanglaDigit(pq.marks)})
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => moveQuestion(pq.id, -1)}
                                    title="উপরে নিন"
                                    className="no-print p-1 text-slate-400 hover:text-slate-700"
                                  >
                                    <ArrowUp className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => moveQuestion(pq.id, 1)}
                                    title="নিচে নিন"
                                    className="no-print p-1 text-slate-400 hover:text-slate-700"
                                  >
                                    <ArrowDown className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setPaperQuestions((prev) => prev.filter((q) => q.id !== pq.id))
                                    }
                                    aria-label="প্রশ্ন মুছুন"
                                    className="no-print p-1 text-slate-400 hover:text-red-600"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </section>
                    );
                  })}
                </div>
              )}

              <div className="no-print mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={handleExportPdf}
                  disabled={exportingPdf || paperQuestions.length === 0}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  <span>{exportingPdf ? 'PDF তৈরি হচ্ছে...' : 'PDF ডাউনলোড'}</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    triggerSmartPrint({
                      element: paperRef.current,
                      filename: `question-paper-${classLevel}-${subject}`,
                    })
                  }
                  disabled={paperQuestions.length === 0}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  <Printer className="h-4 w-4" />
                  <span>প্রশ্নপত্র প্রিন্ট করুন</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
