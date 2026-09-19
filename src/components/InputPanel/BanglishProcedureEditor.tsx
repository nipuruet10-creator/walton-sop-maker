import React, { useState, useEffect, useRef } from 'react';
import type { SOPProcedure } from '../../types/sop';
import { toBengaliNumber } from '../../data/defaultSopData';
import { offlineConvertBanglish } from '../../services/banglishEngine';
import { Sparkles, Plus, Trash2, HelpCircle, CheckCircle2, Zap, BookmarkCheck, Cpu, Type } from 'lucide-react';

interface BanglishProcedureEditorProps {
  procedure: SOPProcedure;
  onChange: (procedure: SOPProcedure) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  onGenerateQuality?: () => void;
  isGeneratingQuality?: boolean;
  hasApiKey: boolean;
  activeProvider?: 'openrouter' | 'gemini';
  activeModel?: string;
  onOpenAiModal?: () => void;
  stepFontSize?: 'auto' | 'compact' | 'normal' | 'large' | 'xlarge';
  onFontSizeChange?: (size: 'auto' | 'compact' | 'normal' | 'large' | 'xlarge') => void;
}

const PRESET_TEMPLATES = [
  {
    title: 'Walton Cassette IDU (টেপিং)',
    text: `1) prothome Packaging Tape Dispenser theke 200 mm lomba BOPP tape kete nite hobe. sothik vabe lagay nite hobe.
2) Cassette indoor cartoon er chihnito sthane shothikbhabe tepti boshate hobe (chobi-1).
3) indoor cartoon er every ta taping jaygay ek layer BOPP tape use korte hobe (chobi-2).
4) chobi-3 onujayi Cassette indoor cartoon er nicher dike BOPP tape use korte hobe.
5) chobi-4 e dekhano onujayi, cartoon er ubhoy pashe 4 ti kore mot 8 ti nirdishto sthane BOPP tape use korte hobe.
6) chobi-5 onusare PET belt machine e 3 setting kore cartoone shothikbabe belt dite hobe.`,
  },
  {
    title: 'Refrigerator (ডোর গ্যাসকেট)',
    text: `1) prothome Refrigerator door groove valo vabe clean kore nite hobe.
2) Rubber gasket er char corner chihnito sthane thikbhabe press kore boshate hobe (chobi-1).
3) door er char pashe gasket e uniform gap check korte hobe (chobi-2).
4) door close kore magnetic seal thik ase kina inspection korte hobe (chobi-3).`,
  },
];

