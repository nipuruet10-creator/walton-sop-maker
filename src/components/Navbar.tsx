import React from 'react';
import type { UserProfile } from '../types/auth';
import {
  Printer,
  Download,
  Upload,
  RotateCcw,
  Sparkles,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileSpreadsheet,
  FileDown,
  LogIn,
  LogOut,
  FolderArchive,
  ShieldCheck,
  BarChart3,
  ShieldAlert,
} from 'lucide-react';

interface NavbarProps {
  currentUser: UserProfile | null;
  onOpenLogin: () => void;
  onLogout: () => void;
  onOpenWorkspace: () => void;
  onOpenConcernSection: () => void;
  onOpenAnalytics: () => void;
  onOpenAdminPanel: () => void;
  onPrint: () => void;
  onDownloadPdf: () => void;
  onExportExcel: () => void;
  onExportJson: () => void;
  onImportJson: () => void;
  onReset: () => void;
  onOpenApiKeyModal: () => void;
  hasApiKey: boolean;
  activeProvider?: 'openrouter' | 'gemini';
  activeModel?: string;
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  onAutoGenerate: () => void;
  isGenerating: boolean;
  isDownloadingPdf?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onOpenLogin,
  onLogout,
  onOpenWorkspace,
  onOpenConcernSection,
  onOpenAnalytics,
  onOpenAdminPanel,
  onPrint,
  onDownloadPdf,
  onExportExcel,
  onExportJson,
  onImportJson,
  onReset,
  onOpenApiKeyModal,
  hasApiKey,
  activeProvider = 'openrouter',
  activeModel = 'openrouter/free',
  zoom,
  setZoom,
  onAutoGenerate,
  isGenerating,
  isDownloadingPdf = false,
}) => {
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
            onClick={onOpenConcernSection}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 border border-emerald-700/60 text-xs font-semibold transition cursor-pointer"
            title="অনুমোদিত SOP কেন্দ্রীয় আর্কাইভ ও সরাসরি PDF ডাউনলোড"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>কনসার্ন সেকশন</span>
          </button>

          <button
            type="button"
            onClick={onOpenAnalytics}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-300 border border-slate-700 text-xs font-semibold transition cursor-pointer"
            title="মাসভিত্তিক ও ইউজারভিত্তিক SOP সম্পন্ন রিপোর্ট"
          >
            <BarChart3 className="w-3.5 h-3.5 text-blue-400" />
            <span>অ্যানালিটিক্স</span>
          </button>

          {currentUser?.role === 'admin' && (
            <button
              type="button"
              onClick={onOpenAdminPanel}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-950/70 hover:bg-rose-900 text-rose-200 border border-rose-800/80 text-xs font-semibold transition cursor-pointer"
              title="ইউজার ম্যানেজমেন্ট ও পাসওয়ার্ড রিকভারি"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>অ্যাডমিন</span>
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

      {/* Right: User Profile, Export & Utility Tools */}
      <div className="flex items-center gap-2 flex-wrap">
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
              className="ml-1 p-1 hover:bg-slate-700 text-blue-300 rounded transition cursor-pointer"
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
            onClick={onOpenConcernSection}
            className="p-1.5 rounded-lg bg-emerald-900/60 text-emerald-300 border border-emerald-700"
            title="কনসার্ন সেকশন"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
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

        {/* AI Key Config */}
        <button
          onClick={onOpenApiKeyModal}
          className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
            hasApiKey
              ? 'bg-blue-950/70 text-blue-200 border-blue-600 hover:bg-blue-900/70 shadow-xs'
              : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
          }`}
          title="Configure OpenRouter / Gemini AI Models"
        >
          <Sparkles className={`w-3.5 h-3.5 ${hasApiKey ? 'text-amber-300' : 'text-slate-400'}`} />
          <span className="hidden 2xl:inline">
            {hasApiKey
              ? activeProvider === 'openrouter'
                ? `AI: ${activeModel.replace(':free', '').split('/').pop()}`
                : 'Gemini AI Ready'
              : 'Free AI Setup'}
          </span>
        </button>

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

        {/* Reset */}
        <button
          onClick={onReset}
          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition cursor-pointer"
          title="Reset to Walton Sample"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
