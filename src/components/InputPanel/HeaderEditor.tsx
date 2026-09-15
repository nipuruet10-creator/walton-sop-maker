import React, { useRef } from 'react';
import type { SOPHeader } from '../../types/sop';
import { FileText, UserCheck, Upload, Trash2 } from 'lucide-react';

interface HeaderEditorProps {
  header: SOPHeader;
  onChange: (header: SOPHeader) => void;
}

export const HeaderEditor: React.FC<HeaderEditorProps> = ({ header, onChange }) => {
  const sigInputRef = useRef<HTMLInputElement>(null);

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      onChange({
        ...header,
        preparedBy: {
          ...header.preparedBy,
          signatureImg: event.target?.result as string,
        },
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4 text-xs">
      {/* General Document Details */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2.5">
        <div className="flex items-center gap-1.5 font-bold text-slate-800 border-b pb-1">
          <FileText className="w-3.5 h-3.5 text-blue-600" />
          <span>Process & Model Specifications</span>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Process Name</label>
          <input
            type="text"
            value={header.processName}
            onChange={(e) => onChange({ ...header, processName: e.target.value })}
            className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Model</label>
            <input
              type="text"
              value={header.model}
              onChange={(e) => onChange({ ...header, model: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Station / Line</label>
            <input
              type="text"
              value={header.stationLine}
              onChange={(e) => onChange({ ...header, stationLine: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Reference No</label>
            <input
              type="text"
              value={header.referenceNo}
              onChange={(e) => onChange({ ...header, referenceNo: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1.5 text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Effective Date</label>
            <input
              type="text"
              value={header.effectiveDate}
              onChange={(e) => onChange({ ...header, effectiveDate: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Revision No</label>
            <input
              type="text"
              value={header.revisionNo}
              onChange={(e) => onChange({ ...header, revisionNo: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Reason of Changes</label>
            <input
              type="text"
              value={header.reasonOfChanges}
              onChange={(e) => onChange({ ...header, reasonOfChanges: e.target.value })}
              placeholder="e.g. New Model Introduction"
              className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Format Ref. No</label>
            <input
              type="text"
              value={header.formatRefNo}
              onChange={(e) => onChange({ ...header, formatRefNo: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1.5 text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Approvals & Prepared By */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2.5">
        <div className="flex items-center gap-1.5 font-bold text-slate-800 border-b pb-1">
          <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Prepared By (Process Engineer)</span>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Engineer Name & ID</label>
          <input
            type="text"
            value={header.preparedBy.name}
            onChange={(e) =>
              onChange({
                ...header,
                preparedBy: { ...header.preparedBy, name: e.target.value },
              })
            }
            className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Designation</label>
            <input
              type="text"
              value={header.preparedBy.designation}
              onChange={(e) =>
                onChange({
                  ...header,
                  preparedBy: { ...header.preparedBy, designation: e.target.value },
                })
              }
              className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Department / Org</label>
            <input
              type="text"
              value={header.preparedBy.dept}
              onChange={(e) =>
                onChange({
                  ...header,
                  preparedBy: { ...header.preparedBy, dept: e.target.value },
                })
              }
              className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Signature Stamp Upload */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            Signature Stamp (Optional)
          </label>
          <input
            type="file"
            ref={sigInputRef}
            onChange={handleSignatureUpload}
            accept="image/*"
            className="hidden"
          />
          {header.preparedBy.signatureImg ? (
            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded border border-slate-200">
              <img
                src={header.preparedBy.signatureImg}
                alt="Signature"
                className="h-8 max-w-[120px] object-contain bg-white rounded border border-slate-200"
              />
              <button
                type="button"
                onClick={() =>
                  onChange({
                    ...header,
                    preparedBy: { ...header.preparedBy, signatureImg: '' },
                  })
                }
                className="text-rose-600 hover:text-rose-700 flex items-center gap-1 text-[11px] ml-auto cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Remove
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => sigInputRef.current?.click()}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded border border-slate-300 transition text-[11px] cursor-pointer"
            >
              <Upload className="w-3 h-3" /> Upload Signature Image
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
