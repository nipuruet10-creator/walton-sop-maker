import React, { useState, useEffect, useRef } from 'react';
import type { SOPDocument } from './types/sop';
import { defaultSopData } from './data/defaultSopData';
import { Navbar } from './components/Navbar';
import { ImageManager } from './components/InputPanel/ImageManager';
import { BanglishProcedureEditor } from './components/InputPanel/BanglishProcedureEditor';
import { HeaderEditor } from './components/InputPanel/HeaderEditor';
import { SafetyEditor } from './components/InputPanel/SafetyEditor';
import { TablesEditor } from './components/InputPanel/TablesEditor';
import { SOPPaper } from './components/Preview/SOPPaper';
import { ApiKeyModal } from './components/Modals/ApiKeyModal';
import {
  generateSOPWithGemini,
  offlineConvertBanglish,
  offlineConvertQualityPoints,
} from './services/banglishEngine';
import {
  generateSOPWithOpenRouter,
  generateQualityPointsWithOpenRouter,
  OPENROUTER_API_KEY_STORAGE,
  OPENROUTER_MODEL_STORAGE,
} from './services/openrouterService';
import { exportSOPToExcel } from './services/excelExporter';
import { downloadSOPAsPdf } from './services/pdfExporter';
import confetti from 'canvas-confetti';
import {
  Image as ImageIcon,
  Sparkles,
  FileText,
  ShieldCheck,
  Table as TableIcon,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  FileDown,
} from 'lucide-react';

const STORAGE_KEY = 'walton_sop_current_doc_v2';
const GEMINI_KEY_STORAGE = 'walton_sop_gemini_key';
const AI_PROVIDER_STORAGE = 'walton_sop_ai_provider';

type ActiveTab = 'photos' | 'procedure' | 'header' | 'safety' | 'tables';

