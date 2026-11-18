import React, { useState } from 'react';
import {
  Lock,
  LogIn,
  UserPlus,
  Eye,
  EyeOff,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { firebaseProjectId } from '../firebase';

interface DashboardLoginGateProps {
  onBackHome: () => void;
}

export const DashboardLoginGate: React.FC<DashboardLoginGateProps> = ({ onBackHome }) => {
  const {
    loginWithIdPassword,
    registerWithIdPassword,
    loginWithGoogle,
    resetPassword,
    emailPasswordDisabledInConsole,
    clearEmailPasswordWarning,
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'register' | 'reset'>('login');
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [designation, setDesignation] = useState('সহকারী শিক্ষক');
  const [importCurrentLocalData, setImportCurrentLocalData] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

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
      } else if (mode === 'register') {
        await registerWithIdPassword({
          loginId,
          password,
          displayName,
          schoolName,
          designation,
          importCurrentLocalData,
        });
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
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Google লগিন ব্যর্থ হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  const consoleAuthProvidersUrl = `https://console.firebase.google.com/project/${firebaseProjectId}/authentication/providers`;

  return (
    <div className="mx-auto max-w-lg px-4 py-8 sm:py-12">
      <div className="mb-4">
        <button
          type="button"
          onClick={onBackHome}
          className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-stone-50"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>হোমপেজে ফিরে যান</span>
        </button>
      </div>

      <div className="rounded-3xl border border-stone-200 bg-white p-6 sm:p-7 shadow-sm space-y-5">
        <div className="flex items-start gap-3 border-b border-stone-100 pb-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0F2922] text-emerald-300">
            <Lock className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900">
              {mode === 'login'
                ? 'ড্যাশবোর্ডে প্রবেশ করতে লগিন করুন'
                : mode === 'register'
                  ? 'নতুন ইউজার রেজিস্ট্রেশন'
                  : 'পাসওয়ার্ড রিসেট'}
            </h1>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              লগইন ছাড়া ড্যাশবোর্ডে প্রবেশ করা যাবে না। আপনার নিজস্ব আইডি ও পাসওয়ার্ড দিয়ে প্রবেশ করুন।
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="space-y-1.5">
              <p className="font-medium leading-relaxed">{errorMsg}</p>
              {emailPasswordDisabledInConsole && (
                <a
                  href={consoleAuthProvidersUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-emerald-800 font-semibold hover:underline"
                >
                  <span>Firebase Console-এ Email/Password Enable করুন</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
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

        <form onSubmit={handleSubmit} className="space-y-3.5">
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
                বর্তমানে এই ডিভাইসে সংরক্ষিত ডাটা আমার নতুন অ্যাকাউন্টে যুক্ত করুন (নতুন খালি অ্যাকাউন্টের জন্য টিক তুলে দিন)
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
                  ? 'লগিন ও ড্যাশবোর্ডে প্রবেশ করুন'
                  : mode === 'register'
                    ? 'রেজিস্ট্রেশন ও প্রবেশ করুন'
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
