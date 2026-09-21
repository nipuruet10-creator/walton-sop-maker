import React from 'react';
import type { SOPPartRow, SOPToolRow } from '../../types/sop';
import { Wrench, Package, Plus, Trash2 } from 'lucide-react';

interface TablesEditorProps {
  parts: SOPPartRow[];
  tools: SOPToolRow[];
  onPartsChange: (parts: SOPPartRow[]) => void;
  onToolsChange: (tools: SOPToolRow[]) => void;
}

export const TablesEditor: React.FC<TablesEditorProps> = ({
  parts,
  tools,
  onPartsChange,
  onToolsChange,
}) => {
  // Parts Handlers
  const handlePartChange = (index: number, field: keyof SOPPartRow, val: any) => {
    const updated = [...parts];
    updated[index] = { ...updated[index], [field]: val };
    onPartsChange(updated);
  };

  const handleAddPart = () => {
    onPartsChange([...parts, { sl: parts.length + 1, name: '', capacity: '', gas: '' }]);
  };

  const handleDeletePart = (index: number) => {
    const updated = parts.filter((_, i) => i !== index).map((p, idx) => ({ ...p, sl: idx + 1 }));
    onPartsChange(updated);
  };

  // Tools Handlers
  const handleToolChange = (index: number, field: keyof SOPToolRow, val: any) => {
    const updated = [...tools];
    updated[index] = { ...updated[index], [field]: val };
    onToolsChange(updated);
  };

  const handleAddTool = () => {
    onToolsChange([...tools, { sl: tools.length + 1, name: '', effectiveRange: '' }]);
  };

  const handleDeleteTool = (index: number) => {
    const updated = tools.filter((_, i) => i !== index).map((t, idx) => ({ ...t, sl: idx + 1 }));
    onToolsChange(updated);
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Parts Table */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2">
        <div className="flex items-center justify-between border-b pb-1">
          <div className="flex items-center gap-1.5 font-bold text-slate-800">
            <Package className="w-3.5 h-3.5 text-blue-600" />
            <span>Parts List Table</span>
            <span className="text-[10px] text-blue-600 font-normal bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
              3 Rows on SOP Layout
            </span>
          </div>
          <button
            type="button"
            onClick={handleAddPart}
            className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
          >
            <Plus className="w-3 h-3" /> Add Row
          </button>
        </div>

        <div className="space-y-1 max-h-48 overflow-y-auto">
          {parts.map((part, idx) => (
            <div key={idx} className="flex items-center gap-1.5">
              <span className="w-5 text-center font-bold text-slate-400 text-[11px] shrink-0">
                {idx + 1}
              </span>
              <input
                type="text"
                placeholder="Parts Name"
                value={part.name}
                onChange={(e) => handlePartChange(idx, 'name', e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-xs focus:outline-none focus:border-blue-500"
              />
              <input
                type="text"
                placeholder="Capacity(BTU)"
                value={part.capacity}
                onChange={(e) => handlePartChange(idx, 'capacity', e.target.value)}
                className="w-24 bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-xs focus:outline-none focus:border-blue-500"
              />
              <input
                type="text"
                placeholder="Gas"
                value={part.gas}
                onChange={(e) => handlePartChange(idx, 'gas', e.target.value)}
                className="w-16 bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-xs focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => handleDeletePart(idx)}
                className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Tools & Equipment Table */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2">
        <div className="flex items-center justify-between border-b pb-1">
          <div className="flex items-center gap-1.5 font-bold text-slate-800">
            <Wrench className="w-3.5 h-3.5 text-amber-600" />
            <span>Tools & Equipments Table</span>
            <span className="text-[10px] text-amber-700 font-normal bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
              3 rows on SOP paper
            </span>
          </div>
          <button
            type="button"
            onClick={handleAddTool}
            className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
          >
            <Plus className="w-3 h-3" /> Add Row
          </button>
        </div>

        <div className="space-y-1 max-h-48 overflow-y-auto">
          {tools.map((tool, idx) => (
            <div key={idx} className="flex items-center gap-1.5">
              <span className="w-5 text-center font-bold text-slate-400 text-[11px] shrink-0">
                {idx + 1}
              </span>
              <input
                type="text"
                placeholder="Tool Name"
                value={tool.name}
                onChange={(e) => handleToolChange(idx, 'name', e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-xs focus:outline-none focus:border-blue-500"
              />
              <input
                type="text"
                placeholder="Effective Range"
                value={tool.effectiveRange}
                onChange={(e) => handleToolChange(idx, 'effectiveRange', e.target.value)}
                className="w-32 bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-xs focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => handleDeleteTool(idx)}
                className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
