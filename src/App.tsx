import React, { useState, useEffect, useRef } from 'react';
import type { SOPDocument } from './types/sop';
import type { UserProfile, NotificationItem } from './types/auth';
import { defaultSopData } from './data/defaultSopData';
import {
  getConcernById,
  getConcernForUser,
  createStarterSOPForConcern,
  type ProcessConcern,
} from './data/concernData';
import { LeftSidebar, type AppView } from './components/Navigation/LeftSidebar';
import { TopExecutiveHeader } from './components/Navigation/TopExecutiveHeader';
import { ConcernDashboard } from './components/Dashboard/ConcernDashboard';
import { ConcernWorkplaceView } from './components/Workspace/ConcernWorkplaceView';
import { ApprovalRouteView } from './components/Workflow/ApprovalRouteView';
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
import {
  getActiveUserSession,
  setActiveUserSession,
  getGlobalAiConfig,
  saveGlobalAiConfig,
  getUserNotifications,
  getSOPById,
  getAllSOPs,
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
  Printer,
  Download,
} from 'lucide-react';

const GEMINI_KEY_STORAGE = 'walton_sop_gemini_key';

type ActiveTab = 'photos' | 'procedure' | 'header' | 'safety' | 'tables';

export const App: React.FC = () => {
  // User session state (mandatory login on first visit or when logged out)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    return getActiveUserSession() || null;
  });

  // Active Process Concern (Default to user's assigned concern)
  const [activeConcern, setActiveConcern] = useState<ProcessConcern>(() => {
    const session = getActiveUserSession();
    return getConcernForUser(session);
  });

  // Main View Router: 'dashboard' is the default executive landing view!
  const [currentView, setCurrentView] = useState<AppView>('dashboard');

  // Current SOP document state - strictly isolated per logged-in user!
  const [data, setData] = useState<SOPDocument>(() => {
    const session = getActiveUserSession();
    if (session) {
      try {
        const cached = localStorage.getItem(`walton_sop_user_draft_v2_${session.id}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (
            parsed.header?.processName?.includes('BOPP Tape') ||
            (parsed.photos &&
              parsed.photos.some(
                (p: any) => p.url?.includes('Tape Dispenser') || p.name?.includes('Pasted Image')
              ))
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
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState<boolean>(false);
  const [lastUsedEngine, setLastUsedEngine] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Centralized AI Settings from storage
  const [openRouterKey, setOpenRouterKey] = useState<string>(() => {
    return getGlobalAiConfig().openRouterKey || localStorage.getItem(OPENROUTER_API_KEY_STORAGE) || '';
  });
  const [openRouterModel, setOpenRouterModel] = useState<string>(() => {
    return (
      getGlobalAiConfig().openRouterModel ||
      localStorage.getItem(OPENROUTER_MODEL_STORAGE) ||
      'google/gemma-2-9b-it:free'
    );
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
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState<number>(0);

  const refreshNotifications = async () => {
    if (currentUser) {
      try {
        const notifs = await getUserNotifications(currentUser);
        setNotifications(notifs);

        const all = await getAllSOPs(false);
        const pending = all.filter(
          (s) =>
            s.status === 'forwarded_to_checker' ||
            s.status === 'checked' ||
            s.status === 'forwarded_to_approver'
        ).length;
        setPendingApprovalsCount(pending);
      } catch (e) {
        console.warn('Error loading notifications:', e);
      }
    } else {
      setNotifications([]);
      setPendingApprovalsCount(0);
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
        if (targetDoc.concernId) {
          const c = getConcernById(targetDoc.concernId);
          if (c) setActiveConcern(c);
        }
        setCurrentView('editor');
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

    const userConcern = getConcernForUser(user);
    setActiveConcern(userConcern);

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
    // Landing view stays on Dashboard as requested by user sequence!
    setCurrentView('dashboard');
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
          setCurrentView('editor');
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
      const fresh = createStarterSOPForConcern(activeConcern.id, currentUser);
      setData(fresh);
      saveUserWorkingDraft(currentUser.id, fresh);
      setIsWorkspaceModalOpen(false);
      setCurrentView('editor');
    } else {
      setData(defaultSopData);
      setCurrentView('editor');
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
      const fresh = createStarterSOPForConcern(activeConcern.id, currentUser);
      setData(fresh);
      saveUserWorkingDraft(currentUser.id, fresh);
    } else {
      setData(defaultSopData);
    }
  };

  // Convert Banglish procedure to natural factory Bengali
  const handleAutoGenerate = async () => {
    const input = data.procedure.banglishInput;
    if (!input || input.trim() === '') {
      alert('Please enter Banglish text in the procedure box first!');
      return;
    }

    setIsGenerating(true);
    try {
      const globalCfg = getGlobalAiConfig();
      const effOpenRouterKey = globalCfg.openRouterKey || openRouterKey;
      const effOpenRouterModel = globalCfg.openRouterModel || openRouterModel;
      const effGeminiKey = globalCfg.geminiKey || geminiKey;
      const effProvider = globalCfg.activeProvider || activeProvider;

      let generated;
      let usedEngine = '';

      if (effProvider === 'openrouter' && effOpenRouterKey) {
        generated = await generateSOPWithOpenRouter(input, effOpenRouterKey, effOpenRouterModel);
        usedEngine = `OpenRouter AI (${effOpenRouterModel.replace(':free', '').split('/').pop()})`;
      } else if (effProvider === 'gemini' && effGeminiKey) {
        generated = await generateSOPWithGemini(input, effGeminiKey);
        usedEngine = 'Google Gemini AI (Online)';
      } else {
        generated = offlineConvertBanglish(input);
        usedEngine = 'Smart Factory Engine (Offline)';
      }

      setLastUsedEngine(usedEngine);

      setData((prev) => ({
        ...prev,
        procedure: {
          ...prev.procedure,
          steps: generated.steps.length > 0 ? generated.steps : prev.procedure.steps,
          qualityPoints:
            generated.qualityPoints.length > 0 ? generated.qualityPoints : prev.procedure.qualityPoints,
          generalInstructions:
            generated.generalInstructions.length > 0
              ? generated.generalInstructions
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
      setLastUsedEngine('Smart Factory Engine (Offline Fallback)');
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
      let usedEngine = '';
      if (effOpenRouterKey) {
        points = await generateQualityPointsWithOpenRouter(input, effOpenRouterKey, effOpenRouterModel);
        usedEngine = `OpenRouter AI (${effOpenRouterModel.replace(':free', '').split('/').pop()})`;
      } else {
        points = offlineConvertQualityPoints(input);
        usedEngine = 'Smart Factory Engine (Offline)';
      }
      setLastUsedEngine(usedEngine);

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
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8FAFC] font-sans select-none print:h-auto print:overflow-visible print:bg-white">
      {/* Hidden file input for JSON import */}
      <input
        type="file"
        ref={importFileRef}
        onChange={handleImportJson}
        accept=".json,application/json"
        className="hidden"
      />

      {/* 1. LEFT SIDEBAR (Executive Walton Mission Control Navigation) */}
      <LeftSidebar
        currentView={currentView}
        onChangeView={(view) => setCurrentView(view)}
        currentUser={currentUser}
        activeConcern={activeConcern}
        pendingApprovalsCount={pendingApprovalsCount}
        onOpenAdminPanel={() => setIsAdminModalOpen(true)}
      />

      {/* 2. MAIN APPLICATION CONTENT VIEWPORT */}
      <div className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden bg-[#F8FAFC]">
        {/* Top Executive Header Bar */}
        <TopExecutiveHeader
          currentUser={currentUser}
          activeConcern={activeConcern}
          currentView={currentView}
          notifications={notifications}
          onOpenLogin={() => setIsLoginModalOpen(true)}
          onLogout={handleLogout}
          onFastCreateSop={() => {
            const fresh = createStarterSOPForConcern(activeConcern.id, currentUser);
            setData(fresh);
            if (currentUser) saveUserWorkingDraft(currentUser.id, fresh);
            setCurrentView('editor');
          }}
          onTriggerGlobalSync={async () => {
            setIsSyncing(true);
            try {
              await pullAllSopsFromCloud();
              await refreshNotifications();
            } finally {
              setIsSyncing(false);
            }
          }}
          isSyncing={isSyncing}
          onSelectSopById={handleSelectSopById}
          zoom={zoom}
          setZoom={setZoom}
        />

        {/* View Router Main Container */}
        <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden">
          {/* VIEW 1: EXECUTIVE CONCERN DASHBOARD (Landing View) */}
          {currentView === 'dashboard' && (
            <div className="p-4 sm:p-6 lg:p-8 animate-in fade-in duration-200">
              <ConcernDashboard
                currentUser={currentUser}
                onSelectConcern={(concern) => {
                  setActiveConcern(concern);
                  setCurrentView('workplace');
                }}
                onCreateConcernSop={(concern) => {
                  setActiveConcern(concern);
                  const fresh = createStarterSOPForConcern(concern.id, currentUser);
                  setData(fresh);
                  if (currentUser) saveUserWorkingDraft(currentUser.id, fresh);
                  setCurrentView('editor');
                }}
                onOpenApprovalRoute={() => setCurrentView('approval_route')}
                onOpenArchive={() => setCurrentView('archive')}
                onOpenAdminPanel={() => setIsAdminModalOpen(true)}
              />
            </div>
          )}

          {/* VIEW 2: DEDICATED CONCERN WORKPLACE VIEW */}
          {currentView === 'workplace' && (
            <div className="p-4 sm:p-6 lg:p-8 animate-in fade-in duration-200">
              <ConcernWorkplaceView
                concern={activeConcern}
                currentUser={currentUser}
                onBackToDashboard={() => setCurrentView('dashboard')}
                onOpenSopInEditor={(sop) => {
                  setData(sop);
                  setCurrentView('editor');
                }}
                onCreateNewWithStarter={(concern) => {
                  const fresh = createStarterSOPForConcern(concern.id, currentUser);
                  setData(fresh);
                  if (currentUser) saveUserWorkingDraft(currentUser.id, fresh);
                  setCurrentView('editor');
                }}
              />
            </div>
          )}

          {/* VIEW 3: FULL SOP STUDIO / LIVE EDITOR & CANVAS */}
          {currentView === 'editor' && (
            <div className="h-full flex flex-col overflow-hidden animate-in fade-in duration-150">
              {/* Workflow & Approval Status Action Bar */}
              <WorkflowActionBar
                currentSop={data}
                currentUser={currentUser}
                onUpdateSop={(updated) => setData(updated)}
                onOpenWorkspace={() => setCurrentView('workplace')}
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
                            {data.status === 'approved'
                              ? 'Officially Approved & Locked'
                              : 'Images, Banglish procedure, header & tables'}
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
                            onClick={handlePrint}
                            className="flex items-center gap-1 bg-slate-700 hover:bg-slate-600 text-white text-[11px] font-bold px-2 py-1 rounded transition cursor-pointer"
                            title="Print SOP Canvas"
                          >
                            <Printer className="w-3 h-3 text-slate-300" />
                            <span>Print</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleExportJson}
                            className="flex items-center gap-1 bg-slate-700 hover:bg-slate-600 text-white text-[11px] font-bold px-2 py-1 rounded transition cursor-pointer"
                            title="Export Backup JSON"
                          >
                            <Download className="w-3 h-3 text-slate-300" />
                            <span>JSON</span>
                          </button>
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
                          <span>Procedure &amp; AI</span>
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
                          <span>Parts/Tools</span>
                        </button>
                      </div>

                      {/* Tab Panels Content */}
                      {data.status === 'approved' ? (
                        <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center text-center space-y-4 bg-emerald-50/50 m-3 rounded-2xl border border-emerald-200">
                          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
                            <ShieldCheck className="w-8 h-8" />
                          </div>
                          <div className="space-y-1 max-w-xs">
                            <h3 className="font-black text-slate-900 text-sm">Official SOP Document Locked</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                              This Standard Operating Procedure has received final Head of Department approval. To preserve technical compliance, editing parameters is disabled.
                            </p>
                          </div>
                          <div className="pt-2">
                            <button
                              type="button"
                              onClick={handleDownloadPdf}
                              disabled={isDownloadingPdf}
                              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer disabled:opacity-50"
                            >
                              <FileDown className="w-4 h-4" />
                              <span>{isDownloadingPdf ? 'Generating PDF...' : 'Download Official PDF'}</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                          {activeTab === 'photos' && (
                            <ImageManager
                              photos={data.photos}
                              onChange={(photos) => setData((prev) => ({ ...prev, photos }))}
                              imageFit={data.imageFit}
                              onUpdateFit={(fit) => setData((prev) => ({ ...prev, imageFit: fit }))}
                              gridCols={data.gridCols}
                              onUpdateGridCols={(cols) => setData((prev) => ({ ...prev, gridCols: cols }))}
                            />
                          )}

                          {activeTab === 'procedure' && (
                            <BanglishProcedureEditor
                              procedure={data.procedure}
                              onChange={(procedure) => setData((prev) => ({ ...prev, procedure }))}
                              onGenerate={handleAutoGenerate}
                              isGenerating={isGenerating}
                              onGenerateQuality={handleAutoGenerateQuality}
                              isGeneratingQuality={isGeneratingQuality}
                              hasApiKey={Boolean(openRouterKey || geminiKey)}
                              activeProvider={activeProvider}
                              activeModel={openRouterModel}
                              onOpenAiModal={() => setIsApiKeyModalOpen(true)}
                              stepFontSize={data.stepFontSize}
                              onFontSizeChange={(stepFontSize) => setData((prev) => ({ ...prev, stepFontSize }))}
                              qualityFontSize={data.qualityFontSize}
                              onQualityFontSizeChange={(qualityFontSize) => setData((prev) => ({ ...prev, qualityFontSize }))}
                              lastUsedEngine={lastUsedEngine}
                            />
                          )}

                          {activeTab === 'header' && (
                            <HeaderEditor
                              header={data.header}
                              onChange={(header) => setData((prev) => ({ ...prev, header }))}
                            />
                          )}

                          {activeTab === 'safety' && (
                            <SafetyEditor
                              safety={data.safety}
                              onChange={(safety) => setData((prev) => ({ ...prev, safety }))}
                            />
                          )}

                          {activeTab === 'tables' && (
                            <TablesEditor
                              parts={data.parts}
                              tools={data.tools}
                              onPartsChange={(parts) => setData((prev) => ({ ...prev, parts }))}
                              onToolsChange={(tools) => setData((prev) => ({ ...prev, tools }))}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </aside>

                {/* Sidebar Collapse Toggle Button */}
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="no-print absolute top-3 left-0 z-30 bg-slate-900 text-white p-1 rounded-r-md hover:bg-blue-600 transition shadow-md cursor-pointer"
                  style={{ left: isSidebarOpen ? (window.innerWidth >= 1024 ? 480 : 420) : 0 }}
                  title={isSidebarOpen ? 'Collapse Editor' : 'Expand Editor'}
                >
                  {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>

                {/* Right Side: Live SOP Paper Preview Container */}
                <main className="flex-1 overflow-auto bg-slate-200/90 p-4 sm:p-8 flex flex-col items-center justify-start print:p-0 print:bg-white print:overflow-visible">
                  {/* Canvas Quick Layout Bar */}
                  <div className="no-print w-full max-w-[1123px] mb-3 bg-white border border-slate-300 rounded-xl px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
                    {/* Font Size Selector */}
                    <div className="flex items-center gap-1.5">
                      <span className="flex items-center gap-1 font-semibold text-slate-700">
                        <Type className="w-3.5 h-3.5 text-blue-600" />
                        <span>Step Font:</span>
                      </span>
                      <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                        {(
                          [
                            { id: 'auto', label: 'Auto' },
                            { id: 'compact', label: 'Compact' },
                            { id: 'normal', label: 'Normal' },
                            { id: 'large', label: 'Large' },
                            { id: 'xlarge', label: 'X-Large' },
                          ] as const
                        ).map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setData((prev) => ({ ...prev, stepFontSize: opt.id }))}
                            className={`px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${
                              (data.stepFontSize || 'normal') === opt.id
                                ? 'bg-blue-600 text-white shadow-xs font-bold'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Quality Font Selector */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-semibold text-slate-700">Quality Font:</span>
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
                            { id: 2, label: '2 Col' },
                            { id: 3, label: '3 Col' },
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

                  {/* SOP Paper Render Container */}
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
            </div>
          )}

          {/* VIEW 4: APPROVAL ROUTE PIPELINE VIEW */}
          {currentView === 'approval_route' && (
            <div className="p-4 sm:p-6 lg:p-8 animate-in fade-in duration-200">
              <ApprovalRouteView
                currentUser={currentUser}
                onOpenSopInEditor={(sop) => {
                  setData(sop);
                  if (sop.concernId) {
                    const c = getConcernById(sop.concernId);
                    if (c) setActiveConcern(c);
                  }
                  setCurrentView('editor');
                }}
                onOpenLogin={() => setIsLoginModalOpen(true)}
              />
            </div>
          )}

          {/* VIEW 5: MASTER TECHNICAL ARCHIVE */}
          {currentView === 'archive' && (
            <div className="p-4 sm:p-6 lg:p-8 animate-in fade-in duration-200">
              <MasterArchiveModal
                isOpen={true}
                onClose={() => setCurrentView('dashboard')}
                currentUser={currentUser}
                onSelectSop={(sop) => {
                  setData(sop);
                  if (sop.concernId) {
                    const c = getConcernById(sop.concernId);
                    if (c) setActiveConcern(c);
                  }
                  setCurrentView('editor');
                }}
              />
            </div>
          )}

          {/* VIEW 6: PLANT-WIDE ANALYTICS & KPIS */}
          {currentView === 'analytics' && (
            <div className="p-4 sm:p-6 lg:p-8 animate-in fade-in duration-200">
              <AnalyticsDashboardModal
                isOpen={true}
                onClose={() => setCurrentView('dashboard')}
              />
            </div>
          )}
        </main>
      </div>

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
        onSelectSop={(sop) => {
          setData(sop);
          if (sop.concernId) {
            const c = getConcernById(sop.concernId);
            if (c) setActiveConcern(c);
          }
          setCurrentView('editor');
        }}
        onNewSop={handleNewSop}
        onOpenLogin={() => setIsLoginModalOpen(true)}
      />

      {/* Admin Panel Modal */}
      <AdminPanelModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        currentUser={currentUser}
      />

      {/* Direct AI Engine & API Key Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        openRouterKey={openRouterKey}
        openRouterModel={openRouterModel}
        geminiKey={geminiKey}
        activeProvider={activeProvider}
        onSaveConfig={(cfg) => {
          setOpenRouterKey(cfg.openRouterKey);
          setOpenRouterModel(cfg.openRouterModel);
          setGeminiKey(cfg.geminiKey);
          setActiveProvider(cfg.activeProvider);
          saveGlobalAiConfig({
            openRouterKey: cfg.openRouterKey,
            openRouterModel: cfg.openRouterModel,
            geminiKey: cfg.geminiKey,
            activeProvider: cfg.activeProvider,
          });
          setIsApiKeyModalOpen(false);
        }}
      />
    </div>
  );
};

export default App;
