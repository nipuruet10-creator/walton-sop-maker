import type { UserProfile, SOPStatus, AuditLogEntry, NotificationItem } from '../types/auth';
import type { SOPDocument } from '../types/sop';

const DB_NAME = 'WaltonSopDB';
const DB_VERSION = 2;
const STORE_USERS = 'users';
const STORE_SOPS = 'sops';
const CURRENT_USER_STORAGE_KEY = 'walton_sop_active_user_v2';

// Pre-seeded Users as explicitly requested by User
export const INITIAL_USERS: UserProfile[] = [
  {
    id: 'Biplob',
    username: 'Biplob',
    name: 'Biplob Hossain',
    role: 'prepared_by',
    designation: 'Process Engineer',
    department: 'Process Automation & IE',
    passwordHash: 'Process@2026',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'Dev',
    username: 'Dev',
    name: 'Deb Broto',
    role: 'prepared_by',
    designation: 'Process Engineer',
    department: 'Process Automation & IE',
    passwordHash: 'Process@2026',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'Sazzad',
    username: 'Sazzad',
    name: 'Sazzad Hossain',
    role: 'checked_by',
    designation: 'Sr. Process Engineer / In-Charge',
    department: 'Process Automation',
    passwordHash: 'Process@2026',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'Rafi',
    username: 'Rafi',
    name: 'Rafiul Islam',
    role: 'checked_by',
    designation: 'Section In-Charge',
    department: 'Production Management',
    passwordHash: 'Process@2026',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'Hashmi',
    username: 'Hashmi',
    name: 'Hashmi Ahmed',
    role: 'checked_by',
    designation: 'QA In-Charge',
    department: 'Quality Assurance',
    passwordHash: 'Process@2026',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'Pear',
    username: 'Pear',
    name: 'Pear Mohammad',
    role: 'checked_by',
    designation: 'Production In-Charge',
    department: 'AC Manufacturing Division',
    passwordHash: 'Process@2026',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'Emon',
    username: 'Emon',
    name: 'Emon Hasan',
    role: 'checked_by',
    designation: 'Technical In-Charge',
    department: 'Engineering Operations',
    passwordHash: 'Process@2026',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'Kamrul',
    username: 'Kamrul',
    name: 'Kamrul Hasan',
    role: 'approved_by',
    designation: 'Head of Dept / Plant Manager',
    department: 'Plant Operations & Manufacturing',
    passwordHash: 'Process@2026',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'Admin_Sazzad',
    username: 'Admin_Sazzad',
    name: 'Sazzad (Admin)',
    role: 'admin',
    designation: 'System Administrator & Process Lead',
    department: 'System & Process Governance',
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

// Seed initial users if store is empty
async function seedInitialData(db: IDBDatabase): Promise<void> {
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_USERS, 'readwrite');
    const store = tx.objectStore(STORE_USERS);
    const countReq = store.count();

    countReq.onsuccess = () => {
      if (countReq.result === 0) {
        INITIAL_USERS.forEach((u) => store.put(u));
      }
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}

// ==================== AUTH METHODS ====================

export async function authenticateUser(usernameInput: string, passwordInput: string): Promise<UserProfile | null> {
  const cleanUsername = usernameInput.trim();
  const cleanPassword = passwordInput.trim();

  // Special Admin login check: Admin ID 'Sazzad' with password 'ACprocess@2026'
  if (cleanUsername.toLowerCase() === 'sazzad' && cleanPassword === 'ACprocess@2026') {
    return INITIAL_USERS.find((u) => u.id === 'Admin_Sazzad') || null;
  }

  // Also support entering username as 'admin'
  if (cleanUsername.toLowerCase() === 'admin' && cleanPassword === 'ACprocess@2026') {
    return INITIAL_USERS.find((u) => u.id === 'Admin_Sazzad') || null;
  }

  const users = await getAllUsers();
  const matched = users.find(
    (u) =>
      (u.username.toLowerCase() === cleanUsername.toLowerCase() ||
        u.name.toLowerCase().includes(cleanUsername.toLowerCase())) &&
      u.passwordHash === cleanPassword
  );

  return matched || null;
}

export async function getAllUsers(): Promise<UserProfile[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_USERS, 'readonly');
      const store = tx.objectStore(STORE_USERS);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result.length > 0 ? req.result : INITIAL_USERS);
      req.onerror = () => resolve(INITIAL_USERS);
    });
  } catch {
    return INITIAL_USERS;
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

export async function getAllSOPs(): Promise<SOPDocument[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_SOPS, 'readonly');
      const store = tx.objectStore(STORE_SOPS);
      const req = store.getAll();
      req.onsuccess = () => {
        const results = req.result as SOPDocument[];
        // Sort newest first
        results.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
        resolve(results);
      };
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
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

  return updatedDoc;
}

export async function deleteSOP(id: string): Promise<boolean> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_SOPS, 'readwrite');
      const store = tx.objectStore(STORE_SOPS);
      const req = store.delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  } catch {
    return false;
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
