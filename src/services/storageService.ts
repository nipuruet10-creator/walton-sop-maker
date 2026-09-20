import type { UserProfile, SOPStatus, AuditLogEntry, NotificationItem } from '../types/auth';
import type { SOPDocument } from '../types/sop';
import { defaultSopData } from '../data/defaultSopData';

const DB_NAME = 'WaltonSopDB';
const DB_VERSION = 2;
const STORE_USERS = 'users';
const STORE_SOPS = 'sops';
const CURRENT_USER_STORAGE_KEY = 'walton_sop_active_user_v2';

// Global AI Configuration Interface & Storage
export interface GlobalAiConfig {
  activeProvider: 'openrouter' | 'gemini';
  openRouterKey: string;
  openRouterModel: string;
  geminiKey: string;
  updatedAt?: string;
}

const GLOBAL_AI_CONFIG_KEY = 'walton_sop_global_ai_config_v1';

export function getGlobalAiConfig(): GlobalAiConfig {
  try {
    const stored = localStorage.getItem(GLOBAL_AI_CONFIG_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Error reading global AI config', e);
  }
  return {
    activeProvider: (localStorage.getItem('walton_sop_ai_provider') as any) || 'openrouter',
    openRouterKey: localStorage.getItem('walton_sop_openrouter_api_key') || '',
    openRouterModel: localStorage.getItem('walton_sop_openrouter_model') || 'openrouter/free',
    geminiKey: localStorage.getItem('walton_sop_gemini_key') || '',
  };
}

export function saveGlobalAiConfig(config: GlobalAiConfig): void {
  try {
    const payload = { ...config, updatedAt: new Date().toISOString() };
    localStorage.setItem(GLOBAL_AI_CONFIG_KEY, JSON.stringify(payload));
    localStorage.setItem('walton_sop_ai_provider', config.activeProvider);
    localStorage.setItem('walton_sop_openrouter_api_key', config.openRouterKey);
    localStorage.setItem('walton_sop_openrouter_model', config.openRouterModel);
    localStorage.setItem('walton_sop_gemini_key', config.geminiKey);
  } catch (e) {
    console.warn('Error saving global AI config', e);
  }
}

// Pre-seeded Users as explicitly requested by User from Photo 2
export const INITIAL_USERS: UserProfile[] = [
  {
    id: 'Biplob',
    employeeId: '67544',
    username: 'Biplob',
    name: 'Biplob (67544)',
    role: 'prepared_by',
    designation: 'Senior Officer',
    department: 'Process Development',
    passwordHash: 'Process@2026',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'Dev',
    employeeId: '54150',
    username: 'Dev',
    name: 'Deb (54150)',
    role: 'prepared_by',
    designation: 'Principal Officer',
    department: 'Process Development',
    passwordHash: 'Process@2026',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'Jowel',
    employeeId: '7686',
    username: 'Jowel',
    name: 'Jowel (7686)',
    role: 'prepared_by',
    designation: 'Assistant Director',
    department: 'Process Development',
    passwordHash: 'Process@2026',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'Emon',
    employeeId: '58279',
    username: 'Emon',
    name: 'Emon (58279)',
    role: 'checked_by',
    designation: 'Assistant Director',
    department: 'Process Development',
    passwordHash: 'Process@2026',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'Faiyaz',
    employeeId: '54634',
    username: 'Faiyaz',
    name: 'Faiyaz (54634)',
    role: 'checked_by',
    designation: 'Assistant Director',
    department: 'Process Development',
    passwordHash: 'Process@2026',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'Hashmi',
    employeeId: '56880',
    username: 'Hashmi',
    name: 'Hashmi (56880)',
    role: 'checked_by',
    designation: 'Senior Deputy Director',
    department: 'Process Development',
    passwordHash: 'Process@2026',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'Pear',
    employeeId: '54636',
    username: 'Pear',
    name: 'Pear (54636)',
    role: 'checked_by',
    designation: 'Assistant Director',
    department: 'Process Development',
    passwordHash: 'Process@2026',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'Rafi',
    employeeId: '45127',
    username: 'Rafi',
    name: 'Rafi (45127)',
    role: 'checked_by',
    designation: 'Deputy Director',
    department: 'Process Development',
    passwordHash: 'Process@2026',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'Sazzad',
    employeeId: '50463',
    username: 'Sazzad',
    name: 'Sazzad (50463)',
    role: 'checked_by',
    designation: 'Process Automation Lead',
    department: 'AC Process',
    passwordHash: 'Process@2026',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'Kamrul',
    employeeId: '44819',
    username: 'Kamrul',
    name: 'Kamrul (44819)',
    role: 'approved_by',
    designation: 'HOD',
    department: 'Process Development',
    passwordHash: 'Process@2026',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'Admin_Sazzad',
    employeeId: '50463',
    username: 'Admin_Sazzad',
    name: 'Sazzad (50463) (Admin)',
    role: 'admin',
    designation: 'Process Engineer',
    department: 'AC Process',
    passwordHash: 'ACprocess@2026',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

// Open / initialize IndexedDB
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in this browser'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_USERS)) {
        const userStore = db.createObjectStore(STORE_USERS, { keyPath: 'id' });
        userStore.createIndex('username', 'username', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_SOPS)) {
        const sopStore = db.createObjectStore(STORE_SOPS, { keyPath: 'id' });
        sopStore.createIndex('status', 'status', { unique: false });
        sopStore.createIndex('authorId', 'authorId', { unique: false });
        sopStore.createIndex('checkedById', 'checkedById', { unique: false });
      }
    };

    request.onsuccess = async () => {
      const db = request.result;
      try {
        await seedInitialData(db);
      } catch (e) {
        console.warn('DB seed notice:', e);
      }
      resolve(db);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

const DELETED_USERS_STORAGE_KEY = 'walton_sop_deleted_users_v1';

export function getDeletedUserIds(): string[] {
  try {
    const raw = localStorage.getItem(DELETED_USERS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function markUserAsDeleted(userId: string): void {
  try {
    const list = getDeletedUserIds();
    if (!list.includes(userId)) {
      list.push(userId);
      localStorage.setItem(DELETED_USERS_STORAGE_KEY, JSON.stringify(list));
    }
  } catch (e) {
    console.warn('Failed to save deleted user id', e);
  }
}

export function unmarkUserAsDeleted(userId: string): void {
  try {
    const list = getDeletedUserIds().filter((id) => id !== userId);
    localStorage.setItem(DELETED_USERS_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('Failed to unmark deleted user id', e);
  }
}

// Seed / sync initial users into store
async function seedInitialData(db: IDBDatabase): Promise<void> {
  // If Sazzad was previously deleted in test, unmark so Sazzad (50463) is available
  unmarkUserAsDeleted('Sazzad');
  const deletedIds = getDeletedUserIds();

  return new Promise((resolve) => {
    const tx = db.transaction(STORE_USERS, 'readwrite');
    const store = tx.objectStore(STORE_USERS);
    const getAllReq = store.getAll();

    getAllReq.onsuccess = () => {
      const existing = (getAllReq.result as UserProfile[]) || [];
      INITIAL_USERS.forEach((initUser) => {
        // Do not re-seed a user if deleted by Admin (except Sazzad who was updated)
        if (deletedIds.includes(initUser.id)) {
          return;
        }
        const found = existing.find((u) => u.id === initUser.id);
        if (!found) {
          store.put(initUser);
        } else if (
          !found.employeeId ||
          found.name !== initUser.name ||
          found.designation !== initUser.designation
        ) {
          // Sync new name, employeeId or designation while preserving any custom saved password / signature
          store.put({
            ...found,
            employeeId: initUser.employeeId,
            name: initUser.name,
            designation: initUser.designation,
            department: initUser.department,
          });
        }
      });
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}

// ==================== AUTH METHODS ====================

export async function authenticateUser(usernameInput: string, passwordInput: string): Promise<UserProfile | null> {
  const clean = usernameInput.trim().toLowerCase();
  const cleanPassword = passwordInput.trim();

  // Special Admin login check: Admin ID 'Sazzad', '50463', or 'Admin_Sazzad' with password 'ACprocess@2026'
  if (
    (clean === 'sazzad' || clean === '50463' || clean === 'admin' || clean === 'admin_sazzad') &&
    cleanPassword === 'ACprocess@2026'
  ) {
    const users = await getAllUsers();
    return users.find((u) => u.role === 'admin') || INITIAL_USERS.find((u) => u.id === 'Admin_Sazzad') || null;
  }

  const users = await getAllUsers();
  const matched = users.find((u) => {
    const idMatch = u.id.toLowerCase() === clean;
    const usernameMatch = u.username.toLowerCase() === clean;
    const empIdMatch = u.employeeId && u.employeeId.toLowerCase() === clean;
    const nameMatch = u.name.toLowerCase().includes(clean);

    return (idMatch || usernameMatch || empIdMatch || nameMatch) && u.passwordHash === cleanPassword;
  });

  return matched || null;
}

export async function getAllUsers(): Promise<UserProfile[]> {
  const deletedIds = getDeletedUserIds();
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_USERS, 'readonly');
      const store = tx.objectStore(STORE_USERS);
      const req = store.getAll();
      req.onsuccess = () => {
        const raw = req.result.length > 0 ? (req.result as UserProfile[]) : INITIAL_USERS;
        resolve(raw.filter((u: UserProfile) => !deletedIds.includes(u.id)));
      };
      req.onerror = () => {
        resolve(INITIAL_USERS.filter((u) => !deletedIds.includes(u.id)));
      };
    });
  } catch {
    return INITIAL_USERS.filter((u) => !deletedIds.includes(u.id));
  }
}

export async function resetUserPassword(userId: string, newPassword: string): Promise<boolean> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_USERS, 'readwrite');
      const store = tx.objectStore(STORE_USERS);
      const getReq = store.get(userId);
      getReq.onsuccess = () => {
        const user: UserProfile = getReq.result;
        if (user) {
          user.passwordHash = newPassword;
          store.put(user);
          resolve(true);
        } else {
          // If not found in DB, check INITIAL_USERS
          const initUser = INITIAL_USERS.find((u) => u.id === userId);
          if (initUser) {
            initUser.passwordHash = newPassword;
            store.put(initUser);
            resolve(true);
          } else {
            resolve(false);
          }
        }
      };
      getReq.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

export async function updateUserSignature(userId: string, signatureImg: string): Promise<boolean> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_USERS, 'readwrite');
      const store = tx.objectStore(STORE_USERS);
      const getReq = store.get(userId);
      getReq.onsuccess = () => {
        const user: UserProfile = getReq.result || INITIAL_USERS.find((u) => u.id === userId);
        if (user) {
          user.defaultSignatureImg = signatureImg;
          store.put(user);
          resolve(true);
        } else {
          resolve(false);
        }
      };
      getReq.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

export async function addUser(user: UserProfile): Promise<boolean> {
  unmarkUserAsDeleted(user.id);
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_USERS, 'readwrite');
      const store = tx.objectStore(STORE_USERS);
      store.put(user);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

export async function updateUserProfile(user: UserProfile): Promise<boolean> {
  unmarkUserAsDeleted(user.id);
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_USERS, 'readwrite');
      const store = tx.objectStore(STORE_USERS);
      store.put(user);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

export async function deleteUser(userId: string): Promise<boolean> {
  markUserAsDeleted(userId);
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_USERS, 'readwrite');
      const store = tx.objectStore(STORE_USERS);
      store.delete(userId);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

// Compute live notifications for a user based on pending review/approval tasks
export async function getUserNotifications(currentUser: UserProfile | null): Promise<NotificationItem[]> {
  if (!currentUser) return [];

  const sops = await getAllSOPs();
  const notifications: NotificationItem[] = [];

  sops.forEach((doc) => {
    // If user is Checked By or Admin, and status is 'forwarded_to_checker'
    if (
      (currentUser.role === 'checked_by' || currentUser.role === 'admin') &&
      doc.status === 'forwarded_to_checker' &&
      (!doc.checkedById || doc.checkedById === currentUser.id || currentUser.role === 'admin')
    ) {
      notifications.push({
        id: `notif_${doc.id}_check`,
        sopId: doc.id || '',
        sopTitle: doc.header.processName || 'Untitled Process',
        senderName: doc.authorName || 'Biplob Hossain',
        senderRole: 'Prepared By',
        targetUserId: doc.checkedById,
        targetRole: 'checked_by',
        type: 'review_request',
        message: `${doc.authorName || 'ইঞ্জিনিয়ার'} "${doc.header.processName}" উচ্চপদস্থ পর্যালোচনার জন্য পাঠিয়েছেন।`,
        timestamp: doc.updatedAt || doc.createdAt || new Date().toISOString(),
        isRead: false,
      });
    }

    // If user is Approved By (Kamrul) or Admin, and status is 'forwarded_to_approver'
    if (
      (currentUser.role === 'approved_by' || currentUser.role === 'admin') &&
      doc.status === 'forwarded_to_approver'
    ) {
      notifications.push({
        id: `notif_${doc.id}_appr`,
        sopId: doc.id || '',
        sopTitle: doc.header.processName || 'Untitled Process',
        senderName: doc.checkedByName || 'Checked By In-Charge',
        senderRole: 'Checked By',
        targetUserId: doc.approvedById || 'Kamrul',
        targetRole: 'approved_by',
        type: 'approval_request',
        message: `${doc.checkedByName || 'পর্যালোচক'} "${doc.header.processName}" চূড়ান্ত অনুমোদনের জন্য পাঠিয়েছেন।`,
        timestamp: doc.updatedAt || doc.createdAt || new Date().toISOString(),
        isRead: false,
      });
    }

    // If user is author (Prepared By) and document was rejected/revision requested
    if (
      doc.status === 'rejected' &&
      (doc.authorId === currentUser.id || currentUser.role === 'admin')
    ) {
      notifications.push({
        id: `notif_${doc.id}_rev`,
        sopId: doc.id || '',
        sopTitle: doc.header.processName || 'Untitled Process',
        senderName: doc.checkedByName || 'Reviewer',
        senderRole: 'Checked By',
        targetUserId: doc.authorId,
        targetRole: 'prepared_by',
        type: 'revision_request',
        message: `"${doc.header.processName}" সংশোধনের জন্য ফেরত পাঠানো হয়েছে: ${doc.rejectionReason || 'সংশোধন প্রয়োজন'}`,
        timestamp: doc.updatedAt || doc.createdAt || new Date().toISOString(),
        isRead: false,
      });
    }

    // If user is author and document is approved
    if (
      doc.status === 'approved' &&
      (doc.authorId === currentUser.id || currentUser.role === 'admin')
    ) {
      notifications.push({
        id: `notif_${doc.id}_done`,
        sopId: doc.id || '',
        sopTitle: doc.header.processName || 'Untitled Process',
        senderName: doc.approvedByName || 'Kamrul Hasan',
        senderRole: 'Approved By',
        targetUserId: doc.authorId,
        targetRole: 'prepared_by',
        type: 'approved',
        message: `অভিনন্দন! "${doc.header.processName}" চূড়ান্তভাবে অনুমোদিত হয়েছে।`,
        timestamp: doc.approvedAt || doc.updatedAt || new Date().toISOString(),
        isRead: true,
      });
    }
  });

  return notifications;
}

// Active session storage
export function getActiveUserSession(): UserProfile | null {
  try {
    const stored = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function setActiveUserSession(user: UserProfile | null): void {
  try {
    if (user) {
      localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
    }
  } catch (e) {
    console.warn('Session save error:', e);
  }
}

// ==================== SOP STORAGE & WORKFLOW METHODS ====================

export async function getAllSOPs(skipCloudSync: boolean = false): Promise<SOPDocument[]> {
  let localResults: SOPDocument[] = [];
  try {
    const db = await openDatabase();
    localResults = await new Promise((resolve) => {
      const tx = db.transaction(STORE_SOPS, 'readonly');
      const store = tx.objectStore(STORE_SOPS);
      const req = store.getAll();
      req.onsuccess = () => {
        resolve((req.result as SOPDocument[]) || []);
      };
      req.onerror = () => resolve([]);
    });
  } catch {
    localResults = [];
  }

  // Pull latest from cloud and merge
  if (!skipCloudSync) {
    try {
      const cloudSops = await pullAllSopsFromCloud();
      if (cloudSops && cloudSops.length > 0) {
        const map = new Map<string, SOPDocument>();
        localResults.forEach((s: SOPDocument) => {
          if (s && s.id) map.set(s.id, s);
        });
        cloudSops.forEach((s: SOPDocument) => {
          if (s && s.id) {
            const existing = map.get(s.id);
            if (!existing || new Date(s.updatedAt || 0) >= new Date(existing.updatedAt || 0)) {
              map.set(s.id, s);
            }
          }
        });
        const combined = Array.from(map.values());
        combined.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
        return combined;
      }
    } catch {}
  }

  localResults.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
  return localResults;
}

export async function getSOPById(id: string): Promise<SOPDocument | null> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_SOPS, 'readonly');
      const store = tx.objectStore(STORE_SOPS);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function saveSOP(doc: SOPDocument, user?: UserProfile, note?: string): Promise<SOPDocument> {
  const now = new Date().toISOString();
  const id = doc.id || `sop_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const status: SOPStatus = doc.status || 'draft';

  const authorId = doc.authorId || user?.id || 'Biplob';
  const authorName = doc.authorName || user?.name || doc.header.preparedBy.name || 'Biplob Hossain';

  const newLog: AuditLogEntry = {
    id: `log_${Date.now()}`,
    action: doc.id ? 'update' : 'create',
    performedBy: user?.username || 'system',
    performedByName: user?.name || authorName,
    role: user?.role || 'prepared_by',
    timestamp: now,
    note: note || (doc.id ? 'SOP সংশোধিত ও সংরক্ষিত হয়েছে' : 'নতুন SOP তৈরি করা হয়েছে'),
  };

  const updatedDoc: SOPDocument = {
    ...doc,
    id,
    status,
    authorId,
    authorName,
    createdAt: doc.createdAt || now,
    updatedAt: now,
    auditTrail: [...(doc.auditTrail || []), newLog],
  };

  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_SOPS, 'readwrite');
      const store = tx.objectStore(STORE_SOPS);
      const putReq = store.put(updatedDoc);
      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error);
    });
  } catch (err) {
    console.warn('IndexedDB save failed, falling back:', err);
  }

  // Push to cloud in background
  try {
    pushSopToCloud(updatedDoc).catch(() => {});
  } catch {}

  return updatedDoc;
}

export async function deleteSOP(id: string): Promise<boolean> {
  let ok = false;
  try {
    const db = await openDatabase();
    ok = await new Promise((resolve) => {
      const tx = db.transaction(STORE_SOPS, 'readwrite');
      const store = tx.objectStore(STORE_SOPS);
      const req = store.delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  } catch {
    ok = false;
  }

  // Also remove from cloud
  try {
    deleteSopFromCloud(id).catch(() => {});
  } catch {}

  return ok;
}

// ==================== PER-USER WORKSPACE & CROSS-PC DRAFTS ====================

const USER_DRAFT_PREFIX = 'walton_sop_user_draft_v2_';

export function createDefaultSopForUser(user: UserProfile): SOPDocument {
  const now = new Date().toISOString();
  const dateStr = now.split('T')[0];
  const uniqueId = `sop_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  return {
    ...defaultSopData,
    id: uniqueId,
    status: 'draft',
    authorId: user.id,
    authorName: user.name,
    createdAt: now,
    updatedAt: now,
    header: {
      ...defaultSopData.header,
      processName: '',
      model: '',
      stationLine: '',
      referenceNo: '',
      reasonOfChanges: '',
      preparedBy: {
        name: user.name,
        designation: user.designation,
        dept: user.department,
        date: dateStr,
        signatureImg: user.defaultSignatureImg || '',
      },
      checkedBy: {
        name: 'Sazzad (50463)',
        designation: 'Process Automation Lead',
        signatureImg: '',
      },
      approvedBy: {
        name: 'Kamrul (44819)',
        designation: 'Process HOD',
        signatureImg: '',
      },
    },
    photos: [], // clean empty photos
    procedure: {
      ...defaultSopData.procedure,
      banglishInput: '',
      qualityBanglishInput: '',
      steps: [], // clean empty procedure
    },
    auditTrail: [
      {
        id: `log_${Date.now()}`,
        action: 'create',
        performedBy: user.username,
        performedByName: user.name,
        role: user.role,
        timestamp: now,
        note: `নতুন SOP ড্রাফট তৈরি করা হয়েছে (${user.name})`,
      },
    ],
  };
}

export async function getUserWorkingDraft(userId: string): Promise<SOPDocument | null> {
  // 1. Check user-specific localStorage key
  try {
    const raw = localStorage.getItem(USER_DRAFT_PREFIX + userId);
    if (raw) {
      const parsed: SOPDocument = JSON.parse(raw);
      if (parsed) {
        // Auto-sanitize legacy trial BOPP tape drafts so panels open completely blank
        if (
          parsed.header?.processName?.includes('BOPP Tape') ||
          (parsed.photos && parsed.photos.some((p) => p.url?.includes('Tape Dispenser') || p.name?.includes('Pasted Image')))
        ) {
          localStorage.removeItem(USER_DRAFT_PREFIX + userId);
        } else {
          return parsed;
        }
      }
    }
  } catch (e) {
    console.warn('Draft localStorage read failed', e);
  }

  // 2. Fetch latest draft from Cloud if switching PCs
  try {
    const cloudDraft = await syncUserDraftWithCloud(userId);
    if (cloudDraft) {
      return cloudDraft;
    }
  } catch (e) {
    console.warn('Draft cloud read failed', e);
  }

  // 3. Check IndexedDB for existing SOPs of this user
  try {
    const allSOPs = await getAllSOPs(true);
    const userSops = allSOPs.filter(
      (s) =>
        s.authorId === userId ||
        (s.header?.preparedBy?.name && s.header.preparedBy.name.toLowerCase().includes(userId.toLowerCase()))
    );
    // Ignore legacy trial BOPP tape SOPs
    const cleanSops = userSops.filter((s) => !s.header?.processName?.includes('BOPP Tape'));
    if (cleanSops.length > 0) {
      return cleanSops[0];
    }
  } catch (e) {
    console.warn('IndexedDB user SOP lookup failed', e);
  }

  return null;
}

// Clear trial SOPs and reset analytics/drafts
export async function clearTrialData(): Promise<{ sopsDeleted: number }> {
  let sopsDeleted = 0;
  try {
    const db = await openDatabase();
    const all = await getAllSOPs();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_SOPS, 'readwrite');
      const store = tx.objectStore(STORE_SOPS);
      all.forEach((s) => {
        if (s.id) {
          store.delete(s.id);
          sopsDeleted++;
        }
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch (e) {
    console.warn('Clear trial IndexedDB error:', e);
  }

  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith(USER_DRAFT_PREFIX) || k.startsWith('walton_sop_draft_'))) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch (e) {
    console.warn('Clear trial localStorage error:', e);
  }

  return { sopsDeleted };
}

export async function saveUserWorkingDraft(userId: string, doc: SOPDocument): Promise<void> {
  if (!userId || !doc) return;
  const now = new Date().toISOString();
  const updatedDoc: SOPDocument = {
    ...doc,
    authorId: doc.authorId || userId,
    authorName: doc.authorName || doc.header?.preparedBy?.name || userId,
    updatedAt: now,
  };

  // 1. Save to user-specific localStorage
  try {
    localStorage.setItem(USER_DRAFT_PREFIX + userId, JSON.stringify(updatedDoc));
  } catch (e) {
    console.warn('LocalStorage draft quota warning', e);
  }

  // 2. Also keep in IndexedDB so it survives browser cache purge
  try {
    await saveSOP(updatedDoc);
  } catch (e) {
    console.warn('IndexedDB auto-save draft warning', e);
  }

  // 3. Silent background cloud sync if available
  try {
    syncUserDraftWithCloud(userId, updatedDoc).catch(() => {});
  } catch {}
}

// ==================== MULTI-PC CLOUD SYNC & REPLICATION ENGINE ====================

export interface CloudSyncConfig {
  firebaseUrl: string;
  syncEndpoint: string;
  autoSync: boolean;
  lastSyncTime?: string;
  status?: 'idle' | 'syncing' | 'connected' | 'error';
  lastError?: string;
}

const CLOUD_CONFIG_KEY = 'walton_sop_cloud_config_v2';
const CLOUD_SYNC_URL_KEY = 'walton_sop_cloud_sync_url';

export function getCloudSyncConfig(): CloudSyncConfig {
  try {
    const raw = localStorage.getItem(CLOUD_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        firebaseUrl: parsed.firebaseUrl || '',
        syncEndpoint: parsed.syncEndpoint || '/api/sync',
        autoSync: parsed.autoSync !== false,
        lastSyncTime: parsed.lastSyncTime || undefined,
        status: parsed.status || 'idle',
        lastError: parsed.lastError || undefined,
      };
    }
  } catch {}

  const legacyUrl = localStorage.getItem(CLOUD_SYNC_URL_KEY) || '';
  return {
    firebaseUrl: legacyUrl.includes('firebaseio.com') ? legacyUrl : '',
    syncEndpoint: '/api/sync',
    autoSync: true,
    status: 'idle',
  };
}

export function saveCloudSyncConfig(cfg: Partial<CloudSyncConfig>): CloudSyncConfig {
  const current = getCloudSyncConfig();
  const updated: CloudSyncConfig = {
    ...current,
    ...cfg,
  };
  try {
    localStorage.setItem(CLOUD_CONFIG_KEY, JSON.stringify(updated));
    if (updated.firebaseUrl) {
      localStorage.setItem(CLOUD_SYNC_URL_KEY, updated.firebaseUrl);
    }
  } catch (e) {
    console.warn('Failed to save cloud sync config:', e);
  }
  return updated;
}

export function getCloudSyncUrl(): string {
  const cfg = getCloudSyncConfig();
  return cfg.firebaseUrl || cfg.syncEndpoint || '/api/sync';
}

export function setCloudSyncUrl(url: string): void {
  const trimmed = url.trim();
  if (trimmed.includes('firebaseio.com')) {
    saveCloudSyncConfig({ firebaseUrl: trimmed });
  } else {
    saveCloudSyncConfig({ syncEndpoint: trimmed });
  }
}

export async function testCloudConnection(customUrl?: string): Promise<{ success: boolean; backend: string; message: string }> {
  const config = getCloudSyncConfig();
  const firebaseUrl = (customUrl !== undefined ? customUrl : config.firebaseUrl).trim();

  // 1. Direct Firebase ping test if URL provided
  if (firebaseUrl && firebaseUrl.includes('firebaseio.com')) {
    const cleanUrl = firebaseUrl.replace(/\/$/, '');
    try {
      const res = await fetch(`${cleanUrl}/_test_ping.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ping: 'pong', timestamp: new Date().toISOString() }),
      });
      if (res.ok) {
        saveCloudSyncConfig({ status: 'connected', lastError: undefined });
        return {
          success: true,
          backend: 'firebase_direct',
          message: 'Google Firebase Realtime Database এর সাথে সরাসরি সংযোগ সফল হয়েছে!',
        };
      }
    } catch {}
  }

  // 2. Test via Vercel /api/sync endpoint
  try {
    const res = await fetch(`${config.syncEndpoint}?action=testConnection`, {
      headers: {
        ...(firebaseUrl ? { 'x-cloud-sync-url': firebaseUrl } : {}),
      },
    });
    if (res.ok) {
      const data = await res.json();
      saveCloudSyncConfig({ status: 'connected', lastError: undefined });
      return {
        success: data.success ?? true,
        backend: data.backend || 'serverless_relay',
        message: data.message || 'ক্লাউড সিঙ্ক সার্ভারের সাথে সফলভাবে যোগাযোগ স্থাপিত হয়েছে!',
      };
    }
  } catch {}

  saveCloudSyncConfig({ status: 'error', lastError: 'কানেকশন ব্যর্থ হয়েছে' });
  return {
    success: false,
    backend: 'none',
    message: 'ক্লাউড কানেকশন স্থাপন করা যায়নি। Firebase Database URL সঠিক কিনা যাচাই করুন।',
  };
}

export async function pushSopToCloud(doc: SOPDocument): Promise<boolean> {
  if (!doc || !doc.id) return false;
  const config = getCloudSyncConfig();
  if (!config.autoSync) return false;

  let pushed = false;

  // 1. Try Vercel Serverless proxy /api/sync
  try {
    const res = await fetch(`${config.syncEndpoint}?action=saveSop`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.firebaseUrl ? { 'x-cloud-sync-url': config.firebaseUrl } : {}),
      },
      body: JSON.stringify(doc),
    });
    if (res.ok) {
      pushed = true;
    }
  } catch {}

  // 2. Direct fallback to Firebase if configured
  if (!pushed && config.firebaseUrl && config.firebaseUrl.includes('firebaseio.com')) {
    try {
      const cleanFbUrl = config.firebaseUrl.replace(/\/$/, '');
      const res = await fetch(`${cleanFbUrl}/sops/${doc.id}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(doc),
      });
      if (res.ok) pushed = true;
    } catch (e) {
      console.warn('Direct Firebase push failed:', e);
    }
  }

  if (pushed) {
    saveCloudSyncConfig({ lastSyncTime: new Date().toISOString(), status: 'connected' });
  }

  return pushed;
}

export async function pullAllSopsFromCloud(): Promise<SOPDocument[]> {
  const config = getCloudSyncConfig();
  let sops: SOPDocument[] = [];

  // 1. Try /api/sync
  try {
    const endpoint = `${config.syncEndpoint}?action=getAllSOPs${
      config.firebaseUrl ? `&cloudUrl=${encodeURIComponent(config.firebaseUrl)}` : ''
    }`;
    const res = await fetch(endpoint, {
      headers: {
        ...(config.firebaseUrl ? { 'x-cloud-sync-url': config.firebaseUrl } : {}),
      },
    });
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.sops)) {
        sops = data.sops;
      }
    }
  } catch {}

  // 2. Direct fallback to Firebase if configured
  if (sops.length === 0 && config.firebaseUrl && config.firebaseUrl.includes('firebaseio.com')) {
    try {
      const cleanFbUrl = config.firebaseUrl.replace(/\/$/, '');
      const res = await fetch(`${cleanFbUrl}/sops.json`);
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data === 'object') {
          sops = Object.values(data).filter(Boolean) as SOPDocument[];
        }
      }
    } catch (e) {
      console.warn('Direct Firebase pull failed:', e);
    }
  }

  // Persist pulled SOPs to local IndexedDB to guarantee offline availability
  if (sops.length > 0) {
    try {
      const db = await openDatabase();
      const tx = db.transaction(STORE_SOPS, 'readwrite');
      const store = tx.objectStore(STORE_SOPS);
      for (const s of sops) {
        if (s && s.id) {
          store.put(s);
        }
      }
      saveCloudSyncConfig({ lastSyncTime: new Date().toISOString(), status: 'connected' });
    } catch {}
  }

  return sops;
}

