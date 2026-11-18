import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  AuthError,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  User,
} from 'firebase/auth';
import { DEFAULT_PROFILE } from '../data/curriculum';
import { auth } from '../firebase';
import {
  activateAuthenticatedWorkspace,
  CloudSyncState,
  detachCloudSyncListener,
  flushPendingCloudSync,
  scheduleCloudDatasetPush,
  subscribeCloudSyncState,
  switchToGuestWorkspace,
  updateUserAccountMetadata,
  UserAccountMeta,
} from '../services/cloudSync';
import { TeacherProfile } from '../types';

export interface RegisterPayload {
  loginId: string;
  password: string;
  displayName: string;
  schoolName: string;
  designation: string;
  importCurrentLocalData: boolean;
}

interface AuthContextValue {
  user: User | null;
  accountMeta: UserAccountMeta | null;
  authReady: boolean;
  syncState: CloudSyncState;
  lastSyncedAt: number | null;
  emailPasswordDisabledInConsole: boolean;
  clearEmailPasswordWarning: () => void;
  loginWithIdPassword: (loginId: string, password: string) => Promise<void>;
  registerWithIdPassword: (payload: RegisterPayload) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (loginId: string) => Promise<string>;
  syncProfileMeta: (profile: TeacherProfile) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const BN_TO_EN_DIGITS: Record<string, string> = {
  '০': '0',
  '১': '1',
  '২': '2',
  '৩': '3',
  '৪': '4',
  '৫': '5',
  '৬': '6',
  '৭': '7',
  '৮': '8',
  '৯': '9',
};

export function normalizeLoginIdToEmail(rawId: string): {
  email: string;
  displayLoginId: string;
  isRealEmail: boolean;
} {
  const converted = rawId
    .trim()
    .replace(/[০-৯]/g, (d) => BN_TO_EN_DIGITS[d] || d);

  if (converted.includes('@')) {
    return {
      email: converted.toLowerCase(),
      displayLoginId: converted,
      isRealEmail: true,
    };
  }

  const sanitized = converted
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9._-]/g, '');

  return {
    email: `${sanitized || 'teacher'}@primarymaster.app`,
    displayLoginId: converted,
    isRealEmail: false,
  };
}

