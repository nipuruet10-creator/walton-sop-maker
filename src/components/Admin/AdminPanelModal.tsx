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
  getGlobalAiConfig,
  saveGlobalAiConfig,
  type GlobalAiConfig,
  getCloudSyncConfig,
  saveCloudSyncConfig,
  testCloudConnection,
  pushAllLocalSopsToCloud,
  pullAllSopsFromCloud,
  type CloudSyncConfig,
  clearTrialData,
} from '../../services/storageService';
import {
  testOpenRouterKey,
  fetchFreeOpenRouterModels,
  DEFAULT_FREE_MODELS,
  type OpenRouterModel,
} from '../../services/openrouterService';
import { PROCESS_CONCERNS } from '../../data/concernData';
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
  Sparkles,
  Cpu,
  Eye,
  EyeOff,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Cloud,
  CloudLightning,
  Globe,
  Database,
} from 'lucide-react';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({ isOpen, onClose, currentUser }) => {
  const [activeTab, setActiveTab] = useState<'routing' | 'ai' | 'users' | 'sync' | 'backup'>('routing');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUserForReset, setSelectedUserForReset] = useState<UserProfile | null>(null);
  const [newPassword, setNewPassword] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [levelFilter, setLevelFilter] = useState<'all' | 'prepared_by' | 'checked_by' | 'approved_by'>('all');

  // AI Configuration State
  const [aiConfig, setAiConfig] = useState<GlobalAiConfig>(getGlobalAiConfig);
  const [showOrKey, setShowOrKey] = useState<boolean>(false);
  const [showGemKey, setShowGemKey] = useState<boolean>(false);
  const [isTestingAi, setIsTestingAi] = useState<boolean>(false);
  const [aiTestResult, setAiTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [models, setModels] = useState<OpenRouterModel[]>(DEFAULT_FREE_MODELS);
  const [isFetchingModels, setIsFetchingModels] = useState<boolean>(false);

  // Add Approver Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [newUserId, setNewUserId] = useState<string>('');
  const [newUserEmpId, setNewUserEmpId] = useState<string>('');
  const [newUserName, setNewUserName] = useState<string>('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('prepared_by');
  const [newUserDesignation, setNewUserDesignation] = useState<string>('Process Engineer');
  const [newUserDepartment, setNewUserDepartment] = useState<string>('Process Development');
  const [newUserConcernId, setNewUserConcernId] = useState<string>('cac_idu');
  const [newUserPassword, setNewUserPassword] = useState<string>('');

  // Edit Approver Modal state
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editUserId, setEditUserId] = useState<string>('');
  const [editName, setEditName] = useState<string>('');
  const [editEmpId, setEditEmpId] = useState<string>('');
  const [editRole, setEditRole] = useState<UserRole>('checked_by');
  const [editDesignation, setEditDesignation] = useState<string>('');
  const [editDepartment, setEditDepartment] = useState<string>('');
  const [editConcernId, setEditConcernId] = useState<string>('');
  const [editPassword, setEditPassword] = useState<string>('');
  const [showEditPassword, setShowEditPassword] = useState<boolean>(false);

  // Password visibility map for the users list
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});

  // Multi-PC Cloud Sync State & Operations
  const [syncConfig, setSyncConfig] = useState<CloudSyncConfig>(getCloudSyncConfig);
  const [isTestingSync, setIsTestingSync] = useState<boolean>(false);
  const [syncTestResult, setSyncTestResult] = useState<{ success: boolean; message: string; backend?: string } | null>(null);
  const [isPushingCloud, setIsPushingCloud] = useState<boolean>(false);
  const [isPullingCloud, setIsPullingCloud] = useState<boolean>(false);

  const handleSaveCloudConfig = (updated: Partial<CloudSyncConfig>) => {
    const res = saveCloudSyncConfig(updated);
    setSyncConfig(res);
    setSuccessMsg('Cloud sync settings successfully saved!');
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const handleTestCloudConnection = async () => {
    setIsTestingSync(true);
    setSyncTestResult(null);
    try {
      const res = await testCloudConnection(syncConfig.firebaseUrl);
      setSyncTestResult(res);
      setSyncConfig(getCloudSyncConfig());
    } catch (e: any) {
      setSyncTestResult({ success: false, message: 'Connection error: ' + e.message });
    } finally {
      setIsTestingSync(false);
    }
  };

  const handlePushAllToCloud = async () => {
    setIsPushingCloud(true);
    try {
      const res = await pushAllLocalSopsToCloud();
      setSuccessMsg(`Success! ${res.count}  local SOPs uploaded to cloud.`);
      setTimeout(() => setSuccessMsg(null), 3500);
      setSyncConfig(getCloudSyncConfig());
    } catch (e: any) {
      alert('Cloud upload failed: ' + e.message);
    } finally {
      setIsPushingCloud(false);
    }
  };

  const handlePullAllFromCloud = async () => {
    setIsPullingCloud(true);
    try {
      const sops = await pullAllSopsFromCloud();
      setSuccessMsg(`Success! ${sops.length}  SOPs and pending approvals synchronized from cloud.`);
      setTimeout(() => setSuccessMsg(null), 3500);
      setSyncConfig(getCloudSyncConfig());
    } catch (e: any) {
      alert('Cloud sync failed: ' + e.message);
    } finally {
      setIsPullingCloud(false);
    }
  };

  const fetchUsers = async () => {
    const list = await getAllUsers();
    setUsers(list);
  };

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      setSyncConfig(getCloudSyncConfig());
      const currentConfig = getGlobalAiConfig();
      setAiConfig(currentConfig);
      if (currentConfig.openRouterKey) {
        handleFetchModels(currentConfig.openRouterKey);
      }
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
            <h3 className="font-bold text-slate-900 text-sm">Access Denied</h3>
            <p className="text-xs text-slate-500 mt-1">
              Access to the administrative control panel is restricted to System Administrators (ID: Sazzad / 50463).
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Close Panel
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

  // AI Configuration Handlers
  const handleFetchModels = async (keyToUse?: string) => {
    setIsFetchingModels(true);
    try {
      const fetched = await fetchFreeOpenRouterModels(keyToUse || aiConfig.openRouterKey);
      setModels(fetched);
    } catch {
      setModels(DEFAULT_FREE_MODELS);
    } finally {
      setIsFetchingModels(false);
    }
  };

  const handleTestAiKey = async () => {
    setIsTestingAi(true);
    setAiTestResult(null);
    try {
      if (aiConfig.activeProvider === 'openrouter') {
        const res = await testOpenRouterKey(aiConfig.openRouterKey);
        setAiTestResult(res);
        if (res.success) {
          handleFetchModels(aiConfig.openRouterKey);
        }
      } else {
        if (!aiConfig.geminiKey.trim()) {
          setAiTestResult({ success: false, message: 'Gemini API Key cannot be empty.' });
        } else {
          setAiTestResult({ success: true, message: '✅ Gemini API Key successfully saved.' });
        }
      }
    } catch (e: any) {
      setAiTestResult({ success: false, message: 'Test failed: ' + e.message });
    } finally {
      setIsTestingAi(false);
    }
  };

  const handleSaveAiConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveGlobalAiConfig(aiConfig);
    showNotification('Central AI engine configuration successfully saved! All plant engineers can now use this AI.');
  };

  // Add User / Approver Handler
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = newUserId.trim();
    const cleanName = newUserName.trim();
    const cleanEmpId = newUserEmpId.trim();

    if (!cleanId || !cleanName) {
      alert('Please provide both User ID and Full Name.');
      return;
    }

    if (users.some((u) => u.id.toLowerCase() === cleanId.toLowerCase() || u.username.toLowerCase() === cleanId.toLowerCase())) {
      alert(`ID "${cleanId}" already exists! Please choose a different ID.`);
      return;
    }

    // Default password to Name@ID or specified password
    const defaultPass = newUserPassword.trim() || `${cleanName.split(' ')[0]}@${cleanEmpId || cleanId}`;
    const selectedConcern = PROCESS_CONCERNS.find((c) => c.id === newUserConcernId);

    const newUser: UserProfile = {
      id: cleanId,
      employeeId: cleanEmpId || undefined,
      username: cleanId,
      name: cleanName,
      role: newUserRole,
      designation: newUserDesignation.trim() || 'Process Engineer',
      department: newUserDepartment.trim() || 'Process Development',
      concernId: newUserConcernId,
      concernName: selectedConcern ? selectedConcern.name : 'General Process',
      passwordHash: defaultPass,
      createdAt: new Date().toISOString(),
    };

    // Optimistic UI update
    setUsers((prev) => [...prev, newUser]);
    setIsAddModalOpen(false);
    setNewUserId('');
    setNewUserEmpId('');
    setNewUserName('');
    setNewUserDesignation('Process Engineer');
    setNewUserDepartment('Process Development');
    setNewUserConcernId('cac_idu');
    setNewUserPassword('');

    const ok = await addUser(newUser);
    if (ok) {
      showNotification(`User "${cleanName}" (${cleanId}) successfully added with password: ${defaultPass}!`);
      await fetchUsers();
    } else {
      alert('Failed to add user.');
      await fetchUsers();
    }
  };

  // Open Edit Dialog
  const handleOpenEdit = (user: UserProfile) => {
    setEditingUser(user);
    setEditUserId(user.id);
    setEditName(user.name);
    setEditEmpId(user.employeeId || '');
    setEditRole(user.role);
    setEditDesignation(user.designation);
    setEditDepartment(user.department);
    setEditConcernId(user.concernId || 'cac_idu');
    setEditPassword(user.passwordHash || `${user.name.split(' ')[0]}@${user.employeeId || user.id}`);
    setShowEditPassword(false);
  };

  // Save Edited User (Including ID, Name, Role, Concern, and Password)
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const cleanNewId = editUserId.trim() || editingUser.id;
    const cleanName = editName.trim() || editingUser.name;
    const cleanEmpId = editEmpId.trim() || undefined;
    const selectedConcern = PROCESS_CONCERNS.find((c) => c.id === editConcernId);
    const cleanPassword = editPassword.trim() || editingUser.passwordHash;

    const updatedUser: UserProfile = {
      ...editingUser,
      id: cleanNewId,
      username: cleanNewId,
      name: cleanName,
      employeeId: cleanEmpId,
      role: editRole,
      designation: editDesignation.trim() || editingUser.designation,
      department: editDepartment.trim() || editingUser.department,
      concernId: editConcernId,
      concernName: selectedConcern ? selectedConcern.name : editingUser.concernName,
      passwordHash: cleanPassword,
    };

    // If ID changed and it's not the original ID, delete old record
    if (cleanNewId !== editingUser.id) {
      await deleteUser(editingUser.id);
    }

    // Optimistic UI update
    setUsers((prev) => prev.map((u) => (u.id === editingUser.id ? updatedUser : u)));
    setEditingUser(null);

    const ok = await updateUserProfile(updatedUser);
    if (ok) {
      showNotification(`"${updatedUser.name}" details, concern & password successfully updated!`);
      await fetchUsers();
    } else {
      alert('Failed to update user details.');
      await fetchUsers();
    }
  };

  // Direct Reset Password to Name@ID Pattern
  const handleResetPasswordToDefault = async (user: UserProfile) => {
    const firstName = user.name.split(' ')[0].replace(/[^a-zA-Z]/g, '') || user.username;
    const defaultPattern = `${firstName}@${user.employeeId || user.id}`;
    const confirmed = window.confirm(
      `Reset password for "${user.name}" to default pattern: "${defaultPattern}"?`
    );
    if (!confirmed) return;

    const updated: UserProfile = {
      ...user,
      passwordHash: defaultPattern,
    };

    setUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)));
    const ok = await updateUserProfile(updated);
    if (ok) {
      showNotification(`Password for ${user.name} reset to: ${defaultPattern}`);
      await fetchUsers();
    } else {
      alert('Failed to reset password.');
    }
  };

  // Delete User / Approver Handler
  const handleDeleteUser = async (user: UserProfile) => {
    if (user.id === 'Admin_Sazzad' || (user.id === 'Sazzad' && user.role === 'admin')) {
      alert('The system Super Admin account cannot be deleted!');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to permanently delete "${user.name}" (ID: ${user.id}, Role: ${user.role})?`
    );
    if (!confirmed) return;

    // Optimistic UI update: card vanishes instantly
    setUsers((prev) => prev.filter((u) => u.id !== user.id));

    const ok = await deleteUser(user.id);
    if (ok) {
      showNotification(`User "${user.name}" successfully deleted.`);
      await fetchUsers();
    } else {
      alert('Failed to delete user.');
      await fetchUsers();
    }
  };

  // Reset Password Handler
  const handleResetPassword = async (userId: string) => {
    if (!newPassword.trim()) {
      alert('Please enter a new password.');
      return;
    }
    const ok = await resetUserPassword(userId, newPassword.trim());
    if (ok) {
      showNotification(`User ${userId} password successfully reset!`);
      setNewPassword('');
      setSelectedUserForReset(null);
      await fetchUsers();
    } else {
      alert('Password reset failed.');
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
        alert(`Backup successfully restored! ${res.sopCount} SOPs recovered.`);
        await fetchUsers();
      } else {
        alert('Invalid backup file format.');
      }
    };
    reader.readAsText(file);
  };

  const handleClearTrialData = async () => {
    const ok = window.confirm(
      'WARNING: Are you sure you want to delete all trial SOP data and analytics history? This will clear all test records and initialize a fresh database.'
    );
    if (!ok) return;

    const res = await clearTrialData();
    showNotification(`Trial data cleared successfully (${res.sopsDeleted} trial records cleared)!`);
  };

  // Filtered Users List
  const filteredUsers = users.filter((u) => {
    const matchesLevel = levelFilter === 'all' || u.role === levelFilter;
    const matchesSearch =
      !searchQuery.trim() ||
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.employeeId && u.employeeId.includes(searchQuery)) ||
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
                  Super Admin: Sazzad (50463)
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Approval Routing Pipeline, Global AI Engine, User Control & Master Backup
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
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('routing')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition cursor-pointer whitespace-nowrap ${
                activeTab === 'routing'
                  ? 'bg-rose-800 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Workflow className="w-3.5 h-3.5" />
              <span>Approval Route Pipeline</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ai')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition cursor-pointer whitespace-nowrap ${
                activeTab === 'ai'
                  ? 'bg-rose-800 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Central AI Engine Settings</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition cursor-pointer whitespace-nowrap ${
                activeTab === 'users'
                  ? 'bg-rose-800 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Users & Passwords ({users.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('sync')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition cursor-pointer whitespace-nowrap ${
                activeTab === 'sync'
                  ? 'bg-rose-800 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Cloud className="w-3.5 h-3.5 text-sky-400" />
              <span>Cloud Sync (Multi-PC)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('backup')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition cursor-pointer whitespace-nowrap ${
                activeTab === 'backup'
                  ? 'bg-rose-800 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Master Backup & Restore</span>
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
                      <span>3-Step Approval Sequence Pipeline</span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      SOP review, verification, and formal clearance are governed across each sequence stage
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-700 hover:bg-rose-600 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>+ Add New Official</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Step 1: Prepared By - Process concern */}
                  <div className="bg-slate-50 border border-emerald-200 rounded-xl p-3.5 relative">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Step 1: Prepared By (Process Concern)
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-500">
                        {preparedByUsers.length} Users
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 mt-2">Process Engineers & Authors</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Drafts SOPs with Banglish conversion, photo annotation, and submits for section review.
                    </p>
                    <div className="mt-2.5 flex flex-wrap gap-1">
                      {preparedByUsers.map((u) => (
                        <span
                          key={u.id}
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-700"
                        >
                          {u.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Step 2: Checked By - Section In charge */}
                  <div className="bg-slate-50 border border-blue-200 rounded-xl p-3.5 relative">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                        Step 2: Reviewed By (Section In-Charge)
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-500">
                        {checkedByUsers.length} Users
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 mt-2">Section In-Charges & Reviewers</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Verifies process & safety accuracy, applies digital review signature, and forwards for approval or revision.
                    </p>
                    <div className="mt-2.5 flex flex-wrap gap-1">
                      {checkedByUsers.map((u) => (
                        <span
                          key={u.id}
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-700"
                        >
                          {u.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Step 3: Approved By - Process HOD */}
                  <div className="bg-slate-50 border border-purple-200 rounded-xl p-3.5 relative">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                        Step 3: Approved By (Process HOD)
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-500">
                        {approvedByUsers.length} Users
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 mt-2">Plant Managers & Process HOD</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Conducts final verification, applies signature seal, and authorizes publication to the official factory archive.
                    </p>
                    <div className="mt-2.5 flex flex-wrap gap-1">
                      {approvedByUsers.map((u) => (
                        <span
                          key={u.id}
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-700"
                        >
                          {u.name}
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
                    <span className="text-xs font-bold text-slate-700">Route Filter:</span>
                    <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs">
                      <button
                        type="button"
                        onClick={() => setLevelFilter('all')}
                        className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                          levelFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        All ({users.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setLevelFilter('prepared_by')}
                        className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                          levelFilter === 'prepared_by' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        1. Process Concern ({preparedByUsers.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setLevelFilter('checked_by')}
                        className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                          levelFilter === 'checked_by' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        2. Section In-Charge ({checkedByUsers.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setLevelFilter('approved_by')}
                        className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                          levelFilter === 'approved_by' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        3. Process HOD ({approvedByUsers.length})
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
                      placeholder="Search by name, designation, or ID..."
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
                                  ID: {u.id}
                                </span>
                              </h4>
                              <p className="text-[11px] text-slate-600 mt-0.5 font-medium">
                                {u.designation}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                {u.department}
                              </p>
                              {/* Concern Section Badge */}
                              <div className="mt-1.5 flex items-center gap-1.5">
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                                  <span>🏢</span>
                                  <span>{u.concernName || 'General Process'}</span>
                                </span>
                              </div>
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
                                ? 'Admin'
                                : u.role === 'approved_by'
                                ? '3. Process HOD'
                                : u.role === 'checked_by'
                                ? '2. Section In-Charge'
                                : '1. Process Concern'}
                            </span>
                          </div>
                        </div>

                        {/* Card Actions: Password, Reset & Edit */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-2.5 mt-2 border-t border-slate-100 text-[11px]">
                          <div className="flex items-center gap-1 font-mono text-[10px]">
                            <span className="text-slate-400 font-semibold">Pass:</span>
                            <span className={showPasswordMap[u.id] ? "font-bold text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200" : "text-slate-400"}>
                              {showPasswordMap[u.id] ? (u.passwordHash || `${u.id}@${u.employeeId}`) : '••••••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() => setShowPasswordMap((prev) => ({ ...prev, [u.id]: !prev[u.id] }))}
                              className="p-1 text-slate-400 hover:text-blue-600 transition cursor-pointer"
                              title={showPasswordMap[u.id] ? 'Hide Password' : 'Show Password'}
                            >
                              {showPasswordMap[u.id] ? <EyeOff className="w-3 h-3 text-blue-600" /> : <Eye className="w-3 h-3" />}
                            </button>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleResetPasswordToDefault(u)}
                              className="px-2 py-0.5 text-[10px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg transition cursor-pointer"
                              title="Reset to Name@ID pattern"
                            >
                              Reset Pass
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenEdit(u)}
                              className="p-1 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                              title="Edit User ID, Password & Route"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {!isSuperAdmin && (
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(u)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                title="Delete User"
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

          {/* TAB 2: CENTRAL GLOBAL AI CONFIGURATION */}
          {activeTab === 'ai' && (
            <div className="space-y-4 max-w-2xl mx-auto py-2">
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Central AI Engine Configuration</h3>
                      <p className="text-xs text-slate-500">
                        Once the API key is saved here, all factory engineers can generate standard Bengali SOPs from Banglish notes.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Admin Notice:</strong> The API key and model configured here apply system-wide across all workstations. Engineers do not need to provide personal keys. Configuration remains active until modified.
                  </div>
                </div>

                <form onSubmit={handleSaveAiConfig} className="space-y-4">
                  {/* Provider Switcher */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Select AI Provider
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setAiConfig((prev) => ({ ...prev, activeProvider: 'openrouter' }))}
                        className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                          aiConfig.activeProvider === 'openrouter'
                            ? 'bg-blue-50 border-blue-500 text-blue-800 shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <Cpu className="w-4 h-4 text-blue-600" />
                        <span>OpenRouter AI (Free & Advanced Models)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAiConfig((prev) => ({ ...prev, activeProvider: 'gemini' }))}
                        className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                          aiConfig.activeProvider === 'gemini'
                            ? 'bg-blue-50 border-blue-500 text-blue-800 shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <Sparkles className="w-4 h-4 text-indigo-600" />
                        <span>Google Gemini AI</span>
                      </button>
                    </div>
                  </div>

                  {/* OpenRouter Section */}
                  {aiConfig.activeProvider === 'openrouter' && (
                    <div className="space-y-3 pt-2">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-bold text-slate-700">OpenRouter API Key *</label>
                          <a
                            href="https://openrouter.ai/keys"
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <span>Get Free Key</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        <div className="relative">
                          <input
                            type={showOrKey ? 'text' : 'password'}
                            value={aiConfig.openRouterKey}
                            onChange={(e) =>
                              setAiConfig((prev) => ({ ...prev, openRouterKey: e.target.value.trim() }))
                            }
                            placeholder="sk-or-v1-xxxxxxxxxxxxxxxxxxxx"
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-mono pr-20"
                          />
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setShowOrKey(!showOrKey)}
                              className="p-1 text-slate-400 hover:text-slate-600"
                            >
                              {showOrKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              type="button"
                              onClick={handleTestAiKey}
                              disabled={isTestingAi || !aiConfig.openRouterKey}
                              className="px-2 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-bold rounded-lg transition cursor-pointer disabled:opacity-50"
                            >
                              {isTestingAi ? 'Testing...' : 'Test Key'}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Model Selector */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-bold text-slate-700">Select Default AI Model</label>
                          <button
                            type="button"
                            onClick={() => handleFetchModels()}
                            disabled={isFetchingModels}
                            className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <RefreshCw className={`w-3 h-3 ${isFetchingModels ? 'animate-spin' : ''}`} />
                            <span>Refresh Models</span>
                          </button>
                        </div>
                        <select
                          value={aiConfig.openRouterModel}
                          onChange={(e) => setAiConfig((prev) => ({ ...prev, openRouterModel: e.target.value }))}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-medium"
                        >
                          {models.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name} {m.isFree ? '(FREE)' : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Gemini Section */}
                  {aiConfig.activeProvider === 'gemini' && (
                    <div className="space-y-3 pt-2">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-bold text-slate-700">Google Gemini API Key *</label>
                          <a
                            href="https://aistudio.google.com/app/apikey"
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <span>Get Free Gemini Key</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        <div className="relative">
                          <input
                            type={showGemKey ? 'text' : 'password'}
                            value={aiConfig.geminiKey}
                            onChange={(e) => setAiConfig((prev) => ({ ...prev, geminiKey: e.target.value.trim() }))}
                            placeholder="AIzaSyxxxxxxxxxxxxxxxxxxxx"
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-mono pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowGemKey(!showGemKey)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            {showGemKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Test Result alert */}
                  {aiTestResult && (
                    <div
                      className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                        aiTestResult.success
                          ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                          : 'bg-rose-50 border border-rose-200 text-rose-800'
                      }`}
                    >
                      {aiTestResult.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      )}
                      <span>{aiTestResult.message}</span>
                    </div>
                  )}

                  <div className="pt-3 border-t border-slate-100 flex justify-end">
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-2 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Save Global AI Configuration</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB 3: USER LIST & PASSWORD RECOVERY */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl p-3.5 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                <span>
                  Total Active Users: <strong>{users.length} Users</strong> (Manage credentials and reset passwords here)
                </span>
                <span className="text-slate-400">Default Password: Process@2026</span>
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
                        {u.role === 'admin'
                          ? 'Admin'
                          : u.role === 'approved_by'
                          ? '3. Process HOD'
                          : u.role === 'checked_by'
                          ? '2. Section In-Charge'
                          : '1. Process Concern'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                      <span className="text-slate-500 font-mono text-[10px]">
                        Password: ••••••••••••
                      </span>

                      <button
                        type="button"
                        onClick={() => setSelectedUserForReset(u)}
                        className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition cursor-pointer"
                      >
                        <KeyRound className="w-3 h-3 text-blue-600" />
                        <span>Reset Password</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: MULTI-PC CLOUD SYNC & REPLICATION */}
          {activeTab === 'sync' && (
            <div className="space-y-5 max-w-3xl mx-auto py-6">
              {/* Status Banner */}
              <div className="bg-gradient-to-r from-slate-900 to-slate-950 rounded-2xl p-5 border border-slate-800 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
                <div className="flex items-center gap-3.5">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    syncConfig.firebaseUrl ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    <CloudLightning className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold tracking-tight">Multi-PC Cloud Replication Engine</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border ${
                        syncConfig.firebaseUrl
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${syncConfig.firebaseUrl ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                        {syncConfig.firebaseUrl ? 'Cloud Sync Active (Online)' : 'Local Mode (Standalone)'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Real-time cross-PC synchronization between Author (Biplob), Reviewer (Sazzad), and Approver (Kamrul Hasan).
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-right">
                  <button
                    type="button"
                    onClick={() => handleSaveCloudConfig({ autoSync: !syncConfig.autoSync })}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                      syncConfig.autoSync
                        ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/40 hover:bg-emerald-600/40'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncConfig.autoSync ? 'animate-spin' : ''}`} />
                    <span>Auto-Sync: {syncConfig.autoSync ? 'Enabled' : 'Disabled'}</span>
                  </button>
                </div>
              </div>

              {/* Database URL & Proxy Settings Card */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <div className="flex items-center gap-2.5">
                    <Database className="w-5 h-5 text-sky-600" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Cloud Database Connection (Google Firebase / Vercel KV)</h4>
                      <p className="text-xs text-slate-500">Configure the cloud database URL to sync SOPs and approvals across all factory workstations.</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">
                    100% Free & Automatic
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-800 mb-1 flex items-center justify-between">
                      <span>Firebase Realtime Database URL (Ultra-fast & 100% Free):</span>
                      <span className="text-[11px] text-slate-400 font-normal">e.g. https://walton-sop-xxx-rtdb.firebaseio.com</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={syncConfig.firebaseUrl}
                        onChange={(e) => setSyncConfig((prev) => ({ ...prev, firebaseUrl: e.target.value }))}
                        placeholder="https://your-project-default-rtdb.firebaseio.com"
                        className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 font-mono focus:outline-none focus:border-sky-600"
                      />
                      <button
                        type="button"
                        onClick={handleTestCloudConnection}
                        disabled={isTestingSync}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-300 text-white rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs whitespace-nowrap"
                      >
                        {isTestingSync ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5 text-sky-400" />}
                        <span>Test Connection</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Vercel Serverless Sync Proxy Endpoint:
                    </label>
                    <input
                      type="text"
                      value={syncConfig.syncEndpoint}
                      onChange={(e) => setSyncConfig((prev) => ({ ...prev, syncEndpoint: e.target.value }))}
                      placeholder="/api/sync"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 font-mono focus:outline-none focus:border-sky-600"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Default value: <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-700">/api/sync</code> (Automatic when hosted on Vercel).
                    </p>
                  </div>

                  {syncTestResult && (
                    <div className={`p-3 rounded-xl border flex items-start gap-2 text-xs animate-in fade-in ${
                      syncTestResult.success
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : 'bg-rose-50 border-rose-300 text-rose-800'
                    }`}>
                      {syncTestResult.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className="font-bold">{syncTestResult.message}</p>
                        {syncTestResult.backend && (
                          <p className="text-[11px] opacity-80 mt-0.5">Connected Backend: {syncTestResult.backend}</p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[11px] text-slate-500">
                      {syncConfig.lastSyncTime ? `Last Sync: ${new Date(syncConfig.lastSyncTime).toLocaleTimeString()}` : 'Not synchronized yet'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSaveCloudConfig(syncConfig)}
                      className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold shadow-xs transition cursor-pointer"
                    >
                      Save Settings
                    </button>
                  </div>
                </div>
              </div>

              {/* Manual One-Click Sync Operations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Upload className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Push Local Data to Cloud</h4>
                      <p className="text-[11px] text-slate-500">Upload all SOPs from this PC to central cloud storage.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handlePushAllToCloud}
                    disabled={isPushingCloud}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
                  >
                    {isPushingCloud ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    <span>Push All to Cloud Now</span>
                  </button>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Download className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Pull All Data from Cloud</h4>
                      <p className="text-[11px] text-slate-500">Download all pending approvals and SOPs from other PCs.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handlePullAllFromCloud}
                    disabled={isPullingCloud}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
                  >
                    {isPullingCloud ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                    <span>Pull & Sync from Cloud</span>
                  </button>
                </div>
              </div>

              {/* Step-by-Step Quick Guide Card */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 text-xs space-y-3 text-slate-700">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <Globe className="w-4 h-4 text-sky-600" />
                  <span>How to set up a free cloud database in 1 minute (Quick Guide)</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px]">
                  <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                    <span className="font-bold text-sky-600">1. Create Firebase:</span>
                    <p className="text-slate-600">
                      <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="text-blue-600 underline">console.firebase.google.com</a>  and create a free project.
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                    <span className="font-bold text-sky-600">2. Realtime Database:</span>
                    <p className="text-slate-600">
                      "Build" &gt; "Realtime Database" &gt; "Create Database"  and set Rules to <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[10px]">read: true, write: true</code> .
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                    <span className="font-bold text-sky-600">3. Paste URL:</span>
                    <p className="text-slate-600">
                      Copy your database URL, paste it here, and click "Save Settings". All factory workstations will sync immediately!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: MASTER BACKUP & RESTORE */}
          {activeTab === 'backup' && (
            <div className="space-y-4 max-w-xl mx-auto py-6">
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Master Database Backup (Export JSON)</h3>
                    <p className="text-xs text-slate-500">
                      Export all system users, credentials, global AI keys, and archived SOP documents into a portable JSON backup file.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Master Backup (JSON)</span>
                </button>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Restore Database from Backup</h3>
                    <p className="text-xs text-slate-500">
                      Select a previously exported master backup JSON file to restore the database.
                    </p>
                  </div>
                </div>

                <label className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer">
                  <Upload className="w-4 h-4" />
                  <span>Select JSON Backup File</span>
                  <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
                </label>
              </div>

              {/* Reset Trial Data & Analytics Card */}
              <div className="bg-rose-50/70 rounded-2xl p-6 border border-rose-200 shadow-xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-rose-950">Trial Data & Test History Cleanup (Reset Trial Data)</h3>
                    <p className="text-xs text-rose-700">
                      Clear all trial SOPs and testing records created during system verification to initialize a clean production database.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleClearTrialData}
                  className="w-full py-2.5 bg-rose-700 hover:bg-rose-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Purge All Trial Data & Reset Analytics</span>
                </button>
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
                  <span>+ Add New Official</span>
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
                    User ID / Username (Login ID) *
                  </label>
                  <input
                    type="text"
                    value={newUserId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewUserId(val);
                      if (!newUserPassword || newUserPassword.includes('@')) {
                        setNewUserPassword(`${val.split(' ')[0]}@${newUserEmpId || '12345'}`);
                      }
                    }}
                    placeholder="e.g. Tanvir, Shanto"
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-rose-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Employee ID (Walton ID)
                  </label>
                  <input
                    type="text"
                    value={newUserEmpId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewUserEmpId(val);
                      if (!newUserPassword || newUserPassword.includes('@')) {
                        setNewUserPassword(`${newUserId || 'User'}@${val || '12345'}`);
                      }
                    }}
                    placeholder="e.g. 54634, 67544"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-rose-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="e.g. Tanvir Ahmed"
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-rose-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Primary Concern / Section *
                  </label>
                  <select
                    value={newUserConcernId}
                    onChange={(e) => setNewUserConcernId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-rose-600 font-semibold"
                  >
                    {PROCESS_CONCERNS.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.icon} {c.name} ({c.code})
                      </option>
                    ))}
                    <option value="all">🌐 All Sections (Plant-Wide / Lead Authority)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Approval Route Role / Sequence *
                  </label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-rose-600 font-semibold"
                  >
                    <option value="prepared_by">Step 1: Prepared By (Process Concern)</option>
                    <option value="checked_by">Step 2: Reviewed By (Section In-Charge)</option>
                    <option value="approved_by">Step 3: Final Approved By (Process HOD)</option>
                    <option value="admin">Super Admin (System Administrator)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Designation
                    </label>
                    <input
                      type="text"
                      value={newUserDesignation}
                      onChange={(e) => setNewUserDesignation(e.target.value)}
                      placeholder="e.g. Process Engineer"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-rose-600"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Department
                    </label>
                    <input
                      type="text"
                      value={newUserDepartment}
                      onChange={(e) => setNewUserDepartment(e.target.value)}
                      placeholder="Process Development"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-rose-600"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-slate-700">
                      Password (Pattern: Name@ID) *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const namePart = (newUserId || newUserName || 'User').split(' ')[0];
                        setNewUserPassword(`${namePart}@${newUserEmpId || '12345'}`);
                      }}
                      className="text-[10px] text-rose-700 font-bold hover:underline cursor-pointer"
                    >
                      Generate Name@ID
                    </button>
                  </div>
                  <input
                    type="text"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    placeholder="e.g. Tanvir@54634"
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-rose-600 font-mono"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-bold shadow-xs transition cursor-pointer"
                  >
                    Add User
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
                  <span>Edit User Profile & Credentials</span>
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
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      User ID (Login Identifier) *
                    </label>
                    <input
                      type="text"
                      value={editUserId}
                      onChange={(e) => setEditUserId(e.target.value)}
                      required
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Employee ID (Walton ID)
                    </label>
                    <input
                      type="text"
                      value={editEmpId}
                      onChange={(e) => setEditEmpId(e.target.value)}
                      placeholder="e.g. 54634, 67544"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Full Name *
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
                    Assigned Concern / Section *
                  </label>
                  <select
                    value={editConcernId}
                    onChange={(e) => setEditConcernId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600 font-semibold"
                  >
                    {PROCESS_CONCERNS.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.icon} {c.name} ({c.code})
                      </option>
                    ))}
                    <option value="all">🌐 All Sections (Plant-Wide / Lead Authority)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Approval Route Role / Sequence *
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as UserRole)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600 font-semibold"
                  >
                    <option value="prepared_by">Step 1: Prepared By (Process Concern)</option>
                    <option value="checked_by">Step 2: Reviewed By (Section In-Charge)</option>
                    <option value="approved_by">Step 3: Final Approved By (Process HOD)</option>
                    <option value="admin">Super Admin (System Administrator)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Designation
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
                      Department
                    </label>
                    <input
                      type="text"
                      value={editDepartment}
                      onChange={(e) => setEditDepartment(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                {/* Password Change Field */}
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800 flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                      <span>Account Password (Name@ID Pattern)</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const firstName = (editName || editUserId || 'User').split(' ')[0].replace(/[^a-zA-Z]/g, '');
                        setEditPassword(`${firstName}@${editEmpId || editUserId}`);
                      }}
                      className="text-[10.5px] text-blue-600 font-bold hover:underline cursor-pointer"
                    >
                      Set to Name@ID
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showEditPassword ? 'text' : 'password'}
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      placeholder="e.g. Sazzad@50463"
                      required
                      className="w-full bg-white border border-slate-300 rounded-xl pl-3 pr-10 py-2 text-slate-900 focus:outline-none focus:border-blue-600 font-mono text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowEditPassword(!showEditPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                      title={showEditPassword ? 'Hide password' : 'Show password'}
                    >
                      {showEditPassword ? <EyeOff className="w-3.5 h-3.5 text-blue-600" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Engineers will use this exact password to log into their dedicated section workspace.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-xs transition cursor-pointer"
                  >
                    Save Changes
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
                  <span>Reset Password: {selectedUserForReset.name}</span>
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
                  Enter New Password:
                </label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="e.g. Process@2026 or new password"
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
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleResetPassword(selectedUserForReset.id)}
                  disabled={!newPassword.trim()}
                  className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                >
                  Update Password
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
