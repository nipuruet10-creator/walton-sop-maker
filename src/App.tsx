import React, { useState, useEffect, useRef } from 'react';
import type { SOPDocument } from './types/sop';
import type { UserProfile, NotificationItem } from './types/auth';
import { defaultSopData } from './data/defaultSopData';
import { Navbar } from './components/Navbar';
import { WorkflowActionBar } from './components/Workflow/WorkflowActionBar';
import { ImageManager } from './components/InputPanel/ImageManager';
import { BanglishProcedureEditor } from './components/InputPanel/BanglishProcedureEditor';
import { HeaderEditor } from './components/InputPanel/HeaderEditor';
import { SafetyEditor } from './components/InputPanel/SafetyEditor';
import { TablesEditor } from './components/InputPanel/TablesEditor';
import { SOPPaper } from './components/Preview/SOPPaper';
import { LoginModal } from './components/Auth/LoginModal';
import { UserWorkspaceModal } from './components/Workspace/UserWorkspaceModal';
import { MasterArchiveModal } from './components/Archive/MasterArchiveModal';
import { AnalyticsDashboardModal } from './components/Analytics/AnalyticsDashboardModal';
import { AdminPanelModal } from './components/Admin/AdminPanelModal';
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
import {
  getActiveUserSession,
  setActiveUserSession,
  getGlobalAiConfig,
  getUserNotifications,
  getSOPById,
  getUserWorkingDraft,
  saveUserWorkingDraft,
  createDefaultSopForUser,
  pullAllSopsFromCloud,
} from './services/storageService';
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
  Type,
  LayoutGrid,
  RotateCcw,
} from 'lucide-react';

const GEMINI_KEY_STORAGE = 'walton_sop_gemini_key';

type ActiveTab = 'photos' | 'procedure' | 'header' | 'safety' | 'tables';

