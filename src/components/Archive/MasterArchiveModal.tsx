import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { UserProfile } from '../../types/auth';
import type { SOPDocument } from '../../types/sop';
import { getAllSOPs, deleteSOP, saveSOP, exportDatabaseBackup } from '../../services/storageService';
import { exportSOPToExcel } from '../../services/excelExporter';
import { downloadSOPAsPdf } from '../../services/pdfExporter';
import {
  FolderArchive,
  Search,
  FileDown,
  FileSpreadsheet,
  ExternalLink,
  Trash2,
  Copy,
  CheckCircle2,
  Clock,
  Send,
  RotateCcw,
  ShieldCheck,
  X,
  HardDrive,
  Download,
  Users,
} from 'lucide-react';

interface MasterArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onSelectSop: (sop: SOPDocument) => void;
  initialTab?: 'all_archive' | 'concern_section';
}

export const MasterArchiveModal: React.FC<MasterArchiveModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSelectSop,
  initialTab = 'all_archive',
}) => {
  const [activeTab, setActiveTab] = useState<'all_archive' | 'concern_section'>(initialTab);
  const [allDocs, setAllDocs] = useState<SOPDocument[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedAuthor, setSelectedAuthor] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const list = await getAllSOPs();
      setAllDocs(list);
    } catch (e) {
      console.warn('Failed to load SOP archive:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDocs();
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  // Filter list based on Role & Approval Path
  const visibleDocs = allDocs.filter((doc) => {
    if (!currentUser) return doc.status === 'approved';
    if (currentUser.role === 'admin') return true;

    // Check if in approval path
    const isAuthor = doc.authorId === currentUser.id || doc.authorName?.toLowerCase().includes(currentUser.username.toLowerCase());
    const isChecker = doc.checkedById === currentUser.id || (doc.status === 'forwarded_to_checker' && currentUser.role === 'checked_by');
    const isApprover = doc.approvedById === currentUser.id || (doc.status === 'forwarded_to_approver' && currentUser.role === 'approved_by');
    const isApproved = doc.status === 'approved';

    return isAuthor || isChecker || isApprover || isApproved;
  });

  // Extract list of all unique Prepared By authors
  const uniqueAuthors = Array.from(
    new Set(
      allDocs
        .map((d) => d.authorName || d.header.preparedBy.name)
        .filter(Boolean)
    )
  );

  // Apply tab, author filter, status filter, search query
  const filteredDocs = visibleDocs.filter((doc) => {
    if (activeTab === 'concern_section' && doc.status !== 'approved') {
      return false;
    }

    if (selectedStatus !== 'all' && doc.status !== selectedStatus) {
      return false;
    }

    if (selectedAuthor !== 'all') {
      const author = (doc.authorName || doc.header.preparedBy.name || '').toLowerCase();
      if (!author.includes(selectedAuthor.toLowerCase())) {
        return false;
      }
    }

    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      doc.header.processName.toLowerCase().includes(term) ||
      doc.header.model.toLowerCase().includes(term) ||
      doc.header.stationLine.toLowerCase().includes(term) ||
      doc.header.referenceNo.toLowerCase().includes(term) ||
      (doc.authorName || '').toLowerCase().includes(term)
    );
  });

  // Actions
  const handleOpenSop = (doc: SOPDocument) => {
    onSelectSop(doc);
    onClose();
  };

  const handleDownloadPdf = async (sop: SOPDocument) => {
    setDownloadingId(sop.id || 'temp');
    try {
      await downloadSOPAsPdf('sop-paper', sop.header.processName);
    } catch (e: any) {
      alert('PDF generation error: ' + (e.message || 'Unknown error'));
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownloadExcel = (sop: SOPDocument) => {
    try {
      exportSOPToExcel(sop);
    } catch (e: any) {
      alert('Excel export error: ' + (e.message || 'Unknown error'));
    }
  };

  const handleDuplicate = async (doc: SOPDocument) => {
    if (!currentUser) return;
    const copy: SOPDocument = {
      ...doc,
      id: undefined,
      status: 'draft',
      authorId: currentUser.id,
      authorName: currentUser.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      header: {
        ...doc.header,
        processName: `${doc.header.processName} (Copy)`,
      },
    };
    await saveSOP(copy, currentUser, 'ডুপ্লিকেট কপি তৈরি করা হয়েছে');
    await fetchDocs();
    alert('SOP সফলভাবে কপি করা হয়েছে!');
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`আপনি কি নিশ্চিতভাবে "${name || 'এই SOP'}" টি চিরতরে মুছে ফেলতে চান?`)) {
      await deleteSOP(id);
      await fetchDocs();
    }
  };

  const handleDownloadMasterBackup = async () => {
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

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>চূড়ান্ত অনুমোদিত</span>
          </span>
        );
      case 'forwarded_to_approver':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-300 flex items-center gap-1">
            <Clock className="w-3 h-3 text-purple-600" />
            <span>অনুমোদনে মুলতবি (Process HOD)</span>
          </span>
        );
      case 'forwarded_to_checker':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300 flex items-center gap-1">
            <Send className="w-3 h-3 text-blue-600" />
            <span>পর্যালোচনাধীন (Section In charge)</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
            <RotateCcw className="w-3 h-3 text-rose-600" />
            <span>সংশোধনে ফেরত</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
            খসড়া (Draft)
          </span>
        );
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 w-full max-w-6xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-800">
        {/* Archive Top Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300 shadow-inner">
              <FolderArchive className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight">Walton Master SOP Archive & Concern Section</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Total: {allDocs.length} SOPs
                </span>
              </div>
              <p className="text-xs text-slate-400">
                কেন্দ্রীয় এসওপি আর্কাইভ, প্রস্তুতকারী অনুযায়ী ফিল্টারিং এবং স্থায়ী ক্লাউড ব্যাকআপ
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

        {/* Persistence & Backup Reassurance Notice */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <HardDrive className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>স্থায়ী স্টোরেজ সক্রিয়:</strong> আপনার সমস্ত SOP ব্রাউজারের উচ্চ-ধারণক্ষমতার IndexedDB-তে স্থায়ীভাবে সংরক্ষিত থাকে।
            </span>
          </div>

          <button
            type="button"
            onClick={handleDownloadMasterBackup}
            className="flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>মাস্টার ব্যাকআপ (JSON) ডাউনলোড</span>
          </button>
        </div>

        {/* Tabs & Search Filter Controls */}
        <div className="p-4 bg-white border-b border-slate-200 space-y-3 shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Main Tabs */}
            <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('all_archive')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  activeTab === 'all_archive'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FolderArchive className="w-3.5 h-3.5" />
                <span>মাস্টার আর্কাইভ ({allDocs.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('concern_section')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  activeTab === 'concern_section'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>কনসার্ন সেকশন ({allDocs.filter((d) => d.status === 'approved').length})</span>
              </button>
            </div>

            {/* Live Search */}
            <div className="relative min-w-[280px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="প্রসেস নাম, মডেল, লাইন বা আইডি দিয়ে খুঁজুন..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          {/* Grouping / Filter by "Prepared by" (Prepare by er name wise) */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="font-bold text-slate-700 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>প্রস্তুতকারী ফিল্টার:</span>
            </span>

            <div className="flex flex-wrap items-center gap-1">
              <button
                type="button"
                onClick={() => setSelectedAuthor('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  selectedAuthor === 'all'
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                সকল প্রস্তুতকারী
              </button>

              {uniqueAuthors.map((author) => (
                <button
                  key={author}
                  type="button"
                  onClick={() => setSelectedAuthor(author)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    selectedAuthor === author
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {author}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            {activeTab === 'all_archive' && (
              <div className="ml-auto flex items-center gap-1.5">
                <span className="text-slate-500 font-medium">স্ট্যাটাস:</span>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 focus:outline-none"
                >
                  <option value="all">সকল স্ট্যাটাস</option>
                  <option value="draft">খসড়া (Draft)</option>
                  <option value="forwarded_to_checker">পর্যালোচনাধীন (Section In charge)</option>
                  <option value="forwarded_to_approver">অনুমোদনে মুলতবি (Process HOD)</option>
                  <option value="approved">চূড়ান্ত অনুমোদিত</option>
                  <option value="rejected">সংশোধনে ফেরত</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* SOP Documents List */}
        <div className="flex-1 overflow-y-auto p-5 bg-slate-100/70 space-y-3">
          {loading ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              লোড হচ্ছে... অনুগ্রহ করে অপেক্ষা করুন।
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-300 space-y-3">
              <FolderArchive className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-700 text-sm">কোনো SOP পাওয়া যায়নি</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {activeTab === 'concern_section'
                  ? 'এখনও কোনো SOP চূড়ান্তভাবে অনুমোদিত হয়নি। কামরুল হাসান (Process HOD) অনুমোদন করলে তা এখানে চলে আসবে।'
                  : 'বর্তমান ফিল্টারের আওতায় কোনো সংরক্ষিত SOP পাওয়া যায়নি।'}
              </p>
            </div>
          ) : (
            filteredDocs.map((doc) => {
              const canDelete = currentUser?.role === 'admin' || doc.authorId === currentUser?.id;
              return (
                <div
                  key={doc.id}
                  className="bg-white border border-slate-200 hover:border-blue-300 rounded-2xl p-4 shadow-xs transition space-y-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1 max-w-2xl">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-slate-900 leading-snug">
                          {doc.header.processName || 'Untitled Process'}
                        </h3>
                        {getStatusBadge(doc.status)}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span>মডেল: <strong>{doc.header.model || 'N/A'}</strong></span>
                        <span>•</span>
                        <span>লাইন: <strong>{doc.header.stationLine || 'N/A'}</strong></span>
                        <span>•</span>
                        <span>রেফারেন্স: <strong className="font-mono">{doc.header.referenceNo || 'N/A'}</strong></span>
                        <span>•</span>
                        <span>ছবি: <strong>{doc.photos.length} টি</strong></span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenSop(doc)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
                        title="এই SOP ক্যানভাসে ওপেন করুন"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>ওপেন</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownloadPdf(doc)}
                        disabled={downloadingId === doc.id}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                        title="PDF ডাউনলোড করুন"
                      >
                        <FileDown className="w-3.5 h-3.5 text-blue-600" />
                        <span>{downloadingId === doc.id ? 'তৈরি...' : 'PDF'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownloadExcel(doc)}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
                        title="Excel ডাউনলোড করুন"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Excel</span>
                      </button>

                      {currentUser && (
                        <button
                          type="button"
                          onClick={() => handleDuplicate(doc)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                          title="কপি তৈরি করুন"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      )}

                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => handleDelete(doc.id!, doc.header.processName)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Metadata Footer */}
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-400">
                    <div className="flex items-center gap-3">
                      <span>
                        প্রস্তুতকারী (Process concern): <strong className="text-slate-700">{doc.authorName || doc.header.preparedBy.name || 'N/A'}</strong>
                      </span>
                      {doc.checkedByName && (
                        <span>
                          পর্যালোচক (Section In charge): <strong className="text-slate-700">{doc.checkedByName}</strong>
                        </span>
                      )}
                      {doc.approvedByName && (
                        <span>
                          অনুমোদনকারী (Process HOD): <strong className="text-slate-700">{doc.approvedByName}</strong>
                        </span>
                      )}
                    </div>

                    <span>
                      সর্বশেষ আপডেট: {new Date(doc.updatedAt || doc.createdAt || '').toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
