import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import type { UserProfile } from '../../types/auth';
import { authenticateUser } from '../../services/storageService';
import {
  User,
  LogIn,
  KeyRound,
  X,
  AlertCircle,
  ShieldCheck,
  Eye,
  EyeOff,
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
  isMandatory?: boolean;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  isMandatory = false,
}) => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanUser = username.trim();
    const cleanPass = password.trim();

    if (!cleanUser || !cleanPass) {
      setErrorMsg('Please enter both User ID and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await authenticateUser(cleanUser, cleanPass);
      if (user) {
        onLoginSuccess(user);
        onClose();
      } else {
        setErrorMsg('Invalid User ID or password. Please verify your credentials.');
      }
    } catch {
      setErrorMsg('System authentication error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-blue-900 text-white p-5 relative">
          {!isMandatory && (
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 text-blue-200 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white p-1 border border-white/20 flex items-center justify-center shadow-md">
              <img src="/walton-logo.png" alt="Walton Logo" className="h-8 object-contain" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                <span>Walton SOP Portal Login</span>
              </h2>
              <p className="text-[11px] text-blue-200">
                Process Automation & Standard Operating Procedures
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
              <span>User ID / Login ID</span>
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. Biplob (67544) or Sazzad (50463)"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition font-medium"
              autoFocus
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                <span>Password</span>
              </span>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer font-medium"
              >
                {showPassword ? (
                  <>
                    <EyeOff className="w-3 h-3" />
                    <span>Hide</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3 h-3" />
                    <span>Show</span>
                  </>
                )}
              </button>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your account password"
                className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 rounded-lg transition cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4 text-blue-600" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 text-white font-bold rounded-xl text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <LogIn className="w-4 h-4" />
            <span>{isSubmitting ? 'Authenticating...' : 'Sign In'}</span>
          </button>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-400 text-center">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Walton Process Development Enterprise System</span>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
