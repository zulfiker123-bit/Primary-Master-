import React, { useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpCircle,
  BookOpen,
  BookOpenCheck,
  CheckCircle2,
  ClipboardCheck,
  FileDown,
  FileText,
  Loader2,
  Plus,
  Printer,
  SlidersHorizontal,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react';
import { EvaluationGuidelineModal2026 } from '../components/EvaluationGuidelineModal2026';
import {
  EvaluationPromotionModal,
  getNextClassLabel,
  StudentPromotionCandidate,
} from '../components/EvaluationPromotionModal';
import { OfficialA4Letterhead, OfficialWatermark } from '../components/OfficialEmblems';
import { PageShell } from '../components/PageShell';
import { CLASS_LEVELS } from '../data/curriculum';
import {
  buildDetailForSchema2026,
  CaPartKey,
  CONSOLIDATED_ANNUAL_TERM,
  EVALUATION_TERMS,
  getClassGrandFullMarks,
  getEvaluationSchemasForClass,
  normalizeTermName,
  resolveSubjectDetail2026,
  SubjectEvalSchema2026,
} from '../data/evaluationSchema2026';
import { useLocalStorage } from '../hooks/useLocalStorage';
import {
  EvaluationRecord,
  QualityRating,
  QuestionItem,
  RouteKey,
  Student,
  SubjectAssessmentDetail,
  TeacherProfile,
} from '../types';
import {
  calculateGpaGrade,
  calculateNctbPrimaryGrade,
  getFormattedBanglaDate,
  getSubjectPassMarks,
  GradeResult,
  toBanglaDigit,
} from '../utils/bangla';
import { exportElementToA4Pdf } from '../utils/pdfExport';
import { triggerSmartPrint } from '../utils/printHelper';

interface EvaluationPageProps {
  profile: TeacherProfile;
  onNavigate: (route: RouteKey) => void;
}

type GradingDisplayMode = 'nctb_2026' | 'gpa_5' | 'both';

interface ComputedSubjectRow {
  schema: SubjectEvalSchema2026;
  detail: SubjectAssessmentDetail;
  total: number;
  passMarks: number;
  passed: boolean;
  pct: number;
  nctbGrade: GradeResult;
  gpaGrade: GradeResult;
  termMarks?: { t1?: number; t2?: number; t3?: number };
}

interface ComputedStudentRow {
  record: EvaluationRecord;
  sourceRecordIds: string[];
  isConsolidated: boolean;
  averagedTermCount: number;
  bySubject: ComputedSubjectRow[];
  caTotal: number;
  saTotal: number;
  grandTotal: number;
  maxTotal: number;
  percentage: number;
  failedSubjects: { name: string; obtained: number; fullMarks: number; passMarks: number }[];
  passedAllSubjects: boolean;
  nctbOverall: GradeResult;
  gpaOverall: GradeResult;
  attendancePct: number | null;
  meritRank: number;
}

const INITIAL_RECORDS: EvaluationRecord[] = [
  {
    id: 'ev-1',
    classLevel: 'পঞ্চম শ্রেণি',
    term: '৩য় প্রান্তিক',
    roll: '০১',
    studentName: 'তাসনিম জাহান',
    bangla: 88,
    english: 84,
    math: 92,
    science: 86,
    bgs: 85,
    religion: 90,
    attendanceDays: 186,
    totalWorkingDays: 200,
    personalQualities: { activity: 'ক', discipline: 'ক', behavior: 'ক' },
  },
  {
    id: 'ev-2',
    classLevel: 'পঞ্চম শ্রেণি',
    term: '৩য় প্রান্তিক',
    roll: '০২',
    studentName: 'রাফি আহমেদ',
    bangla: 76,
    english: 72,
    math: 81,
    science: 78,
    bgs: 74,
    religion: 82,
    attendanceDays: 178,
    totalWorkingDays: 200,
    personalQualities: { activity: 'ক', discipline: 'ক', behavior: 'খ' },
  },
  {
    id: 'ev-3',
    classLevel: 'পঞ্চম শ্রেণি',
    term: '৩য় প্রান্তিক',
    roll: '০৩',
    studentName: 'নুসরাত সুলতানা',
    bangla: 68,
    english: 64,
    math: 70,
    science: 66,
    bgs: 69,
    religion: 75,
    attendanceDays: 172,
    totalWorkingDays: 200,
    personalQualities: { activity: 'খ', discipline: 'ক', behavior: 'ক' },
  },
  {
    id: 'ev-4',
    classLevel: 'পঞ্চম শ্রেণি',
    term: '৩য় প্রান্তিক',
    roll: '০৪',
    studentName: 'সাকিবুল ইসলাম',
    bangla: 52,
    english: 34,
    math: 31,
    science: 48,
    bgs: 45,
    religion: 58,
    attendanceDays: 158,
    totalWorkingDays: 200,
    personalQualities: { activity: 'খ', discipline: 'খ', behavior: 'খ' },
  },
];

function formatRollNumber(roll: string): number {
  const englishDigits = roll.replace(/[০-৯]/g, (d) =>
    String('০১২৩৪৫৬৭৮৯'.indexOf(d))
  );
  const parsed = Number.parseInt(englishDigits, 10);
  return Number.isNaN(parsed) ? 9999 : parsed;
}

export default function EvaluationPage({ profile, onNavigate }: EvaluationPageProps) {
  const [records, setRecords] = useLocalStorage<EvaluationRecord[]>(
    'evaluation_records_v1',
    INITIAL_RECORDS
  );
  const [students, setStudents] = useLocalStorage<Student[]>('students_list_v1', []);

  const [selectedClass, setSelectedClass] = useState('পঞ্চম শ্রেণি');
  const [selectedTerm, setSelectedTerm] = useState<string>('৩য় প্রান্তিক');
  const [gradingMode, setGradingMode] = useState<GradingDisplayMode>('both');

  // Detailed CA + SA Modal state
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editingSubject, setEditingSubject] = useState<string>('');
  const [draftDetail, setDraftDetail] = useState<SubjectAssessmentDetail | null>(null);
  const [draftMeta, setDraftMeta] = useState<{
    isSpecialNeeds: boolean;
    attendanceDays: number;
    totalWorkingDays: number;
    personalQualities: {
      activity: QualityRating;
      discipline: QualityRating;
      behavior: QualityRating;
    };
  } | null>(null);

  // Marksheet, Guideline, Promotion Modals & feedback
  const [marksheetStudentKey, setMarksheetStudentKey] = useState<string | null>(null);
  const [showGuidelineModal, setShowGuidelineModal] = useState(false);
  const [promotionModalState, setPromotionModalState] = useState<{
    isOpen: boolean;
    mode: 'single' | 'bulk';
    candidates: StudentPromotionCandidate[];
  }>({ isOpen: false, mode: 'bulk', candidates: [] });
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [exportingPdf, setExportingPdf] = useState(false);

  const resultSheetRef = useRef<HTMLDivElement>(null);
  const marksheetRef = useRef<HTMLDivElement>(null);

  const [newStudentName, setNewStudentName] = useState('');
  const [newRoll, setNewRoll] = useState('');

  const activeSchemas = useMemo(
    () => getEvaluationSchemasForClass(selectedClass),
    [selectedClass]
  );
  const grandFullTotals = useMemo(
    () => getClassGrandFullMarks(selectedClass),
    [selectedClass]
  );

  const isPrePrimary = selectedClass === 'প্রাক-প্রাথমিক';
  const isConsolidatedMode = selectedTerm === CONSOLIDATED_ANNUAL_TERM;

  // Build evaluated rows for the selected class & term (or 3-term consolidated average)
  const evaluatedRows = useMemo<ComputedStudentRow[]>(() => {
    const classRecords = records.filter((r) => r.classLevel === selectedClass);

    const buildRowFromSingle = (
      record: EvaluationRecord,
      sourceIds: string[],
      isConsolidated: boolean,
      averagedTermCount: number,
      perTermDetails?: {
        t1?: EvaluationRecord;
        t2?: EvaluationRecord;
        t3?: EvaluationRecord;
      }
    ): Omit<ComputedStudentRow, 'meritRank'> => {
      const isSpecialNeeds = Boolean(record.isSpecialNeeds);
      let caTotal = 0;
      let saTotal = 0;

      const bySubject: ComputedSubjectRow[] = activeSchemas.map((schema) => {
        let detail: SubjectAssessmentDetail;
        let termMarks: { t1?: number; t2?: number; t3?: number } | undefined;

        if (isConsolidated && perTermDetails) {
          const termRecords = [
            perTermDetails.t1,
            perTermDetails.t2,
            perTermDetails.t3,
          ].filter((item): item is EvaluationRecord => Boolean(item));

          const d1 = perTermDetails.t1
            ? resolveSubjectDetail2026(perTermDetails.t1, schema)
            : null;
          const d2 = perTermDetails.t2
            ? resolveSubjectDetail2026(perTermDetails.t2, schema)
            : null;
          const d3 = perTermDetails.t3
            ? resolveSubjectDetail2026(perTermDetails.t3, schema)
            : null;

          termMarks = {
            t1: d1 ? d1.continuousMarks + d1.summativeMarks : undefined,
            t2: d2 ? d2.continuousMarks + d2.summativeMarks : undefined,
            t3: d3 ? d3.continuousMarks + d3.summativeMarks : undefined,
          };

          const resolvedList = termRecords.map((tr) =>
            resolveSubjectDetail2026(tr, schema)
          );
          const avgTotal =
            resolvedList.length > 0
              ? Math.round(
                  resolvedList.reduce(
                    (s, item) => s + item.continuousMarks + item.summativeMarks,
                    0
                  ) / resolvedList.length
                )
              : 0;
          detail = buildDetailForSchema2026(schema, avgTotal);
        } else {
          detail = resolveSubjectDetail2026(record, schema);
        }

        const total = detail.continuousMarks + detail.summativeMarks;
        caTotal += detail.continuousMarks;
        saTotal += detail.summativeMarks;

        const passMarks = getSubjectPassMarks(schema.fullMarks, isSpecialNeeds);
        const passed = total >= passMarks;
        const pct = schema.fullMarks > 0 ? (total / schema.fullMarks) * 100 : 0;
        const nctbGrade = calculateNctbPrimaryGrade(pct, isSpecialNeeds);
        const gpaGrade = calculateGpaGrade(pct, isSpecialNeeds);

        return {
          schema,
          detail,
          total,
          passMarks,
          passed,
          pct,
          nctbGrade,
          gpaGrade,
          termMarks,
        };
      });

      const grandTotal = caTotal + saTotal;
      const maxTotal = grandFullTotals.totalFullMarks;
      const percentage = maxTotal > 0 ? (grandTotal / maxTotal) * 100 : 0;
      const failedSubjects = bySubject
        .filter((s) => !s.passed)
        .map((s) => ({
          name: s.schema.shortName,
          obtained: s.total,
          fullMarks: s.schema.fullMarks,
          passMarks: s.passMarks,
        }));
      const passedAllSubjects = failedSubjects.length === 0;

      const nctbBase = calculateNctbPrimaryGrade(percentage, isSpecialNeeds);
      const nctbOverall: GradeResult = passedAllSubjects
        ? nctbBase
        : {
            ...nctbBase,
            passed: false,
            remark: `${toBanglaDigit(failedSubjects.length)} বিষয়ে সহায়তা প্রয়োজন`,
          };

      const gpaBase = calculateGpaGrade(percentage, isSpecialNeeds);
      const gpaOverall: GradeResult = passedAllSubjects
        ? gpaBase
        : {
            grade: 'F',
            gpa: '0.00',
            remark: `${toBanglaDigit(failedSubjects.length)} বিষয়ে অকৃতকার্য`,
            passed: false,
          };

      const workingDays = Number(record.totalWorkingDays ?? 0);
      const attDays = Number(record.attendanceDays ?? 0);
      const attendancePct =
        workingDays > 0 ? Math.round((attDays / workingDays) * 100) : null;

      return {
        record,
        sourceRecordIds: sourceIds,
        isConsolidated,
        averagedTermCount,
        bySubject,
        caTotal,
        saTotal,
        grandTotal,
        maxTotal,
        percentage,
        failedSubjects,
        passedAllSubjects,
        nctbOverall,
        gpaOverall,
        attendancePct,
      };
    };

    let rawRows: Omit<ComputedStudentRow, 'meritRank'>[] = [];

    if (isConsolidatedMode) {
      const grouped = new Map<string, EvaluationRecord[]>();
      classRecords.forEach((r) => {
        const key = `${r.roll.trim()}::${r.studentName.trim()}`;
        const arr = grouped.get(key) || [];
        arr.push(r);
        grouped.set(key, arr);
      });

      grouped.forEach((groupRecords) => {
        const t1 = groupRecords.find((r) => normalizeTermName(r.term) === '১ম প্রান্তিক');
        const t2 = groupRecords.find((r) => normalizeTermName(r.term) === '২য় প্রান্তিক');
        const t3 = groupRecords.find((r) => normalizeTermName(r.term) === '৩য় প্রান্তিক');
        const rep = t3 || t2 || t1 || groupRecords[0];
        const count = [t1, t2, t3].filter(Boolean).length || groupRecords.length;
        rawRows.push(
          buildRowFromSingle(
            rep,
            groupRecords.map((g) => g.id),
            true,
            count,
            { t1, t2, t3 }
          )
        );
      });
    } else {
      const termFiltered = classRecords.filter(
        (r) => normalizeTermName(r.term) === selectedTerm
      );
      rawRows = termFiltered.map((r) => buildRowFromSingle(r, [r.id], false, 1));
    }

    // Sort strictly by মোট প্রাপ্ত নম্বর (grandTotal) descending for Merit Rank
    const sorted = [...rawRows].sort((a, b) => {
      if (b.grandTotal !== a.grandTotal) return b.grandTotal - a.grandTotal;
      return formatRollNumber(a.record.roll) - formatRollNumber(b.record.roll);
    });

    // Dense/Competition merit rank based on grandTotal
    let currentRank = 0;
    let prevScore = -1;
    return sorted.map((row, idx) => {
      if (row.grandTotal !== prevScore) {
        currentRank = idx + 1;
        prevScore = row.grandTotal;
      }
      return { ...row, meritRank: currentRank };
    });
  }, [
    records,
    selectedClass,
    selectedTerm,
    isConsolidatedMode,
    activeSchemas,
    grandFullTotals.totalFullMarks,
  ]);

  const classStats = useMemo(() => {
    const total = evaluatedRows.length;
    const passedCount = evaluatedRows.filter((r) => r.passedAllSubjects).length;
    const failedCount = total - passedCount;
    const promotedCount = evaluatedRows.filter(
      (r) =>
        r.record.promotionStatus === 'promoted' ||
        r.record.promotionStatus === 'conditional_promoted'
    ).length;
    return { total, passedCount, failedCount, promotedCount };
  }, [evaluatedRows]);

  const marksheetRow = useMemo(
    () =>
      evaluatedRows.find((row) => row.record.id === marksheetStudentKey) || null,
    [evaluatedRows, marksheetStudentKey]
  );

  const editingStudent = useMemo(
    () => records.find((r) => r.id === editingStudentId) || null,
    [records, editingStudentId]
  );

  const editingSchema = useMemo(
    () =>
      activeSchemas.find((s) => s.name === editingSubject) || activeSchemas[0],
    [activeSchemas, editingSubject]
  );

  const handleAddRow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;
    const targetTerm = isConsolidatedMode ? '৩য় প্রান্তিক' : selectedTerm;
    const defaultPct = 72;
    const details: Record<string, SubjectAssessmentDetail> = {};
    activeSchemas.forEach((schema) => {
      const targetScore = Math.round((defaultPct / 100) * schema.fullMarks);
      details[schema.name] = buildDetailForSchema2026(schema, targetScore);
    });

    const item: EvaluationRecord = {
      id: `ev-${Date.now()}`,
      classLevel: selectedClass,
      term: targetTerm,
      roll: newRoll.trim() || String(evaluatedRows.length + 1).padStart(2, '0'),
      studentName: newStudentName.trim(),
      bangla: 72,
      english: 72,
      math: 72,
      science: 72,
      bgs: 72,
      religion: 72,
      attendanceDays: 175,
      totalWorkingDays: 200,
      personalQualities: { activity: 'ক', discipline: 'ক', behavior: 'ক' },
      subjectDetails: details,
    };
    setRecords((prev) => [...prev, item]);
    setNewStudentName('');
    setNewRoll('');
    setStatusMessage(
      `${item.studentName}-কে ${selectedClass} (${targetTerm})-এ যুক্ত করা হয়েছে।`
    );
  };

  const handleImportClassStudents = () => {
    const classStudents = students.filter((s) => s.classLevel === selectedClass);
    if (classStudents.length === 0) return;

    const targetTerm = isConsolidatedMode ? '৩য় প্রান্তিক' : selectedTerm;
    const existingKeys = new Set(
      records
        .filter(
          (r) =>
            r.classLevel === selectedClass &&
            normalizeTermName(r.term) === targetTerm
        )
        .map((r) => `${r.roll.trim()}::${r.studentName.trim()}`)
    );

    const toAdd: EvaluationRecord[] = [];
    const defaultPct = 72;

    classStudents.forEach((st) => {
      const key = `${st.roll.trim()}::${st.name.trim()}`;
      if (existingKeys.has(key)) return;
      const details: Record<string, SubjectAssessmentDetail> = {};
      activeSchemas.forEach((schema) => {
        const targetScore = Math.round((defaultPct / 100) * schema.fullMarks);
        details[schema.name] = buildDetailForSchema2026(schema, targetScore);
      });
      toAdd.push({
        id: `ev-${Date.now()}-${st.id}`,
        classLevel: selectedClass,
        term: targetTerm,
        roll: st.roll,
        studentName: st.name,
        bangla: 72,
        english: 72,
        math: 72,
        science: 72,
        bgs: 72,
        religion: 72,
        attendanceDays: 175,
        totalWorkingDays: 200,
        personalQualities: { activity: 'ক', discipline: 'ক', behavior: 'ক' },
        subjectDetails: details,
      });
    });

    if (toAdd.length > 0) {
      setRecords((prev) => [...prev, ...toAdd]);
      setStatusMessage(
        `শিক্ষার্থীর তালিকা থেকে ${toBanglaDigit(toAdd.length)} জন শিক্ষার্থী (${targetTerm}) আমদানি করা হয়েছে।`
      );
    } else {
      setStatusMessage('এই শ্রেণির সকল শিক্ষার্থী ইতোমধ্যেই মূল্যায়ন তালিকায় রয়েছে।');
    }
  };

  const openDetailedEditor = (record: EvaluationRecord, subjectName?: string) => {
    const targetSchema =
      activeSchemas.find((s) => s.name === subjectName) || activeSchemas[0];
    setEditingStudentId(record.id);
    setEditingSubject(targetSchema.name);
    setDraftDetail(resolveSubjectDetail2026(record, targetSchema));
    setDraftMeta({
      isSpecialNeeds: Boolean(record.isSpecialNeeds),
      attendanceDays: Number(record.attendanceDays ?? 175),
      totalWorkingDays: Number(record.totalWorkingDays ?? 200),
      personalQualities: record.personalQualities || {
        activity: 'ক',
        discipline: 'ক',
        behavior: 'ক',
      },
    });
  };

  const saveDraftToRecord = (
    studentId: string,
    schema: SubjectEvalSchema2026,
    detail: SubjectAssessmentDetail,
    meta?: typeof draftMeta
  ) => {
    const total = detail.continuousMarks + detail.summativeMarks;
    setRecords((prev) =>
      prev.map((r) => {
        if (r.id !== studentId) return r;
        const nextDetails = { ...(r.subjectDetails || {}), [schema.name]: detail };
        const updated: EvaluationRecord = {
          ...r,
          subjectDetails: nextDetails,
          ...(meta
            ? {
                isSpecialNeeds: meta.isSpecialNeeds,
                attendanceDays: meta.attendanceDays,
                totalWorkingDays: meta.totalWorkingDays,
                personalQualities: meta.personalQualities,
              }
            : {}),
        };
        if (schema.legacyField) {
          updated[schema.legacyField] = total;
        }
        return updated;
      })
    );
  };

  const switchEditorSubject = (subjectName: string) => {
    if (!editingStudent) return;
    const prevSchema =
      activeSchemas.find((s) => s.name === editingSubject) || activeSchemas[0];
    if (draftDetail && prevSchema) {
      saveDraftToRecord(editingStudent.id, prevSchema, draftDetail, draftMeta);
    }
    const nextSchema =
      activeSchemas.find((s) => s.name === subjectName) || activeSchemas[0];
    setEditingSubject(nextSchema.name);
    setDraftDetail(resolveSubjectDetail2026(editingStudent, nextSchema));
  };

  const handleSaveEditorModal = () => {
    if (!editingStudent || !editingSchema || !draftDetail) return;
    saveDraftToRecord(editingStudent.id, editingSchema, draftDetail, draftMeta);
    setEditingStudentId(null);
    setDraftDetail(null);
    setDraftMeta(null);
  };

  const handleCaPartChange = (key: CaPartKey, value: number, maxVal: number) => {
    if (!draftDetail) return;
    const clamped = Math.max(0, Math.min(maxVal, Math.round(value || 0)));
    const prevBd = draftDetail.caBreakdown || {};
    const nextBd = {
      textbookWork: prevBd.textbookWork ?? 0,
      classActivity: prevBd.classActivity ?? 0,
      comprehension: prevBd.comprehension ?? 0,
      classTest: prevBd.classTest ?? 0,
      [key]: clamped,
    };
    const nextCa =
      nextBd.textbookWork +
      nextBd.classActivity +
      nextBd.comprehension +
      nextBd.classTest;

    setDraftDetail({
      ...draftDetail,
      caBreakdown: nextBd,
      continuousMarks: nextCa,
    });
  };

  const handleSaPartChange = (
    partId: string,
    _qType: QuestionItem['type'],
    value: number,
    maxVal: number
  ) => {
    if (!draftDetail || !editingSchema) return;
    const clamped = Math.max(0, Math.min(maxVal, Math.round(value || 0)));
    const nextPartScores: Record<string, number> = {
      ...(draftDetail.saPartScores || {}),
      [partId]: clamped,
    };
    const nextSections: Partial<Record<QuestionItem['type'], number>> = {};
    let nextSa = 0;
    editingSchema.saParts.forEach((p) => {
      const score = Number(nextPartScores[p.id] ?? 0);
      nextSa += score;
      nextSections[p.questionType] = (nextSections[p.questionType] || 0) + score;
    });

    setDraftDetail({
      ...draftDetail,
      saPartScores: nextPartScores,
      saSections: nextSections,
      summativeMarks: nextSa,
    });
  };

  const openPromotionForSingle = (row: ComputedStudentRow) => {
    setPromotionModalState({
      isOpen: true,
      mode: 'single',
      candidates: [
        {
          recordId: row.record.id,
          studentName: row.record.studentName,
          roll: row.record.roll,
          classLevel: row.record.classLevel,
          grandTotal: row.grandTotal,
          maxTotal: row.maxTotal,
          percentage: row.percentage,
          failedSubjects: row.failedSubjects,
          attendancePct: row.attendancePct,
          currentStatus: row.record.promotionStatus,
        },
      ],
    });
  };

  const openPromotionForBulk = () => {
    if (evaluatedRows.length === 0) return;
    setPromotionModalState({
      isOpen: true,
      mode: 'bulk',
      candidates: evaluatedRows.map((row) => ({
        recordId: row.record.id,
        studentName: row.record.studentName,
        roll: row.record.roll,
        classLevel: row.record.classLevel,
        grandTotal: row.grandTotal,
        maxTotal: row.maxTotal,
        percentage: row.percentage,
        failedSubjects: row.failedSubjects,
        attendancePct: row.attendancePct,
        currentStatus: row.record.promotionStatus,
      })),
    });
  };

  const handleConfirmPromote = ({
    recordIds,
    targetClass,
    promotionType,
    syncStudentList,
    note,
  }: {
    recordIds: string[];
    targetClass: string;
    promotionType: 'promoted' | 'conditional_promoted' | 'retained';
    syncStudentList: boolean;
    note: string;
  }) => {
    const todayBn = getFormattedBanglaDate();
    const rowByRecordId = new Map<string, ComputedStudentRow>();
    evaluatedRows.forEach((row) => {
      row.sourceRecordIds.forEach((id) => rowByRecordId.set(id, row));
      rowByRecordId.set(row.record.id, row);
    });

    const targetRecordIds = new Set<string>();
    const promotedStudentIdentityKeys = new Set<string>();

    recordIds.forEach((id) => {
      const row = rowByRecordId.get(id);
      if (row) {
        row.sourceRecordIds.forEach((srcId) => targetRecordIds.add(srcId));
        promotedStudentIdentityKeys.add(
          `${row.record.roll.trim()}::${row.record.studentName.trim()}`
        );
      } else {
        targetRecordIds.add(id);
      }
    });

    setRecords((prev) =>
      prev.map((r) => {
        if (!targetRecordIds.has(r.id)) return r;
        return {
          ...r,
          promotionStatus: promotionType,
          promotedToClass: targetClass,
          promotedAt: todayBn,
          promotionNote: note,
        };
      })
    );

    if (syncStudentList && promotionType !== 'retained' && CLASS_LEVELS.includes(targetClass)) {
      setStudents((prev) =>
        prev.map((st) => {
          const identity = `${st.roll.trim()}::${st.name.trim()}`;
          if (
            st.classLevel === selectedClass &&
            promotedStudentIdentityKeys.has(identity)
          ) {
            return { ...st, classLevel: targetClass };
          }
          return st;
        })
      );
    }

    const actionLabel =
      promotionType === 'retained'
        ? `${toBanglaDigit(recordIds.length)} জন শিক্ষার্থীকে একই শ্রেণিতে পুনঃপঠন হিসেবে চিহ্নিত করা হয়েছে।`
        : `${toBanglaDigit(recordIds.length)} জন শিক্ষার্থীকে "${targetClass}"-এ ${
            promotionType === 'conditional_promoted'
              ? 'শর্তসাপেক্ষে (ফেলকৃত বিষয়সহ)'
              : 'নিয়মিতভাবে'
          } প্রমোট করা হয়েছে।`;
    setStatusMessage(actionLabel);
  };

  const handleExportPdf = async (
    element: HTMLElement | null,
    filename: string,
    orientation: 'portrait' | 'landscape' = 'portrait'
  ) => {
    if (!element || exportingPdf) return;
    setExportingPdf(true);
    try {
      await exportElementToA4Pdf(element, filename, { orientation });
    } finally {
      setExportingPdf(false);
    }
  };

  const matchingClassStudentCount = useMemo(
    () => students.filter((s) => s.classLevel === selectedClass).length,
    [students, selectedClass]
  );

  const renderGradeCell = (nctb: GradeResult, gpa: GradeResult) => {
    if (gradingMode === 'nctb_2026') {
      return (
        <div>
          <span
            className={`font-extrabold ${
              nctb.passed ? 'text-emerald-800' : 'text-rose-700'
            }`}
          >
            {nctb.grade}
          </span>
          <span className="block text-[9px] text-slate-600 leading-tight">
            {nctb.passed ? nctb.remark : 'সহায়তা প্রয়োজন'}
          </span>
        </div>
      );
    }
    if (gradingMode === 'gpa_5') {
      return (
        <div>
          <span
            className={`font-extrabold ${
              gpa.passed ? 'text-emerald-800' : 'text-rose-700'
            }`}
          >
            {gpa.grade}
          </span>
          <span className="block text-[10px] text-slate-600">
            GPA {toBanglaDigit(gpa.gpa)}
          </span>
        </div>
      );
    }
    return (
      <div>
        <span
          className={`font-extrabold ${
            gpa.passed ? 'text-emerald-800' : 'text-rose-700'
          }`}
        >
          {nctb.grade} / {gpa.grade}
        </span>
        <span className="block text-[10px] text-slate-600">
          GPA {toBanglaDigit(gpa.gpa)}
        </span>
      </div>
    );
  };

  const renderPromotionBadge = (record: EvaluationRecord) => {
    if (record.promotionStatus === 'promoted') {
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 border border-emerald-200 px-1.5 py-0.5 text-[10px] font-bold text-emerald-900">
          <CheckCircle2 className="h-3 w-3" />
          প্রমোটেড → {record.promotedToClass || getNextClassLabel(record.classLevel)}
        </span>
      );
    }
    if (record.promotionStatus === 'conditional_promoted') {
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 border border-amber-300 px-1.5 py-0.5 text-[10px] font-bold text-amber-950">
          <ArrowUpCircle className="h-3 w-3" />
          শর্তসাপেক্ষ প্রমোটেড →{' '}
          {record.promotedToClass || getNextClassLabel(record.classLevel)}
        </span>
      );
    }
    if (record.promotionStatus === 'retained') {
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-rose-100 border border-rose-200 px-1.5 py-0.5 text-[10px] font-bold text-rose-800">
          পুনঃপঠন ({record.classLevel})
        </span>
      );
    }
    return null;
  };

  return (
    <PageShell
      title="মূল্যায়ন রেজিস্টার, মেধাক্রম, গ্রেডশিট ও মার্কশিট (২০২৬)"
      subtitle="NCTB ২০২৬ প্রাথমিক মূল্যায়ন নির্দেশিকা অনুযায়ী ধারাবাহিক + সামষ্টিক নম্বর বণ্টন, গ্রেডেশন, মেধাক্রম ও ফেলকৃত বিষয়সহ প্রমোশন"
      onNavigate={onNavigate}
      onPrint={() =>
        triggerSmartPrint({
          element: resultSheetRef.current,
          filename: `result-sheet-${selectedClass}-${selectedTerm}`,
          orientation: 'landscape',
        })
      }
      printLabel="রেজাল্ট শিট প্রিন্ট"
      onExportPdf={() =>
        handleExportPdf(
          resultSheetRef.current,
          `result-sheet-${selectedClass}-${selectedTerm}`.replace(/\s+/g, '-'),
          'landscape'
        )
      }
      exportingPdf={exportingPdf}
      pdfLabel="রেজাল্ট শিট PDF"
    >
      {/* Controls & Quick Actions */}
      <div className="no-print mb-5 rounded-2xl bg-white border border-slate-200 p-4 space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[155px]">
            <label className="block text-xs font-semibold text-slate-600 mb-1">শ্রেণি</label>
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setMarksheetStudentKey(null);
                setStatusMessage(null);
              }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
            >
              {CLASS_LEVELS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-[200px]">
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              মূল্যায়ন প্রান্তিক
            </label>
            <select
              value={selectedTerm}
              onChange={(e) => {
                setSelectedTerm(e.target.value);
                setMarksheetStudentKey(null);
              }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
            >
              {EVALUATION_TERMS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
              <option value={CONSOLIDATED_ANNUAL_TERM}>{CONSOLIDATED_ANNUAL_TERM}</option>
            </select>
          </div>

          <div className="min-w-[215px]">
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              গ্রেডেশন পদ্ধতি
            </label>
            <select
              value={gradingMode}
              onChange={(e) => setGradingMode(e.target.value as GradingDisplayMode)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
            >
              <option value="both">NCTB ২০২৬ (A–D) + GPA (৫.০০) উভয়</option>
              <option value="nctb_2026">NCTB ২০২৬ প্রাথমিক গ্রেড (A / B / C / D)</option>
              <option value="gpa_5">প্রচলিত GPA গ্রেড (A+ থেকে F / ৫.০০)</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={() => setShowGuidelineModal(true)}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-800 hover:bg-slate-100"
            >
              <BookOpenCheck className="h-4 w-4 text-emerald-700" />
              <span>২০২৬ নম্বর বণ্টন নির্দেশিকা</span>
            </button>

            {evaluatedRows.length > 0 && (
              <button
                type="button"
                onClick={openPromotionForBulk}
                className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-amber-600 px-3.5 text-xs font-semibold text-white hover:bg-amber-700"
              >
                <ArrowUpCircle className="h-4 w-4" />
                <span>শ্রেণি প্রমোট (ফেলসহ)</span>
              </button>
            )}
          </div>
        </div>

        {/* Add Student Row + Import from Student Registry */}
        <div className="flex flex-wrap items-end gap-2 pt-2 border-t border-slate-100">
          <form
            onSubmit={handleAddRow}
            className="flex flex-1 flex-wrap items-end gap-2 min-w-[260px]"
          >
            <div className="w-20">
              <label className="block text-xs font-semibold text-slate-600 mb-1">রোল</label>
              <input
                type="text"
                value={newRoll}
                onChange={(e) => setNewRoll(e.target.value)}
                placeholder="০৫"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex-1 min-w-[160px]">
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                নতুন শিক্ষার্থীর নাম
              </label>
              <input
                type="text"
                value={newStudentName}
                onChange={(e) => setNewStudentName(e.target.value)}
                placeholder="শিক্ষার্থীর নাম লিখুন"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-emerald-900 px-4 text-xs font-semibold text-white hover:bg-emerald-950"
            >
              <Plus className="h-4 w-4" />
              <span>যোগ করুন</span>
            </button>
          </form>

          {matchingClassStudentCount > 0 && (
            <button
              type="button"
              onClick={handleImportClassStudents}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 text-xs font-semibold text-emerald-900 hover:bg-emerald-100"
            >
              <UserPlus className="h-4 w-4" />
              <span>
                শিক্ষার্থী তালিকা থেকে আনুন ({toBanglaDigit(matchingClassStudentCount)})
              </span>
            </button>
          )}
        </div>

        {/* Summary KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs tabular-nums">
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2">
            <span className="text-slate-500 block text-[11px]">মোট শিক্ষার্থী ও পূর্ণমান</span>
            <span className="font-bold text-slate-900 text-sm">
              {toBanglaDigit(classStats.total)} জন · পূর্ণমান{' '}
              {toBanglaDigit(grandFullTotals.totalFullMarks)}
            </span>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 px-3 py-2">
            <span className="text-emerald-800 block text-[11px]">সকল বিষয়ে উত্তীর্ণ</span>
            <span className="font-bold text-emerald-950 text-sm">
              {toBanglaDigit(classStats.passedCount)} জন
            </span>
          </div>
          <div className="rounded-xl border border-rose-200 bg-rose-50/60 px-3 py-2">
            <span className="text-rose-800 block text-[11px]">ফেলকৃত বিষয় আছে</span>
            <span className="font-bold text-rose-900 text-sm">
              {toBanglaDigit(classStats.failedCount)} জন
            </span>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50/60 px-3 py-2">
            <span className="text-amber-900 block text-[11px]">প্রমোটেড (শর্তসাপেক্ষসহ)</span>
            <span className="font-bold text-amber-950 text-sm">
              {toBanglaDigit(classStats.promotedCount)} জন
            </span>
          </div>
        </div>

        {/* Assessment Structure Info Banner */}
        <div className="rounded-xl bg-emerald-50/70 border border-emerald-200/80 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-950">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-emerald-700 shrink-0" />
            <span>
              {isPrePrimary
                ? 'প্রাক-প্রাথমিক: ৩টি বিষয়ে ৫০ করে সর্বমোট ১৫০ নম্বর (১০০% ধারাবাহিক পর্যবেক্ষণ)।'
                : selectedClass === 'প্রথম শ্রেণি' || selectedClass === 'দ্বিতীয় শ্রেণি'
                ? '১ম ও ২য় শ্রেণি (NCTB ২০২৬): ৭টি বিষয়ে মোট ৫০০ নম্বর — বাংলা, ইংরেজি, গণিত (ধারাবাহিক ৫০ + সামষ্টিক ৫০ = ১০০) এবং বাকি ৪টি বিষয় ৫০ নম্বর করে ১০০% ধারাবাহিক।'
                : `${selectedClass} (NCTB ২০২৬): ৮টি বিষয়ে মোট ৭০০ নম্বর — ৬টি মূল বিষয় (ধারাবাহিক ৩০ + সামষ্টিক ৭০ = ১০০) এবং শিল্পকলা ও স্বাস্থ্য শিক্ষা ৫০ নম্বর করে ১০০% ধারাবাহিক।`}
            </span>
          </div>
          <span className="font-semibold text-emerald-800">
            পাস: ৪০% (বিশেষ চাহিদা ৩৩%) · নম্বরে ক্লিক করে ৪-অংশে ধারাবাহিক ও সামষ্টিক বসান
          </span>
        </div>

        {statusMessage && (
          <div className="rounded-xl border border-emerald-300 bg-emerald-100/80 px-3.5 py-2 text-xs font-semibold text-emerald-950 flex items-center justify-between gap-2">
            <span>{statusMessage}</span>
            <button
              type="button"
              onClick={() => setStatusMessage(null)}
              className="text-emerald-800 hover:text-emerald-950"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Printable Class Result Sheet (Tabulation Sheet) */}
      <div
        ref={resultSheetRef}
        className="relative overflow-hidden print-only-sheet rounded-2xl bg-white border border-slate-200 p-5 sm:p-7 shadow-xs text-slate-900"
      >
        <OfficialWatermark opacityClass="opacity-[0.04]" />

        <div className="relative z-10">
          <OfficialA4Letterhead
            schoolName={profile.school}
            addressLine={`${profile.villagePost ? profile.villagePost + ', ' : ''}${profile.upazila}, ${profile.district}`}
            documentTitle={`মূল্যায়ন ফলাফল বিবরণী (রেজাল্ট শিট ও মেধাক্রম) — ${selectedTerm}`}
            subtitle={`শ্রেণি: ${selectedClass} · মোট পূর্ণমান: ${toBanglaDigit(
              grandFullTotals.totalFullMarks
            )} (ধারাবাহিক ${toBanglaDigit(grandFullTotals.totalCaMax)}${
              grandFullTotals.totalSaMax > 0
                ? ` + সামষ্টিক ${toBanglaDigit(grandFullTotals.totalSaMax)}`
                : ''
            }) · পাস: ৪০%`}
            compact
          />

          {evaluatedRows.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-500">
              এই শ্রেণি ও প্রান্তিকে এখনো কোনো মূল্যায়ন রেকর্ড নেই। উপরের ফরম থেকে শিক্ষার্থী যোগ করুন।
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-slate-400 text-[11px] min-w-[980px] tabular-nums">
                <thead>
                  <tr className="bg-slate-100 text-slate-900">
                    <th className="border border-slate-400 p-1.5">মেধাক্রম</th>
                    <th className="border border-slate-400 p-1.5">রোল</th>
                    <th className="border border-slate-400 p-1.5 text-left min-w-[130px]">
                      শিক্ষার্থীর নাম
                    </th>
                    {activeSchemas.map((schema) => (
                      <th key={schema.id} className="border border-slate-400 p-1.5 text-center">
                        <span className="block font-bold">{schema.shortName}</span>
                        <span className="block text-[9px] font-normal text-slate-600">
                          পূর্ণঃ {toBanglaDigit(schema.fullMarks)} (
                          {schema.saMax > 0
                            ? `ধাঃ${toBanglaDigit(schema.caMax)}+সাঃ${toBanglaDigit(
                                schema.saMax
                              )}`
                            : `ধাঃ${toBanglaDigit(schema.caMax)}`}
                          )
                        </span>
                      </th>
                    ))}
                    <th className="border border-slate-400 p-1.5">
                      মোট ({toBanglaDigit(grandFullTotals.totalFullMarks)})
                    </th>
                    <th className="border border-slate-400 p-1.5">গ্রেড ও জিপিএ</th>
                    <th className="border border-slate-400 p-1.5">ফলাফল ও প্রমোশন</th>
                    <th className="no-print border border-slate-400 p-1.5">কার্যক্রম</th>
                  </tr>
                </thead>
                <tbody className="text-center">
                  {evaluatedRows.map((row) => {
                    const r = row.record;
                    return (
                      <tr key={r.id} className="hover:bg-slate-50/80">
                        <td className="border border-slate-400 p-1.5 font-extrabold text-emerald-900">
                          {toBanglaDigit(row.meritRank)}
                        </td>
                        <td className="border border-slate-400 p-1.5 font-semibold">
                          {toBanglaDigit(r.roll)}
                        </td>
                        <td className="border border-slate-400 p-1.5 text-left">
                          <span className="font-semibold text-slate-900 block">
                            {r.studentName}
                          </span>
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {r.isSpecialNeeds && (
                              <span className="rounded bg-indigo-100 px-1 py-0.2 text-[9px] font-bold text-indigo-800">
                                বিশেষ চাহিদা (৩৩%)
                              </span>
                            )}
                            {row.attendancePct !== null && (
                              <span
                                className={`rounded px-1 py-0.2 text-[9px] font-semibold ${
                                  row.attendancePct >= 85
                                    ? 'bg-emerald-50 text-emerald-800'
                                    : 'bg-amber-100 text-amber-900'
                                }`}
                              >
                                উপঃ {toBanglaDigit(row.attendancePct)}%
                              </span>
                            )}
                          </div>
                        </td>
                        {row.bySubject.map(({ schema, detail, total, passed }) => (
                          <td
                            key={schema.id}
                            className={`border border-slate-400 p-1 ${
                              !passed ? 'bg-rose-50/90' : ''
                            }`}
                          >
                            <button
                              type="button"
                              disabled={isConsolidatedMode}
                              onClick={() => openDetailedEditor(r, schema.name)}
                              title={
                                isConsolidatedMode
                                  ? 'সমন্বিত গড় ভিউ (সম্পাদনা করতে নির্দিষ্ট প্রান্তিক বেছে নিন)'
                                  : 'ধারাবাহিক ও সামষ্টিক নম্বর সম্পাদনা করুন'
                              }
                              className="w-full rounded-lg px-1 py-0.5 hover:bg-emerald-50 transition-colors disabled:cursor-default disabled:hover:bg-transparent"
                            >
                              <span
                                className={`block text-xs font-bold ${
                                  passed ? 'text-slate-900' : 'text-rose-700'
                                }`}
                              >
                                {toBanglaDigit(total)}
                                {!passed && (
                                  <span className="text-[9px] font-bold ml-0.5">(ফেল)</span>
                                )}
                              </span>
                              <span className="block text-[9px] text-slate-500">
                                {schema.saMax === 0
                                  ? `ধাঃ ${toBanglaDigit(detail.continuousMarks)}`
                                  : `${toBanglaDigit(detail.continuousMarks)}+${toBanglaDigit(
                                      detail.summativeMarks
                                    )}`}
                              </span>
                            </button>
                          </td>
                        ))}
                        <td className="border border-slate-400 p-1.5 font-extrabold text-slate-950">
                          <span>{toBanglaDigit(row.grandTotal)}</span>
                          <span className="block text-[9px] font-medium text-slate-500">
                            {toBanglaDigit(Math.round(row.percentage))}%
                          </span>
                        </td>
                        <td className="border border-slate-400 p-1.5">
                          {renderGradeCell(row.nctbOverall, row.gpaOverall)}
                        </td>
                        <td className="border border-slate-400 p-1.5">
                          <div className="flex flex-col items-center gap-1">
                            {row.passedAllSubjects ? (
                              <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-900">
                                উত্তীর্ণ
                              </span>
                            ) : (
                              <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-800">
                                ফেল ({toBanglaDigit(row.failedSubjects.length)} বিষয়)
                              </span>
                            )}
                            {renderPromotionBadge(r)}
                          </div>
                        </td>
                        <td className="no-print border border-slate-400 p-1.5">
                          <div className="flex flex-wrap items-center justify-center gap-1">
                            {!isConsolidatedMode && (
                              <button
                                type="button"
                                onClick={() => openDetailedEditor(r)}
                                title="ধারাবাহিক ও সামষ্টিক এন্ট্রি"
                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 border border-emerald-200 px-2 py-1 text-[10px] font-semibold text-emerald-900 hover:bg-emerald-100"
                              >
                                <SlidersHorizontal className="h-3 w-3" />
                                <span>নম্বর</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setMarksheetStudentKey(r.id)}
                              className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-2 py-1 text-[10px] font-semibold text-white hover:bg-slate-800"
                            >
                              <FileText className="h-3 w-3" />
                              <span>মার্কশিট</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => openPromotionForSingle(row)}
                              title="ফেলকৃত বিষয় থাকলেও প্রমোট করুন"
                              className="inline-flex items-center gap-1 rounded-lg bg-amber-50 border border-amber-300 px-2 py-1 text-[10px] font-semibold text-amber-900 hover:bg-amber-100"
                            >
                              <ArrowUpCircle className="h-3 w-3" />
                              <span>প্রমোট</span>
                            </button>
                            {!isConsolidatedMode && (
                              <button
                                type="button"
                                onClick={() =>
                                  setRecords((prev) => prev.filter((item) => item.id !== r.id))
                                }
                                aria-label="মুছুন"
                                className="p-1 text-slate-400 hover:text-red-600"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Official Signature Footer on Result Sheet */}
          <div className="mt-10 pt-4 flex items-end justify-between text-xs text-slate-700">
            <div className="text-center">
              <p className="font-medium text-slate-500 mb-6">
                তারিখ: {getFormattedBanglaDate()}
              </p>
              <p className="border-t border-slate-600 pt-1 px-4">শ্রেণি শিক্ষকের স্বাক্ষর</p>
            </div>
            <div className="text-center">
              <p className="border-t border-slate-600 pt-1 px-5 font-semibold">
                প্রধান শিক্ষকের স্বাক্ষর ও সিল
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed CA (4 parts) + SA (Question Structure) + Metadata Editor Modal */}
      {editingStudent && draftDetail && editingSchema && draftMeta && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 backdrop-blur-xs p-3 sm:p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-3xl rounded-2xl bg-white p-5 sm:p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto space-y-4">
            <div className="flex items-start justify-between gap-2 border-b border-slate-200 pb-3">
              <div>
                <p className="text-xs font-semibold text-emerald-800">
                  {editingStudent.classLevel} · {normalizeTermName(editingStudent.term)} · রোল:{' '}
                  {toBanglaDigit(editingStudent.roll)}
                </p>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                  {editingStudent.studentName} — ধারাবাহিক ও সামষ্টিক মূল্যায়ন (২০২৬)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingStudentId(null);
                  setDraftDetail(null);
                  setDraftMeta(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Subject Selector Strip */}
            <div className="flex flex-wrap gap-1.5">
              {activeSchemas.map((schema) => (
                <button
                  key={schema.id}
                  type="button"
                  onClick={() => switchEditorSubject(schema.name)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                    editingSchema.name === schema.name
                      ? 'bg-emerald-900 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {schema.shortName} ({toBanglaDigit(schema.fullMarks)})
                </button>
              ))}
            </div>

            {(() => {
              const totalObtained = draftDetail.continuousMarks + draftDetail.summativeMarks;
              const passLimit = getSubjectPassMarks(
                editingSchema.fullMarks,
                draftMeta.isSpecialNeeds
              );
              const isPassed = totalObtained >= passLimit;
              const pct =
                editingSchema.fullMarks > 0
                  ? (totalObtained / editingSchema.fullMarks) * 100
                  : 0;
              const nctbG = calculateNctbPrimaryGrade(pct, draftMeta.isSpecialNeeds);
              const gpaG = calculateGpaGrade(pct, draftMeta.isSpecialNeeds);

              return (
                <div className="space-y-4">
                  {/* Live Score Summary */}
                  <div className="rounded-xl bg-emerald-950 text-white p-3.5 flex flex-wrap items-center justify-between gap-3 tabular-nums">
                    <div>
                      <p className="text-[11px] text-emerald-200">
                        নির্বাচিত বিষয় ({editingSchema.resourceType === 'tg_only' ? 'শুধু শিক্ষক সহায়িকা' : 'পাঠ্যপুস্তক ও টিজি'})
                      </p>
                      <p className="text-sm font-bold">{editingSchema.name}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm">
                      <div>
                        <span className="text-emerald-200 block text-[11px]">
                          ধারাবাহিক ({toBanglaDigit(editingSchema.caMax)})
                        </span>
                        <span className="font-bold">
                          {toBanglaDigit(draftDetail.continuousMarks)}
                        </span>
                      </div>
                      {editingSchema.saMax > 0 && (
                        <div>
                          <span className="text-emerald-200 block text-[11px]">
                            সামষ্টিক ({toBanglaDigit(editingSchema.saMax)})
                          </span>
                          <span className="font-bold">
                            {toBanglaDigit(draftDetail.summativeMarks)}
                          </span>
                        </div>
                      )}
                      <div className="border-l border-white/20 pl-4">
                        <span className="text-emerald-200 block text-[11px]">
                          মোট ({toBanglaDigit(editingSchema.fullMarks)}) · পাস{' '}
                          {toBanglaDigit(passLimit)}
                        </span>
                        <span className="text-base font-extrabold">
                          {toBanglaDigit(totalObtained)}{' '}
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded ${
                              isPassed
                                ? 'bg-emerald-700 text-white'
                                : 'bg-rose-600 text-white'
                            }`}
                          >
                            {nctbG.grade} / {gpaG.grade} ({isPassed ? 'পাস' : 'ফেল'})
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Part 1: 4-Area NCTB 2026 Continuous Assessment (CA) */}
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="text-xs sm:text-sm font-bold text-emerald-950 flex items-center gap-1.5">
                        <BookOpen className="h-4 w-4 text-emerald-700" />
                        <span>
                          ১. ধারাবাহিক মূল্যায়ন (৪টি ক্ষেত্র) — পূর্ণমান:{' '}
                          {toBanglaDigit(editingSchema.caMax)}
                        </span>
                      </h4>
                      <span className="text-xs font-bold text-emerald-800 tabular-nums">
                        প্রাপ্ত: {toBanglaDigit(draftDetail.continuousMarks)} /{' '}
                        {toBanglaDigit(editingSchema.caMax)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {editingSchema.caParts.map((part) => {
                        const val = draftDetail.caBreakdown?.[part.key] ?? 0;
                        return (
                          <div
                            key={part.key}
                            className="rounded-xl bg-white border border-slate-200 p-3 flex items-center justify-between gap-3"
                          >
                            <label className="text-xs font-semibold text-slate-800 leading-snug flex-1">
                              <span className="text-emerald-800 font-bold mr-1">
                                {part.code}
                              </span>
                              {part.label}
                            </label>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <input
                                type="number"
                                min={0}
                                max={part.max}
                                value={val}
                                onChange={(e) =>
                                  handleCaPartChange(
                                    part.key,
                                    Number(e.target.value),
                                    part.max
                                  )
                                }
                                className="w-16 rounded-lg border border-slate-300 px-2 py-1 text-center text-sm font-bold tabular-nums"
                              />
                              <span className="text-xs text-slate-500 tabular-nums">
                                / {toBanglaDigit(part.max)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Part 2: Summative Assessment (SA) */}
                  {editingSchema.saMax > 0 ? (
                    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                            ২. সামষ্টিক মূল্যায়ন (লিখিত প্রশ্নকাঠামো) — পূর্ণমান:{' '}
                            {toBanglaDigit(editingSchema.saMax)}
                          </h4>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            পরীক্ষার সময়: {editingSchema.examDuration}
                          </p>
                        </div>
                        <span className="text-xs font-bold text-slate-900 tabular-nums">
                          মোট সামষ্টিক: {toBanglaDigit(draftDetail.summativeMarks)} /{' '}
                          {toBanglaDigit(editingSchema.saMax)}
                        </span>
                      </div>

                      <div className="space-y-2">
                        {editingSchema.saParts.map((part) => {
                          const val = Number(draftDetail.saPartScores?.[part.id] ?? 0);
                          return (
                            <div
                              key={part.id}
                              className="rounded-xl bg-white border border-slate-200 p-3 flex flex-wrap items-center justify-between gap-3"
                            >
                              <div className="flex-1 min-w-[200px]">
                                <p className="text-xs font-bold text-slate-800">{part.title}</p>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                  {part.competencyNote}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <input
                                  type="number"
                                  min={0}
                                  max={part.maxMarks}
                                  value={val}
                                  onChange={(e) =>
                                    handleSaPartChange(
                                      part.id,
                                      part.questionType,
                                      Number(e.target.value),
                                      part.maxMarks
                                    )
                                  }
                                  className="w-16 rounded-lg border border-slate-300 px-2 py-1 text-center text-sm font-bold tabular-nums"
                                />
                                <span className="text-xs font-semibold text-slate-600 tabular-nums">
                                  / {toBanglaDigit(part.maxMarks)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-950">
                      <strong>সামষ্টিক মূল্যায়ন: প্রযোজ্য নয় (১০০% ধারাবাহিক মূল্যায়ন — পূর্ণমান ৫০)</strong>
                      <p className="mt-1 text-amber-900">
                        {editingSchema.note ||
                          'NCTB ২০২৬ নির্দেশিকা অনুযায়ী এই বিষয়ে কোনো লিখিত সামষ্টিক পরীক্ষা অনুষ্ঠিত হবে না।'}
                      </p>
                    </div>
                  )}

                  {/* Part 3: Attendance, Special Needs & Personal/Social Qualities */}
                  <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                        ৩. উপস্থিতি, বিশেষ চাহিদা ও ব্যক্তিগত-সামাজিক গুণাবলি
                      </h4>
                      <label className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-900 cursor-pointer bg-indigo-50 border border-indigo-200 rounded-lg px-2.5 py-1">
                        <input
                          type="checkbox"
                          checked={draftMeta.isSpecialNeeds}
                          onChange={(e) =>
                            setDraftMeta({ ...draftMeta, isSpecialNeeds: e.target.checked })
                          }
                          className="rounded border-indigo-300 text-indigo-700"
                        />
                        <span>বিশেষ চাহিদাসম্পন্ন শিক্ষার্থী (পাস ৩৩%)</span>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 text-xs">
                      <div>
                        <label className="block font-semibold text-slate-600 mb-1">
                          কার্যদিবস
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={draftMeta.totalWorkingDays}
                          onChange={(e) =>
                            setDraftMeta({
                              ...draftMeta,
                              totalWorkingDays: Math.max(1, Number(e.target.value) || 1),
                            })
                          }
                          className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 tabular-nums"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-600 mb-1">
                          উপস্থিতি দিন
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={draftMeta.totalWorkingDays}
                          value={draftMeta.attendanceDays}
                          onChange={(e) =>
                            setDraftMeta({
                              ...draftMeta,
                              attendanceDays: Math.max(
                                0,
                                Math.min(
                                  draftMeta.totalWorkingDays,
                                  Number(e.target.value) || 0
                                )
                              ),
                            })
                          }
                          className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 tabular-nums"
                        />
                      </div>

                      {(['activity', 'discipline', 'behavior'] as const).map((qKey) => {
                        const labelMap = {
                          activity: 'সক্রিয়তা',
                          discipline: 'শৃঙ্খলা',
                          behavior: 'আচরণ',
                        };
                        return (
                          <div key={qKey}>
                            <label className="block font-semibold text-slate-600 mb-1">
                              {labelMap[qKey]} (গুণাবলি)
                            </label>
                            <select
                              value={draftMeta.personalQualities[qKey]}
                              onChange={(e) =>
                                setDraftMeta({
                                  ...draftMeta,
                                  personalQualities: {
                                    ...draftMeta.personalQualities,
                                    [qKey]: e.target.value as QualityRating,
                                  },
                                })
                              }
                              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs"
                            >
                              <option value="ক">ক (উত্তম)</option>
                              <option value="খ">খ (সন্তোষজনক)</option>
                              <option value="গ">গ (উন্নতি প্রয়োজন)</option>
                            </select>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Teacher Observation / PI Remark */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      বিষয়ভিত্তিক শিক্ষকের মন্তব্য / পারদর্শিতার সূচক
                    </label>
                    <input
                      type="text"
                      value={draftDetail.piRemark || ''}
                      onChange={(e) =>
                        setDraftDetail({ ...draftDetail, piRemark: e.target.value })
                      }
                      placeholder="যেমন: অর্জন সূচকে অগ্রগামী"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs sm:text-sm"
                    />
                  </div>
                </div>
              );
            })()}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setEditingStudentId(null);
                  setDraftDetail(null);
                  setDraftMeta(null);
                }}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleSaveEditorModal}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-900 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-950"
              >
                <span>সংরক্ষণ করুন</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Individual Student Marksheet (শিখন অগ্রগতি প্রতিবেদন) Modal */}
      {marksheetRow && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 backdrop-blur-xs p-3 sm:p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-3xl rounded-2xl bg-white p-4 sm:p-6 shadow-2xl border border-slate-200 max-h-[94vh] overflow-y-auto">
            <div className="no-print flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-slate-600">গ্রেড প্রদর্শন:</span>
                <select
                  value={gradingMode}
                  onChange={(e) => setGradingMode(e.target.value as GradingDisplayMode)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs"
                >
                  <option value="both">NCTB ২০২৬ + GPA উভয়</option>
                  <option value="nctb_2026">NCTB ২০২৬ গ্রেড (A–D)</option>
                  <option value="gpa_5">GPA স্কেল (৫.০০)</option>
                </select>
              </div>
              <button
                type="button"
                onClick={() => setMarksheetStudentKey(null)}
                aria-label="বন্ধ করুন"
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div
              ref={marksheetRef}
              className="relative overflow-hidden print-only-sheet rounded-xl border-2 border-emerald-900 bg-white p-5 sm:p-7 text-slate-900"
            >
              <OfficialWatermark opacityClass="opacity-[0.055]" />

              <div className="relative z-10">
                <OfficialA4Letterhead
                  schoolName={profile.school}
                  addressLine={`${profile.villagePost ? profile.villagePost + ', ' : ''}${profile.upazila}, ${profile.district}`}
                  documentTitle={`শিক্ষার্থীর শিখন অগ্রগতি প্রতিবেদন / মার্কশিট (${selectedTerm})`}
                  compact
                />

                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs mb-4 tabular-nums">
                  <span>
                    নাম: <strong>{marksheetRow.record.studentName}</strong>
                  </span>
                  <span>
                    শ্রেণি: <strong>{marksheetRow.record.classLevel}</strong>
                  </span>
                  <span>
                    রোল নং: <strong>{toBanglaDigit(marksheetRow.record.roll)}</strong>
                  </span>
                  <span>
                    মেধাক্রম:{' '}
                    <strong className="text-emerald-900">
                      {toBanglaDigit(marksheetRow.meritRank)} তম
                    </strong>
                  </span>
                  {marksheetRow.attendancePct !== null && (
                    <span>
                      উপস্থিতি:{' '}
                      <strong>
                        {toBanglaDigit(marksheetRow.record.attendanceDays ?? 0)} /{' '}
                        {toBanglaDigit(marksheetRow.record.totalWorkingDays ?? 0)} দিন (
                        {toBanglaDigit(marksheetRow.attendancePct)}%)
                      </strong>
                    </span>
                  )}
                  {marksheetRow.record.isSpecialNeeds && (
                    <span className="col-span-2 text-indigo-800 font-semibold">
                      বিশেষ চাহিদাসম্পন্ন (বিষয়ভিত্তিক পাস ৩৩%)
                    </span>
                  )}
                </div>

                {/* Subject-wise Marks Table */}
                <table className="w-full border-collapse border border-slate-400 text-[11px] tabular-nums mb-4">
                  <thead>
                    <tr className="bg-slate-100 text-slate-900">
                      <th className="border border-slate-400 p-1.5 text-left">বিষয়</th>
                      <th className="border border-slate-400 p-1.5">পূর্ণমান</th>
                      <th className="border border-slate-400 p-1.5">ধারাবাহিক</th>
                      <th className="border border-slate-400 p-1.5">সামষ্টিক</th>
                      {marksheetRow.isConsolidated && (
                        <>
                          <th className="border border-slate-400 p-1.5">১ম প্রাঃ</th>
                          <th className="border border-slate-400 p-1.5">২য় প্রাঃ</th>
                          <th className="border border-slate-400 p-1.5">৩য় প্রাঃ</th>
                        </>
                      )}
                      <th className="border border-slate-400 p-1.5">
                        {marksheetRow.isConsolidated ? 'গড় প্রাপ্ত' : 'মোট প্রাপ্ত'}
                      </th>
                      <th className="border border-slate-400 p-1.5">গ্রেড / জিপিএ</th>
                      <th className="border border-slate-400 p-1.5">অবস্থা</th>
                    </tr>
                  </thead>
                  <tbody>
                    {marksheetRow.bySubject.map((row) => (
                      <tr key={row.schema.id} className={!row.passed ? 'bg-rose-50/60' : ''}>
                        <td className="border border-slate-400 p-1.5 font-medium">
                          {row.schema.name}
                        </td>
                        <td className="border border-slate-400 p-1.5 text-center">
                          {toBanglaDigit(row.schema.fullMarks)}
                        </td>
                        <td className="border border-slate-400 p-1.5 text-center">
                          {toBanglaDigit(row.detail.continuousMarks)} /{' '}
                          {toBanglaDigit(row.schema.caMax)}
                        </td>
                        <td className="border border-slate-400 p-1.5 text-center">
                          {row.schema.saMax > 0
                            ? `${toBanglaDigit(row.detail.summativeMarks)} / ${toBanglaDigit(
                                row.schema.saMax
                              )}`
                            : 'প্রযোজ্য নয়'}
                        </td>
                        {marksheetRow.isConsolidated && (
                          <>
                            <td className="border border-slate-400 p-1.5 text-center">
                              {row.termMarks?.t1 !== undefined
                                ? toBanglaDigit(row.termMarks.t1)
                                : '—'}
                            </td>
                            <td className="border border-slate-400 p-1.5 text-center">
                              {row.termMarks?.t2 !== undefined
                                ? toBanglaDigit(row.termMarks.t2)
                                : '—'}
                            </td>
                            <td className="border border-slate-400 p-1.5 text-center">
                              {row.termMarks?.t3 !== undefined
                                ? toBanglaDigit(row.termMarks.t3)
                                : '—'}
                            </td>
                          </>
                        )}
                        <td
                          className={`border border-slate-400 p-1.5 text-center font-bold ${
                            !row.passed ? 'text-rose-700' : 'text-slate-900'
                          }`}
                        >
                          {toBanglaDigit(row.total)}
                        </td>
                        <td className="border border-slate-400 p-1.5 text-center">
                          {renderGradeCell(row.nctbGrade, row.gpaGrade)}
                        </td>
                        <td className="border border-slate-400 p-1.5 text-center font-bold">
                          {row.passed ? (
                            <span className="text-emerald-800">পাস</span>
                          ) : (
                            <span className="text-rose-700">
                              ফেল (&lt;{toBanglaDigit(row.passMarks)})
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-emerald-50 font-bold text-slate-950">
                      <td className="border border-slate-400 p-1.5">সর্বমোট</td>
                      <td className="border border-slate-400 p-1.5 text-center">
                        {toBanglaDigit(marksheetRow.maxTotal)}
                      </td>
                      <td className="border border-slate-400 p-1.5 text-center">
                        {toBanglaDigit(marksheetRow.caTotal)}
                      </td>
                      <td className="border border-slate-400 p-1.5 text-center">
                        {grandFullTotals.totalSaMax > 0
                          ? toBanglaDigit(marksheetRow.saTotal)
                          : '—'}
                      </td>
                      {marksheetRow.isConsolidated && (
                        <td colSpan={3} className="border border-slate-400 p-1.5 text-center">
                          {toBanglaDigit(marksheetRow.averagedTermCount)} প্রান্তিকের গড়
                        </td>
                      )}
                      <td className="border border-slate-400 p-1.5 text-center">
                        {toBanglaDigit(marksheetRow.grandTotal)}
                      </td>
                      <td className="border border-slate-400 p-1.5 text-center">
                        {renderGradeCell(
                          marksheetRow.nctbOverall,
                          marksheetRow.gpaOverall
                        )}
                      </td>
                      <td className="border border-slate-400 p-1.5 text-center">
                        {marksheetRow.passedAllSubjects ? (
                          <span className="text-emerald-900">উত্তীর্ণ</span>
                        ) : (
                          <span className="text-rose-700">অকৃতকার্য</span>
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </table>

                {/* Personal & Social Qualities + Promotion Decision */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 text-[11px]">
                  <div className="rounded-xl border border-slate-300 bg-slate-50/70 p-2.5">
                    <p className="font-bold text-slate-900 mb-1">
                      ব্যক্তিগত ও সামাজিক গুণাবলি (ক = উত্তম, খ = সন্তোষজনক, গ = উন্নতি প্রয়োজন)
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <span>
                        সক্রিয়তা:{' '}
                        <strong>{marksheetRow.record.personalQualities?.activity || 'ক'}</strong>
                      </span>
                      <span>
                        শৃঙ্খলা:{' '}
                        <strong>{marksheetRow.record.personalQualities?.discipline || 'ক'}</strong>
                      </span>
                      <span>
                        আচরণ:{' '}
                        <strong>{marksheetRow.record.personalQualities?.behavior || 'ক'}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-300 bg-slate-50/70 p-2.5">
                    <p className="font-bold text-slate-900 mb-1">
                      ফলাফল ও প্রমোশন সিদ্ধান্ত
                    </p>
                    {marksheetRow.failedSubjects.length > 0 && (
                      <p className="text-rose-700 font-semibold mb-1">
                        ফেলকৃত বিষয়:{' '}
                        {marksheetRow.failedSubjects
                          .map((f) => `${f.name} (${toBanglaDigit(f.obtained)})`)
                          .join(', ')}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-2">
                      {renderPromotionBadge(marksheetRow.record) || (
                        <span className="text-slate-700">
                          {marksheetRow.passedAllSubjects
                            ? 'সকল বিষয়ে পাস — পরবর্তী শ্রেণিতে উত্তীর্ণের যোগ্য'
                            : 'নিরাময়মূলক সহায়তা / শর্তসাপেক্ষ প্রমোশন বিবেচনাধীন'}
                        </span>
                      )}
                    </div>
                    {marksheetRow.record.promotionNote && (
                      <p className="text-[10px] text-slate-600 mt-1">
                        মন্তব্য: {marksheetRow.record.promotionNote}
                      </p>
                    )}
                  </div>
                </div>

                {/* Overall Summary Strip */}
                <div className="rounded-xl bg-emerald-950 text-white p-3 flex flex-wrap justify-between gap-2 text-xs font-bold tabular-nums mb-3">
                  <span>
                    মোট প্রাপ্ত: {toBanglaDigit(marksheetRow.grandTotal)} /{' '}
                    {toBanglaDigit(marksheetRow.maxTotal)} (
                    {toBanglaDigit(Math.round(marksheetRow.percentage))}%)
                  </span>
                  <span>মেধাক্রম: {toBanglaDigit(marksheetRow.meritRank)} তম</span>
                  <span>
                    গ্রেড: NCTB {marksheetRow.nctbOverall.grade} | GPA{' '}
                    {marksheetRow.gpaOverall.grade} ({toBanglaDigit(marksheetRow.gpaOverall.gpa)})
                  </span>
                </div>

                <p className="text-[10px] text-slate-600 text-center">
                  গ্রেড স্কেল (NCTB ২০২৬): A (৮০–১০০% অতি উত্তম) · B (৬০–৭৯% উত্তম) · C (৪০–৫৯% সন্তোষজনক) · D (০–৩৯% সহায়তা প্রয়োজন) | পাস নম্বর: ৪০% (বিশেষ চাহিদা ৩৩%) ও ন্যূনতম ৮৫% উপস্থিতি।
                </p>

                <div className="mt-10 pt-4 flex items-end justify-between text-xs text-slate-700">
                  <div className="text-center">
                    <p className="text-[11px] text-slate-500 mb-6">
                      প্রদানের তারিখ: {getFormattedBanglaDate()}
                    </p>
                    <p className="border-t border-slate-600 pt-1 px-4">শ্রেণি শিক্ষকের স্বাক্ষর</p>
                  </div>
                  <div className="text-center">
                    <p className="border-t border-slate-600 pt-1 px-4">অভিভাবকের স্বাক্ষর</p>
                  </div>
                  <div className="text-center">
                    <p className="border-t border-slate-600 pt-1 px-5 font-semibold">
                      প্রধান শিক্ষকের স্বাক্ষর ও সিল
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="no-print mt-4 flex flex-wrap justify-between items-center gap-2">
              <button
                type="button"
                onClick={() => openPromotionForSingle(marksheetRow)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-700"
              >
                <ArrowUpCircle className="h-4 w-4" />
                <span>
                  {marksheetRow.failedSubjects.length > 0
                    ? 'ফেলকৃত বিষয়সহ প্রমোট করুন'
                    : 'পরবর্তী শ্রেণিতে প্রমোট করুন'}
                </span>
              </button>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setMarksheetStudentKey(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  বন্ধ করুন
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleExportPdf(
                      marksheetRef.current,
                      `marksheet-${marksheetRow.record.studentName}`.replace(/\s+/g, '-'),
                      'portrait'
                    )
                  }
                  disabled={exportingPdf}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {exportingPdf ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileDown className="h-4 w-4" />
                  )}
                  <span>{exportingPdf ? 'PDF তৈরি হচ্ছে...' : 'PDF ডাউনলোড'}</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    triggerSmartPrint({
                      element: marksheetRef.current,
                      filename: `marksheet-${marksheetRow.record.studentName}`,
                      orientation: 'portrait',
                    })
                  }
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-900 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-950"
                >
                  <Printer className="h-4 w-4" />
                  <span>মার্কশিট প্রিন্ট</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Guideline Reference Modal */}
      <EvaluationGuidelineModal2026
        isOpen={showGuidelineModal}
        onClose={() => setShowGuidelineModal(false)}
        selectedClass={selectedClass}
      />

      {/* Promotion Modal (Supports Single & Bulk, Including Students with Failed Subjects) */}
      <EvaluationPromotionModal
        key={`${promotionModalState.mode}-${promotionModalState.candidates
          .map((c) => c.recordId)
          .join('-')}`}
        isOpen={promotionModalState.isOpen}
        onClose={() => setPromotionModalState((prev) => ({ ...prev, isOpen: false }))}
        selectedClass={selectedClass}
        candidates={promotionModalState.candidates}
        mode={promotionModalState.mode}
        onConfirmPromote={handleConfirmPromote}
      />
    </PageShell>
  );
}
