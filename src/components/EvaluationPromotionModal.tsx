import React, { useState } from 'react';
import { AlertTriangle, ArrowUpCircle, CheckCircle2, X } from 'lucide-react';
import { CLASS_LEVELS } from '../data/curriculum';
import { EvaluationRecord } from '../types';
import { toBanglaDigit } from '../utils/bangla';

export interface StudentPromotionCandidate {
  recordId: string;
  studentName: string;
  roll: string;
  classLevel: string;
  grandTotal: number;
  maxTotal: number;
  percentage: number;
  failedSubjects: { name: string; obtained: number; fullMarks: number; passMarks: number }[];
  attendancePct: number | null;
  currentStatus?: EvaluationRecord['promotionStatus'];
}

interface EvaluationPromotionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedClass: string;
  candidates: StudentPromotionCandidate[];
  mode: 'single' | 'bulk';
  onConfirmPromote: (params: {
    recordIds: string[];
    targetClass: string;
    promotionType: 'promoted' | 'conditional_promoted' | 'retained';
    syncStudentList: boolean;
    note: string;
  }) => void;
}

export function getNextClassLabel(currentClass: string): string {
  const idx = CLASS_LEVELS.indexOf(currentClass);
  if (idx === -1) return 'পরবর্তী শ্রেণি';
  if (idx >= CLASS_LEVELS.length - 1) return 'ষষ্ঠ শ্রেণি (উত্তীর্ণ / সমাপ্ত)';
  return CLASS_LEVELS[idx + 1];
}

