import React from 'react';
import type { SOPSafety } from '../../types/sop';
import { ShieldCheck } from 'lucide-react';

interface SafetyEditorProps {
  safety: SOPSafety;
  onChange: (safety: SOPSafety) => void;
}

export const SafetyEditor: React.FC<SafetyEditorProps> = ({ safety, onChange }) => {
  const ppeOptions = [
    { key: 'earMuff', label: 'Ear Muff (শব্দ প্রতিরোধক)', icon: '/ppe/ear-muff.svg' },
    { key: 'gloves', label: 'Hand Gloves (হাত মোজা)', icon: '/ppe/gloves.svg' },
    { key: 'goggles', label: 'Safety Goggles (চশমা)', icon: '/ppe/goggles.svg' },
    { key: 'safetyShoes', label: 'Safety Shoes (নিরাপত্তা জুতা)', icon: '/ppe/safety-shoes.svg' },
    { key: 'mask', label: 'Mask (মাস্ক)', icon: '/ppe/mask.svg' },
  ] as const;

  const togglePpe = (key: keyof Pick<SOPSafety, 'earMuff' | 'gloves' | 'goggles' | 'safetyShoes' | 'mask'>) => {
    onChange({
      ...safety,
      [key]: !safety[key],
    });
  };

  return (
    <div className="space-y-4 text-xs">
      <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-3">
        <div className="flex items-center gap-1.5 font-bold text-slate-800 border-b pb-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Safety & Personal Protective Equipment (PPE)</span>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            Safety Directive Statement (বাংলা)
          </label>
          <textarea
            value={safety.instructionText}
            onChange={(e) => onChange({ ...safety, instructionText: e.target.value })}
            rows={2}
            className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-2">
            Select Required PPE Icons for this station
          </label>
          <div className="grid grid-cols-2 gap-2">
            {ppeOptions.map((opt) => (
              <label
                key={opt.key}
                onClick={() => togglePpe(opt.key)}
                className={`flex items-center gap-2.5 p-2 rounded border cursor-pointer transition select-none ${
                  safety[opt.key]
                    ? 'bg-blue-50/80 border-blue-400 text-blue-950 font-medium'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <input
                  type="checkbox"
                  checked={safety[opt.key]}
                  onChange={() => {}} // Handled by label click
                  className="rounded text-blue-600 focus:ring-0 w-3.5 h-3.5"
                />
                <img src={opt.icon} alt={opt.label} className="w-6 h-6 object-contain" />
                <span className="text-[11px] truncate">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
