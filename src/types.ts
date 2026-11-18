export type RouteKey =
  | 'home'
  | 'lesson_plan'
  | 'questions'
  | 'suggestions'
  | 'applications'
  | 'monthly_fln'
  | 'evaluation'
  | 'books'
  | 'certificates'
  | 'students'
  | 'forum'
  | 'videos'
  | 'portals'
  | 'notices'
  | 'admin_dashboard'
  | 'portfolio'
  | 'about'
  | 'contact'
  | 'privacy_policy'
  | 'terms'
  | 'return_refund'
  | 'delivery_policy'
  | 'pricing';

export type ManagedModuleKey =
  | 'lesson_plan'
  | 'questions'
  | 'suggestions'
  | 'applications'
  | 'monthly_fln'
  | 'evaluation'
  | 'books'
  | 'certificates'
  | 'students'
  | 'forum'
  | 'videos'
  | 'portals';

export interface FeatureSettings {
  showNoticeTicker: boolean;
  tickerLabel: string;
  showHeroVisual?: boolean;
  showDeveloperSpotlight: boolean;
  apkDownloadUrl?: string;
  enabledModules: Record<ManagedModuleKey, boolean>;
}

export interface TeacherProfile {
  name: string;
  designation: string;
  school: string;
  villagePost?: string;
  upazila: string;
  district: string;
  phone: string;
  emisCode?: string;
}

export interface LessonPlanItem {
  id: string;
  classLevel: string;
  subject: string;
  term?: '১ম প্রান্তিক' | '২য় প্রান্তিক' | '৩য় প্রান্তিক';
  partLabel?: 'পার্ট ১' | 'পার্ট ২' | 'পার্ট ৩';
  chapter: string;
  lessonTitle: string;
  duration: string;
  learningOutcomes: string[];
  materials: string[];
  warmUp: string;
  presentation: string[];
  evaluation: string[];
  homework: string;
}

export interface QuestionItem {
  id: string;
  classLevel: string;
  subject: string;
  term?: '১ম প্রান্তিক' | '২য় প্রান্তিক' | '৩য় প্রান্তিক';
  chapter: string;
  type: 'শূন্যস্থান পূরণ' | 'সঠিক উত্তর' | 'সংক্ষিপ্ত প্রশ্ন' | 'রচনামূলক প্রশ্ন';
  subCategory?: string;
  marks?: number;
  question: string;
  options?: string[];
  answer: string;
}

export interface Student {
  id: string;
  classLevel: string;
  section: string;
  roll: string;
  name: string;
  gender: 'ছাত্র' | 'ছাত্রী';
  fatherName: string;
  motherName: string;
  dob: string;
  guardianPhone: string;
  village: string;
  stipendId?: string;
  bloodGroup?: string;
  photoDataUrl?: string;
  sessionYear?: string;
}

export type GradingSystemMode = 'nctb_2026' | 'gpa_5';

export type QualityRating = 'ক' | 'খ' | 'গ';

export interface SubjectAssessmentDetail {
  /** ধারাবাহিক মূল্যায়ন (Continuous Assessment — NCTB 2026: ৫০ বা ৩০) */
  continuousMarks: number;
  caBreakdown?: {
    /** ১.১ পাঠ্যপুস্তক / শিক্ষক সহায়িকার কাজ সম্পন্ন করা (২০ বা ১০) */
    textbookWork?: number;
    /** ১.২ শ্রেণিকাজে সক্রিয়তা (৫) */
    classActivity?: number;
    /** ১.৩ ভাষাদক্ষতা / বিষয়বস্তুর বোধগম্যতা (৫) */
    comprehension?: number;
    /** ১.৪ ক্লাস টেস্ট (২০ বা ১০) */
    classTest?: number;
    /** Legacy fields kept optional for backward compatibility */
    classwork?: number;
    oral?: number;
    attendance?: number;
  };
  /** সামষ্টিক মূল্যায়ন (Summative Assessment — ২০২৬: ১ম-২য় ৫০, ৩য়-৫ম ৭০, প্রাক-প্রাথমিক/শুধু TG ০) */
  summativeMarks: number;
  /** প্রশ্নকাঠামো ভিত্তিক সামষ্টিক নম্বর বিভাজন (legacy type summary) */
  saSections?: Partial<Record<QuestionItem['type'], number>>;
  /** NCTB 2026 প্রশ্নকাঠামো আইটেম-ভিত্তিক সামষ্টিক নম্বর */
  saPartScores?: Record<string, number>;
  /** মূল্যায়ন মন্তব্য বা পারদর্শিতার সূচক (PI) */
  piRemark?: string;
}

export interface EvaluationRecord {
  id: string;
  classLevel: string;
  term: string;
  roll: string;
  studentName: string;
  bangla: number;
  english: number;
  math: number;
  science: number;
  bgs: number;
  religion: number;
  /** বিশেষ চাহিদাসম্পন্ন শিক্ষার্থী (বিষয়ভিত্তিক পাস ৩৩%) */
  isSpecialNeeds?: boolean;
  /** উপস্থিতি ও কার্যদিবস (ন্যূনতম ৮৫% উপস্থিতি যাচাই) */
  attendanceDays?: number;
  totalWorkingDays?: number;
  /** ব্যক্তিগত ও সামাজিক গুণাবলি (ক = উত্তম, খ = সন্তোষজনক, গ = উন্নতি প্রয়োজন) */
  personalQualities?: {
    activity: QualityRating;
    discipline: QualityRating;
    behavior: QualityRating;
  };
  /** শ্রেণি প্রমোশন অবস্থা (ফেলকৃত বিষয়সহ শর্তসাপেক্ষ প্রমোট সমর্থিত) */
  promotionStatus?: 'pending' | 'promoted' | 'conditional_promoted' | 'retained';
  promotedToClass?: string;
  promotedAt?: string;
  promotionNote?: string;
  /** শ্রেণি-ভিত্তিক বিষয়সমূহের বিস্তারিত ধারাবাহিক + প্রশ্নকাঠামো-ভিত্তিক সামষ্টিক নম্বর */
  subjectDetails?: Record<string, SubjectAssessmentDetail>;
}

export interface ForumReply {
  id: string;
  author: string;
  school: string;
  date: string;
  text: string;
}

export interface ForumPost {
  id: string;
  author: string;
  school: string;
  date: string;
  content: string;
  likes: number;
  likedByMe?: boolean;
  replies: ForumReply[];
}

export interface VideoItem {
  id: string;
  title: string;
  category:
    | 'শ্রেণিভিত্তিক পাঠ ও ছড়া'
    | 'শিক্ষক প্রশিক্ষণ ও আইসিটি'
    | 'কাব স্কাউট ও সমাবেশ'
    | 'শিক্ষামূলক বিনোদন';
  classLevel: string;
  duration: string;
  youtubeId: string;
  description: string;
}

export interface NoticeItem {
  id: string;
  title: string;
  category: 'অফিসিয়াল নোটিশ' | 'অ্যাপ আপডেট' | 'প্রশিক্ষণ বিজ্ঞপ্তি';
  date: string;
  summary: string;
  body: string;
  isImportant?: boolean;
  isActive?: boolean;
  showInTicker?: boolean;
}

export interface PortalLinkItem {
  name: string;
  badge: string;
  description: string;
  url: string;
}

export interface BookNoteItem {
  id: string;
  classLevel: string;
  subject: string;
  kind: 'পাঠ্যসূচি' | 'পাঠটীকা' | 'বার্ষিক পরিকল্পনা';
  title: string;
  content: string;
}