export const EvaluationPromotionModal: React.FC<EvaluationPromotionModalProps> = ({
  isOpen,
  onClose,
  selectedClass,
  candidates,
  mode,
  onConfirmPromote,
}) => {
  const defaultNextClass = getNextClassLabel(selectedClass);
  const isClassFive = selectedClass === 'পঞ্চম শ্রেণি';

  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    candidates.map((c) => c.recordId)
  );
  const [targetClass, setTargetClass] = useState<string>(defaultNextClass);
  const [includeFailedStudents, setIncludeFailedStudents] = useState<boolean>(true);
  const [promotionType, setPromotionType] = useState<
    'promoted' | 'conditional_promoted' | 'retained'
  >(() => {
    const anyFailed = candidates.some((c) => c.failedSubjects.length > 0);
    return anyFailed ? 'conditional_promoted' : 'promoted';
  });
  const [syncStudentList, setSyncStudentList] = useState<boolean>(!isClassFive);
  const [note, setNote] = useState<string>(() => {
    const anyFailed = candidates.some((c) => c.failedSubjects.length > 0);
    return anyFailed
      ? 'ফেলকৃত বিষয়ে নিরাময়মূলক সহায়তা সাপেক্ষে পরবর্তী শ্রেণিতে শর্তসাপেক্ষে প্রমোট করা হলো।'
      : 'সকল বিষয়ে উত্তীর্ণ হওয়ায় পরবর্তী শ্রেণিতে প্রমোট করা হলো।';
  });

  if (!isOpen || candidates.length === 0) return null;

  const hasAnyFailed = candidates.some((c) => c.failedSubjects.length > 0);

  const visibleCandidates =
    mode === 'bulk' && !includeFailedStudents
      ? candidates.filter((c) => c.failedSubjects.length === 0)
      : candidates;

  const activeIds =
    mode === 'single'
      ? [candidates[0].recordId]
      : visibleCandidates
          .filter((c) => selectedIds.includes(c.recordId))
          .map((c) => c.recordId);

  const toggleId = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeIds.length === 0) return;
    onConfirmPromote({
      recordIds: activeIds,
      targetClass: promotionType === 'retained' ? selectedClass : targetClass,
      promotionType,
      syncStudentList: promotionType !== 'retained' && syncStudentList,
      note: note.trim(),
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      <form
        onSubmit={handleConfirm}
        className="w-full max-w-2xl rounded-2xl bg-white p-5 sm:p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto space-y-4"
      >
        <div className="flex items-start justify-between gap-2 border-b border-slate-200 pb-3">
          <div>
            <p className="text-xs font-semibold text-emerald-800">
              শ্রেণি প্রমোশন ব্যবস্থাপনা · {selectedClass}
            </p>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5 flex items-center gap-2">
              <ArrowUpCircle className="h-5 w-5 text-emerald-700" />
              <span>
                {mode === 'single'
                  ? `${candidates[0].studentName} — পরবর্তী শ্রেণিতে প্রমোট`
                  : `শিক্ষার্থী শ্রেণি প্রমোশন (ফেলকৃত বিষয়সহ প্রমোটের অপশন)`}
              </span>
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="বন্ধ করুন"
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Failed subjects alert if applicable */}
        {hasAnyFailed ? (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0" />
              <span>ফেলকৃত বিষয় শনাক্ত হয়েছে — তবে শর্তসাপেক্ষে বা বিশেষ বিবেচনায় প্রমোট করার অপশন সক্রিয় আছে</span>
            </p>
            {mode === 'single' && candidates[0].failedSubjects.length > 0 && (
              <p className="text-[11px] text-amber-900">
                ফেলকৃত বিষয়:{' '}
                {candidates[0].failedSubjects
                  .map(
                    (f) =>
                      `${f.name} (${toBanglaDigit(f.obtained)}/${toBanglaDigit(f.fullMarks)}, পাস ${toBanglaDigit(f.passMarks)})`
                  )
                  .join(' · ')}
              </p>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-950 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" />
            <span>নির্বাচিত শিক্ষার্থী সকল বিষয়ে পাস মান অর্জন করেছে।</span>
          </div>
        )}

        {/* Bulk candidate selector */}
        {mode === 'bulk' && (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <label className="inline-flex items-center gap-2 font-semibold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeFailedStudents}
                  onChange={(e) => setIncludeFailedStudents(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-800 focus:ring-emerald-700"
                />
                <span>ফেলকৃত বিষয় থাকা শিক্ষার্থীদেরও প্রমোশন তালিকায় রাখুন</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedIds(visibleCandidates.map((c) => c.recordId))}
                  className="text-emerald-800 font-semibold hover:underline"
                >
                  সব নির্বাচন
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() => setSelectedIds([])}
                  className="text-slate-600 font-semibold hover:underline"
                >
                  বাতিল
                </button>
              </div>
            </div>

            <div className="max-h-52 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100">
              {visibleCandidates.map((c) => {
                const checked = selectedIds.includes(c.recordId);
                return (
                  <label
                    key={c.recordId}
                    className="flex items-center justify-between gap-2 px-3 py-2 text-xs hover:bg-slate-50 cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleId(c.recordId)}
                        className="rounded border-slate-300 text-emerald-800 focus:ring-emerald-700"
                      />
                      <span className="font-bold text-slate-700 tabular-nums">
                        রোল {toBanglaDigit(c.roll)}
                      </span>
                      <span className="font-semibold text-slate-900 truncate">
                        {c.studentName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 tabular-nums">
                      <span className="text-slate-600">
                        {toBanglaDigit(c.grandTotal)}/{toBanglaDigit(c.maxTotal)}
                      </span>
                      {c.failedSubjects.length > 0 ? (
                        <span className="rounded-md bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800">
                          {toBanglaDigit(c.failedSubjects.length)} বিষয়ে ফেল
                        </span>
                      ) : (
                        <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                          উত্তীর্ণ
                        </span>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Promotion Decision Settings */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">প্রমোশন ধরন</label>
            <select
              value={promotionType}
              onChange={(e) =>
                setPromotionType(
                  e.target.value as 'promoted' | 'conditional_promoted' | 'retained'
                )
              }
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs sm:text-sm"
            >
              <option value="promoted">নিয়মিত উত্তীর্ণ ও প্রমোট (Promoted)</option>
              <option value="conditional_promoted">
                ফেলকৃত বিষয়সহ শর্তসাপেক্ষ / বিশেষ বিবেচনায় প্রমোট
              </option>
              <option value="retained">একই শ্রেণিতে পুনঃপঠন (Retain)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">গন্তব্য শ্রেণি</label>
            <select
              value={targetClass}
              onChange={(e) => setTargetClass(e.target.value)}
              disabled={promotionType === 'retained'}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs sm:text-sm disabled:opacity-60"
            >
              {CLASS_LEVELS.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
              <option value="ষষ্ঠ শ্রেণি (উত্তীর্ণ / সমাপ্ত)">
                ষষ্ঠ শ্রেণি (উত্তীর্ণ / সমাপ্ত)
              </option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            প্রমোশন মন্তব্য / নিরাময়মূলক নির্দেশনা (মার্কশিটে প্রদর্শিত হবে)
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="যেমন: গণিত বিষয়ে নিরাময়মূলক সহায়তা সাপেক্ষে পরবর্তী শ্রেণিতে প্রমোট"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs sm:text-sm"
          />
        </div>

        {promotionType !== 'retained' && (
          <label className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={syncStudentList}
              onChange={(e) => setSyncStudentList(e.target.checked)}
              disabled={targetClass.includes('ষষ্ঠ')}
              className="mt-0.5 rounded border-slate-300 text-emerald-800 focus:ring-emerald-700"
            />
            <span>
              <strong>শিক্ষার্থীর তথ্য রেজিস্টারে ({selectedClass} → {targetClass}) স্বয়ংক্রিয়ভাবে শ্রেণি আপডেট করুন</strong>
              <span className="block text-[11px] text-slate-500 mt-0.5">
                {targetClass.includes('ষষ্ঠ')
                  ? 'পঞ্চম শ্রেণি থেকে সমাপ্তির ক্ষেত্রে মূল শিক্ষার্থী রেজিস্টারে পঞ্চম শ্রেণিই রাখা হবে (শুধু মূল্যায়নে উত্তীর্ণ চিহ্নিত হবে)।'
                  : 'অ্যাপের "শিক্ষার্থীর তথ্য" মডিউলেও সংশ্লিষ্ট শিক্ষার্থীর শ্রেণি পরবর্তী শ্রেণিতে পরিবর্তন হয়ে যাবে।'}
              </span>
            </span>
          </label>
        )}

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
          >
            বাতিল
          </button>
          <button
            type="submit"
            disabled={activeIds.length === 0}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-900 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-950 disabled:opacity-50"
          >
            <ArrowUpCircle className="h-4 w-4" />
            <span>
              {promotionType === 'retained'
                ? `পুনঃপঠন সংরক্ষণ (${toBanglaDigit(activeIds.length)} জন)`
                : `প্রমোট নিশ্চিত করুন (${toBanglaDigit(activeIds.length)} জন)`}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};
