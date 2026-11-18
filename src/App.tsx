import React, { Suspense, lazy, useState, useCallback, useEffect, useMemo } from 'react';
import { AuthModal } from './components/AuthModal';
import { DashboardLoginGate } from './components/DashboardLoginGate';
import { Header } from './components/Header';
import { HomeDashboard } from './components/HomeDashboard';
import { DesktopLinkModal, ProfileModal } from './components/Modals';
import { LocalBackupModal } from './components/LocalBackupModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { UpdateBanner } from './components/UpdateBanner';
import { useAuth } from './contexts/AuthContext';
import { DEFAULT_PROFILE, INITIAL_NOTICES } from './data/curriculum';
import { DEFAULT_FEATURE_SETTINGS } from './data/featureSettings';
import { useLocalStorage } from './hooks/useLocalStorage';
import { FeatureSettings, NoticeItem, RouteKey, TeacherProfile } from './types';
import {
  DATEWISE_LP_OVERRIDES_KEY,
  DateRowOverrideLike,
  DEFAULT_LESSON_REMINDER_PREFS,
  getLessonRemindersForDate,
  getLocalIsoDate,
  LAST_SEEN_REMINDER_DATE_KEY,
  LESSON_REMINDER_PREFS_KEY,
  LessonReminderPrefs,
} from './utils/lessonReminders';

// Lazy-loaded feature chunks for ultra-fast initial load speed
const loadLessonPlan = () => import('./pages/LessonPlanPage');
const loadQuestions = () => import('./pages/QuestionsPage');
const loadSuggestions = () => import('./pages/SuggestionsPage');
const loadApplications = () => import('./pages/ApplicationsPage');
const loadMonthlyFln = () => import('./pages/MonthlyFlnPage');
const loadTerminalCompetencies = () => import('./pages/TerminalCompetenciesPage');
const loadEvaluation = () => import('./pages/EvaluationPage');
const loadBooks = () => import('./pages/BooksPage');
const loadCertificates = () => import('./pages/CertificatesPage');
const loadStudents = () => import('./pages/StudentsPage');
const loadForum = () => import('./pages/ForumPage');
const loadVideos = () => import('./pages/VideosPage');
const loadPortals = () => import('./pages/PortalsPage');
const loadNotices = () => import('./pages/NoticesPage');
const loadAdminDashboard = () => import('./pages/AdminDashboardPage');
const loadPortfolio = () => import('./pages/PortfolioPage');
const loadInfoPages = () => import('./pages/InfoPages');

const LessonPlanPage = lazy(loadLessonPlan);
const QuestionsPage = lazy(loadQuestions);
const SuggestionsPage = lazy(loadSuggestions);
const ApplicationsPage = lazy(loadApplications);
const MonthlyFlnPage = lazy(loadMonthlyFln);
const TerminalCompetenciesPage = lazy(loadTerminalCompetencies);
const EvaluationPage = lazy(loadEvaluation);
const BooksPage = lazy(loadBooks);
const CertificatesPage = lazy(loadCertificates);
const StudentsPage = lazy(loadStudents);
const ForumPage = lazy(loadForum);
const VideosPage = lazy(loadVideos);
const PortalsPage = lazy(loadPortals);
const NoticesPage = lazy(loadNotices);
const AdminDashboardPage = lazy(loadAdminDashboard);
const PortfolioPage = lazy(loadPortfolio);
const InfoPages = lazy(loadInfoPages);

const PREFETCH_MAP: Partial<Record<RouteKey, () => Promise<unknown>>> = {
  lesson_plan: loadLessonPlan,
  questions: loadQuestions,
  suggestions: loadSuggestions,
  applications: loadApplications,
  monthly_fln: loadMonthlyFln,
  terminal_competencies: loadTerminalCompetencies,
  evaluation: loadEvaluation,
  books: loadBooks,
  certificates: loadCertificates,
  students: loadStudents,
  forum: loadForum,
  videos: loadVideos,
  portals: loadPortals,
  notices: loadNotices,
  admin_dashboard: loadAdminDashboard,
  portfolio: loadPortfolio,
  about: loadInfoPages,
  contact: loadInfoPages,
  privacy_policy: loadInfoPages,
  terms: loadInfoPages,
  return_refund: loadInfoPages,
  delivery_policy: loadInfoPages,
  pricing: loadInfoPages,
};

function RouteSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-6 space-y-4">
      <div className="h-16 rounded-2xl bg-white border border-slate-200 animate-pulse" />
      <div className="h-64 rounded-2xl bg-white border border-slate-200 animate-pulse" />
    </div>
  );
}

