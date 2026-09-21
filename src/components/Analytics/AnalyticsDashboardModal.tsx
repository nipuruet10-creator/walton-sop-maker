import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { SOPDocument } from '../../types/sop';
import { getAllSOPs, clearTrialData } from '../../services/storageService';
import {
  BarChart3,
  CheckCircle2,
  Clock,
  Users,
  Calendar,
  Award,
  FileText,
  X,
  Trash2,
} from 'lucide-react';

interface AnalyticsDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export const AnalyticsDashboardModal: React.FC<AnalyticsDashboardModalProps> = ({ isOpen, onClose }) => {
  const [sops, setSops] = useState<SOPDocument[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setLoading(true);
    try {
      const all = await getAllSOPs();
      setSops(all);
    } catch (e) {
      console.warn('Analytics data load error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleClearTrialData = async () => {
    const ok = window.confirm(
      'Are you sure you want to clear all test and trial records to reset analytics?'
    );
    if (!ok) return;
    await clearTrialData();
    await loadData();
    alert('Trial data successfully cleared!');
  };

  if (!isOpen) return null;

  // Filter out legacy trial BOPP Tape demo SOPs
  const realSops = sops.filter(
    (s) =>
      s.header?.processName &&
      !s.header.processName.includes('BOPP Tape Attaching Working Procedure')
  );

  // Filter completed / approved SOPs
  const approvedSops = realSops.filter((s) => s.status === 'approved');
  const inProgressSops = realSops.filter(
    (s) =>
      s.status === 'forwarded_to_checker' ||
      s.status === 'forwarded_to_approver' ||
      s.status === 'checked'
  );
  const draftSops = realSops.filter((s) => !s.status || s.status === 'draft' || s.status === 'rejected');

  // Userwise completion calculation with deduplicated and normalized names
  const userCompletionMap: Record<string, { name: string; completed: number; inProgress: number; total: number }> = {};

  realSops.forEach((doc) => {
    let authorKey = doc.authorName || doc.authorId || doc.header?.preparedBy?.name || 'Process Engineer';
    const lower = authorKey.toLowerCase();
    if (lower.includes('biplob')) authorKey = 'Biplob Hossain (67544)';
    else if (lower.includes('deb') || lower.includes('dev')) authorKey = 'Deb (54150)';
    else if (lower.includes('sazzad')) authorKey = 'Sazzad (50463)';
    else if (lower.includes('hashmi')) authorKey = 'Hashmi (56880)';
    else if (lower.includes('jowel')) authorKey = 'Jowel (7686)';
    else if (lower.includes('kamrul')) authorKey = 'Kamrul (44819)';

    if (!userCompletionMap[authorKey]) {
      userCompletionMap[authorKey] = {
        name: authorKey,
        completed: 0,
        inProgress: 0,
        total: 0,
      };
    }
    userCompletionMap[authorKey].total += 1;
    if (doc.status === 'approved') {
      userCompletionMap[authorKey].completed += 1;
    } else if (
      doc.status === 'forwarded_to_checker' ||
      doc.status === 'forwarded_to_approver' ||
      doc.status === 'checked'
    ) {
      userCompletionMap[authorKey].inProgress += 1;
    }
  });

  const userLeaderboard = Object.values(userCompletionMap).sort((a, b) => b.completed - a.completed);

  // Monthwise calculation for selected year
  const monthCounts = new Array(12).fill(0);
  approvedSops.forEach((doc) => {
    const dateStr = doc.approvedAt || doc.updatedAt || doc.createdAt;
    if (dateStr) {
      const d = new Date(dateStr);
      if (d.getFullYear() === selectedYear) {
        monthCounts[d.getMonth()] += 1;
      }
    }
  });

  const maxMonthCount = Math.max(...monthCounts, 1);

  // Available Years
  const availableYears = [2025, 2026, 2027];

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 w-full max-w-5xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-blue-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight">SOP Performance & Completion Analytics</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Live Insights
                </span>
              </div>
              <p className="text-xs text-blue-200">
                User-wise and monthly completed SOP productivity dashboard
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClearTrialData}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-700/60 text-xs font-bold transition cursor-pointer"
              title="Clear test and trial records to reset analytics"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">Clear Trial Data</span>
            </button>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              className="bg-slate-800 border border-slate-700 text-white text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none cursor-pointer"
            >
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  Year: {y}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Dashboard Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-6">
          {loading ? (
            <div className="text-center py-20 text-slate-500 text-xs font-semibold">
              Loading analytics data...
            </div>
          ) : (
            <>
              {/* KPI Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-emerald-200 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 block">Approved & Completed</span>
                    <span className="text-2xl font-bold text-slate-900">{approvedSops.length}</span>
                    <span className="text-[10px] text-emerald-600 block font-medium">Published in Master Archive</span>
                  </div>
                </div>

            <div className="bg-white border border-blue-200 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-500 block">In-Progress / Under Review</span>
                <span className="text-2xl font-bold text-slate-900">{inProgressSops.length}</span>
                <span className="text-[10px] text-blue-600 block font-medium">With Checker or Approver</span>
              </div>
            </div>

            <div className="bg-white border border-amber-200 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-500 block">Drafts (In-Progress)</span>
                <span className="text-2xl font-bold text-slate-900">{draftSops.length}</span>
                <span className="text-[10px] text-amber-600 block font-medium">In Author Workspaces</span>
              </div>
            </div>

            <div className="bg-white border border-purple-200 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-200">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-500 block">Active Contributors</span>
                <span className="text-2xl font-bold text-slate-900">{userLeaderboard.length} Contributors</span>
                <span className="text-[10px] text-purple-600 block font-medium">Engineering & Process Team</span>
              </div>
            </div>
          </div>

          {/* Userwise Breakdown */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-slate-900 text-sm">
                  User-wise SOP Completion Breakdown
                </h3>
              </div>
              <span className="text-xs text-slate-500">
                Individual and team process output achievements
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Contributor / Process Engineer</th>
                    <th className="py-2.5 px-3 text-center">Approved SOPs</th>
                    <th className="py-2.5 px-3 text-center">In-Progress</th>
                    <th className="py-2.5 px-3 text-center">Total SOPs</th>
                    <th className="py-2.5 px-3 text-right">Completion Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {userLeaderboard.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-slate-400">
                        No data records found
                      </td>
                    </tr>
                  ) : (
                    userLeaderboard.map((item, idx) => {
                      const percentage = item.total > 0 ? Math.round((item.completed / item.total) * 100) : 0;
                      return (
                        <tr key={item.name} className="hover:bg-slate-50 transition">
                          <td className="py-2.5 px-3 font-mono text-slate-500 font-bold">
                            #{idx + 1}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-bold text-slate-900 block">{item.name}</span>
                            <span className="text-[10px] text-slate-400">Process Automation</span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                              {item.completed}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="inline-block px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold">
                              {item.inProgress}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold text-slate-700">
                            {item.total}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-20 bg-slate-200 rounded-full h-2 overflow-hidden">
                                <div
                                  className="bg-emerald-600 h-full rounded-full"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <span className="font-bold text-slate-700 w-8">{percentage}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Monthwise Breakdown for Selected Year */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Monthly SOP Completion Velocity ({selectedYear})
                </h3>
              </div>
              <span className="text-xs font-bold text-blue-600">
                Total Completed This Year: {monthCounts.reduce((a, b) => a + b, 0)}
              </span>
            </div>

            {/* Visual Bar Chart */}
            <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 pt-2 items-end h-48 border-b border-slate-200 pb-4">
              {MONTH_NAMES.map((name, idx) => {
                const count = monthCounts[idx];
                const barHeight = Math.max(8, (count / maxMonthCount) * 100);
                return (
                  <div key={name} className="flex flex-col items-center gap-1.5 h-full justify-end group">
                    <span className="text-[10.5px] font-bold text-slate-700 opacity-0 group-hover:opacity-100 transition">
                      {count}
                    </span>
                    <div
                      className={`w-full max-w-[28px] rounded-t-lg transition-all duration-300 ${
                        count > 0
                          ? 'bg-gradient-to-t from-blue-600 to-indigo-500 shadow-sm'
                          : 'bg-slate-200'
                      }`}
                      style={{ height: `${barHeight}%` }}
                    />
                    <span className="text-[10px] text-slate-500 text-center font-medium truncate w-full">
                      {name.split(' ')[0].substring(0, 4)}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <span>* Hover over bars to view monthly completion counts.</span>
              <span>Year: {selectedYear}</span>
            </div>
          </div>
          </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
