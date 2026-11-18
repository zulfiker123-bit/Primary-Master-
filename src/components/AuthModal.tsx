import React, { useEffect, useState } from 'react';
import {
  X,
  LogIn,
  LogOut,
  UserPlus,
  Eye,
  EyeOff,
  KeyRound,
  Cloud,
  CloudOff,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { firebaseProjectId } from '../firebase';
import { APP_VERSION, checkForAppUpdateNow } from '../utils/appUpdater';
import { toBanglaDigit } from '../utils/bangla';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
  onOpenDashboard?: () => void;
  onAuthSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  onOpenDashboard,
  onAuthSuccess,
}) => {
  const {
    user,
    accountMeta,
    syncState,
    lastSyncedAt,
    loginWithIdPassword,
    registerWithIdPassword,
    loginWithGoogle,
    logout,
    resetPassword,
    emailPasswordDisabledInConsole,
    clearEmailPasswordWarning,
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'register' | 'reset'>(initialMode);
  const [switchingAccount, setSwitchingAccount] = useState(false);
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [designation, setDesignation] = useState('সহকারী শিক্ষক');
  const [importCurrentLocalData, setImportCurrentLocalData] = useState(true);
  const [loading, setLoading] = useState(false);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setSwitchingAccount(false);
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const switchMode = (next: 'login' | 'register' | 'reset') => {
    setMode(next);
    setErrorMsg('');
    setSuccessMsg('');
    clearEmailPasswordWarning();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await loginWithIdPassword(loginId, password);
        setSwitchingAccount(false);
        setPassword('');
        onClose();
        onAuthSuccess?.();
      } else if (mode === 'register') {
        await registerWithIdPassword({
          loginId,
          password,
          displayName,
          schoolName,
          designation,
          importCurrentLocalData,
        });
        setSwitchingAccount(false);
        setPassword('');
        onClose();
        onAuthSuccess?.();
      } else {
        const msg = await resetPassword(loginId);
        setSuccessMsg(msg);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'সমস্যা হয়েছে, আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);
    try {
      await loginWithGoogle();
      setSwitchingAccount(false);
      onClose();
      onAuthSuccess?.();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Google লগিন ব্যর্থ হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckUpdate = async () => {
    setCheckingUpdate(true);
    try {
      await checkForAppUpdateNow(true);
    } finally {
      setCheckingUpdate(false);
    }
  };

  const consoleAuthProvidersUrl = `https://console.firebase.google.com/project/${firebaseProjectId}/authentication/providers`;

  const syncLabel =
    syncState === 'syncing'
      ? 'ক্লাউডে সেভ হচ্ছে...'
      : syncState === 'synced'
        ? 'সকল ডিভাইসে সিঙ্কড'
        : syncState === 'offline'
          ? 'অফলাইন (অনলাইনে সিঙ্ক হবে)'
          : syncState === 'error'
            ? 'সিঙ্ক সতর্কতা'
            : 'ক্লাউড সিঙ্ক সক্রিয়';

  if (user && !switchingAccount) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 backdrop-blur-xs p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        <div className="w-full max-w-md rounded-2xl bg-white p-5 sm:p-6 shadow-xl border border-stone-200 max-h-[92vh] overflow-y-auto space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0F2922] text-emerald-300">
                {syncState === 'offline' ? (
                  <CloudOff className="h-5 w-5 text-amber-300" aria-hidden="true" />
                ) : (
                  <Cloud className="h-5 w-5" aria-hidden="true" />
                )}
              </div>
              <div>
                <h3 id="auth-modal-title" className="text-base sm:text-lg font-bold text-slate-900">
                  শিক্ষক অ্যাকাউন্ট ও ক্লাউড সিঙ্ক
                </h3>
                <p className="text-[11px] text-emerald-700 font-semibold">{syncLabel}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="বন্ধ করুন"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 space-y-1.5">
            <p className="text-sm font-bold text-slate-900">
              {accountMeta?.displayName || user.displayName || 'শিক্ষক অ্যাকাউন্ট'}
            </p>
            <p className="text-xs text-slate-600">
              লগিন আইডি:{' '}
              <span className="font-mono font-semibold text-slate-900">
                {accountMeta?.loginId || user.email || user.uid.slice(0, 12)}
              </span>
            </p>
            {accountMeta?.schoolName && (
              <p className="text-xs text-slate-600">{accountMeta.schoolName}</p>
            )}
            {lastSyncedAt && (
              <p className="text-[11px] text-emerald-800 pt-1">
                সর্বশেষ সিঙ্ক:{' '}
                {new Date(lastSyncedAt).toLocaleTimeString('bn-BD', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            )}
          </div>

          <div className="space-y-2.5">
            {onOpenDashboard && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenDashboard();
                }}
                className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F2922] px-4 text-xs sm:text-sm font-semibold text-white hover:bg-emerald-900 transition-colors"
              >
                <SlidersHorizontal className="h-4 w-4 text-emerald-300" aria-hidden="true" />
                <span>অ্যাডমিন ও পরিচালনা ড্যাশবোর্ড খুলুন</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => void handleCheckUpdate()}
              disabled={checkingUpdate}
              className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-4 text-xs sm:text-sm font-semibold text-slate-800 hover:bg-stone-100 transition-colors"
            >
              <RefreshCw
                className={`h-4 w-4 text-emerald-700 ${checkingUpdate ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              <span>অ্যাপ অটো-আপডেট যাচাই (v{toBanglaDigit(APP_VERSION)})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('login');
                setSwitchingAccount(true);
              }}
              className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-xs sm:text-sm font-semibold text-emerald-900 hover:bg-emerald-100 transition-colors"
            >
              <KeyRound className="h-4 w-4" aria-hidden="true" />
              <span>অন্য আইডিতে লগিন করুন</span>
            </button>

            <button
              type="button"
              onClick={() => {
                void logout().then(() => onClose());
              }}
              className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 text-xs sm:text-sm font-semibold text-rose-700 hover:bg-rose-100 transition-colors"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span>লগআউট করুন</span>
            </button>
          </div>

          <div className="border-t border-stone-100 pt-3 flex flex-col items-center">
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setSwitchingAccount(true);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
            >
              <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />
              <span>নতুন ইউজার রেজিস্ট্রেশন করুন</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-5 sm:p-6 shadow-xl border border-stone-200 max-h-[92vh] overflow-y-auto space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0F2922] text-emerald-300">
              <Cloud className="h-4.5 w-4.5" aria-hidden="true" />
            </div>
            <div>
              <h3 id="auth-modal-title" className="text-base sm:text-lg font-bold text-slate-900">
                {mode === 'login'
                  ? 'আইডি ও পাসওয়ার্ড দিয়ে লগিন'
                  : mode === 'register'
                    ? 'নতুন ইউজার রেজিস্ট্রেশন'
                    : 'পাসওয়ার্ড রিসেট'}
              </h3>
              <p className="text-[11px] text-slate-500">
                প্রত্যেক শিক্ষকের নিজস্ব ডাটা আলাদাভাবে সংরক্ষিত থাকবে
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="বন্ধ করুন"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="space-y-1.5">
              <p className="font-medium leading-relaxed">{errorMsg}</p>
              {emailPasswordDisabledInConsole && (
                <div className="rounded-lg bg-white/90 border border-rose-200 p-2.5 text-[11px] text-slate-700 space-y-1.5">
                  <p className="font-bold text-slate-900">অ্যাডমিন নির্দেশনা (১ বার সেটআপ):</p>
                  <ol className="list-decimal list-inside space-y-0.5 leading-relaxed">
                    <li>নিচের লিংকে ক্লিক করে Firebase Authentication Providers খুলুন।</li>
                    <li>
                      <strong>Email/Password</strong> নির্বাচন করে <strong>Enable</strong> সুইচ চালু
                      করে Save দিন।
                    </li>
                    <li>এরপর যেকোনো শিক্ষক আইডি ও পাসওয়ার্ড দিয়ে লগিন করতে পারবেন।</li>
                  </ol>
                  <a
                    href={consoleAuthProvidersUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-emerald-700 font-semibold hover:underline"
                  >
                    <span>Firebase Console-এ Enable করুন</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {successMsg && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900 flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
            <p className="font-medium leading-relaxed">{successMsg}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'register' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  শিক্ষকের পূর্ণ নাম
                </label>
                <input
                  type="text"
                  required
                  minLength={1}
                  maxLength={150}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="যেমন: জুলফিকার রহমান"
                  className="w-full h-11 rounded-xl border border-stone-200 px-3.5 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">পদবি</label>
                  <input
                    type="text"
                    maxLength={100}
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="সহকারী শিক্ষক"
                    className="w-full h-11 rounded-xl border border-stone-200 px-3.5 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    বিদ্যালয়ের নাম
                  </label>
                  <input
                    type="text"
                    maxLength={200}
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    placeholder="যেমন: ৮২ নং কোলা সপ্রাবি"
                    className="w-full h-11 rounded-xl border border-stone-200 px-3.5 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ইউজার আইডি / মোবাইল নম্বর / ইমেইল
            </label>
            <input
              type="text"
              required
              minLength={2}
              maxLength={120}
              autoComplete="username"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              placeholder="যেমন: zulfikar82 বা 01767792249 বা email@gmail.com"
              className="w-full h-11 rounded-xl border border-stone-200 px-3.5 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none"
            />
          </div>

          {mode !== 'reset' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => switchMode('reset')}
                    className="text-[11px] font-semibold text-emerald-700 hover:underline"
                  >
                    পাসওয়ার্ড ভুলে গেছেন?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="******"
                  className="w-full h-11 rounded-xl border border-stone-200 pl-3.5 pr-11 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}

          {mode === 'register' && (
            <label className="flex items-start gap-2 rounded-xl border border-stone-200 bg-stone-50 p-3 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={importCurrentLocalData}
                onChange={(e) => setImportCurrentLocalData(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-700"
              />
              <span className="leading-relaxed">
                বর্তমানে এই ডিভাইসে সংরক্ষিত শিক্ষার্থী ও মূল্যায়ন ডাটা আমার নতুন অ্যাকাউন্টে যুক্ত করুন
                (নতুন শিক্ষকের জন্য খালি অ্যাকাউন্ট চাইলে টিক তুলে দিন)
              </span>
            </label>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F2922] px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-60 transition-colors"
          >
            {mode === 'login' ? (
              <LogIn className="h-4 w-4" aria-hidden="true" />
            ) : mode === 'register' ? (
              <UserPlus className="h-4 w-4" aria-hidden="true" />
            ) : (
              <KeyRound className="h-4 w-4" aria-hidden="true" />
            )}
            <span>
              {loading
                ? 'অপেক্ষা করুন...'
                : mode === 'login'
                  ? 'লগিন করুন'
                  : mode === 'register'
                    ? 'রেজিস্ট্রেশন সম্পন্ন করুন'
                    : 'রিসেট লিংক পাঠান'}
            </span>
          </button>
        </form>

        <div className="relative flex items-center py-0.5">
          <div className="flex-grow border-t border-stone-200" />
          <span className="mx-3 shrink text-[11px] font-medium text-slate-400">অথবা</span>
          <div className="flex-grow border-t border-stone-200" />
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={() => void handleGoogleSignIn()}
          className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 hover:bg-stone-50 disabled:opacity-60 transition-colors"
        >
          <ShieldCheck className="h-4 w-4 text-emerald-700" aria-hidden="true" />
          <span>Google অ্যাকাউন্ট দিয়ে ১-ক্লিক লগিন</span>
        </button>

        {/* Bottom Registration / Login Switch Footer */}
        <div className="border-t border-stone-200 pt-3.5">
          {mode === 'login' ? (
            <button
              type="button"
              onClick={() => switchMode('register')}
              className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs sm:text-sm font-bold text-emerald-900 hover:bg-emerald-100 transition-colors"
            >
              <UserPlus className="h-4 w-4 text-emerald-700" aria-hidden="true" />
              <span>নতুন ইউজার রেজিস্ট্রেশন (নতুন আইডি খুলুন)</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => switchMode('login')}
              className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-4 py-2 text-xs sm:text-sm font-semibold text-slate-800 hover:bg-stone-100 transition-colors"
            >
              <LogIn className="h-4 w-4 text-emerald-700" aria-hidden="true" />
              <span>আগে থেকেই আইডি আছে? লগিন করুন</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
