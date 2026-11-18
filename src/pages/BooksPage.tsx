import React, { useMemo, useState, useRef } from 'react';
import {
  BookOpen,
  FileText,
  Calendar,
  ExternalLink,
  X,
  Printer,
  GraduationCap,
  CheckCircle2,
  Search,
  Layers,
  Check,
  PackageOpen,
  ClipboardCheck,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Home,
  FileDown,
  Loader2,
} from 'lucide-react';
import { PageShell } from '../components/PageShell';
import { OfficialA4Letterhead } from '../components/OfficialEmblems';
import { CLASS_LEVELS } from '../data/curriculum';
import {
  CHAPTER_ORGANIZED_BOOKS,
  TOTAL_BOOK_CHAPTERS,
  ChapterOrganizedBook,
  BookChapterItem,
} from '../data/bookChapters';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { BookNoteItem, RouteKey } from '../types';
import { toBanglaDigit } from '../utils/bangla';
import { exportElementToA4Pdf } from '../utils/pdfExport';
import { triggerSmartPrint } from '../utils/printHelper';

interface BooksPageProps {
  onNavigate: (route: RouteKey) => void;
}

type BookTab = 'textbooks' | 'teacher_guides' | 'notes' | 'annual';
type ReaderMode = 'book' | 'tg';

