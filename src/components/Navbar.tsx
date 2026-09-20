import React, { useState, useRef, useEffect } from 'react';
import type { UserProfile, NotificationItem } from '../types/auth';
import {
  Printer,
  Download,
  Upload,
  Sparkles,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileSpreadsheet,
  FileDown,
  LogIn,
  LogOut,
  FolderArchive,
  BarChart3,
  ShieldAlert,
  Bell,
  ArrowRight,
  FilePlus,
  RotateCcw,
} from 'lucide-react';

interface NavbarProps {
  currentUser: UserProfile | null;
  notifications?: NotificationItem[];
  onOpenLogin: () => void;
  onLogout: () => void;
  onOpenWorkspace: () => void;
  onOpenMasterArchive: () => void;
  onOpenAnalytics: () => void;
  onOpenAdminPanel: () => void;
  onSelectSopById?: (sopId: string) => void;
  onPrint: () => void;
  onDownloadPdf: () => void;
  onExportExcel: () => void;
  onExportJson: () => void;
  onImportJson: () => void;
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  onAutoGenerate: () => void;
  isGenerating: boolean;
  isDownloadingPdf?: boolean;
  onNewSop?: () => void;
  onResetSop?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  notifications = [],
  onOpenLogin,
  onLogout,
  onOpenWorkspace,
  onOpenMasterArchive,
  onOpenAnalytics,
  onOpenAdminPanel,
  onSelectSopById,
  onPrint,
  onDownloadPdf,
  onExportExcel,
  onExportJson,
  onImportJson,
  zoom,
  setZoom,
  onAutoGenerate,
  isGenerating,
  isDownloadingPdf = false,
  onNewSop,
  onResetSop,
}) => {
  const [isNotifOpen, setIsNotifOpen] = useState<boolean>(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close notifications dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <header className="no-print bg-slate-900 text-white border-b border-slate-800 px-3 lg:px-4 h-14 flex items-center justify-between shadow-md sticky top-0 z-40 select-none flex-nowrap overflow-visible">
      {/* Left: Brand & Direct Module Links */}
      <div className="flex items-center gap-2 lg:gap-3 shrink-0">
        {/* Walton Logo Container */}
        <div className="bg-white px-2 py-1 rounded-lg flex items-center justify-center shadow-xs border border-slate-200">
          <img src="/walton-logo.png" alt="Walton Logo" className="h-6 object-contain" />
        </div>

        {/* Title & Version Tag */}
        <div className="flex items-center gap-1.5">
          <h1 className="font-extrabold text-sm sm:text-base tracking-tight text-white flex items-center gap-1.5 whitespace-nowrap">
            <span className="hidden sm:inline">Walton SOP Maker</span>
            <span className="sm:hidden">Walton SOP</span>
            <span className="text-[9px] bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-mono px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shadow-xs">
              v2.0 Enterprise
            </span>
          </h1>
        </div>

        {/* Vertical Divider */}
        <div className="h-4 w-[1px] bg-slate-800 hidden md:block" />

        {/* Portal Module Navigation Buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onOpenMasterArchive}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-950/70 hover:bg-indigo-900 text-indigo-200 border border-indigo-700/60 text-xs font-semibold shadow-xs transition cursor-pointer active:scale-95"
            title="অনুমোদিত ও সংরক্ষিত সমস্ত SOP আর্কাইভ"
          >
            <FolderArchive className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="hidden md:inline">আর্কাইভ</span>
          </button>

          <button
            type="button"
            onClick={onOpenAnalytics}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition cursor-pointer active:scale-95"
            title="মাসভিত্তিক ও ইউজারভিত্তিক SOP সম্পন্ন রিপোর্ট"
          >
            <BarChart3 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="hidden md:inline">অ্যানালিটিক্স</span>
          </button>

          {currentUser?.role === 'admin' && (
            <button
              type="button"
              onClick={onOpenAdminPanel}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-950/70 hover:bg-rose-900 text-rose-200 border border-rose-800/80 text-xs font-semibold transition cursor-pointer active:scale-95"
              title="ইউজার ম্যানেজমেন্ট ও সেন্ট্রাল AI কনফিগারেশন"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span className="hidden lg:inline">অ্যাডমিন</span>
            </button>
          )}
        </div>
      </div>

      {/* Center: Creation & AI Assistant Quick Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {onNewSop && (
          <button
            type="button"
            onClick={onNewSop}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold shadow-xs transition cursor-pointer active:scale-95"
            title="নতুন সম্পূর্ণ ব্ল্যাঙ্ক SOP তৈরি করুন"
          >
            <FilePlus className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">+ নতুন SOP</span>
          </button>
        )}

        {onResetSop && (
          <button
            type="button"
            onClick={onResetSop}
            className="flex items-center gap-1 bg-slate-800 hover:bg-rose-950 text-rose-300 border border-slate-700 hover:border-rose-700 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer"
            title="বর্তমান SOP রিসেট করে সম্পূর্ণ খালি করুন"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span className="hidden lg:inline">রিসেট</span>
          </button>
        )}

        <button
          onClick={onAutoGenerate}
          disabled={isGenerating}
          className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-95"
          title="Convert Banglish notes into formal industrial Bengali SOP"
        >
          <Sparkles className={`w-3.5 h-3.5 shrink-0 ${isGenerating ? 'animate-spin text-amber-300' : 'text-amber-300'}`} />
          <span className="hidden xl:inline">Banglish → বাংলা AI</span>
          <span className="xl:hidden hidden sm:inline">AI Generate</span>
        </button>
      </div>

      {/* Right: Notification Center, User Session & Essential Utilities */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Zoom Controls (Available on Desktop) */}
        <div className="hidden 2xl:flex items-center bg-slate-800/90 rounded-lg p-0.5 text-xs text-slate-300 border border-slate-700/80">
          <button
            onClick={() => setZoom((z) => Math.max(0.4, Number((z - 0.1).toFixed(1))))}
            className="p-1 hover:text-white hover:bg-slate-700 rounded transition cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="px-1.5 font-mono text-[11px] select-none">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom((z) => Math.min(1.6, Number((z + 0.1).toFixed(1))))}
            className="p-1 hover:text-white hover:bg-slate-700 rounded transition cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoom(1)}
            className="p-1 hover:text-white hover:bg-slate-700 rounded transition ml-0.5 cursor-pointer"
            title="100% Fit"
          >
            <Maximize2 className="w-3 h-3" />
          </button>
        </div>

        {/* Quick Export Group */}
        <div className="flex items-center gap-1">
          <button
            onClick={onExportExcel}
            className="flex items-center gap-1 bg-emerald-950/70 hover:bg-emerald-900 text-emerald-200 border border-emerald-700/60 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer active:scale-95"
            title="Export SOP data into Microsoft Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="hidden sm:inline">Excel</span>
          </button>

          <button
            onClick={onDownloadPdf}
            disabled={isDownloadingPdf}
            className="flex items-center gap-1 bg-blue-900/70 hover:bg-blue-800 text-blue-100 border border-blue-700/60 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer active:scale-95 disabled:opacity-50"
            title="Download high-resolution A4 Landscape PDF directly"
          >
            <FileDown className="w-3.5 h-3.5 text-blue-300 shrink-0" />
            <span className="hidden sm:inline">{isDownloadingPdf ? 'Creating...' : 'PDF'}</span>
          </button>

          <button
            onClick={onPrint}
            className="p-1.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition cursor-pointer"
            title="Print (Ctrl+P)"
          >
            <Printer className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onExportJson}
            className="hidden lg:block p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition cursor-pointer"
            title="Backup JSON"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onImportJson}
            className="hidden lg:block p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition cursor-pointer"
            title="Load JSON"
          >
            <Upload className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Vertical Divider */}
        <div className="h-4 w-[1px] bg-slate-800" />

        {/* Notification Bell 🔔 (Fixed to Right Edge - Guaranteed No Off-Screen Clipping) */}
        {currentUser && (
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer active:scale-95 ${
                unreadCount > 0
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 hover:bg-amber-500/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
              title={unreadCount > 0 ? `নতুন ${unreadCount}টি পেন্ডিং নোটিফিকেশন আছে!` : 'নোটিফিকেশন সেন্টার'}
            >
              <div className="relative flex items-center justify-center">
                <Bell className={`w-4 h-4 ${unreadCount > 0 ? 'text-amber-400 fill-amber-400/20' : 'text-slate-300'}`} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-md animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </div>
              <span className="hidden md:inline font-bold">
                {unreadCount > 0 ? `নোটিফিকেশন (${unreadCount})` : 'নোটিফিকেশন'}
              </span>
            </button>

            {/* Notification Dropdown Popover */}
            {isNotifOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 max-w-[calc(100vw-24px)] bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                <div className="p-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <div className="w-6 h-6 rounded-md bg-blue-600/30 border border-blue-500/40 flex items-center justify-center">
                      <Bell className="w-3.5 h-3.5 text-blue-400" />
                    </div>
                    <div>
                      <span className="block leading-tight">নোটিফিকেশন ও ওয়ার্কফ্লো টাস্ক</span>
                      <span className="text-[10px] text-slate-400 font-normal">পেন্ডিং রিভিউ ও অনুমোদন রিকোয়েস্ট</span>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-600 text-white font-mono font-bold">
                    {notifications.length} টি
                  </span>
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="text-center py-10 px-4">
                      <div className="w-10 h-10 rounded-full bg-slate-100 mx-auto flex items-center justify-center text-slate-400 mb-2">
                        <Bell className="w-5 h-5 text-slate-400" />
                      </div>
                      <p className="text-xs font-bold text-slate-700">কোনো পেন্ডিং নোটিফিকেশন নেই</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">সবগুলো SOP আপডেট ও অনুমোদন আপ-টু-ডেট রয়েছে।</p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-3 text-xs hover:bg-slate-50 transition cursor-pointer border-l-4 ${
                          !notif.isRead ? 'border-l-blue-600 bg-blue-50/40' : 'border-l-transparent'
                        }`}
                        onClick={() => {
                          if (notif.sopId && onSelectSopById) {
                            onSelectSopById(notif.sopId);
                            setIsNotifOpen(false);
                          }
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-bold text-slate-900 leading-tight">
                            {notif.sopTitle}
                          </span>
                          <span className="text-[10px] text-slate-500 shrink-0 font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                            {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11.5px] text-slate-600 mt-1 leading-relaxed">
                          {notif.message}
                        </p>
                        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100 text-[10.5px]">
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                            {notif.senderName} • {notif.senderRole}
                          </span>
                          <span className="flex items-center gap-1 text-blue-600 font-bold hover:text-blue-700">
                            পর্যালোচনা ও স্বাক্ষর করুন <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* User Account / Profile Widget */}
        {currentUser ? (
          <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700 px-2 py-1 rounded-lg text-xs">
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-[11px] font-bold text-white shadow-xs">
              {currentUser.username[0].toUpperCase()}
            </div>
            <div className="text-left hidden lg:block leading-tight">
              <span className="font-bold text-slate-100 block text-[11px] truncate max-w-[90px]">
                {currentUser.name.split(' ')[0]}
              </span>
              <span className="text-[9px] text-blue-300 block capitalize">
                {currentUser.role.replace('_', ' ')}
              </span>
            </div>
            <button
              type="button"
              onClick={onOpenWorkspace}
              className="p-1 hover:bg-slate-700 text-blue-300 rounded transition cursor-pointer"
              title="আমার ওয়ার্কস্পেস"
            >
              <FolderArchive className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="p-1 hover:bg-slate-700 text-slate-400 hover:text-rose-400 rounded transition cursor-pointer"
              title="লগআউট"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onOpenLogin}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>লগইন</span>
          </button>
        )}
      </div>
    </header>
  );
};
