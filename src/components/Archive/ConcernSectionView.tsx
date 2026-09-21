import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { SOPDocument } from '../../types/sop';
import { getAllSOPs } from '../../services/storageService';
import { downloadSOPAsPdf } from '../../services/pdfExporter';
import {
  ShieldCheck,
  Search,
  FileDown,
  CheckCircle2,
  X,
} from 'lucide-react';

interface ConcernSectionViewProps {
  isOpen: boolean;
  onClose: () => void;
  onViewOnCanvas: (sop: SOPDocument) => void;
}

export const ConcernSectionView: React.FC<ConcernSectionViewProps> = ({
  isOpen,
  onClose,
  onViewOnCanvas,
}) => {
  const [approvedSops, setApprovedSops] = useState<SOPDocument[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadApproved();
    }
  }, [isOpen]);

  const loadApproved = async () => {
    setLoading(true);
    try {
      const all = await getAllSOPs();
      const approvedOnly = all.filter((s) => s.status === 'approved');
      setApprovedSops(approvedOnly);
    } catch (e) {
      console.warn('Load approved error:', e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const filtered = approvedSops.filter((doc) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      doc.header.processName.toLowerCase().includes(term) ||
      doc.header.model.toLowerCase().includes(term) ||
      doc.header.stationLine.toLowerCase().includes(term) ||
      doc.header.referenceNo.toLowerCase().includes(term) ||
      (doc.authorName || '').toLowerCase().includes(term)
    );
  });

  const handleDownloadPdfDirect = async (sop: SOPDocument) => {
    setDownloadingId(sop.id || 'current');
    try {
      // First switch live canvas to this SOP so pdf exporter captures it
      onViewOnCanvas(sop);
      setTimeout(async () => {
        await downloadSOPAsPdf('sop-paper', sop.header.processName, sop.header.referenceNo);
        setDownloadingId(null);
      }, 300);
    } catch (err: any) {
      alert('PDF generation error: ' + (err.message || 'Unknown error'));
      setDownloadingId(null);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 w-full max-w-5xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-emerald-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-emerald-300">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight">Concern Section Dashboard</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
                  Approved Central Archive
                </span>
              </div>
              <p className="text-xs text-emerald-200">
                Officially approved Standard Operating Procedures (SOP) and direct PDF download
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-emerald-200 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Stats Bar */}
        <div className="p-4 bg-emerald-50/50 border-b border-emerald-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-bold text-emerald-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Total Approved SOPs: {approvedSops.length}</span>
            </span>
          </div>

          <div className="relative min-w-[280px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by process name, model, line or reference no..."
              className="w-full bg-white border border-slate-300 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* List of Approved SOPs */}
        <div className="flex-1 overflow-y-auto p-5 bg-slate-50 space-y-3">
          {loading ? (
            <div className="text-center py-16 text-slate-500 text-xs">
              Loading approved SOPs...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300 p-8 space-y-2">
              <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-700">No Approved SOPs Found</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Once officially approved by Process HOD (Kamrul Hasan), approved SOPs will automatically appear here.
              </p>
            </div>
          ) : (
            filtered.map((sop) => (
              <div
                key={sop.id}
                className="bg-white border border-emerald-200 hover:border-emerald-400 rounded-2xl p-4 shadow-xs hover:shadow-md transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                {/* Information */}
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>APPROVED</span>
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 truncate">
                      {sop.header.processName}
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-600 pt-1">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Model</span>
                      <strong className="text-slate-800">{sop.header.model || 'All Model'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Station / Line</span>
                      <strong className="text-slate-800">{sop.header.stationLine || '-'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Reference No</span>
                      <strong className="text-slate-800">{sop.header.referenceNo || '-'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Approval Date</span>
                      <strong className="text-slate-800">
                        {sop.approvedAt ? new Date(sop.approvedAt).toLocaleDateString() : sop.header.effectiveDate}
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-[10.5px] text-slate-500 pt-1">
                    <span>Prepared By: <strong>{sop.header.preparedBy.name}</strong></span>
                    <span>•</span>
                    <span>Reviewed By: <strong>{sop.header.checkedBy.name}</strong></span>
                    <span>•</span>
                    <span>Approved By: <strong className="text-emerald-700">{sop.header.approvedBy.name}</strong></span>
                  </div>
                </div>

                {/* Actions: Strict Rule 4: Only PDF download option */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <button
                    type="button"
                    onClick={() => handleDownloadPdfDirect(sop)}
                    disabled={downloadingId === sop.id}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-50 active:scale-95"
                    title="Download Official Approved PDF"
                  >
                    <FileDown className="w-3.5 h-3.5 text-white" />
                    <span>{downloadingId === sop.id ? 'Generating...' : 'Download PDF'}</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
