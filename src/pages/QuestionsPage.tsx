import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Eye, EyeOff, Copy, Check, Plus, Trash2, X } from 'lucide-react';
import { PageShell } from '../components/PageShell';
import { OfficialA4Letterhead } from '../components/OfficialEmblems';
import { CLASS_LEVELS, INITIAL_QUESTIONS, SUBJECTS_BY_CLASS } from '../data/curriculum';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { QuestionItem, RouteKey } from '../types';
import { toBanglaDigit } from '../utils/bangla';
import { exportElementToA4Pdf } from '../utils/pdfExport';
import { triggerSmartPrint } from '../utils/printHelper';

interface QuestionsPageProps {
  onNavigate: (route: RouteKey) => void;
}

const QUESTION_TYPES = [
  'সব ধরন',
  'সঠিক উত্তর',
  'শূন্যস্থান পূরণ',
  'সংক্ষিপ্ত প্রশ্ন',
  'রচনামূলক প্রশ্ন',
] as const;

const TERMS = ['সব প্রান্তিক', '১ম প্রান্তিক', '২য় প্রান্তিক', '৩য় প্রান্তিক'] as const;

export default function QuestionsPage({ onNavigate }: QuestionsPageProps) {
  const [questions, setQuestions] = useLocalStorage<QuestionItem[]>(
    'custom_questions_v1',
    INITIAL_QUESTIONS
  );
  const [selectedClass, setSelectedClass] = useState('সকল শ্রেণি');
  const [selectedSubject, setSelectedSubject] = useState('সকল বিষয়');
  const [selectedTerm, setSelectedTerm] = useState<string>('সব প্রান্তিক');
  const [selectedType, setSelectedType] = useState('সব ধরন');
  const [searchQuery, setSearchQuery] = useState('');
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});
  const [showAllAnswers, setShowAllAnswers] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  const [newForm, setNewForm] = useState<{
    classLevel: string;
    subject: string;
    term: '১ম প্রান্তিক' | '২য় প্রান্তিক' | '৩য় প্রান্তিক';
    chapter: string;
    type: QuestionItem['type'];
    question: string;
    answer: string;
  }>({
    classLevel: 'পঞ্চম শ্রেণি',
    subject: 'আমার বাংলা বই',
    term: '১ম প্রান্তিক',
    chapter: '',
    type: 'সংক্ষিপ্ত প্রশ্ন',
    question: '',
    answer: '',
  });

  // One-time merge: upgrade older local question banks with complete Pre-Primary–Class 5 rich bank
  useEffect(() => {
    try {
      const seeded = window.localStorage.getItem('rich_qb_seeded_v4');
      if (seeded) return;
      setQuestions((prev) => {
        const existingMap = new Map(prev.map((q) => [q.id, q]));
        const legacyCustom = prev.filter(
          (q) => !INITIAL_QUESTIONS.some((init) => init.id === q.id) && !q.id.startsWith('q-')
        );
        const merged = INITIAL_QUESTIONS.map((init) => existingMap.get(init.id) || init);
        return [...legacyCustom, ...merged];
      });
      window.localStorage.setItem('rich_qb_seeded_v4', '1');
    } catch {
      // Ignore storage error safely
    }
  }, [setQuestions]);

  const availableSubjects = useMemo(() => {
    if (selectedClass === 'সকল শ্রেণি') {
      const unique = new Set<string>();
      Object.values(SUBJECTS_BY_CLASS).forEach((arr) => arr.forEach((s) => unique.add(s)));
      return Array.from(unique);
    }
    return SUBJECTS_BY_CLASS[selectedClass] || [];
  }, [selectedClass]);

  const filtered = useMemo(() => {
    return questions.filter((q) => {
      const mClass = selectedClass === 'সকল শ্রেণি' || q.classLevel === selectedClass;
      const mSub = selectedSubject === 'সকল বিষয়' || q.subject === selectedSubject;
      const mTerm = selectedTerm === 'সব প্রান্তিক' || q.term === selectedTerm;
      const mType = selectedType === 'সব ধরন' || q.type === selectedType;
      const termSearch = searchQuery.trim().toLowerCase();
      const mSearch =
        !termSearch ||
        q.question.toLowerCase().includes(termSearch) ||
        q.subject.toLowerCase().includes(termSearch) ||
        q.chapter.toLowerCase().includes(termSearch) ||
        (q.subCategory || '').toLowerCase().includes(termSearch);
      return mClass && mSub && mTerm && mType && mSearch;
    });
  }, [questions, selectedClass, selectedSubject, selectedTerm, selectedType, searchQuery]);

  const toggleOne = (id: string) => {
    setRevealedIds((prev) => ({ ...prev, [id]: !(prev[id] ?? showAllAnswers) }));
  };

  const handleCopy = async (id: string, qText: string, ans: string) => {
    try {
      await navigator.clipboard.writeText(`প্রশ্ন: ${qText}\nউত্তর: ${ans}`);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      // ignore
    }
  };

  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.question.trim()) return;
    const item: QuestionItem = {
      id: `custom-q-${Date.now()}`,
      classLevel: newForm.classLevel,
      subject: newForm.subject,
      term: newForm.term,
      chapter: newForm.chapter.trim() || 'সাধারণ অধ্যায়',
      type: newForm.type,
      subCategory: 'শিক্ষক সংযোজিত',
      marks: newForm.type === 'রচনামূলক প্রশ্ন' ? 10 : newForm.type === 'সঠিক উত্তর' ? 2 : 5,
      question: newForm.question.trim(),
      answer: newForm.answer.trim() || 'পাঠ্যবই অনুসরণ করুন।',
    };
    setQuestions((prev) => [item, ...prev]);
    setAddModalOpen(false);
    setNewForm((prev) => ({ ...prev, chapter: '', question: '', answer: '' }));
  };

  const handleExportPdf = async () => {
    if (!sheetRef.current || exportingPdf) return;
    setExportingPdf(true);
    try {
      await exportElementToA4Pdf(
        sheetRef.current,
        `questions-${selectedClass.replace(/\s+/g, '-')}`
      );
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <PageShell
      title="অধ্যায়ভিত্তিক প্রশ্ন ও সমাধান ভান্ডার"
      subtitle={`প্রাক-প্রাথমিক থেকে পঞ্চম শ্রেণির পাঠ পরিকল্পনা ও প্রশ্নকাঠামো ভিত্তিক ${toBanglaDigit(questions.length)}টি সমৃদ্ধ প্রশ্ন ও সমাধান`}
      onNavigate={onNavigate}
      onPrint={() =>
        triggerSmartPrint({
          element: sheetRef.current,
          filename: `questions-${selectedClass.replace(/\s+/g, '-')}`,
        })
      }
      printLabel="প্রশ্নোত্তর প্রিন্ট (A4)"
      onExportPdf={handleExportPdf}
      exportingPdf={exportingPdf}
      pdfLabel="PDF সংরক্ষণ"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setAddModalOpen(true)}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 text-xs font-semibold text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>নতুন প্রশ্ন যোগ</span>
          </button>
          <button
            type="button"
            onClick={() => {
              const next = !showAllAnswers;
              setShowAllAnswers(next);
              setRevealedIds({});
            }}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            {showAllAnswers ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            <span>{showAllAnswers ? 'সব উত্তর লুকান' : 'সব উত্তর দেখুন'}</span>
          </button>
        </div>
      }
    >
      <div className="no-print mb-5 rounded-2xl bg-white border border-slate-200 p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          <div className="relative lg:col-span-2">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="প্রশ্ন, অধ্যায় বা বিষয় খুঁজুন..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
            />
          </div>
          <select
            value={selectedClass}
            onChange={(e) => {
              setSelectedClass(e.target.value);
              setSelectedSubject('সকল বিষয়');
            }}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-blue-600 focus:outline-none"
          >
            <option value="সকল শ্রেণি">সকল শ্রেণি (প্রাক–৫ম)</option>
            {CLASS_LEVELS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-blue-600 focus:outline-none"
          >
            <option value="সকল বিষয়">সকল বিষয়</option>
            {availableSubjects.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-800 focus:border-blue-600 focus:outline-none"
            >
              {TERMS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-800 focus:border-blue-600 focus:outline-none"
            >
              {QUESTION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 pt-1">
          <span>
            প্রদর্শিত হচ্ছে <strong className="text-slate-900">{toBanglaDigit(filtered.length)}টি</strong> প্রশ্ন
          </span>
          <button
            type="button"
            onClick={() => onNavigate('suggestions')}
            className="font-semibold text-blue-700 hover:underline"
          >
            পূর্ণাঙ্গ প্রশ্নপত্র তৈরি করতে &quot;প্রশ্ন ও সাজেশন&quot; খুলুন →
          </button>
        </div>
      </div>

      <div
        ref={sheetRef}
        className="print-only-sheet space-y-3.5 rounded-2xl bg-white p-4 sm:p-5 border border-slate-200"
      >
        <OfficialA4Letterhead
          schoolName="অধ্যায়ভিত্তিক প্রশ্ন ও সমাধান ভান্ডার"
          addressLine={`শ্রেণি: ${selectedClass} · বিষয়: ${selectedSubject} · প্রান্তিক: ${selectedTerm}`}
          subtitle={`মোট প্রশ্ন: ${toBanglaDigit(filtered.length)}টি · প্রাইমারি মাস্টার`}
          compact
        />
        {filtered.length === 0 ? (
          <div className="rounded-2xl bg-white border border-slate-200 p-8 text-center text-sm text-slate-500">
            কোনো প্রশ্ন পাওয়া যায়নি। অনুগ্রহ করে ফিল্টার পরিবর্তন করুন।
          </div>
        ) : (
          filtered.map((q, index) => {
            const isShown = revealedIds[q.id] ?? showAllAnswers;
            return (
              <article
                key={q.id}
                className="rounded-2xl bg-white border border-slate-200 p-4 sm:p-5 shadow-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 mb-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-bold text-blue-700">{q.classLevel}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-medium text-slate-700">{q.subject}</span>
                    {q.term && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-emerald-700 font-semibold">{q.term}</span>
                      </>
                    )}
                    <span aria-hidden="true">·</span>
                    <span>{q.chapter}</span>
                    <span aria-hidden="true">·</span>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-700 font-medium">
                      {q.subCategory || q.type}
                    </span>
                  </div>
                  <div className="no-print flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleCopy(q.id, q.question, q.answer)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                    >
                      {copiedId === q.id ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      <span>{copiedId === q.id ? 'কপি' : 'কপি'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleOne(q.id)}
                      className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200"
                    >
                      {isShown ? 'উত্তর লুকান' : 'উত্তর দেখুন'}
                    </button>
                    {q.id.startsWith('custom-q-') && (
                      <button
                        type="button"
                        onClick={() => setQuestions((prev) => prev.filter((x) => x.id !== q.id))}
                        aria-label="প্রশ্ন মুছুন"
                        className="p-1 text-slate-400 hover:text-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                  {toBanglaDigit(index + 1)}. {q.question}
                </h3>

                {q.options && (
                  <div className="mt-2.5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-700">
                    {q.options.map((opt, idx) => (
                      <div key={idx} className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-1.5">
                        {opt}
                      </div>
                    ))}
                  </div>
                )}

                {isShown && (
                  <div className="mt-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 px-4 py-3 text-xs sm:text-sm text-emerald-950 leading-relaxed">
                    <span className="font-bold">উত্তর: </span>
                    {q.answer}
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>

      {/* Add Question Modal */}
      {addModalOpen && (
        <div
          className="no-print fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900">নতুন প্রশ্ন ও সমাধান যুক্ত করুন</h3>
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddQuestion} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">শ্রেণি</label>
                  <select
                    value={newForm.classLevel}
                    onChange={(e) => {
                      const cls = e.target.value;
                      const subs = SUBJECTS_BY_CLASS[cls] || [];
                      setNewForm({ ...newForm, classLevel: cls, subject: subs[0] || '' });
                    }}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                  >
                    {CLASS_LEVELS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">বিষয়</label>
                  <select
                    value={newForm.subject}
                    onChange={(e) => setNewForm({ ...newForm, subject: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                  >
                    {(SUBJECTS_BY_CLASS[newForm.classLevel] || []).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">প্রান্তিক</label>
                  <select
                    value={newForm.term}
                    onChange={(e) =>
                      setNewForm({
                        ...newForm,
                        term: e.target.value as '১ম প্রান্তিক' | '২য় প্রান্তিক' | '৩য় প্রান্তিক',
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                  >
                    <option value="১ম প্রান্তিক">১ম প্রান্তিক</option>
                    <option value="২য় প্রান্তিক">২য় প্রান্তিক</option>
                    <option value="৩য় প্রান্তিক">৩য় প্রান্তিক</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">প্রশ্নের ধরন</label>
                  <select
                    value={newForm.type}
                    onChange={(e) =>
                      setNewForm({ ...newForm, type: e.target.value as QuestionItem['type'] })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                  >
                    <option value="সঠিক উত্তর">সঠিক উত্তর</option>
                    <option value="শূন্যস্থান পূরণ">শূন্যস্থান পূরণ</option>
                    <option value="সংক্ষিপ্ত প্রশ্ন">সংক্ষিপ্ত প্রশ্ন</option>
                    <option value="রচনামূলক প্রশ্ন">রচনামূলক প্রশ্ন</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">অধ্যায় / পাঠ</label>
                <input
                  type="text"
                  value={newForm.chapter}
                  onChange={(e) => setNewForm({ ...newForm, chapter: e.target.value })}
                  placeholder="যেমন: অধ্যায় ৩: ভগ্নাংশ"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">প্রশ্ন</label>
                <textarea
                  rows={2}
                  required
                  value={newForm.question}
                  onChange={(e) => setNewForm({ ...newForm, question: e.target.value })}
                  placeholder="প্রশ্নটি লিখুন..."
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">সঠিক উত্তর / সমাধান</label>
                <textarea
                  rows={2}
                  value={newForm.answer}
                  onChange={(e) => setNewForm({ ...newForm, answer: e.target.value })}
                  placeholder="উত্তরটি লিখুন..."
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageShell>
  );
}
