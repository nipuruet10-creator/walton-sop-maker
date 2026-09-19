import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { UserProfile, UserRole } from '../../types/auth';
import {
  getAllUsers,
  resetUserPassword,
  exportDatabaseBackup,
  importDatabaseBackup,
  addUser,
  updateUserProfile,
  deleteUser,
} from '../../services/storageService';
import {
  ShieldAlert,
  Users,
  KeyRound,
  Download,
  Upload,
  Check,
  X,
  Trash2,
  Edit2,
  Workflow,
  Search,
  UserPlus,
} from 'lucide-react';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({ isOpen, onClose, currentUser }) => {
  const [activeTab, setActiveTab] = useState<'routing' | 'users' | 'backup'>('routing');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUserForReset, setSelectedUserForReset] = useState<UserProfile | null>(null);
  const [newPassword, setNewPassword] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [levelFilter, setLevelFilter] = useState<'all' | 'prepared_by' | 'checked_by' | 'approved_by'>('all');

  // Add Approver Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [newUserId, setNewUserId] = useState<string>('');
  const [newUserName, setNewUserName] = useState<string>('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('checked_by');
  const [newUserDesignation, setNewUserDesignation] = useState<string>('');
  const [newUserDepartment, setNewUserDepartment] = useState<string>('Process Automation');
  const [newUserPassword, setNewUserPassword] = useState<string>('Process@2026');

  // Edit Approver Modal state
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editRole, setEditRole] = useState<UserRole>('checked_by');
  const [editDesignation, setEditDesignation] = useState<string>('');
  const [editDepartment, setEditDepartment] = useState<string>('');

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

  // Render Access Denied using createPortal
  if (!currentUser || currentUser.role !== 'admin') {
    return createPortal(
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl border border-rose-200">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">অ্যাক্সেস সংরক্ষিত (Access Denied)</h3>
            <p className="text-xs text-slate-500 mt-1">
              এই সেটিং ও অনুমোদন প্যানেলে প্রবেশের অধিকার শুধুমাত্র অ্যাডমিন (ID: Sazzad, Pass: ACprocess@2026)-এর রয়েছে।
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            প্যানেল বন্ধ করুন
          </button>
        </div>
      </div>,
      document.body
    );
  }

  const showNotification = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  // Add User / Approver Handler
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = newUserId.trim();
    const cleanName = newUserName.trim();

    if (!cleanId || !cleanName) {
      alert('অনুগ্রহ করে ইউজার আইডি এবং পূর্ণ নাম লিখুন।');
      return;
    }

    if (users.some((u) => u.id.toLowerCase() === cleanId.toLowerCase() || u.username.toLowerCase() === cleanId.toLowerCase())) {
      alert(`আইডি "${cleanId}" ইতিমধ্যে বিদ্যমান! অনুগ্রহ করে অন্য আইডি ব্যবহার করুন।`);
      return;
    }

    const newUser: UserProfile = {
      id: cleanId,
      username: cleanId,
      name: cleanName,
      role: newUserRole,
      designation: newUserDesignation.trim() || 'Officer / Engineer',
      department: newUserDepartment.trim() || 'Process Automation',
      passwordHash: newUserPassword.trim() || 'Process@2026',
      createdAt: new Date().toISOString(),
    };

    const ok = await addUser(newUser);
    if (ok) {
      showNotification(`অনুমোদনকারী "${cleanName}" (${cleanId}) সফলভাবে যুক্ত করা হয়েছে!`);
      setIsAddModalOpen(false);
      setNewUserId('');
      setNewUserName('');
      setNewUserDesignation('');
      setNewUserDepartment('Process Automation');
      setNewUserPassword('Process@2026');
      await fetchUsers();
    } else {
      alert('ইউজার যুক্ত করতে সমস্যা হয়েছে।');
    }
  };

  // Open Edit Dialog
  const handleOpenEdit = (user: UserProfile) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditRole(user.role);
    setEditDesignation(user.designation);
    setEditDepartment(user.department);
  };

  // Save Edited User
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const updatedUser: UserProfile = {
      ...editingUser,
      name: editName.trim() || editingUser.name,
      role: editRole,
      designation: editDesignation.trim() || editingUser.designation,
      department: editDepartment.trim() || editingUser.department,
    };

    const ok = await updateUserProfile(updatedUser);
    if (ok) {
      showNotification(`"${updatedUser.name}" এর তথ্য ও সিকোয়েন্স সফলভাবে আপডেট করা হয়েছে!`);
      setEditingUser(null);
      await fetchUsers();
    } else {
      alert('তথ্য আপডেট ব্যর্থ হয়েছে।');
    }
  };

  // Delete User / Approver Handler
  const handleDeleteUser = async (user: UserProfile) => {
    if (user.id === 'Admin_Sazzad' || user.id === 'Sazzad' && user.role === 'admin') {
      alert('সিস্টেম সুপার অ্যাডমিন আইডি মুছে ফেলা যাবে না!');
      return;
    }

    const confirmed = confirm(
      `আপনি কি নিশ্চিতভাবে "${user.name}" (ID: ${user.id}, Role: ${user.role}) কে অনুমোদন রুট থেকে মুছে ফেলতে চান?`
    );
    if (!confirmed) return;

    const ok = await deleteUser(user.id);
    if (ok) {
      showNotification(`ইউজার "${user.name}" কে সফলভাবে মুছে ফেলা হয়েছে।`);
      await fetchUsers();
    } else {
      alert('ইউজার মুছতে ব্যর্থ হয়েছে।');
    }
  };

  // Reset Password Handler
  const handleResetPassword = async (userId: string) => {
    if (!newPassword.trim()) {
      alert('অনুগ্রহ করে নতুন পাসওয়ার্ড লিখুন।');
      return;
    }
    const ok = await resetUserPassword(userId, newPassword.trim());
    if (ok) {
      showNotification(`ইউজার ${userId} এর পাসওয়ার্ড সফলভাবে রিসেট করা হয়েছে!`);
      setNewPassword('');
      setSelectedUserForReset(null);
      await fetchUsers();
    } else {
      alert('পাসওয়ার্ড রিসেট ব্যর্থ হয়েছে।');
    }
  };

  // Export & Import
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
        alert(`ব্যাকআপ সফলভাবে রিস্টোর হয়েছে! ${res.sopCount} টি SOP উদ্ধার করা হয়েছে।`);
        await fetchUsers();
      } else {
        alert('ব্যাকআপ ফাইলটি সঠিক নয়।');
      }
    };
    reader.readAsText(file);
  };

  // Filtered Users List
  const filteredUsers = users.filter((u) => {
    const matchesLevel = levelFilter === 'all' || u.role === levelFilter;
    const matchesSearch =
      !searchQuery.trim() ||
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.department.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLevel && matchesSearch;
  });

  const preparedByUsers = users.filter((u) => u.role === 'prepared_by');
  const checkedByUsers = users.filter((u) => u.role === 'checked_by');
  const approvedByUsers = users.filter((u) => u.role === 'approved_by');

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 w-full max-w-5xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-800">
        {/* Admin Header */}
        <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-slate-950 text-white px-6 py-4 flex items-center justify-between border-b border-rose-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600/25 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight">System Admin & Governance Panel</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/25 text-rose-300 border border-rose-500/30">
                  Super Admin: Sazzad
                </span>
              </div>
              <p className="text-xs text-slate-400">
                অনুমোদন রুট ও সিকোয়েন্স কনফিগারেশন, ইউজার ও পাসওয়ার্ড ব্যবস্থাপনা, ব্যাকআপ
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs Bar */}
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('routing')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                activeTab === 'routing'
                  ? 'bg-rose-800 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Workflow className="w-3.5 h-3.5" />
              <span>অনুমোদন রুট ও সিকোয়েন্স সেটিংস</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-rose-800 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>ইউজার তালিকা ও পাসওয়ার্ড ({users.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('backup')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                activeTab === 'backup'
                  ? 'bg-rose-800 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>মাস্টার ব্যাকআপ ও রিস্টোর</span>
            </button>
          </div>

          {successMsg && (
            <div className="bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs px-3 py-1 rounded-xl font-semibold flex items-center gap-1.5 animate-in fade-in">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 bg-slate-100/70">
          {/* TAB 1: APPROVAL ROUTING & SEQUENCE SETTINGS */}
          {activeTab === 'routing' && (
            <div className="space-y-5">
              {/* Visual Sequence Pipeline Cards */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                      <Workflow className="w-4 h-4 text-rose-700" />
                      <span>অনুমোদন সিকোয়েন্স রুট পাইপলাইন (3-Step Approval Pipeline)</span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      প্রত্যেকটি ধাপে নির্দিষ্ট কর্মকর্তাদের মাধ্যমে এসওপি পর্যালোচনা ও ছাড়পত্র প্রদান করা হয়
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-700 hover:bg-rose-600 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>নতুন অনুমোদনকারী যুক্ত করুন</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Step 1: Prepared By */}
                  <div className="bg-slate-50 border border-emerald-200 rounded-xl p-3.5 relative">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        ধাপ ১: প্রস্তুতকারী (Prepared By)
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-500">
                        {preparedByUsers.length} জন
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 mt-2">প্রসেস ইঞ্জিনিয়ার ও ক্রিয়েটর</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      বাংলিশ থেকে খাঁটি বাংলা এসওপি ড্রাফট, ছবি চিহ্নিতকরণ ও সাইন দিয়ে লেভেল ২-এ ফরোয়ার্ড করেন।
                    </p>
                    <div className="mt-2.5 flex flex-wrap gap-1">
                      {preparedByUsers.map((u) => (
                        <span
                          key={u.id}
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-700"
                        >
                          {u.name.split(' ')[0]} ({u.id})
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Step 2: Checked By */}
                  <div className="bg-slate-50 border border-blue-200 rounded-xl p-3.5 relative">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                        ধাপ ২: পর্যালোচক (Checked By)
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-500">
                        {checkedByUsers.length} জন
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 mt-2">ইন-চার্জ ও কোয়ালিটি প্রধান</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      প্রসেস ও সেফটি নিরীক্ষা, নিজস্ব ডিজিটাল সাইন যুক্ত করে লেভেল ৩-এ ফরোয়ার্ড বা রিজেক্ট করেন।
                    </p>
                    <div className="mt-2.5 flex flex-wrap gap-1">
                      {checkedByUsers.map((u) => (
                        <span
                          key={u.id}
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-700"
                        >
                          {u.name.split(' ')[0]} ({u.id})
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Step 3: Approved By */}
                  <div className="bg-slate-50 border border-purple-200 rounded-xl p-3.5 relative">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                        ধাপ ৩: অনুমোদনকারী (Approved By)
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-500">
                        {approvedByUsers.length} জন
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 mt-2">প্ল্যান্ট ম্যানেজার / বিভাগীয় প্রধান</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      চূড়ান্ত যাচাই, সিগনেচার সীল এবং ফ্যাক্টরির কনসার্ন সেকশনে আর্কাইভের জন্য প্রকাশ করেন।
                    </p>
                    <div className="mt-2.5 flex flex-wrap gap-1">
                      {approvedByUsers.map((u) => (
                        <span
                          key={u.id}
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-700"
                        >
                          {u.name.split(' ')[0]} ({u.id})
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Filtering Controls & Approvers List */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700">সিকোয়েন্স ফিল্টার:</span>
                    <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs">
                      <button
                        type="button"
                        onClick={() => setLevelFilter('all')}
                        className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                          levelFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        সকল ({users.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setLevelFilter('prepared_by')}
                        className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                          levelFilter === 'prepared_by' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        ১. প্রস্তুতকারী ({preparedByUsers.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setLevelFilter('checked_by')}
                        className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                          levelFilter === 'checked_by' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        ২. পর্যালোচক ({checkedByUsers.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setLevelFilter('approved_by')}
                        className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                          levelFilter === 'approved_by' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        ৩. অনুমোদনকারী ({approvedByUsers.length})
                      </button>
                    </div>
                  </div>

                  {/* Search box */}
                  <div className="relative min-w-[240px]">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="নাম, পদবী বা আইডি দিয়ে খুঁজুন..."
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-rose-600"
                    />
                  </div>
                </div>

                {/* Approvers Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredUsers.map((u) => {
                    const isSuperAdmin = u.id === 'Admin_Sazzad' || (u.id === 'Sazzad' && u.role === 'admin');
                    return (
                      <div
                        key={u.id}
                        className="bg-white border border-slate-200 hover:border-blue-300 rounded-xl p-3.5 shadow-xs transition flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                                <span>{u.name}</span>
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                                  {u.id}
                                </span>
                              </h4>
                              <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                                {u.designation}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                {u.department}
                              </p>
                            </div>

                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                                u.role === 'admin'
                                  ? 'bg-rose-100 text-rose-800'
                                  : u.role === 'approved_by'
                                  ? 'bg-purple-100 text-purple-800'
                                  : u.role === 'checked_by'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {u.role === 'admin'
                                ? 'অ্যাডমিন'
                                : u.role === 'approved_by'
                                ? '৩. অনুমোদন'
                                : u.role === 'checked_by'
                                ? '২. পর্যালোচনা'
                                : '১. প্রস্তুতকারী'}
                            </span>
                          </div>
                        </div>

                        {/* Card Actions: Edit & Remove */}
                        <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-100 text-[11px]">
                          <span className="text-[10px] text-slate-400 font-mono">
                            পাসওয়ার্ড: ••••••••
                          </span>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(u)}
                              className="p-1 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                              title="তথ্য ও সিকোয়েন্স এডিট করুন"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {!isSuperAdmin && (
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(u)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                title="অনুমোদনকারী মুছে ফেলুন"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: USER LIST & PASSWORD RECOVERY */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl p-3.5 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                <span>
                  মোট সক্রিয় ইউজার: <strong>{users.length} জন</strong> (এখানে যেকোনো ইউজারের পাসওয়ার্ড পরিবর্তন করতে পারেন)
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
                            ID: {u.id}
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
                        onClick={() => setSelectedUserForReset(u)}
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

          {/* TAB 3: MASTER BACKUP & RESTORE */}
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
                      সিস্টেমের সমস্ত ইউজার, পাসওয়ার্ড, অনুমোদন রুট এবং সংরক্ষিত SOP একটি JSON ফাইলে সেভ করুন।
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

        {/* MODAL: ADD NEW APPROVER / USER */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl p-5 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b pb-2.5">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-rose-700" />
                  <span>নতুন অনুমোদনকারী / কর্মকর্তা যুক্ত করুন</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddUser} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    ইউজার আইডি / ইউজারনেম (Login ID) *
                  </label>
                  <input
                    type="text"
                    value={newUserId}
                    onChange={(e) => setNewUserId(e.target.value)}
                    placeholder="যেমন: Tanvir, Anik, Shanto"
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-rose-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    পূর্ণ নাম (Full Name) *
                  </label>
                  <input
                    type="text"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="যেমন: Tanvir Ahmed"
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-rose-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    অনুমোদনের সিকোয়েন্স / রোল (Approval Routing Step) *
                  </label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-rose-600 font-semibold"
                  >
                    <option value="prepared_by">ধাপ ১: প্রস্তুতকারী (Level 1: Prepared By - Engineer)</option>
                    <option value="checked_by">ধাপ ২: পর্যালোচক (Level 2: Checked By - In-Charge)</option>
                    <option value="approved_by">ধাপ ৩: চূড়ান্ত অনুমোদনকারী (Level 3: Approved By - Plant Head)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    পদবী (Designation)
                  </label>
                  <input
                    type="text"
                    value={newUserDesignation}
                    onChange={(e) => setNewUserDesignation(e.target.value)}
                    placeholder="যেমন: Process Engineer, Section In-Charge"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-rose-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    বিভাগ (Department)
                  </label>
                  <input
                    type="text"
                    value={newUserDepartment}
                    onChange={(e) => setNewUserDepartment(e.target.value)}
                    placeholder="যেমন: Process Automation, QA, Manufacturing"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-rose-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    ডিফল্ট পাসওয়ার্ড (Default Password)
                  </label>
                  <input
                    type="text"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    placeholder="ডিফল্ট: Process@2026"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-rose-600 font-mono"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 font-semibold"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-bold shadow-xs transition cursor-pointer"
                  >
                    যুক্ত করুন
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: EDIT APPROVER / USER */}
        {editingUser && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl p-5 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b pb-2.5">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-blue-600" />
                  <span>কর্মকর্তার তথ্য ও সিকোয়েন্স এডিট: {editingUser.id}</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    ইউজার আইডি (অপরিবর্তনীয়)
                  </label>
                  <input
                    type="text"
                    value={editingUser.id}
                    disabled
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-slate-500 font-mono cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    পূর্ণ নাম (Full Name) *
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    অনুমোদনের সিকোয়েন্স / রোল (Approval Routing Step) *
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as UserRole)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600 font-semibold"
                  >
                    <option value="prepared_by">ধাপ ১: প্রস্তুতকারী (Level 1: Prepared By - Engineer)</option>
                    <option value="checked_by">ধাপ ২: পর্যালোচক (Level 2: Checked By - In-Charge)</option>
                    <option value="approved_by">ধাপ ৩: চূড়ান্ত অনুমোদনকারী (Level 3: Approved By - Plant Head)</option>
                    <option value="admin">সুপার অ্যাডমিন (System Administrator)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    পদবী (Designation)
                  </label>
                  <input
                    type="text"
                    value={editDesignation}
                    onChange={(e) => setEditDesignation(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    বিভাগ (Department)
                  </label>
                  <input
                    type="text"
                    value={editDepartment}
                    onChange={(e) => setEditDepartment(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 font-semibold"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-xs transition cursor-pointer"
                  >
                    আপডেট সংরক্ষণ করুন
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: PASSWORD RESET DIALOG */}
        {selectedUserForReset && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b pb-2">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-blue-600" />
                  <span>পাসওয়ার্ড রিসেট: {selectedUserForReset.name}</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setSelectedUserForReset(null)}
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
                  onClick={() => setSelectedUserForReset(null)}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={() => handleResetPassword(selectedUserForReset.id)}
                  disabled={!newPassword.trim()}
                  className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                >
                  সেভ করুন
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