export const BanglishProcedureEditor: React.FC<BanglishProcedureEditorProps> = ({
  procedure,
  onChange,
  onGenerate,
  isGenerating,
  onGenerateQuality,
  isGeneratingQuality = false,
  hasApiKey,
  activeProvider = 'openrouter',
  activeModel = 'openrouter/free',
  onOpenAiModal,
  stepFontSize = 'auto',
  onFontSizeChange,
}) => {
  const [autoConvert, setAutoConvert] = useState<boolean>(false);
  const debounceTimerRef = useRef<any>(null);

  // Auto-convert on Banglish input change if enabled
  const handleBanglishChange = (text: string) => {
    onChange({ ...procedure, banglishInput: text });

    if (autoConvert) {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        if (text.trim()) {
          const result = offlineConvertBanglish(text);
          onChange({
            ...procedure,
            banglishInput: text,
            steps: result.steps,
            qualityPoints: result.qualityPoints,
            generalInstructions: result.generalInstructions,
          });
        }
      }, 400);
    }
  };

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  // Step handlers
  const handleStepChange = (index: number, text: string) => {
    const updated = [...procedure.steps];
    updated[index] = text;
    onChange({ ...procedure, steps: updated });
  };

  const handleAddStep = () => {
    const newIdx = procedure.steps.length + 1;
    const prefix = `${toBengaliNumber(newIdx)}) `;
    onChange({ ...procedure, steps: [...procedure.steps, `${prefix}নুতন কাজের ধাপ লিখুন...`] });
  };

  const handleDeleteStep = (index: number) => {
    const updated = procedure.steps.filter((_, i) => i !== index);
    onChange({ ...procedure, steps: updated });
  };

  // Quality Points handlers
  const handleQualityChange = (index: number, text: string) => {
    const updated = [...procedure.qualityPoints];
    updated[index] = text;
    onChange({ ...procedure, qualityPoints: updated });
  };

  const handleAddQuality = () => {
    const newIdx = procedure.qualityPoints.length + 1;
    const prefix = `${toBengaliNumber(newIdx)}) `;
    onChange({ ...procedure, qualityPoints: [...procedure.qualityPoints, `${prefix}গুরুত্বপূর্ণ লক্ষণীয় বিষয়...`] });
  };

  const handleDeleteQuality = (index: number) => {
    const updated = procedure.qualityPoints.filter((_, i) => i !== index);
    onChange({ ...procedure, qualityPoints: updated });
  };

  // General Instructions handlers
  const handleInstructionChange = (index: number, text: string) => {
    const updated = [...procedure.generalInstructions];
    updated[index] = text;
    onChange({ ...procedure, generalInstructions: updated });
  };

  const handleAddInstruction = () => {
    const newIdx = procedure.generalInstructions.length + 1;
    const prefix = `${toBengaliNumber(newIdx)}) `;
    onChange({ ...procedure, generalInstructions: [...procedure.generalInstructions, `${prefix}সাধারণ নির্দেশনা...`] });
  };

  const handleDeleteInstruction = (index: number) => {
    const updated = procedure.generalInstructions.filter((_, i) => i !== index);
    onChange({ ...procedure, generalInstructions: updated });
  };

  const applyPreset = (presetText: string) => {
    handleBanglishChange(presetText);
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Banglish Input Box */}
      <div className="bg-slate-900 text-slate-100 p-3.5 rounded-xl border border-slate-800 shadow-md space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="font-bold text-white flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Banglish Input (AI Generator)</span>
          </label>

          <div className="flex items-center gap-1.5">
            {onOpenAiModal ? (
              <button
                type="button"
                onClick={onOpenAiModal}
                className={`text-[10px] px-2 py-0.5 rounded cursor-pointer transition flex items-center gap-1 ${
                  hasApiKey
                    ? 'bg-blue-900/60 text-blue-300 border border-blue-700/60 hover:bg-blue-800/60'
                    : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                }`}
                title="Click to configure AI Model / OpenRouter API"
              >
                <Cpu className="w-2.5 h-2.5 text-blue-400" />
                <span>
                  {hasApiKey
                    ? activeProvider === 'openrouter'
                      ? `AI: ${activeModel.replace(':free', '').split('/').pop()}`
                      : 'Gemini AI'
                    : 'বাংলা ইঞ্জিন (Setup AI)'}
                </span>
              </button>
            ) : (
              <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                {hasApiKey ? 'AI Ready' : 'বাংলা ইঞ্জিন'}
              </span>
            )}

            {/* Auto Convert Toggle */}
            <button
              type="button"
              onClick={() => setAutoConvert(!autoConvert)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold transition cursor-pointer ${
                autoConvert
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
              title="বাংলিশ লেখার সাথে সাথে নিচে স্বয়ংক্রিয়ভাবে বাংলায় অনুবাদ হবে"
            >
              <Zap className={`w-3 h-3 ${autoConvert ? 'text-amber-300' : ''}`} />
              <span>{autoConvert ? 'Auto-Translate ON' : 'Auto-Translate OFF'}</span>
            </button>
          </div>
        </div>

        {/* Quick Sample Presets */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          <span className="text-[10px] text-slate-400 shrink-0">স্যাম্পল টেমপ্লেট:</span>
          {PRESET_TEMPLATES.map((tmpl, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => applyPreset(tmpl.text)}
              className="text-[10px] bg-slate-800 hover:bg-slate-700 text-blue-300 px-2 py-0.5 rounded whitespace-nowrap transition cursor-pointer flex items-center gap-1 border border-slate-700"
            >
              <BookmarkCheck className="w-2.5 h-2.5" />
              <span>{tmpl.title}</span>
            </button>
          ))}
        </div>

        <textarea
          value={procedure.banglishInput}
          onChange={(e) => handleBanglishChange(e.target.value)}
          rows={6}
          placeholder="এখানে বাংলিশ বা ইংরেজিতে ধাপগুলো লিখুন... যেমন:
1) packaging tape dispenser theke 200 mm bopp tape kete nite hobe.
2) cartoon er marked sthane tepti boshate hobe (chobi 1).
3) indoor cartoon er every ta taping jaygay ek layer BOPP tape use korte hobe (chobi 2)..."
          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 placeholder:text-slate-500 font-mono focus:outline-none focus:border-blue-500 resize-y leading-relaxed"
        />

        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <HelpCircle className="w-3 h-3 text-slate-400 shrink-0" />
            <span>'chobi 1', 'chobi-2 onujayi' লিখলে ছবির সাথে লিংক হবে</span>
          </div>

          <button
            type="button"
            onClick={onGenerate}
            disabled={isGenerating || !procedure.banglishInput.trim()}
            className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-slate-700 disabled:to-slate-700 text-white px-3.5 py-1.5 rounded-lg font-bold transition cursor-pointer disabled:cursor-not-allowed shadow-md text-xs shrink-0"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin text-amber-300' : 'text-amber-300'}`} />
            <span>{isGenerating ? 'AI অনুবাদ ও পরিমার্জন হচ্ছে...' : 'AI Generate (100% Bengali)'}</span>
          </button>
        </div>
      </div>

      {/* Font Size Adjuster for Procedure Steps */}
      <div className="bg-slate-100/90 p-2 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-2 shadow-xs">
        <div className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold">
          <Type className="w-3.5 h-3.5 text-blue-600" />
          <span>টেক্সট ফন্ট সাইজ (Font Size):</span>
        </div>
        <div className="flex items-center gap-1 bg-white p-0.5 rounded border border-slate-200 text-[11px]">
          {(
            [
              { key: 'auto', label: 'Auto (স্বয়ংক্রিয়)' },
              { key: 'compact', label: 'ছোট' },
              { key: 'normal', label: 'স্বাভাবিক' },
              { key: 'large', label: 'বড়' },
            ] as const
          ).map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => onFontSizeChange?.(opt.key)}
              className={`px-2 py-0.5 rounded text-[10.5px] font-medium transition cursor-pointer ${
                stepFontSize === opt.key
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title={`SOP পেপারের টেক্সট সাইজ ${opt.label} করুন`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Generated / Editable Bengali Procedure: কার্যপ্রণালী */}
      <div className="space-y-2">
        <div className="flex items-center justify-between border-b pb-1">
          <h3 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>কার্যপ্রণালী (Procedure Steps)</span>
          </h3>
          <button
            type="button"
            onClick={handleAddStep}
            className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
          >
            <Plus className="w-3 h-3" /> Add Step
          </button>
        </div>

        <div className="space-y-1.5">
          {procedure.steps.map((step, idx) => (
            <div key={idx} className="flex items-start gap-1.5 bg-white p-1 rounded border border-slate-200">
              <span className="font-bold text-slate-500 pt-1 w-5 text-right shrink-0">
                {toBengaliNumber(idx + 1)})
              </span>
              <textarea
                value={step.replace(/^([০-৯\d]+[\)\.\-:]\s*)/, '')}
                onChange={(e) => handleStepChange(idx, `${toBengaliNumber(idx + 1)}) ${e.target.value}`)}
                rows={2}
                className="flex-1 bg-transparent border-none p-1 text-xs text-slate-800 focus:outline-none focus:bg-amber-50/50 resize-y"
              />
              <button
                type="button"
                onClick={() => handleDeleteStep(idx)}
                className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer shrink-0"
                title="Remove step"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* লক্ষণীয় বিষয় (Quality Points) */}
      <div className="space-y-2.5 pt-2 border-t border-slate-200">
        <div className="flex items-center justify-between border-b pb-1">
          <h3 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>লক্ষণীয় বিষয় (Critical Quality Points)</span>
          </h3>
          <button
            type="button"
            onClick={handleAddQuality}
            className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
          >
            <Plus className="w-3 h-3" /> Add Point
          </button>
        </div>

        {/* Dedicated Quality Points AI Generator Box */}
        <div className="bg-slate-900 text-slate-100 p-3 rounded-xl border border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <label className="font-bold text-amber-300 flex items-center gap-1.5 text-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Banglish Input (লক্ষণীয় বিষয় AI Generator)</span>
            </label>
            <button
              type="button"
              onClick={() => {
                const sample = `1) belt laganor somoy nissit korte hobe jate cartoon chire na jay (chobi-6).
