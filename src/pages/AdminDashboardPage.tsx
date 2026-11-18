import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bell,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Megaphone,
  ArrowUp,
  Star,
  SlidersHorizontal,
  Building2,
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  X,
  ExternalLink,
  Search,
  Layers,
  HardDrive,
  FolderSync,
  ShieldCheck,
  Wifi,
} from 'lucide-react';
import { DashboardAuthPanel } from '../components/DashboardAuthPanel';
import { PageShell } from '../components/PageShell';
import { ServiceDataManager } from '../components/ServiceDataManager';
import { INITIAL_NOTICES } from '../data/curriculum';
import { DEFAULT_FEATURE_SETTINGS, MANAGED_MODULES } from '../data/featureSettings';
import {
  FeatureSettings,
  ManagedModuleKey,
  NoticeItem,
  RouteKey,
  TeacherProfile,
} from '../types';
import { getFormattedBanglaDate, toBanglaDigit } from '../utils/bangla';
import {
  downloadFullDatabaseBackup,
  formatStorageBytes,
  getPhoneStorageStatus,
  inspectBackupFile,
  PhoneStorageStatus,
  requestPersistentPhoneStorage,
  restoreFullDatabaseBundle,
  saveToPhoneDefaultFolder,
  syncAllKeysToIndexedDB,
  syncLinkedPhoneFolderNow,
} from '../utils/phoneStorage';

interface AdminDashboardPageProps {
  profile: TeacherProfile;
  onSaveProfile: (profile: TeacherProfile) => void;
  notices: NoticeItem[];
  onUpdateNotices: React.Dispatch<React.SetStateAction<NoticeItem[]>>;
  featureSettings: FeatureSettings;
  onUpdateFeatureSettings: React.Dispatch<React.SetStateAction<FeatureSettings>>;
  onNavigate: (route: RouteKey) => void;
  onOpenAuth?: (mode?: 'login' | 'register') => void;
}

type DashboardTab = 'notices' | 'services_data' | 'features' | 'school_backup';

interface NoticeFormState {
  title: string;
  category: NoticeItem['category'];
  date: string;
  summary: string;
  body: string;
  isImportant: boolean;
  isActive: boolean;
  showInTicker: boolean;
}

function readLocalArrayCount(key: string): number {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return 0;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}

