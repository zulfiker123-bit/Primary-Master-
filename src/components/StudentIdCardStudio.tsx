import React, { useMemo, useState } from 'react';
import {
  Camera,
  Check,
  CheckSquare,
  CreditCard,
  FileDown,
  Loader2,
  Printer,
  Square,
  User,
  UserPlus,
} from 'lucide-react';
import { DPE_LOGO_SRC, GOVT_MONOGRAM_SRC } from './OfficialEmblems';
import { CLASS_LEVELS } from '../data/curriculum';
import { Student, TeacherProfile } from '../types';
import { toBanglaDigit } from '../utils/bangla';

export type IdCardThemeKey = 'emerald' | 'navy' | 'maroon';
export type IdCardLayoutMode = 'front_only' | 'front_and_back';

const CARD_THEMES: Record<
  IdCardThemeKey,
  {
    label: string;
    headerBg: string;
    accentBg: string;
    accentText: string;
    border: string;
    footerBg: string;
  }
> = {
  emerald: {
    label: 'সরকারি সবুজ',
    headerBg: '#0F2922',
    accentBg: '#ECFDF5',
    accentText: '#065F46',
    border: '#065F46',
    footerBg: '#0F2922',
  },
  navy: {
    label: 'প্রাতিষ্ঠানিক নীল',
    headerBg: '#172554',
    accentBg: '#EFF6FF',
    accentText: '#1E40AF',
    border: '#1E3A8A',
    footerBg: '#172554',
  },
  maroon: {
    label: 'ঐতিহ্যবাহী মেরুন',
    headerBg: '#64131E',
    accentBg: '#FFF1F2',
    accentText: '#9F1239',
    border: '#881337',
    footerBg: '#64131E',
  },
};

export function resizePhotoToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('File read error'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Image load error'));
      img.onload = () => {
        const targetW = 240;
        const targetH = 280;
        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(String(reader.result));
          return;
        }
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, targetW, targetH);
        const scale = Math.max(targetW / img.width, targetH / img.height);
        const drawW = img.width * scale;
        const drawH = img.height * scale;
        const offsetX = (targetW - drawW) / 2;
        const offsetY = (targetH - drawH) / 2;
        ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

interface StudentIdCardStudioProps {
  students: Student[];
  filteredStudents: Student[];
  selectedClass: string;
  profile: TeacherProfile;
  sheetRef: React.RefObject<HTMLDivElement | null>;
  selectedIds: string[];
  onChangeSelectedIds: (ids: string[]) => void;
  onUpdateStudentPhoto: (studentId: string, photoDataUrl: string) => void;
  onAddQuickStudent: (student: Omit<Student, 'id'>) => void;
  onPrint: () => void;
  onExportPdf: () => void;
  exportingPdf: boolean;
}