export const App: React.FC = () => {
  // User session state (mandatory login on first visit or when logged out)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    return getActiveUserSession() || null;
  });

  // Current SOP document state - strictly isolated per logged-in user!
  const [data, setData] = useState<SOPDocument>(() => {
    const session = getActiveUserSession();
    if (session) {
      try {
        const cached = localStorage.getItem(`walton_sop_user_draft_v2_${session.id}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          // Purge trial BOPP Tape draft if present to guarantee clean blank default
          if (
            parsed.header?.processName?.includes('BOPP Tape') ||
            (parsed.photos && parsed.photos.some((p: any) => p.url?.includes('Tape Dispenser') || p.name?.includes('Pasted Image')))
          ) {
            localStorage.removeItem(`walton_sop_user_draft_v2_${session.id}`);
            return createDefaultSopForUser(session);
          }
          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse cached user SOP', e);
      }
      return createDefaultSopForUser(session);
    }
    return defaultSopData;
  });

  // Modals state
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(() => {
    return !getActiveUserSession();
  });
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState<boolean>(false);
  const [isMasterArchiveOpen, setIsMasterArchiveOpen] = useState<boolean>(false);
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState<boolean>(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);

  // Centralized AI Settings from storage
  const [openRouterKey, setOpenRouterKey] = useState<string>(() => {
    return getGlobalAiConfig().openRouterKey || localStorage.getItem(OPENROUTER_API_KEY_STORAGE) || '';
  });
  const [openRouterModel, setOpenRouterModel] = useState<string>(() => {
    return getGlobalAiConfig().openRouterModel || localStorage.getItem(OPENROUTER_MODEL_STORAGE) || 'openrouter/free';
  });
  const [geminiKey, setGeminiKey] = useState<string>(() => {
    return getGlobalAiConfig().geminiKey || localStorage.getItem(GEMINI_KEY_STORAGE) || '';
  });
  const [activeProvider, setActiveProvider] = useState<'openrouter' | 'gemini'>(() => {
    return getGlobalAiConfig().activeProvider || 'openrouter';
  });

  // Sync AI configuration whenever Admin Panel closes or changes
  useEffect(() => {
    const cfg = getGlobalAiConfig();
    if (cfg.openRouterKey) setOpenRouterKey(cfg.openRouterKey);
    if (cfg.openRouterModel) setOpenRouterModel(cfg.openRouterModel);
    if (cfg.geminiKey) setGeminiKey(cfg.geminiKey);
    if (cfg.activeProvider) setActiveProvider(cfg.activeProvider);
  }, [isAdminModalOpen]);

  const [activeTab, setActiveTab] = useState<ActiveTab>('photos');
  const [zoom, setZoom] = useState<number>(0.85);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isGeneratingQuality, setIsGeneratingQuality] = useState<boolean>(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);

  // Live Notifications
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const refreshNotifications = async () => {
    if (currentUser) {
      try {
        const notifs = await getUserNotifications(currentUser);
        setNotifications(notifs);
      } catch (e) {
        console.warn('Error loading notifications:', e);
      }
    } else {
      setNotifications([]);
    }
  };

  useEffect(() => {
    refreshNotifications();
    const interval = setInterval(refreshNotifications, 4000);
    return () => clearInterval(interval);
  }, [currentUser]);

  useEffect(() => {
    refreshNotifications();
  }, [data.status, data.updatedAt]);

  // Continuous background cloud sync for cross-PC collaboration (every 4 seconds)
  useEffect(() => {
    let isCancelled = false;

    const runBackgroundSync = async () => {
      if (document.hidden) return;
      try {
        const cloudSops = await pullAllSopsFromCloud();
        if (isCancelled || !cloudSops || cloudSops.length === 0) return;

        // Check if our active document has been approved or updated on another PC
        setData((prev) => {
          if (!prev) return prev;
          const match = cloudSops.find(
            (s) =>
              (prev.id && s.id === prev.id) ||
              (s.header?.processName &&
                prev.header?.processName &&
                s.header.processName.trim().toLowerCase() === prev.header.processName.trim().toLowerCase())
          );

          if (match) {
            const cloudTime = new Date(match.updatedAt || 0).getTime();
            const localTime = new Date(prev.updatedAt || 0).getTime();

            if (match.status === 'approved' && prev.status !== 'approved') {
              if (currentUser) {
                localStorage.setItem(`walton_sop_user_draft_v2_${currentUser.id}`, JSON.stringify(match));
              }
              return match;
            }
            if (cloudTime > localTime && match.status !== prev.status) {
              if (currentUser) {
                localStorage.setItem(`walton_sop_user_draft_v2_${currentUser.id}`, JSON.stringify(match));
              }
              return match;
            }
          }
          return prev;
        });

        refreshNotifications();
      } catch {}
    };

    const interval = setInterval(runBackgroundSync, 4000);
    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [currentUser?.id]);

  // Real-time synchronization listener across tabs/sessions
  useEffect(() => {
    const handleSopUpdate = (e: any) => {
      const updated: SOPDocument = e.detail;
      if (!updated) return;

      // If the current document matches or belongs to this user, update it immediately!
      setData((prev) => {
        if (prev.id === updated.id) {
          return updated;
        }
        if (
          !prev.id &&
          updated.header?.processName &&
          prev.header?.processName &&
          updated.header.processName.toLowerCase().trim() === prev.header.processName.toLowerCase().trim()
        ) {
          return updated;
        }
        if (
          currentUser &&
          (updated.authorId === currentUser.id ||
            updated.header?.preparedBy?.name?.includes(currentUser.username) ||
            (currentUser.employeeId && updated.header?.preparedBy?.name?.includes(currentUser.employeeId)))
        ) {
          if (
            prev.header?.processName === updated.header?.processName ||
            prev.header?.referenceNo === updated.header?.referenceNo
          ) {
            return updated;
          }
        }
        return prev;
      });

      refreshNotifications();
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'walton_sop_last_updated' || e.key?.startsWith('walton_sop_user_draft_v2_')) {
        refreshNotifications();
        if (currentUser) {
          getUserWorkingDraft(currentUser.id).then((draft) => {
            if (draft && draft.id) {
              setData((prev) => (prev.id === draft.id ? draft : prev));
            }
          });
        }
      }
    };

    window.addEventListener('walton_sop_updated', handleSopUpdate as EventListener);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('walton_sop_updated', handleSopUpdate as EventListener);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [currentUser]);

  const handleSelectSopById = async (sopId: string) => {
    try {
      const targetDoc = await getSOPById(sopId);
      if (targetDoc) {
        setData(targetDoc);
      } else {
        alert('SOP document not found.');
      }
    } catch (e: any) {
      alert('Failed to load SOP: ' + e.message);
    }
  };

  const importFileRef = useRef<HTMLInputElement>(null);

  // Auto-save strictly to currentUser's working draft
  useEffect(() => {
    if (currentUser) {
      saveUserWorkingDraft(currentUser.id, data);
    }
  }, [data, currentUser?.id]);

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

  const handleLoginSuccess = async (user: UserProfile) => {
    setCurrentUser(user);
    setActiveUserSession(user);
    setIsLoginModalOpen(false);
    try {
      const draft = await getUserWorkingDraft(user.id);
      if (draft) {
        setData(draft);
      } else {
        const fresh = createDefaultSopForUser(user);
        setData(fresh);
        await saveUserWorkingDraft(user.id, fresh);
      }
    } catch {
      const fresh = createDefaultSopForUser(user);
      setData(fresh);
    }
  };

  const handleLogout = () => {
    if (currentUser) {
      saveUserWorkingDraft(currentUser.id, data);
    }
    setCurrentUser(null);
    setActiveUserSession(null);
    setData(defaultSopData);
    setIsLoginModalOpen(true);
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
      await downloadSOPAsPdf('sop-paper', data.header.processName, data.header.referenceNo);
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
    const cleanRef = (data.header.referenceNo || '')
      .replace(/[\r\n\t]/g, ' ')
      .replace(/[/\\:*?"<>|]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    const cleanProc = (data.header.processName || '')
      .replace(/[\r\n\t]/g, ' ')
      .replace(/[/\\:*?"<>|]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    let fileName = '';
    if (cleanRef && cleanProc) {
      fileName = `${cleanRef} - ${cleanProc}`;
    } else if (cleanRef) {
      fileName = cleanRef;
    } else if (cleanProc) {
      fileName = cleanProc;
    } else {
      fileName = 'Walton_SOP';
    }

    link.download = `${fileName}_backup.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.header && parsed.procedure) {
          setData(parsed);
          alert('SOP JSON data loaded successfully!');
        } else {
          alert('Invalid SOP JSON structure.');
        }
      } catch (err) {
        alert('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
    if (importFileRef.current) importFileRef.current.value = '';
  };

  const handleNewSop = () => {
    const hasContent =
      Boolean(data.header.processName?.trim()) ||
      Boolean(data.header.model?.trim()) ||
      data.photos.length > 0 ||
      data.procedure.steps.length > 0;

    if (hasContent) {
      const confirmNew = window.confirm(
        'Are you sure you want to create a new blank SOP? Current unsaved inputs will be cleared.'
      );
      if (!confirmNew) return;
    }

    if (currentUser) {
      const fresh = createDefaultSopForUser(currentUser);
      setData(fresh);
      saveUserWorkingDraft(currentUser.id, fresh);
      setIsWorkspaceModalOpen(false);
    } else {
      setData(defaultSopData);
    }
  };

  const handleResetSop = () => {
    if (data.status === 'approved') {
      alert('This SOP has been officially approved and locked. Form reset is disabled.');
      return;
    }
    const confirmReset = window.confirm(
      'Are you sure you want to clear and reset all fields, photos, and procedure steps of the current SOP?'
    );
    if (!confirmReset) return;

    if (currentUser) {
      const fresh = createDefaultSopForUser(currentUser);
      setData(fresh);
      saveUserWorkingDraft(currentUser.id, fresh);
    } else {
      setData(defaultSopData);
    }
  };

  // Main Procedure Step Generation
  const handleAutoGenerate = async () => {
    const input = data.procedure.banglishInput;
    if (!input || input.trim() === '') {
      alert('Please write or paste your Banglish notes in the editor first!');
      return;
    }

    setIsGenerating(true);
    try {
      const globalCfg = getGlobalAiConfig();
      const effProvider = globalCfg.activeProvider || activeProvider;
      const effOpenRouterKey = globalCfg.openRouterKey || openRouterKey;
      const effOpenRouterModel = globalCfg.openRouterModel || openRouterModel;
      const effGeminiKey = globalCfg.geminiKey || geminiKey;

      let result;
      if (effProvider === 'gemini' && effGeminiKey) {
        result = await generateSOPWithGemini(input, effGeminiKey, data.photos.length);
      } else if (effOpenRouterKey) {
        result = await generateSOPWithOpenRouter(input, effOpenRouterKey, effOpenRouterModel, data.photos.length);
      } else {
        result = offlineConvertBanglish(input);
      }

      setData((prev) => ({
        ...prev,
        procedure: {
          ...prev.procedure,
          steps: result.steps.length > 0 ? result.steps : prev.procedure.steps,
          qualityPoints:
            result.qualityPoints.length > 0 ? result.qualityPoints : prev.procedure.qualityPoints,
          generalInstructions:
            result.generalInstructions.length > 0
              ? result.generalInstructions
              : prev.procedure.generalInstructions,
        },
      }));

      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
        });
      } catch {}
    } catch (err: any) {
      console.warn('Procedure generation encountered error, falling back to offline engine:', err);
      const fallback = offlineConvertBanglish(input);
      setData((prev) => ({
        ...prev,
        procedure: {
          ...prev.procedure,
          steps: fallback.steps.length > 0 ? fallback.steps : prev.procedure.steps,
          qualityPoints:
            fallback.qualityPoints.length > 0 ? fallback.qualityPoints : prev.procedure.qualityPoints,
          generalInstructions:
            fallback.generalInstructions.length > 0
              ? fallback.generalInstructions
              : prev.procedure.generalInstructions,
        },
      }));
    } finally {
      setIsGenerating(false);
    }
  };

  // Dedicated Critical Quality Points Generation
  const handleAutoGenerateQuality = async () => {
    const input = data.procedure.qualityBanglishInput;
    if (!input || input.trim() === '') {
      alert('Please enter Banglish notes in the Critical Quality Points box first!');
      return;
    }

    setIsGeneratingQuality(true);
    try {
      const globalCfg = getGlobalAiConfig();
      const effOpenRouterKey = globalCfg.openRouterKey || openRouterKey;
      const effOpenRouterModel = globalCfg.openRouterModel || openRouterModel;

      let points: string[];
      if (effOpenRouterKey) {
        points = await generateQualityPointsWithOpenRouter(input, effOpenRouterKey, effOpenRouterModel);
      } else {
        points = offlineConvertQualityPoints(input);
      }

      if (points && points.length > 0) {
        setData((prev) => ({
          ...prev,
          procedure: {
            ...prev.procedure,
            qualityPoints: points,
          },
        }));

        try {
          confetti({
            particleCount: 35,
            spread: 50,
            origin: { y: 0.8 },
          });
        } catch {}
      }
    } catch (err: any) {
      console.warn('Quality points encountered error, falling back to offline engine:', err);
      const fallbackPoints = offlineConvertQualityPoints(input);
      if (fallbackPoints.length > 0) {
        setData((prev) => ({
          ...prev,
          procedure: {
            ...prev.procedure,
            qualityPoints: fallbackPoints,
          },
        }));
      }
    } finally {
      setIsGeneratingQuality(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-200 font-sans select-none print:h-auto print:overflow-visible print:bg-white">
      {/* Hidden file input for JSON import */}
      <input
        type="file"
        ref={importFileRef}
        onChange={handleImportJson}
        accept=".json,application/json"
        className="hidden"
      />

      {/* Top Application Navbar */}
      <Navbar
        currentUser={currentUser}
        notifications={notifications}
        onSelectSopById={handleSelectSopById}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        onOpenWorkspace={() => setIsWorkspaceModalOpen(true)}
        onOpenMasterArchive={() => setIsMasterArchiveOpen(true)}
        onOpenAnalytics={() => setIsAnalyticsModalOpen(true)}
        onOpenAdminPanel={() => setIsAdminModalOpen(true)}
        onPrint={handlePrint}
        onDownloadPdf={handleDownloadPdf}
        onExportExcel={handleExportExcel}
        onExportJson={handleExportJson}
        onImportJson={() => importFileRef.current?.click()}
        zoom={zoom}
        setZoom={setZoom}
        onAutoGenerate={handleAutoGenerate}
        isGenerating={isGenerating}
        isDownloadingPdf={isDownloadingPdf}
        onNewSop={handleNewSop}
        onResetSop={handleResetSop}
        isSopApproved={data.status === 'approved'}
      />

      {/* Workflow & Approval Status Action Bar */}
      <WorkflowActionBar
        currentSop={data}
        currentUser={currentUser}
        onUpdateSop={(updated) => setData(updated)}
        onOpenWorkspace={() => setIsWorkspaceModalOpen(true)}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onNewSop={handleNewSop}
        onResetSop={handleResetSop}
      />

      {/* Main Workspace Area (Left Input Panel + Right Live Canvas) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Side: Input Panel (Collapsible) */}
        <aside
          className={`no-print transition-all duration-300 ease-in-out bg-white border-r border-slate-300 flex flex-col z-20 shrink-0 ${
            isSidebarOpen ? 'w-[420px] lg:w-[480px]' : 'w-0'
          }`}
          style={{ overflow: isSidebarOpen ? 'visible' : 'hidden' }}
        >
          {isSidebarOpen && (
            <div className="flex flex-col h-full overflow-hidden">
              {/* Panel Header & Quick Actions */}
              <div className="p-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    SOP Parameter Editor
                  </h2>
                  <p className="text-[10px] text-slate-400">
                    {data.status === 'approved' ? 'Officially Approved & Locked' : 'Images, Banglish procedure, header & tables'}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  {data.status !== 'approved' && (
                    <button
                      type="button"
                      onClick={handleResetSop}
                      className="flex items-center gap-1 bg-rose-900/80 hover:bg-rose-800 text-rose-200 text-[11px] font-bold px-2 py-1 rounded transition cursor-pointer border border-rose-700/60"
                      title="Reset all form inputs"
                    >
                      <RotateCcw className="w-3 h-3 text-rose-300" />
                      <span>Reset</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleExportExcel}
                    className="flex items-center gap-1 bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-bold px-2.5 py-1 rounded transition cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3 h-3 text-emerald-200" />
                    <span>Excel</span>
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

              {/* Approved Document Lock Banner */}
              {data.status === 'approved' && (
                <div className="bg-emerald-50 border-b border-emerald-200 p-2.5 flex items-center gap-2 text-xs text-emerald-950">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div className="leading-tight">
                    <strong className="block text-emerald-900">Document Officially Approved</strong>
                    <span className="text-[10.5px] text-emerald-700">
                      Editing is locked to ensure compliance. Only official PDF download is enabled.
                    </span>
                  </div>
                </div>
              )}

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

              {/* Tab Content Panel (Scrollable, locked if approved) */}
              <div className={`flex-1 overflow-y-auto p-4 bg-slate-50 ${data.status === 'approved' ? 'pointer-events-none opacity-80' : ''}`}>
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
                    onOpenAiModal={() => {
                      if (currentUser?.role === 'admin') {
                        setIsAdminModalOpen(true);
                      } else {
                        alert('Central AI engine configuration is managed in the Admin Panel.');
                      }
                    }}
                    stepFontSize={data.stepFontSize || 'auto'}
                    onFontSizeChange={(stepFontSize) => setData((prev) => ({ ...prev, stepFontSize }))}
                    qualityFontSize={data.qualityFontSize || 'auto'}
                    onQualityFontSizeChange={(qualityFontSize) =>
                      setData((prev) => ({ ...prev, qualityFontSize }))
                    }
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
        <main className="flex-1 bg-slate-300/80 overflow-auto flex flex-col items-center justify-start p-6 md:p-10 relative">
          {/* Quick Floating Document Bar */}
          <div className="no-print mb-4 flex flex-wrap items-center justify-center gap-3 bg-white/95 backdrop-blur-xs px-4 py-2 rounded-xl shadow-md border border-slate-200 text-xs shrink-0 z-10">
            {/* Step Font Size Adjust */}
            <div className="flex items-center gap-1.5">
              <span className="flex items-center gap-1 font-semibold text-slate-700">
                <Type className="w-3.5 h-3.5 text-blue-600" />
                <span>Procedure Font:</span>
              </span>
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                {(
                  [
                    { id: 'auto', label: 'Auto' },
                    { id: 'compact', label: 'Compact' },
                    { id: 'normal', label: 'Normal' },
                    { id: 'large', label: 'Large' },
                    { id: 'xlarge', label: 'XL' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setData((prev) => ({ ...prev, stepFontSize: opt.id }))}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${
                      (data.stepFontSize || 'auto') === opt.id
                        ? 'bg-blue-600 text-white shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-4 w-px bg-slate-200 hidden sm:block" />

            {/* Quality Points Font Size Adjust */}
            <div className="flex items-center gap-1.5">
              <span className="flex items-center gap-1 font-semibold text-amber-800">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Key Points Font:</span>
              </span>
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                {(
                  [
                    { id: 'auto', label: 'Auto' },
                    { id: 'compact', label: 'Compact' },
                    { id: 'normal', label: 'Normal' },
                    { id: 'large', label: 'Large' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setData((prev) => ({ ...prev, qualityFontSize: opt.id }))}
                    className={`px-1.5 py-0.5 rounded text-[10.5px] font-medium transition cursor-pointer ${
                      (data.qualityFontSize || 'auto') === opt.id
                        ? 'bg-amber-600 text-white shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-4 w-px bg-slate-200 hidden sm:block" />

            {/* Photo Grid Columns */}
            <div className="flex items-center gap-1.5">
              <span className="flex items-center gap-1 font-semibold text-slate-700">
                <LayoutGrid className="w-3.5 h-3.5 text-blue-600" />
                <span>Columns:</span>
              </span>
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                {(
                  [
                    { id: 0, label: 'Auto' },
                    { id: 2, label: '2 Columns' },
                    { id: 3, label: '3 Columns' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setData((prev) => ({ ...prev, gridCols: opt.id }))}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${
                      (data.gridCols || 0) === opt.id
                        ? 'bg-blue-600 text-white shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-4 w-px bg-slate-200 hidden sm:block" />

            {/* Image Fit */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-700">Image Fit:</span>
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                {(
                  [
                    { id: 'contain', label: 'Contain' },
                    { id: 'cover', label: 'Cover' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setData((prev) => ({ ...prev, imageFit: opt.id }))}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${
                      (data.imageFit || 'contain') === opt.id
                        ? 'bg-blue-600 text-white shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

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
              onUpdateFontSize={(size) => setData((prev) => ({ ...prev, stepFontSize: size }))}
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

      {/* Master Archive / Prepared-by Grouped SOP Modal */}
      <MasterArchiveModal
        isOpen={isMasterArchiveOpen}
        onClose={() => setIsMasterArchiveOpen(false)}
        currentUser={currentUser}
        onSelectSop={(sop) => setData(sop)}
      />

      {/* Authentication Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen || !currentUser}
        isMandatory={!currentUser}
        onClose={() => {
          if (currentUser) {
            setIsLoginModalOpen(false);
          }
        }}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* User Personal Workspace Modal */}
      <UserWorkspaceModal
        isOpen={isWorkspaceModalOpen}
        onClose={() => setIsWorkspaceModalOpen(false)}
        currentUser={currentUser}
        onSelectSop={(sop) => setData(sop)}
        onNewSop={handleNewSop}
        onOpenLogin={() => setIsLoginModalOpen(true)}
      />

      {/* Analytics & Performance Dashboard Modal */}
      <AnalyticsDashboardModal
        isOpen={isAnalyticsModalOpen}
        onClose={() => setIsAnalyticsModalOpen(false)}
      />

      {/* Admin Panel Modal */}
      <AdminPanelModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        currentUser={currentUser}
      />
    </div>
  );
};

export default App;