export default function AdminDashboardPage({
  profile,
  onSaveProfile,
  notices,
  onUpdateNotices,
  featureSettings,
  onUpdateFeatureSettings,
  onNavigate,
  onOpenAuth,
}: AdminDashboardPageProps) {
  const [activeTab, setActiveTab] = useState<DashboardTab>('notices');
  const [statusBanner, setStatusBanner] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Notice filters & form state
  const [noticeSearch, setNoticeSearch] = useState('');
  const [noticeCategoryFilter, setNoticeCategoryFilter] = useState<string>('সকল');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [noticeForm, setNoticeForm] = useState<NoticeFormState>({
    title: '',
    category: 'অফিসিয়াল নোটিশ',
    date: getFormattedBanglaDate(),
    summary: '',
    body: '',
    isImportant: false,
    isActive: true,
    showInTicker: true,
  });

  // School profile inline edit state
  const [profileForm, setProfileForm] = useState<TeacherProfile>(profile);
  const backupInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setProfileForm(profile);
  }, [profile]);
  const [storageStatus, setStorageStatus] = useState<PhoneStorageStatus | null>(null);
  const [cachingOffline, setCachingOffline] = useState(false);

  const refreshStorageStatus = async () => {
    const status = await getPhoneStorageStatus();
    setStorageStatus(status);
  };

  useEffect(() => {
    if (activeTab === 'school_backup') {
      void refreshStorageStatus();
    }
  }, [activeTab]);

  // Live overview counters
  const stats = useMemo(() => {
    const activeNotices = notices.filter((n) => n.isActive !== false).length;
    const tickerNotices = notices.filter(
      (n) => n.isActive !== false && n.showInTicker !== false
    ).length;
    const enabledModuleCount = MANAGED_MODULES.filter(
      (m) => featureSettings.enabledModules[m.key] !== false
    ).length;
    const studentCount = readLocalArrayCount('students_list_v1');
    const evaluationCount = readLocalArrayCount('evaluation_records_v1');
    const forumCount = readLocalArrayCount('teacher_forum_v1');

    return {
      activeNotices,
      tickerNotices,
      totalNotices: notices.length,
      enabledModuleCount,
      totalModules: MANAGED_MODULES.length,
      studentCount,
      recordsCount: evaluationCount + forumCount,
    };
  }, [notices, featureSettings]);

  const filteredNotices = useMemo(() => {
    return notices.filter((n) => {
      const mCat = noticeCategoryFilter === 'সকল' || n.category === noticeCategoryFilter;
      const q = noticeSearch.trim().toLowerCase();
      const mSearch =
        !q ||
        n.title.toLowerCase().includes(q) ||
        n.summary.toLowerCase().includes(q) ||
        n.body.toLowerCase().includes(q);
      return mCat && mSearch;
    });
  }, [notices, noticeCategoryFilter, noticeSearch]);

  const resetNoticeForm = () => {
    setEditingId(null);
    setNoticeForm({
      title: '',
      category: 'অফিসিয়াল নোটিশ',
      date: getFormattedBanglaDate(),
      summary: '',
      body: '',
      isImportant: false,
      isActive: true,
      showInTicker: true,
    });
  };

  const handleSaveNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeForm.title.trim() || !noticeForm.body.trim()) return;

    const cleanSummary =
      noticeForm.summary.trim() || `${noticeForm.body.trim().slice(0, 110)}...`;

    if (editingId) {
      onUpdateNotices((prev) =>
        prev.map((item) =>
          item.id === editingId
            ? {
                ...item,
                title: noticeForm.title.trim(),
                category: noticeForm.category,
                date: noticeForm.date.trim() || getFormattedBanglaDate(),
                summary: cleanSummary,
                body: noticeForm.body.trim(),
                isImportant: noticeForm.isImportant,
                isActive: noticeForm.isActive,
                showInTicker: noticeForm.showInTicker,
              }
            : item
        )
      );
      setStatusBanner({
        type: 'success',
        message: 'নোটিশটি সফলভাবে হালনাগাদ করা হয়েছে।',
      });
    } else {
      const newNotice: NoticeItem = {
        id: `n-${Date.now()}`,
        title: noticeForm.title.trim(),
        category: noticeForm.category,
        date: noticeForm.date.trim() || getFormattedBanglaDate(),
        summary: cleanSummary,
        body: noticeForm.body.trim(),
        isImportant: noticeForm.isImportant,
        isActive: noticeForm.isActive,
        showInTicker: noticeForm.showInTicker,
      };
      onUpdateNotices((prev) => [newNotice, ...prev]);
      setStatusBanner({
        type: 'success',
        message: 'নতুন নোটিশ সফলভাবে নোটিশ বোর্ডে প্রকাশিত হয়েছে।',
      });
    }
    resetNoticeForm();
  };

  const handleEditNotice = (notice: NoticeItem) => {
    setEditingId(notice.id);
    setNoticeForm({
      title: notice.title,
      category: notice.category,
      date: notice.date,
      summary: notice.summary,
      body: notice.body,
      isImportant: Boolean(notice.isImportant),
      isActive: notice.isActive !== false,
      showInTicker: notice.showInTicker !== false,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleNoticeFlag = (id: string, field: 'isActive' | 'showInTicker' | 'isImportant') => {
    onUpdateNotices((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        if (field === 'isImportant') {
          return { ...item, isImportant: !item.isImportant };
        }
        const current = item[field] !== false;
        return { ...item, [field]: !current };
      })
    );
  };

  const moveNoticeUp = (id: string) => {
    onUpdateNotices((prev) => {
      const index = prev.findIndex((n) => n.id === id);
      if (index <= 0) return prev;
      const copy = [...prev];
      const [picked] = copy.splice(index, 1);
      copy.splice(index - 1, 0, picked);
      return copy;
    });
  };

  const deleteNotice = (id: string) => {
    onUpdateNotices((prev) => prev.filter((n) => n.id !== id));
    if (editingId === id) resetNoticeForm();
    setStatusBanner({
      type: 'success',
      message: 'নোটিশটি তালিকা থেকে মুছে ফেলা হয়েছে।',
    });
  };

  const handleRestoreDefaultNotices = () => {
    onUpdateNotices(INITIAL_NOTICES);
    resetNoticeForm();
    setStatusBanner({
      type: 'success',
      message: 'সকল ডিফল্ট নোটিশ পুনরুদ্ধার করা হয়েছে।',
    });
  };

  const toggleModule = (key: ManagedModuleKey) => {
    onUpdateFeatureSettings((prev) => ({
      ...prev,
      enabledModules: {
        ...prev.enabledModules,
        [key]: prev.enabledModules[key] === false,
      },
    }));
  };

  const enableAllModules = () => {
    onUpdateFeatureSettings((prev) => ({
      ...prev,
      enabledModules: { ...DEFAULT_FEATURE_SETTINGS.enabledModules },
    }));
    setStatusBanner({
      type: 'success',
      message: 'প্রধান ১২টি মডিউল পুনরায় সক্রিয় করা হয়েছে।',
    });
  };

  const handleSaveSchoolProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile(profileForm);
    setStatusBanner({
      type: 'success',
      message: 'বিদ্যালয় ও শিক্ষকের তথ্য সংরক্ষিত হয়েছে।',
    });
  };

  const handleExportFullBackup = async () => {
    const filename = await downloadFullDatabaseBackup();
    await refreshStorageStatus();
    setStatusBanner({
      type: 'success',
      message: `সম্পূর্ণ ডাটাবেজ ব্যাকআপ (${filename}) ডাউনলোড হয়েছে।`,
    });
  };

  const handleRestoreFullBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const preview = inspectBackupFile(String(reader.result));
        await restoreFullDatabaseBundle(preview.bundle);
        if (preview.bundle.profile && typeof preview.bundle.profile === 'object') {
          setProfileForm(preview.bundle.profile as TeacherProfile);
        }
        await refreshStorageStatus();
        setStatusBanner({
          type: 'success',
          message:
            'ব্যাকআপ ফাইল থেকে সকল নোটিশ, সেটিংস ও সংরক্ষিত তথ্য ফোনের স্টোরেজে রিস্টোর হয়েছে।',
        });
      } catch {
        setStatusBanner({
          type: 'error',
          message:
            'ব্যাকআপ ফাইলটি সঠিক নয়। অনুগ্রহ করে এই অ্যাপ থেকে ডাউনলোডকৃত .json ফাইল দিন।',
        });
      }
    };
    reader.readAsText(file);
  };

  return (
    <PageShell
      title="নোটিশ ও ফিচার পরিচালনা ড্যাশবোর্ড"
      subtitle="লাইভ নোটিশ বোর্ড, হোমপেজ মডিউল নিয়ন্ত্রণ, বিদ্যালয় তথ্য ও সম্পূর্ণ ব্যাকআপ"
      onNavigate={onNavigate}
      actions={
        <button
          type="button"
          onClick={() => onNavigate('notices')}
          className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
        >
          <Bell className="h-4 w-4 text-blue-600" aria-hidden="true" />
          <span>পাবলিক নোটিশ বোর্ড দেখুন</span>
        </button>
      }
    >
      {/* Inline Status Banner */}
      {statusBanner && (
        <div
          role="status"
          className={`mb-5 flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-xs sm:text-sm ${
            statusBanner.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border-rose-200 bg-rose-50 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            {statusBanner.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" aria-hidden="true" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" aria-hidden="true" />
            )}
            <span>{statusBanner.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusBanner(null)}
            aria-label="বার্তা বন্ধ করুন"
            className="p-1 opacity-70 hover:opacity-100 shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Dashboard Multi-User Login & Auto-Update Panel */}
      <div className="mb-5">
        <DashboardAuthPanel onOpenAuthModal={(mode) => onOpenAuth?.(mode)} />
      </div>

      {/* Overview KPI Strip */}
      <section
        aria-label="সিস্টেম সারসংক্ষেপ"
        className="mb-5 grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 rounded-2xl border border-slate-200 bg-white"
      >
        <div className="p-4 sm:p-5">
          <p className="text-xs font-medium text-slate-500">সক্রিয় নোটিশ</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">
            {toBanglaDigit(stats.activeNotices)}
            <span className="ml-1 text-xs font-normal text-slate-500">
              / {toBanglaDigit(stats.totalNotices)} টি
            </span>
          </p>
          <p className="mt-1 text-xs text-blue-700 tabular-nums">
            টিকারে প্রদর্শিত: {toBanglaDigit(stats.tickerNotices)} টি
          </p>
        </div>

        <div className="p-4 sm:p-5">
          <p className="text-xs font-medium text-slate-500">চালু মডিউল</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700 tabular-nums">
            {toBanglaDigit(stats.enabledModuleCount)}
            <span className="ml-1 text-xs font-normal text-slate-500">
              / {toBanglaDigit(stats.totalModules)} টি
            </span>
          </p>
          <p className="mt-1 text-xs text-slate-500">
            টিকার অবস্থা: {featureSettings.showNoticeTicker ? 'চালু' : 'বন্ধ'}
          </p>
        </div>

        <div className="p-4 sm:p-5">
          <p className="text-xs font-medium text-slate-500">নিবন্ধিত শিক্ষার্থী</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">
            {toBanglaDigit(stats.studentCount)}
            <span className="ml-1 text-xs font-normal text-slate-500">জন</span>
          </p>
          <p className="mt-1 text-xs text-slate-500">ব্রাউজারে সংরক্ষিত</p>
        </div>

        <div className="p-4 sm:p-5">
          <p className="text-xs font-medium text-slate-500">মূল্যায়ন ও ফোরাম</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">
            {toBanglaDigit(stats.recordsCount)}
            <span className="ml-1 text-xs font-normal text-slate-500">টি এন্ট্রি</span>
          </p>
          <p className="mt-1 text-xs text-slate-500 truncate">{profile.school}</p>
        </div>
      </section>

      {/* Segmented Navigation Tabs */}
      <div
        role="tablist"
        aria-label="ড্যাশবোর্ড বিভাগসমূহ"
        className="mb-5 inline-flex flex-wrap items-center gap-1.5 rounded-2xl bg-slate-200/70 p-1.5"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'notices'}
          onClick={() => setActiveTab('notices')}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'notices'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Megaphone className="h-4 w-4 text-blue-600" aria-hidden="true" />
          <span>নোটিশ বোর্ড পরিচালনা</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'services_data'}
          onClick={() => setActiveTab('services_data')}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'services_data'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="h-4 w-4 text-teal-600" aria-hidden="true" />
          <span>প্রধান সেবাসমূহের তথ্য</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'features'}
          onClick={() => setActiveTab('features')}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'features'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <SlidersHorizontal className="h-4 w-4 text-emerald-600" aria-hidden="true" />
          <span>ফিচার ও মডিউল নিয়ন্ত্রণ</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'school_backup'}
          onClick={() => setActiveTab('school_backup')}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'school_backup'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Building2 className="h-4 w-4 text-indigo-600" aria-hidden="true" />
          <span>বিদ্যালয় তথ্য ও ব্যাকআপ</span>
        </button>
      </div>

      {/* TAB 1: NOTICE BOARD MANAGEMENT */}
      {activeTab === 'notices' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Notice Create / Edit Form */}
          <form
            onSubmit={handleSaveNotice}
            className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-5 space-y-3.5"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                {editingId ? (
                  <Pencil className="h-4 w-4 text-amber-600" aria-hidden="true" />
                ) : (
                  <Plus className="h-4 w-4 text-blue-600" aria-hidden="true" />
                )}
                <span>{editingId ? 'নোটিশ সম্পাদনা করুন' : 'নতুন নোটিশ প্রকাশ করুন'}</span>
              </h3>
              {editingId && (
                <button
                  type="button"
                  onClick={resetNoticeForm}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  নতুন লিখুন
                </button>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                নোটিশের শিরোনাম
              </label>
              <input
                type="text"
                required
                value={noticeForm.title}
                onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })}
                placeholder="যেমন: ২০২৬ বার্ষিক পরীক্ষার সময়সূচি প্রকাশ"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">বিভাগ</label>
                <select
                  value={noticeForm.category}
                  onChange={(e) =>
                    setNoticeForm({
                      ...noticeForm,
                      category: e.target.value as NoticeItem['category'],
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
                >
                  <option value="অফিসিয়াল নোটিশ">অফিসিয়াল নোটিশ</option>
                  <option value="অ্যাপ আপডেট">অ্যাপ আপডেট</option>
                  <option value="প্রশিক্ষণ বিজ্ঞপ্তি">প্রশিক্ষণ বিজ্ঞপ্তি</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">তারিখ</label>
                <input
                  type="text"
                  value={noticeForm.date}
                  onChange={(e) => setNoticeForm({ ...noticeForm, date: e.target.value })}
                  placeholder="১৫ নভেম্বর, ২০২৬"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                সংক্ষিপ্ত সারমর্ম (ঐচ্ছিক)
              </label>
              <input
                type="text"
                value={noticeForm.summary}
                onChange={(e) => setNoticeForm({ ...noticeForm, summary: e.target.value })}
                placeholder="এক লাইনে সংক্ষিপ্ত তথ্য..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                বিস্তারিত বিবরণ
              </label>
              <textarea
                rows={4}
                required
                value={noticeForm.body}
                onChange={(e) => setNoticeForm({ ...noticeForm, body: e.target.value })}
                placeholder="সকল শিক্ষক ও অভিভাবকদের অবগতির জন্য জানানো যাচ্ছে..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm leading-relaxed focus:border-blue-600 focus:bg-white focus:outline-none"
              />
            </div>

            <div className="space-y-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-700">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={noticeForm.isActive}
                  onChange={(e) => setNoticeForm({ ...noticeForm, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600"
                />
                <span>নোটিশ বোর্ডে প্রকাশ করুন (সক্রিয়)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={noticeForm.showInTicker}
                  onChange={(e) =>
                    setNoticeForm({ ...noticeForm, showInTicker: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-slate-300 text-blue-600"
                />
                <span>হোমপেজের স্ক্রলিং নোটিশ টিকারে দেখান</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={noticeForm.isImportant}
                  onChange={(e) =>
                    setNoticeForm({ ...noticeForm, isImportant: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-slate-300 text-amber-600"
                />
                <span>গুরুত্বপূর্ণ হিসেবে চিহ্নিত করুন</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              {editingId && (
                <button
                  type="button"
                  onClick={resetNoticeForm}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  বাতিল
                </button>
              )}
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
              >
                {editingId ? (
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Plus className="h-4 w-4" aria-hidden="true" />
                )}
                <span>{editingId ? 'পরিবর্তন সেভ করুন' : 'নোটিশ প্রকাশ করুন'}</span>
              </button>
            </div>
          </form>

          {/* Existing Notices Management List */}
          <div className="lg:col-span-7 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  প্রকাশিত নোটিশ তালিকা ({toBanglaDigit(filteredNotices.length)})
                </h3>
                <button
                  type="button"
                  onClick={handleRestoreDefaultNotices}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 whitespace-nowrap"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>ডিফল্ট নোটিশ রিস্টোর</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={noticeSearch}
                    onChange={(e) => setNoticeSearch(e.target.value)}
                    placeholder="নোটিশ খুঁজুন..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs sm:text-sm"
                  />
                </div>
                <select
                  value={noticeCategoryFilter}
                  onChange={(e) => setNoticeCategoryFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs sm:text-sm"
                >
                  <option value="সকল">সকল বিভাগ</option>
                  <option value="অফিসিয়াল নোটিশ">অফিসিয়াল নোটিশ</option>
                  <option value="অ্যাপ আপডেট">অ্যাপ আপডেট</option>
                  <option value="প্রশিক্ষণ বিজ্ঞপ্তি">প্রশিক্ষণ বিজ্ঞপ্তি</option>
                </select>
              </div>
            </div>

            {filteredNotices.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                কোনো নোটিশ পাওয়া যায়নি। বাম দিকের ফর্ম ব্যবহার করে নতুন নোটিশ প্রকাশ করুন।
              </div>
            ) : (
              <div className="space-y-3">
                {filteredNotices.map((notice, idx) => {
                  const isActive = notice.isActive !== false;
                  const inTicker = notice.showInTicker !== false;
                  return (
                    <article
                      key={notice.id}
                      className={`rounded-2xl border bg-white p-4 sm:p-5 transition-colors ${
                        isActive ? 'border-slate-200' : 'border-slate-200/70 opacity-75'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 mb-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-blue-700">{notice.category}</span>
                          <span aria-hidden="true">·</span>
                          <span>{notice.date}</span>
                          <span aria-hidden="true">·</span>
                          <span className={isActive ? 'font-semibold text-emerald-700' : 'font-semibold text-slate-500'}>
                            {isActive ? 'প্রকাশিত' : 'লুকানো'}
                          </span>
                          {notice.isImportant && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-semibold text-amber-700">গুরুত্বপূর্ণ</span>
                            </>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          {idx > 0 && noticeCategoryFilter === 'সকল' && !noticeSearch && (
                            <button
                              type="button"
                              onClick={() => moveNoticeUp(notice.id)}
                              title="উপরে তুলুন"
                              aria-label="নোটিশ উপরে তুলুন"
                              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                            >
                              <ArrowUp className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => toggleNoticeFlag(notice.id, 'isImportant')}
                            title="গুরুত্বপূর্ণ টগল"
                            aria-label="গুরুত্বপূর্ণ হিসেবে চিহ্নিত করুন"
                            className={`rounded-lg p-1.5 transition-colors ${
                              notice.isImportant
                                ? 'bg-amber-50 text-amber-600'
                                : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
                            }`}
                          >
                            <Star className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleNoticeFlag(notice.id, 'showInTicker')}
                            title={inTicker ? 'টিকার থেকে সরান' : 'টিকারে দেখান'}
                            aria-label={inTicker ? 'টিকার থেকে সরান' : 'টিকারে দেখান'}
                            className={`rounded-lg p-1.5 transition-colors ${
                              inTicker
                                ? 'bg-blue-50 text-blue-600'
                                : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
                            }`}
                          >
                            <Megaphone className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleNoticeFlag(notice.id, 'isActive')}
                            title={isActive ? 'নোটিশ লুকান' : 'নোটিশ প্রকাশ করুন'}
                            aria-label={isActive ? 'নোটিশ লুকান' : 'নোটিশ প্রকাশ করুন'}
                            className={`rounded-lg p-1.5 transition-colors ${
                              isActive
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEditNotice(notice)}
                            title="সম্পাদনা করুন"
                            aria-label="নোটিশ সম্পাদনা করুন"
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-700"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteNotice(notice.id)}
                            title="মুছে ফেলুন"
                            aria-label="নোটিশ মুছে ফেলুন"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <h4 className="text-sm sm:text-base font-bold text-slate-900">
                        {notice.title}
                      </h4>
                      <p className="mt-1 text-xs sm:text-sm text-slate-600 leading-relaxed">
                        {notice.body}
                      </p>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: FEATURE & MODULE CONTROLS */}
      {activeTab === 'features' && (
        <div className="space-y-5">
          {/* Homepage Layout & Ticker Settings */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                হোমপেজ লেআউট ও লাইভ টিকার সেটিংস
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                হোম ড্যাশবোর্ডের নোটিশ টিকার, ভিজ্যুয়াল কার্ড এবং সেকশনগুলো তাৎক্ষণিক নিয়ন্ত্রণ করুন।
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">লাইভ স্ক্রলিং নোটিশ টিকার</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    হোমপেজের শীর্ষে চলমান জরুরি নোটিশ বার দেখান
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={featureSettings.showNoticeTicker}
                  onClick={() =>
                    onUpdateFeatureSettings((prev) => ({
                      ...prev,
                      showNoticeTicker: !prev.showNoticeTicker,
                    }))
                  }
                  className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                    featureSettings.showNoticeTicker ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                      featureSettings.showNoticeTicker ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  টিকারের শিরোনাম ব্যাজ
                </label>
                <input
                  type="text"
                  value={featureSettings.tickerLabel}
                  onChange={(e) =>
                    onUpdateFeatureSettings((prev) => ({
                      ...prev,
                      tickerLabel: e.target.value,
                    }))
                  }
                  placeholder="জরুরি নোটিশ"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">অ্যাপ ও পোর্টফোলিও সেকশন</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    হোমপেজের নিচের অ্যাপ ডাউনলোড ও পোর্টফোলিও কার্ড দেখান
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={featureSettings.showDeveloperSpotlight}
                  onClick={() =>
                    onUpdateFeatureSettings((prev) => ({
                      ...prev,
                      showDeveloperSpotlight: !prev.showDeveloperSpotlight,
                    }))
                  }
                  className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                    featureSettings.showDeveloperSpotlight ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                      featureSettings.showDeveloperSpotlight ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2">
              <label
                htmlFor="apk-download-url-input"
                className="block text-sm font-semibold text-slate-900"
              >
                সরাসরি Android .APK ডাউনলোড লিংক (ঐচ্ছিক)
              </label>
              <p className="text-xs text-slate-500">
                GitHub Actions বা Android Studio থেকে তৈরি করা <code className="font-mono">.apk</code> ফাইল Google Drive বা GitHub Release-এ আপলোড করে সরাসরি লিংক এখানে দিলে অ্যাপের &quot;অ্যাপ ডাউনলোড / ইনস্টল&quot; বাটনে ১-ক্লিক .APK ডাউনলোড চালু হবে।
              </p>
              <input
                id="apk-download-url-input"
                type="url"
                value={featureSettings.apkDownloadUrl || ''}
                onChange={(e) =>
                  onUpdateFeatureSettings((prev) => ({
                    ...prev,
                    apkDownloadUrl: e.target.value,
                  }))
                }
                placeholder="https://github.com/.../releases/download/.../app-debug.apk"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs sm:text-sm font-mono focus:border-blue-600 focus:outline-none"
              />
            </div>
          </section>

          {/* 12 Service Modules Activation Grid */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  সেবা মডিউলসমূহ নিয়ন্ত্রণ ({toBanglaDigit(stats.enabledModuleCount)} /{' '}
                  {toBanglaDigit(stats.totalModules)} সক্রিয়)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  অপ্রয়োজনীয় মডিউল হোমপেজ থেকে লুকিয়ে রাখতে সুইচ বন্ধ করুন বা সরাসরি মডিউল খুলুন।
                </p>
              </div>
              <button
                type="button"
                onClick={enableAllModules}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 whitespace-nowrap"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>সকল মডিউল চালু করুন</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {MANAGED_MODULES.map((mod) => {
                const enabled = featureSettings.enabledModules[mod.key] !== false;
                return (
                  <div
                    key={mod.key}
                    className={`flex flex-col justify-between gap-3 rounded-xl border p-4 transition-colors ${
                      enabled
                        ? 'border-slate-200 bg-white'
                        : 'border-slate-200/70 bg-slate-50/70 opacity-75'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 truncate">{mod.title}</h4>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">{mod.subtitle}</p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={enabled}
                        aria-label={`${mod.title} সক্রিয় করুন`}
                        onClick={() => toggleModule(mod.key)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                          enabled ? 'bg-emerald-600' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            enabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs">
                      <span
                        className={`font-semibold ${
                          enabled ? 'text-emerald-700' : 'text-slate-500'
                        }`}
                      >
                        {enabled ? 'হোমপেজে সক্রিয়' : 'হোমপেজ থেকে লুকানো'}
                      </span>
                      <button
                        type="button"
                        onClick={() => onNavigate(mod.key)}
                        className="inline-flex items-center gap-1 font-semibold text-blue-700 hover:underline whitespace-nowrap"
                      >
                        <span>খুলুন</span>
                        <ExternalLink className="h-3 w-3" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {/* TAB 3: SCHOOL PROFILE & BACKUP */}
      {activeTab === 'school_backup' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* School & Teacher Profile Form */}
          <form
            onSubmit={handleSaveSchoolProfile}
            className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-5 space-y-3.5"
          >
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">বিদ্যালয় ও শিক্ষক প্রোফাইল</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                এখানে আপডেট করা তথ্য সকল আবেদন, মাসিক FLN, পাঠ পরিকল্পনা ও সনদপত্রে স্বয়ংক্রিয়ভাবে যুক্ত হবে।
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  শিক্ষকের নাম
                </label>
                <input
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">পদবি</label>
                <input
                  type="text"
                  required
                  value={profileForm.designation}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, designation: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                বিদ্যালয়ের নাম
              </label>
              <input
                type="text"
                required
                value={profileForm.school}
                onChange={(e) => setProfileForm({ ...profileForm, school: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                গ্রাম ও ডাকঘর
              </label>
              <input
                type="text"
                value={profileForm.villagePost || ''}
                onChange={(e) => setProfileForm({ ...profileForm, villagePost: e.target.value })}
                placeholder="কোলা, মাড়িয়ালা"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">উপজেলা</label>
                <input
                  type="text"
                  value={profileForm.upazila}
                  onChange={(e) => setProfileForm({ ...profileForm, upazila: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">জেলা</label>
                <input
                  type="text"
                  value={profileForm.district}
                  onChange={(e) => setProfileForm({ ...profileForm, district: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  EMIS কোড
                </label>
                <input
                  type="text"
                  value={profileForm.emisCode || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, emisCode: e.target.value })}
                  placeholder="9120..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-mono tabular-nums focus:border-blue-600 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                মোবাইল নম্বর
              </label>
              <input
                type="tel"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm font-mono tabular-nums focus:border-blue-600 focus:bg-white focus:outline-none"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
              >
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                <span>প্রোফাইল সংরক্ষণ করুন</span>
              </button>
            </div>
          </form>

          {/* Full System Backup & Restore */}
          <div className="lg:col-span-5 space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-blue-600" aria-hidden="true" />
                  <span>ফোন ডিফল্ট স্টোরেজ ও অফলাইন</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  সকল তথ্য স্বয়ংক্রিয়ভাবে ফোনের স্থায়ী স্টোরেজে (IndexedDB) সেভ থাকে এবং ইন্টারনেট ছাড়াই কাজ করে।
                </p>
              </div>

              {storageStatus && (
                <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 space-y-2 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-600">স্টোরেজ সুরক্ষা:</span>
                    <span
                      className={`font-bold ${
                        storageStatus.persisted ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      {storageStatus.persisted ? 'পার্মানেন্ট (সুরক্ষিত)' : 'সাধারণ ব্রাউজার স্টোরেজ'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-600">ব্যবহৃত ফোন স্টোরেজ:</span>
                    <span className="font-semibold text-slate-900 tabular-nums">
                      {formatStorageBytes(storageStatus.usageBytes)}
                      {storageStatus.quotaBytes > 0
                        ? ` / ${formatStorageBytes(storageStatus.quotaBytes)}`
                        : ''}
                    </span>
                  </div>
                  {storageStatus.linkedFolderName && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-600">যুক্ত ফোন ফোল্ডার:</span>
                      <span className="font-semibold text-blue-700 truncate max-w-[160px]">
                        {storageStatus.linkedFolderName}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                {!storageStatus?.persisted && (
                  <button
                    type="button"
                    onClick={async () => {
                      const ok = await requestPersistentPhoneStorage();
                      await refreshStorageStatus();
                      setStatusBanner({
                        type: ok ? 'success' : 'error',
                        message: ok
                          ? 'ফোনের স্থায়ী স্টোরেজ অনুমতি সক্রিয় হয়েছে — ডাটা স্বয়ংক্রিয়ভাবে মুছবে না।'
                          : 'ব্রাউজার অস্থায়ীভাবে অনুমতি দেয়নি; অ্যাপটি হোম স্ক্রিনে ইনস্টল করলে স্থায়ী স্টোরেজ স্বয়ংক্রিয়ভাবে সক্রিয় হবে।',
                      });
                    }}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-800 hover:bg-blue-100 transition-colors"
                  >
                    <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                    <span>ফোনে স্থায়ী (Persistent) স্টোরেজ চালু করুন</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const res = await saveToPhoneDefaultFolder();
                      await refreshStorageStatus();
                      setStatusBanner({
                        type: 'success',
                        message:
                          res.mode === 'folder'
                            ? `ফোনের "${res.folderName}" ফোল্ডারে অফলাইন ডাটা ফাইল সেভ হয়েছে।`
                            : 'ফোনের ডিফল্ট Downloads ফোল্ডারে সম্পূর্ণ অফলাইন ডাটা সেভ হয়েছে।',
                      });
                    } catch {
                      // Cancelled by user cleanly
                    }
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                >
                  <FolderSync className="h-4 w-4" aria-hidden="true" />
                  <span>ফোনের ডিফল্ট স্টোরেজ / ফোল্ডারে সেভ করুন</span>
                </button>

                {storageStatus?.linkedFolderName && (
                  <button
                    type="button"
                    onClick={async () => {
                      const ok = await syncLinkedPhoneFolderNow();
                      setStatusBanner({
                        type: ok ? 'success' : 'error',
                        message: ok
                          ? `ফোনের "${storageStatus.linkedFolderName}" ফোল্ডারে সর্বশেষ তথ্য আপডেট হয়েছে।`
                          : 'ফোল্ডারে লেখার অনুমতি পুনরায় দিন।',
                      });
                    }}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition-colors"
                  >
                    <FolderSync className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>যুক্ত ফোল্ডারে সিঙ্ক করুন ({storageStatus.linkedFolderName})</span>
                  </button>
                )}

                <button
                  type="button"
                  disabled={cachingOffline}
                  onClick={async () => {
                    setCachingOffline(true);
                    try {
                      await Promise.all([
                        import('./LessonPlanPage'),
                        import('./QuestionsPage'),
                        import('./SuggestionsPage'),
                        import('./ApplicationsPage'),
                        import('./MonthlyFlnPage'),
                        import('./EvaluationPage'),
                        import('./BooksPage'),
                        import('./CertificatesPage'),
                        import('./StudentsPage'),
                        import('./ForumPage'),
                        import('./VideosPage'),
                        import('./PortalsPage'),
                        import('./NoticesPage'),
                        import('./PortfolioPage'),
                        import('./InfoPages'),
                      ]);
                      await syncAllKeysToIndexedDB();
                      await refreshStorageStatus();
                      setStatusBanner({
                        type: 'success',
                        message: 'সকল মডিউল ও ডাটা ফোনে অফলাইনে ব্যবহারের জন্য ক্যাশ সম্পন্ন হয়েছে।',
                      });
                    } finally {
                      setCachingOffline(false);
                    }
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-100 transition-colors disabled:opacity-60"
                >
                  <Wifi className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                  <span>{cachingOffline ? 'অফলাইন ক্যাশ হচ্ছে...' : 'সকল মডিউল অফলাইনের জন্য প্রস্তুত করুন'}</span>
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">সম্পূর্ণ ডাটা ব্যাকআপ ও রিস্টোর</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  নোটিশ, মডিউল সেটিংস, শিক্ষার্থী, মূল্যায়ন ও মাসিক FLN-সহ সব তথ্য এক ফাইলে সংরক্ষণ করুন।
                </p>
              </div>

              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={handleExportFullBackup}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                  <span>সম্পূর্ণ ব্যাকআপ ডাউনলোড (.json)</span>
                </button>

                <button
                  type="button"
                  onClick={() => backupInputRef.current?.click()}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 hover:bg-slate-100 transition-colors"
                >
                  <Upload className="h-4 w-4 text-blue-600" aria-hidden="true" />
                  <span>ব্যাকআপ ফাইল রিস্টোর করুন (.json)</span>
                </button>

                <input
                  ref={backupInputRef}
                  type="file"
                  accept="application/json,.json"
                  onChange={handleRestoreFullBackup}
                  className="hidden"
                />
              </div>

              <div className="border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    onUpdateNotices(INITIAL_NOTICES);
                    onUpdateFeatureSettings(DEFAULT_FEATURE_SETTINGS);
                    setStatusBanner({
                      type: 'success',
                      message: 'নোটিশ ও ফিচার সেটিংস ডিফল্ট অবস্থায় ফিরিয়ে আনা হয়েছে।',
                    });
                  }}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition-colors"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>নোটিশ ও ফিচার সেটিংস রিসেট করুন</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* TAB 4: CORE SERVICES DATA MANAGEMENT */}
      {activeTab === 'services_data' && (
        <ServiceDataManager
          profile={profile}
          onNavigate={onNavigate}
          onNotify={(type, message) => setStatusBanner({ type, message })}
        />
      )}
    </PageShell>
  );
}
