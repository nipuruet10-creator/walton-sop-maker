import React from 'react';
import { Printer, Download, Upload, RotateCcw, Sparkles, ZoomIn, ZoomOut, Maximize2, FileSpreadsheet, FileDown } from 'lucide-react';

interface NavbarProps {
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
    <header className="no-print bg-slate-900 text-white border-b border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-md sticky top-0 z-40">
      {/* Brand & Title */}
      <div className="flex items-center gap-3">
        <div className="bg-white p-1.5 rounded flex items-center justify-center shadow-inner">
          <img src="/logo-walton.svg" alt="Walton Logo" className="h-6 object-contain" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
              Walton SOP Maker
              <span className="text-xs bg-blue-600/90 text-white font-medium px-2 py-0.5 rounded-full">v1.1 Vercel</span>
            </h1>
          </div>
          <p className="text-[11px] text-slate-400 font-sans hidden sm:block">
            Manufacturing Standard Operating Procedure Auto-Generator & A4 Precision Formatter
          </p>
        </div>
      </div>

      {/* Center AI Quick Trigger */}
      <div className="flex items-center gap-2">
        <button
          onClick={onAutoGenerate}
          disabled={isGenerating}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          title="Convert Banglish notes into formal industrial Bengali SOP"
        >
          <Sparkles className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin text-amber-300' : 'text-amber-300'}`} />
          <span>{isGenerating ? 'AI Generating (বাংলায় তৈরি হচ্ছে)...' : 'Banglish → 100% Bengali AI'}</span>
        </button>
      </div>

      {/* Right Action Tools */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Zoom Controls */}
        <div className="flex items-center bg-slate-800 rounded-lg p-0.5 text-xs text-slate-300 border border-slate-700">
          <button
            onClick={() => setZoom(z => Math.max(0.4, Number((z - 0.1).toFixed(1))))}
            className="p-1 hover:text-white hover:bg-slate-700 rounded transition cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="px-2 font-mono text-[11px] select-none">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom(z => Math.min(1.6, Number((z + 0.1).toFixed(1))))}
            className="p-1 hover:text-white hover:bg-slate-700 rounded transition cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoom(1)}
            className="p-1 hover:text-white hover:bg-slate-700 rounded transition ml-1 cursor-pointer"
            title="100% Fit"
          >
            <Maximize2 className="w-3 h-3" />
          </button>
        </div>

        {/* AI Key & Model Configuration Button */}
        <button
          onClick={onOpenApiKeyModal}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
            hasApiKey
              ? 'bg-blue-950/70 text-blue-200 border-blue-600 hover:bg-blue-900/70 shadow-xs'
              : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
          }`}
          title="Configure OpenRouter / Gemini AI Models"
        >
          <Sparkles className={`w-3.5 h-3.5 ${hasApiKey ? 'text-amber-300' : 'text-slate-400'}`} />
          <span className="hidden md:inline">
            {hasApiKey
              ? activeProvider === 'openrouter'
                ? `AI: ${activeModel.replace(':free', '').split('/').pop()}`
                : 'Gemini AI Ready'
              : 'Free AI Setup'}
          </span>
          {hasApiKey && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse hidden sm:inline-block" />
          )}
        </button>

        {/* Export to Excel Button */}
        <button
          onClick={onExportExcel}
          className="flex items-center gap-1.5 bg-emerald-800 hover:bg-emerald-700 text-emerald-100 border border-emerald-600 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer active:scale-95"
          title="Export SOP data into structured Microsoft Excel (.xlsx)"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-300" />
          <span>Excel (.xlsx)</span>
        </button>

        {/* Download Direct PDF Button */}
        <button
          onClick={onDownloadPdf}
          disabled={isDownloadingPdf}
          className="flex items-center gap-1.5 bg-blue-700 hover:bg-blue-600 text-white border border-blue-500 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer active:scale-95 disabled:opacity-50"
          title="Download high-resolution A4 Landscape PDF directly"
        >
          <FileDown className="w-3.5 h-3.5 text-blue-200" />
          <span>{isDownloadingPdf ? 'Creating PDF...' : 'Download PDF'}</span>
        </button>

        {/* Print / Save PDF Primary CTA */}
        <button
          onClick={onPrint}
          className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium shadow transition cursor-pointer active:scale-95"
          title="Print or Save via Browser Dialog (Ctrl+P)"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print</span>
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
        <button
          onClick={onReset}
          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition cursor-pointer"
          title="Reset to Walton Sample Format"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
