import React, { useState, useEffect } from 'react';
import type { SOPDocument } from '../../types/sop';
import type { UserProfile } from '../../types/auth';
import { PROCESS_CONCERNS, type ProcessConcern } from '../../data/concernData';
import { getAllSOPs } from '../../services/storageService';
import {
  Clock,
  ArrowRight,
  Plus,
  Search,
  ShieldCheck,
  Users,
} from 'lucide-react';

interface ConcernDashboardProps {
  currentUser: UserProfile | null;
  onSelectConcern: (concern: ProcessConcern) => void;
  onCreateConcernSop: (concern: ProcessConcern) => void;
  onOpenApprovalRoute: () => void;
  onOpenArchive: () => void;
  onOpenAdminPanel?: () => void;
}

export const ConcernDashboard: React.FC<ConcernDashboardProps> = ({
  currentUser,
  onSelectConcern,
  onCreateConcernSop,
  onOpenApprovalRoute,
  onOpenArchive,
  onOpenAdminPanel,
}) => {
  const [sops, setSops] = useState<SOPDocument[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadAllSops = async () => {
    try {
      const all = await getAllSOPs(true);
      setSops(all);
    } catch (e) {
      console.warn('Error loading dashboard SOPs:', e);
    }
  };

  useEffect(() => {
    loadAllSops();
    const interval = setInterval(loadAllSops, 4000);
    return () => clearInterval(interval);
  }, []);

  // Calculate Metrics
  const totalSOPsCount = sops.length;
  const approvedSOPsCount = sops.filter((s) => s.status === 'approved').length;
  const inReviewSOPsCount = sops.filter(
    (s) => s.status === 'forwarded_to_checker' || s.status === 'checked' || s.status === 'forwarded_to_approver'
  ).length;
  const draftSOPsCount = sops.filter((s) => !s.status || s.status === 'draft' || s.status === 'rejected').length;

  // Filter Concerns
  const filteredConcerns = PROCESS_CONCERNS.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.assignedEngineers.some((eng) => eng.name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 max-w-[1920px] mx-auto pb-12">
      {/* 1. TOP EXECUTIVE MISSION CONTROL BANNER */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 relative overflow-hidden">
        <div className="z-10">
          <div className="flex items-center gap-2.5">
            <span className="text-[11px] font-mono font-black uppercase tracking-widest text-red-600 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-md">
              EXECUTIVE MISSION CONTROL
            </span>
            <span className="text-slate-300">&bull;</span>
            <span className="text-xs font-bold text-slate-500 font-mono">WALTON Hi-Tech Industries PLC</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1.5 tracking-tight flex items-center gap-3">
            <span>Process Development SOP Management System</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium max-w-3xl">
            Live plant-wide Standard Operating Procedure tracking, section concern workspaces, multi-level approval pipeline, and compliant technical archives.
          </p>
        </div>

        {/* Right Action Quick Controls */}
        <div className="flex flex-wrap items-center gap-3 z-10">
          <button
            type="button"
            onClick={onOpenArchive}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold shadow-xs transition flex items-center gap-2 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Master Archive ({approvedSOPsCount})</span>
          </button>

          <button
            type="button"
            onClick={onOpenApprovalRoute}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold shadow-xs transition flex items-center gap-2 cursor-pointer"
          >
            <Clock className="w-4 h-4 text-amber-600" />
            <span>Pending Route ({inReviewSOPsCount})</span>
          </button>

          {currentUser?.role === 'admin' && onOpenAdminPanel && (
            <button
              type="button"
              onClick={onOpenAdminPanel}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition flex items-center gap-2 cursor-pointer"
            >
              <span>⚙️ Admin Panel</span>
            </button>
          )}
        </div>

        {/* Background Decorative Graphic */}
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-gradient-to-l from-blue-50/60 to-transparent pointer-events-none" />
      </div>

      {/* 2. 3 VIBRANT HIGH-CONTRAST HERO CARDS (Matching ac-process-monthly-report style) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans">
        {/* Card 1: Purple / Fuchsia Gradient - Total SOP Inventory */}
        <div
          className="rounded-3xl p-6 lg:p-7 text-white shadow-lg transition hover:shadow-2xl relative overflow-hidden flex flex-col justify-between"
          style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #C026D3 100%)' }}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl shadow-sm border border-white/25">
                📑
              </div>
              <span className="px-3.5 py-1.5 rounded-full text-[11px] font-mono font-black uppercase tracking-wider bg-white/20 backdrop-blur-sm border border-white/30 text-white">
                SOP INVENTORY
              </span>
            </div>
            <div className="text-5xl font-black tracking-tight font-mono text-white mt-1">
              {totalSOPsCount}
            </div>
            <div className="text-sm font-extrabold text-purple-100 mt-2">
              Total Recorded SOPs &bull; <span className="text-white font-mono">{PROCESS_CONCERNS.length}</span> Manufacturing Concerns
            </div>
          </div>
          <div className="mt-6 pt-3.5 border-t border-white/20 flex items-center justify-between text-xs">
            <span className="px-3 py-1 rounded-xl bg-white/25 font-bold backdrop-blur-sm text-white">
              {draftSOPsCount} In-Draft
            </span>
            <span className="font-mono font-extrabold text-purple-100">
              100% Plant Coverage
            </span>
          </div>
        </div>

        {/* Card 2: Sunset Orange Gradient - Approval Route Pipeline */}
        <div
          onClick={onOpenApprovalRoute}
          className="cursor-pointer rounded-3xl p-6 lg:p-7 text-white shadow-lg transition hover:shadow-2xl relative overflow-hidden flex flex-col justify-between"
          style={{ background: 'linear-gradient(135deg, #EA580C 0%, #F59E0B 100%)' }}
          title="Click to view Approval Pipeline"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl shadow-sm border border-white/25">
                ⏳
              </div>
              <span
                style={{
                  background: '#FFFFFF',
                  color: '#9A3412',
                  padding: '4px 12px',
                  borderRadius: '9999px',
                  fontSize: '11px',
                  fontWeight: 900,
                  fontFamily: "'JetBrains Mono', monospace",
                  boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                }}
              >
                APPROVAL ROUTE
              </span>
            </div>
            <div className="text-5xl font-black tracking-tight font-mono text-white mt-1">
              {inReviewSOPsCount}
            </div>
            <div className="text-sm font-extrabold text-amber-100 mt-2">
              SOPs Under Review &bull; Section In-Charge & HOD Route
            </div>
          </div>
          <div className="mt-6 pt-3.5 border-t border-white/20 flex items-center justify-between text-xs">
            <span className="px-3 py-1 rounded-xl bg-white/25 font-bold backdrop-blur-sm text-white flex items-center gap-1">
              <span>View Route Pipeline</span> <span>↗</span>
            </span>
            <span className="font-mono font-extrabold text-amber-100">
              Pending Clearance
            </span>
          </div>
        </div>

        {/* Card 3: Emerald / Teal Gradient - Approved & Archived */}
        <div
          onClick={onOpenArchive}
          className="cursor-pointer rounded-3xl p-6 lg:p-7 text-white shadow-lg transition hover:shadow-2xl relative overflow-hidden flex flex-col justify-between"
          style={{ background: 'linear-gradient(135deg, #059669 0%, #0D9488 100%)' }}
          title="Click to open Master Archive"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl shadow-sm border border-white/25">
                🛡️
              </div>
              <span
                style={{
                  background: '#FFFFFF',
                  color: '#065F46',
                  padding: '4px 12px',
                  borderRadius: '9999px',
                  fontSize: '11px',
                  fontWeight: 900,
                  fontFamily: "'JetBrains Mono', monospace",
                  boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                }}
              >
                OFFICIALLY APPROVED
              </span>
            </div>
            <div className="text-5xl font-black tracking-tight font-mono text-white mt-1">
              {approvedSOPsCount}
            </div>
            <div className="text-sm font-extrabold text-emerald-100 mt-2">
              Compliant Published Archives &bull; PDF Ready
            </div>
          </div>
          <div className="mt-6 pt-3.5 border-t border-white/20 flex items-center justify-between text-xs">
            <span className="px-3 py-1 rounded-xl bg-white/25 font-bold backdrop-blur-sm text-white flex items-center gap-1">
              <span>Direct PDF Download</span> <span>↗</span>
            </span>
            <span className="font-mono font-extrabold text-emerald-100">
              100% Production Locked
            </span>
          </div>
        </div>
      </div>

      {/* 3. SECTION WORKSPACES HEADER & FILTER */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center text-2xl shrink-0 shadow-xs">
              🏢
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Process Concern Workspaces ({PROCESS_CONCERNS.length} Sections)
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Click any concern card to enter its dedicated workspace, review section drafts, or initialize a new SOP with prefilled starter patterns.
              </p>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search section by name, line, or engineer..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition"
            />
          </div>
        </div>

        {/* 4. CONCERN WORKSPACE CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mt-6">
          {filteredConcerns.map((concern) => {
            // Count SOPs for this concern
            const concernSops = sops.filter(
              (s) =>
                s.concernId === concern.id ||
                s.header?.stationLine?.toLowerCase().includes(concern.code.toLowerCase()) ||
                s.header?.processName?.toLowerCase().includes(concern.shortName.toLowerCase())
            );
            const total = concernSops.length;
            const approved = concernSops.filter((s) => s.status === 'approved').length;
            const inReview = concernSops.filter(
              (s) =>
                s.status === 'forwarded_to_checker' ||
                s.status === 'checked' ||
                s.status === 'forwarded_to_approver'
            ).length;
            const draft = concernSops.filter((s) => !s.status || s.status === 'draft' || s.status === 'rejected').length;

            const isUserConcern =
              currentUser?.concernId === concern.id ||
              concern.assignedEngineers.some(
                (eng) => eng.id === currentUser?.employeeId || eng.name.includes(currentUser?.username || '')
              );

            return (
              <div
                key={concern.id}
                className={`bg-white border rounded-3xl p-5 shadow-xs transition hover:shadow-lg hover:border-blue-400 flex flex-col justify-between relative group ${
                  isUserConcern ? 'ring-2 ring-blue-500/30 border-blue-300' : 'border-slate-200'
                }`}
              >
                {/* User Highlight Tag */}
                {isUserConcern && (
                  <div className="absolute top-3.5 right-4">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                      ★ Your Section
                    </span>
                  </div>
                )}

                <div>
                  {/* Top Header with Icon & Code */}
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-xs border"
                      style={{
                        background: concern.lightBg,
                        borderColor: concern.borderColor,
                      }}
                    >
                      {concern.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                          {concern.code}
                        </span>
                      </div>
                      <h4 className="text-base font-black text-slate-900 group-hover:text-blue-600 transition tracking-tight mt-0.5">
                        {concern.name}
                      </h4>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 font-medium line-clamp-2 mb-4">
                    {concern.description}
                  </p>

                  {/* Assigned Line Engineers */}
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-2.5 mb-4 text-[11px] text-slate-600">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Users className="w-3 h-3 text-slate-400" />
                      <span>Assigned Line Engineers:</span>
                    </div>
                    <div className="font-semibold text-slate-800">
                      {concern.assignedEngineers.map((e) => e.name).join(' & ')}
                    </div>
                  </div>

                  {/* SOP Counts Breakdown */}
                  <div className="grid grid-cols-4 gap-2 text-center py-2.5 px-3 bg-slate-50/70 border border-slate-200/80 rounded-2xl mb-4">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Total</div>
                      <div className="text-base font-black font-mono text-slate-900">{total}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-emerald-600 uppercase">Approved</div>
                      <div className="text-base font-black font-mono text-emerald-600">{approved}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-amber-600 uppercase">In Review</div>
                      <div className="text-base font-black font-mono text-amber-600">{inReview}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase">Draft</div>
                      <div className="text-base font-black font-mono text-slate-600">{draft}</div>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectConcern(concern)}
                    className="flex-1 py-2.5 px-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Open Workplace</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onCreateConcernSop(concern)}
                    className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    title="Start new SOP with prefilled section pattern"
                  >
                    <Plus className="w-3.5 h-3.5 text-blue-600" />
                    <span className="hidden sm:inline">New SOP</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