export default function BooksPage({ onNavigate }: BooksPageProps) {
  const [customNotes] = useLocalStorage<BookNoteItem[]>('custom_book_notes_v1', []);
  const [completedChapters, setCompletedChapters] = useLocalStorage<Record<string, boolean>>(
    'nctb_completed_chapters_v1',
    {}
  );

  const [activeTab, setActiveTab] = useState<BookTab>('textbooks');
  const [selectedClass, setSelectedClass] = useState<string>('সকল শ্রেণি');
  const [searchQuery, setSearchQuery] = useState('');
  const [exportingPdf, setExportingPdf] = useState(false);
  const mainSheetRef = useRef<HTMLDivElement>(null);
  const readerSheetRef = useRef<HTMLDivElement>(null);

  // In-app Chapter-by-Chapter Reader Modal state
  const [readerState, setReaderState] = useState<{
    book: ChapterOrganizedBook;
    mode: ReaderMode;
    chapterIdx: number;
  } | null>(null);

  const filteredBooks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return CHAPTER_ORGANIZED_BOOKS.filter(({ entry, chapters }) => {
      if (selectedClass !== 'সকল শ্রেণি' && entry.classLevel !== selectedClass) {
        return false;
      }
      if (!q) return true;
      const hay = [
        entry.classLevel,
        entry.subject,
        entry.bookTitle,
        entry.teacherGuideTitle,
        ...chapters.flatMap((c) => [c.title, c.termLabel, c.bookSummary, ...c.learningOutcomes]),
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [selectedClass, searchQuery]);

  const matchingNotes = useMemo(
    () =>
      customNotes.filter(
        (n) => selectedClass === 'সকল শ্রেণি' || n.classLevel === selectedClass
      ),
    [customNotes, selectedClass]
  );

  const completedCount = useMemo(
    () => Object.values(completedChapters).filter(Boolean).length,
    [completedChapters]
  );

  const toggleChapterComplete = (chapterId: string) => {
    setCompletedChapters((prev) => ({ ...prev, [chapterId]: !prev[chapterId] }));
  };

  const openChapterReader = (
    book: ChapterOrganizedBook,
    chapterIdx: number,
    modeOverride?: ReaderMode
  ) => {
    const mode: ReaderMode =
      modeOverride || (activeTab === 'teacher_guides' ? 'tg' : 'book');
    setReaderState({
      book,
      mode,
      chapterIdx: Math.max(0, Math.min(chapterIdx, book.chapters.length - 1)),
    });
  };

  const activeChapter: BookChapterItem | null = readerState
    ? readerState.book.chapters[readerState.chapterIdx] || null
    : null;

  const handleExportPdf = async (el: HTMLElement | null, filename: string) => {
    if (!el || exportingPdf) return;
    setExportingPdf(true);
    try {
      await exportElementToA4Pdf(el, filename);
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <PageShell
      title="NCTB মূল বই ও শিক্ষক সহায়িকা (অধ্যায় ভিত্তিক)"
      subtitle="প্রাক-প্রাথমিক থেকে ৫ম শ্রেণি — প্রতিটি বিষয়ের সকল অধ্যায় ধারাবাহিক সূচি, পাঠ-সারসংক্ষেপ ও শিক্ষক সহায়িকা (TG)"
      onNavigate={onNavigate}
      onPrint={() =>
        triggerSmartPrint({
          element: mainSheetRef.current,
          filename: `nctb-chapters-${selectedClass}`,
        })
      }
      printLabel="অধ্যায় তালিকা প্রিন্ট (A4)"
      onExportPdf={() =>
        handleExportPdf(mainSheetRef.current, `nctb-chapters-${selectedClass}`)
      }
      exportingPdf={exportingPdf}
      pdfLabel="PDF সংরক্ষণ"
    >
      {/* Top Progress + Navigation Tabs */}
      <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'textbooks' as BookTab, label: 'মূল বই (অধ্যায় ভিত্তিক)', icon: BookOpen },
            {
              id: 'teacher_guides' as BookTab,
              label: 'শিক্ষক সহায়িকা (TG)',
              icon: GraduationCap,
            },
            { id: 'notes' as BookTab, label: 'পাঠটীকা সমূহ', icon: FileText },
            { id: 'annual' as BookTab, label: 'বার্ষিক অধ্যায়ভিত্তিক সূচি', icon: Calendar },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-emerald-900 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-800">
          <Layers className="h-4 w-4 text-emerald-700" aria-hidden="true" />
          <span className="tabular-nums">
            সম্পন্ন অধ্যায়: {toBanglaDigit(completedCount)} / {toBanglaDigit(TOTAL_BOOK_CHAPTERS)}
          </span>
        </div>
      </div>

      {/* Filters Card */}
      <div className="no-print mb-5 rounded-2xl bg-white border border-slate-200 p-4 sm:p-5 space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {['সকল শ্রেণি', ...CLASS_LEVELS].map((cls) => (
              <button
                key={cls}
                type="button"
                onClick={() => setSelectedClass(cls)}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                  selectedClass === cls
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cls}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="বই, অধ্যায়ের নাম বা পাঠ খুঁজুন..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs sm:text-sm focus:border-emerald-700 focus:bg-white focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* TAB 1 & TAB 2: Chapter-by-Chapter Textbooks & Teacher's Guides */}
      {(activeTab === 'textbooks' || activeTab === 'teacher_guides') && (
        <div ref={mainSheetRef} className="print-only-sheet space-y-4">
          {filteredBooks.length === 0 ? (
            <div className="rounded-2xl bg-white border border-slate-200 p-8 text-center text-sm text-slate-500">
              নির্বাচিত শ্রেণি বা অনুসন্ধানে কোনো বই বা অধ্যায় পাওয়া যায়নি।
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredBooks.map((book) => {
                const { entry, chapters } = book;
                const isTG = activeTab === 'teacher_guides';
                const heading = isTG ? entry.teacherGuideTitle : entry.bookTitle;
                const doneInBook = chapters.filter((ch) => completedChapters[ch.id]).length;

                return (
                  <article
                    key={entry.id}
                    className="rounded-2xl bg-white border border-slate-200 p-5 shadow-xs hover:border-emerald-400 transition-colors flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="font-bold text-emerald-800">{entry.classLevel}</span>
                            <span className="text-slate-300">·</span>
                            <span className="font-semibold text-slate-600">{entry.subject}</span>
                          </div>
                          <h3 className="text-base font-bold text-slate-900 mt-1">{heading}</h3>
                          <p className="text-xs text-slate-500 mt-0.5">{entry.editionNote}</p>
                        </div>

                        <span className="shrink-0 rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[11px] font-bold text-emerald-800 tabular-nums">
                          {toBanglaDigit(doneInBook)}/{toBanglaDigit(chapters.length)} অধ্যায়
                        </span>
                      </div>

                      {/* Sequential Chapter-by-Chapter List */}
                      <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                        {chapters.map((ch, idx) => {
                          const isDone = !!completedChapters[ch.id];
                          return (
                            <div
                              key={ch.id}
                              className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 transition-colors ${
                                isDone
                                  ? 'border-emerald-200 bg-emerald-50/70'
                                  : 'border-slate-200 bg-slate-50/70 hover:border-emerald-300 hover:bg-emerald-50/30'
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => openChapterReader(book, idx)}
                                className="flex-1 min-w-0 text-left flex items-start gap-2.5"
                              >
                                <span className="inline-flex h-5 min-w-5 px-1.5 items-center justify-center rounded-md bg-emerald-900 text-[10px] font-bold text-white tabular-nums shrink-0 mt-0.5">
                                  {toBanglaDigit(ch.chapterNumber)}
                                </span>
                                <div className="min-w-0">
                                  <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-snug">
                                    {ch.title}
                                  </p>
                                  <p className="text-[11px] text-slate-500 mt-0.5">
                                    {ch.termLabel} · সময়: {ch.duration}
                                  </p>
                                </div>
                              </button>

                              <button
                                type="button"
                                onClick={() => toggleChapterComplete(ch.id)}
                                title={isDone ? 'সম্পন্ন হয়েছে' : 'সম্পন্ন চিহ্ন দিন'}
                                aria-label={`${ch.title} সম্পন্ন চিহ্ন`}
                                className={`no-print shrink-0 h-7 w-7 rounded-lg border flex items-center justify-center transition-colors ${
                                  isDone
                                    ? 'bg-emerald-600 border-emerald-600 text-white'
                                    : 'bg-white border-slate-200 text-slate-400 hover:border-emerald-500 hover:text-emerald-700'
                                }`}
                              >
                                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="no-print flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openChapterReader(book, 0, 'book')}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-950 transition-colors"
                        >
                          <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>অধ্যায় পাঠ শুরু করুন</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openChapterReader(book, 0, 'tg')}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition-colors"
                        >
                          <GraduationCap className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>শিক্ষক সহায়িকা</span>
                        </button>
                      </div>

                      <a
                        href={entry.nctbPortalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="NCTB অফিসিয়াল PDF পোর্টাল"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-emerald-800"
                      >
                        <span>NCTB PDF</span>
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Custom & Curriculum Notes */}
      {activeTab === 'notes' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  পাঠটীকা ও বিশেষ নির্দেশিকা
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  ড্যাশবোর্ড থেকে যুক্তকৃত পাঠটীকা এবং অধ্যায়ভিত্তিক শিক্ষক নোটসমূহ এখানে প্রদর্শিত হয়।
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('admin_dashboard')}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                + ড্যাশবোর্ড থেকে নতুন পাঠটীকা যোগ করুন
              </button>
            </div>

            {matchingNotes.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-6 text-center text-xs sm:text-sm text-slate-500">
                কাস্টম পাঠটীকা এখনো যোগ করা হয়নি। তবে &quot;মূল বই (অধ্যায় ভিত্তিক)&quot; বা &quot;শিক্ষক সহায়িকা&quot; ট্যাব থেকে প্রতিটি বিষয়ের অধ্যায়ভিত্তিক সম্পূর্ণ পাঠটীকা, শিখনফল ও নির্দেশিকা পড়তে ও প্রিন্ট করতে পারবেন।
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {matchingNotes.map((note) => (
                  <article
                    key={note.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-1.5"
                  >
                    <p className="text-xs font-semibold text-emerald-800">
                      {note.classLevel} · {note.subject} · {note.kind}
                    </p>
                    <h4 className="text-sm font-bold text-slate-900">{note.title}</h4>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                      {note.content}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: Annual Chapter-by-Chapter Matrix */}
      {activeTab === 'annual' && (
        <div
          ref={mainSheetRef}
          className="print-only-sheet rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 space-y-4"
        >
          <OfficialA4Letterhead
            schoolName="প্রাথমিক বিদ্যালয় বার্ষিক অধ্যায়ভিত্তিক পাঠ্যসূচি"
            addressLine={`শ্রেণি: ${selectedClass} · জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (NCTB)`}
            subtitle="১ম প্রান্তিক (জানু–এপ্রিল) · ২য় প্রান্তিক (মে–আগস্ট) · ৩য় প্রান্তিক (সেপ্টে–ডিসেম্বর)"
            compact
          />

          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-slate-300 text-xs sm:text-sm min-w-[760px]">
              <thead>
                <tr className="bg-slate-100 text-slate-800 text-left">
                  <th className="border border-slate-300 p-2.5">শ্রেণি ও বিষয় (মোট অধ্যায়)</th>
                  <th className="border border-slate-300 p-2.5">১ম প্রান্তিক অধ্যায়সমূহ</th>
                  <th className="border border-slate-300 p-2.5">২য় প্রান্তিক অধ্যায়সমূহ</th>
                  <th className="border border-slate-300 p-2.5">৩য় প্রান্তিক অধ্যায়সমূহ</th>
                </tr>
              </thead>
              <tbody>
                {filteredBooks.map((book) => {
                  const { entry, chapters } = book;
                  const t1 = chapters.filter((c) => c.termLabel === '১ম প্রান্তিক');
                  const t2 = chapters.filter((c) => c.termLabel === '২য় প্রান্তিক');
                  const t3 = chapters.filter((c) => c.termLabel === '৩য় প্রান্তিক');

                  return (
                    <tr key={entry.id} className="align-top hover:bg-slate-50/70">
                      <td className="border border-slate-300 p-2.5 font-semibold text-slate-900">
                        <span className="block text-[11px] text-emerald-800">{entry.classLevel}</span>
                        <span>{entry.subject}</span>
                        <span className="block text-[11px] font-normal text-slate-500 mt-0.5 tabular-nums">
                          মোট {toBanglaDigit(chapters.length)}টি অধ্যায়
                        </span>
                      </td>
                      {[t1, t2, t3].map((list, idx) => (
                        <td key={idx} className="border border-slate-300 p-2.5 text-xs text-slate-700">
                          <ol className="space-y-1">
                            {list.map((c) => (
                              <li key={c.id} className="flex items-start gap-1.5">
                                <span className="font-bold text-emerald-800 tabular-nums shrink-0">
                                  {toBanglaDigit(c.chapterNumber)}.
                                </span>
                                <button
                                  type="button"
                                  onClick={() => openChapterReader(book, c.chapterNumber - 1)}
                                  className="text-left hover:underline hover:text-emerald-900"
                                >
                                  {c.title}
                                </button>
                              </li>
                            ))}
                          </ol>
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* In-App Chapter-by-Chapter Book & Teacher's Guide Reader Modal */}
      {readerState && activeChapter && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 backdrop-blur-xs p-3 sm:p-4"
          role="dialog"
          aria-modal="true"
        >
          <div
            ref={readerSheetRef}
            className="print-only-sheet w-full max-w-3xl rounded-2xl bg-white p-5 sm:p-7 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto space-y-5"
          >
            {/* Institutional Header for Printable Chapter */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <OfficialA4Letterhead
                  schoolName={
                    readerState.mode === 'tg'
                      ? readerState.book.entry.teacherGuideTitle
                      : readerState.book.entry.bookTitle
                  }
                  addressLine={`${readerState.book.entry.classLevel} · ${readerState.book.entry.subject} · ${activeChapter.termLabel}`}
                  compact
                  className="mb-2"
                />
              </div>
              <button
                type="button"
                onClick={() => setReaderState(null)}
                aria-label="বন্ধ করুন"
                className="no-print shrink-0 p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Mode Switch + Chapter Step Navigation */}
            <div className="no-print flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setReaderState({ ...readerState, mode: 'book' })}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    readerState.mode === 'book'
                      ? 'bg-white text-emerald-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>মূল বই (অধ্যায়)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setReaderState({ ...readerState, mode: 'tg' })}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    readerState.mode === 'tg'
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <GraduationCap className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>শিক্ষক সহায়িকা (TG)</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={readerState.chapterIdx === 0}
                  onClick={() =>
                    setReaderState({
                      ...readerState,
                      chapterIdx: Math.max(0, readerState.chapterIdx - 1),
                    })
                  }
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>পূর্ববর্তী</span>
                </button>
                <span className="text-xs font-bold text-slate-700 tabular-nums">
                  অধ্যায় {toBanglaDigit(activeChapter.chapterNumber)} /{' '}
                  {toBanglaDigit(readerState.book.chapters.length)}
                </span>
                <button
                  type="button"
                  disabled={readerState.chapterIdx >= readerState.book.chapters.length - 1}
                  onClick={() =>
                    setReaderState({
                      ...readerState,
                      chapterIdx: Math.min(
                        readerState.book.chapters.length - 1,
                        readerState.chapterIdx + 1
                      ),
                    })
                  }
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                  <span>পরবর্তী</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Chapter Selector Bar */}
            <div className="no-print flex flex-wrap gap-1.5">
              {readerState.book.chapters.map((ch, idx) => {
                const isSelected = idx === readerState.chapterIdx;
                const isDone = !!completedChapters[ch.id];
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => setReaderState({ ...readerState, chapterIdx: idx })}
                    className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold tabular-nums transition-colors ${
                      isSelected
                        ? 'bg-emerald-900 text-white'
                        : isDone
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span>অধ্যায় {toBanglaDigit(ch.chapterNumber)}</span>
                    {isDone && <Check className="h-3 w-3" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>

            {/* Selected Chapter Card */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-200 pb-3">
                <div>
                  <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-900 px-2.5 py-0.5 text-xs font-bold text-white">
                    অধ্যায় {toBanglaDigit(activeChapter.chapterNumber)} · {activeChapter.termLabel}
                  </span>
                  <h4 className="text-base sm:text-lg font-bold text-slate-900 mt-1.5">
                    {activeChapter.title}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {activeChapter.termWindow} · বরাদ্দকৃত সময়: {activeChapter.duration}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => toggleChapterComplete(activeChapter.id)}
                  className={`no-print inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                    completedChapters[activeChapter.id]
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>
                    {completedChapters[activeChapter.id] ? 'সম্পন্ন হয়েছে' : 'সম্পন্ন চিহ্ন দিন'}
                  </span>
                </button>
              </div>

              {/* Book Summary */}
              <div className="rounded-xl bg-white border border-slate-200/80 p-3.5">
                <p className="text-xs font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />
                  <span>অধ্যায়ের মূল পাঠ-সারসংক্ষেপ:</span>
                </p>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  {activeChapter.bookSummary}
                </p>
              </div>

              {/* Learning Outcomes */}
              <div className="rounded-xl bg-white border border-slate-200/80 p-3.5">
                <p className="text-xs font-bold text-slate-900 mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />
                  <span>অধ্যায়ভিত্তিক শিখনফল:</span>
                </p>
                <ul className="space-y-1 text-xs sm:text-sm text-slate-700 list-disc list-inside leading-relaxed">
                  {activeChapter.learningOutcomes.map((lo, i) => (
                    <li key={i}>{lo}</li>
                  ))}
                </ul>
              </div>

              {/* Teacher Guide Steps + Materials + Evaluation */}
              <div
                className={`rounded-xl border p-3.5 space-y-3 ${
                  readerState.mode === 'tg'
                    ? 'border-emerald-300 bg-emerald-50/70'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <GraduationCap className="h-4 w-4 text-emerald-700" aria-hidden="true" />
                  <span>শিক্ষক সহায়িকা (TG) — শ্রেণিকক্ষে পাঠদান ধাপসমূহ:</span>
                </p>
                <p className="text-xs text-slate-700">
                  <strong>আবেগ সৃষ্টি / পূর্বজ্ঞান যাচাই:</strong> {activeChapter.warmUp}
                </p>
                <ol className="space-y-1 text-xs sm:text-sm text-slate-700 list-decimal list-inside leading-relaxed">
                  {activeChapter.teacherGuideSteps.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>

                <div className="pt-1 flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="font-bold text-slate-700 inline-flex items-center gap-1">
                    <PackageOpen className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />
                    শিক্ষা উপকরণ:
                  </span>
                  {activeChapter.teachingMaterials.map((mat) => (
                    <span
                      key={mat}
                      className="rounded-lg bg-white border border-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-700"
                    >
                      {mat}
                    </span>
                  ))}
                </div>

                <div className="pt-1 text-xs text-slate-800 space-y-1">
                  <div className="flex items-start gap-1.5">
                    <ClipboardCheck
                      className="h-3.5 w-3.5 text-emerald-700 shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    <div>
                      <strong>অধ্যায়ভিত্তিক মূল্যায়ন:</strong>{' '}
                      {activeChapter.evaluationPoints.join(' · ')}
                    </div>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <Home className="h-3.5 w-3.5 text-slate-600 shrink-0 mt-0.5" aria-hidden="true" />
                    <div>
                      <strong>বাড়ির কাজ:</strong> {activeChapter.homework}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="no-print flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
              <a
                href={readerState.book.entry.nctbPortalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <ExternalLink className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />
                <span>অফিশিয়াল NCTB পোর্টাল</span>
              </a>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setReaderState(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  বন্ধ করুন
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleExportPdf(
                      readerSheetRef.current,
                      `${readerState.book.entry.id}-chapter-${activeChapter.chapterNumber}`
                    )
                  }
                  disabled={exportingPdf}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {exportingPdf ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <FileDown className="h-4 w-4" aria-hidden="true" />
                  )}
                  <span>{exportingPdf ? 'PDF তৈরি হচ্ছে...' : 'PDF সংরক্ষণ (A4)'}</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    triggerSmartPrint({
                      element: readerSheetRef.current,
                      filename: `${readerState.book.entry.id}-chapter-${activeChapter.chapterNumber}`,
                    })
                  }
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-900 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-950"
                >
                  <Printer className="h-4 w-4" aria-hidden="true" />
                  <span>অধ্যায় প্রিন্ট (A4)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
