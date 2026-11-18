import { User } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Unsubscribe,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { TeacherProfile } from '../types';
import { idbDeleteItems, idbGetItem, idbSetItem } from '../utils/phoneStorage';

export const SYNCED_DATASET_KEYS = [
  'teacher_profile_data',
  'app_notices_v1',
  'app_feature_settings_v1',
  'last_seen_notices_count',
  'students_list_v1',
  'evaluation_records_v1',
  'monthly_fln_records_v1',
  'teacher_forum_v1',
  'custom_lesson_plans_v1',
  'custom_questions_v1',
  'custom_book_notes_v1',
  'edu_videos_v1',
  'custom_portals_v1',
  'nctb_completed_parts_v1',
  'datewise_lp_overrides_v1',
  'lesson_reminder_prefs_v1',
  'last_seen_lesson_reminder_date_v1',
  'print_preferences_v1',
  'last_backup_at',
] as const;

export type SyncedDatasetKey = (typeof SYNCED_DATASET_KEYS)[number];

const TRANSIENT_SEED_FLAGS = [
  'annual_lp_seeded_v3',
  'rich_qb_seeded_v4',
  'default_profile_zulfikar_v1',
];

const ACTIVE_UID_STORAGE_KEY = 'pm_active_sync_uid';
const MAX_FIRESTORE_PAYLOAD_BYTES = 780_000;

export interface UserAccountMeta {
  uid: string;
  loginId: string;
  displayName: string;
  schoolName?: string;
  designation?: string;
  role: 'teacher' | 'admin';
}

export type CloudSyncState = 'idle' | 'syncing' | 'synced' | 'offline' | 'error';

const syncStateListeners = new Set<(state: CloudSyncState, lastSyncedAt: number | null) => void>();
let currentSyncState: CloudSyncState = 'idle';
let lastSyncedTimestamp: number | null = null;

function setCloudSyncState(state: CloudSyncState, syncedAt?: number) {
  currentSyncState = state;
  if (syncedAt) {
    lastSyncedTimestamp = syncedAt;
  }
  syncStateListeners.forEach((cb) => cb(currentSyncState, lastSyncedTimestamp));
}

export function subscribeCloudSyncState(
  cb: (state: CloudSyncState, lastSyncedAt: number | null) => void
): () => void {
  syncStateListeners.add(cb);
  cb(currentSyncState, lastSyncedTimestamp);
  return () => {
    syncStateListeners.delete(cb);
  };
}

function isSyncedDatasetKey(key: string): key is SyncedDatasetKey {
  return (SYNCED_DATASET_KEYS as readonly string[]).includes(key);
}

/**
 * Recursively strips `undefined` so Firestore writes never fail on optional properties.
 */
function stripUndefined<T>(input: T): T {
  if (Array.isArray(input)) {
    return input.map((item) => stripUndefined(item)) as unknown as T;
  }
  if (input && typeof input === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
      if (v !== undefined) {
        out[k] = stripUndefined(v);
      }
    }
    return out as T;
  }
  return input;
}

function getUtf8ByteSize(val: unknown): number {
  const str = JSON.stringify(val) || '';
  return new TextEncoder().encode(str).length;
}

function prepareCloudPayload(key: SyncedDatasetKey, rawValue: unknown): unknown | null {
  const clean = stripUndefined(rawValue);
  const bytes = getUtf8ByteSize(clean);
  if (bytes <= MAX_FIRESTORE_PAYLOAD_BYTES) {
    return clean;
  }

  // If custom_lesson_plans_v1 or custom_questions_v1 exceeds safe Firestore doc size,
  // keep only user-created / customized entries or recent tail that fits cleanly under 780KB.
  if (Array.isArray(clean)) {
    if (key === 'custom_questions_v1' || key === 'custom_lesson_plans_v1') {
      const customEntries = clean.filter((item) => {
        const id = typeof (item as { id?: unknown })?.id === 'string' ? (item as { id: string }).id : '';
        return id.startsWith('custom-') || id.startsWith('lp-custom-') || id.startsWith('q-custom-');
      });
      if (customEntries.length > 0 && getUtf8ByteSize(customEntries) <= MAX_FIRESTORE_PAYLOAD_BYTES) {
        return { __customOnly: true, items: customEntries };
      }
      // If no custom items yet, skip syncing static seed bank to save bandwidth & stay under 1MB
      return { __customOnly: true, items: [] };
    }
  }

  return null;
}

// ==================== Local Vault Snapshots (Per-User Offline Isolation) ====================

