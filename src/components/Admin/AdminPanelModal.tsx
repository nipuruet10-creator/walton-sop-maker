import React, { useState, useEffect } from 'react';
import type { UserProfile } from '../../types/auth';
import {
  getAllUsers,
  resetUserPassword,
  exportDatabaseBackup,
  importDatabaseBackup,
} from '../../services/storageService';
import {
  ShieldAlert,
  Users,
  KeyRound,
  Download,
  Upload,
  Check,
  X,
} from 'lucide-react';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({ isOpen, onClose, currentUser }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'routing' | 'backup'>('users');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [newPassword, setNewPassword] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchUsers = async () => {
    const list = await getAllUsers();
    setUsers(list);
  };

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
        <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center space-y-3">
          <ShieldAlert className="w-12 h-12 text-rose-600 mx-auto" />
          <h3 className="font-bold text-slate-900 text-sm">অ্যাক্সেস সংরক্ষিত (Access Denied)</h3>
          <p className="text-xs text-slate-500">
            এই প্যানেলে প্রবেশের অধিকার শুধুমাত্র অ্যাডমিন (ID: Sazzad, Pass: ACprocess@2026)-এর রয়েছে।
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 bg-slate-800 text-white rounded-xl text-xs font-bold"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    );
  }

  const handleResetPassword = async (userId: string) => {
    if (!newPassword.trim()) {
      alert('অনুগ্রহ করে নতুন পাসওয়ার্ড লিখুন।');
      return;
    }
    const ok = await resetUserPassword(userId, newPassword.trim());
    if (ok) {
      setSuccessMsg(`ইউজার ${userId} এর পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে!`);
      setNewPassword('');
      setSelectedUser(null);
      await fetchUsers();
      setTimeout(() => setSuccessMsg(null), 4000);
    } else {
      alert('পাসওয়ার্ড রিসেট ব্যর্থ হয়েছে।');
    }
  };

  const handleExportBackup = async () => {
    try {
      const json = await exportDatabaseBackup();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `walton_sop_master_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert('Backup failed: ' + e.message);
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const json = event.target?.result as string;
      const res = await importDatabaseBackup(json);
      if (res.success) {
        alert(`ব্যাকআপ সফলভাবে রিস্টোর হয়েছে! ${res.sopCount} টি SOP পুনরুদ্ধার করা হয়েছে।`);
        await fetchUsers();
      } else {
        alert('ব্যাকআপ ফাইলটি সঠিক নয়।');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Admin Header */}
        <div className="bg-gradient-to-r from-rose-900 via-slate-900 to-slate-950 text-white px-6 py-4 flex items-center justify-between border-b border-rose-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight">System Admin & Governance Panel</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Super Admin
                </span>
              </div>
              <p className="text-xs text-slate-400">
                ইউজার কন্ট্রোল, পাসওয়ার্ড রিকভারি, অনুমোদন রুট এবং ডাটাবেজ ব্যাকআপ
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-rose-700 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>ইউজার ও পাসওয়ার্ড রিকভারি</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('backup')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                activeTab === 'backup'
                  ? 'bg-rose-700 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>মাস্টার ব্যাকআপ ও রিস্টোর</span>
            </button>
          </div>

          {successMsg && (
            <div className="bg-emerald-100 text-emerald-800 text-xs px-3 py-1 rounded-xl font-semibold flex items-center gap-1">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 bg-slate-100/60">
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl p-3 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                <span>
                  মোট ইউজার: <strong>{users.length} জন</strong> (নিচে যে কারো পাসওয়ার্ড পরিবর্তন করতে পারেন)
                </span>
                <span className="text-slate-400">ডিফল্ট পাসওয়ার্ড: Process@2026</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {users.map((u) => (
                  <div
                    key={u.id}
                    className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs space-y-2.5 hover:border-blue-300 transition"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-xs text-slate-900 flex items-center gap-2">
                          <span>{u.name}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                            {u.id}
                          </span>
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {u.designation} • {u.department}
                        </p>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          u.role === 'admin'
                            ? 'bg-rose-100 text-rose-800'
                            : u.role === 'approved_by'
                            ? 'bg-purple-100 text-purple-800'
                            : u.role === 'checked_by'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {u.role.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                      <span className="text-slate-500 font-mono text-[10px]">
                        পাসওয়ার্ড: ••••••••••••
                      </span>

                      <button
                        type="button"
                        onClick={() => setSelectedUser(u)}
                        className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition cursor-pointer"
                      >
                        <KeyRound className="w-3 h-3 text-blue-600" />
                        <span>পাসওয়ার্ড রিসেট</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'backup' && (
            <div className="space-y-4 max-w-xl mx-auto py-6">
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">মাস্টার ডাটাবেজ ব্যাকআপ (Export JSON)</h3>
                    <p className="text-xs text-slate-500">
                      সিস্টেমের সমস্ত ইউজার, পাসওয়ার্ড, এবং সংরক্ষিত SOP একটি JSON ফাইলে সেভ করুন।
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>সম্পূর্ণ ব্যাকআপ ফাইল ডাউনলোড করুন</span>
                </button>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">ডাটাবেজ পুনরুদ্ধার (Restore from Backup)</h3>
                    <p className="text-xs text-slate-500">
                      পূর্বের কোনো ব্যাকআপ JSON ফাইল সিলেক্ট করে সমস্ত ডাটা ফিরিয়ে আনুন।
                    </p>
                  </div>
                </div>

                <label className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer">
                  <Upload className="w-4 h-4" />
                  <span>JSON ব্যাকআপ ফাইল সিলেক্ট করুন</span>
                  <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Password Reset Dialog */}
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-blue-600" />
                  <span>পাসওয়ার্ড রিসেট: {selectedUser.name}</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  নতুন পাসওয়ার্ড লিখুন:
                </label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="যেমন: Process@2026 বা নতুন কিছু"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 font-mono"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={() => handleResetPassword(selectedUser.id)}
                  disabled={!newPassword.trim()}
                  className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 text-white text-xs font-bold shadow-xs"
                >
                  সেভ করুন
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
