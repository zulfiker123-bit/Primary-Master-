import { Student } from '../types';

const EXCEL_HEADERS = [
  'শ্রেণি',
  'শাখা',
  'রোল',
  'শিক্ষার্থীর নাম',
  'লিঙ্গ',
  'পিতার নাম',
  'মাতার নাম',
  'জন্ম তারিখ',
  'অভিভাবকের মোবাইল',
  'গ্রাম',
];

function normalizeKey(k: string): string {
  return k.trim().toLowerCase().replace(/[\s_-]+/g, '');
}

function getField(row: Record<string, unknown>, aliases: string[]): string {
  const entries = Object.entries(row);
  for (const alias of aliases) {
    const target = normalizeKey(alias);
    for (const [k, v] of entries) {
      if (normalizeKey(k) === target && v !== undefined && v !== null) {
        return String(v).trim();
      }
    }
  }
  return '';
}

function normalizeGender(raw: string): 'ছাত্র' | 'ছাত্রী' {
  const val = raw.trim().toLowerCase();
  if (
    val === 'ছাত্রী' ||
    val === 'female' ||
    val === 'f' ||
    val === 'girl' ||
    val.includes('মেয়ে')
  ) {
    return 'ছাত্রী';
  }
  return 'ছাত্র';
}

export async function exportStudentsToExcel(
  students: Student[],
  filename = 'students-list.xlsx'
): Promise<void> {
  const XLSX = await import('xlsx');

  const rows = students.map((s) => ({
    [EXCEL_HEADERS[0]]: s.classLevel,
    [EXCEL_HEADERS[1]]: s.section,
    [EXCEL_HEADERS[2]]: s.roll,
    [EXCEL_HEADERS[3]]: s.name,
    [EXCEL_HEADERS[4]]: s.gender,
    [EXCEL_HEADERS[5]]: s.fatherName,
    [EXCEL_HEADERS[6]]: s.motherName,
    [EXCEL_HEADERS[7]]: s.dob,
    [EXCEL_HEADERS[8]]: s.guardianPhone,
    [EXCEL_HEADERS[9]]: s.village,
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows, { header: EXCEL_HEADERS });
  worksheet['!cols'] = [
    { wch: 16 },
    { wch: 14 },
    { wch: 8 },
    { wch: 24 },
    { wch: 10 },
    { wch: 22 },
    { wch: 22 },
    { wch: 14 },
    { wch: 16 },
    { wch: 18 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');

  const safeFile = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  XLSX.writeFile(workbook, safeFile);
}

export async function downloadStudentExcelTemplate(defaultClass: string): Promise<void> {
  const sample: Student[] = [
    {
      id: 'sample-1',
      classLevel: defaultClass,
      section: 'ক শাখা',
      roll: '০১',
      name: 'নমুনা শিক্ষার্থী ১',
      gender: 'ছাত্রী',
      fatherName: 'মো: করিম উদ্দিন',
      motherName: 'সালমা বেগম',
      dob: '১০/০২/২০১৬',
      guardianPhone: '01700000001',
      village: 'কোলা',
    },
    {
      id: 'sample-2',
      classLevel: defaultClass,
      section: 'ক শাখা',
      roll: '০২',
      name: 'নমুনা শিক্ষার্থী ২',
      gender: 'ছাত্র',
      fatherName: 'মো: রহিম মিয়া',
      motherName: 'রাহেলা আক্তার',
      dob: '১৫/০৫/২০১৬',
      guardianPhone: '01800000002',
      village: 'মাড়িয়ালা',
    },
  ];
  await exportStudentsToExcel(sample, 'student-excel-template.xlsx');
}

export async function parseStudentsFromExcel(
  file: File,
  fallbackClass: string
): Promise<Student[]> {
  const XLSX = await import('xlsx');
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) return [];

  const sheet = workbook.Sheets[firstSheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

  const parsed: Student[] = [];
  rawRows.forEach((row, idx) => {
    const name = getField(row, ['শিক্ষার্থীর নাম', 'নাম', 'Student Name', 'Name']);
    if (!name) return;

    const classLevel =
      getField(row, ['শ্রেণি', 'Class', 'Class Level']) || fallbackClass;
    const section = getField(row, ['শাখা', 'Section']) || 'প্রযোজ্য নয়';
    const roll =
      getField(row, ['রোল', 'রোল নং', 'Roll', 'Roll No']) ||
      String(idx + 1).padStart(2, '0');
    const genderRaw = getField(row, ['লিঙ্গ', 'Gender', 'Sex']);
    const fatherName = getField(row, ['পিতার নাম', 'পিতা', 'Father Name', 'Father']);
    const motherName = getField(row, ['মাতার নাম', 'মাতা', 'Mother Name', 'Mother']);
    const dob = getField(row, ['জন্ম তারিখ', 'DOB', 'Date of Birth', 'Birth Date']);
    const guardianPhone = getField(row, [
      'অভিভাবকের মোবাইল',
      'মোবাইল',
      'মোবাইল নম্বর',
      'Phone',
      'Mobile',
      'Guardian Phone',
    ]);
    const village = getField(row, ['গ্রাম', 'ঠিকানা', 'গ্রাম/ঠিকানা', 'Village', 'Address']);

    parsed.push({
      id: `st-xl-${Date.now()}-${idx}`,
      classLevel,
      section,
      roll,
      name,
      gender: normalizeGender(genderRaw),
      fatherName: fatherName || '-',
      motherName: motherName || '-',
      dob: dob || '-',
      guardianPhone: guardianPhone || '-',
      village: village || '-',
    });
  });

  return parsed;
}