2) tape boshonor somoy kheyal rakhte hobe jate tape baka na hoy ebong sojasuji thake.
3) protiti jaygay 1 layer tape shothikbhabe deya hoyese kina check korte hobe.`;
                onChange({ ...procedure, qualityBanglishInput: sample });
              }}
              className="text-[10px] bg-slate-800 hover:bg-slate-700 text-amber-300 px-2 py-0.5 rounded border border-slate-700 transition cursor-pointer flex items-center gap-1"
            >
              <BookmarkCheck className="w-2.5 h-2.5" />
              <span>স্যাম্পল দিন</span>
            </button>
          </div>

          <textarea
            value={procedure.qualityBanglishInput || ''}
            onChange={(e) => onChange({ ...procedure, qualityBanglishInput: e.target.value })}
            rows={3}
            placeholder="এখানে লক্ষণীয় বিষয় বা চেকিং পয়েন্ট বাংলিশ/ইংরেজিতে লিখুন... যেমন:
1) belt laganor somoy nissit korte hobe jate cartoon chire na jay (chobi-6).
2) tape boshonor somoy kheyal rakhte hobe jate tape baka na hoy ebong sojasuji thake..."
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 placeholder:text-slate-500 font-mono focus:outline-none focus:border-amber-500 resize-y leading-relaxed"
          />

          <div className="flex items-center justify-between gap-2 pt-0.5">
            <span className="text-[11px] text-slate-400">
              {hasApiKey ? 'OpenRouter AI দিয়ে সম্পূর্ণ বাংলায় অনুবাদ হবে' : 'অফলাইন ইঞ্জিন দিয়ে বাংলায় রূপান্তর হবে'}
            </span>

            <button
              type="button"
              onClick={onGenerateQuality}
              disabled={isGeneratingQuality || !procedure.qualityBanglishInput?.trim()}
              className="flex items-center gap-1.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:from-slate-700 disabled:to-slate-700 text-white px-3 py-1.5 rounded-lg font-bold transition cursor-pointer disabled:cursor-not-allowed shadow-md text-xs shrink-0"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isGeneratingQuality ? 'animate-spin text-yellow-200' : 'text-yellow-200'}`} />
              <span>{isGeneratingQuality ? 'AI অনুবাদ হচ্ছে...' : 'AI Generate Quality Points'}</span>
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          {procedure.qualityPoints.map((point, idx) => (
            <div key={idx} className="flex items-start gap-1.5 bg-white p-1 rounded border border-slate-200">
              <span className="font-bold text-slate-500 pt-1 w-5 text-right shrink-0">
                {toBengaliNumber(idx + 1)})
              </span>
              <textarea
                value={point.replace(/^([০-৯\d]+[\)\.\-:]\s*)/, '')}
                onChange={(e) => handleQualityChange(idx, `${toBengaliNumber(idx + 1)}) ${e.target.value}`)}
                rows={2}
                className="flex-1 bg-transparent border-none p-1 text-xs text-slate-800 focus:outline-none focus:bg-amber-50/50 resize-y"
              />
              <button
                type="button"
                onClick={() => handleDeleteQuality(idx)}
                className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* সাধারণ নির্দেশনা (General Instructions) */}
      <div className="space-y-2 pt-2 border-t border-slate-200">
        <div className="flex items-center justify-between border-b pb-1">
          <h3 className="font-bold text-slate-800 text-xs">
            সাধারণ নির্দেশনা (General Instructions)
          </h3>
          <button
            type="button"
            onClick={handleAddInstruction}
            className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
          >
            <Plus className="w-3 h-3" /> Add Instruction
          </button>
        </div>

        <div className="space-y-1.5">
          {procedure.generalInstructions.map((item, idx) => (
            <div key={idx} className="flex items-start gap-1.5 bg-white p-1 rounded border border-slate-200">
              <span className="font-bold text-slate-500 pt-1 w-5 text-right shrink-0">
                {toBengaliNumber(idx + 1)})
              </span>
              <textarea
                value={item.replace(/^([০-৯\d]+[\)\.\-:]\s*)/, '')}
                onChange={(e) => handleInstructionChange(idx, `${toBengaliNumber(idx + 1)}) ${e.target.value}`)}
                rows={2}
                className="flex-1 bg-transparent border-none p-1 text-xs text-slate-800 focus:outline-none focus:bg-amber-50/50 resize-y"
              />
              <button
                type="button"
                onClick={() => handleDeleteInstruction(idx)}
                className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer shrink-0"
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
