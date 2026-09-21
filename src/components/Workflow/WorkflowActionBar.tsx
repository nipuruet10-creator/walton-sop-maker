import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { UserProfile } from '../../types/auth';
import type { SOPDocument } from '../../types/sop';
import {
  saveSOP,
  forwardToChecker,
  forwardToApprover,
  approveSOP,
  rejectSOP,
  getAllUsers,
} from '../../services/storageService';
import { downloadSOPAsPdf } from '../../services/pdfExporter';
import confetti from 'canvas-confetti';
import {
  Send,
  CheckCheck,
  RotateCcw,
  Archive,
  FileSignature,
  ShieldCheck,
  Upload,
  X,
  FolderArchive,
  SlidersHorizontal,
  FileDown,
} from 'lucide-react';

interface WorkflowActionBarProps {
  currentSop: SOPDocument;
  currentUser: UserProfile | null;
  onUpdateSop: (updated: SOPDocument) => void;
  onOpenWorkspace: () => void;
  onOpenLogin: () => void;
  onNewSop?: () => void;
  onResetSop?: () => void;
}

export const WorkflowActionBar: React.FC<WorkflowActionBarProps> = ({
  currentSop,
  currentUser,
  onUpdateSop,
  onOpenWorkspace,
  onOpenLogin,
}) => {
  const [isForwardModalOpen, setIsForwardModalOpen] = useState<boolean>(false);
  const [selectedCheckerId, setSelectedCheckerId] = useState<string>('Sazzad');
  const [isSignModalOpen, setIsSignModalOpen] = useState<boolean>(false);
  const [signTargetRole, setSignTargetRole] = useState<'preparedBy' | 'checkedBy' | 'approvedBy'>('preparedBy');
  const [signInput, setSignInput] = useState<string>('');
  const [isRejectModalOpen, setIsRejectModalOpen] = useState<boolean>(false);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [checkers, setCheckers] = useState<UserProfile[]>([]);
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState<boolean>(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);
  const adminMenuRef = useRef<HTMLDivElement>(null);

  const status = currentSop.status || 'draft';

  // Load available checkers dynamically from DB
  useEffect(() => {
    getAllUsers().then((list) => {
      const active = list.filter((u) => u.role === 'checked_by');
      setCheckers(active);
      if (active.some((c) => c.id === 'Sazzad')) {
        setSelectedCheckerId('Sazzad');
      } else if (active.length > 0) {
        setSelectedCheckerId(active[0].id);
      }
    });
  }, [isForwardModalOpen]);

  // Close admin menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (adminMenuRef.current && !adminMenuRef.current.contains(e.target as Node)) {
        setIsAdminMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle Save to Personal Archive
  const handleSaveArchive = async () => {
    if (!currentUser) {
      onOpenLogin();
      return;
    }
    const saved = await saveSOP(currentSop, currentUser, 'Saved to personal archive');
    onUpdateSop(saved);
    alert('SOP successfully saved to your archive!');
  };

  // Handle Forward to Checker
  const handleConfirmForwardChecker = async () => {
    if (!currentUser) {
      onOpenLogin();
      return;
    }
    const forwarded = await forwardToChecker(
      currentSop,
      selectedCheckerId,
      currentUser,
      currentSop.header.preparedBy.signatureImg,
      'Forwarded for section review'
    );
    onUpdateSop(forwarded);
    setIsForwardModalOpen(false);
    alert(`SOP successfully forwarded to ${forwarded.checkedByName || selectedCheckerId} for review!`);
  };

  // Handle Forward to Approver (by Checker)
  const handleConfirmForwardApprover = async () => {
    if (!currentUser) {
      onOpenLogin();
      return;
    }
    const forwarded = await forwardToApprover(
      currentSop,
      currentUser,
      currentSop.header.checkedBy.signatureImg,
      'Reviewed and forwarded for final approval'
    );
    onUpdateSop(forwarded);
    alert('SOP successfully forwarded to Kamrul Hasan for final approval!');
  };

  // Handle Final Approval (by Kamrul)
  const handleConfirmApproval = async () => {
    if (!currentUser) {
      onOpenLogin();
      return;
    }
    const approved = await approveSOP(
      currentSop,
      currentUser,
      currentSop.header.approvedBy.signatureImg,
      'Final approval completed'
    );
    onUpdateSop(approved);

    // Confetti celebration 🎉
    try {
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {}

    alert('Congratulations! SOP has been officially approved and published.');
  };

  // Handle Reject / Send Back
  const handleConfirmReject = async () => {
    if (!currentUser) return;
    if (!rejectReason.trim()) {
      alert('Please specify the reason for revision.');
      return;
    }
    const rejected = await rejectSOP(currentSop, currentUser, rejectReason);
    onUpdateSop(rejected);
    setIsRejectModalOpen(false);
    setRejectReason('');
    alert('SOP sent back for revision.');
  };

  // Handle Upload Signature Image
  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setSignInput(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleApplySignature = () => {
    if (!signInput) {
      alert('Please select or upload a signature image.');
      return;
    }

    const updatedHeader = { ...currentSop.header };
    if (signTargetRole === 'preparedBy') {
      updatedHeader.preparedBy = { ...updatedHeader.preparedBy, signatureImg: signInput };
    } else if (signTargetRole === 'checkedBy') {
      updatedHeader.checkedBy = { ...updatedHeader.checkedBy, signatureImg: signInput };
    } else if (signTargetRole === 'approvedBy') {
      updatedHeader.approvedBy = { ...updatedHeader.approvedBy, signatureImg: signInput };
    }

    const updatedDoc: SOPDocument = {
      ...currentSop,
      header: updatedHeader,
    };
    onUpdateSop(updatedDoc);
    setIsSignModalOpen(false);
    setSignInput('');
    alert('Signature successfully applied!');
  };

  const openSignDialog = (role: 'preparedBy' | 'checkedBy' | 'approvedBy') => {
    setSignTargetRole(role);
    setSignInput(currentSop.header[role]?.signatureImg || currentUser?.defaultSignatureImg || '');
    setIsSignModalOpen(true);
  };

  const handleDownloadOfficialPdf = async () => {
    setIsDownloadingPdf(true);
    try {
      await downloadSOPAsPdf('sop-paper', currentSop.header.processName, currentSop.header.referenceNo);
    } catch (err: any) {
      alert('PDF generation error: ' + (err.message || 'Unknown error'));
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const isAuthor = currentUser?.role === 'prepared_by' || currentUser?.role === 'admin';
  const isChecker = currentUser?.role === 'checked_by' || currentUser?.role === 'admin';
  const isApprover = currentUser?.role === 'approved_by' || currentUser?.role === 'admin';
  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="no-print w-full bg-slate-50 border-b border-slate-200/90 shadow-xs px-3 sm:px-4 py-1.5 flex items-center justify-between gap-3 text-xs z-30 select-none flex-nowrap overflow-x-auto scrollbar-none">
      {/* Left: Connected 3-Stage Approval Stepper */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider hidden xl:inline">
          Approval Route:
        </span>

        {/* Step 1: Prepared By */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition border ${
            status === 'draft'
              ? 'bg-amber-50 text-amber-950 border-amber-300 shadow-xs font-bold ring-1 ring-amber-200'
              : 'bg-white text-slate-700 border-slate-200 shadow-2xs'
          }`}
          title="Author (Process Concern)"
        >
          <span className="w-4 h-4 rounded-full bg-slate-700 text-white flex items-center justify-center text-[10px] font-bold">
            1
          </span>
          <span className="hidden md:inline text-slate-500 font-normal">Prepared:</span>
          <span className="font-semibold text-slate-800">
            {currentSop.authorName || currentSop.header.preparedBy.name || 'Biplob'}
          </span>
          {currentSop.header.preparedBy.signatureImg ? (
            <span className="text-[9.5px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-1 py-0.2 rounded font-bold">
              ✓ Signed
            </span>
          ) : (
            <span className="text-[9.5px] bg-amber-100 text-amber-800 px-1 py-0.2 rounded font-medium">
              Draft
            </span>
          )}
        </div>

        <span className="text-slate-400 font-bold text-xs select-none">→</span>

        {/* Step 2: Checked By */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition border ${
            status === 'forwarded_to_checker'
              ? 'bg-blue-50 text-blue-950 border-blue-400 shadow-xs font-bold ring-1 ring-blue-300 animate-pulse'
              : status === 'forwarded_to_approver' || status === 'approved'
              ? 'bg-white text-slate-700 border-slate-200 shadow-2xs'
              : 'bg-slate-100/80 text-slate-400 border-slate-200'
          }`}
          title="Reviewer (Section In-Charge)"
        >
          <span
            className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
              status === 'forwarded_to_checker' ? 'bg-blue-600' : 'bg-slate-400'
            }`}
          >
            2
          </span>
          <span className="hidden md:inline text-slate-500 font-normal">Review:</span>
          <span className="font-semibold text-slate-800">
            {currentSop.checkedByName || currentSop.header.checkedBy.name || 'Sazzad'}
          </span>
          {status === 'forwarded_to_checker' ? (
            <span className="text-[9.5px] bg-blue-100 text-blue-800 border border-blue-300 px-1 py-0.2 rounded font-bold">
              Pending
            </span>
          ) : currentSop.header.checkedBy.signatureImg ? (
            <span className="text-[9.5px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-1 py-0.2 rounded font-bold">
              ✓ Signed
            </span>
          ) : null}
        </div>

        <span className="text-slate-400 font-bold text-xs select-none">→</span>

        {/* Step 3: Approved By */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition border ${
            status === 'approved'
              ? 'bg-emerald-50 text-emerald-950 border-emerald-400 shadow-xs font-bold ring-1 ring-emerald-300'
              : status === 'forwarded_to_approver'
              ? 'bg-purple-50 text-purple-950 border-purple-400 shadow-xs font-bold ring-1 ring-purple-300 animate-pulse'
              : 'bg-slate-100/80 text-slate-400 border-slate-200'
          }`}
          title="Approver (Process HOD)"
        >
          <span
            className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
              status === 'approved'
                ? 'bg-emerald-600'
                : status === 'forwarded_to_approver'
                ? 'bg-purple-600'
                : 'bg-slate-400'
            }`}
          >
            3
          </span>
          <span className="hidden md:inline text-slate-500 font-normal">Approval:</span>
          <span className="font-semibold text-slate-800">
            {currentSop.approvedByName || currentSop.header.approvedBy.name || 'Kamrul (44819)'}
          </span>
          {status === 'approved' ? (
            <span className="text-[9.5px] bg-emerald-200 text-emerald-900 px-1.5 py-0.2 rounded-full font-bold flex items-center gap-0.5">
              <CheckCheck className="w-3 h-3" /> Approved
            </span>
          ) : status === 'forwarded_to_approver' ? (
            <span className="text-[9.5px] bg-purple-100 text-purple-800 border border-purple-300 px-1 py-0.2 rounded font-bold">
              Pending
            </span>
          ) : null}
        </div>
      </div>

      {/* Right: Context-Aware Smart Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* If Status is Approved: Strictly NO edit button! Only official PDF download & Workspace */}
        {status === 'approved' ? (
          <>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-lg font-bold text-xs shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Officially Approved & Locked</span>
            </div>

            <button
              type="button"
              onClick={handleDownloadOfficialPdf}
              disabled={isDownloadingPdf}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-xs transition cursor-pointer active:scale-95 disabled:opacity-50"
              title="Download Official Approved PDF"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>{isDownloadingPdf ? 'Generating PDF...' : 'Download Official PDF'}</span>
            </button>

            <button
              type="button"
              onClick={onOpenWorkspace}
              className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 active:scale-95"
              title="Open Workspace"
            >
              <FolderArchive className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Workspace</span>
            </button>
          </>
        ) : (
          <>
            {/* Save to Archive */}
            <button
              type="button"
              onClick={handleSaveArchive}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold shadow-2xs transition cursor-pointer active:scale-95"
              title="Save current progress to archive"
            >
              <Archive className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Save Draft</span>
            </button>

            {/* Guest prompt */}
            {!currentUser && (
              <button
                type="button"
                onClick={onOpenLogin}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow-xs transition cursor-pointer"
              >
                <span>Login to Start Workflow</span>
              </button>
            )}

            {/* 1. Primary Action for Stage 1: DRAFT or REJECTED */}
            {currentUser && (status === 'draft' || status === 'rejected') && isAuthor && (
              <>
                <button
                  type="button"
                  onClick={() => openSignDialog('preparedBy')}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition cursor-pointer"
                  title="Attach Author Signature"
                >
                  <FileSignature className="w-3.5 h-3.5 text-blue-600" />
                  <span>Signature ({currentSop.header.preparedBy.signatureImg ? 'Attached' : 'Upload'})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsForwardModalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-xs transition cursor-pointer active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit for Review</span>
                </button>
              </>
            )}

            {/* 2. Primary Action for Stage 2: FORWARDED TO CHECKER */}
            {currentUser && status === 'forwarded_to_checker' && isChecker && (
              <>
                <button
                  type="button"
                  onClick={() => openSignDialog('checkedBy')}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition cursor-pointer"
                  title="Attach Checker Signature"
                >
                  <FileSignature className="w-3.5 h-3.5 text-blue-600" />
                  <span>Review Signature ({currentSop.header.checkedBy.signatureImg ? 'Attached' : 'Upload'})</span>
                </button>

                <button
                  type="button"
                  onClick={handleConfirmForwardApprover}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shadow-xs transition cursor-pointer active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Forward for Approval</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsRejectModalOpen(true)}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition cursor-pointer"
                  title="Send Back for Revision"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                  <span>Send Back</span>
                </button>
              </>
            )}

            {/* 3. Primary Action for Stage 3: FORWARDED TO APPROVER */}
            {currentUser && status === 'forwarded_to_approver' && isApprover && (
              <>
                <button
                  type="button"
                  onClick={() => openSignDialog('approvedBy')}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition cursor-pointer"
                  title="Attach Approver Signature"
                >
                  <FileSignature className="w-3.5 h-3.5 text-purple-600" />
                  <span>Approval Signature ({currentSop.header.approvedBy.signatureImg ? 'Attached' : 'Upload'})</span>
                </button>

                <button
                  type="button"
                  onClick={handleConfirmApproval}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-xs transition cursor-pointer active:scale-95"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Final Approve & Publish</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsRejectModalOpen(true)}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition cursor-pointer"
                  title="Send Back for Revision"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                  <span>Send Back</span>
                </button>
              </>
            )}

            {/* 4. ADMIN OVERRIDE DROPDOWN: High-density control */}
            {isAdmin && (
              <div className="relative" ref={adminMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsAdminMenuOpen(!isAdminMenuOpen)}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-bold transition cursor-pointer shadow-xs active:scale-95"
                  title="Admin Control & Override Menu"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden md:inline">Admin Actions</span>
                  <span className="text-[10px]">▼</span>
                </button>

                {isAdminMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white text-slate-900 rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 text-xs">
                    <div className="p-2.5 bg-slate-900 text-white font-bold text-xs flex items-center justify-between">
                      <span>Admin Workflow Override</span>
                      <span className="text-[9px] bg-rose-600 px-1.5 py-0.5 rounded font-mono">ALL ACCESS</span>
                    </div>
                    <div className="p-1 divide-y divide-slate-100">
                      <div className="py-1">
                        <button
                          type="button"
                          onClick={() => {
                            openSignDialog('preparedBy');
                            setIsAdminMenuOpen(false);
                          }}
                          className="w-full text-left px-3 py-1.5 hover:bg-slate-50 rounded flex items-center gap-2 text-slate-700 cursor-pointer"
                        >
                          <FileSignature className="w-3.5 h-3.5 text-blue-600" />
                          <span>Change Prepared By Signature</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            openSignDialog('checkedBy');
                            setIsAdminMenuOpen(false);
                          }}
                          className="w-full text-left px-3 py-1.5 hover:bg-slate-50 rounded flex items-center gap-2 text-slate-700 cursor-pointer"
                        >
                          <FileSignature className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Change Checked By Signature</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            openSignDialog('approvedBy');
                            setIsAdminMenuOpen(false);
                          }}
                          className="w-full text-left px-3 py-1.5 hover:bg-slate-50 rounded flex items-center gap-2 text-slate-700 cursor-pointer"
                        >
                          <FileSignature className="w-3.5 h-3.5 text-purple-600" />
                          <span>Change Approved By Signature</span>
                        </button>
                      </div>
                      <div className="py-1">
                        <button
                          type="button"
                          onClick={() => {
                            setIsForwardModalOpen(true);
                            setIsAdminMenuOpen(false);
                          }}
                          className="w-full text-left px-3 py-1.5 hover:bg-blue-50 text-blue-700 rounded flex items-center gap-2 cursor-pointer font-medium"
                        >
                          <Send className="w-3.5 h-3.5 text-blue-600" />
                          <span>Submit for Section Review</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleConfirmForwardApprover();
                            setIsAdminMenuOpen(false);
                          }}
                          className="w-full text-left px-3 py-1.5 hover:bg-indigo-50 text-indigo-700 rounded flex items-center gap-2 cursor-pointer font-medium"
                        >
                          <Send className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Forward for Approval (Kamrul)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleConfirmApproval();
                            setIsAdminMenuOpen(false);
                          }}
                          className="w-full text-left px-3 py-1.5 hover:bg-emerald-50 text-emerald-800 rounded flex items-center gap-2 cursor-pointer font-bold"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Directly Grant Final Approval</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsRejectModalOpen(true);
                            setIsAdminMenuOpen(false);
                          }}
                          className="w-full text-left px-3 py-1.5 hover:bg-rose-50 text-rose-700 rounded flex items-center gap-2 cursor-pointer font-medium"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                          <span>Send Back for Revision</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* My Workspace Link Button */}
            <button
              type="button"
              onClick={onOpenWorkspace}
              className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 active:scale-95"
              title="Open My Workspace"
            >
              <FolderArchive className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Workspace</span>
            </button>
          </>
        )}
      </div>

      {/* ==================== MODALS MOUNTED VIA PORTAL ==================== */}

      {/* MODAL 1: Forward to Checker Dialog */}
      {isForwardModalOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 p-4 overflow-y-auto">
            <div className="relative bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 my-auto">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Send className="w-4 h-4 text-blue-600" />
                  <span>Select Section Reviewer</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setIsForwardModalOpen(false)}
                  className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Reviewer (Checked By):
                </label>
                <select
                  value={selectedCheckerId}
                  onChange={(e) => setSelectedCheckerId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 font-medium"
                >
                  {checkers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} — {c.designation}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-2 bg-blue-50/70 p-2.5 rounded-xl border border-blue-200/60 leading-relaxed">
                  Confirming will notify the reviewer to review the procedure and apply their verification signature.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsForwardModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 text-xs font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmForwardChecker}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Confirm & Forward</span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* MODAL 2: Signature Upload Dialog */}
      {isSignModalOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 p-4 overflow-y-auto">
            <div className="relative bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 my-auto">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <FileSignature className="w-4 h-4 text-blue-600" />
                  <span>
                    {signTargetRole === 'preparedBy' && 'Prepared By Signature Upload'}
                    {signTargetRole === 'checkedBy' && 'Checked By Signature Upload'}
                    {signTargetRole === 'approvedBy' && 'Approved By Signature Upload'}
                  </span>
                </h4>
                <button
                  type="button"
                  onClick={() => setIsSignModalOpen(false)}
                  className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                {signInput ? (
                  <div className="h-28 bg-slate-50 border-2 border-dashed border-emerald-300 rounded-xl p-2 flex items-center justify-center relative">
                    <img src={signInput} alt="Signature Preview" className="max-h-full max-w-full object-contain" />
                    <button
                      type="button"
                      onClick={() => setSignInput('')}
                      className="absolute top-2 right-2 bg-rose-500 text-white rounded-full p-1 hover:bg-rose-600 transition cursor-pointer"
                      title="Remove"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="h-32 bg-slate-50 border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer p-4 text-center group transition">
                    <Upload className="w-7 h-7 text-slate-400 group-hover:text-blue-600" />
                    <span className="text-xs font-bold text-slate-700 group-hover:text-blue-700">
                      Upload signature or seal image file
                    </span>
                    <span className="text-[10px] text-slate-400">PNG or JPG (Transparent or clean background recommended)</span>
                    <input type="file" accept="image/*" onChange={handleSignatureUpload} className="hidden" />
                  </label>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsSignModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 text-xs font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplySignature}
                  disabled={!signInput}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 text-white text-xs font-bold shadow-md transition cursor-pointer"
                >
                  Apply Signature
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* MODAL 3: Reject / Revision Request Dialog */}
      {isRejectModalOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 p-4 overflow-y-auto">
            <div className="relative bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 my-auto">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h4 className="font-bold text-rose-800 text-sm flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-rose-600" />
                  <span>Send Back for Revision</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setIsRejectModalOpen(false)}
                  className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Reason for Revision / Comments:
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  placeholder="Specify what modifications or corrections are needed..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsRejectModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 text-xs font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReject}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md transition cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Confirm Send Back</span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
