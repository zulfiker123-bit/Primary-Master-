import React, { useEffect, useRef, useState } from 'react';
import {
  Database,
  Download,
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
  FolderSync,
  Clock,
  FileJson,
} from 'lucide-react';
import { toBanglaDigit } from '../utils/bangla';
import {
  BackupFilePreview,
  downloadFullDatabaseBackup,
  formatStorageBytes,
  getLocalDatabaseSummary,
  inspectBackupFile,
  LocalDatabaseSummary,
  restoreFullDatabaseBundle,
  saveToPhoneDefaultFolder,
} from '../utils/phoneStorage';

interface LocalBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LocalBackupModal: React.FC<LocalBackupModalProps> = ({ isOpen, onClose }) => {
  const [summary, setSummary] = useState<LocalDatabaseSummary | null>(null);
  const [pendingPreview, setPendingPreview] = useState<BackupFilePreview | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshSummary = () => {
    setSummary(getLocalDatabaseSummary());
  };

  useEffect(() => {
    if (isOpen) {
      refreshSummary();
      setFeedback(null);
      setPendingPreview(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const formatDateTime = (iso: string | null) => {
    if (!iso) return 'এখনো কোনো ব্যাকআপ নেওয়া হয়নি';
    try {
      const d = new Date(iso);
      return d.toLocaleString('bn-BD', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  const handleDownloadJson = async () => {
    setBusy(true);
    try {
      const filename = await downloadFullDatabaseBackup();
      refreshSummary();
      setFeedback({
        type: 'success',
        message: `সম্পূর্ণ ডাটাবেজ (${filename}) সফলভাবে আপনার ডিভাইসে ডাউনলোড হয়েছে।`,
      });
    } catch {
      setFeedback({
        type: 'error',
        message: 'ডাটাবেজ ব্যাকআপ ডাউনলোড করতে সমস্যা হয়েছে।',
      });
    } finally {
      setBusy(false);
    }
  };

  const handleSaveToFolder = async () => {
    setBusy(true);
    try {
      const res = await saveToPhoneDefaultFolder();
      refreshSummary();
      setFeedback({
        type: 'success',
        message:
          res.mode === 'folder'
            ? `ফোনের "${res.folderName}" ফোল্ডারে সম্পূর্ণ ডাটাবেজ সেভ হয়েছে।`
            : 'ফোনের ডিফল্ট Downloads ফোল্ডারে সম্পূর্ণ JSON ব্যাকআপ সেভ হয়েছে।',
      });
    } catch (err) {
      if (!(err instanceof Error && err.name === 'AbortError')) {
        setFeedback({
          type: 'error',
          message: 'ফোল্ডারে সেভ করতে সমস্যা হয়েছে। অনুগ্রহ করে JSON ডাউনলোড ব্যবহার করুন।',
        });
      }
    } finally {
      setBusy(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const preview = inspectBackupFile(String(reader.result));
        setPendingPreview(preview);
        setFeedback(null);
      } catch {
        setPendingPreview(null);
        setFeedback({
          type: 'error',
          message: 'সঠিক ব্যাকআপ ফাইল নয়। এই অ্যাপ থেকে ডাউনলোডকৃত .json ফাইল নির্বাচন করুন।',
        });
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmRestore = async () => {
    if (!pendingPreview) return;
    setBusy(true);
    try {
      await restoreFullDatabaseBundle(pendingPreview.bundle);
      setPendingPreview(null);
      refreshSummary();
      setFeedback({
        type: 'success',
        message: 'ব্যাকআপ ফাইল থেকে সকল শিক্ষার্থী, মূল্যায়ন, মাসিক FLN ও সেটিংস সফলভাবে রিস্টোর হয়েছে!',
      });
    } catch {
      setFeedback({
        type: 'error',
        message: 'ডাটা রিস্টোর করার সময় ত্রুটি হয়েছে।',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="backup-modal-title"
    >
      <div className="w-full max-w-xl rounded-2xl bg-white p-5 sm:p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3
            id="backup-modal-title"
            className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2"
          >
            <Database className="h-5 w-5 text-blue-600" aria-hidden="true" />
            <span>লোকাল ডাটাবেজ ব্যাকআপ ও রিস্টোর (.json)</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="বন্ধ করুন"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          আপনার বিদ্যালয়ের সকল তথ্য (প্রোফাইল, শিক্ষার্থী, মূল্যায়ন, মাসিক FLN, পাঠ পরিকল্পনা, প্রশ্নব্যাংক ও নোটিশ) এক ক্লিকে নিরাপদ JSON ফাইল হিসেবে ফোনে ডাউনলোড করে সংরক্ষণ করুন এবং প্রয়োজনে যেকোনো সময় রিস্টোর করুন।
        </p>

        {feedback && (
          <div
            role="status"
            className={`flex items-start gap-2.5 rounded-xl border p-3 text-xs sm:text-sm ${
              feedback.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                : 'border-rose-200 bg-rose-50 text-rose-900'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Current Database Summary */}
        {summary && (
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <FileJson className="h-4 w-4 text-blue-600" aria-hidden="true" />
                <span>বর্তমান সংরক্ষিত ডাটাবেজ</span>
              </span>
              <span className="font-semibold text-slate-600 tabular-nums">
                মোট সাইজ: {formatStorageBytes(summary.totalSizeBytes)}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div className="rounded-lg bg-white border border-slate-200/80 px-3 py-2 flex justify-between">
                <span className="text-slate-600">শিক্ষার্থী</span>
                <strong className="text-slate-900 tabular-nums">{toBanglaDigit(summary.students)}</strong>
              </div>
              <div className="rounded-lg bg-white border border-slate-200/80 px-3 py-2 flex justify-between">
                <span className="text-slate-600">মূল্যায়ন</span>
                <strong className="text-slate-900 tabular-nums">{toBanglaDigit(summary.evaluations)}</strong>
              </div>
              <div className="rounded-lg bg-white border border-slate-200/80 px-3 py-2 flex justify-between">
                <span className="text-slate-600">পাঠ পরিকল্পনা</span>
                <strong className="text-slate-900 tabular-nums">{toBanglaDigit(summary.lessonPlans)}</strong>
              </div>
              <div className="rounded-lg bg-white border border-slate-200/80 px-3 py-2 flex justify-between">
                <span className="text-slate-600">প্রশ্নব্যাংক</span>
                <strong className="text-slate-900 tabular-nums">{toBanglaDigit(summary.questions)}</strong>
              </div>
              <div className="rounded-lg bg-white border border-slate-200/80 px-3 py-2 flex justify-between">
                <span className="text-slate-600">নোটিশ</span>
                <strong className="text-slate-900 tabular-nums">{toBanglaDigit(summary.notices)}</strong>
              </div>
              <div className="rounded-lg bg-white border border-slate-200/80 px-3 py-2 flex justify-between">
                <span className="text-slate-600">মাসিক FLN</span>
                <strong className="text-emerald-700 tabular-nums">{toBanglaDigit(summary.flnRecords)}</strong>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-1">
              <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>শেষ ব্যাকআপ: {formatDateTime(summary.lastBackupAt)}</span>
            </div>
          </div>
        )}

        {/* Export Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleDownloadJson()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-emerald-700 transition-colors disabled:opacity-60"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            <span>JSON ব্যাকআপ ডাউনলোড</span>
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleSaveToFolder()}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs sm:text-sm font-semibold text-blue-800 hover:bg-blue-100 transition-colors disabled:opacity-60"
          >
            <FolderSync className="h-4 w-4" aria-hidden="true" />
            <span>ফোন ফোল্ডারে সেভ করুন</span>
          </button>
        </div>

        {/* Restore Section */}
        <div className="border-t border-slate-100 pt-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h4 className="text-sm font-bold text-slate-900">পূর্বের ব্যাকআপ ফাইল থেকে রিস্টোর</h4>
              <p className="text-xs text-slate-500">
                আগে ডাউনলোড করা <code className="font-mono">.json</code> ফাইল নির্বাচন করে তথ্য ফিরিয়ে আনুন।
              </p>
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-100 whitespace-nowrap shrink-0"
            >
              <Upload className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
              <span>ফাইল বাছাই করুন</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {pendingPreview && (
            <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 space-y-3">
              <div className="text-xs space-y-1 text-slate-700">
                <p className="font-bold text-blue-900">ব্যাকআপ ফাইলের বিবরণ যাচাই:</p>
                <p>বিদ্যালয়: <strong>{pendingPreview.schoolName}</strong> · শিক্ষক: <strong>{pendingPreview.teacherName}</strong></p>
                <p>
                  তারিখ: {formatDateTime(pendingPreview.exportedAt)} · শিক্ষার্থী:{' '}
                  <strong className="tabular-nums">{toBanglaDigit(pendingPreview.studentsCount)}</strong> · মূল্যায়ন:{' '}
                  <strong className="tabular-nums">{toBanglaDigit(pendingPreview.evaluationsCount)}</strong> · নোটিশ:{' '}
                  <strong className="tabular-nums">{toBanglaDigit(pendingPreview.noticesCount)}</strong>
                </p>
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPendingPreview(null)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void handleConfirmRestore()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>নিশ্চিত করে রিস্টোর করুন</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