export function getActiveSyncUid(): string {
  try {
    return window.localStorage.getItem(ACTIVE_UID_STORAGE_KEY) || 'guest';
  } catch {
    return 'guest';
  }
}

function setActiveSyncUid(uid: string) {
  try {
    window.localStorage.setItem(ACTIVE_UID_STORAGE_KEY, uid);
  } catch {
    // ignore
  }
}

export async function saveUserLocalVault(uid: string): Promise<void> {
  const snapshot: Record<string, string> = {};
  for (const key of SYNCED_DATASET_KEYS) {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) {
        snapshot[key] = raw;
      }
    } catch {
      // ignore
    }
  }
  await idbSetItem(`user_vault::${uid}`, JSON.stringify(snapshot));
}

export async function clearActiveWorkspaceKeys(): Promise<void> {
  const allToRemove = [...SYNCED_DATASET_KEYS, ...TRANSIENT_SEED_FLAGS];
  for (const key of allToRemove) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }
  await idbDeleteItems(allToRemove);
  for (const key of SYNCED_DATASET_KEYS) {
    window.dispatchEvent(new CustomEvent('local-storage-sync', { detail: { key } }));
  }
}

export async function restoreUserLocalVault(uid: string): Promise<boolean> {
  const rawVault = await idbGetItem(`user_vault::${uid}`);
  if (!rawVault) return false;
  try {
    const parsed = JSON.parse(rawVault) as Record<string, string>;
    for (const [key, serialized] of Object.entries(parsed)) {
      if (!isSyncedDatasetKey(key) || typeof serialized !== 'string') continue;
      try {
        window.localStorage.setItem(key, serialized);
        await idbSetItem(key, serialized);
        window.dispatchEvent(new CustomEvent('local-storage-sync', { detail: { key } }));
      } catch {
        // ignore quota error
      }
    }
    return true;
  } catch {
    return false;
  }
}

function readLocalJson(key: SyncedDatasetKey): unknown | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function applyRemoteDatasetToLocal(key: SyncedDatasetKey, remoteData: unknown): void {
  // Handle custom-only compact payload for large seed banks
  let finalValue = remoteData;
  if (
    remoteData &&
    typeof remoteData === 'object' &&
    !Array.isArray(remoteData) &&
    (remoteData as { __customOnly?: boolean }).__customOnly === true
  ) {
    const customItems = Array.isArray((remoteData as { items?: unknown[] }).items)
      ? (remoteData as { items: unknown[] }).items
      : [];
    const currentLocal = readLocalJson(key);
    if (Array.isArray(currentLocal) && customItems.length > 0) {
      const existingIds = new Set(
        currentLocal.map((i) => (i as { id?: string })?.id).filter(Boolean)
      );
      const merged = [...customItems.filter((i) => !existingIds.has((i as { id?: string })?.id)), ...currentLocal];
      finalValue = merged;
    } else if (customItems.length === 0) {
      return;
    } else {
      finalValue = customItems;
    }
  }

  const serialized = JSON.stringify(finalValue);
  const currentRaw = window.localStorage.getItem(key);
  if (currentRaw === serialized) return;

  try {
    window.localStorage.setItem(key, serialized);
  } catch {
    // ignore quota error
  }
  void idbSetItem(key, serialized);
  window.dispatchEvent(new CustomEvent('local-storage-sync', { detail: { key } }));
}

// ==================== Firestore Account & Dataset Operations ====================

export async function ensureUserAccountDoc(
  user: User,
  overrides?: {
    loginId?: string;
    displayName?: string;
    schoolName?: string;
    designation?: string;
  }
): Promise<UserAccountMeta> {
  const userDocPath = `users/${user.uid}`;
  const userRef = doc(db, 'users', user.uid);

  try {
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const existing = snap.data() as Partial<UserAccountMeta>;
      const meta: UserAccountMeta = {
        uid: user.uid,
        loginId: String(existing.loginId || overrides?.loginId || user.email || user.uid).slice(0, 120),
        displayName: String(existing.displayName || overrides?.displayName || user.displayName || 'শিক্ষক').slice(0, 150),
        schoolName: existing.schoolName || overrides?.schoolName || '',
        designation: existing.designation || overrides?.designation || 'সহকারী শিক্ষক',
        role: existing.role === 'admin' ? 'admin' : 'teacher',
      };
      return meta;
    }

    const fallbackLoginId = (
      overrides?.loginId ||
      user.email ||
      user.uid
    )
      .trim()
      .slice(0, 120);
    const displayName = (
      overrides?.displayName ||
      user.displayName ||
      fallbackLoginId.split('@')[0] ||
      'শিক্ষক'
    )
      .trim()
      .slice(0, 150);
    const schoolName = (overrides?.schoolName || '').trim().slice(0, 200);
    const designation = (overrides?.designation || 'সহকারী শিক্ষক').trim().slice(0, 100);

    const payload = {
      uid: user.uid,
      loginId: fallbackLoginId.length >= 2 ? fallbackLoginId : `user_${user.uid.slice(0, 8)}`,
      displayName: displayName.length >= 1 ? displayName : 'শিক্ষক',
      schoolName,
      designation,
      role: 'teacher' as const,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(userRef, payload);

    return {
      uid: user.uid,
      loginId: payload.loginId,
      displayName: payload.displayName,
      schoolName: payload.schoolName,
      designation: payload.designation,
      role: 'teacher',
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, userDocPath);
  }
}

