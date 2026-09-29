import React, { useState, useEffect } from 'react';
import type { SOPDocument } from '../../types/sop';
import type { UserProfile } from '../../types/auth';
import { type ProcessConcern } from '../../data/concernData';
import { getAllSOPs } from '../../services/storageService';
import { downloadSOPAsPdf } from '../../services/pdfExporter';
import {
  ArrowLeft,
  Plus,
  Search,
  FileText,
  FileDown,
  Edit2,
  Eye,
  Sparkles,
  Users,
} from 'lucide-react';

interface ConcernWorkplaceViewProps {
  concern: ProcessConcern;
  currentUser: UserProfile | null;
  onBackToDashboard: () => void;
  onOpenSopInEditor: (sop: SOPDocument) => void;
  onCreateNewWithStarter: (concern: ProcessConcern) => void;
}

export const ConcernWorkplaceView: React.FC<ConcernWorkplaceViewProps> = ({
  concern,
  currentUser,
  onBackToDashboard,
  onOpenSopInEditor,
  onCreateNewWithStarter,
}) => {
  const [sops, setSops] = useState<SOPDocument[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'in_review' | 'approved'>('all');
  const [isDownloadingId, setIsDownloadingId] = useState<string | null>(null);

  const loadConcernSops = async () => {
    try {
      const all = await getAllSOPs(true);
      const filtered = all.filter(
        (s) =>
          s.concernId === concern.id ||
          s.header?.stationLine?.toLowerCase().includes(concern.code.toLowerCase()) ||
          s.header?.processName?.toLowerCase().includes(concern.shortName.toLowerCase()) ||
          s.header?.referenceNo?.toLowerCase().includes(concern.code.toLowerCase())
      );
      setSops(filtered);
    } catch (e) {
      console.warn('Error loading concern sops:', e);
    }
  };

  useEffect(() => {
    loadConcernSops();
    const interval = setInterval(loadConcernSops, 4000);
    return () => clearInterval(interval);
  }, [concern.id]);

  // Metric counts
  const totalCount = sops.length;
  const approvedCount = sops.filter((s) => s.status === 'approved').length;
  const inReviewCount = sops.filter(
    (s) =>
      s.status === 'forwarded_to_checker' ||
      s.status === 'checked' ||
      s.status === 'forwarded_to_approver'
  ).length;
  const draftCount = sops.filter((s) => !s.status || s.status === 'draft' || s.status === 'rejected').length;

  // Filtered SOPs list
  const displaySops = sops.filter((s) => {
    // Status filter
    if (statusFilter === 'draft' && s.status && s.status !== 'draft' && s.status !== 'rejected') return false;
    if (
      statusFilter === 'in_review' &&
      s.status !== 'forwarded_to_checker' &&
      s.status !== 'checked' &&
      s.status !== 'forwarded_to_approver'
    )
      return false;
    if (statusFilter === 'approved' && s.status !== 'approved') return false;

    // Search query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        s.header?.processName?.toLowerCase().includes(q) ||
        s.header?.referenceNo?.toLowerCase().includes(q) ||
        s.header?.model?.toLowerCase().includes(q) ||
        (s.authorName || '').toLowerCase().includes(q) ||
        (s.header?.preparedBy?.name || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleDownloadPdf = async (sop: SOPDocument) => {
    setIsDownloadingId(sop.id || 'download');
    try {
      // First open in background then download
      await downloadSOPAsPdf('sop-paper', sop.header.processName, sop.header.referenceNo);
    } catch (e: any) {
      alert('PDF generation error: ' + (e.message || 'Unknown error'));
    } finally {
      setIsDownloadingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-[1920px] mx-auto pb-12">
      {/* 1. TOP HEADER & BREADCRUMB */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 relative overflow-hidden">
        <div>
          {/* Back button */}
          <button
            type="button"
            onClick={onBackToDashboard}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 mb-2 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Executive Dashboard</span>
          </button>

          <div className="flex items-center gap-3">
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
                <span className="text-xs font-mono font-bold text-slate-400">&bull;</span>
                <span className="text-xs text-slate-500 font-medium">Dedicated Line Workplace</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-0.5">
                {concern.name}
              </h2>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-2 font-medium max-w-2xl">
            {concern.description}
          </p>
        </div>

        {/* Assigned Engineers & Primary Action */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 z-10 w-full lg:w-auto">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-600">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 flex items-center justify-between gap-2">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3 text-slate-400" />
                <span>Section Engineers:</span>
              </span>
              {currentUser && (
                <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                  {currentUser.name}
                </span>
              )}
            </div>
            <div className="font-bold text-slate-800">
              {concern.assignedEngineers.map((e) => e.name).join(' & ')}
            </div>
          </div>

          <button
            type="button"
            onClick={() => onCreateNewWithStarter(concern)}
            className="px-5 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-bold shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create SOP with Section Starter Pattern</span>
          </button>
        </div>
      </div>

      {/* 2. SECTION KPI STATS ROW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Section SOPs</div>
          <div className="text-3xl font-black font-mono text-slate-900 mt-1">{totalCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Across all models & lines</div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Officially Approved</div>
          <div className="text-3xl font-black font-mono text-emerald-600 mt-1">{approvedCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Archived & locked for production</div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">In Approval Route</div>
          <div className="text-3xl font-black font-mono text-amber-600 mt-1">{inReviewCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Section In-Charge & HOD check</div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Drafts in Progress</div>
          <div className="text-3xl font-black font-mono text-slate-700 mt-1">{draftCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Pending engineer submission</div>
        </div>
      </div>

      {/* 3. SECTION STARTER PATTERN PREVIEW CARD */}
      <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 shadow-md border border-blue-800">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-xl text-blue-300">
              ⚡
            </div>
            <div>
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-300">
                STANDARD OPERATIONAL TEMPLATE
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                {concern.name} &bull; Section Starter Pattern
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onCreateNewWithStarter(concern)}
            className="px-4 py-2 bg-white text-slate-900 hover:bg-blue-50 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Initialize SOP with This Pattern</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-xs">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
            <div className="font-bold text-blue-200 text-xs flex items-center gap-1.5">
              <span>📝 Standard Process Steps (সহজ ও সাবলীল বাংলা)</span>
            </div>
            <ul className="space-y-1.5 text-slate-200 text-[11.5px] leading-relaxed">
              {concern.starterPattern.steps.slice(0, 3).map((step, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-blue-400 shrink-0 font-bold">&bull;</span>
                  <span>{step}</span>
                </li>
              ))}
              {concern.starterPattern.steps.length > 3 && (
                <li className="text-[10.5px] text-blue-300 italic pt-1">
                  + {concern.starterPattern.steps.length - 3} additional pre-configured steps included in full pattern
                </li>
              )}
            </ul>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
            <div>
              <div className="font-bold text-emerald-300 text-xs mb-1 flex items-center gap-1.5">
                <span>🛡️ Quality & Safety Checkpoints</span>
              </div>
              <p className="text-[11.5px] text-slate-200 line-clamp-2">
                {concern.starterPattern.qualityPoints[0] || '১০০% কোয়ালিটি প্যারামিটার ও WQMS স্ক্যানিং নিশ্চিতকরণ।'}
              </p>
            </div>

            <div className="pt-2 border-t border-white/10 flex flex-wrap items-center gap-2 text-[10.5px]">
              <span className="font-bold text-slate-300">Default PPE:</span>
              {concern.starterPattern.safety.gloves && (
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Gloves
                </span>
              )}
              {concern.starterPattern.safety.safetyShoes && (
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Safety Shoes
                </span>
              )}
              {concern.starterPattern.safety.goggles && (
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Goggles
                </span>
              )}
              {concern.starterPattern.safety.mask && (
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Mask
                </span>
              )}
              {concern.starterPattern.safety.earMuff && (
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Ear Muff
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. CONCERN SOPS TABLE / INVENTORY */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('draft')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                statusFilter === 'draft'
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Drafts ({draftCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('in_review')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                statusFilter === 'in_review'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              In Review ({inReviewCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('approved')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                statusFilter === 'approved'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              Approved &amp; Archived ({approvedCount})
            </button>
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search process, ref no, model..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* SOP Documents List */}
        {displaySops.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-3">
            <FileText className="w-12 h-12 mx-auto text-slate-300" />
            <div>
              <p className="text-sm font-bold text-slate-600">No SOP documents found for this filter</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Click below to initialize your first SOP using this section's prefilled starter pattern.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onCreateNewWithStarter(concern)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create SOP for {concern.shortName}</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displaySops.map((sop) => {
              const isApproved = sop.status === 'approved';
              const isInReview =
                sop.status === 'forwarded_to_checker' ||
                sop.status === 'checked' ||
                sop.status === 'forwarded_to_approver';

              return (
                <div
                  key={sop.id}
                  className={`bg-white border rounded-2xl p-4 shadow-xs transition hover:shadow-md flex flex-col justify-between ${
                    isApproved ? 'border-emerald-200' : isInReview ? 'border-amber-200' : 'border-slate-200'
                  }`}
                >
                  <div>
                    {/* Header: Ref No & Status Badge */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-mono text-[10.5px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 truncate max-w-[180px]">
                        {sop.header?.referenceNo || 'REF-UNASSIGNED'}
                      </span>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                          isApproved
                            ? 'bg-emerald-100 text-emerald-800'
                            : isInReview
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {isApproved ? 'Approved & Locked' : isInReview ? 'In Review' : 'Draft'}
                      </span>
                    </div>

                    {/* Process Name */}
                    <h4
                      className="text-sm font-bold text-slate-900 line-clamp-2 mb-1 cursor-pointer hover:text-blue-600 transition"
                      onClick={() => onOpenSopInEditor(sop)}
                      title={sop.header?.processName}
                    >
                      {sop.header?.processName || 'Untitled Process'}
                    </h4>

                    {/* Model & Station */}
                    <div className="text-[11px] text-slate-500 space-y-0.5 mb-3 font-medium">
                      <div>
                        <span className="font-semibold text-slate-700">Model:</span>{' '}
                        {sop.header?.model || 'All standard models'}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-700">Station:</span>{' '}
                        {sop.header?.stationLine || concern.starterPattern.stationLine}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-700">Prepared By:</span>{' '}
                        {sop.header?.preparedBy?.name || sop.authorName || 'Engineer'}
                      </div>
                    </div>
                  </div>

                  {/* Actions: If Approved -> ONLY PDF DOWNLOAD & VIEW (NO EDIT BUTTON) */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    {isApproved ? (
                      <>
                        <button
                          type="button"
                          onClick={() => onOpenSopInEditor(sop)}
                          className="flex-1 py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-600" />
                          <span>View Canvas</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDownloadPdf(sop)}
                          disabled={isDownloadingId === sop.id}
                          className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <FileDown className="w-3.5 h-3.5" />
                          <span>{isDownloadingId === sop.id ? 'Exporting...' : 'Official PDF'}</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => onOpenSopInEditor(sop)}
                          className="flex-1 py-2 px-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Open SOP Studio</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
