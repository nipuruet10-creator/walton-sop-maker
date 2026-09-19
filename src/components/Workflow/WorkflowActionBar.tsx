import React, { useState } from 'react';
import type { UserProfile } from '../../types/auth';
import type { SOPDocument } from '../../types/sop';
import {
  saveSOP,
  forwardToChecker,
  forwardToApprover,
  approveSOP,
  rejectSOP,
  INITIAL_USERS,
} from '../../services/storageService';
import confetti from 'canvas-confetti';
import {
  Send,
  CheckCheck,
  RotateCcw,
  Archive,
  FileSignature,
  Clock,
  ShieldCheck,
  UserCheck,
  AlertTriangle,
  Upload,
  X,
} from 'lucide-react';

interface WorkflowActionBarProps {
  currentSop: SOPDocument;
  currentUser: UserProfile | null;
  onUpdateSop: (updated: SOPDocument) => void;
  onOpenWorkspace: () => void;
  onOpenLogin: () => void;
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

  const status = currentSop.status || 'draft';

  // Available Checkers list
  const checkers = INITIAL_USERS.filter((u) => u.role === 'checked_by');

  // Handle Save to Archive
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

  // Badge Color & Text
  const getStatusBadge = () => {
    switch (status) {
      case 'approved':
        return (
          <span className="flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded-full text-xs font-bold">
            <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>অনুমোদিত (Approved)</span>
          </span>
        );
      case 'forwarded_to_approver':
        return (
          <span className="flex items-center gap-1 bg-purple-100 text-purple-800 border border-purple-300 px-2.5 py-1 rounded-full text-xs font-bold">
            <Clock className="w-3.5 h-3.5 text-purple-600" />
            <span>অনুমোদনের অপেক্ষায় (Pending Approval - Kamrul)</span>
          </span>
        );
      case 'forwarded_to_checker':
        return (
          <span className="flex items-center gap-1 bg-blue-100 text-blue-800 border border-blue-300 px-2.5 py-1 rounded-full text-xs font-bold">
            <UserCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>পর্যালোচনার অপেক্ষায় (Pending Review - {currentSop.checkedByName || 'Checker'})</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="flex items-center gap-1 bg-rose-100 text-rose-800 border border-rose-300 px-2.5 py-1 rounded-full text-xs font-bold">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>সংশোধনের জন্য ফেরত (Revision Needed)</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 bg-amber-100 text-amber-800 border border-amber-300 px-2.5 py-1 rounded-full text-xs font-bold">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>খসড়া (Draft - {currentSop.authorName || 'Biplob'})</span>
          </span>
        );
    }
  };

