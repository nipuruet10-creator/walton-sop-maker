import React, { useState, useEffect } from 'react';
import type { SOPDocument } from '../../types/sop';
import type { UserProfile } from '../../types/auth';
import { getAllSOPs, forwardToApprover, approveSOP, rejectSOP } from '../../services/storageService';
import {
  Clock,
  Search,
  ShieldCheck,
  Check,
  X,
  Eye,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ApprovalRouteViewProps {
  currentUser: UserProfile | null;
  onOpenSopInEditor: (sop: SOPDocument) => void;
  onOpenLogin: () => void;
}

export const ApprovalRouteView: React.FC<ApprovalRouteViewProps> = ({
  currentUser,
  onOpenSopInEditor,
  onOpenLogin,
}) => {
  const [sops, setSops] = useState<SOPDocument[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'pending' | 'completed' | 'all'>('pending');
  const [isProcessingId, setIsProcessingId] = useState<string | null>(null);

  const loadSops = async () => {
    try {
      const all = await getAllSOPs(true);
      setSops(all);
    } catch (e) {
      console.warn('Error loading approval SOPs:', e);
    }
  };

  useEffect(() => {
    loadSops();
    const interval = setInterval(loadSops, 4000);
    return () => clearInterval(interval);
  }, []);

  const pendingSops = sops.filter(
    (s) =>
      s.status === 'forwarded_to_checker' ||
      s.status === 'checked' ||
      s.status === 'forwarded_to_approver'
  );
  const completedSops = sops.filter((s) => s.status === 'approved');

  const displayedList = (activeTab === 'pending'
    ? pendingSops
    : activeTab === 'completed'
    ? completedSops
    : sops
  ).filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.header?.processName?.toLowerCase().includes(q) ||
      s.header?.referenceNo?.toLowerCase().includes(q) ||
      s.header?.stationLine?.toLowerCase().includes(q) ||
      (s.authorName || '').toLowerCase().includes(q)
    );
  });

  const handleForwardToHod = async (sop: SOPDocument) => {
    if (!currentUser) {
      onOpenLogin();
      return;
    }
    setIsProcessingId(sop.id || 'fwd');
    try {
      await forwardToApprover(sop, currentUser, undefined, 'Verified and forwarded to HOD (Kamrul)');
      await loadSops();
      alert(`SOP "${sop.header.processName}" successfully verified and forwarded to HOD (Kamrul)!`);
    } catch (e: any) {
      alert('Error forwarding to HOD: ' + e.message);
    } finally {
      setIsProcessingId(null);
    }
  };

  const handleApproveOfficial = async (sop: SOPDocument) => {
    if (!currentUser) {
      onOpenLogin();
      return;
    }
    if (currentUser.role !== 'approved_by' && currentUser.role !== 'admin') {
      alert('Final approval authority is restricted to Process HOD (Kamrul) or System Admin.');
      return;
    }
    const confirmed = window.confirm(
      `Officially approve and lock "${sop.header.processName}"? Once approved, the SOP is published to the Master Archive and editing is locked.`
    );
    if (!confirmed) return;

    setIsProcessingId(sop.id || 'appr');
    try {
      await approveSOP(sop, currentUser);
      await loadSops();
      try {
        confetti({ particleCount: 70, spread: 80, origin: { y: 0.7 } });
      } catch {}
      alert(`SOP "${sop.header.processName}" officially approved and published to factory archive!`);
    } catch (e: any) {
      alert('Error approving SOP: ' + e.message);
    } finally {
      setIsProcessingId(null);
    }
  };

  const handleReject = async (sop: SOPDocument) => {
    if (!currentUser) {
      onOpenLogin();
      return;
    }
    const reason = window.prompt('Please provide the revision requirement / reason for rejection:');
    if (!reason) return;

    setIsProcessingId(sop.id || 'rej');
    try {
      await rejectSOP(sop, currentUser, reason);
      await loadSops();
      alert(`SOP returned to engineer for revision.`);
    } catch (e: any) {
      alert('Error rejecting SOP: ' + e.message);
    } finally {
      setIsProcessingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-[1920px] mx-auto pb-12">
      {/* 1. HEADER BANNER */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center text-2xl shrink-0 shadow-xs">
            📬
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                CLEARANCE WORKFLOW
              </span>
              <span className="text-xs text-slate-400">&bull;</span>
              <span className="text-xs text-slate-500 font-medium">Multi-Level Approval Pipeline</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
              SOP Approval Route Pipeline
            </h2>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by process, ref no, author..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* 2. THREE-STAGE WORKFLOW PIPELINE CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Stage 1 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200">
              STAGE 1: DRAFT
            </span>
            <span className="text-xs font-mono font-bold text-slate-500">
              {sops.filter((s) => !s.status || s.status === 'draft').length} Documents
            </span>
          </div>
          <h4 className="text-xs font-bold text-slate-900 mt-2">Prepared By: Process Concern</h4>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Initial SOP authoring, photos, tools, and Banglish-to-Bengali procedure drafting.
          </p>
        </div>

        {/* Stage 2 */}
        <div className="bg-white border border-amber-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
              STAGE 2: REVIEW
            </span>
            <span className="text-xs font-mono font-bold text-amber-700">
              {sops.filter((s) => s.status === 'forwarded_to_checker').length} Pending
            </span>
          </div>
          <h4 className="text-xs font-bold text-slate-900 mt-2">Checked By: Section In-Charge</h4>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Process accuracy check, technical verification, and digital sign-off.
          </p>
        </div>

        {/* Stage 3 */}
        <div className="bg-white border border-emerald-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
              STAGE 3: CLEARANCE
            </span>
            <span className="text-xs font-mono font-bold text-emerald-700">
              {sops.filter((s) => s.status === 'forwarded_to_approver').length} Awaiting HOD
            </span>
          </div>
          <h4 className="text-xs font-bold text-slate-900 mt-2">Approved By: Process HOD (Kamrul)</h4>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Final compliance sign-off, official publication, and lock for factory deployment.
          </p>
        </div>
      </div>

      {/* 3. TABS & SOPS LIST */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-4">
        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Pending Clearance ({pendingSops.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('completed')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'completed'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Approved Archive ({completedSops.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Route History ({sops.length})
          </button>
        </div>

        {/* List of SOPs */}
        {displayedList.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <Clock className="w-10 h-10 mx-auto text-slate-300" />
            <div className="text-sm font-bold text-slate-600">No SOPs found in this queue</div>
            <p className="text-xs text-slate-400">All submissions have been cleared or no drafts matched.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayedList.map((sop) => {
              const isPendingChecker = sop.status === 'forwarded_to_checker';
              const isPendingApprover = sop.status === 'forwarded_to_approver';
              const isApproved = sop.status === 'approved';

              const canCheck =
                currentUser &&
                (currentUser.role === 'checked_by' || currentUser.role === 'admin') &&
                isPendingChecker;

              const canApprove =
                currentUser &&
                (currentUser.role === 'approved_by' || currentUser.role === 'admin') &&
                isPendingApprover;

              return (
                <div
                  key={sop.id}
                  className="bg-slate-50/70 border border-slate-200 hover:border-blue-300 rounded-2xl p-4 transition shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                        {sop.header?.referenceNo || 'REF-UNASSIGNED'}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isApproved
                            ? 'bg-emerald-100 text-emerald-800'
                            : isPendingApprover
                            ? 'bg-purple-100 text-purple-800'
                            : isPendingChecker
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {isApproved
                          ? 'Approved & Locked'
                          : isPendingApprover
                          ? 'Awaiting HOD Final Approval'
                          : isPendingChecker
                          ? 'Awaiting Section In-Charge Review'
                          : 'Draft'}
                      </span>
                    </div>

                    <h4
                      onClick={() => onOpenSopInEditor(sop)}
                      className="text-sm font-bold text-slate-900 cursor-pointer hover:text-blue-600 transition"
                    >
                      {sop.header?.processName || 'Untitled Process'}
                    </h4>

                    <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-3">
                      <span>Model: <strong className="text-slate-700">{sop.header?.model || 'N/A'}</strong></span>
                      <span>&bull;</span>
                      <span>Station: <strong className="text-slate-700">{sop.header?.stationLine || 'Line'}</strong></span>
                      <span>&bull;</span>
                      <span>Prepared By: <strong className="text-slate-700">{sop.header?.preparedBy?.name || 'Engineer'}</strong></span>
                    </div>
                  </div>

                  {/* Action Controls */}
                  <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
                    <button
                      type="button"
                      onClick={() => onOpenSopInEditor(sop)}
                      className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-600" />
                      <span>{isApproved ? 'View Canvas' : 'Inspect'}</span>
                    </button>

                    {/* Section In-Charge Review Action */}
                    {canCheck && (
                      <button
                        type="button"
                        onClick={() => handleForwardToHod(sop)}
                        disabled={isProcessingId === sop.id}
                        className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Verify &amp; Forward to HOD</span>
                      </button>
                    )}

                    {/* HOD Final Approval Action */}
                    {canApprove && (
                      <button
                        type="button"
                        onClick={() => handleApproveOfficial(sop)}
                        disabled={isProcessingId === sop.id}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Authorize &amp; Lock SOP</span>
                      </button>
                    )}

                    {/* Reject / Request Revision Action */}
                    {(canCheck || canApprove) && (
                      <button
                        type="button"
                        onClick={() => handleReject(sop)}
                        disabled={isProcessingId === sop.id}
                        className="p-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Request Revision"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
