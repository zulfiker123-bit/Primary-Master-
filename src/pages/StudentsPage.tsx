import React, { useState, useMemo, useRef } from 'react';
import {
  UserPlus,
  ArrowUpCircle,
  Share2,
  Upload,
  Search,
  Trash2,
  X,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  CreditCard,
  ListChecks,
  Camera,
  BookOpenCheck,
} from 'lucide-react';
import { PageShell } from '../components/PageShell';
import { OfficialA4Letterhead } from '../components/OfficialEmblems';
import { StudentSummaryDashboard } from '../components/StudentSummaryDashboard';
import { StudentFlnModal } from '../components/StudentFlnModal';
import { resizePhotoToDataUrl, StudentIdCardStudio } from '../components/StudentIdCardStudio';
import { CLASS_LEVELS } from '../data/curriculum';
import {
  buildInitialFlnRecords,
  FLN_INDICATORS_BY_CLASS,
  FLN_LEVEL_META,
  FLN_MONTHS,
  FlnLevel,
  FlnMonthlyCheckEntry,
  FlnStudentRecord,
  getMonthTargetForClass,
} from '../data/flnFramework';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { RouteKey, Student, TeacherProfile } from '../types';
import { downloadJsonFile, toBanglaDigit } from '../utils/bangla';
import { findStudentFlnRecord, summarizeStudentFlnMonth } from '../utils/flnStudentSync';
import { exportElementToA4Pdf } from '../utils/pdfExport';
import {
  downloadStudentExcelTemplate,
  exportStudentsToExcel,
  parseStudentsFromExcel,
} from '../utils/studentExcel';
import { triggerSmartPrint } from '../utils/printHelper';

interface StudentsPageProps {
  profile: TeacherProfile;
  onNavigate: (route: RouteKey) => void;
}

const INITIAL_STUDENTS: Student[] = [
  {
    id: 'st-1',
    classLevel: 'পঞ্চম শ্রেণি',
    section: 'ক শাখা',
    roll: '০১',
    name: 'আফসানা মিমি',
    gender: 'ছাত্রী',
    fatherName: 'মো: জহিরুল ইসলাম',
    motherName: 'নাজমা আক্তার',
    dob: '১২/০৩/২০১৫',
    guardianPhone: '01711223344',
    village: 'কোলা',
  },
  {
    id: 'st-2',
    classLevel: 'পঞ্চম শ্রেণি',
    section: 'ক শাখা',
    roll: '০২',
    name: 'মেহেদী হাসান',
    gender: 'ছাত্র',
    fatherName: 'আবদুল করিম',
    motherName: 'রেহানা পারভীন',
    dob: '২৫/০৬/২০১৫',
    guardianPhone: '01812334455',
    village: 'মাড়িয়ালা',
  },
];

