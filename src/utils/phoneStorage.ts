import { downloadJsonFile } from './bangla';

const DB_NAME = 'PrimaryTeacherOfflineDB';
const DB_VERSION = 1;
const KV_STORE = 'kv';
const HANDLE_STORE = 'handles';
const FOLDER_HANDLE_KEY = 'phone_backup_dir';
const FILE_BACKUP_NAME = 'primary-teacher-offline-backup.json';

export const LAST_BACKUP_STORAGE_KEY = 'last_backup_at';

export const APP_STORAGE_KEYS = [
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
  'annual_lp_selected_year_v1',
  'lesson_reminder_prefs_v1',
  'last_seen_lesson_reminder_date_v1',
  'print_preferences_v1',
  LAST_BACKUP_STORAGE_KEY,
] as const;

export interface LocalDatabaseSummary {
  students: number;
  evaluations: number;
  notices: number;
  lessonPlans: number;
  questions: number;
  bookNotes: number;
  forumPosts: number;
  videos: number;
  portals: number;
  flnRecords: number;
  hasProfile: boolean;
  totalKeys: number;
  totalSizeBytes: number;
  lastBackupAt: string | null;
}

export interface BackupFilePreview {
  bundle: Record<string, unknown>;
  exportedAt: string | null;
  schoolName: string;
  teacherName: string;
  studentsCount: number;
  evaluationsCount: number;
  noticesCount: number;
  lessonPlansCount: number;
  questionsCount: number;
}

export interface PhoneStorageStatus {
  indexedDbReady: boolean;
  persisted: boolean;
  usageBytes: number;
  quotaBytes: number;
  linkedFolderName: string | null;
  folderPickerSupported: boolean;
}

interface DirectoryHandleLike {
  name: string;
  queryPermission?: (opts?: { mode?: 'read' | 'readwrite' }) => Promise<PermissionState>;
  requestPermission?: (opts?: { mode?: 'read' | 'readwrite' }) => Promise<PermissionState>;
  getFileHandle: (
    name: string,
    options?: { create?: boolean }
  ) => Promise<{
    createWritable: () => Promise<{
      write: (data: string) => Promise<void>;
      close: () => Promise<void>;
    }>;
  }>;
}

function openOfflineDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(KV_STORE)) {
        db.createObjectStore(KV_STORE, { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains(HANDLE_STORE)) {
        db.createObjectStore(HANDLE_STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('Failed to open IndexedDB'));
  });
}

