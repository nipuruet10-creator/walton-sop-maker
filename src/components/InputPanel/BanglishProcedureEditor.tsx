import React, { useState, useEffect, useRef } from 'react';
import type { SOPProcedure } from '../../types/sop';
import { toBengaliNumber } from '../../data/defaultSopData';
import { offlineConvertBanglish } from '../../services/banglishEngine';
import { Sparkles, Plus, Trash2, HelpCircle, CheckCircle2, Zap, Cpu, Type } from 'lucide-react';

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
  qualityFontSize?: 'auto' | 'compact' | 'normal' | 'large';
  onQualityFontSizeChange?: (size: 'auto' | 'compact' | 'normal' | 'large') => void;
  lastUsedEngine?: string;
}

export const BanglishProcedureEditor: React.FC<BanglishProcedureEditorProps> = ({
  procedure,
  onChange,
  onGenerate,
  isGenerating,
  onGenerateQuality,
  isGeneratingQuality = false,
  hasApiKey,
  activeProvider = 'openrouter',
  activeModel = 'google/gemma-2-9b-it:free',
  onOpenAiModal,
  stepFontSize = 'auto',
  onFontSizeChange,
  qualityFontSize = 'auto',
  onQualityFontSizeChange,
  lastUsedEngine,
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
    onChange({ ...procedure, steps: [...procedure.steps, `${prefix}নতুন কাজের ধাপ লিখুন...`] });
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

  return (
    <div className="space-y-4 text-xs">
      {/* 1. Real-time AI Integration Status Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-blue-950 border border-blue-800/60 rounded-xl p-3 shadow-md">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center shrink-0">
              <span className={`w-2.5 h-2.5 rounded-full ${hasApiKey ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
              <span className={`absolute w-4 h-4 rounded-full opacity-75 animate-ping ${hasApiKey ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-white text-[12px] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  {hasApiKey ? 'AI Connected: Online AI Active' : 'Smart Factory AI Engine: Active'}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-medium ${
                  hasApiKey
                    ? 'bg-blue-900/80 text-blue-200 border border-blue-600/50'
                    : 'bg-amber-950/80 text-amber-300 border border-amber-600/50'
                }`}>
                  {hasApiKey
                    ? activeProvider === 'openrouter'
                      ? `${activeModel.replace(':free', '').split('/').pop()}`
                      : 'Gemini 1.5 Flash'
                    : 'Built-in Rule & Phonetic Engine (0ms)'}
                </span>
              </div>
              <p className="text-[10.5px] text-slate-300 mt-0.5 leading-tight">
                {hasApiKey
                  ? 'AI translates notes into natural, fluent factory Bengali. Only acronyms (QR, WQMS, AC) stay in English.'
                  : 'Translates 100% of notes into simple, natural factory Bengali with zero raw English words.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {onOpenAiModal && (
              <button
                type="button"
                onClick={onOpenAiModal}
                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[11px] px-2.5 py-1 rounded-lg transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                title="Configure or switch AI model"
              >
                <Cpu className="w-3.5 h-3.5 text-white" />
                <span>{hasApiKey ? 'Change Model' : 'Connect Cloud AI'}</span>
              </button>
            )}
          </div>
        </div>

        {lastUsedEngine && (
          <div className="mt-2 pt-2 border-t border-slate-800 text-[10.5px] text-emerald-300 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Last translated by: <strong>{lastUsedEngine}</strong></span>
          </div>
        )}
      </div>

      {/* Banglish Input Box */}
      <div className="bg-slate-900 text-slate-100 p-3.5 rounded-xl border border-slate-800 shadow-md space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="font-bold text-white flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Banglish Input (AI Generator)</span>
          </label>

          <div className="flex items-center gap-1.5">
            {/* Auto Convert Toggle */}
            <button
              type="button"
              onClick={() => setAutoConvert(!autoConvert)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold transition cursor-pointer ${
                autoConvert
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
              title="Automatically translate Banglish to Bengali as you type"
            >
              <Zap className={`w-3 h-3 ${autoConvert ? 'text-amber-300' : ''}`} />
              <span>{autoConvert ? 'Auto-Translate ON' : 'Auto-Translate OFF'}</span>
            </button>
          </div>
        </div>

        {/* Translation Language Guideline Note */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[10.5px] text-slate-300 flex items-center gap-2">
          <span className="text-amber-400 font-bold">📌 নিয়ম:</span>
          <span>সহজ কারখানা বাংলা হবে। শুধু ২-১টি প্রয়োজনীয় এক্রোনিম (QR, WQMS, AC) ইংরেজি থাকবে, বাকি সব শুদ্ধ বাংলায় রূপান্তর হবে।</span>
        </div>

        {isGenerating && (
          <div className="bg-blue-900/40 border border-blue-600/50 text-blue-200 rounded-lg p-2.5 flex items-center gap-2 text-[11px] animate-pulse">
            <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
            <span>AI অনুবাদ চলছে: সহজ ও সাবলীল কারখানা বাংলায় রূপান্তর করা হচ্ছে...</span>
          </div>
        )}

        <textarea
          value={procedure.banglishInput}
          onChange={(e) => handleBanglishChange(e.target.value)}
          rows={6}
          placeholder={`Enter Banglish or English procedure notes here... e.g.:
1) Line e unit asar por scanner diye scan korte hobe. thik vabe jeno scan kore complete korte pare.
2) compressor bosate hobe thik vabe.
3) smart QR code sticker indoor unit e lagate hobe (chobi 1)...`}
          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 placeholder:text-slate-500 font-mono focus:outline-none focus:border-blue-500 resize-y leading-relaxed"
        />

        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <HelpCircle className="w-3 h-3 text-slate-400 shrink-0" />
            <span>Mention 'chobi 1', 'chobi 2' to auto-link with photo labels</span>
          </div>

          <button
            type="button"
            onClick={onGenerate}
            disabled={isGenerating || !procedure.banglishInput.trim()}
            className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-slate-700 disabled:to-slate-700 text-white px-3.5 py-1.5 rounded-lg font-bold transition cursor-pointer disabled:cursor-not-allowed shadow-md text-xs shrink-0"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin text-amber-300' : 'text-amber-300'}`} />
            <span>{isGenerating ? 'AI Translating...' : 'AI Generate (Easy Bengali SOP)'}</span>
          </button>
        </div>
      </div>

      {/* Font Size Adjuster for Procedure Steps */}
      <div className="bg-slate-100/90 p-2 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-2 shadow-xs">
        <div className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold">
          <Type className="w-3.5 h-3.5 text-blue-600" />
          <span>Step Font Size:</span>
        </div>
        <div className="flex items-center gap-1 bg-white p-0.5 rounded border border-slate-200 text-[11px]">
          {(
            [
              { key: 'auto', label: 'Auto' },
              { key: 'compact', label: 'Compact' },
              { key: 'normal', label: 'Normal' },
              { key: 'large', label: 'Large' },
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
              title={`Set procedure step font size to ${opt.label}`}
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
            <span>Procedure Steps</span>
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

      {/* Critical Quality Points */}
      <div className="space-y-2.5 pt-2 border-t border-slate-200">
        <div className="flex items-center justify-between border-b pb-1 gap-2 flex-wrap">
          <h3 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Critical Quality Points</span>
          </h3>

          <div className="flex items-center gap-2">
            {/* Font Size Selector for Quality Points */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[10px]">
              <span className="flex items-center gap-0.5 px-1 font-semibold text-slate-500">
                <Type className="w-3 h-3 text-amber-600" />
                <span>Size:</span>
              </span>
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
                  onClick={() => onQualityFontSizeChange?.(opt.id)}
                  className={`px-1.5 py-0.5 rounded transition cursor-pointer font-medium ${
                    (qualityFontSize || 'auto') === opt.id
                      ? 'bg-amber-600 text-white font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-950 hover:bg-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddQuality}
              className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
            >
              <Plus className="w-3 h-3" /> Add Point
            </button>
          </div>
        </div>

        {/* Dedicated Quality Points AI Generator Box */}
        <div className="bg-slate-900 text-slate-100 p-3 rounded-xl border border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <label className="font-bold text-amber-300 flex items-center gap-1.5 text-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Banglish Input (Quality Points AI Generator)</span>
            </label>
          </div>

          <textarea
            value={procedure.qualityBanglishInput || ''}
            onChange={(e) => onChange({ ...procedure, qualityBanglishInput: e.target.value })}
            rows={3}
            placeholder={`Enter Banglish or English notes for critical quality points... e.g.:
1) belt laganor somoy nissit korte hobe jate cartoon chire na jay (chobi-6).
2) tape boshonor somoy kheyal rakhte hobe jate tape baka na hoy ebong sojasuji thake...`}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 placeholder:text-slate-500 font-mono focus:outline-none focus:border-amber-500 resize-y leading-relaxed"
          />

          <div className="flex items-center justify-between gap-2 pt-0.5">
            <span className="text-[11px] text-slate-400">
              {hasApiKey ? 'Translates via AI into professional Bengali' : 'Translates via offline Bengali rule engine'}
            </span>

            <button
              type="button"
              onClick={onGenerateQuality}
              disabled={isGeneratingQuality || !procedure.qualityBanglishInput?.trim()}
              className="flex items-center gap-1.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:from-slate-700 disabled:to-slate-700 text-white px-3 py-1.5 rounded-lg font-bold transition cursor-pointer disabled:cursor-not-allowed shadow-md text-xs shrink-0"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isGeneratingQuality ? 'animate-spin text-yellow-200' : 'text-yellow-200'}`} />
              <span>{isGeneratingQuality ? 'Generating...' : 'AI Generate Quality Points'}</span>
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

      {/* General Instructions */}
      <div className="space-y-2 pt-2 border-t border-slate-200">
        <div className="flex items-center justify-between border-b pb-1">
          <h3 className="font-bold text-slate-800 text-xs">
            General Instructions
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
