import { FeatureSettings, ManagedModuleKey } from '../types';

export interface ManagedModuleDef {
  key: ManagedModuleKey;
  title: string;
  subtitle: string;
}

export const MANAGED_MODULES: ManagedModuleDef[] = [
  { key: 'lesson_plan', title: 'পাঠ পরিকল্পনা', subtitle: '(১ম–৫ম) সকল বিষয়ের' },
  { key: 'questions', title: 'প্রশ্ন উত্তর', subtitle: 'অধ্যায়ভিত্তিক প্রশ্ন ও সমাধান' },
  { key: 'suggestions', title: 'প্রশ্ন ও সাজেশন', subtitle: 'পরীক্ষার শতভাগ প্রস্তুতি ও পেপার' },
  { key: 'applications', title: 'আবেদন সমূহ', subtitle: 'নৈমিত্তিক ছুটি, হোম ভিজিট' },
  { key: 'monthly_fln', title: 'মাসিক FLN', subtitle: '১২ মাস প্রান্তিক যোগ্যতা যাচাই' },
  { key: 'evaluation', title: 'মূল্যায়ন রেকর্ড', subtitle: 'ধারাবাহিক মূল্যায়ন ও মার্কশিট' },
  { key: 'books', title: 'বই ও পাঠটীকা', subtitle: 'সকল শ্রেণির মূল বই ও গাইড' },
  { key: 'certificates', title: 'সনদ ও প্রত্যয়ন', subtitle: 'প্রশংসাপত্র, ছাড়পত্র (TC)' },
  { key: 'students', title: 'শিক্ষার্থীর তথ্য', subtitle: 'প্রোফাইল তৈরি ও A4 প্রিন্ট' },
  { key: 'forum', title: 'শিক্ষক ফোরাম', subtitle: 'মতামত ও অভিজ্ঞতা বিনিময়' },
  { key: 'videos', title: 'শিক্ষামূলক ভিডিও', subtitle: 'পাঠদান, ছড়া ও প্রশিক্ষণ' },
  { key: 'portals', title: 'পোর্টাল ও নির্দেশিকা', subtitle: 'IPEMIS, PESP, ছুটির তালিকা' },
];

export const DEFAULT_FEATURE_SETTINGS: FeatureSettings = {
  showNoticeTicker: true,
  tickerLabel: 'জরুরি নোটিশ',
  showHeroVisual: false,
  showDeveloperSpotlight: true,
  apkDownloadUrl: '',
  enabledModules: {
    lesson_plan: true,
    questions: true,
    suggestions: true,
    applications: true,
    monthly_fln: true,
    evaluation: true,
    books: true,
    certificates: true,
    students: true,
    forum: true,
    videos: true,
    portals: true,
  },
};