export async function deleteSopFromCloud(id: string): Promise<boolean> {
  const config = getCloudSyncConfig();
  let ok = false;
  try {
    const res = await fetch(`${config.syncEndpoint}?action=deleteSop&id=${encodeURIComponent(id)}`, {
      method: 'POST',
      headers: {
        ...(config.firebaseUrl ? { 'x-cloud-sync-url': config.firebaseUrl } : {}),
      },
    });
    if (res.ok) ok = true;
  } catch {}

  if (config.firebaseUrl && config.firebaseUrl.includes('firebaseio.com')) {
    try {
      const cleanFbUrl = config.firebaseUrl.replace(/\/$/, '');
      await fetch(`${cleanFbUrl}/sops/${id}.json`, { method: 'DELETE' });
      ok = true;
    } catch {}
  }
  return ok;
}

export async function pushAllLocalSopsToCloud(): Promise<{ count: number; success: boolean }> {
  try {
    const localSops = await getAllSOPs(true);
    let count = 0;
    for (const s of localSops) {
      const ok = await pushSopToCloud(s);
      if (ok) count++;
    }
    return { count, success: true };
  } catch {
    return { count: 0, success: false };
  }
}

export async function syncUserDraftWithCloud(userId: string, doc?: SOPDocument): Promise<SOPDocument | null> {
  if (!userId) return null;
  const config = getCloudSyncConfig();

  if (doc) {
    // Push draft to cloud
    try {
      await fetch(`${config.syncEndpoint}?action=saveDraft&userId=${encodeURIComponent(userId)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.firebaseUrl ? { 'x-cloud-sync-url': config.firebaseUrl } : {}),
        },
        body: JSON.stringify(doc),
      });
    } catch {}

    if (config.firebaseUrl && config.firebaseUrl.includes('firebaseio.com')) {
      try {
        const cleanFbUrl = config.firebaseUrl.replace(/\/$/, '');
        await fetch(`${cleanFbUrl}/drafts/${encodeURIComponent(userId)}.json`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(doc),
        });
      } catch {}
    }
    return doc;
  } else {
    // Pull draft from cloud
    let pulledDoc: SOPDocument | null = null;
    try {
      const res = await fetch(`${config.syncEndpoint}?action=getDraft&userId=${encodeURIComponent(userId)}`, {
        headers: {
          ...(config.firebaseUrl ? { 'x-cloud-sync-url': config.firebaseUrl } : {}),
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.doc && typeof data.doc === 'object' && data.doc.header) {
          pulledDoc = data.doc as SOPDocument;
        }
      }
    } catch {}

    if (!pulledDoc && config.firebaseUrl && config.firebaseUrl.includes('firebaseio.com')) {
      try {
        const cleanFbUrl = config.firebaseUrl.replace(/\/$/, '');
        const res = await fetch(`${cleanFbUrl}/drafts/${encodeURIComponent(userId)}.json`);
        if (res.ok) {
          const data = await res.json();
          if (data && typeof data === 'object' && data.header) {
            pulledDoc = data as SOPDocument;
          }
        }
      } catch {}
    }

    if (pulledDoc) {
      if (
        pulledDoc.header?.processName?.includes('BOPP Tape') ||
        (pulledDoc.photos && pulledDoc.photos.some((p: any) => p.url?.includes('Tape Dispenser') || p.name?.includes('Pasted Image')))
      ) {
        return null;
      }
      try {
        localStorage.setItem(USER_DRAFT_PREFIX + userId, JSON.stringify(pulledDoc));
      } catch {}
      return pulledDoc;
    }
    return null;
  }
}

// 1-Click Export of all user's drafts and data for transferring to another PC
export async function exportUserWorkspaceBackup(userId: string): Promise<string> {
  const draft = await getUserWorkingDraft(userId);
  const allSOPs = await getAllSOPs();
  const userSops = allSOPs.filter((s) => s.authorId === userId);

  const payload = {
    appName: 'Walton SOP Maker Enterprise',
    exportType: 'user_workspace_backup',
    userId,
    exportedAt: new Date().toISOString(),
    activeDraft: draft,
    sops: userSops,
  };

  return JSON.stringify(payload, null, 2);
}

// 1-Click Import of workspace from another PC
export async function importUserWorkspaceBackup(
  userId: string,
  jsonString: string
): Promise<{ success: boolean; doc: SOPDocument | null; message: string }> {
  try {
    const data = JSON.parse(jsonString);
    if (!data.activeDraft && (!data.sops || !Array.isArray(data.sops))) {
      return { success: false, doc: null, message: 'অকার্যকর ব্যাকআপ ফাইল ফরম্যাট।' };
    }

    const docToRestore: SOPDocument = data.activeDraft || data.sops[0];
    if (docToRestore) {
      await saveUserWorkingDraft(userId, docToRestore);
    }

    if (data.sops && Array.isArray(data.sops)) {
      for (const s of data.sops) {
        await saveSOP(s);
      }
    }

    return {
      success: true,
      doc: docToRestore || null,
      message: 'অন্য PC-এর ড্রাফট ও SOP ডাটা সফলভাবে বর্তমান সিস্টেমে লোড হয়েছে!',
    };
  } catch (err: any) {
    return { success: false, doc: null, message: 'ব্যাকআপ ফাইলটি পড়তে ব্যর্থ হয়েছে: ' + err.message };
  }
}

// Workflow: Prepared By forwards to Checked By
export async function forwardToChecker(
  doc: SOPDocument,
  checkerId: string,
  user: UserProfile,
  signatureImg?: string,
  note?: string
): Promise<SOPDocument> {
  const now = new Date().toISOString();
  const allUsers = await getAllUsers();
  const checker = allUsers.find((u) => u.id === checkerId);

  const updatedHeader = {
    ...doc.header,
    preparedBy: {
      ...doc.header.preparedBy,
      name: user.name,
      designation: user.designation,
      dept: user.department,
      date: new Date().toISOString().split('T')[0],
      signatureImg: signatureImg || doc.header.preparedBy.signatureImg || user.defaultSignatureImg,
    },
    checkedBy: {
      ...doc.header.checkedBy,
      name: checker?.name || doc.header.checkedBy.name,
      designation: checker?.designation || doc.header.checkedBy.designation,
    },
  };

  const auditEntry: AuditLogEntry = {
    id: `log_${Date.now()}`,
    action: 'forward_checker',
    performedBy: user.username,
    performedByName: user.name,
    role: user.role,
    timestamp: now,
    note: note || `উচ্চপদস্থ পর্যালোচনার জন্য ${checker?.name || checkerId} এর কাছে পাঠানো হয়েছে।`,
  };

  const forwardedDoc: SOPDocument = {
    ...doc,
    status: 'forwarded_to_checker',
    checkedById: checkerId,
    checkedByName: checker?.name || checkerId,
    header: updatedHeader,
    updatedAt: now,
    auditTrail: [...(doc.auditTrail || []), auditEntry],
  };

  return saveSOP(forwardedDoc, user, auditEntry.note);
}

// Workflow: Checked By forwards to Approved By (Kamrul)
export async function forwardToApprover(
  doc: SOPDocument,
  user: UserProfile,
  signatureImg?: string,
  note?: string
): Promise<SOPDocument> {
  const now = new Date().toISOString();
  const allUsers = await getAllUsers();
  const approver = allUsers.find((u) => u.role === 'approved_by') || INITIAL_USERS.find((u) => u.id === 'Kamrul');

  const updatedHeader = {
    ...doc.header,
    checkedBy: {
      ...doc.header.checkedBy,
      name: user.name,
      designation: user.designation,
      signatureImg: signatureImg || doc.header.checkedBy.signatureImg || user.defaultSignatureImg,
    },
    approvedBy: {
      ...doc.header.approvedBy,
      name: approver?.name || 'Kamrul Hasan',
      designation: approver?.designation || 'Head of Department / Plant Manager',
    },
  };

  const auditEntry: AuditLogEntry = {
    id: `log_${Date.now()}`,
    action: 'forward_approver',
    performedBy: user.username,
    performedByName: user.name,
    role: user.role,
    timestamp: now,
    note: note || `পর্যালোচনা সম্পন্ন করে চূড়ান্ত অনুমোদনের জন্য ${approver?.name || 'Kamrul Hasan'} এর নিকট ফরোয়ার্ড করা হয়েছে।`,
  };

  const forwardedDoc: SOPDocument = {
    ...doc,
    status: 'forwarded_to_approver',
    checkedById: user.id,
    checkedByName: user.name,
    checkedAt: now,
    approvedById: approver?.id || 'Kamrul',
    approvedByName: approver?.name || 'Kamrul Hasan',
    header: updatedHeader,
    updatedAt: now,
    auditTrail: [...(doc.auditTrail || []), auditEntry],
  };

  return saveSOP(forwardedDoc, user, auditEntry.note);
}

// Workflow: Final Approval by Kamrul
export async function approveSOP(
  doc: SOPDocument,
  user: UserProfile,
  signatureImg?: string,
  note?: string
): Promise<SOPDocument> {
  const now = new Date().toISOString();

  const updatedHeader = {
    ...doc.header,
    approvedBy: {
      ...doc.header.approvedBy,
      name: user.name,
      designation: user.designation,
      signatureImg: signatureImg || doc.header.approvedBy.signatureImg || user.defaultSignatureImg,
    },
    effectiveDate: doc.header.effectiveDate || new Date().toISOString().split('T')[0],
  };

  const auditEntry: AuditLogEntry = {
    id: `log_${Date.now()}`,
    action: 'approve',
    performedBy: user.username,
    performedByName: user.name,
    role: user.role,
    timestamp: now,
    note: note || 'SOP চূড়ান্তভাবে অনুমোদিত ও কনসার্ন সেকশনে প্রকাশের জন্য প্রস্তুত করা হয়েছে।',
  };

  const approvedDoc: SOPDocument = {
    ...doc,
    status: 'approved',
    approvedById: user.id,
    approvedByName: user.name,
    approvedAt: now,
    header: updatedHeader,
    updatedAt: now,
    auditTrail: [...(doc.auditTrail || []), auditEntry],
  };

  return saveSOP(approvedDoc, user, auditEntry.note);
}

// Workflow: Reject / Request Revision
export async function rejectSOP(doc: SOPDocument, user: UserProfile, reason: string): Promise<SOPDocument> {
  const now = new Date().toISOString();

  const auditEntry: AuditLogEntry = {
    id: `log_${Date.now()}`,
    action: 'reject',
    performedBy: user.username,
    performedByName: user.name,
    role: user.role,
    timestamp: now,
    note: `সংশোধনের জন্য ফেরত পাঠানো হয়েছে। কারণ: ${reason}`,
  };

  const rejectedDoc: SOPDocument = {
    ...doc,
    status: 'rejected',
    rejectionReason: reason,
    updatedAt: now,
    auditTrail: [...(doc.auditTrail || []), auditEntry],
  };

  return saveSOP(rejectedDoc, user, auditEntry.note);
}

// Master Database Backup (Export JSON) & Restore (Import JSON)
export async function exportDatabaseBackup(): Promise<string> {
  const sops = await getAllSOPs();
  const users = await getAllUsers();
  const payload = {
    version: DB_VERSION,
    exportedAt: new Date().toISOString(),
    users,
    sops,
  };
  return JSON.stringify(payload, null, 2);
}

export async function importDatabaseBackup(jsonString: string): Promise<{ success: boolean; sopCount: number }> {
  try {
    const data = JSON.parse(jsonString);
    if (!data.sops || !Array.isArray(data.sops)) {
      throw new Error('Invalid backup file format');
    }
    const db = await openDatabase();
    const tx = db.transaction([STORE_SOPS, STORE_USERS], 'readwrite');
    const sopStore = tx.objectStore(STORE_SOPS);
    const userStore = tx.objectStore(STORE_USERS);

    if (data.users && Array.isArray(data.users)) {
      data.users.forEach((u: UserProfile) => userStore.put(u));
    }

    data.sops.forEach((s: SOPDocument) => sopStore.put(s));

    return new Promise((resolve) => {
      tx.oncomplete = () => resolve({ success: true, sopCount: data.sops.length });
      tx.onerror = () => resolve({ success: false, sopCount: 0 });
    });
  } catch (e) {
    console.error('Import error:', e);
    return { success: false, sopCount: 0 };
  }
}
