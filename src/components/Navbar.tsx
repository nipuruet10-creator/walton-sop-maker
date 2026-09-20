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
    <header className="no-print bg-slate-900 text-white border-b border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between gap-3 shadow-md sticky top-0 z-40">
      {/* Left: Brand & Portal Navigation */}
      <div className="flex items-center gap-3">
        <div className="bg-white p-1 rounded-lg flex items-center justify-center shadow-inner">
          <img src="/walton-logo.png" alt="Walton Logo" className="h-7 object-contain" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-sm sm:text-base tracking-tight text-white flex items-center gap-1.5">
              <span>Walton SOP Maker</span>
              <span className="text-[10px] bg-blue-600 text-white font-mono px-1.5 py-0.2 rounded">v2.0 Enterprise</span>
            </h1>
          </div>
          <p className="text-[10.5px] text-slate-400 font-sans hidden lg:block">
            Manufacturing Standard Operating Procedure Auto-Generator & Precision Workflow
          </p>
        </div>

        {/* Portal Module Navigation Buttons */}
        <div className="hidden xl:flex items-center gap-1.5 ml-2 pl-3 border-l border-slate-700">
          <button
            type="button"
            onClick={onOpenMasterArchive}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-900/80 hover:bg-indigo-800 text-indigo-100 border border-indigo-600/70 text-xs font-semibold shadow-xs transition cursor-pointer"
            title="অনুমোদিত ও সংরক্ষিত সমস্ত SOP আর্কাইভ"
          >
            <FolderArchive className="w-3.5 h-3.5 text-indigo-300" />
            <span>আর্কাইভ</span>
          </button>

          <button
            type="button"
            onClick={onOpenAnalytics}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-300 border border-slate-700 text-xs font-semibold transition cursor-pointer"
            title="মাসভিত্তিক ও ইউজারভিত্তিক SOP সম্পন্ন রিপোর্ট"
          >
            <BarChart3 className="w-3.5 h-3.5 text-blue-400" />
            <span>অ্যানালিটিক্স</span>
          </button>

          {currentUser?.role === 'admin' && (
            <button
              type="button"
              onClick={onOpenAdminPanel}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-950/70 hover:bg-rose-900 text-rose-200 border border-rose-800/80 text-xs font-semibold transition cursor-pointer"
              title="ইউজার ম্যানেজমেন্ট ও সেন্ট্রাল AI কনফিগারেশন"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>অ্যাডমিন প্যানেল</span>
            </button>
          )}
        </div>
      </div>

      {/* Center: AI Trigger Button */}
      <div className="flex items-center gap-2">
        <button
          onClick={onAutoGenerate}
          disabled={isGenerating}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-3 py-1.5 rounded-xl text-xs font-semibold shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          title="Convert Banglish notes into formal industrial Bengali SOP"
        >
          <Sparkles className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin text-amber-300' : 'text-amber-300'}`} />
          <span className="hidden sm:inline">Banglish → 100% Bengali AI</span>
          <span className="sm:hidden">AI Generate</span>
        </button>
      </div>

      {/* Right: Highly Visible Notification Bell, User Profile, Export & Utility Tools */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Notification Bell 🔔 (Ultra-Visible & Eye-Catching) */}
        {currentUser && (
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95 ${
                unreadCount > 0
                  ? 'bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 text-white shadow-lg shadow-rose-950/60 ring-2 ring-amber-300 ring-offset-2 ring-offset-slate-900 animate-pulse'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600'
              }`}
              title={unreadCount > 0 ? `নতুন ${unreadCount}টি নোটিফিকেশন / পেন্ডিং রিভিউ আছে!` : 'নোটিফিকেশন সেন্টার'}
            >
              <div className="relative flex items-center justify-center">
                <Bell className={`w-4 h-4 ${unreadCount > 0 ? 'text-amber-200 fill-amber-300' : 'text-slate-300'}`} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 bg-amber-400 text-slate-950 text-[10px] font-black rounded-full flex items-center justify-center shadow-md border border-white">
                    {unreadCount}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline font-bold">
                {unreadCount > 0 ? `নোটিফিকেশন (${unreadCount})` : 'নোটিফিকেশন'}
              </span>
            </button>

            {/* Notification Dropdown Popover */}
            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                <div className="p-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Bell className="w-3.5 h-3.5 text-blue-400" />
                    <span>নোটিফিকেশন সেন্টার</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-600 font-mono">
                    {notifications.length} টি
                  </span>
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-400">
                      কোনো নতুন পেন্ডিং নোটিফিকেশন নেই
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-3 text-xs hover:bg-slate-50 transition cursor-pointer ${
                          !notif.isRead ? 'bg-blue-50/50' : ''
                        }`}
                        onClick={() => {
                          if (notif.sopId && onSelectSopById) {
                            onSelectSopById(notif.sopId);
                            setIsNotifOpen(false);
                          }
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-bold text-slate-800 line-clamp-1">
                            {notif.sopTitle}
                          </span>
                          <span className="text-[9px] text-slate-400 shrink-0">
                            {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1 leading-tight">
                          {notif.message}
                        </p>
                        <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100/60 text-[10px] text-blue-600 font-bold">
                          <span>{notif.senderName} ({notif.senderRole})</span>
                          <span className="flex items-center gap-0.5 text-blue-700 hover:underline">
                            পর্যালোচনা করুন <ArrowRight className="w-3 h-3" />
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

        {/* User Account / Login Info */}
        {currentUser ? (
          <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700 px-2.5 py-1 rounded-xl text-xs">
            <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[11px] font-bold text-white">
              {currentUser.username[0].toUpperCase()}
            </div>
            <div className="text-left hidden md:block">
              <span className="font-bold text-slate-100 block leading-tight">{currentUser.name.split(' ')[0]}</span>
              <span className="text-[9px] text-blue-300 block capitalize">{currentUser.role.replace('_', ' ')}</span>
            </div>
            <button
              type="button"
              onClick={onOpenWorkspace}
              className="ml-1 p-1 hover:bg-slate-700 text-blue-300 rounded transition cursor-pointer relative"
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
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>লগইন</span>
          </button>
        )}

        {/* Small Screen Portal buttons */}
        <div className="flex xl:hidden items-center gap-1">
          <button
            type="button"
            onClick={onOpenMasterArchive}
            className="p-1.5 rounded-lg bg-indigo-900/60 text-indigo-300 border border-indigo-700"
            title="আর্কাইভ"
          >
            <FolderArchive className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onOpenAnalytics}
            className="p-1.5 rounded-lg bg-slate-800 text-blue-300 border border-slate-700"
            title="অ্যানালিটিক্স"
          >
            <BarChart3 className="w-3.5 h-3.5" />
          </button>
          {currentUser?.role === 'admin' && (
            <button
              type="button"
              onClick={onOpenAdminPanel}
              className="p-1.5 rounded-lg bg-rose-950 text-rose-300 border border-rose-800"
              title="অ্যাডমিন"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Zoom Controls */}
        <div className="hidden lg:flex items-center bg-slate-800 rounded-lg p-0.5 text-xs text-slate-300 border border-slate-700">
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

        {/* Export to Excel */}
        <button
          onClick={onExportExcel}
          className="flex items-center gap-1 bg-emerald-800 hover:bg-emerald-700 text-emerald-100 border border-emerald-600 px-2.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer active:scale-95"
          title="Export SOP data into Microsoft Excel (.xlsx)"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-300" />
          <span className="hidden sm:inline">Excel</span>
        </button>

        {/* Download Direct PDF */}
        <button
          onClick={onDownloadPdf}
          disabled={isDownloadingPdf}
          className="flex items-center gap-1 bg-blue-700 hover:bg-blue-600 text-white border border-blue-500 px-2.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer active:scale-95 disabled:opacity-50"
          title="Download high-resolution A4 Landscape PDF directly"
        >
          <FileDown className="w-3.5 h-3.5 text-blue-200" />
          <span className="hidden sm:inline">{isDownloadingPdf ? 'Creating...' : 'PDF'}</span>
        </button>

        {/* Print / Save PDF */}
        <button
          onClick={onPrint}
          className="p-1.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition cursor-pointer"
          title="Print (Ctrl+P)"
        >
          <Printer className="w-3.5 h-3.5" />
        </button>

        {/* Backup / Load JSON */}
        <button
          onClick={onExportJson}
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition cursor-pointer"
          title="Backup JSON"
        >
          <Download className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onImportJson}
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition cursor-pointer"
          title="Load JSON"
        >
          <Upload className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
