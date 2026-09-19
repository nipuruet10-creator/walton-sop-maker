import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import type { UserProfile } from '../../types/auth';
import { authenticateUser, INITIAL_USERS } from '../../services/storageService';
import {
  User,
  LogIn,
  KeyRound,
  Building2,
  X,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!username.trim() || !password.trim()) {
      setErrorMsg('দয়া করে আইডি (Username) এবং পাসওয়ার্ড লিখুন।');
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await authenticateUser(username, password);
      if (user) {
        onLoginSuccess(user);
        onClose();
      } else {
        setErrorMsg('ভুল ইউজার আইডি অথবা পাসওয়ার্ড! পুনরায় চেষ্টা করুন।');
      }
    } catch {
      setErrorMsg('লগইন করার সময় ত্রুটি ঘটেছে। আবার চেষ্টা করুন।');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = async (targetUser: UserProfile, pass: string) => {
    setUsername(targetUser.username);
    setPassword(pass);
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      const user = await authenticateUser(targetUser.username, pass);
      if (user) {
        onLoginSuccess(user);
        onClose();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white p-5 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-blue-200 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white">
              <Building2 className="w-6 h-6 text-blue-200" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Walton SOP Portal Login</h2>
              <p className="text-xs text-blue-200">
                প্রসেস অটোমেশন ও এসওপি ম্যানেজমেন্ট সিস্টেম
              </p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleLogin} className="p-6 space-y-4">
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-600" />
              <span>ইউজার আইডি (Username / ID)</span>
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="যেমন: Biplob, Dev, Sazzad, Kamrul"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-blue-600" />
              <span>পাসওয়ার্ড (Password)</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="পাসওয়ার্ড লিখুন..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              সাধারণ ইউজার পাসওয়ার্ড: <code className="font-mono text-slate-600">Process@2026</code>
            </p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <LogIn className="w-4 h-4" />
            <span>{isSubmitting ? 'প্রবেশ করা হচ্ছে...' : 'লগইন করুন (Login)'}</span>
          </button>

          {/* Quick Demo Switcher */}
          <div className="pt-3 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>দ্রুত টেস্ট লগইন (১-ক্লিক সুইচ):</span>
              </span>
              <span className="text-[10px] text-slate-400">অটো সিলেক্ট</span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 text-[10.5px]">
              {/* Prepared By */}
              <button
                type="button"
                onClick={() =>
                  handleQuickLogin(
                    INITIAL_USERS.find((u) => u.id === 'Biplob')!,
                    'Process@2026'
                  )
                }
                className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-left transition cursor-pointer"
              >
                <span className="font-bold block">Biplob</span>
                <span className="text-[9px] text-emerald-600">Prepared By</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleQuickLogin(
                    INITIAL_USERS.find((u) => u.id === 'Dev')!,
                    'Process@2026'
                  )
                }
                className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-left transition cursor-pointer"
              >
                <span className="font-bold block">Dev (Deb)</span>
                <span className="text-[9px] text-emerald-600">Prepared By</span>
              </button>

              {/* Checked By */}
              <button
                type="button"
                onClick={() =>
                  handleQuickLogin(
                    INITIAL_USERS.find((u) => u.id === 'Sazzad')!,
                    'Process@2026'
                  )
                }
                className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-left transition cursor-pointer"
              >
                <span className="font-bold block">Sazzad</span>
                <span className="text-[9px] text-blue-600">Checked By</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleQuickLogin(
                    INITIAL_USERS.find((u) => u.id === 'Rafi')!,
                    'Process@2026'
                  )
                }
                className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-left transition cursor-pointer"
              >
                <span className="font-bold block">Rafi</span>
                <span className="text-[9px] text-blue-600">Checked By</span>
              </button>

              {/* Approved By */}
              <button
                type="button"
                onClick={() =>
                  handleQuickLogin(
                    INITIAL_USERS.find((u) => u.id === 'Kamrul')!,
                    'Process@2026'
                  )
                }
                className="p-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 text-left transition cursor-pointer"
              >
                <span className="font-bold block">Kamrul</span>
                <span className="text-[9px] text-purple-600">Approved By</span>
              </button>

              {/* Admin */}
              <button
                type="button"
                onClick={() =>
                  handleQuickLogin(
                    INITIAL_USERS.find((u) => u.id === 'Admin_Sazzad')!,
                    'ACprocess@2026'
                  )
                }
                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-left transition cursor-pointer"
              >
                <span className="font-bold block">Sazzad (Admin)</span>
                <span className="text-[9px] text-rose-600">System Admin</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