export async function idbSetItem(key: string, rawJson: string): Promise<void> {
  try {
    const db = await openOfflineDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(KV_STORE, 'readwrite');
      tx.objectStore(KV_STORE).put({
        key,
        value: rawJson,
        updatedAt: Date.now(),
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // Graceful no-op in private mode without IDB
  }
}

export async function idbGetItem(key: string): Promise<string | null> {
  try {
    const db = await openOfflineDB();
    const record = await new Promise<{ key: string; value: string } | undefined>((resolve, reject) => {
      const tx = db.transaction(KV_STORE, 'readonly');
      const req = tx.objectStore(KV_STORE).get(key);
      req.onsuccess = () => resolve(req.result as { key: string; value: string } | undefined);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return record?.value ?? null;
  } catch {
    return null;
  }
}

export async function idbDeleteItems(keys: string[]): Promise<void> {
  try {
    const db = await openOfflineDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(KV_STORE, 'readwrite');
      const store = tx.objectStore(KV_STORE);
      for (const k of keys) {
        store.delete(k);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // ignore
  }
}

export async function idbGetAllItems(): Promise<Record<string, string>> {
  try {
    const db = await openOfflineDB();
    const records = await new Promise<Array<{ key: string; value: string }>>((resolve, reject) => {
      const tx = db.transaction(KV_STORE, 'readonly');
      const req = tx.objectStore(KV_STORE).getAll();
      req.onsuccess = () => resolve((req.result as Array<{ key: string; value: string }>) || []);
      req.onerror = () => reject(req.error);
    });
    db.close();
    const map: Record<string, string> = {};
    for (const r of records) {
      if (r && typeof r.key === 'string' && typeof r.value === 'string') {
        map[r.key] = r.value;
      }
    }
    return map;
  } catch {
    return {};
  }
}

async function saveFolderHandle(handle: DirectoryHandleLike | null): Promise<void> {
  try {
    const db = await openOfflineDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(HANDLE_STORE, 'readwrite');
      const store = tx.objectStore(HANDLE_STORE);
      if (handle) {
        store.put({ id: FOLDER_HANDLE_KEY, handle });
      } else {
        store.delete(FOLDER_HANDLE_KEY);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // ignore
  }
}

async function getSavedFolderHandle(): Promise<DirectoryHandleLike | null> {
  try {
    const db = await openOfflineDB();
    const record = await new Promise<{ id: string; handle: DirectoryHandleLike } | undefined>(
      (resolve, reject) => {
        const tx = db.transaction(HANDLE_STORE, 'readonly');
        const req = tx.objectStore(HANDLE_STORE).get(FOLDER_HANDLE_KEY);
        req.onsuccess = () =>
          resolve(req.result as { id: string; handle: DirectoryHandleLike } | undefined);
        req.onerror = () => reject(req.error);
      }
    );
    db.close();
    return record?.handle || null;
  } catch {
    return null;
  }
}

/**
 * Hydrates localStorage from IndexedDB on boot and ensures any existing
 * localStorage keys are mirrored into IndexedDB (phone default storage).
 */
export async function hydratePhoneStorage(): Promise<void> {
  if (typeof window === 'undefined') return;

  // Request persistent storage silently if supported
  try {
    if (navigator.storage?.persist) {
      const already = await navigator.storage.persisted();
      if (!already) {
        await navigator.storage.persist();
      }
    }
  } catch {
    // ignore
  }

  const idbItems = await idbGetAllItems();

  // Restore any keys present in IndexedDB that are missing from localStorage
  for (const [key, value] of Object.entries(idbItems)) {
    if (key.startsWith('user_vault::')) continue;
    try {
      if (window.localStorage.getItem(key) === null) {
        window.localStorage.setItem(key, value);
        window.dispatchEvent(new CustomEvent('local-storage-sync', { detail: { key } }));
      }
    } catch {
      // ignore quota error
    }
  }

  // Mirror any localStorage keys not yet in IndexedDB
  for (const key of APP_STORAGE_KEYS) {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null && idbItems[key] !== raw) {
        await idbSetItem(key, raw);
      }
    } catch {
      // ignore
    }
  }
}

export async function requestPersistentPhoneStorage(): Promise<boolean> {
  try {
    if (navigator.storage?.persist) {
      return await navigator.storage.persist();
    }
  } catch {
    // ignore
  }
  return false;
}

export async function getPhoneStorageStatus(): Promise<PhoneStorageStatus> {
  let persisted = false;
  let usageBytes = 0;
  let quotaBytes = 0;
  let indexedDbReady = typeof indexedDB !== 'undefined';

  try {
    if (navigator.storage?.persisted) {
      persisted = await navigator.storage.persisted();
    }
    if (navigator.storage?.estimate) {
      const est = await navigator.storage.estimate();
      usageBytes = est.usage || 0;
      quotaBytes = est.quota || 0;
    }
  } catch {
    // ignore
  }

  const folderHandle = await getSavedFolderHandle();

  return {
    indexedDbReady,
    persisted,
    usageBytes,
    quotaBytes,
    linkedFolderName: folderHandle?.name || null,
    folderPickerSupported: typeof window !== 'undefined' && 'showDirectoryPicker' in window,
  };
}

function safeReadJson(key: string): unknown {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function safeArrayCount(key: string): number {
  const val = safeReadJson(key);
  return Array.isArray(val) ? val.length : 0;
}

export function getLocalDatabaseSummary(): LocalDatabaseSummary {
  let totalSizeBytes = 0;
  let totalKeys = 0;
  if (typeof window !== 'undefined') {
    try {
      totalKeys = window.localStorage.length;
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (!k) continue;
        const v = window.localStorage.getItem(k) || '';
        totalSizeBytes += (k.length + v.length) * 2;
      }
    } catch {
      // ignore
    }
  }

  const lastBackupRaw = safeReadJson(LAST_BACKUP_STORAGE_KEY);
  return {
    students: safeArrayCount('students_list_v1'),
    evaluations: safeArrayCount('evaluation_records_v1'),
    notices: safeArrayCount('app_notices_v1'),
    lessonPlans: safeArrayCount('custom_lesson_plans_v1'),
    questions: safeArrayCount('custom_questions_v1'),
    bookNotes: safeArrayCount('custom_book_notes_v1'),
    forumPosts: safeArrayCount('teacher_forum_v1'),
    videos: safeArrayCount('edu_videos_v1'),
    portals: safeArrayCount('custom_portals_v1'),
    flnRecords: safeArrayCount('monthly_fln_records_v1'),
    hasProfile: Boolean(safeReadJson('teacher_profile_data')),
    totalKeys,
    totalSizeBytes,
    lastBackupAt: typeof lastBackupRaw === 'string' ? lastBackupRaw : null,
  };
}

export function collectFullOfflineBundle(): Record<string, unknown> {
  const rawLocalStorage: Record<string, string> = {};
  if (typeof window !== 'undefined') {
    try {
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (!key) continue;
        const val = window.localStorage.getItem(key);
        if (val !== null) {
          rawLocalStorage[key] = val;
        }
      }
    } catch {
      // ignore
    }
  }

  return {
    app: 'primary-teacher-assistant',
    exportedAt: new Date().toISOString(),
    version: 3,
    profile: safeReadJson('teacher_profile_data'),
    notices: safeReadJson('app_notices_v1'),
    featureSettings: safeReadJson('app_feature_settings_v1'),
    seenNoticesCount: safeReadJson('last_seen_notices_count'),
    students: safeReadJson('students_list_v1'),
    evaluations: safeReadJson('evaluation_records_v1'),
    flnRecords: safeReadJson('monthly_fln_records_v1'),
    forumPosts: safeReadJson('teacher_forum_v1'),
    lessonPlans: safeReadJson('custom_lesson_plans_v1'),
    questions: safeReadJson('custom_questions_v1'),
    bookNotes: safeReadJson('custom_book_notes_v1'),
    videos: safeReadJson('edu_videos_v1'),
    portals: safeReadJson('custom_portals_v1'),
    rawLocalStorage,
  };
}

export async function downloadFullDatabaseBackup(): Promise<string> {
  const nowIso = new Date().toISOString();
  try {
    const serialized = JSON.stringify(nowIso);
    window.localStorage.setItem(LAST_BACKUP_STORAGE_KEY, serialized);
    await idbSetItem(LAST_BACKUP_STORAGE_KEY, serialized);
    window.dispatchEvent(
      new CustomEvent('local-storage-sync', { detail: { key: LAST_BACKUP_STORAGE_KEY } })
    );
  } catch {
    // ignore
  }

  const filename = `teacher-assistant-backup-${nowIso.slice(0, 10)}.json`;
  downloadJsonFile(collectFullOfflineBundle(), filename);
  await syncAllKeysToIndexedDB();
  return filename;
}

export function inspectBackupFile(rawText: string): BackupFilePreview {
  const parsed = JSON.parse(rawText) as Record<string, unknown>;
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Invalid JSON backup object');
  }

  const hasKnownSection =
    'profile' in parsed ||
    'students' in parsed ||
    'notices' in parsed ||
    'flnRecords' in parsed ||
    'evaluations' in parsed ||
    'rawLocalStorage' in parsed;

  if (!hasKnownSection) {
    throw new Error('Not a valid Teacher Assistant backup file');
  }

  const profileObj =
    parsed.profile && typeof parsed.profile === 'object'
      ? (parsed.profile as Record<string, unknown>)
      : null;

  return {
    bundle: parsed,
    exportedAt: typeof parsed.exportedAt === 'string' ? parsed.exportedAt : null,
    schoolName: typeof profileObj?.school === 'string' ? profileObj.school : 'নির্ধারিত নয়',
    teacherName: typeof profileObj?.name === 'string' ? profileObj.name : 'নির্ধারিত নয়',
    studentsCount: Array.isArray(parsed.students) ? parsed.students.length : 0,
    evaluationsCount: Array.isArray(parsed.evaluations) ? parsed.evaluations.length : 0,
    noticesCount: Array.isArray(parsed.notices) ? parsed.notices.length : 0,
    lessonPlansCount: Array.isArray(parsed.lessonPlans) ? parsed.lessonPlans.length : 0,
    questionsCount: Array.isArray(parsed.questions) ? parsed.questions.length : 0,
  };
}

export async function restoreFullDatabaseBundle(parsed: Record<string, unknown>): Promise<void> {
  const restoredKeys = new Set<string>();

  const writeKey = (key: string, value: unknown, alreadyRaw = false) => {
    try {
      const serialized = alreadyRaw ? String(value) : JSON.stringify(value);
      window.localStorage.setItem(key, serialized);
      restoredKeys.add(key);
    } catch {
      // ignore quota error
    }
  };

  if (parsed.rawLocalStorage && typeof parsed.rawLocalStorage === 'object') {
    for (const [k, v] of Object.entries(parsed.rawLocalStorage as Record<string, unknown>)) {
      if (typeof v === 'string') {
        writeKey(k, v, true);
      }
    }
  }

  if (parsed.profile && typeof parsed.profile === 'object') {
    writeKey('teacher_profile_data', parsed.profile);
  }
  if (Array.isArray(parsed.notices)) {
    writeKey('app_notices_v1', parsed.notices);
  }
  if (parsed.featureSettings && typeof parsed.featureSettings === 'object') {
    writeKey('app_feature_settings_v1', parsed.featureSettings);
  }
  if (typeof parsed.seenNoticesCount === 'number') {
    writeKey('last_seen_notices_count', parsed.seenNoticesCount);
  }
  if (Array.isArray(parsed.students)) {
    writeKey('students_list_v1', parsed.students);
  }
  if (Array.isArray(parsed.evaluations)) {
    writeKey('evaluation_records_v1', parsed.evaluations);
  }
  if (Array.isArray(parsed.flnRecords)) {
    writeKey('monthly_fln_records_v1', parsed.flnRecords);
  }
  if (Array.isArray(parsed.forumPosts)) {
    writeKey('teacher_forum_v1', parsed.forumPosts);
  }
  if (Array.isArray(parsed.lessonPlans)) {
    writeKey('custom_lesson_plans_v1', parsed.lessonPlans);
  }
  if (Array.isArray(parsed.questions)) {
    writeKey('custom_questions_v1', parsed.questions);
  }
  if (Array.isArray(parsed.bookNotes)) {
    writeKey('custom_book_notes_v1', parsed.bookNotes);
  }
  if (Array.isArray(parsed.videos)) {
    writeKey('edu_videos_v1', parsed.videos);
  }
  if (Array.isArray(parsed.portals)) {
    writeKey('custom_portals_v1', parsed.portals);
  }

  for (const key of restoredKeys) {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) {
        await idbSetItem(key, raw);
      }
      window.dispatchEvent(new CustomEvent('local-storage-sync', { detail: { key } }));
    } catch {
      // ignore
    }
  }

  await syncAllKeysToIndexedDB();
}

