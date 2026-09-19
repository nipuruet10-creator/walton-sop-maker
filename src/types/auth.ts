export type UserRole = 'admin' | 'prepared_by' | 'checked_by' | 'approved_by' | 'viewer';

export interface UserProfile {
  id: string; // e.g. 'Biplob', 'Dev', 'Sazzad', 'Rafi', 'Hashmi', 'Pear', 'Emon', 'Kamrul'
  username: string; // login identifier
  name: string; // display name, e.g. 'Biplob Hossain'
  role: UserRole;
  designation: string; // e.g. 'Process Engineer', 'Section In-Charge', 'Head of Dept'
  department: string; // e.g. 'Process Engineering', 'Quality Assurance', 'Plant Management'
  passwordHash: string; // stored password (plain/hash for client-side persistence)
  defaultSignatureImg?: string; // saved signature stamp image
  createdAt: string;
}

export interface UserSession {
  user: UserProfile;
  token: string;
  loginAt: string;
}

export type SOPStatus =
  | 'draft'
  | 'forwarded_to_checker'
  | 'checked'
  | 'forwarded_to_approver'
  | 'approved'
  | 'rejected';

export interface AuditLogEntry {
  id: string;
  action: 'create' | 'update' | 'forward_checker' | 'check' | 'forward_approver' | 'approve' | 'reject' | 'delete' | 'restore';
  performedBy: string; // username
  performedByName: string;
  role: UserRole;
  timestamp: string;
  note?: string;
}