export default function App() {
  const [route, setRoute] = useState<RouteKey>(() => {
    const hash = window.location.hash.replace('#', '') as RouteKey;
    return hash && (hash === 'home' || PREFETCH_MAP[hash]) ? hash : 'home';
  });

  const [profile, setProfile] = useLocalStorage<TeacherProfile>(
    'teacher_profile_data',
    DEFAULT_PROFILE
  );
  const [notices, setNotices] = useLocalStorage<NoticeItem[]>(
    'app_notices_v1',
    INITIAL_NOTICES
  );
  const [featureSettings, setFeatureSettings] = useLocalStorage<FeatureSettings>(
    'app_feature_settings_v1',
    DEFAULT_FEATURE_SETTINGS
  );
  const [seenNoticesCount, setSeenNoticesCount] = useLocalStorage<number>(
    'last_seen_notices_count',
    0
  );
  const [reminderPrefs, setReminderPrefs] = useLocalStorage<LessonReminderPrefs>(
    LESSON_REMINDER_PREFS_KEY,
    DEFAULT_LESSON_REMINDER_PREFS
  );
  const [lastSeenReminderDate, setLastSeenReminderDate] = useLocalStorage<string>(
    LAST_SEEN_REMINDER_DATE_KEY,
    ''
  );
  const [dateOverrides] = useLocalStorage<Record<string, DateRowOverrideLike>>(
    DATEWISE_LP_OVERRIDES_KEY,
    {}
  );

  const { user, authReady, syncProfileMeta } = useAuth();
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [backupModalOpen, setBackupModalOpen] = useState(false);
  const [desktopModalOpen, setDesktopModalOpen] = useState(false);
  const [printReady, setPrintReady] = useState(false);

  const todayIso = getLocalIsoDate();
  const todayReminderSummary = useMemo(
    () => getLessonRemindersForDate(todayIso, reminderPrefs, dateOverrides),
    [todayIso, reminderPrefs, dateOverrides]
  );

  const activeNoticesCount = notices.filter((n) => n.isActive !== false).length;
  const unreadNotices = Math.max(0, activeNoticesCount - seenNoticesCount);
  const unreadLessonReminders =
    lastSeenReminderDate === todayIso ? 0 : todayReminderSummary.scheduledLessons.length;
  const totalUnreadBellCount = unreadNotices + unreadLessonReminders;

  const handleSaveProfile = useCallback(
    (nextProfile: TeacherProfile) => {
      setProfile(nextProfile);
      if (user) {
        void syncProfileMeta(nextProfile).catch(() => {});
      }
    },
    [setProfile, syncProfileMeta, user]
  );

  // One-time safe migration: replace previous sample defaults in localStorage with new defaults
  useEffect(() => {
    if (user) return;
    try {
      const migrated = window.localStorage.getItem('default_profile_zulfikar_v1');
      if (migrated) return;

      const isOldProfile =
        profile.name.includes('আখতার হোসেন') ||
        profile.school === 'আদর্শ সরকারি প্রাথমিক বিদ্যালয়' ||
        profile.upazila === 'সেনবাগ' ||
        profile.district === 'নোয়াখালী' ||
        profile.phone === '01700000000';

      if (isOldProfile) {
        setProfile(DEFAULT_PROFILE);
      } else if (!profile.villagePost) {
        setProfile({ ...profile, villagePost: DEFAULT_PROFILE.villagePost });
      }

      const rawStudents = window.localStorage.getItem('students_list_v1');
      if (rawStudents) {
        const parsedStudents = JSON.parse(rawStudents);
        if (Array.isArray(parsedStudents)) {
          const updatedStudents = parsedStudents.map((s: { village?: string }) => {
            if (s?.village === 'ছাতারপাইয়া') return { ...s, village: 'কোলা' };
            if (s?.village === 'কানকিরহাট') return { ...s, village: 'মাড়িয়ালা' };
            return s;
          });
          window.localStorage.setItem('students_list_v1', JSON.stringify(updatedStudents));
        }
      }

      const rawForum = window.localStorage.getItem('teacher_forum_v1');
      if (rawForum) {
        const updatedForumStr = rawForum
          .replace(/আখতার হোসেন \(শিমুল\)/g, 'জুলফিকার রহমান')
          .replace(/ছাতারপাইয়া সরকারি প্রাথমিক বিদ্যালয়, সেনবাগ, নোয়াখালী/g, '৮২ নং কোলা সরকারি প্রাথমিক বিদ্যালয়, আশাশুনি, সাতক্ষীরা')
          .replace(/ধন্যবাদ শিমুল স্যারকে এত চমৎকার উদ্যোগের জন্য।/g, 'এত চমৎকার ও কার্যকর উদ্যোগের জন্য আন্তরিক ধন্যবাদ।');
        window.localStorage.setItem('teacher_forum_v1', updatedForumStr);
      }

      window.localStorage.setItem('default_profile_zulfikar_v1', '1');
    } catch {
      // Ignore storage errors safely
    }
  }, [profile, setProfile]);

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace('#', '') as RouteKey;
      setRoute(hash && (hash === 'home' || PREFETCH_MAP[hash]) ? hash : 'home');
      setPrintReady(false);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Warm all lazy feature chunks during idle time so every module works 100% offline
  useEffect(() => {
    const timer = window.setTimeout(() => {
      Object.values(PREFETCH_MAP).forEach((loader) => {
        if (loader) {
          loader().catch(() => {});
        }
      });
    }, 1500);
    return () => window.clearTimeout(timer);
  }, []);

  const handleNavigate = useCallback((nextRoute: RouteKey) => {
    setPrintReady(false);
    setRoute(nextRoute);
    window.location.hash = nextRoute === 'home' ? '' : nextRoute;
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  const handlePrefetch = useCallback((target: RouteKey) => {
    const loader = PREFETCH_MAP[target];
    if (loader) {
      loader().catch(() => {});
    }
  }, []);

  const handleMarkAllRead = useCallback(() => {
    setSeenNoticesCount(activeNoticesCount);
    setLastSeenReminderDate(todayIso);
  }, [activeNoticesCount, setLastSeenReminderDate, setSeenNoticesCount, todayIso]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F7F4] text-slate-900">
      {!printReady && (
        <Header
          currentRoute={route}
          onNavigate={handleNavigate}
          onPrefetch={handlePrefetch}
          unreadNotices={totalUnreadBellCount}
          onOpenProfile={() => setProfileModalOpen(true)}
        />
      )}

      <main className="flex-1">
        {route === 'home' ? (
          <HomeDashboard
            profile={profile}
            notices={notices}
            featureSettings={featureSettings}
            todayReminderSummary={todayReminderSummary}
            onNavigate={handleNavigate}
            onPrefetch={handlePrefetch}
            onOpenProfile={() => setProfileModalOpen(true)}
            onOpenBackup={() => setBackupModalOpen(true)}
            onOpenDesktop={() => setDesktopModalOpen(true)}
            onOpenAuth={(mode = 'login') => {
              setAuthModalMode(mode);
              setAuthModalOpen(true);
            }}
          />
        ) : (
          <Suspense fallback={<RouteSkeleton />}>
            {route === 'lesson_plan' && (
              <LessonPlanPage
                profile={profile}
                onNavigate={handleNavigate}
                printReady={printReady}
                onTogglePrintReady={() => setPrintReady((v) => !v)}
              />
            )}
            {route === 'questions' && <QuestionsPage onNavigate={handleNavigate} />}
            {route === 'suggestions' && (
              <SuggestionsPage profile={profile} onNavigate={handleNavigate} />
            )}
            {route === 'applications' && (
              <ApplicationsPage profile={profile} onNavigate={handleNavigate} />
            )}
            {route === 'monthly_fln' && (
              <MonthlyFlnPage profile={profile} onNavigate={handleNavigate} />
            )}
            {route === 'terminal_competencies' && (
              <TerminalCompetenciesPage profile={profile} onNavigate={handleNavigate} />
            )}
            {route === 'evaluation' && (
              <EvaluationPage profile={profile} onNavigate={handleNavigate} />
            )}
            {route === 'books' && <BooksPage onNavigate={handleNavigate} />}
            {route === 'certificates' && (
              <CertificatesPage
                profile={profile}
                onNavigate={handleNavigate}
                printReady={printReady}
                onTogglePrintReady={() => setPrintReady((v) => !v)}
              />
            )}
            {route === 'students' && (
              <StudentsPage profile={profile} onNavigate={handleNavigate} />
            )}
            {route === 'forum' && <ForumPage profile={profile} onNavigate={handleNavigate} />}
            {route === 'videos' && <VideosPage onNavigate={handleNavigate} />}
            {route === 'portals' && <PortalsPage onNavigate={handleNavigate} />}
            {route === 'notices' && (
              <NoticesPage
                notices={notices}
                onNavigate={handleNavigate}
                onMarkAllRead={handleMarkAllRead}
                reminderPrefs={reminderPrefs}
                onUpdateReminderPrefs={setReminderPrefs}
                dateOverrides={dateOverrides}
              />
            )}
            {route === 'admin_dashboard' && (
              !authReady ? (
                <RouteSkeleton />
              ) : !user ? (
                <DashboardLoginGate onBackHome={() => handleNavigate('home')} />
              ) : (
                <AdminDashboardPage
                  profile={profile}
                  onSaveProfile={handleSaveProfile}
                  notices={notices}
                  onUpdateNotices={setNotices}
                  featureSettings={featureSettings}
                  onUpdateFeatureSettings={setFeatureSettings}
                  onNavigate={handleNavigate}
                  onOpenAuth={(mode = 'login') => {
                    setAuthModalMode(mode);
                    setAuthModalOpen(true);
                  }}
                />
              )
            )}
            {route === 'portfolio' && <PortfolioPage onNavigate={handleNavigate} />}
            {(route === 'about' ||
              route === 'contact' ||
              route === 'privacy_policy' ||
              route === 'terms' ||
              route === 'return_refund' ||
              route === 'delivery_policy' ||
              route === 'pricing') && <InfoPages route={route} onNavigate={handleNavigate} />}
          </Suspense>
        )}
      </main>

      <ProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        profile={profile}
        onSave={handleSaveProfile}
      />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
        onOpenDashboard={() => handleNavigate('admin_dashboard')}
      />

      <LocalBackupModal
        isOpen={backupModalOpen}
        onClose={() => setBackupModalOpen(false)}
      />

      <DesktopLinkModal
        isOpen={desktopModalOpen}
        onClose={() => setDesktopModalOpen(false)}
      />

      <UpdateBanner />
      <OfflineIndicator />
    </div>
  );
}
