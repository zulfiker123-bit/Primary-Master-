import React, { useState } from 'react';
import {
  BookOpenCheck,
  Lightbulb,
  BookMarked,
  Youtube,
  Compass,
  Users,
  MessagesSquare,
  FileSignature,
  ClipboardList,
  ClipboardCheck,
  Award,
  Plus,
  Pencil,
  Trash2,
  RotateCcw,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import {
  CLASS_LEVELS,
  INITIAL_FORUM_POSTS,
  INITIAL_LESSON_PLANS,
  INITIAL_QUESTIONS,
  INITIAL_VIDEOS,
  OFFICIAL_PORTALS,
  SUBJECTS_BY_CLASS,
} from '../data/curriculum';
import { useLocalStorage } from '../hooks/useLocalStorage';
import {
  BookNoteItem,
  ForumPost,
  LessonPlanItem,
  PortalLinkItem,
  QuestionItem,
  RouteKey,
  Student,
  TeacherProfile,
  VideoItem,
} from '../types';
import { getFormattedBanglaDate, toBanglaDigit } from '../utils/bangla';

interface ServiceDataManagerProps {
  profile: TeacherProfile;
  onNavigate: (route: RouteKey) => void;
  onNotify: (type: 'success' | 'error', message: string) => void;
}

type ServiceSection =
  | 'lesson_plan'
  | 'questions'
  | 'books'
  | 'videos'
  | 'portals'
  | 'students'
  | 'forum'
  | 'forms';

function extractYoutubeId(url: string): string {
  const trimmed = url.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([a-zA-Z0-9_-]{6,})/);
  return match ? match[1] : 'dQw4w9WgXcQ';
}