export const App: React.FC = () => {
  // State
  const [data, setData] = useState<SOPDocument>(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) return JSON.parse(cached);
    } catch (e) {
      console.error('Failed to parse cached SOP', e);
    }
    return defaultSopData;
  });

  // OpenRouter & Gemini AI Settings
  const [openRouterKey, setOpenRouterKey] = useState<string>(() => {
    return localStorage.getItem(OPENROUTER_API_KEY_STORAGE) || '';
  });
  const [openRouterModel, setOpenRouterModel] = useState<string>(() => {
    return localStorage.getItem(OPENROUTER_MODEL_STORAGE) || 'openrouter/free';
  });
  const [geminiKey, setGeminiKey] = useState<string>(() => {
    return localStorage.getItem(GEMINI_KEY_STORAGE) || '';
  });
  const [activeProvider, setActiveProvider] = useState<'openrouter' | 'gemini'>(() => {
    const saved = localStorage.getItem(AI_PROVIDER_STORAGE);
    return saved === 'gemini' ? 'gemini' : 'openrouter';
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('photos');
  const [zoom, setZoom] = useState<number>(0.85);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isGeneratingQuality, setIsGeneratingQuality] = useState<boolean>(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);

  const importFileRef = useRef<HTMLInputElement>(null);

  // Auto-save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('LocalStorage quota reached, photos may be large', e);
    }
  }, [data]);

  // Keyboard shortcut listener (Ctrl+P to print)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        window.print();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSaveAiConfig = (config: {
    openRouterKey: string;
    openRouterModel: string;
    geminiKey: string;
    activeProvider: 'openrouter' | 'gemini';
  }) => {
    setOpenRouterKey(config.openRouterKey);
    setOpenRouterModel(config.openRouterModel);
    setGeminiKey(config.geminiKey);
    setActiveProvider(config.activeProvider);

    localStorage.setItem(OPENROUTER_API_KEY_STORAGE, config.openRouterKey);
    localStorage.setItem(OPENROUTER_MODEL_STORAGE, config.openRouterModel);
    localStorage.setItem(GEMINI_KEY_STORAGE, config.geminiKey);
    localStorage.setItem(AI_PROVIDER_STORAGE, config.activeProvider);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    try {
      exportSOPToExcel(data);
    } catch (err: any) {
      alert('Excel export error: ' + (err.message || 'Unknown error'));
    }
  };

  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    try {
      await downloadSOPAsPdf('sop-paper', data.header.processName);
    } catch (err: any) {
      alert('PDF generation error: ' + (err.message || 'Unknown error'));
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeName = data.header.processName.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'walton_sop';
    link.download = `${safeName}_backup.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = () => {
    importFileRef.current?.click();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.header && parsed.photos && parsed.procedure) {
          setData(parsed);
          alert('SOP document successfully loaded!');
        } else {
          alert('Invalid SOP JSON format.');
        }
      } catch (err) {
        alert('Failed to parse JSON file.');
      }
      if (importFileRef.current) importFileRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (confirm('Reset document to Walton sample default data? Any unsaved changes will be lost.')) {
      setData(defaultSopData);
    }
  };

  // Banglish to 100% Bengali SOP generation using OpenRouter AI / Gemini / Offline
  const handleAutoGenerate = async () => {
    if (!data.procedure.banglishInput.trim()) {
      alert('Please enter your procedure steps in Banglish inside the procedure tab first.');
      setActiveTab('procedure');
      return;
    }

    setIsGenerating(true);
    try {
      if (activeProvider === 'openrouter' && openRouterKey.trim()) {
        const result = await generateSOPWithOpenRouter(
          data.procedure.banglishInput,
          openRouterKey.trim(),
          openRouterModel,
          data.photos.length
        );
        setData(prev => ({
          ...prev,
          procedure: {
            ...prev.procedure,
            steps: result.steps,
            qualityPoints: result.qualityPoints,
            generalInstructions: result.generalInstructions,
          },
        }));
        confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
      } else if (activeProvider === 'gemini' && geminiKey.trim()) {
        const result = await generateSOPWithGemini(
          data.procedure.banglishInput,
          geminiKey.trim(),
          data.photos.length
        );
        setData(prev => ({
          ...prev,
          procedure: {
            ...prev.procedure,
            steps: result.steps,
            qualityPoints: result.qualityPoints,
            generalInstructions: result.generalInstructions,
          },
        }));
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      } else if (openRouterKey.trim()) {
        // Fallback to openrouter if key exists regardless of active provider
        const result = await generateSOPWithOpenRouter(
          data.procedure.banglishInput,
          openRouterKey.trim(),
          openRouterModel,
          data.photos.length
        );
        setData(prev => ({
          ...prev,
          procedure: {
            ...prev.procedure,
            steps: result.steps,
            qualityPoints: result.qualityPoints,
            generalInstructions: result.generalInstructions,
          },
        }));
        confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
      } else {
        // Use comprehensive offline converter
        const result = offlineConvertBanglish(data.procedure.banglishInput);
        setData(prev => ({
          ...prev,
          procedure: {
            ...prev.procedure,
            steps: result.steps,
            qualityPoints: result.qualityPoints,
            generalInstructions: result.generalInstructions,
          },
        }));
        confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } });
      }
    } catch (err: any) {
      alert(`AI Notice: ${err.message || 'Error running AI'}. Falling back to offline converter.`);
      const result = offlineConvertBanglish(data.procedure.banglishInput);
      setData(prev => ({
        ...prev,
        procedure: {
          ...prev.procedure,
          steps: result.steps,
          qualityPoints: result.qualityPoints,
          generalInstructions: result.generalInstructions,
        },
      }));
    } finally {
      setIsGenerating(false);
    }
  };

  // Dedicated Critical Quality Points (লক্ষণীয় বিষয়) AI Generation
  const handleAutoGenerateQuality = async () => {
    const input = data.procedure.qualityBanglishInput || '';
    if (!input.trim()) {
      alert('Please enter your Critical Quality Points in Banglish/English in the box first.');
      return;
    }

    setIsGeneratingQuality(true);
    try {
      if (openRouterKey.trim()) {
        const points = await generateQualityPointsWithOpenRouter(
          input,
          openRouterKey.trim(),
          openRouterModel
        );
        setData(prev => ({
          ...prev,
          procedure: {
            ...prev.procedure,
            qualityPoints: points,
          },
        }));
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      } else {
        const points = offlineConvertQualityPoints(input);
        setData(prev => ({
          ...prev,
          procedure: {
            ...prev.procedure,
            qualityPoints: points,
          },
        }));
        confetti({ particleCount: 30, spread: 40, origin: { y: 0.7 } });
      }
    } catch (err: any) {
      alert(`Quality Points AI Notice: ${err.message || 'Error running AI'}. Falling back to offline converter.`);
      const points = offlineConvertQualityPoints(input);
      setData(prev => ({
        ...prev,
        procedure: {
          ...prev.procedure,
          qualityPoints: points,
        },
      }));
    } finally {
      setIsGeneratingQuality(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-200 text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* Hidden Import Input */}
      <input
        type="file"
        ref={importFileRef}
        onChange={handleImportFile}
        accept=".json"
        className="hidden"
      />

      {/* Top Navbar */}
      <Navbar
        onPrint={handlePrint}
        onDownloadPdf={handleDownloadPdf}
        onExportExcel={handleExportExcel}
        onExportJson={handleExportJson}
        onImportJson={handleImportJson}
        onReset={handleReset}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        hasApiKey={Boolean(openRouterKey || geminiKey)}
        activeProvider={activeProvider}
        activeModel={openRouterModel}
        zoom={zoom}
        setZoom={setZoom}
        onAutoGenerate={handleAutoGenerate}
        isGenerating={isGenerating}
        isDownloadingPdf={isDownloadingPdf}
      />

      {/* Main Workspace (Split View) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Side: Input Panel */}
        <aside
          className={`no-print bg-white border-r border-slate-300 flex flex-col transition-all duration-300 z-20 shrink-0 ${
            isSidebarOpen ? 'w-full sm:w-[420px] lg:w-[480px]' : 'w-0'
          }`}
        >
          {isSidebarOpen && (
            <div className="flex flex-col h-full overflow-hidden">
              {/* Quick Export Bar in Panel */}
              <div className="bg-slate-900 px-3 py-2 flex items-center justify-between gap-2 border-b border-slate-800 text-white">
                <span className="text-[11px] font-semibold text-slate-300">Quick Download:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportExcel}
                    className="flex items-center gap-1 bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-bold px-2.5 py-1 rounded transition cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3 h-3 text-emerald-300" />
                    <span>Excel (.xlsx)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    disabled={isDownloadingPdf}
                    className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold px-2.5 py-1 rounded transition cursor-pointer disabled:opacity-50"
                  >
                    <FileDown className="w-3 h-3 text-blue-200" />
                    <span>{isDownloadingPdf ? 'Creating...' : 'PDF'}</span>
                  </button>
                </div>
              </div>

              {/* Tabs Header */}
              <div className="bg-slate-100 border-b border-slate-200 p-1.5 flex items-center justify-between gap-1 shrink-0 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setActiveTab('photos')}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    activeTab === 'photos'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Photos ({data.photos.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('procedure')}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    activeTab === 'procedure'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Procedure & AI</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('header')}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    activeTab === 'header'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Header</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('safety')}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    activeTab === 'safety'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Safety</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('tables')}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    activeTab === 'tables'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  <span>Tables</span>
                </button>
              </div>

              {/* Tab Content Panel (Scrollable) */}
              <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
                {activeTab === 'photos' && (
                  <ImageManager
                    photos={data.photos}
                    onChange={(photos) => setData({ ...data, photos })}
                    imageFit={data.imageFit || 'contain'}
                    onUpdateFit={(fit) => setData({ ...data, imageFit: fit })}
                    gridCols={data.gridCols || 0}
                    onUpdateGridCols={(cols) => setData({ ...data, gridCols: cols })}
                  />
                )}

                {activeTab === 'procedure' && (
                  <BanglishProcedureEditor
                    procedure={data.procedure}
                    onChange={(procedure) => setData({ ...data, procedure })}
                    onGenerate={handleAutoGenerate}
                    isGenerating={isGenerating}
                    onGenerateQuality={handleAutoGenerateQuality}
                    isGeneratingQuality={isGeneratingQuality}
                    hasApiKey={Boolean(openRouterKey || geminiKey)}
                    activeProvider={activeProvider}
                    activeModel={openRouterModel}
                    onOpenAiModal={() => setIsApiKeyModalOpen(true)}
                  />
                )}

                {activeTab === 'header' && (
                  <HeaderEditor
                    header={data.header}
                    onChange={(header) => setData({ ...data, header })}
                  />
                )}

                {activeTab === 'safety' && (
                  <SafetyEditor
                    safety={data.safety}
                    onChange={(safety) => setData({ ...data, safety })}
                  />
                )}

                {activeTab === 'tables' && (
                  <TablesEditor
                    parts={data.parts}
                    tools={data.tools}
                    onPartsChange={(parts) => setData({ ...data, parts })}
                    onToolsChange={(tools) => setData({ ...data, tools })}
                  />
                )}
              </div>
            </div>
          )}
        </aside>

        {/* Sidebar Toggle Handle */}
        <button
          type="button"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="no-print absolute left-[420px] lg:left-[480px] top-4 z-30 bg-white border border-slate-300 rounded-r-lg p-1.5 shadow-md hover:bg-slate-100 text-slate-600 transition cursor-pointer"
          style={{ left: isSidebarOpen ? undefined : 0 }}
          title={isSidebarOpen ? 'Collapse Input Panel' : 'Expand Input Panel'}
        >
          {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        {/* Right Side: Live A4 Landscape Canvas */}
        <main className="flex-1 bg-slate-300/80 overflow-auto flex items-start justify-center p-6 md:p-10 relative">
          <div
            id="sop-paper-wrapper"
            className="transition-transform duration-200 origin-top shadow-2xl rounded-xs print:shadow-none"
            style={{
              transform: `scale(${zoom})`,
            }}
          >
            <SOPPaper
              data={data}
              onUpdateHeader={(updates) =>
                setData((prev) => ({ ...prev, header: { ...prev.header, ...updates } }))
              }
              onUpdateStep={(idx, val) => {
                const steps = [...data.procedure.steps];
                steps[idx] = val;
                setData((prev) => ({ ...prev, procedure: { ...prev.procedure, steps } }));
              }}
              onUpdateQuality={(idx, val) => {
                const qualityPoints = [...data.procedure.qualityPoints];
                qualityPoints[idx] = val;
                setData((prev) => ({ ...prev, procedure: { ...prev.procedure, qualityPoints } }));
              }}
              onUpdateGeneral={(idx, val) => {
                const generalInstructions = [...data.procedure.generalInstructions];
                generalInstructions[idx] = val;
                setData((prev) => ({ ...prev, procedure: { ...prev.procedure, generalInstructions } }));
              }}
            />
          </div>
        </main>
      </div>

      {/* AI Configuration Modal (OpenRouter & Gemini) */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        openRouterKey={openRouterKey}
        openRouterModel={openRouterModel}
        geminiKey={geminiKey}
        activeProvider={activeProvider}
        onSaveConfig={handleSaveAiConfig}
      />
    </div>
  );
};

export default App;
