import React from 'react';
import type { UserProfile } from '../../types/auth';
import type { ProcessConcern } from '../../data/concernData';

export type AppView = 'dashboard' | 'workplace' | 'editor' | 'approval_route' | 'archive' | 'analytics';

interface LeftSidebarProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
  currentUser: UserProfile | null;
  activeConcern: ProcessConcern;
  pendingApprovalsCount?: number;
  onOpenAdminPanel: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  currentView,
  onChangeView,
  currentUser,
  activeConcern,
  pendingApprovalsCount = 0,
  onOpenAdminPanel,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const handleNavClick = (view: AppView) => {
    onChangeView(view);
    if (onCloseMobile) onCloseMobile();
  };

  const sidebarContent = (
    <div className="w-64 bg-white flex flex-col justify-between p-4 h-full select-none">
      {/* Top: Brand & Navigation */}
      <div>
        {/* Walton Logo (Centered & Prominent matching ac-process-monthly-report) */}
        <div className="flex items-center justify-center text-center py-2.5 px-1 mb-3 border-b border-slate-100">
          <img
            src="/walton-logo.png"
            alt="WALTON"
            className="h-12 sm:h-14 w-auto object-contain max-w-[200px] mx-auto drop-shadow-xs transition-all hover:scale-105"
          />
        </div>

        {/* System Subtitle */}
        <div className="text-center mb-4">
          <div className="text-[10.5px] font-mono font-black uppercase tracking-wider text-red-600 bg-red-50 border border-red-200/80 py-0.5 px-2.5 rounded-md inline-block">
            SOP AUTOMATION SYSTEM
          </div>
          <div className="text-[11px] font-bold text-slate-700 mt-1">AC Process Development</div>
        </div>

        {/* Vertical Navigation Tabs (Exact ac-process-monthly-report style) */}
        <nav className="space-y-1.5 font-medium">
          {/* Tab 1: Dashboard */}
          <button
            type="button"
            onClick={() => handleNavClick('dashboard')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-semibold transition text-left cursor-pointer ${
              currentView === 'dashboard'
                ? 'bg-[#2563EB] text-white shadow-md shadow-blue-500/25'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-base">🏠</span>
              <span>Dashboard</span>
            </div>
          </button>

          {/* Tab 2: Concern Workplace */}
          <button
            type="button"
            onClick={() => handleNavClick('workplace')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-semibold transition text-left cursor-pointer ${
              currentView === 'workplace'
                ? 'bg-[#2563EB] text-white shadow-md shadow-blue-500/25'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-base">{activeConcern.icon || '🏢'}</span>
              <div className="truncate max-w-[125px]" title={activeConcern.name}>
                <span className="block truncate">{activeConcern.shortName || 'Workplace'}</span>
              </div>
            </div>
            <span
              className={`text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded ${
                currentView === 'workplace' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {activeConcern.code}
            </span>
          </button>

          {/* Tab 3: SOP Studio (Editor & Live Canvas) */}
          <button
            type="button"
            onClick={() => handleNavClick('editor')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-semibold transition text-left cursor-pointer ${
              currentView === 'editor'
                ? 'bg-[#2563EB] text-white shadow-md shadow-blue-500/25'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-base">📝</span>
              <span>SOP Studio</span>
            </div>
            <span
              className={`text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded ${
                currentView === 'editor' ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-700'
              }`}
            >
              Live A4
            </span>
          </button>

          {/* Tab 4: Approval Route */}
          <button
            type="button"
            onClick={() => handleNavClick('approval_route')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-semibold transition text-left cursor-pointer ${
              currentView === 'approval_route'
                ? 'bg-[#2563EB] text-white shadow-md shadow-blue-500/25'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-base">📬</span>
              <span>Approval Route</span>
            </div>
            {pendingApprovalsCount > 0 && (
              <span
                className={`text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full ${
                  currentView === 'approval_route'
                    ? 'bg-white text-blue-700'
                    : 'bg-amber-100 text-amber-900 border border-amber-300'
                }`}
              >
                {pendingApprovalsCount}
              </span>
            )}
          </button>

          {/* Tab 5: Master Archive */}
          <button
            type="button"
            onClick={() => handleNavClick('archive')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-semibold transition text-left cursor-pointer ${
              currentView === 'archive'
                ? 'bg-[#2563EB] text-white shadow-md shadow-blue-500/25'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-base">📑</span>
              <span>Master Archive</span>
            </div>
            <span
              className={`text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded ${
                currentView === 'archive' ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-700'
              }`}
            >
              Locked
            </span>
          </button>

          {/* Tab 6: Plant Analytics */}
          <button
            type="button"
            onClick={() => handleNavClick('analytics')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-semibold transition text-left cursor-pointer ${
              currentView === 'analytics'
                ? 'bg-[#2563EB] text-white shadow-md shadow-blue-500/25'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-base">📊</span>
              <span>Plant Analytics</span>
            </div>
          </button>

          {/* Tab 7: Admin Panel (Accessible by Admin or clicked to open) */}
          <button
            type="button"
            onClick={() => {
              onOpenAdminPanel();
              if (onCloseMobile) onCloseMobile();
            }}
            className="w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-semibold transition text-left text-slate-600 hover:text-slate-900 hover:bg-slate-50 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="text-base">⚙️</span>
              <span>Admin Panel</span>
            </div>
            {currentUser?.role === 'admin' && (
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">
                Admin
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Bottom Sidebar Graphic & Walton Branding (From ac-process-monthly-report) */}
      <div className="pt-4 border-t border-slate-100 space-y-3 text-center">
        <div className="bg-gradient-to-b from-blue-50/70 to-slate-50/90 rounded-2xl p-3 border border-blue-100/60 shadow-xs">
          {/* Building Vector SVG Graphic */}
          <div className="w-12 h-12 mx-auto mb-1.5 flex items-center justify-center">
            <svg
              viewBox="0 0 64 64"
              fill="none"
              className="w-10 h-10 text-blue-400"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <rect x="8" y="20" width="20" height="38" rx="2" fill="#DBEAFE" stroke="#3B82F6" strokeWidth="1.5" />
              <rect x="34" y="10" width="22" height="48" rx="2" fill="#BFDBFE" stroke="#2563EB" strokeWidth="1.5" />
              <path
                d="M14 26h2M20 26h2M14 32h2M20 32h2M14 38h2M20 38h2M14 44h2M20 44h2"
                stroke="#2563EB"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M40 18h2M46 18h2M40 24h2M46 24h2M40 30h2M46 30h2M40 36h2M46 36h2M40 42h2M46 42h2"
                stroke="#1D4ED8"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="text-[11px] font-bold text-slate-700 leading-tight">
            Better Process
            <br />
            <span className="text-blue-600">Brighter Tomorrow</span>
          </div>
        </div>

        <div className="text-[10px] text-slate-400 leading-tight font-medium">
          <span className="font-bold text-slate-600">WALTON</span>
          <br />
          Hi-Tech Industries PLC
          <br />
          <span className="text-[9px] font-mono text-slate-400">Version 2.0</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar (Fixed w-64) */}
      <aside className="hidden lg:flex w-64 border-r border-slate-200/90 h-screen sticky top-0 z-30 shrink-0 no-print overflow-hidden">
        {sidebarContent}
      </aside>

      {/* Mobile / Tablet Offcanvas Drawer */}
      {isOpenMobile && (
        <div className="lg:hidden fixed inset-0 z-50 flex no-print animate-in fade-in duration-150">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative flex-1 flex flex-col max-w-[270px] w-full bg-white shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            <div className="absolute top-3 right-3 z-20">
              <button
                type="button"
                onClick={onCloseMobile}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer"
              >
                ✕
              </button>
            </div>
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