export const ServiceDataManager: React.FC<ServiceDataManagerProps> = ({
  profile,
  onNavigate,
  onNotify,
}) => {
  const [section, setSection] = useState<ServiceSection>('lesson_plan');

  // Shared live localStorage datasets for Core Services
  const [plans, setPlans] = useLocalStorage<LessonPlanItem[]>(
    'custom_lesson_plans_v1',
    INITIAL_LESSON_PLANS
  );
  const [questions, setQuestions] = useLocalStorage<QuestionItem[]>(
    'custom_questions_v1',
    INITIAL_QUESTIONS
  );
  const [bookNotes, setBookNotes] = useLocalStorage<BookNoteItem[]>(
    'custom_book_notes_v1',
    []
  );
  const [videos, setVideos] = useLocalStorage<VideoItem[]>(
    'edu_videos_v1',
    INITIAL_VIDEOS
  );
  const [portals, setPortals] = useLocalStorage<PortalLinkItem[]>(
    'custom_portals_v1',
    OFFICIAL_PORTALS
  );
  const [students, setStudents] = useLocalStorage<Student[]>('students_list_v1', []);
  const [forumPosts, setForumPosts] = useLocalStorage<ForumPost[]>(
    'teacher_forum_v1',
    INITIAL_FORUM_POSTS
  );

  // 1. Lesson Plan Form State
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [planForm, setPlanForm] = useState({
    classLevel: 'পঞ্চম শ্রেণি',
    subject: 'আমার বাংলা বই',
    chapter: '',
    lessonTitle: '',
    duration: '৪০ মিনিট',
    learningOutcomes: '',
    materials: 'পাঠ্যবই, চক, ডাস্টার, ছবি কার্ড',
    warmUp: 'শিক্ষার্থীদের সাথে কুশল বিনিময় ও পূর্বজ্ঞান যাচাই।',
    presentation: '',
    evaluation: '',
    homework: '',
  });

  // 2. Question Bank Form State
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [qForm, setQForm] = useState({
    classLevel: 'পঞ্চম শ্রেণি',
    subject: 'প্রাথমিক বিজ্ঞান',
    chapter: 'অধ্যায় ১',
    type: 'সংক্ষিপ্ত প্রশ্ন' as QuestionItem['type'],
    question: '',
    options: '',
    answer: '',
  });

  // 3. Book Notes Form State
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteForm, setNoteForm] = useState({
    classLevel: 'পঞ্চম শ্রেণি',
    subject: 'আমার বাংলা বই',
    kind: 'পাঠটীকা' as BookNoteItem['kind'],
    title: '',
    content: '',
  });

  // 4. Video Form State
  const [videoForm, setVideoForm] = useState({
    title: '',
    category: 'শ্রেণিভিত্তিক পাঠ ও ছড়া' as VideoItem['category'],
    classLevel: 'প্রথম শ্রেণি',
    duration: '০৮:৩০',
    youtubeUrl: '',
    description: '',
  });

  // 5. Portal Form State
  const [editingPortalIndex, setEditingPortalIndex] = useState<number | null>(null);
  const [portalForm, setPortalForm] = useState<PortalLinkItem>({
    name: '',
    badge: 'সরকারি পোর্টাল',
    description: '',
    url: '',
  });

  // 6. Quick Student Form State
  const [studentForm, setStudentForm] = useState({
    classLevel: 'পঞ্চম শ্রেণি',
    section: 'ক শাখা',
    roll: '',
    name: '',
    gender: 'ছাত্র' as 'ছাত্র' | 'ছাত্রী',
    fatherName: '',
    motherName: '',
    guardianPhone: '',
  });

  // 7. Forum Post Form State
  const [forumContent, setForumContent] = useState('');

  // --- Handlers ---
  const resetPlanForm = () => {
    setEditingPlanId(null);
    setPlanForm({
      classLevel: 'পঞ্চম শ্রেণি',
      subject: 'আমার বাংলা বই',
      chapter: '',
      lessonTitle: '',
      duration: '৪০ মিনিট',
      learningOutcomes: '',
      materials: 'পাঠ্যবই, চক, ডাস্টার, ছবি কার্ড',
      warmUp: 'শিক্ষার্থীদের সাথে কুশল বিনিময় ও পূর্বজ্ঞান যাচাই।',
      presentation: '',
      evaluation: '',
      homework: '',
    });
  };

  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!planForm.lessonTitle.trim()) return;
    const payload: LessonPlanItem = {
      id: editingPlanId || `lp-${Date.now()}`,
      classLevel: planForm.classLevel,
      subject: planForm.subject,
      chapter: planForm.chapter.trim() || 'নির্ধারিত অধ্যায়',
      lessonTitle: planForm.lessonTitle.trim(),
      duration: planForm.duration.trim() || '৪০ মিনিট',
      learningOutcomes: planForm.learningOutcomes
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      materials: planForm.materials
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      warmUp: planForm.warmUp.trim(),
      presentation: planForm.presentation
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      evaluation: planForm.evaluation
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      homework: planForm.homework.trim(),
    };

    if (editingPlanId) {
      setPlans((prev) => prev.map((p) => (p.id === editingPlanId ? payload : p)));
      onNotify('success', 'পাঠ পরিকল্পনাটি হালনাগাদ করা হয়েছে।');
    } else {
      setPlans((prev) => [payload, ...prev]);
      onNotify('success', 'নতুন পাঠ পরিকল্পনা যুক্ত করা হয়েছে।');
    }
    resetPlanForm();
  };

  const startEditPlan = (plan: LessonPlanItem) => {
    setEditingPlanId(plan.id);
    setPlanForm({
      classLevel: plan.classLevel,
      subject: plan.subject,
      chapter: plan.chapter,
      lessonTitle: plan.lessonTitle,
      duration: plan.duration,
      learningOutcomes: plan.learningOutcomes.join('\n'),
      materials: plan.materials.join(', '),
      warmUp: plan.warmUp,
      presentation: plan.presentation.join('\n'),
      evaluation: plan.evaluation.join('\n'),
      homework: plan.homework,
    });
  };

  const resetQForm = () => {
    setEditingQuestionId(null);
    setQForm({
      classLevel: 'পঞ্চম শ্রেণি',
      subject: 'প্রাথমিক বিজ্ঞান',
      chapter: 'অধ্যায় ১',
      type: 'সংক্ষিপ্ত প্রশ্ন',
      question: '',
      options: '',
      answer: '',
    });
  };

  const handleSaveQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qForm.question.trim() || !qForm.answer.trim()) return;
    const parsedOptions = qForm.options
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const payload: QuestionItem = {
      id: editingQuestionId || `q-${Date.now()}`,
      classLevel: qForm.classLevel,
      subject: qForm.subject,
      chapter: qForm.chapter.trim() || 'অধ্যায় ১',
      type: qForm.type,
      question: qForm.question.trim(),
      options: parsedOptions.length > 0 ? parsedOptions : undefined,
      answer: qForm.answer.trim(),
    };

    if (editingQuestionId) {
      setQuestions((prev) => prev.map((q) => (q.id === editingQuestionId ? payload : q)));
      onNotify('success', 'প্রশ্নটি সফলভাবে হালনাগাদ করা হয়েছে।');
    } else {
      setQuestions((prev) => [payload, ...prev]);
      onNotify('success', 'নতুন প্রশ্নটি প্রশ্ন উত্তর ও সাজেশন ব্যাংকে যুক্ত হয়েছে।');
    }
    resetQForm();
  };

  const startEditQuestion = (q: QuestionItem) => {
    setEditingQuestionId(q.id);
    setQForm({
      classLevel: q.classLevel,
      subject: q.subject,
      chapter: q.chapter,
      type: q.type,
      question: q.question,
      options: q.options ? q.options.join(', ') : '',
      answer: q.answer,
    });
  };

  const handleSaveBookNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteForm.title.trim() || !noteForm.content.trim()) return;
    const payload: BookNoteItem = {
      id: editingNoteId || `bn-${Date.now()}`,
      classLevel: noteForm.classLevel,
      subject: noteForm.subject,
      kind: noteForm.kind,
      title: noteForm.title.trim(),
      content: noteForm.content.trim(),
    };

    if (editingNoteId) {
      setBookNotes((prev) => prev.map((n) => (n.id === editingNoteId ? payload : n)));
      onNotify('success', 'পাঠটীকাটি হালনাগাদ করা হয়েছে।');
    } else {
      setBookNotes((prev) => [payload, ...prev]);
      onNotify('success', 'নতুন পাঠটীকা বই ও পাঠটীকা সেকশনে যুক্ত হয়েছে।');
    }
    setEditingNoteId(null);
    setNoteForm({
      classLevel: 'পঞ্চম শ্রেণি',
      subject: 'আমার বাংলা বই',
      kind: 'পাঠটীকা',
      title: '',
      content: '',
    });
  };

  const handleAddVideo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoForm.title.trim()) return;
    const item: VideoItem = {
      id: `vid-${Date.now()}`,
      title: videoForm.title.trim(),
      category: videoForm.category,
      classLevel: videoForm.classLevel,
      duration: videoForm.duration.trim() || '১০:০০',
      youtubeId: extractYoutubeId(videoForm.youtubeUrl),
      description: videoForm.description.trim() || 'ড্যাশবোর্ড থেকে যুক্ত শিক্ষামূলক ভিডিও।',
    };
    setVideos((prev) => [item, ...prev]);
    setVideoForm({
      title: '',
      category: 'শ্রেণিভিত্তিক পাঠ ও ছড়া',
      classLevel: 'প্রথম শ্রেণি',
      duration: '০৮:৩০',
      youtubeUrl: '',
      description: '',
    });
    onNotify('success', 'নতুন ভিডিও গ্যালারিতে যুক্ত হয়েছে।');
  };

  const handleSavePortal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!portalForm.name.trim() || !portalForm.url.trim()) return;
    const cleanUrl = /^https?:\/\//i.test(portalForm.url.trim())
      ? portalForm.url.trim()
      : `https://${portalForm.url.trim()}`;
    const payload: PortalLinkItem = {
      name: portalForm.name.trim(),
      badge: portalForm.badge.trim() || 'অফিসিয়াল পোর্টাল',
      description: portalForm.description.trim() || 'প্রাথমিক শিক্ষা সংশ্লিষ্ট গুরুত্বপূর্ণ পোর্টাল।',
      url: cleanUrl,
    };

    if (editingPortalIndex !== null) {
      setPortals((prev) => prev.map((p, i) => (i === editingPortalIndex ? payload : p)));
      onNotify('success', 'পোর্টালের তথ্য হালনাগাদ হয়েছে।');
    } else {
      setPortals((prev) => [payload, ...prev]);
      onNotify('success', 'নতুন পোর্টাল লিংক যুক্ত হয়েছে।');
    }
    setEditingPortalIndex(null);
    setPortalForm({ name: '', badge: 'সরকারি পোর্টাল', description: '', url: '' });
  };

  const handleQuickAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentForm.name.trim()) return;
    const item: Student = {
      id: `st-${Date.now()}`,
      classLevel: studentForm.classLevel,
      section: studentForm.section,
      roll: studentForm.roll.trim() || String(students.length + 1).padStart(2, '0'),
      name: studentForm.name.trim(),
      gender: studentForm.gender,
      fatherName: studentForm.fatherName.trim() || '-',
      motherName: studentForm.motherName.trim() || '-',
      dob: '-',
      guardianPhone: studentForm.guardianPhone.trim() || '-',
      village: '-',
    };
    setStudents((prev) => [item, ...prev]);
    setStudentForm({
      ...studentForm,
      roll: '',
      name: '',
      fatherName: '',
      motherName: '',
      guardianPhone: '',
    });
    onNotify('success', `${item.name}-কে ${item.classLevel} তালিকায় যুক্ত করা হয়েছে।`);
  };

  const handlePublishForumPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forumContent.trim()) return;
    const post: ForumPost = {
      id: `fp-${Date.now()}`,
      author: profile.name || 'প্রধান শিক্ষক / অ্যাডমিন',
      school: profile.school || 'সরকারি প্রাথমিক বিদ্যালয়',
      date: getFormattedBanglaDate(),
      content: forumContent.trim(),
      likes: 0,
      replies: [],
    };
    setForumPosts((prev) => [post, ...prev]);
    setForumContent('');
    onNotify('success', 'শিক্ষক ফোরামে নতুন পোস্ট প্রকাশিত হয়েছে।');
  };

  const SERVICE_TABS: {
    id: ServiceSection;
    label: string;
    count?: number;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: 'lesson_plan', label: 'পাঠ পরিকল্পনা', count: plans.length, icon: BookOpenCheck },
    { id: 'questions', label: 'প্রশ্ন ও সাজেশন', count: questions.length, icon: Lightbulb },
    { id: 'books', label: 'বই ও পাঠটীকা', count: bookNotes.length, icon: BookMarked },
    { id: 'videos', label: 'শিক্ষামূলক ভিডিও', count: videos.length, icon: Youtube },
    { id: 'portals', label: 'পোর্টাল ও লিংক', count: portals.length, icon: Compass },
    { id: 'students', label: 'শিক্ষার্থীর তথ্য', count: students.length, icon: Users },
    { id: 'forum', label: 'শিক্ষক ফোরাম', count: forumPosts.length, icon: MessagesSquare },
    { id: 'forms', label: 'আবেদন, মাসিক FLN ও সনদ', icon: ClipboardList },
  ];

  return (
    <div className="space-y-5">
      {/* Service Selector Strip */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3.5">
        <p className="text-xs font-semibold text-slate-500 mb-2.5 px-1">
          তথ্য যোগ বা পরিচালনার জন্য সেবা নির্বাচন করুন:
        </p>
        <div className="flex flex-wrap gap-2">
          {SERVICE_TABS.map((tab) => {
            const Icon = tab.icon;
            const active = section === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSection(tab.id)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`tabular-nums ${active ? 'text-blue-100' : 'text-slate-500'}`}>
                    ({toBanglaDigit(tab.count)})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 1. LESSON PLAN MANAGER */}
      {section === 'lesson_plan' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <form
            onSubmit={handleSavePlan}
            className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-5 space-y-3"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingPlanId ? 'পাঠ পরিকল্পনা সম্পাদনা' : 'নতুন পাঠ পরিকল্পনা যোগ করুন'}
              </h3>
              {editingPlanId && (
                <button
                  type="button"
                  onClick={resetPlanForm}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  বাতিল
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">শ্রেণি</label>
                <select
                  value={planForm.classLevel}
                  onChange={(e) => {
                    const cls = e.target.value;
                    setPlanForm({
                      ...planForm,
                      classLevel: cls,
                      subject: (SUBJECTS_BY_CLASS[cls] || [])[0] || '',
                    });
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs sm:text-sm"
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
                  value={planForm.subject}
                  onChange={(e) => setPlanForm({ ...planForm, subject: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs sm:text-sm"
                >
                  {(SUBJECTS_BY_CLASS[planForm.classLevel] || []).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  অধ্যায় / পাঠ শিরোনাম
                </label>
                <input
                  type="text"
                  required
                  value={planForm.lessonTitle}
                  onChange={(e) => setPlanForm({ ...planForm, lessonTitle: e.target.value })}
                  placeholder="যেমন: এই দেশ এই মানুষ"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">সময়</label>
                <input
                  type="text"
                  value={planForm.duration}
                  onChange={(e) => setPlanForm({ ...planForm, duration: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">অধ্যায়ের নাম</label>
              <input
                type="text"
                value={planForm.chapter}
                onChange={(e) => setPlanForm({ ...planForm, chapter: e.target.value })}
                placeholder="যেমন: অধ্যায় ১"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                শিখনফল (প্রতি লাইনে একটি)
              </label>
              <textarea
                rows={2}
                required
                value={planForm.learningOutcomes}
                onChange={(e) => setPlanForm({ ...planForm, learningOutcomes: e.target.value })}
                placeholder="১.১.১ পাঠের মূলভাব বলতে পারবে..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                পাঠ উপস্থাপন (প্রতি লাইনে একটি ধাপ)
              </label>
              <textarea
                rows={2}
                required
                value={planForm.presentation}
                onChange={(e) => setPlanForm({ ...planForm, presentation: e.target.value })}
                placeholder="আদর্শ পাঠ, সরব পাঠ ও দলীয় আলোচনা..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">মূল্যায়ন</label>
                <textarea
                  rows={2}
                  value={planForm.evaluation}
                  onChange={(e) => setPlanForm({ ...planForm, evaluation: e.target.value })}
                  placeholder="মৌখিক বা লিখিত প্রশ্ন..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">বাড়ির কাজ</label>
                <textarea
                  rows={2}
                  value={planForm.homework}
                  onChange={(e) => setPlanForm({ ...planForm, homework: e.target.value })}
                  placeholder="অনুশীলনীর কাজ..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs sm:text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-blue-700"
            >
              {editingPlanId ? <CheckCircle2 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              <span>{editingPlanId ? 'পরিবর্তন সংরক্ষণ করুন' : 'পাঠ পরিকল্পনা যুক্ত করুন'}</span>
            </button>
          </form>

          <div className="lg:col-span-7 space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                সংরক্ষিত পাঠ পরিকল্পনা ({toBanglaDigit(plans.length)})
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPlans(INITIAL_LESSON_PLANS);
                    onNotify('success', 'ডিফল্ট পাঠ পরিকল্পনা রিস্টোর করা হয়েছে।');
                  }}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>ডিফল্ট রিস্টোর</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('lesson_plan')}
                  className="inline-flex items-center gap-1 rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                >
                  <span>মডিউল খুলুন</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {plans.map((p) => (
              <div
                key={p.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 flex items-start justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-blue-700">
                    {p.classLevel} · {p.subject} · {p.duration}
                  </p>
                  <h4 className="text-sm font-bold text-slate-900 mt-0.5 truncate">
                    {p.lessonTitle}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">{p.chapter}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => startEditPlan(p)}
                    aria-label="সম্পাদনা"
                    className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-700"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPlans((prev) => prev.filter((item) => item.id !== p.id));
                      onNotify('success', 'পাঠ পরিকল্পনাটি মুছে ফেলা হয়েছে।');
                    }}
                    aria-label="মুছে ফেলুন"
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. QUESTIONS & SUGGESTIONS BANK MANAGER */}
      {section === 'questions' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <form
            onSubmit={handleSaveQuestion}
            className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-5 space-y-3"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingQuestionId ? 'প্রশ্ন সম্পাদনা করুন' : 'নতুন প্রশ্ন ও উত্তর যুক্ত করুন'}
              </h3>
              {editingQuestionId && (
                <button
                  type="button"
                  onClick={resetQForm}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  বাতিল
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">শ্রেণি</label>
                <select
                  value={qForm.classLevel}
                  onChange={(e) => {
                    const cls = e.target.value;
                    setQForm({
                      ...qForm,
                      classLevel: cls,
                      subject: (SUBJECTS_BY_CLASS[cls] || [])[0] || '',
                    });
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs sm:text-sm"
                >
                  {CLASS_LEVELS.slice(1).map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">বিষয়</label>
                <select
                  value={qForm.subject}
                  onChange={(e) => setQForm({ ...qForm, subject: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs sm:text-sm"
                >
                  {(SUBJECTS_BY_CLASS[qForm.classLevel] || []).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">অধ্যায়</label>
                <input
                  type="text"
                  value={qForm.chapter}
                  onChange={(e) => setQForm({ ...qForm, chapter: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ধরন</label>
                <select
                  value={qForm.type}
                  onChange={(e) =>
                    setQForm({ ...qForm, type: e.target.value as QuestionItem['type'] })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs sm:text-sm"
                >
                  <option value="শূন্যস্থান পূরণ">শূন্যস্থান পূরণ</option>
                  <option value="সঠিক উত্তর">সঠিক উত্তর</option>
                  <option value="সংক্ষিপ্ত প্রশ্ন">সংক্ষিপ্ত প্রশ্ন</option>
                  <option value="রচনামূলক প্রশ্ন">রচনামূলক প্রশ্ন</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">প্রশ্ন</label>
              <textarea
                rows={2}
                required
                value={qForm.question}
                onChange={(e) => setQForm({ ...qForm, question: e.target.value })}
                placeholder="প্রশ্নটি লিখুন..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                বহুনির্বাচনি অপশন (ঐচ্ছিক, কমা দিয়ে আলাদা করুন)
              </label>
              <input
                type="text"
                value={qForm.options}
                onChange={(e) => setQForm({ ...qForm, options: e.target.value })}
                placeholder="ক) সূর্য, খ) চাঁদ, গ) পানি, ঘ) বায়ু"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">সঠিক উত্তর</label>
              <textarea
                rows={2}
                required
                value={qForm.answer}
                onChange={(e) => setQForm({ ...qForm, answer: e.target.value })}
                placeholder="সঠিক উত্তর লিখুন..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
              />
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-blue-700"
            >
              {editingQuestionId ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              <span>{editingQuestionId ? 'প্রশ্ন হালনাগাদ করুন' : 'প্রশ্ন ব্যাংকে যোগ করুন'}</span>
            </button>
          </form>

          <div className="lg:col-span-7 space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                প্রশ্ন ও সাজেশন ব্যাংক ({toBanglaDigit(questions.length)})
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setQuestions(INITIAL_QUESTIONS);
                    onNotify('success', 'ডিফল্ট প্রশ্ন ব্যাংক রিস্টোর করা হয়েছে।');
                  }}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>ডিফল্ট রিস্টোর</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('questions')}
                  className="inline-flex items-center gap-1 rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                >
                  <span>প্রশ্ন উত্তর</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('suggestions')}
                  className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                >
                  <span>প্রশ্নপত্র মেকার</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {questions.map((q) => (
              <div
                key={q.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 flex items-start justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-blue-700">
                    {q.classLevel} · {q.subject} · {q.type}
                  </p>
                  <h4 className="text-sm font-bold text-slate-900 mt-0.5">{q.question}</h4>
                  <p className="text-xs text-emerald-700 mt-1">উত্তর: {q.answer}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => startEditQuestion(q)}
                    aria-label="সম্পাদনা"
                    className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-700"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setQuestions((prev) => prev.filter((item) => item.id !== q.id));
                      onNotify('success', 'প্রশ্নটি মুছে ফেলা হয়েছে।');
                    }}
                    aria-label="মুছে ফেলুন"
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. BOOKS & NOTES MANAGER */}
      {section === 'books' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <form
            onSubmit={handleSaveBookNote}
            className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-5 space-y-3"
          >
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              {editingNoteId ? 'পাঠটীকা সম্পাদনা করুন' : 'নতুন পাঠটীকা বা সিলেবাস নোট যোগ করুন'}
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">শ্রেণি</label>
                <select
                  value={noteForm.classLevel}
                  onChange={(e) => {
                    const cls = e.target.value;
                    setNoteForm({
                      ...noteForm,
                      classLevel: cls,
                      subject: (SUBJECTS_BY_CLASS[cls] || [])[0] || '',
                    });
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs sm:text-sm"
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
                  value={noteForm.subject}
                  onChange={(e) => setNoteForm({ ...noteForm, subject: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs sm:text-sm"
                >
                  {(SUBJECTS_BY_CLASS[noteForm.classLevel] || []).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">বিভাগ</label>
              <select
                value={noteForm.kind}
                onChange={(e) =>
                  setNoteForm({ ...noteForm, kind: e.target.value as BookNoteItem['kind'] })
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
              >
                <option value="পাঠটীকা">পাঠটীকা</option>
                <option value="পাঠ্যসূচি">পাঠ্যসূচি</option>
                <option value="বার্ষিক পরিকল্পনা">বার্ষিক পরিকল্পনা</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">শিরোনাম</label>
              <input
                type="text"
                required
                value={noteForm.title}
                onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
                placeholder="যেমন: ১ম প্রান্তিক বিশেষ নির্দেশনা"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">বিস্তারিত নোট</label>
              <textarea
                rows={4}
                required
                value={noteForm.content}
                onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
                placeholder="পাঠটীকা বা নির্দেশিকার বিবরণ লিখুন..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
              />
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              <span>{editingNoteId ? 'নোট আপডেট করুন' : 'পাঠটীকা সংরক্ষণ করুন'}</span>
            </button>
          </form>

          <div className="lg:col-span-7 space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 flex items-center justify-between gap-2">
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                যুক্তকৃত পাঠটীকা ({toBanglaDigit(bookNotes.length)})
              </h3>
              <button
                type="button"
                onClick={() => onNavigate('books')}
                className="inline-flex items-center gap-1 rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
              >
                <span>বই ও পাঠটীকা খুলুন</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            </div>

            {bookNotes.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                এখনো কোনো কাস্টম পাঠটীকা যোগ করা হয়নি। বাম পাশের ফর্ম ব্যবহার করে যোগ করুন।
              </div>
            ) : (
              bookNotes.map((note) => (
                <div
                  key={note.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 flex items-start justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-blue-700">
                      {note.classLevel} · {note.subject} · {note.kind}
                    </p>
                    <h4 className="text-sm font-bold text-slate-900 mt-0.5">{note.title}</h4>
                    <p className="text-xs text-slate-600 mt-1">{note.content}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingNoteId(note.id);
                        setNoteForm({
                          classLevel: note.classLevel,
                          subject: note.subject,
                          kind: note.kind,
                          title: note.title,
                          content: note.content,
                        });
                      }}
                      className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-700"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setBookNotes((prev) => prev.filter((n) => n.id !== note.id));
                        onNotify('success', 'পাঠটীকাটি মুছে ফেলা হয়েছে।');
                      }}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 4. VIDEOS MANAGER */}
      {section === 'videos' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <form
            onSubmit={handleAddVideo}
            className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-5 space-y-3"
          >
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              নতুন শিক্ষামূলক ভিডিও যুক্ত করুন
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">ভিডিও শিরোনাম</label>
              <input
                type="text"
                required
                value={videoForm.title}
                onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })}
                placeholder="যেমন: স্বরবর্ণ ও ব্যঞ্জনবর্ণ শুদ্ধ উচ্চারণ"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">বিভাগ</label>
                <select
                  value={videoForm.category}
                  onChange={(e) =>
                    setVideoForm({
                      ...videoForm,
                      category: e.target.value as VideoItem['category'],
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs sm:text-sm"
                >
                  <option value="শ্রেণিভিত্তিক পাঠ ও ছড়া">শ্রেণিভিত্তিক পাঠ ও ছড়া</option>
                  <option value="শিক্ষক প্রশিক্ষণ ও আইসিটি">শিক্ষক প্রশিক্ষণ ও আইসিটি</option>
                  <option value="কাব স্কাউট ও সমাবেশ">কাব স্কাউট ও সমাবেশ</option>
                  <option value="শিক্ষামূলক বিনোদন">শিক্ষামূলক বিনোদন</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">শ্রেণি</label>
                <select
                  value={videoForm.classLevel}
                  onChange={(e) => setVideoForm({ ...videoForm, classLevel: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs sm:text-sm"
                >
                  {CLASS_LEVELS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                  <option value="শিক্ষক">শিক্ষক</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  YouTube লিংক বা আইডি
                </label>
                <input
                  type="text"
                  required
                  value={videoForm.youtubeUrl}
                  onChange={(e) => setVideoForm({ ...videoForm, youtubeUrl: e.target.value })}
                  placeholder="https://youtu.be/..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">সময়কাল</label>
                <input
                  type="text"
                  value={videoForm.duration}
                  onChange={(e) => setVideoForm({ ...videoForm, duration: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">বিবরণ</label>
              <textarea
                rows={2}
                value={videoForm.description}
                onChange={(e) => setVideoForm({ ...videoForm, description: e.target.value })}
                placeholder="সংক্ষিপ্ত বিবরণ..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
              />
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              <span>ভিডিও গ্যালারিতে যোগ করুন</span>
            </button>
          </form>

          <div className="lg:col-span-7 space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                ভিডিও তালিকা ({toBanglaDigit(videos.length)})
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setVideos(INITIAL_VIDEOS);
                    onNotify('success', 'ডিফল্ট ভিডিও তালিকা রিস্টোর করা হয়েছে।');
                  }}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>ডিফল্ট রিস্টোর</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('videos')}
                  className="inline-flex items-center gap-1 rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                >
                  <span>ভিডিও গ্যালারি</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {videos.map((v) => (
              <div
                key={v.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 flex items-start justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-red-700">
                    {v.category} · {v.classLevel} · {v.duration}
                  </p>
                  <h4 className="text-sm font-bold text-slate-900 mt-0.5">{v.title}</h4>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{v.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setVideos((prev) => prev.filter((item) => item.id !== v.id));
                    onNotify('success', 'ভিডিওটি তালিকা থেকে মুছে ফেলা হয়েছে।');
                  }}
                  aria-label="মুছে ফেলুন"
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. PORTALS MANAGER */}
      {section === 'portals' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <form
            onSubmit={handleSavePortal}
            className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-5 space-y-3"
          >
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              {editingPortalIndex !== null ? 'পোর্টাল সম্পাদনা করুন' : 'নতুন পোর্টাল লিংক যোগ করুন'}
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">পোর্টালের নাম</label>
              <input
                type="text"
                required
                value={portalForm.name}
                onChange={(e) => setPortalForm({ ...portalForm, name: e.target.value })}
                placeholder="যেমন: প্রাথমিক শিক্ষা অধিদপ্তর (DPE)"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">বিভাগ / ব্যাজ</label>
              <input
                type="text"
                value={portalForm.badge}
                onChange={(e) => setPortalForm({ ...portalForm, badge: e.target.value })}
                placeholder="অফিসিয়াল / উপবৃত্তি / প্রশিক্ষণ"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">ওয়েবসাইট লিংক (URL)</label>
              <input
                type="text"
                required
                value={portalForm.url}
                onChange={(e) => setPortalForm({ ...portalForm, url: e.target.value })}
                placeholder="https://www.dpe.gov.bd"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">সংক্ষিপ্ত বিবরণ</label>
              <textarea
                rows={2}
                value={portalForm.description}
                onChange={(e) => setPortalForm({ ...portalForm, description: e.target.value })}
                placeholder="এই পোর্টাল থেকে কী কাজ করা যায়..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
              />
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              <span>{editingPortalIndex !== null ? 'পোর্টাল আপডেট করুন' : 'পোর্টাল যুক্ত করুন'}</span>
            </button>
          </form>

          <div className="lg:col-span-7 space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                যুক্তকৃত পোর্টালসমূহ ({toBanglaDigit(portals.length)})
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPortals(OFFICIAL_PORTALS);
                    onNotify('success', 'ডিফল্ট সরকারি পোর্টাল তালিকা রিস্টোর হয়েছে।');
                  }}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>ডিফল্ট রিস্টোর</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('portals')}
                  className="inline-flex items-center gap-1 rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                >
                  <span>পোর্টাল পেজ</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {portals.map((portal, index) => (
              <div
                key={`${portal.name}-${index}`}
                className="rounded-2xl border border-slate-200 bg-white p-4 flex items-start justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-blue-700">{portal.badge}</p>
                  <h4 className="text-sm font-bold text-slate-900 mt-0.5">{portal.name}</h4>
                  <p className="text-xs text-slate-500 font-mono truncate mt-0.5">{portal.url}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPortalIndex(index);
                      setPortalForm(portal);
                    }}
                    className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-700"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPortals((prev) => prev.filter((_, i) => i !== index));
                      onNotify('success', 'পোর্টাল লিংকটি মুছে ফেলা হয়েছে।');
                    }}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. STUDENTS QUICK ADMISSION & LIST */}
      {section === 'students' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <form
            onSubmit={handleQuickAddStudent}
            className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-5 space-y-3"
          >
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              দ্রুত নতুন শিক্ষার্থী ভর্তি
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">শ্রেণি</label>
                <select
                  value={studentForm.classLevel}
                  onChange={(e) => setStudentForm({ ...studentForm, classLevel: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs sm:text-sm"
                >
                  {CLASS_LEVELS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">শাখা</label>
                <select
                  value={studentForm.section}
                  onChange={(e) => setStudentForm({ ...studentForm, section: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs sm:text-sm"
                >
                  <option value="প্রযোজ্য নয়">প্রযোজ্য নয়</option>
                  <option value="ক শাখা">ক শাখা</option>
                  <option value="খ শাখা">খ শাখা</option>
                  <option value="গ শাখা">গ শাখা</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  শিক্ষার্থীর নাম
                </label>
                <input
                  type="text"
                  required
                  value={studentForm.name}
                  onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                  placeholder="শিক্ষার্থীর পূর্ণ নাম"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">রোল</label>
                <input
                  type="text"
                  value={studentForm.roll}
                  onChange={(e) => setStudentForm({ ...studentForm, roll: e.target.value })}
                  placeholder="০১"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">পিতার নাম</label>
                <input
                  type="text"
                  value={studentForm.fatherName}
                  onChange={(e) => setStudentForm({ ...studentForm, fatherName: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">মাতার নাম</label>
                <input
                  type="text"
                  value={studentForm.motherName}
                  onChange={(e) => setStudentForm({ ...studentForm, motherName: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">লিঙ্গ</label>
                <select
                  value={studentForm.gender}
                  onChange={(e) =>
                    setStudentForm({ ...studentForm, gender: e.target.value as 'ছাত্র' | 'ছাত্রী' })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                >
                  <option value="ছাত্র">ছাত্র</option>
                  <option value="ছাত্রী">ছাত্রী</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">মোবাইল</label>
                <input
                  type="tel"
                  value={studentForm.guardianPhone}
                  onChange={(e) =>
                    setStudentForm({ ...studentForm, guardianPhone: e.target.value })
                  }
                  placeholder="017xxxxxxxx"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4" />
              <span>শিক্ষার্থী যুক্ত করুন</span>
            </button>
          </form>

          <div className="lg:col-span-7 space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                নিবন্ধিত শিক্ষার্থী ({toBanglaDigit(students.length)} জন)
              </h3>
              <button
                type="button"
                onClick={() => onNavigate('students')}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
              >
                <span>Excel সেভ / আপলোড ও পূর্ণ রেজিস্টার</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            </div>

            {students.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                এখনো কোনো শিক্ষার্থী নিবন্ধিত নেই। বাম পাশ থেকে ভর্তি করুন অথবা পূর্ণ রেজিস্টারে Excel আপলোড করুন।
              </div>
            ) : (
              students.slice(0, 12).map((s) => (
                <div
                  key={s.id}
                  className="rounded-2xl border border-slate-200 bg-white p-3.5 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-teal-700">
                      {s.classLevel} · রোল {toBanglaDigit(s.roll)} · {s.gender}
                    </p>
                    <h4 className="text-sm font-bold text-slate-900 truncate">{s.name}</h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setStudents((prev) => prev.filter((item) => item.id !== s.id));
                      onNotify('success', 'শিক্ষার্থীর তথ্য তালিকা থেকে মুছে ফেলা হয়েছে।');
                    }}
                    aria-label="মুছে ফেলুন"
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 7. FORUM MODERATION */}
      {section === 'forum' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <form
            onSubmit={handlePublishForumPost}
            className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-5 space-y-3"
          >
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              ফোরামে নতুন ঘোষণা বা পোস্ট লিখুন
            </h3>
            <textarea
              rows={4}
              required
              value={forumContent}
              onChange={(e) => setForumContent(e.target.value)}
              placeholder="শিক্ষকদের উদ্দেশ্যে কোনো মতামত, পরামর্শ বা অভিজ্ঞতা লিখুন..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
            />
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              <span>ফোরামে প্রকাশ করুন</span>
            </button>
          </form>

          <div className="lg:col-span-7 space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 flex items-center justify-between gap-2">
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                ফোরাম পোস্ট পরিচালনা ({toBanglaDigit(forumPosts.length)})
              </h3>
              <button
                type="button"
                onClick={() => onNavigate('forum')}
                className="inline-flex items-center gap-1 rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
              >
                <span>শিক্ষক ফোরাম দেখুন</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            </div>

            {forumPosts.map((post) => (
              <div
                key={post.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 flex items-start justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-sky-700">
                    {post.author} · {post.date}
                  </p>
                  <p className="text-sm text-slate-700 mt-1">{post.content}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setForumPosts((prev) => prev.filter((item) => item.id !== post.id));
                    onNotify('success', 'ফোরাম পোস্টটি মুছে ফেলা হয়েছে।');
                  }}
                  aria-label="পোস্ট মুছুন"
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8. FORMS, MONTHLY FLN, EVALUATION & CERTIFICATES QUICK LAUNCH */}
      {section === 'forms' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            {
              route: 'applications' as RouteKey,
              title: 'আবেদন সমূহ',
              desc: 'নৈমিত্তিক ছুটি, হোম ভিজিট, বদলি ও প্রত্যয়ন আবেদন তাৎক্ষণিক পূরণ ও A4 প্রিন্ট করুন।',
              icon: FileSignature,
              btnLabel: 'আবেদন তৈরি করুন',
            },
            {
              route: 'monthly_fln' as RouteKey,
              title: 'মাসিক FLN যাচাই (১২ মাস)',
              desc: '৩য়–৫ম শ্রেণিসহ সকল শ্রেণির প্রান্তিক যোগ্যতাভিত্তিক ১২ মাসের FLN মূল্যায়ন ও A4 প্রতিবেদন।',
              icon: ClipboardList,
              btnLabel: 'FLN যাচাই খুলুন',
            },
            {
              route: 'evaluation' as RouteKey,
              title: 'মূল্যায়ন রেকর্ড',
              desc: 'শিক্ষার্থীদের বিষয়ভিত্তিক নম্বর এন্ট্রি, গ্রেড ও প্রান্তিক মার্কশিট তৈরি ও প্রিন্ট করুন।',
              icon: ClipboardCheck,
              btnLabel: 'নম্বর এন্ট্রি ও মার্কশিট',
            },
            {
              route: 'certificates' as RouteKey,
              title: 'সনদ ও প্রত্যয়ন (TC)',
              desc: 'প্রশংসাপত্র, ছাড়পত্র ও অধ্যয়নরত সনদ Print-ready (A4) এবং PDF আকারে ডাউনলোড করুন।',
              icon: Award,
              btnLabel: 'সনদপত্র তৈরি করুন',
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.route}
                className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate(item.route)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
                >
                  <span>{item.btnLabel}</span>
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
