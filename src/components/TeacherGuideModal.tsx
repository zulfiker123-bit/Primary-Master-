import React, { useEffect, useMemo } from 'react';
import {
  ArrowUpRight,
  BookMarked,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  ExternalLink,
  GraduationCap,
  Home,
  Layers,
  Lightbulb,
  X,
} from 'lucide-react';
import { toBanglaDigit } from '../utils/bangla';
import {
  LessonTeacherGuideInput,
  resolveLessonTeacherGuide,
} from '../utils/teacherGuideLookup';

interface TeacherGuideModalProps {
  lesson: LessonTeacherGuideInput | null;
  onClose: () => void;
  onOpenInLessonPlan?: (lesson: LessonTeacherGuideInput) => void;
}

export const TeacherGuideModal: React.FC<TeacherGuideModalProps> = ({
  lesson,
  onClose,
  onOpenInLessonPlan,
}) => {
  const guide = useMemo(
    () => (lesson ? resolveLessonTeacherGuide(lesson) : null),
    [lesson]
  );

  useEffect(() => {
    if (!lesson) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lesson, onClose]);

  if (!lesson || !guide) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tg-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-3xl max-h-[92vh] rounded-3xl bg-white shadow-2xl border border-stone-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-[#102A23] text-white px-5 py-4 sm:px-6 sm:py-5 flex items-start justify-between gap-4 shrink-0">
          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-medium text-emerald-200">
              <span className="inline-flex items-center gap-1 font-semibold text-amber-300">
                <GraduationCap className="h-3.5 w-3.5" aria-hidden="true" />
                পাঠদান পদ্ধতি ও শিক্ষক সহায়িকা (TG)
              </span>
              {lesson.dateBn && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>
                    {lesson.dateBn}
                    {lesson.weekdayBn ? ` (${lesson.weekdayBn})` : ''}
                  </span>
                </>
              )}
              {lesson.sessionLabel && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">{lesson.sessionLabel}</span>
                </>
              )}
            </div>

            <h2
              id="tg-modal-title"
              className="text-base sm:text-xl font-bold text-white leading-snug"
            >
              {lesson.classLevel} · {lesson.subject}
            </h2>

            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
              <span className="font-semibold text-white">
                {lesson.chapterTitle || lesson.subject}:
              </span>{' '}
              {lesson.topicDetail}
            </p>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-[11px] text-emerald-200/85 tabular-nums">
              <span className="inline-flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                পৃষ্ঠা: {lesson.pageNumber || 'নির্ধারিত'}
              </span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                সময়: {toBanglaDigit(lesson.durationMinutes || 40)} মিনিট
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {guide.partLabel} ({guide.termWindow})
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="বন্ধ করুন"
            className="rounded-xl bg-white/10 p-2 text-emerald-100 hover:bg-white/20 hover:text-white transition-colors shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6 space-y-5 text-slate-800">
          {/* Official TG Banner */}
          <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/60 p-4 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
              <BookMarked className="h-4 w-4 text-emerald-700 shrink-0" aria-hidden="true" />
              <span>{guide.title}</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">{guide.bookSummary}</p>
            <p className="text-[11px] text-emerald-800/90 font-medium">{guide.editionNote}</p>
          </div>

          {/* 1. Learning Outcomes */}
          <section className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" aria-hidden="true" />
              <span>১. শিখনফল (পাঠ শেষে শিক্ষার্থীরা যা অর্জন করবে)</span>
            </h3>
            <ul className="space-y-1.5 pl-5 list-disc text-xs sm:text-sm text-slate-700 leading-relaxed">
              {guide.learningOutcomes.map((outcome, idx) => (
                <li key={idx}>{outcome}</li>
              ))}
            </ul>
          </section>

          {/* 2. Step-by-Step Classroom Teaching Method */}
          <section className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-1.5">
              <Layers className="h-4 w-4 text-blue-700 shrink-0" aria-hidden="true" />
              <span>২. শ্রেণিকক্ষে পাঠদান পদ্ধতি (ধাপে ধাপে পরিচালনা)</span>
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {guide.methodSteps.map((step, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 sm:p-4 space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs sm:text-sm font-bold text-slate-900">
                      <span className="text-emerald-800">{step.stepNumber}:</span> {step.title}
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-lg bg-white border border-slate-200 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 tabular-nums">
                      <Clock className="h-3 w-3 text-slate-500" aria-hidden="true" />
                      {step.duration}
                    </span>
                  </div>
                  <ul className="space-y-1 pl-4 list-disc text-xs sm:text-sm text-slate-700 leading-relaxed">
                    {step.methodDetails.map((detail, dIdx) => (
                      <li key={dIdx}>{detail}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* 3. Official NCTB Teacher's Guide Key Directions */}
          <section className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-1.5">
              <Lightbulb className="h-4 w-4 text-amber-600 shrink-0" aria-hidden="true" />
              <span>৩. NCTB শিক্ষক সহায়িকা (TG) মূল কৌশল ও নির্দেশনা</span>
            </h3>
            <ol className="space-y-2 pl-5 list-decimal text-xs sm:text-sm text-slate-700 leading-relaxed">
              {guide.nctbGuideSteps.map((tgStep, idx) => (
                <li key={idx}>{tgStep}</li>
              ))}
            </ol>
          </section>

          {/* 4. Teaching Materials & Assessment Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <section className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                ৪. প্রয়োজনীয় শিক্ষা উপকরণ
              </h3>
              <ul className="space-y-1 pl-4 list-disc text-xs text-slate-700 leading-relaxed">
                {guide.teachingMaterials.map((mat, idx) => (
                  <li key={idx}>{mat}</li>
                ))}
              </ul>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <ClipboardCheck className="h-4 w-4 text-emerald-700 shrink-0" aria-hidden="true" />
                <span>৫. মূল্যায়ন ও নিরাময়মূলক সহায়তা</span>
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                {guide.assessmentFocus}
              </p>
              <ul className="space-y-1 pl-4 list-disc text-[11px] text-slate-600 leading-relaxed pt-1 border-t border-slate-100">
                {guide.remedialTips.map((tip, idx) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ul>
            </section>
          </div>

          {/* 6. Homework */}
          <section className="rounded-2xl border border-blue-200/80 bg-blue-50/50 p-4 space-y-1">
            <h3 className="text-xs sm:text-sm font-bold text-blue-950 flex items-center gap-1.5">
              <Home className="h-4 w-4 text-blue-700 shrink-0" aria-hidden="true" />
              <span>৬. বাড়ির কাজ</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              {guide.homeworkSuggestion}
            </p>
          </section>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-200 bg-slate-50 px-5 py-3.5 sm:px-6 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <a
            href={guide.nctbPortalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />
            <span>NCTB মূল বই ও TG পোর্টাল</span>
          </a>

          <div className="flex flex-wrap items-center gap-2">
            {onOpenInLessonPlan && (
              <button
                type="button"
                onClick={() => onOpenInLessonPlan(lesson)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-900 hover:bg-emerald-100 transition-colors"
              >
                <span>বার্ষিক পাঠ সারণিতে দেখুন</span>
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-[#102A23] px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-900 transition-colors"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