export default function StudentsPage({ profile, onNavigate }: StudentsPageProps) {
  const [students, setStudents] = useLocalStorage<Student[]>('students_list_v1', INITIAL_STUDENTS);
  const [flnRecords, setFlnRecords] = useLocalStorage<FlnStudentRecord[]>(
    'monthly_fln_records_v1',
    buildInitialFlnRecords()
  );
  const [selectedFlnMonth, setSelectedFlnMonth] = useState<number>(() => new Date().getMonth());
  const [activeFlnStudent, setActiveFlnStudent] = useState<Student | null>(null);
  const [viewMode, setViewMode] = useState<'register' | 'id_cards'>('register');
  const [selectedIdCardIds, setSelectedIdCardIds] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState('পঞ্চম শ্রেণি');
  const [selectedSection, setSelectedSection] = useState('সকল শাখা');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [initialFlnLevel, setInitialFlnLevel] = useState<'' | FlnLevel>('');
  const [excelBusy, setExcelBusy] = useState(false);
  const [excelStatus, setExcelStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [excelImportPreview, setExcelImportPreview] = useState<{
    fileName: string;
    rows: Student[];
  } | null>(null);

  const restoreRef = useRef<HTMLInputElement>(null);
  const excelUploadRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<Omit<Student, 'id'>>({
    classLevel: 'পঞ্চম শ্রেণি',
    section: 'প্রযোজ্য নয়',
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
  });

  const filtered = useMemo(() => {
    return students.filter((s) => {
      const mClass = s.classLevel === selectedClass;
      const mSec = selectedSection === 'সকল শাখা' || s.section === selectedSection;
      const mSearch =
        !search.trim() ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.roll.includes(search) ||
        s.fatherName.toLowerCase().includes(search.toLowerCase());
      return mClass && mSec && mSearch;
    });
  }, [students, selectedClass, selectedSection, search]);

  const handleSaveStudentFln = (
    student: Student,
    monthIndex: number,
    entry: FlnMonthlyCheckEntry
  ) => {
    const monthKey = String(monthIndex);
    const directId = `fln-imp-${student.id}`;
    const targetName = student.name.trim().toLowerCase();

    setFlnRecords((prev) => {
      const idx = prev.findIndex(
        (r) =>
          r.id === directId ||
          (r.classLevel === student.classLevel &&
            r.studentName.trim().toLowerCase() === targetName)
      );

      if (idx !== -1) {
        return prev.map((rec, i) =>
          i === idx
            ? {
                ...rec,
                classLevel: student.classLevel,
                roll: student.roll,
                studentName: student.name,
                months: {
                  ...rec.months,
                  [monthKey]: entry,
                },
              }
            : rec
        );
      }

      return [
        ...prev,
        {
          id: directId,
          classLevel: student.classLevel,
          roll: student.roll,
          studentName: student.name,
          months: {
            [monthKey]: entry,
          },
        },
      ];
    });

    setExcelStatus({
      type: 'success',
      message: `${student.name}-এর ${FLN_MONTHS[monthIndex]?.name || ''} মাসের FLN তথ্য সংরক্ষণ করা হয়েছে।`,
    });
  };

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    const newId = `st-${Date.now()}`;
    const resolvedRoll = form.roll || String(filtered.length + 1).padStart(2, '0');
    const createdStudent: Student = {
      ...form,
      id: newId,
      roll: resolvedRoll,
    };
    setStudents((prev) => [...prev, createdStudent]);

    if (initialFlnLevel) {
      const inds =
        FLN_INDICATORS_BY_CLASS[createdStudent.classLevel] ||
        FLN_INDICATORS_BY_CLASS['তৃতীয় শ্রেণি'];
      const target = getMonthTargetForClass(selectedFlnMonth, createdStudent.classLevel);
      const indMap: Record<string, FlnLevel> = {};
      inds.forEach((ind) => {
        indMap[ind.id] = initialFlnLevel;
      });
      const defaultWpm =
        initialFlnLevel === 'mastered'
          ? target.readingWpmGoal
          : initialFlnLevel === 'developing'
          ? Math.max(10, Math.round(target.readingWpmGoal * 0.75))
          : Math.max(5, Math.round(target.readingWpmGoal * 0.45));
      const defaultMath =
        initialFlnLevel === 'mastered' ? 85 : initialFlnLevel === 'developing' ? 68 : 45;

      handleSaveStudentFln(createdStudent, selectedFlnMonth, {
        readingWpm: defaultWpm,
        mathScore: defaultMath,
        indicators: indMap,
        remark: FLN_LEVEL_META[initialFlnLevel].label,
      });
    }

    setShowAddModal(false);
    setInitialFlnLevel('');
    setForm({
      classLevel: selectedClass,
      section: 'প্রযোজ্য নয়',
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
    });
  };

  const handleUpdateStudentPhoto = (studentId: string, photoDataUrl: string) => {
    setStudents((prev) =>
      prev.map((st) => (st.id === studentId ? { ...st, photoDataUrl } : st))
    );
    setExcelStatus({
      type: 'success',
      message: 'শিক্ষার্থীর ছবি আইডি কার্ডের জন্য সংরক্ষণ করা হয়েছে।',
    });
  };

  const handleAddQuickIdCardStudent = (studentData: Omit<Student, 'id'>) => {
    const newId = `st-${Date.now()}`;
    setStudents((prev) => [...prev, { ...studentData, id: newId }]);
    setSelectedIdCardIds((prev) => [...prev, newId]);
    setExcelStatus({
      type: 'success',
      message: `${studentData.name}-এর তথ্য ও আইডি কার্ড তৈরি হয়েছে।`,
    });
  };

  const handleModalPhotoSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const dataUrl = await resizePhotoToDataUrl(file);
      setForm((prev) => ({ ...prev, photoDataUrl: dataUrl }));
    } catch {
      // ignore invalid file
    }
  };

  const handlePromoteClass = () => {
    const idx = CLASS_LEVELS.indexOf(selectedClass);
    if (idx === -1 || idx >= CLASS_LEVELS.length - 1) return;
    const nextClass = CLASS_LEVELS[idx + 1];
    setStudents((prev) =>
      prev.map((s) => (s.classLevel === selectedClass ? { ...s, classLevel: nextClass } : s))
    );
    setSelectedClass(nextClass);
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (Array.isArray(parsed)) {
          setStudents(parsed);
          setExcelStatus({
            type: 'success',
            message: `JSON ফাইল থেকে ${toBanglaDigit(parsed.length)} জন শিক্ষার্থীর তথ্য রিস্টোর করা হয়েছে।`,
          });
        } else {
          setExcelStatus({
            type: 'error',
            message: 'সঠিক JSON ব্যাকআপ ফাইল নির্বাচন করুন।',
          });
        }
      } catch {
        setExcelStatus({
          type: 'error',
          message: 'JSON ফাইলটি পড়া যায়নি। সঠিক ব্যাকআপ ফাইল দিন।',
        });
      }
    };
    reader.readAsText(file);
  };

  const handleExportExcel = async (scope: 'filtered' | 'all') => {
    const target = scope === 'filtered' ? filtered : students;
    if (target.length === 0) {
      setExcelStatus({
        type: 'error',
        message:
          scope === 'filtered'
            ? `${selectedClass}-এ সেভ করার মতো কোনো শিক্ষার্থী নেই।`
            : 'এক্সপোর্ট করার মতো কোনো শিক্ষার্থীর তথ্য নেই।',
      });
      return;
    }

    setExcelBusy(true);
    setExcelStatus(null);
    try {
      const fileSlug =
        scope === 'filtered'
          ? `students-${selectedClass.replace(/\s+/g, '-')}.xlsx`
          : 'all-students-list.xlsx';
      await exportStudentsToExcel(target, fileSlug);
      setExcelStatus({
        type: 'success',
        message: `${toBanglaDigit(target.length)} জন শিক্ষার্থীর তথ্য Excel (.xlsx) ফাইলে সংরক্ষণ করা হয়েছে।`,
      });
    } catch {
      setExcelStatus({
        type: 'error',
        message: 'Excel ফাইল তৈরি করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।',
      });
    } finally {
      setExcelBusy(false);
    }
  };

  const handleDownloadTemplate = async () => {
    setExcelBusy(true);
    setExcelStatus(null);
    try {
      await downloadStudentExcelTemplate(selectedClass);
      setExcelStatus({
        type: 'success',
        message: 'নমুনা Excel টেমপ্লেট (.xlsx) ডাউনলোড হয়েছে। এই ফরম্যাটে তথ্য পূরণ করে আপলোড করুন।',
      });
    } catch {
      setExcelStatus({
        type: 'error',
        message: 'নমুনা টেমপ্লেট ডাউনলোড করা যায়নি।',
      });
    } finally {
      setExcelBusy(false);
    }
  };

  const handleExcelFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setExcelBusy(true);
    setExcelStatus(null);
    try {
      const parsed = await parseStudentsFromExcel(file, selectedClass);
      if (parsed.length === 0) {
        setExcelStatus({
          type: 'error',
          message:
            'নির্বাচিত Excel ফাইলে কোনো শিক্ষার্থীর নাম পাওয়া যায়নি। নমুনা ফরম্যাট দেখে কলামের নাম ঠিক আছে কিনা যাচাই করুন।',
        });
        return;
      }
      setExcelImportPreview({ fileName: file.name, rows: parsed });
    } catch {
      setExcelStatus({
        type: 'error',
        message: 'Excel/CSV ফাইলটি পড়া যায়নি। অনুগ্রহ করে .xlsx, .xls অথবা .csv ফাইল আপলোড করুন।',
      });
    } finally {
      setExcelBusy(false);
    }
  };

  const confirmExcelImport = (mode: 'append' | 'replace') => {
    if (!excelImportPreview) return;
    const incoming = excelImportPreview.rows;
    if (mode === 'replace') {
      setStudents(incoming);
    } else {
      setStudents((prev) => [...prev, ...incoming]);
    }

    const firstClass = incoming[0]?.classLevel;
    if (firstClass && CLASS_LEVELS.includes(firstClass)) {
      setSelectedClass(firstClass);
    }

    setExcelStatus({
      type: 'success',
      message:
        mode === 'replace'
          ? `Excel থেকে ${toBanglaDigit(incoming.length)} জন শিক্ষার্থীর তথ্য দিয়ে তালিকা প্রতিস্থাপন করা হয়েছে।`
          : `Excel থেকে ${toBanglaDigit(incoming.length)} জন নতুন শিক্ষার্থী তালিকায় যোগ করা হয়েছে।`,
    });
    setExcelImportPreview(null);
  };

  const [exportingPdf, setExportingPdf] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const idCardSheetRef = useRef<HTMLDivElement>(null);

  const handleExportPdf = async () => {
    const targetEl = viewMode === 'id_cards' ? idCardSheetRef.current : sheetRef.current;
    if (!targetEl || exportingPdf) return;
    setExportingPdf(true);
    try {
      const prefix = viewMode === 'id_cards' ? 'student-id-cards' : 'students';
      await exportElementToA4Pdf(
        targetEl,
        `${prefix}-${selectedClass.replace(/\s+/g, '-')}`
      );
    } finally {
      setExportingPdf(false);
    }
  };

  const handlePrintActive = () => {
    const targetEl = viewMode === 'id_cards' ? idCardSheetRef.current : sheetRef.current;
    const prefix = viewMode === 'id_cards' ? 'student-id-cards' : 'students';
    triggerSmartPrint({
      element: targetEl,
      filename: `${prefix}-${selectedClass.replace(/\s+/g, '-')}`,
    });
  };

  return (
    <PageShell
      title="শিক্ষার্থীর তথ্য, রেজিস্টার ও আইডি কার্ড"
      subtitle="শ্রেণিভিত্তিক শিক্ষার্থী প্রোফাইল, আইডি কার্ড তৈরি ও প্রিন্ট, Excel সেভ/আপলোড এবং মার্জিনবিহীন A4 PDF"
      onNavigate={onNavigate}
      onPrint={handlePrintActive}
      printLabel={viewMode === 'id_cards' ? 'আইডি কার্ড প্রিন্ট (A4)' : 'A4 প্রিন্ট'}
      onExportPdf={handleExportPdf}
      exportingPdf={exportingPdf}
      pdfLabel={viewMode === 'id_cards' ? 'আইডি কার্ড PDF' : 'PDF সংরক্ষণ'}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setForm((f) => ({ ...f, classLevel: selectedClass }));
              setShowAddModal(true);
            }}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 text-xs font-semibold text-white hover:bg-emerald-700 whitespace-nowrap shrink-0"
          >
            <UserPlus className="h-4 w-4" aria-hidden="true" />
            <span>নতুন ভর্তি</span>
          </button>
          <button
            type="button"
            disabled={excelBusy}
            onClick={() => handleExportExcel(filtered.length > 0 ? 'filtered' : 'all')}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-60 whitespace-nowrap shrink-0"
          >
            {excelBusy ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
            )}
            <span>Excel সেভ</span>
          </button>
          <button
            type="button"
            disabled={excelBusy}
            onClick={() => excelUploadRef.current?.click()}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 text-xs font-semibold text-blue-800 hover:bg-blue-100 disabled:opacity-60 whitespace-nowrap shrink-0"
          >
            <Upload className="h-4 w-4" aria-hidden="true" />
            <span>Excel আপলোড</span>
          </button>
          <button
            type="button"
            onClick={() => downloadJsonFile(students, 'students-backup.json')}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
          >
            <Share2 className="h-4 w-4" aria-hidden="true" />
            <span>JSON শেয়ার</span>
          </button>
          <button
            type="button"
            onClick={() => restoreRef.current?.click()}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
          >
            <Upload className="h-4 w-4" aria-hidden="true" />
            <span>রিস্টোর</span>
          </button>
          <input
            ref={excelUploadRef}
            type="file"
            accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
            onChange={handleExcelFileSelected}
            className="hidden"
          />
          <input
            ref={restoreRef}
            type="file"
            accept="application/json"
            onChange={handleRestore}
            className="hidden"
          />
        </div>
      }
    >
      {/* Excel / Status Notification */}
      {excelStatus && (
        <div
          role="status"
          className={`no-print mb-4 flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-xs sm:text-sm ${
            excelStatus.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border-rose-200 bg-rose-50 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            {excelStatus.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" aria-hidden="true" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" aria-hidden="true" />
            )}
            <span>{excelStatus.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setExcelStatus(null)}
            aria-label="বার্তা বন্ধ করুন"
            className="p-1 opacity-70 hover:opacity-100 shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Summary Dashboard */}
      <StudentSummaryDashboard
        allStudents={students}
        filteredStudents={filtered}
        selectedClass={selectedClass}
        selectedSection={selectedSection}
        flnRecords={flnRecords}
        selectedFlnMonth={selectedFlnMonth}
        onOpenFlnPage={() => onNavigate('monthly_fln')}
      />

      {/* Filters & Excel Sheet Quick Actions */}
      <div className="no-print mb-5 rounded-2xl bg-white border border-slate-200 p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            aria-label="শ্রেণি নির্বাচন"
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
          >
            {CLASS_LEVELS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            aria-label="শাখা নির্বাচন"
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
          >
            <option value="সকল শাখা">সকল শাখা</option>
            <option value="প্রযোজ্য নয়">প্রযোজ্য নয়</option>
            <option value="ক শাখা">ক শাখা</option>
            <option value="খ শাখা">খ শাখা</option>
            <option value="গ শাখা">গ শাখা</option>
          </select>

          <select
            value={selectedFlnMonth}
            onChange={(e) => setSelectedFlnMonth(Number(e.target.value))}
            aria-label="FLN মাস নির্বাচন"
            className="rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-2 text-sm font-medium text-emerald-950"
          >
            {FLN_MONTHS.map((m) => (
              <option key={m.index} value={m.index}>
                FLN: {m.name}
              </option>
            ))}
          </select>

          <div className="relative flex-1 min-w-[200px]">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="নাম, রোল বা পিতার নাম খুঁজুন..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-sm"
            />
          </div>

          {selectedClass !== 'পঞ্চম শ্রেণি' && filtered.length > 0 && (
            <button
              type="button"
              onClick={handlePromoteClass}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 border border-amber-200 px-3.5 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-100 whitespace-nowrap"
            >
              <ArrowUpCircle className="h-4 w-4" />
              <span>শ্রেণি আপডেট (প্রমোশন)</span>
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <FileSpreadsheet className="h-4 w-4 text-emerald-600 shrink-0" aria-hidden="true" />
            <span>
              Excel শীট (.xlsx / .xls / .csv) দিয়ে শিক্ষার্থীদের তথ্য সেভ ও বাল্ক আপলোড করুন
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={excelBusy}
              onClick={() => handleExportExcel('filtered')}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60 whitespace-nowrap"
            >
              <Download className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
              <span>{selectedClass} Excel সেভ ({toBanglaDigit(filtered.length)})</span>
            </button>
            <button
              type="button"
              disabled={excelBusy}
              onClick={() => handleExportExcel('all')}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60 whitespace-nowrap"
            >
              <Download className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
              <span>সকল শ্রেণির Excel ({toBanglaDigit(students.length)})</span>
            </button>
            <button
              type="button"
              disabled={excelBusy}
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 whitespace-nowrap"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
              <span>নমুনা ফরম্যাট (.xlsx)</span>
            </button>
          </div>
        </div>
      </div>

      {/* View Switcher: Register vs Student ID Cards */}
      <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white border border-slate-200 p-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setViewMode('register')}
            className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 text-xs sm:text-sm font-bold transition-colors whitespace-nowrap ${
              viewMode === 'register'
                ? 'bg-[#0F2922] text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ListChecks className="h-4 w-4" aria-hidden="true" />
            <span>শিক্ষার্থী রেজিস্টার তালিকা ({toBanglaDigit(filtered.length)})</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('id_cards')}
            className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 text-xs sm:text-sm font-bold transition-colors whitespace-nowrap ${
              viewMode === 'id_cards'
                ? 'bg-[#0F2922] text-white'
                : 'bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <CreditCard className="h-4 w-4" aria-hidden="true" />
            <span>আইডি কার্ড তৈরি ও প্রিন্ট (A4)</span>
          </button>
        </div>
        <span className="text-xs text-slate-500 px-2">
          A4 মার্জিনবিহীন (০ মিমি) · সরাসরি প্রিন্ট ও PDF সেভ
        </span>
      </div>

      {/* Printable Student Table OR Student ID Card Studio */}
      {viewMode === 'id_cards' ? (
        <StudentIdCardStudio
          students={students}
          filteredStudents={filtered}
          selectedClass={selectedClass}
          profile={profile}
          sheetRef={idCardSheetRef}
          selectedIds={selectedIdCardIds}
          onChangeSelectedIds={setSelectedIdCardIds}
          onUpdateStudentPhoto={handleUpdateStudentPhoto}
          onAddQuickStudent={handleAddQuickIdCardStudent}
          onPrint={handlePrintActive}
          onExportPdf={handleExportPdf}
          exportingPdf={exportingPdf}
        />
      ) : (
        <div
          ref={sheetRef}
          className="print-only-sheet rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 shadow-xs"
        >
          <OfficialA4Letterhead
            schoolName={profile.school}
            addressLine={`${profile.villagePost ? profile.villagePost + ', ' : ''}${profile.upazila}, ${profile.district}`}
            documentTitle={`শিক্ষার্থী তালিকা, রেজিস্টার ও FLN — ${selectedClass}`}
            subtitle={`মোট শিক্ষার্থী: ${toBanglaDigit(filtered.length)} জন · FLN মাস: ${FLN_MONTHS[selectedFlnMonth]?.name || ''}`}
            compact
          />

          {filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-500">
              এই শ্রেণিতে এখনো কোনো শিক্ষার্থীর তথ্য নেই। নতুন শিক্ষার্থী যোগ করতে &lsquo;নতুন ভর্তি&rsquo;, &lsquo;Excel আপলোড&rsquo; বা &lsquo;রিস্টোর&rsquo; বাটনে ক্লিক করুন।
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-slate-300 text-xs sm:text-sm min-w-[920px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 text-left">
                    <th className="border border-slate-300 p-2 text-center">রোল</th>
                    <th className="border border-slate-300 p-2">শিক্ষার্থীর নাম</th>
                    <th className="border border-slate-300 p-2">লিঙ্গ</th>
                    <th className="border border-slate-300 p-2">পিতা ও মাতার নাম</th>
                    <th className="border border-slate-300 p-2">জন্ম তারিখ</th>
                    <th className="border border-slate-300 p-2">মোবাইল</th>
                    <th className="border border-slate-300 p-2">গ্রাম</th>
                    <th className="border border-slate-300 p-2">FLN তথ্য</th>
                    <th className="no-print border border-slate-300 p-2 text-center">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => {
                    const matchedFln = findStudentFlnRecord(s, flnRecords);
                    const flnSummary = summarizeStudentFlnMonth(
                      matchedFln,
                      s.classLevel,
                      selectedFlnMonth
                    );
                    const flnMeta = flnSummary.overall ? FLN_LEVEL_META[flnSummary.overall] : null;

                    return (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="border border-slate-300 p-2 text-center font-bold tabular-nums">
                          {toBanglaDigit(s.roll)}
                        </td>
                        <td className="border border-slate-300 p-2 font-semibold">
                          <div className="flex items-center gap-2">
                            {s.photoDataUrl && (
                              <img
                                src={s.photoDataUrl}
                                alt={s.name}
                                className="h-7 w-6 rounded object-cover border border-slate-200 shrink-0"
                              />
                            )}
                            <span>{s.name}</span>
                          </div>
                        </td>
                        <td className="border border-slate-300 p-2">{s.gender}</td>
                        <td className="border border-slate-300 p-2 text-xs">
                          পিতা: {s.fatherName}
                          <br />
                          মাতা: {s.motherName}
                        </td>
                        <td className="border border-slate-300 p-2 tabular-nums">
                          {toBanglaDigit(s.dob)}
                        </td>
                        <td className="border border-slate-300 p-2 font-mono text-xs">
                          {s.guardianPhone}
                        </td>
                        <td className="border border-slate-300 p-2">{s.village}</td>
                        <td className="border border-slate-300 p-2">
                          {flnSummary.hasData && flnMeta ? (
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span
                                  className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-bold whitespace-nowrap tabular-nums ${flnMeta.badgeClass}`}
                                >
                                  <span>{flnMeta.symbol}</span>
                                  <span>
                                    {flnMeta.shortLabel} ({toBanglaDigit(flnSummary.percent)}%)
                                  </span>
                                </span>
                                {flnSummary.isFallbackMonth && (
                                  <span className="text-[10px] text-slate-500">
                                    ({flnSummary.monthName})
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-600 tabular-nums whitespace-nowrap">
                                পঠন: {toBanglaDigit(flnSummary.readingWpm ?? 0)} WPM · গণিত:{' '}
                                {toBanglaDigit(flnSummary.mathScore ?? 0)}%
                              </div>
                              <div className="text-[10px] text-slate-500 tabular-nums">
                                সূচক: {toBanglaDigit(flnSummary.masteredCount)}/
                                {toBanglaDigit(flnSummary.totalIndicators)} অর্জিত
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[11px] text-slate-400">মূল্যায়ন বাকি</span>
                              <button
                                type="button"
                                onClick={() => setActiveFlnStudent(s)}
                                className="no-print text-[11px] font-semibold text-emerald-800 hover:underline whitespace-nowrap"
                              >
                                + লিখুন
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="no-print border border-slate-300 p-2 text-center">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setActiveFlnStudent(s)}
                              title="এই শিক্ষার্থীর FLN তথ্য দেখুন ও আপডেট করুন"
                              className="inline-flex h-8 items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2 text-[11px] font-semibold text-blue-800 hover:bg-blue-100 whitespace-nowrap"
                            >
                              <BookOpenCheck className="h-3.5 w-3.5" aria-hidden="true" />
                              <span>FLN</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedIdCardIds([s.id]);
                                setViewMode('id_cards');
                              }}
                              title="এই শিক্ষার্থীর আইডি কার্ড দেখুন ও প্রিন্ট করুন"
                              className="inline-flex h-8 items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-100 whitespace-nowrap"
                            >
                              <CreditCard className="h-3.5 w-3.5" aria-hidden="true" />
                              <span>আইডি কার্ড</span>
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setStudents((prev) => prev.filter((x) => x.id !== s.id))
                              }
                              aria-label="শিক্ষার্থী মুছুন"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-rose-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add Student Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-lg font-bold text-slate-900">নতুন শিক্ষার্থী ভর্তি</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddStudent} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">শ্রেণি</label>
                  <select
                    value={form.classLevel}
                    onChange={(e) => setForm({ ...form, classLevel: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  >
                    {CLASS_LEVELS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">শাখা</label>
                  <select
                    value={form.section}
                    onChange={(e) => setForm({ ...form, section: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
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
                  <label className="block text-xs font-semibold text-slate-600 mb-1">শিক্ষার্থীর নাম</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">রোল</label>
                  <input
                    type="text"
                    value={form.roll}
                    onChange={(e) => setForm({ ...form, roll: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">পিতার নাম</label>
                  <input
                    type="text"
                    required
                    value={form.fatherName}
                    onChange={(e) => setForm({ ...form, fatherName: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">মাতার নাম</label>
                  <input
                    type="text"
                    required
                    value={form.motherName}
                    onChange={(e) => setForm({ ...form, motherName: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">লিঙ্গ</label>
                  <select
                    value={form.gender}
                    onChange={(e) =>
                      setForm({ ...form, gender: e.target.value as 'ছাত্র' | 'ছাত্রী' })
                    }
                    className="w-full rounded-xl border border-slate-200 px-2.5 py-2 text-xs"
                  >
                    <option value="ছাত্র">ছাত্র</option>
                    <option value="ছাত্রী">ছাত্রী</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">জন্ম তারিখ</label>
                  <input
                    type="text"
                    placeholder="১২/০৫/২০১৭"
                    value={form.dob}
                    onChange={(e) => setForm({ ...form, dob: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-2.5 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">মোবাইল</label>
                  <input
                    type="tel"
                    value={form.guardianPhone}
                    onChange={(e) => setForm({ ...form, guardianPhone: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-2.5 py-2 text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">গ্রাম/ঠিকানা</label>
                  <input
                    type="text"
                    value={form.village}
                    onChange={(e) => setForm({ ...form, village: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">রক্তের গ্রুপ (ঐচ্ছিক)</label>
                  <select
                    value={form.bloodGroup || ''}
                    onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  >
                    <option value="">নির্বাচন করুন</option>
                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  প্রাথমিক FLN অবস্থা ({FLN_MONTHS[selectedFlnMonth]?.name}) — ঐচ্ছিক
                </label>
                <select
                  value={initialFlnLevel}
                  onChange={(e) => setInitialFlnLevel(e.target.value as '' | FlnLevel)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="">পরে মূল্যায়ন করবো</option>
                  <option value="mastered">● অর্জিত (দক্ষ)</option>
                  <option value="developing">◐ অগ্রসরমান (মধ্যম)</option>
                  <option value="remedial">▲ সহায়তা প্রয়োজন</option>
                </select>
              </div>
              <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <span className="text-xs font-semibold text-slate-600">
                  আইডি কার্ডের ছবি (ঐচ্ছিক):
                </span>
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-50">
                  <Camera className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{form.photoDataUrl ? 'ছবি যুক্ত হয়েছে ✓' : 'ছবি আপলোড'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleModalPhotoSelected}
                    className="hidden"
                  />
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Excel Import Preview Modal */}
      {excelImportPreview && (
        <div
          className="no-print fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Excel থেকে শিক্ষার্থী আপলোড প্রিভিউ</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  ফাইল: <span className="font-semibold text-slate-700">{excelImportPreview.fileName}</span> · মোট{' '}
                  <span className="font-semibold text-emerald-700">
                    {toBanglaDigit(excelImportPreview.rows.length)} জন
                  </span>{' '}
                  শিক্ষার্থীর তথ্য পাওয়া গেছে
                </p>
              </div>
              <button
                type="button"
                onClick={() => setExcelImportPreview(null)}
                aria-label="প্রিভিউ বন্ধ করুন"
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 mb-4">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 text-left">
                    <th className="border-b border-slate-200 px-3 py-2 text-center">রোল</th>
                    <th className="border-b border-slate-200 px-3 py-2">নাম</th>
                    <th className="border-b border-slate-200 px-3 py-2">শ্রেণি ও শাখা</th>
                    <th className="border-b border-slate-200 px-3 py-2">লিঙ্গ</th>
                    <th className="border-b border-slate-200 px-3 py-2">মোবাইল</th>
                  </tr>
                </thead>
                <tbody>
                  {excelImportPreview.rows.slice(0, 6).map((row) => (
                    <tr key={row.id} className="border-b border-slate-100 last:border-b-0">
                      <td className="px-3 py-2 text-center font-semibold tabular-nums">
                        {toBanglaDigit(row.roll)}
                      </td>
                      <td className="px-3 py-2 font-medium text-slate-900">{row.name}</td>
                      <td className="px-3 py-2 text-slate-600">
                        {row.classLevel} ({row.section})
                      </td>
                      <td className="px-3 py-2 text-slate-600">{row.gender}</td>
                      <td className="px-3 py-2 font-mono text-slate-600">{row.guardianPhone}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {excelImportPreview.rows.length > 6 && (
              <p className="text-xs text-slate-500 mb-4">
                ...এবং আরও {toBanglaDigit(excelImportPreview.rows.length - 6)} জন শিক্ষার্থীর তথ্য সংযুক্ত হবে।
              </p>
            )}

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setExcelImportPreview(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={() => confirmExcelImport('replace')}
                className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs sm:text-sm font-semibold text-amber-800 hover:bg-amber-100"
              >
                সকল তথ্য প্রতিস্থাপন করুন
              </button>
              <button
                type="button"
                onClick={() => confirmExcelImport('append')}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-emerald-700"
              >
                আগের তালিকায় যোগ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      <StudentFlnModal
        student={activeFlnStudent}
        flnRecord={
          activeFlnStudent ? findStudentFlnRecord(activeFlnStudent, flnRecords) : undefined
        }
        initialMonthIndex={selectedFlnMonth}
        onClose={() => setActiveFlnStudent(null)}
        onSaveMonthEntry={handleSaveStudentFln}
        onOpenFullFlnPage={() => {
          setActiveFlnStudent(null);
          onNavigate('monthly_fln');
        }}
      />
    </PageShell>
  );
}