export const StudentIdCardStudio: React.FC<StudentIdCardStudioProps> = ({
  students,
  filteredStudents,
  selectedClass,
  profile,
  sheetRef,
  selectedIds,
  onChangeSelectedIds,
  onUpdateStudentPhoto,
  onAddQuickStudent,
  onPrint,
  onExportPdf,
  exportingPdf,
}) => {
  const [scope, setScope] = useState<'filtered' | 'selected' | 'all'>('filtered');
  const [layoutMode, setLayoutMode] = useState<IdCardLayoutMode>('front_and_back');
  const [themeKey, setThemeKey] = useState<IdCardThemeKey>('emerald');
  const [sessionYear, setSessionYear] = useState('২০২৬');
  const [showQuickForm, setShowQuickForm] = useState(false);

  const [quickStudent, setQuickStudent] = useState<Omit<Student, 'id'>>({
    classLevel: selectedClass,
    section: 'ক শাখা',
    roll: '',
    name: '',
    gender: 'ছাত্র',
    fatherName: '',
    motherName: '',
    dob: '',
    guardianPhone: '',
    village: '',
    bloodGroup: '',
    photoDataUrl: undefined,
    sessionYear: '২০২৬',
  });

  const theme = CARD_THEMES[themeKey];

  const cardStudents = useMemo(() => {
    if (scope === 'all') return students;
    if (scope === 'selected') {
      const idSet = new Set(selectedIds);
      const picked = students.filter((s) => idSet.has(s.id));
      return picked.length > 0 ? picked : filteredStudents;
    }
    return filteredStudents;
  }, [scope, students, filteredStudents, selectedIds]);

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      onChangeSelectedIds(selectedIds.filter((x) => x !== id));
    } else {
      onChangeSelectedIds([...selectedIds, id]);
    }
  };

  const selectAllFiltered = () => {
    const ids = filteredStudents.map((s) => s.id);
    onChangeSelectedIds(ids);
    setScope('selected');
  };

  const handleQuickPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const dataUrl = await resizePhotoToDataUrl(file);
      setQuickStudent((prev) => ({ ...prev, photoDataUrl: dataUrl }));
    } catch {
      // ignore invalid image
    }
  };

  const handleRowPhotoUpload = async (
    studentId: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const dataUrl = await resizePhotoToDataUrl(file);
      onUpdateStudentPhoto(studentId, dataUrl);
    } catch {
      // ignore invalid image
    }
  };

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickStudent.name.trim()) return;
    onAddQuickStudent({
      ...quickStudent,
      roll: quickStudent.roll.trim() || toBanglaDigit(String(filteredStudents.length + 1).padStart(2, '0')),
      sessionYear,
    });
    setShowQuickForm(false);
    setQuickStudent({
      classLevel: selectedClass,
      section: 'ক শাখা',
      roll: '',
      name: '',
      gender: 'ছাত্র',
      fatherName: '',
      motherName: '',
      dob: '',
      guardianPhone: '',
      village: '',
      bloodGroup: '',
      photoDataUrl: undefined,
      sessionYear,
    });
  };

  const schoolName = profile.school || '৮২ নং কোলা সরকারি প্রাথমিক বিদ্যালয়';
  const schoolAddress = `${profile.villagePost ? profile.villagePost + ', ' : ''}${profile.upazila || 'আশাশুনি'}, ${profile.district || 'সাতক্ষীরা'}`;

  return (
    <div className="space-y-4">
      {/* Studio Controls */}
      <div className="no-print rounded-2xl bg-white border border-stone-200 p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-emerald-950 text-white flex items-center justify-center shrink-0">
              <CreditCard className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                শিক্ষার্থী আইডি কার্ড স্টুডিও (CR80 — A4 মার্জিনবিহীন)
              </h2>
              <p className="text-xs text-slate-500">
                একক বা সম্পূর্ণ শ্রেণির পরিচয়পত্র তৈরি, ছবি যুক্ত ও কাটিং গাইডসহ A4 প্রিন্ট/PDF করুন
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowQuickForm((v) => !v)}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-900 hover:bg-emerald-100 whitespace-nowrap"
            >
              <UserPlus className="h-4 w-4" aria-hidden="true" />
              <span>নতুন কার্ড তৈরি</span>
            </button>
            <button
              type="button"
              onClick={onExportPdf}
              disabled={exportingPdf || cardStudents.length === 0}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-emerald-700 px-3.5 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-60 whitespace-nowrap"
            >
              {exportingPdf ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <FileDown className="h-4 w-4" aria-hidden="true" />
              )}
              <span>{exportingPdf ? 'PDF তৈরি হচ্ছে...' : 'আইডি কার্ড PDF (A4)'}</span>
            </button>
            <button
              type="button"
              onClick={onPrint}
              disabled={cardStudents.length === 0}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#0F2922] px-3.5 text-xs font-semibold text-white hover:bg-emerald-950 disabled:opacity-60 whitespace-nowrap"
            >
              <Printer className="h-4 w-4" aria-hidden="true" />
              <span>A4 প্রিন্ট ({toBanglaDigit(cardStudents.length)} জন)</span>
            </button>
          </div>
        </div>

        {/* Options Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-600 mb-1">কার্ড প্রিন্ট তালিকা</label>
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value as 'filtered' | 'selected' | 'all')}
              className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 font-medium text-slate-800"
            >
              <option value="filtered">
                {selectedClass} ({toBanglaDigit(filteredStudents.length)} জন)
              </option>
              <option value="selected">
                নির্বাচিত শিক্ষার্থী ({toBanglaDigit(selectedIds.length)} জন)
              </option>
              <option value="all">সকল শ্রেণি ({toBanglaDigit(students.length)} জন)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-600 mb-1">কার্ডের লেআউট</label>
            <select
              value={layoutMode}
              onChange={(e) => setLayoutMode(e.target.value as IdCardLayoutMode)}
              className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 font-medium text-slate-800"
            >
              <option value="front_and_back">সামনে + পেছনে দুই পাশ (ফোল্ডিং জোড়া)</option>
              <option value="front_only">শুধু সামনের দিক (১ পৃষ্ঠায় ৮টি কার্ড)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-600 mb-1">কার্ডের রঙের থিম</label>
            <div className="flex gap-1.5">
              {(Object.keys(CARD_THEMES) as IdCardThemeKey[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setThemeKey(key)}
                  className={`flex-1 h-10 rounded-xl border text-[11px] font-semibold transition-colors whitespace-nowrap px-2 ${
                    themeKey === key
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {CARD_THEMES[key].label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-600 mb-1">শিক্ষাবর্ষ / মেয়াদ</label>
            <input
              type="text"
              value={sessionYear}
              onChange={(e) => setSessionYear(e.target.value)}
              placeholder="২০২৬"
              className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 font-semibold text-slate-800"
            />
          </div>
        </div>

        {/* Quick Create Card Form */}
        {showQuickForm && (
          <form
            onSubmit={handleQuickSubmit}
            className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-emerald-950">
                দ্রুত নতুন শিক্ষার্থীর তথ্য ও ছবি যোগ করে আইডি কার্ড তৈরি করুন
              </p>
              <button
                type="button"
                onClick={() => setShowQuickForm(false)}
                className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
              >
                বন্ধ করুন
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">শ্রেণি</label>
                <select
                  value={quickStudent.classLevel}
                  onChange={(e) => setQuickStudent({ ...quickStudent, classLevel: e.target.value })}
                  className="w-full h-9 rounded-lg border border-slate-200 bg-white px-2.5"
                >
                  {CLASS_LEVELS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">শিক্ষার্থীর নাম *</label>
                <input
                  type="text"
                  required
                  value={quickStudent.name}
                  onChange={(e) => setQuickStudent({ ...quickStudent, name: e.target.value })}
                  placeholder="পূর্ণ নাম লিখুন"
                  className="w-full h-9 rounded-lg border border-slate-200 bg-white px-2.5"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">রোল নং</label>
                <input
                  type="text"
                  value={quickStudent.roll}
                  onChange={(e) => setQuickStudent({ ...quickStudent, roll: e.target.value })}
                  placeholder="০৩"
                  className="w-full h-9 rounded-lg border border-slate-200 bg-white px-2.5"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">শাখা</label>
                <input
                  type="text"
                  value={quickStudent.section}
                  onChange={(e) => setQuickStudent({ ...quickStudent, section: e.target.value })}
                  placeholder="ক শাখা"
                  className="w-full h-9 rounded-lg border border-slate-200 bg-white px-2.5"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">পিতার নাম</label>
                <input
                  type="text"
                  value={quickStudent.fatherName}
                  onChange={(e) => setQuickStudent({ ...quickStudent, fatherName: e.target.value })}
                  className="w-full h-9 rounded-lg border border-slate-200 bg-white px-2.5"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">মাতার নাম</label>
                <input
                  type="text"
                  value={quickStudent.motherName}
                  onChange={(e) => setQuickStudent({ ...quickStudent, motherName: e.target.value })}
                  className="w-full h-9 rounded-lg border border-slate-200 bg-white px-2.5"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">জন্ম তারিখ ও রক্তের গ্রুপ</label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={quickStudent.dob}
                    onChange={(e) => setQuickStudent({ ...quickStudent, dob: e.target.value })}
                    placeholder="১২/০৫/২০১৬"
                    className="w-2/3 h-9 rounded-lg border border-slate-200 bg-white px-2"
                  />
                  <select
                    value={quickStudent.bloodGroup || ''}
                    onChange={(e) => setQuickStudent({ ...quickStudent, bloodGroup: e.target.value })}
                    className="w-1/3 h-9 rounded-lg border border-slate-200 bg-white px-1"
                  >
                    <option value="">রক্ত</option>
                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">অভিভাবকের মোবাইল ও গ্রাম</label>
                <div className="flex gap-1.5">
                  <input
                    type="tel"
                    value={quickStudent.guardianPhone}
                    onChange={(e) =>
                      setQuickStudent({ ...quickStudent, guardianPhone: e.target.value })
                    }
                    placeholder="017..."
                    className="w-1/2 h-9 rounded-lg border border-slate-200 bg-white px-2"
                  />
                  <input
                    type="text"
                    value={quickStudent.village}
                    onChange={(e) => setQuickStudent({ ...quickStudent, village: e.target.value })}
                    placeholder="গ্রাম"
                    className="w-1/2 h-9 rounded-lg border border-slate-200 bg-white px-2"
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <label className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                <Camera className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />
                <span>{quickStudent.photoDataUrl ? 'ছবি পরিবর্তন করুন' : 'শিক্ষার্থীর ছবি আপলোড করুন'}</span>
                <input type="file" accept="image/*" onChange={handleQuickPhoto} className="hidden" />
              </label>
              <button
                type="submit"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-800 px-4 text-xs font-semibold text-white hover:bg-emerald-900"
              >
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                <span>তালিকায় যোগ ও কার্ড তৈরি করুন</span>
              </button>
            </div>
          </form>
        )}

        {/* Per-Student Photo & Selection Strip */}
        {filteredStudents.length > 0 && (
          <div className="border-t border-stone-100 pt-3 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-slate-700">
                কার্ড নির্বাচন ও ছবি আপলোড ({selectedClass}):
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={selectAllFiltered}
                  className="text-emerald-800 font-semibold hover:underline"
                >
                  সবাইকে নির্বাচন করুন
                </button>
                {selectedIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => onChangeSelectedIds([])}
                    className="text-slate-500 hover:text-slate-800"
                  >
                    নির্বাচন মুছুন
                  </button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {filteredStudents.map((st) => {
                const isPicked = selectedIds.includes(st.id);
                return (
                  <div
                    key={st.id}
                    className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-xs transition-colors ${
                      isPicked
                        ? 'border-emerald-400 bg-emerald-50/70'
                        : 'border-stone-200 bg-stone-50/60'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        toggleSelect(st.id);
                        setScope('selected');
                      }}
                      className="flex items-center gap-2 min-w-0 text-left flex-1"
                    >
                      {isPicked ? (
                        <CheckSquare className="h-4 w-4 text-emerald-700 shrink-0" />
                      ) : (
                        <Square className="h-4 w-4 text-slate-400 shrink-0" />
                      )}
                      <span className="font-bold text-slate-700 tabular-nums shrink-0">
                        {toBanglaDigit(st.roll)}.
                      </span>
                      <span className="font-semibold text-slate-900 truncate">{st.name}</span>
                    </button>

                    <label className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-lg border border-stone-200 bg-white px-2 text-[11px] font-semibold text-slate-700 hover:bg-stone-100 shrink-0">
                      <Camera className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />
                      <span>{st.photoDataUrl ? 'ছবি বদল' : 'ছবি দিন'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleRowPhotoUpload(st.id, e)}
                        className="hidden"
                      />
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Printable A4 Sheet */}
      <div
        ref={sheetRef}
        className="print-only-sheet preserve-card-scale rounded-2xl bg-white border border-stone-200 p-4 sm:p-6 shadow-xs"
      >
        <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-4 text-[11px] text-slate-600">
          <span className="font-bold text-slate-900">
            {schoolName} — শিক্ষার্থী পরিচয়পত্র (ID Card) শিট
          </span>
          <span>
            মোট কার্ড: {toBanglaDigit(cardStudents.length)}টি · শিক্ষাবর্ষ: {sessionYear} (A4 মার্জিনবিহীন · ০ মিমি)
          </span>
        </div>

        {cardStudents.length === 0 ? (
          <div className="py-14 text-center text-sm text-slate-500">
            আইডি কার্ড তৈরি করার জন্য উপরে &ldquo;নতুন কার্ড তৈরি&rdquo; অথবা শিক্ষার্থী রেজিস্টারে শিক্ষার্থী যোগ করুন।
          </div>
        ) : (
          <div
            className={`grid gap-4 ${
              layoutMode === 'front_only'
                ? 'grid-cols-1 md:grid-cols-2 justify-items-center'
                : 'grid-cols-1 justify-items-center'
            }`}
          >
            {cardStudents.map((student) => (
              <div
                key={student.id}
                style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
                className={`${
                  layoutMode === 'front_and_back'
                    ? 'flex flex-col sm:flex-row items-center gap-3 p-2.5 border border-dashed border-slate-300 rounded-lg bg-slate-50/40'
                    : 'p-1.5 border border-dashed border-slate-300 rounded-lg'
                }`}
              >
                {/* FRONT SIDE (Standard CR80 ~ 86mm × 54mm) */}
                <div
                  style={{
                    width: '86mm',
                    height: '54mm',
                    borderColor: theme.border,
                    backgroundColor: '#FFFFFF',
                  }}
                  className="relative overflow-hidden rounded-lg border-2 flex flex-col justify-between text-slate-900 shadow-2xs shrink-0"
                >
                  {/* Watermark behind body */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.06]"
                  >
                    <img
                      src={GOVT_MONOGRAM_SRC}
                      alt=""
                      className="w-24 h-24 object-contain"
                    />
                  </div>

                  {/* Card Header with Two-Side Seals */}
                  <div
                    style={{ backgroundColor: theme.headerBg }}
                    className="relative z-10 px-2 py-1.5 flex items-center justify-between gap-1.5 text-white"
                  >
                    <img
                      src={GOVT_MONOGRAM_SRC}
                      alt="জাতীয় মনোগ্রাম"
                      className="h-7 w-7 rounded-full bg-white p-0.5 object-contain shrink-0"
                    />
                    <div className="flex-1 min-w-0 text-center leading-tight">
                      <p className="text-[7px] font-semibold tracking-tight text-emerald-100 truncate">
                        গণপ্রজাতন্ত্রী বাংলাদেশ সরকার · প্রাথমিক শিক্ষা অধিদপ্তর
                      </p>
                      <p className="text-[9px] font-extrabold text-white truncate">
                        {schoolName}
                      </p>
                      <p className="text-[7px] text-amber-200 font-bold tracking-wider uppercase">
                        শিক্ষার্থী পরিচয়পত্র (STUDENT ID CARD)
                      </p>
                    </div>
                    <img
                      src={DPE_LOGO_SRC}
                      alt="অধিদপ্তর লোগো"
                      className="h-7 w-7 rounded-md bg-white p-0.5 object-contain shrink-0"
                    />
                  </div>

                  {/* Card Body */}
                  <div className="relative z-10 px-2.5 py-1.5 flex items-center gap-2.5 flex-1">
                    {/* Photo + Roll */}
                    <div className="shrink-0 flex flex-col items-center gap-1">
                      <div
                        style={{ borderColor: theme.border }}
                        className="w-[17mm] h-[20.5mm] rounded border overflow-hidden bg-slate-100 flex items-center justify-center"
                      >
                        {student.photoDataUrl ? (
                          <img
                            src={student.photoDataUrl}
                            alt={student.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-slate-400">
                            <User className="h-6 w-6" aria-hidden="true" />
                            <span className="text-[6.5px] font-semibold mt-0.5">ছবি</span>
                          </div>
                        )}
                      </div>
                      <div
                        style={{
                          backgroundColor: theme.accentBg,
                          color: theme.accentText,
                          borderColor: theme.border,
                        }}
                        className="w-full text-center rounded border px-1 py-0.5 text-[7.5px] font-extrabold tabular-nums"
                      >
                        রোল: {toBanglaDigit(student.roll)}
                      </div>
                    </div>

                    {/* Student Details */}
                    <div className="flex-1 min-w-0 text-[8px] leading-[1.35] space-y-0.5">
                      <p
                        style={{ color: theme.accentText }}
                        className="text-[10px] font-extrabold truncate border-b border-slate-200 pb-0.5"
                      >
                        {student.name}
                      </p>
                      <p className="truncate">
                        <span className="font-semibold text-slate-600">শ্রেণি: </span>
                        <strong className="text-slate-900">{student.classLevel}</strong>
                        {student.section && student.section !== 'প্রযোজ্য নয়'
                          ? ` (${student.section})`
                          : ''}
                      </p>
                      <p className="truncate">
                        <span className="font-semibold text-slate-600">পিতা: </span>
                        <span className="text-slate-900">{student.fatherName || '—'}</span>
                      </p>
                      <p className="truncate">
                        <span className="font-semibold text-slate-600">মাতা: </span>
                        <span className="text-slate-900">{student.motherName || '—'}</span>
                      </p>
                      <div className="flex items-center justify-between gap-1 text-[7.5px]">
                        <span className="truncate tabular-nums">
                          <strong className="text-slate-600">জন্ম: </strong>
                          {student.dob ? toBanglaDigit(student.dob) : '—'}
                        </span>
                        {student.bloodGroup && (
                          <span className="font-bold text-rose-700 shrink-0">
                            রক্ত: {student.bloodGroup}
                          </span>
                        )}
                      </div>
                      <p className="truncate tabular-nums">
                        <span className="font-semibold text-slate-600">মোবাইল: </span>
                        <strong className="text-slate-900 font-mono text-[8px]">
                          {student.guardianPhone || '—'}
                        </strong>
                      </p>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div
                    style={{ backgroundColor: theme.accentBg, borderTopColor: '#CBD5E1' }}
                    className="relative z-10 px-2.5 py-1 border-t flex items-end justify-between text-[7px]"
                  >
                    <span style={{ color: theme.accentText }} className="font-bold">
                      শিক্ষাবর্ষ: {student.sessionYear || sessionYear}
                    </span>
                    <div className="text-right">
                      <span className="inline-block border-t border-slate-700 pt-0.5 px-1.5 font-bold text-slate-800">
                        প্রধান শিক্ষকের স্বাক্ষর
                      </span>
                    </div>
                  </div>
                </div>

                {/* BACK SIDE (Only when Front + Back mode is active) */}
                {layoutMode === 'front_and_back' && (
                  <div
                    style={{
                      width: '86mm',
                      height: '54mm',
                      borderColor: theme.border,
                      backgroundColor: '#FFFFFF',
                    }}
                    className="relative overflow-hidden rounded-lg border-2 flex flex-col justify-between text-slate-900 shadow-2xs shrink-0"
                  >
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.05]"
                    >
                      <img
                        src={DPE_LOGO_SRC}
                        alt=""
                        className="w-24 h-24 object-contain"
                      />
                    </div>

                    {/* Back Header */}
                    <div
                      style={{ backgroundColor: theme.headerBg }}
                      className="relative z-10 px-2.5 py-1 text-center text-white"
                    >
                      <p className="text-[8px] font-bold tracking-wide">
                        পরিচয়পত্রের জরুরি তথ্য ও নির্দেশনাবলি
                      </p>
                    </div>

                    {/* Back Body */}
                    <div className="relative z-10 px-3 py-2 text-[8px] leading-relaxed space-y-1 flex-1">
                      <p className="truncate">
                        <strong className="text-slate-700">শিক্ষার্থীর গ্রাম/ঠিকানা: </strong>
                        {student.village || '—'}
                      </p>
                      <p className="truncate">
                        <strong className="text-slate-700">বিদ্যালয়ের ঠিকানা: </strong>
                        {schoolAddress}
                      </p>
                      <div className="flex items-center justify-between gap-2 tabular-nums">
                        <span>
                          <strong className="text-slate-700">উপবৃত্তি/আইডি: </strong>
                          {student.stipendId || student.id.slice(-6).toUpperCase()}
                        </span>
                        <span>
                          <strong className="text-slate-700">বিদ্যালয় যোগাযোগ: </strong>
                          {profile.phone || '—'}
                        </span>
                      </div>

                      <div
                        style={{ backgroundColor: theme.accentBg }}
                        className="rounded border border-slate-200 px-2 py-1.5 mt-1 text-[7.3px] text-slate-700 leading-snug"
                      >
                        <p className="font-bold text-slate-900 mb-0.5">জরুরি নির্দেশনা:</p>
                        <p>
                          ১. বিদ্যালয়ে অবস্থানকালে পরিচয়পত্র গলায় ঝুলিয়ে রাখা বাধ্যতামূলক।
                        </p>
                        <p>
                          ২. কার্ডটি হারিয়ে গেলে অনুগ্রহ করে নিকটস্থ বিদ্যালয় বা উপরোক্ত নম্বরে যোগাযোগ করুন।
                        </p>
                      </div>
                    </div>

                    {/* Back Footer */}
                    <div
                      style={{ backgroundColor: theme.headerBg }}
                      className="relative z-10 px-2.5 py-1 flex items-center justify-between text-[7px] text-emerald-100"
                    >
                      <span>{schoolName}</span>
                      <span className="font-semibold text-white">
                        মেয়াদ: ডিসেম্বর {student.sessionYear || sessionYear}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
