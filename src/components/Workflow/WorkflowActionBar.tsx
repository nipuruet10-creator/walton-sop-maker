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
    const saved = await saveSOP(currentSop, currentUser, 'আর্কাইভে সংরক্ষণ করা হয়েছে');
    onUpdateSop(saved);
    alert('SOP সফলভাবে আপনার পার্সোনাল আর্কাইভে সংরক্ষিত হয়েছে!');
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
      `উচ্চপদস্থ পর্যালোচনার জন্য ফরোয়ার্ড করা হয়েছে`
    );
    onUpdateSop(forwarded);
    setIsForwardModalOpen(false);
    alert(`SOP পর্যালোচনার জন্য ${forwarded.checkedByName || selectedCheckerId} এর নিকট সফলভাবে পাঠানো হয়েছে!`);
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
      'পর্যালোচনা সম্পন্ন করে চূড়ান্ত অনুমোদনের জন্য ফরোয়ার্ড করা হয়েছে'
    );
    onUpdateSop(forwarded);
    alert('SOP চূড়ান্ত অনুমোদনের জন্য Kamrul Hasan এর কাছে সফলভাবে ফরোয়ার্ড করা হয়েছে!');
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
      'চূড়ান্ত অনুমোদন সম্পন্ন'
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

    alert('অভিনন্দন! SOP চূড়ান্তভাবে অনুমোদিত হয়েছে এবং কনসার্ন সেকশন ড্যাশবোর্ডে প্রকাশিত হয়েছে।');
  };

  // Handle Reject / Send Back
  const handleConfirmReject = async () => {
    if (!currentUser) return;
    if (!rejectReason.trim()) {
      alert('অনুগ্রহ করে সংশোধনের কারণ উল্লেখ করুন।');
      return;
    }
    const rejected = await rejectSOP(currentSop, currentUser, rejectReason);
    onUpdateSop(rejected);
    setIsRejectModalOpen(false);
    setRejectReason('');
    alert('SOP সংশোধনের জন্য ফেরত পাঠানো হয়েছে।');
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
      alert('অনুগ্রহ করে স্বাক্ষরের ছবি আপলোড করুন।');
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
    alert('স্বাক্ষর সফলভাবে সংযুক্ত করা হয়েছে!');
  };

  const openSignDialog = (role: 'preparedBy' | 'checkedBy' | 'approvedBy') => {
    setSignTargetRole(role);
    setSignInput(currentSop.header[role]?.signatureImg || currentUser?.defaultSignatureImg || '');
    setIsSignModalOpen(true);
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
          অনুমোদন রুট:
        </span>

        {/* Step 1: Prepared By */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition border ${
            status === 'draft'
              ? 'bg-amber-50 text-amber-950 border-amber-300 shadow-xs font-bold ring-1 ring-amber-200'
              : 'bg-white text-slate-700 border-slate-200 shadow-2xs'
          }`}
          title="প্রস্তুতকারী (Process Concern)"
        >
          <span className="w-4 h-4 rounded-full bg-slate-700 text-white flex items-center justify-center text-[10px] font-bold">
            ১
          </span>
          <span className="hidden md:inline text-slate-500 font-normal">প্রস্তুত:</span>
          <span className="font-semibold text-slate-800">
            {currentSop.authorName || currentSop.header.preparedBy.name || 'Biplob'}
          </span>
          {currentSop.header.preparedBy.signatureImg ? (
            <span className="text-[9.5px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-1 py-0.2 rounded font-bold">
              ✓ স্বাক্ষরিত
            </span>
          ) : (
            <span className="text-[9.5px] bg-amber-100 text-amber-800 px-1 py-0.2 rounded font-medium">
              ড্রাফট
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
          title="পর্যালোচক (Section In-Charge)"
        >
          <span
            className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
              status === 'forwarded_to_checker' ? 'bg-blue-600' : 'bg-slate-400'
            }`}
          >
            ২
          </span>
          <span className="hidden md:inline text-slate-500 font-normal">পর্যালোচনা:</span>
          <span className="font-semibold text-slate-800">
            {currentSop.checkedByName || currentSop.header.checkedBy.name || 'Sazzad'}
          </span>
          {status === 'forwarded_to_checker' ? (
            <span className="text-[9.5px] bg-blue-100 text-blue-800 border border-blue-300 px-1 py-0.2 rounded font-bold">
              পেন্ডিং
            </span>
          ) : currentSop.header.checkedBy.signatureImg ? (
            <span className="text-[9.5px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-1 py-0.2 rounded font-bold">
              ✓ স্বাক্ষরিত
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
          title="অনুমোদনকারী (Process HOD)"
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
            ৩
          </span>
          <span className="hidden md:inline text-slate-500 font-normal">অনুমোদন:</span>
          <span className="font-semibold text-slate-800">
            {currentSop.approvedByName || currentSop.header.approvedBy.name || 'Kamrul (44819)'}
          </span>
          {status === 'approved' ? (
            <span className="text-[9.5px] bg-emerald-200 text-emerald-900 px-1.5 py-0.2 rounded-full font-bold flex items-center gap-0.5">
              <CheckCheck className="w-3 h-3" /> Approved
            </span>
          ) : status === 'forwarded_to_approver' ? (
            <span className="text-[9.5px] bg-purple-100 text-purple-800 border border-purple-300 px-1 py-0.2 rounded font-bold">
              পেন্ডিং
            </span>
          ) : null}
        </div>
      </div>

      {/* Right: Context-Aware Smart Actions & Admin Control Center */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Save to Archive */}
        <button
          type="button"
          onClick={handleSaveArchive}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold shadow-2xs transition cursor-pointer active:scale-95"
          title="বর্তমান অবস্থা আর্কাইভে সেভ করুন"
        >
          <Archive className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden sm:inline">আর্কাইভে সেভ</span>
        </button>

        {/* Guest prompt */}
        {!currentUser && (
          <button
            type="button"
            onClick={onOpenLogin}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow-xs transition cursor-pointer"
          >
            <span>লগইন করে ওয়ার্কফ্লো শুরু করুন</span>
          </button>
        )}

        {/* 1. Primary Action for Stage 1: DRAFT or REJECTED */}
        {currentUser && (status === 'draft' || status === 'rejected') && isAuthor && (
          <>
            <button
              type="button"
              onClick={() => openSignDialog('preparedBy')}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition cursor-pointer"
              title="Prepared By স্বাক্ষর সংযুক্ত করুন"
            >
              <FileSignature className="w-3.5 h-3.5 text-blue-600" />
              <span>স্বাক্ষর ({currentSop.header.preparedBy.signatureImg ? 'সংযুক্ত' : 'আপলোড'})</span>
            </button>

            <button
              type="button"
              onClick={() => setIsForwardModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-xs transition cursor-pointer active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
              <span>উচ্চপদস্থ পর্যালোচনায় পাঠান</span>
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
              title="Checked By স্বাক্ষর যোগ করুন"
            >
              <FileSignature className="w-3.5 h-3.5 text-blue-600" />
              <span>চেকার স্বাক্ষর ({currentSop.header.checkedBy.signatureImg ? 'যুক্ত' : 'আপলোড'})</span>
            </button>

            <button
              type="button"
              onClick={handleConfirmForwardApprover}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shadow-xs transition cursor-pointer active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
              <span>অনুমোদনে পাঠান (Kamrul)</span>
            </button>

            <button
              type="button"
              onClick={() => setIsRejectModalOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition cursor-pointer"
              title="সংশোধনের জন্য ফেরত দিন"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
              <span>সংশোধনে ফেরত</span>
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
              title="Approved By স্বাক্ষর যোগ করুন"
            >
              <FileSignature className="w-3.5 h-3.5 text-purple-600" />
              <span>অনুমোদন স্বাক্ষর ({currentSop.header.approvedBy.signatureImg ? 'যুক্ত' : 'আপলোড'})</span>
            </button>

            <button
              type="button"
              onClick={handleConfirmApproval}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-xs transition cursor-pointer active:scale-95"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>চূড়ান্ত অনুমোদন ও প্রকাশ</span>
            </button>

            <button
              type="button"
              onClick={() => setIsRejectModalOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition cursor-pointer"
              title="সংশোধনের জন্য ফেরত দিন"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
              <span>ফেরত</span>
            </button>
          </>
        )}

        {/* 4. State: APPROVED */}
        {status === 'approved' && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-lg font-bold text-xs shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>চূড়ান্ত অনুমোদিত ও প্রকাশিত</span>
          </div>
        )}

        {/* 5. ADMIN OVERRIDE DROPDOWN: High-density control replacing 10 messy buttons */}
        {isAdmin && (
          <div className="relative" ref={adminMenuRef}>
            <button
              type="button"
              onClick={() => setIsAdminMenuOpen(!isAdminMenuOpen)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-bold transition cursor-pointer shadow-xs active:scale-95"
              title="অ্যাডমিন কন্ট্রোল ও ওভাররাইড মেনু"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">অ্যাডমিন অ্যাকশন</span>
              <span className="text-[10px]">▼</span>
            </button>

            {isAdminMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white text-slate-900 rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 text-xs">
                <div className="p-2.5 bg-slate-900 text-white font-bold text-xs flex items-center justify-between">
                  <span>অ্যাডমিন স্পেশাল ওভাররাইড</span>
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
                      <span>Prepared By স্বাক্ষর পরিবর্তন</span>
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
                      <span>Checked By স্বাক্ষর পরিবর্তন</span>
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
                      <span>Approved By স্বাক্ষর পরিবর্তন</span>
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
                      <span>উচ্চপদস্থ পর্যালোচনায় পাঠান</span>
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
                      <span>অনুমোদনে পাঠান (Kamrul)</span>
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
                      <span>সরাসরি চূড়ান্ত অনুমোদন প্রদান</span>
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
                      <span>সংশোধনে ফেরত দিন</span>
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
          title="আমার তৈরি করা ও অ্যাসাইনকৃত SOP তালিকা"
        >
          <FolderArchive className="w-3.5 h-3.5 text-blue-600" />
          <span className="hidden sm:inline">ওয়ার্কস্পেস</span>
        </button>
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
                  <span>উচ্চপদস্থ পর্যালোচক নির্বাচন করুন</span>
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
                  পর্যালোচক (Checked By Rank):
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
                  ফরোয়ার্ড নিশ্চিত করলে পর্যালোচকের ড্যাশবোর্ডে সাথে সাথে নোটিফিকেশন যাবে এবং তিনি SOP পর্যালোচনা ও স্বাক্ষর যুক্ত করতে পারবেন।
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsForwardModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 text-xs font-semibold transition cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={handleConfirmForwardChecker}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>ফরোয়ার্ড নিশ্চিত করুন</span>
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
                    {signTargetRole === 'preparedBy' && 'Prepared By (প্রস্তুতকারী) স্বাক্ষর আপলোড'}
                    {signTargetRole === 'checkedBy' && 'Checked By (পর্যালোচক) স্বাক্ষর আপলোড'}
                    {signTargetRole === 'approvedBy' && 'Approved By (অনুমোদনকারী) স্বাক্ষর আপলোড'}
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
                      title="রিমুভ"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="h-32 bg-slate-50 border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer p-4 text-center group transition">
                    <Upload className="w-7 h-7 text-slate-400 group-hover:text-blue-600" />
                    <span className="text-xs font-bold text-slate-700 group-hover:text-blue-700">
                      স্বাক্ষর বা সিলের ছবি ফাইল সিলেক্ট করুন
                    </span>
                    <span className="text-[10px] text-slate-400">PNG বা JPG (স্বচ্ছ/সাদা ব্যাকগ্রাউন্ড বাঞ্ছনীয়)</span>
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
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={handleApplySignature}
                  disabled={!signInput}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 text-white text-xs font-bold shadow-md transition cursor-pointer"
                >
                  সংযুক্ত করুন
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
                  <span>সংশোধনের জন্য ফেরত পাঠান</span>
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
                  সংশোধনের বিবরণ / কারণ লিখুন:
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  placeholder="কোন ধাপে কী সংশোধন বা পরিমার্জন প্রয়োজন..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsRejectModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 text-xs font-semibold transition cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReject}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md transition cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>ফেরত নিশ্চিত করুন</span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