function mapFirebaseAuthError(err: unknown): { message: string; operationNotAllowed?: boolean } {
  const authErr = err as AuthError;
  const code = authErr?.code || '';
  switch (code) {
    case 'auth/operation-not-allowed':
      return {
        operationNotAllowed: true,
        message:
          'Firebase Console-এ এখনো Email/Password লগিন সক্রিয় করা হয়নি। নিচের নির্দেশনা অনুযায়ী চালু করুন অথবা Google দিয়ে লগিন করুন।',
      };
    case 'auth/user-not-found':
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
      return { message: 'আইডি বা পাসওয়ার্ড সঠিক নয়। অনুগ্রহ করে আবার যাচাই করুন।' };
    case 'auth/email-already-in-use':
      return { message: 'এই আইডি বা ইমেইল দিয়ে আগেই অ্যাকাউন্ট তৈরি করা হয়েছে। অনুগ্রহ করে লগিন করুন।' };
    case 'auth/weak-password':
      return { message: 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' };
    case 'auth/invalid-email':
      return { message: 'সঠিক ইউজার আইডি (ইংরেজি অক্ষর/সংখ্যা) বা ইমেইল লিখুন।' };
    case 'auth/too-many-requests':
      return { message: 'অতিরিক্ত চেষ্টার কারণে সাময়িকভাবে ব্লক করা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।' };
    case 'auth/network-request-failed':
      return { message: 'ইন্টারনেট সংযোগ পাওয়া যায়নি। অনলাইনে এসে আবার চেষ্টা করুন।' };
    case 'auth/popup-closed-by-user':
      return { message: 'Google লগিন পপ-আপ বন্ধ করা হয়েছে।' };
    default:
      return { message: authErr?.message || 'লগিন করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।' };
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accountMeta, setAccountMeta] = useState<UserAccountMeta | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [syncState, setSyncState] = useState<CloudSyncState>('idle');
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [emailPasswordDisabledInConsole, setEmailPasswordDisabledInConsole] = useState(false);
  const pendingRegistrationRef = React.useRef<{
    loginId: string;
    initialProfileOverride: TeacherProfile;
    importCurrentGuestData: boolean;
  } | null>(null);

  useEffect(() => {
    return subscribeCloudSyncState((state, syncedAt) => {
      setSyncState(state);
      setLastSyncedAt(syncedAt);
    });
  }, []);

  // Listen to localStorage writes from any page and push to Firestore automatically
  useEffect(() => {
    const onDirty = (e: Event) => {
      const custom = e as CustomEvent<{ key: string; value: unknown }>;
      if (custom.detail?.key) {
        scheduleCloudDatasetPush(custom.detail.key, custom.detail.value);
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        void flushPendingCloudSync();
      }
    };
    window.addEventListener('cloud-sync-dirty', onDirty);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('cloud-sync-dirty', onDirty);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      if (nextUser) {
        try {
          const pending = pendingRegistrationRef.current;
          pendingRegistrationRef.current = null;
          const meta = await activateAuthenticatedWorkspace(nextUser, {
            isBrandNewRegistration: Boolean(pending),
            importCurrentGuestData: pending?.importCurrentGuestData ?? false,
            initialProfileOverride: pending?.initialProfileOverride,
            loginId: pending?.loginId,
          });
          setAccountMeta(meta);
        } catch (err) {
          console.error('Failed to activate user workspace:', err);
        }
      } else {
        setAccountMeta(null);
        detachCloudSyncListener();
      }
      setAuthReady(true);
    });
    return () => {
      unsubscribe();
      detachCloudSyncListener();
    };
  }, []);

  const loginWithIdPassword = useCallback(async (loginId: string, password: string) => {
    const { email } = normalizeLoginIdToEmail(loginId);
    try {
      setEmailPasswordDisabledInConsole(false);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      const mapped = mapFirebaseAuthError(err);
      if (mapped.operationNotAllowed) {
        setEmailPasswordDisabledInConsole(true);
      }
      throw new Error(mapped.message);
    }
  }, []);

  const registerWithIdPassword = useCallback(async (payload: RegisterPayload) => {
    const { email, displayLoginId } = normalizeLoginIdToEmail(payload.loginId);
    if (displayLoginId.length < 2) {
      throw new Error('আইডি কমপক্ষে ২ অক্ষরের হতে হবে।');
    }
    if (payload.password.length < 6) {
      throw new Error('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
    }

    const newProfile: TeacherProfile = {
      ...DEFAULT_PROFILE,
      name: payload.displayName.trim(),
      school: payload.schoolName.trim() || DEFAULT_PROFILE.school,
      designation: payload.designation.trim() || 'সহকারী শিক্ষক',
    };

    pendingRegistrationRef.current = {
      loginId: displayLoginId,
      initialProfileOverride: newProfile,
      importCurrentGuestData: payload.importCurrentLocalData,
    };

    try {
      setEmailPasswordDisabledInConsole(false);
      const cred = await createUserWithEmailAndPassword(auth, email, payload.password);
      await updateProfile(cred.user, { displayName: payload.displayName.trim() });
    } catch (err) {
      pendingRegistrationRef.current = null;
      const mapped = mapFirebaseAuthError(err);
      if (mapped.operationNotAllowed) {
        setEmailPasswordDisabledInConsole(true);
      }
      throw new Error(mapped.message);
    }
  }, []);

  const loginWithGoogle = useCallback(async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      const mapped = mapFirebaseAuthError(err);
      throw new Error(mapped.message);
    }
  }, []);

  const logout = useCallback(async () => {
    await switchToGuestWorkspace();
    await signOut(auth);
    setAccountMeta(null);
  }, []);

  const resetPassword = useCallback(async (loginId: string): Promise<string> => {
    const { email, isRealEmail } = normalizeLoginIdToEmail(loginId);
    if (!isRealEmail) {
      throw new Error(
        'পাসওয়ার্ড রিসেট ইমেইল কেবল আসল ইমেইল ঠিকানায় পাঠানো যায়। ইউজার আইডির পাসওয়ার্ড ভুলে গেলে অ্যাডমিনের সাথে যোগাযোগ করুন বা নতুন আইডি খুলুন।'
      );
    }
    try {
      await sendPasswordResetEmail(auth, email);
      return `${email} ঠিকানায় পাসওয়ার্ড রিসেট লিংক পাঠানো হয়েছে।`;
    } catch (err) {
      const mapped = mapFirebaseAuthError(err);
      throw new Error(mapped.message);
    }
  }, []);

  const syncProfileMeta = useCallback(
    async (profile: TeacherProfile) => {
      if (!user) return;
      await updateUserAccountMetadata(user.uid, profile, accountMeta?.loginId);
      setAccountMeta((prev) =>
        prev
          ? {
              ...prev,
              displayName: profile.name || prev.displayName,
              schoolName: profile.school || prev.schoolName,
              designation: profile.designation || prev.designation,
            }
          : prev
      );
    },
    [user, accountMeta?.loginId]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        accountMeta,
        authReady,
        syncState,
        lastSyncedAt,
        emailPasswordDisabledInConsole,
        clearEmailPasswordWarning: () => setEmailPasswordDisabledInConsole(false),
        loginWithIdPassword,
        registerWithIdPassword,
        loginWithGoogle,
        logout,
        resetPassword,
        syncProfileMeta,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
