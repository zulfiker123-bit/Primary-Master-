import React, { useState } from 'react';
import { BellRing, Check, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import {
  ANNUAL_PLAN_CLASSES,
  ANNUAL_PLAN_SUBJECTS_BY_CLASS,
} from '../data/dateWiseAnnualPlans2026';
import { toBanglaDigit } from '../utils/bangla';
import {
  countSelectedReminderSubjects,
  LessonReminderPrefs,
  normalizeReminderPrefs,
} from '../utils/lessonReminders';

interface LessonReminderConfigPanelProps {
  prefs: LessonReminderPrefs;
  onChange: (next: LessonReminderPrefs) => void;
}

export const LessonReminderConfigPanel: React.FC<LessonReminderConfigPanelProps> = ({
  prefs,
  onChange,
}) => {
  const safePrefs = normalizeReminderPrefs(prefs);
  const totalSelected = countSelectedReminderSubjects(safePrefs);

  // Expand all classes that already have selections (plus Class 1 by default) so multi-class differences are immediately visible
  const [expandedClasses, setExpandedClasses] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    ANNUAL_PLAN_CLASSES.forEach((cls) => {
      initial[cls] = (safePrefs.selections[cls]?.length || 0) > 0 || cls === 'প্রথম শ্রেণি';
    });
    return initial;
  });

  const toggleClassExpand = (cls: string) => {
    setExpandedClasses((prev) => ({ ...prev, [cls]: !prev[cls] }));
  };

  const expandAllClasses = () => {
    const next: Record<string, boolean> = {};
    ANNUAL_PLAN_CLASSES.forEach((cls) => {
      next[cls] = true;
    });
    setExpandedClasses(next);
  };

  const toggleEnabled = () => {
    onChange({
      ...safePrefs,
      enabled: !safePrefs.enabled,
    });
  };

  const toggleSubject = (classLevel: string, subject: string) => {
    const current = safePrefs.selections[classLevel] || [];
    const exists = current.includes(subject);
    const updatedClassSubjects = exists
      ? current.filter((s) => s !== subject)
      : [...current, subject];

    const nextSelections = { ...safePrefs.selections };
    if (updatedClassSubjects.length > 0) {
      nextSelections[classLevel] = updatedClassSubjects;
    } else {
      delete nextSelections[classLevel];
    }

    onChange({
      ...safePrefs,
      enabled: true,
      selections: nextSelections,
    });
  };

  const selectAllForClass = (classLevel: string) => {
    const subjectsForClass = ANNUAL_PLAN_SUBJECTS_BY_CLASS[classLevel] || [];
    onChange({
      ...safePrefs,
      enabled: true,
      selections: {
        ...safePrefs.selections,
        [classLevel]: [...subjectsForClass],
      },
    });
    setExpandedClasses((prev) => ({ ...prev, [classLevel]: true }));
  };

  const clearClass = (classLevel: string) => {
    const nextSelections = { ...safePrefs.selections };
    delete nextSelections[classLevel];
    onChange({
      ...safePrefs,
      selections: nextSelections,
    });
  };

  const clearAllSelections = () => {
    onChange({
      ...safePrefs,
      selections: {},
    });
  };

  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 sm:p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-200/70 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 shrink-0">
            <BellRing className="h-4.5 w-4.5" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              শ্রেণিভিত্তিক নিজস্ব পাঠ রিমাইন্ডার নির্বাচন
            </h3>
            <p className="text-xs text-slate-600">
              প্রতিটি শ্রেণির জন্য আলাদা আলাদা বিষয় নির্বাচন করুন (যেমন: ১ম শ্রেণিতে বাংলা, ৩য় শ্রেণিতে গণিত, ৫ম শ্রেণিতে বিজ্ঞান)।
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={expandAllClasses}
            className="inline-flex h-9 items-center gap-1 rounded-xl border border-emerald-200 bg-white px-2.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-50 whitespace-nowrap"
          >
            সব শ্রেণি খুলুন
          </button>
          <button
            type="button"
            onClick={toggleEnabled}
            aria-pressed={safePrefs.enabled}
            className={`inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition-colors whitespace-nowrap ${
              safePrefs.enabled
                ? 'border-emerald-700 bg-[#0F2922] text-white'
                : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>{safePrefs.enabled ? 'রিমাইন্ডার চালু' : 'রিমাইন্ডার বন্ধ'}</span>
          </button>
          {totalSelected > 0 && (
            <button
              type="button"
              onClick={clearAllSelections}
              className="inline-flex h-9 items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 whitespace-nowrap"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>সব রিসেট</span>
            </button>
          )}
        </div>
      </div>

      {/* Per-Class Independent Subject Cards */}
      <div className="space-y-2.5">
        {ANNUAL_PLAN_CLASSES.map((cls) => {
          const subjectsForClass = ANNUAL_PLAN_SUBJECTS_BY_CLASS[cls] || [];
          const selectedForClass = safePrefs.selections[cls] || [];
          const isExpanded = Boolean(expandedClasses[cls]);

          return (
            <div
              key={cls}
              className={`rounded-xl border transition-colors ${
                selectedForClass.length > 0
                  ? 'border-emerald-300 bg-white'
                  : 'border-slate-200 bg-white/80'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5">
                <button
                  type="button"
                  onClick={() => toggleClassExpand(cls)}
                  aria-expanded={isExpanded}
                  className="flex items-center gap-2 text-left min-w-0 flex-1"
                >
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-slate-500 shrink-0" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-500 shrink-0" aria-hidden="true" />
                  )}
                  <span className="text-xs sm:text-sm font-bold text-slate-900">{cls}</span>
                  <span
                    className={`text-[11px] font-semibold tabular-nums ${
                      selectedForClass.length > 0 ? 'text-emerald-700' : 'text-slate-400'
                    }`}
                  >
                    ({toBanglaDigit(selectedForClass.length)}/{toBanglaDigit(subjectsForClass.length)}টি বিষয়)
                  </span>
                </button>

                <div className="flex items-center gap-2 shrink-0">
                  {selectedForClass.length < subjectsForClass.length && (
                    <button
                      type="button"
                      onClick={() => selectAllForClass(cls)}
                      className="text-[11px] font-semibold text-emerald-800 hover:underline whitespace-nowrap"
                    >
                      সবগুলো নিন
                    </button>
                  )}
                  {selectedForClass.length > 0 && (
                    <button
                      type="button"
                      onClick={() => clearClass(cls)}
                      className="text-[11px] font-semibold text-rose-700 hover:underline whitespace-nowrap"
                    >
                      বাদ দিন
                    </button>
                  )}
                </div>
              </div>

              {!isExpanded && selectedForClass.length > 0 && (
                <div className="px-3.5 pb-2.5 pt-0 text-[11px] text-slate-600">
                  নির্বাচিত: {selectedForClass.join(' · ')}
                </div>
              )}

              {isExpanded && (
                <div className="border-t border-slate-100 p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {subjectsForClass.map((sub) => {
                    const checked = selectedForClass.includes(sub);
                    return (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => toggleSubject(cls, sub)}
                        aria-pressed={checked}
                        className={`min-h-[38px] rounded-xl border px-3 py-1.5 text-left text-xs font-semibold transition-colors flex items-center justify-between gap-2 ${
                          checked
                            ? 'border-emerald-700 bg-emerald-50/70 text-emerald-950'
                            : 'border-slate-200 bg-slate-50/60 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span className="truncate">{sub}</span>
                        <span
                          className={`flex h-4.5 w-4.5 items-center justify-center rounded border shrink-0 ${
                            checked
                              ? 'border-emerald-700 bg-emerald-700 text-white'
                              : 'border-slate-300 bg-white text-transparent'
                          }`}
                        >
                          <Check className="h-3 w-3" aria-hidden="true" />
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected Overview */}
      <div className="pt-2 border-t border-emerald-200/70 text-xs text-slate-700">
        {totalSelected === 0 ? (
          <p className="text-amber-800 font-medium">
            এখনো কোনো শ্রেণি বা বিষয় নির্বাচন করা হয়নি। রিমাইন্ডার পেতে উপরের যেকোনো শ্রেণি খুলে আপনার বিষয়গুলো টিক দিন।
          </p>
        ) : (
          <div className="space-y-1">
            <p className="font-bold text-slate-800 tabular-nums">
              সক্রিয় শ্রেণি ও বিষয় রিমাইন্ডার ({toBanglaDigit(totalSelected)}টি বিষয়):
            </p>
            <div className="space-y-1 text-[11px] text-slate-600">
              {ANNUAL_PLAN_CLASSES.map((cls) => {
                const list = safePrefs.selections[cls];
                if (!list || list.length === 0) return null;
                return (
                  <div key={cls}>
                    <strong className="text-slate-900">{cls}:</strong> {list.join(', ')}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