async function writeBundleToDirectoryHandle(dirHandle: DirectoryHandleLike): Promise<boolean> {
  try {
    if (dirHandle.queryPermission) {
      let perm = await dirHandle.queryPermission({ mode: 'readwrite' });
      if (perm !== 'granted' && dirHandle.requestPermission) {
        perm = await dirHandle.requestPermission({ mode: 'readwrite' });
      }
      if (perm !== 'granted') return false;
    }
    const fileHandle = await dirHandle.getFileHandle(FILE_BACKUP_NAME, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(collectFullOfflineBundle(), null, 2));
    await writable.close();
    return true;
  } catch {
    return false;
  }
}

/**
 * Links a real folder on the phone/computer storage (via File System Access API)
 * and saves the offline database file there; if unavailable (e.g., iOS or iframe),
 * seamlessly saves to the device's default Downloads folder.
 */
export async function saveToPhoneDefaultFolder(): Promise<{
  mode: 'folder' | 'download';
  folderName?: string;
}> {
  const win = window as unknown as {
    showDirectoryPicker?: (opts?: { mode?: 'readwrite'; startIn?: string }) => Promise<DirectoryHandleLike>;
  };

  if (typeof win.showDirectoryPicker === 'function') {
    try {
      const dirHandle = await win.showDirectoryPicker({
        mode: 'readwrite',
        startIn: 'documents',
      });
      await saveFolderHandle(dirHandle);
      const wrote = await writeBundleToDirectoryHandle(dirHandle);
      if (wrote) {
        return { mode: 'folder', folderName: dirHandle.name };
      }
    } catch (err) {
      // User cancelled or iframe SecurityError -> fall back to Downloads folder if SecurityError
      const name = err instanceof Error ? err.name : '';
      if (name === 'AbortError') {
        throw err;
      }
    }
  }

  downloadJsonFile(
    collectFullOfflineBundle(),
    `shikkhok-app-phone-backup-${new Date().toISOString().slice(0, 10)}.json`
  );
  return { mode: 'download' };
}

export async function syncLinkedPhoneFolderNow(): Promise<boolean> {
  const handle = await getSavedFolderHandle();
  if (!handle) return false;
  return writeBundleToDirectoryHandle(handle);
}

export async function unlinkPhoneFolder(): Promise<void> {
  await saveFolderHandle(null);
}

export async function syncAllKeysToIndexedDB(): Promise<void> {
  for (const key of APP_STORAGE_KEYS) {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) {
        await idbSetItem(key, raw);
      }
    } catch {
      // ignore
    }
  }
}

export function formatStorageBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '০ KB';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