  return (
    <div className="no-print w-full bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
      {/* Left: Document Status & Info */}
      <div className="flex items-center gap-3">
        {getStatusBadge()}

        <div className="hidden md:flex items-center gap-2 text-slate-600 text-[11px]">
          <span>প্রসেস: <strong>{currentSop.header.processName || 'N/A'}</strong></span>
          <span className="text-slate-300">•</span>
          <span>মডেল: <strong>{currentSop.header.model || 'N/A'}</strong></span>
          <span className="text-slate-300">•</span>
          <span>স্টেশন: <strong>{currentSop.header.stationLine || 'N/A'}</strong></span>
        </div>
      </div>

      {/* Right: Role-based Action Buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Save to Personal Archive (Always available) */}
        <button
          type="button"
          onClick={handleSaveArchive}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl font-semibold transition cursor-pointer"
          title="আর্কাইভে সেভ করুন"
        >
          <Archive className="w-3.5 h-3.5 text-slate-500" />
          <span>আর্কাইভে সেভ</span>
        </button>

        {/* Guest / Not logged in banner */}
        {!currentUser && (
          <button
            type="button"
            onClick={onOpenLogin}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-xs transition cursor-pointer"
          >
            <span>লগইন করে ফরোয়ার্ড করুন</span>
          </button>
        )}

        {/* Actions for Prepared By (Biplob, Dev, Admin) */}
        {currentUser && (currentUser.role === 'prepared_by' || currentUser.role === 'admin') && (
          <>
            <button
              type="button"
              onClick={() => openSignDialog('preparedBy')}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl font-semibold transition cursor-pointer"
              title="Prepared By স্বাক্ষর যোগ করুন"
            >
              <FileSignature className="w-3.5 h-3.5 text-blue-600" />
              <span>স্বাক্ষর ({currentSop.header.preparedBy.signatureImg ? 'সংযুক্ত' : 'আপলোড'})</span>
            </button>

            <button
              type="button"
              onClick={() => setIsForwardModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-xs transition cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>উচ্চপদস্থ পর্যালোচনায় পাঠান</span>
            </button>
          </>
        )}

        {/* Actions for Checked By (Sazzad, Rafi, Hashmi, Pear, Emon, Admin) */}
        {currentUser && (currentUser.role === 'checked_by' || currentUser.role === 'admin') && (
          <>
            <button
              type="button"
              onClick={() => openSignDialog('checkedBy')}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl font-semibold transition cursor-pointer"
              title="Checked By স্বাক্ষর যোগ করুন"
            >
              <FileSignature className="w-3.5 h-3.5 text-blue-600" />
              <span>চেকার স্বাক্ষর ({currentSop.header.checkedBy.signatureImg ? 'যুক্ত' : 'আপলোড'})</span>
            </button>

            <button
              type="button"
              onClick={handleConfirmForwardApprover}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-xs transition cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>অনুমোদনে পাঠান (Kamrul)</span>
            </button>

            <button
              type="button"
              onClick={() => setIsRejectModalOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-semibold transition cursor-pointer"
              title="সংশোধনের জন্য ফেরত দিন"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
              <span>সংশোধনে ফেরত</span>
            </button>
          </>
        )}

        {/* Actions for Approved By (Kamrul, Admin) */}
        {currentUser && (currentUser.role === 'approved_by' || currentUser.role === 'admin') && (
          <>
            <button
              type="button"
              onClick={() => openSignDialog('approvedBy')}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl font-semibold transition cursor-pointer"
              title="Approved By স্বাক্ষর যোগ করুন"
            >
              <FileSignature className="w-3.5 h-3.5 text-purple-600" />
              <span>অনুমোদন স্বাক্ষর ({currentSop.header.approvedBy.signatureImg ? 'যুক্ত' : 'আপলোড'})</span>
            </button>

            <button
              type="button"
              onClick={handleConfirmApproval}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-sm transition cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>চূড়ান্ত অনুমোদন ও প্রকাশ</span>
            </button>

            <button
              type="button"
              onClick={() => setIsRejectModalOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-semibold transition cursor-pointer"
              title="সংশোধনের জন্য ফেরত দিন"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
              <span>ফেরত</span>
            </button>
          </>
        )}

        {/* Personal Workspace button */}
        <button
          type="button"
          onClick={onOpenWorkspace}
          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl font-bold transition cursor-pointer"
        >
          <span>আমার ওয়ার্কস্পেস</span>
        </button>
      </div>

      {/* MODAL 1: Forward to Checker Dialog */}
      {isForwardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Send className="w-4 h-4 text-blue-600" />
                <span>উচ্চপদস্থ পর্যালোচক নির্বাচন করুন</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsForwardModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                পর্যালোচক (Checked By Rank):
              </label>
              <select
                value={selectedCheckerId}
                onChange={(e) => setSelectedCheckerId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
              >
                {checkers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {c.designation}
                  </option>
                ))}
              </select>
              <p className="text-[10.5px] text-slate-500 mt-2">
                ফরোয়ার্ড করার পর পর্যালোচক তার নিজস্ব প্যানেলে SOP পর্যালোচনা ও স্বাক্ষর যুক্ত করতে পারবেন।
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setIsForwardModalOpen(false)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleConfirmForwardChecker}
                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-xs"
              >
                ফরোয়ার্ড নিশ্চিত করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Signature Upload Dialog */}
      {isSignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
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
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Preview */}
              {signInput ? (
                <div className="h-24 bg-slate-50 border-2 border-dashed border-emerald-300 rounded-xl p-2 flex items-center justify-center relative">
                  <img src={signInput} alt="Signature Preview" className="max-h-full max-w-full object-contain" />
                  <button
                    type="button"
                    onClick={() => setSignInput('')}
                    className="absolute top-2 right-2 bg-rose-500 text-white rounded-full p-1 hover:bg-rose-600"
                    title="রিমুভ"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <label className="h-28 bg-slate-50 border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl flex flex-col items-center justify-center gap-1.5 cursor-pointer p-4 text-center group">
                  <Upload className="w-6 h-6 text-slate-400 group-hover:text-blue-600" />
                  <span className="text-xs font-semibold text-slate-700 group-hover:text-blue-700">
                    স্বাক্ষর বা সিলের ছবি ফাইল সিলেক্ট করুন
                  </span>
                  <span className="text-[10px] text-slate-400">PNG বা JPG (স্বচ্ছ/সাদা ব্যাকগ্রাউন্ড বাঞ্ছনীয়)</span>
                  <input type="file" accept="image/*" onChange={handleSignatureUpload} className="hidden" />
                </label>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setIsSignModalOpen(false)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleApplySignature}
                disabled={!signInput}
                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 text-white text-xs font-bold shadow-xs"
              >
                সংযুক্ত করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Reject / Revision Request Dialog */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="font-bold text-rose-800 text-sm flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-rose-600" />
                <span>সংশোধনের জন্য ফেরত পাঠান</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                সংশোধনের বিবরণ / কারণ:
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                placeholder="কোথায় কী পরিবর্তন বা সংযোজন প্রয়োজন..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-xs"
              >
                ফেরত নিশ্চিত করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