export async function updateUserAccountMetadata(
  uid: string,
  profile: TeacherProfile,
  loginId?: string
): Promise<void> {
  const userDocPath = `users/${uid}`;
  const userRef = doc(db, 'users', uid);
  try {
    const updatePayload: Record<string, unknown> = {
      displayName: (profile.name || 'শিক্ষক').trim().slice(0, 150),
      schoolName: (profile.school || '').trim().slice(0, 200),
      designation: (profile.designation || 'সহকারী শিক্ষক').trim().slice(0, 100),
      updatedAt: serverTimestamp(),
    };
    if (loginId && loginId.trim().length >= 2) {
      updatePayload.loginId = loginId.trim().slice(0, 120);
    }
    await updateDoc(userRef, updatePayload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, userDocPath);
  }
}

export async function pushDatasetToCloud(
  uid: string,
  key: SyncedDatasetKey,
  value: unknown
): Promise<void> {
  if (!uid || uid === 'guest') return;
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    setCloudSyncState('offline');
    return;
  }

  const prepared = prepareCloudPayload(key, value);
  if (prepared === null) return;

  const docPath = `users/${uid}/datasets/${key}`;
  setCloudSyncState('syncing');

  try {
    await setDoc(doc(db, 'users', uid, 'datasets', key), {
      uid,
      datasetKey: key,
      payload: { data: prepared },
      clientUpdatedMs: Date.now(),
      updatedAt: serverTimestamp(),
    });
    setCloudSyncState('synced', Date.now());
  } catch (error) {
    setCloudSyncState('error');
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

// ==================== Active Session Sync Manager ====================

let activeCloudUid: string | null = null;
let unsubscribeDatasets: Unsubscribe | null = null;
const pendingWrites = new Map<SyncedDatasetKey, { value: unknown; timer: number }>();

export function detachCloudSyncListener(): void {
  if (unsubscribeDatasets) {
    unsubscribeDatasets();
    unsubscribeDatasets = null;
  }
  activeCloudUid = null;
}

export async function flushPendingCloudSync(): Promise<void> {
  const uid = activeCloudUid;
  if (!uid) {
    pendingWrites.clear();
    return;
  }
  const entries = Array.from(pendingWrites.entries());
  pendingWrites.clear();
  for (const [key, item] of entries) {
    window.clearTimeout(item.timer);
    await pushDatasetToCloud(uid, key, item.value);
  }
}

export function scheduleCloudDatasetPush(key: string, value: unknown): void {
  if (!activeCloudUid || !isSyncedDatasetKey(key)) return;
  const existing = pendingWrites.get(key);
  if (existing) {
    window.clearTimeout(existing.timer);
  }
  const targetUid = activeCloudUid;
  const timer = window.setTimeout(() => {
    pendingWrites.delete(key);
    void pushDatasetToCloud(targetUid, key, value);
  }, 650);
  pendingWrites.set(key, { value, timer });
}

/**
 * Switches local workspace cleanly between users (or guest <-> user) and attaches
 * real-time Firestore dataset listener for the authenticated user.
 */
export async function activateAuthenticatedWorkspace(
  user: User,
  options?: {
    isBrandNewRegistration?: boolean;
    importCurrentGuestData?: boolean;
    initialProfileOverride?: TeacherProfile;
    loginId?: string;
  }
): Promise<UserAccountMeta> {
  const previousUid = getActiveSyncUid();

  // 1. If switching from another user/guest on this device, snapshot their local data first
  if (previousUid !== user.uid) {
    await flushPendingCloudSync();
    await saveUserLocalVault(previousUid);
  }

  // 2. Ensure user document exists in Firestore BEFORE reading/writing subcollection (Master Gate!)
  const accountMeta = await ensureUserAccountDoc(user, {
    loginId: options?.loginId,
    displayName: options?.initialProfileOverride?.name,
    schoolName: options?.initialProfileOverride?.school,
    designation: options?.initialProfileOverride?.designation,
  });

  // 3. Snapshot guest data before clearing if registering and user wants to import it
  const guestImportSnapshot: Partial<Record<SyncedDatasetKey, unknown>> = {};
  if (options?.importCurrentGuestData) {
    for (const key of SYNCED_DATASET_KEYS) {
      const val = readLocalJson(key);
      if (val !== null) {
        guestImportSnapshot[key] = val;
      }
    }
  }

  // 4. Switch active local workspace to this user's vault
  if (previousUid !== user.uid) {
    await clearActiveWorkspaceKeys();
    await restoreUserLocalVault(user.uid);
    setActiveSyncUid(user.uid);
  }

  // 5. Fetch all existing cloud datasets for this user
  activeCloudUid = user.uid;
  const datasetsColPath = `users/${user.uid}/datasets`;
  const q = query(
    collection(db, 'users', user.uid, 'datasets'),
    where('uid', '==', user.uid)
  );

  let cloudDocsCount = 0;
  try {
    setCloudSyncState('syncing');
    const snap = await getDocs(q);
    cloudDocsCount = snap.size;
    snap.forEach((docSnap) => {
      const key = docSnap.id;
      if (!isSyncedDatasetKey(key)) return;
      const data = docSnap.data() as { payload?: { data?: unknown } };
      if (data?.payload && 'data' in data.payload) {
        applyRemoteDatasetToLocal(key, data.payload.data);
      }
    });
    setCloudSyncState('synced', Date.now());
  } catch (error) {
    setCloudSyncState('error');
    handleFirestoreError(error, OperationType.LIST, datasetsColPath);
  }

  // 6. If brand new account OR cloud has zero datasets yet, seed initial profile & optional guest data
  if (cloudDocsCount === 0) {
    if (options?.importCurrentGuestData) {
      for (const [key, val] of Object.entries(guestImportSnapshot)) {
        if (!isSyncedDatasetKey(key)) continue;
        if (key === 'teacher_profile_data' && options.initialProfileOverride) {
          const mergedProfile = { ...(val as TeacherProfile), ...options.initialProfileOverride };
          applyRemoteDatasetToLocal(key, mergedProfile);
          await pushDatasetToCloud(user.uid, key, mergedProfile);
        } else {
          applyRemoteDatasetToLocal(key, val);
          await pushDatasetToCloud(user.uid, key, val);
        }
      }
    } else if (options?.initialProfileOverride) {
      applyRemoteDatasetToLocal('teacher_profile_data', options.initialProfileOverride);
      await pushDatasetToCloud(user.uid, 'teacher_profile_data', options.initialProfileOverride);
    }
  }

  // 7. Attach real-time Firestore listener so edits on any device reflect immediately
  if (unsubscribeDatasets) {
    unsubscribeDatasets();
  }
  unsubscribeDatasets = onSnapshot(
    q,
    (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' || change.type === 'modified') {
          if (change.doc.metadata.hasPendingWrites) return;
          const key = change.doc.id;
          if (!isSyncedDatasetKey(key)) return;
          const data = change.doc.data() as { payload?: { data?: unknown } };
          if (data?.payload && 'data' in data.payload) {
            applyRemoteDatasetToLocal(key, data.payload.data);
          }
        }
      });
      setCloudSyncState('synced', Date.now());
    },
    (error) => {
      setCloudSyncState('error');
      handleFirestoreError(error, OperationType.LIST, datasetsColPath);
    }
  );

  // 8. Save updated local vault for this UID
  await saveUserLocalVault(user.uid);
  return accountMeta;
}

export async function switchToGuestWorkspace(): Promise<void> {
  const prevUid = getActiveSyncUid();
  await flushPendingCloudSync();
  detachCloudSyncListener();
  if (prevUid && prevUid !== 'guest') {
    await saveUserLocalVault(prevUid);
  }
  await clearActiveWorkspaceKeys();
  await restoreUserLocalVault('guest');
  setActiveSyncUid('guest');
  setCloudSyncState('idle');
}

export async function publishGlobalReleaseSignal(
  version: string,
  buildId: string,
  releaseNotes: string,
  forceReload = true
): Promise<void> {
  const path = 'appMeta/release';
  try {
    await setDoc(doc(db, 'appMeta', 'release'), {
      version: version.trim().slice(0, 32),
      buildId: buildId.trim().slice(0, 64),
      releaseNotes: releaseNotes.trim().slice(0, 500),
      forceReload,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
