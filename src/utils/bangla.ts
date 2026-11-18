const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export function toBanglaDigit(val: string | number): string {
  return String(val).replace(/\d/g, (d) => BN_DIGITS[Number(d)]);
}

export function getFormattedBanglaDate(date = new Date()): string {
  const day = toBanglaDigit(String(date.getDate()).padStart(2, '0'));
  const monthNames = [
    'জানুয়ারি',
    'ফেব্রুয়ারি',
    'মার্চ',
    'এপ্রিল',
    'মে',
    'জুন',
    'জুলাই',
    'আগস্ট',
    'সেপ্টেম্বর',
    'অক্টোবর',
    'নভেম্বর',
    'ডিসেম্বর',
  ];
  const month = monthNames[date.getMonth()];
  const year = toBanglaDigit(date.getFullYear());
  return `${day} ${month}, ${year}`;
}

export interface GradeResult {
  grade: string;
  gpa: string;
  remark: string;
  passed: boolean;
}

export function calculateGrade(avgPercentage: number): {
  grade: string;
  gpa: string;
  remark: string;
} {
  if (avgPercentage >= 80) return { grade: 'A+', gpa: '5.00', remark: 'অতি উত্তম' };
  if (avgPercentage >= 70) return { grade: 'A', gpa: '4.00', remark: 'উত্তম' };
  if (avgPercentage >= 60) return { grade: 'A-', gpa: '3.50', remark: 'ভালো' };
  if (avgPercentage >= 50) return { grade: 'B', gpa: '3.00', remark: 'সন্তোষজনক' };
  if (avgPercentage >= 40) return { grade: 'C', gpa: '2.00', remark: 'চলতি মান' };
  if (avgPercentage >= 33) return { grade: 'D', gpa: '1.00', remark: 'সাধারণ পাস' };
  return { grade: 'F', gpa: '0.00', remark: 'অকৃতকার্য' };
}

/**
 * NCTB প্রাথমিক স্তরের মূল্যায়ন নির্দেশিকা ২০২৬ (পৃষ্ঠা ১১):
 * ৮০%-১০০%: A (অতি উত্তম)
 * ৬০%-৭৯%: B (উত্তম)
 * ৪০%-৫৯%: C (সন্তোষজনক)
 * ০%-৩৯%: D (সহায়তা প্রয়োজন — তবে বিশেষ চাহিদাসম্পন্ন শিক্ষার্থীর ক্ষেত্রে ৩৩%+ উত্তীর্ণ)
 */
export function calculateNctbPrimaryGrade(
  percentage: number,
  isSpecialNeeds = false
): GradeResult {
  const pct = Math.max(0, Math.min(100, percentage));
  const passPct = isSpecialNeeds ? 33 : 40;
  if (pct >= 80) {
    return { grade: 'A', gpa: '—', remark: 'অতি উত্তম', passed: true };
  }
  if (pct >= 60) {
    return { grade: 'B', gpa: '—', remark: 'উত্তম', passed: true };
  }
  if (pct >= 40) {
    return { grade: 'C', gpa: '—', remark: 'সন্তোষজনক', passed: true };
  }
  if (isSpecialNeeds && pct >= passPct) {
    return {
      grade: 'D',
      gpa: '—',
      remark: 'সন্তোষজনক (বিশেষ চাহিদা ৩৩%+ পাস)',
      passed: true,
    };
  }
  return {
    grade: 'D',
    gpa: '—',
    remark: 'সহায়তা প্রয়োজন (অকৃতকার্য)',
    passed: false,
  };
}

/**
 * প্রচলিত GPA 5.00 গ্রেডেশন পদ্ধতি (প্রাথমিক স্তরের ৪০% পাস নিয়ম অথবা বিশেষ চাহিদা ৩৩% পাস নিয়মসহ)
 */
export function calculateGpaGrade(
  percentage: number,
  isSpecialNeeds = false
): GradeResult {
  const pct = Math.max(0, Math.min(100, percentage));
  const passPct = isSpecialNeeds ? 33 : 40;
  if (pct < passPct) {
    return { grade: 'F', gpa: '0.00', remark: 'অকৃতকার্য', passed: false };
  }
  if (pct >= 80) return { grade: 'A+', gpa: '5.00', remark: 'অতি উত্তম', passed: true };
  if (pct >= 70) return { grade: 'A', gpa: '4.00', remark: 'উত্তম', passed: true };
  if (pct >= 60) return { grade: 'A-', gpa: '3.50', remark: 'ভালো', passed: true };
  if (pct >= 50) return { grade: 'B', gpa: '3.00', remark: 'সন্তোষজনক', passed: true };
  if (pct >= 40) return { grade: 'C', gpa: '2.00', remark: 'চলতি মান', passed: true };
  return { grade: 'D', gpa: '1.00', remark: 'সাধারণ পাস (বিশেষ)', passed: true };
}

export function getSubjectPassMarks(fullMarks: number, isSpecialNeeds = false): number {
  if (isSpecialNeeds) {
    return fullMarks === 50 ? 17 : Math.ceil(fullMarks * 0.33);
  }
  return Math.ceil(fullMarks * 0.4);
}

export function downloadJsonFile(data: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
