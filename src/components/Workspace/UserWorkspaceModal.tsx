import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { UserProfile } from '../../types/auth';
import type { SOPDocument } from '../../types/sop';
import { getAllSOPs, deleteSOP, saveSOP } from '../../services/storageService';
import {
  FileText,
  Trash2,
  Copy,
  ExternalLink,
  Plus,
  Search,
  FolderArchive,
  User,
  X,
  Inbox,
} from 'lucide-react';

interface UserWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onSelectSop: (sop: SOPDocument) => void;
  onNewSop: () => void;
  onOpenLogin: () => void;
}

export const UserWorkspaceModal: React.FC<UserWorkspaceModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSelectSop,
  onNewSop,
  onOpenLogin,
}) => {
  const [activeTab, setActiveTab] = useState<'my_sops' | 'pending_queue'>('my_sops');
  const [allDocs, setAllDocs] = useState<SOPDocument[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const list = await getAllSOPs();
      setAllDocs(list);
    } catch (e) {
      console.warn('Failed to load SOPs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDocs();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  if (!currentUser) {
    return createPortal(
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in">
        <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 mx-auto flex items-center justify-center">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">লগইন প্রয়োজন</h3>
            <p className="text-xs text-slate-500 mt-1">
              আপনার পার্সোনাল ওয়ার্কস্পেস এবং সংরক্ষিত SOP তালিকা দেখতে প্রথমে লগইন করুন।
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-xl border border-slate-300 text-slate-600 text-xs font-semibold"
            >
              বাতিল
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenLogin();
              }}
              className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-xs"
            >
              লগইন করুন
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  // Filter My SOPs: Created by this user OR (if admin, all)
  const mySops = allDocs.filter((doc) => {
    if (currentUser.role === 'admin') return true;
    return (
      doc.authorId === currentUser.id ||
      doc.authorName === currentUser.name ||
      doc.header.preparedBy.name.toLowerCase().includes(currentUser.name.toLowerCase())
    );
  });

  // Filter Pending Queue for this user:
  // If user is Admin: all pending docs
  // If user is Checked By: docs with status 'forwarded_to_checker' and assigned to them (or all if not assigned)
  // If user is Approved By (Kamrul): docs with status 'forwarded_to_approver'
  const pendingQueue = allDocs.filter((doc) => {
    if (currentUser.role === 'admin') {
      return doc.status === 'forwarded_to_checker' || doc.status === 'forwarded_to_approver';
    }
    if (currentUser.role === 'checked_by') {
      return (
        doc.status === 'forwarded_to_checker' &&
        (!doc.checkedById || doc.checkedById === currentUser.id)
      );
    }
    if (currentUser.role === 'approved_by') {
      return doc.status === 'forwarded_to_approver';
    }
    return false;
  });

  const displayedList = activeTab === 'my_sops' ? mySops : pendingQueue;

  const filteredList = displayedList.filter((doc) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      doc.header.processName.toLowerCase().includes(term) ||
      doc.header.model.toLowerCase().includes(term) ||
      doc.header.stationLine.toLowerCase().includes(term) ||
      (doc.authorName || '').toLowerCase().includes(term)
    );
  });

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`আপনি কি "${name || 'এই SOP'}" টি চিরতরে ডিলিট করতে চান?`)) {
      await deleteSOP(id);
      await fetchDocs();
    }
  };

  const handleDuplicate = async (doc: SOPDocument) => {
    const copy: SOPDocument = {
      ...doc,
      id: undefined,
      status: 'draft',
      createdAt: undefined,
      updatedAt: undefined,
      header: {
        ...doc.header,
        processName: `${doc.header.processName} (কপি)`,
      },
    };
    await saveSOP(copy, currentUser, 'SOP ডুপ্লিকেট করা হয়েছে');
    await fetchDocs();
    alert('SOP সফলভাবে কপি করা হয়েছে!');
  };

  const getStatusPill = (status?: string) => {
    switch (status) {
      case 'approved':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">অনুমোদিত</span>;
      case 'forwarded_to_approver':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">অনুমোদনে মুলতবি</span>;
      case 'forwarded_to_checker':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">পর্যালোচনাধীন</span>;
      case 'rejected':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">সংশোধনে ফেরত</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">খসড়া</span>;
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Workspace Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-300 font-bold">
              {currentUser.username.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-100">{currentUser.name}</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {currentUser.role.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {currentUser.designation} • {currentUser.department}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onNewSop();
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>নতুন SOP তৈরি করুন</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs & Search Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('my_sops')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                activeTab === 'my_sops'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <FolderArchive className="w-3.5 h-3.5" />
              <span>আমার সংরক্ষিত SOP সমূহ ({mySops.length})</span>
            </button>

            {(currentUser.role === 'checked_by' || currentUser.role === 'approved_by' || currentUser.role === 'admin') && (
              <button
                type="button"
                onClick={() => setActiveTab('pending_queue')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                  activeTab === 'pending_queue'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                <Inbox className="w-3.5 h-3.5" />
                <span>মুলতবি তালিকা (Queue: {pendingQueue.length})</span>
              </button>
            )}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="প্রসেস বা মডেল দিয়ে খুঁজুন..."
              className="w-full bg-white border border-slate-300 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-slate-100/60">
          {loading ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              লোড হচ্ছে...
            </div>
          ) : filteredList.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300 p-8 space-y-2">
              <FileText className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-700">কোনো SOP পাওয়া যায়নি</h4>
              <p className="text-xs text-slate-400">
                {activeTab === 'my_sops'
                  ? 'আপনার কোনো সংরক্ষিত SOP নেই। উপরে "+ নতুন SOP তৈরি করুন" বাটনে ক্লিক করে শুরু করুন।'
                  : 'বর্তমানে আপনার পর্যালোচনার অপেক্ষায় কোনো কাজ নেই।'}
              </p>
            </div>
          ) : (
            filteredList.map((doc) => (
              <div
                key={doc.id}
                className="bg-white border border-slate-200 hover:border-blue-300 rounded-xl p-3.5 shadow-xs hover:shadow-md transition flex items-center justify-between gap-4"
              >
                {/* Left Info */}
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200">
                    <FileText className="w-5 h-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h4 className="font-bold text-slate-900 text-xs truncate">
                        {doc.header.processName || 'Untitled Process'}
                      </h4>
                      {getStatusPill(doc.status)}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500 flex-wrap">
                      <span>মডেল: <strong className="text-slate-700">{doc.header.model || '-'}</strong></span>
                      <span>•</span>
                      <span>স্টেশন: <strong className="text-slate-700">{doc.header.stationLine || '-'}</strong></span>
                      <span>•</span>
                      <span>ছবি: <strong>{doc.photos.length}টি</strong></span>
                      <span>•</span>
                      <span>তারিখ: {doc.updatedAt ? new Date(doc.updatedAt).toLocaleDateString() : '-'}</span>
                    </div>

                    {doc.rejectionReason && (
                      <div className="mt-1 text-[11px] text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 inline-block">
                        সংশোধন নোট: {doc.rejectionReason}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectSop(doc);
                      onClose();
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
                    title="এই SOP এডিটরে লোড করুন"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>ওপেন</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDuplicate(doc)}
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                    title="ডুপ্লিকেট / কপি তৈরি করুন"
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(doc.id!, doc.header.processName)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                    title="আর্কাইভ থেকে ডিলিট করুন"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
