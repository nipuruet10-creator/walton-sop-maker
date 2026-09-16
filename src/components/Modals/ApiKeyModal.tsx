import React, { useState, useEffect } from 'react';
import { Key, X, ExternalLink, Check, Shield, RefreshCw, Sparkles, Cpu, Eye, EyeOff } from 'lucide-react';
import {
  fetchFreeOpenRouterModels,
  DEFAULT_FREE_MODELS,
  type OpenRouterModel,
  testOpenRouterKey,
} from '../../services/openrouterService';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  openRouterKey: string;
  openRouterModel: string;
  geminiKey: string;
  onSaveConfig: (config: {
    openRouterKey: string;
    openRouterModel: string;
    geminiKey: string;
    activeProvider: 'openrouter' | 'gemini';
  }) => void;
  activeProvider?: 'openrouter' | 'gemini';
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  openRouterKey,
  openRouterModel,
  geminiKey,
  onSaveConfig,
  activeProvider = 'openrouter',
}) => {
  const [provider, setProvider] = useState<'openrouter' | 'gemini'>(activeProvider);
  const [orKey, setOrKey] = useState(openRouterKey);
  const [orModel, setOrModel] = useState(openRouterModel || 'openrouter/free');
  const [gemKey, setGemKey] = useState(geminiKey);
  const [showKey, setShowKey] = useState(false);

  const [models, setModels] = useState<OpenRouterModel[]>(DEFAULT_FREE_MODELS);
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [fetchSuccessMsg, setFetchSuccessMsg] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleTestKey = async () => {
    setIsTestingKey(true);
    setTestResult(null);
    try {
      const res = await testOpenRouterKey(orKey);
      setTestResult(res);
      if (res.success) {
        handleFetchModels(orKey);
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Connection test failed.' });
    } finally {
      setIsTestingKey(false);
    }
  };

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      setOrKey(openRouterKey);
      setOrModel(openRouterModel || 'openrouter/free');
      setGemKey(geminiKey);
      setProvider(activeProvider);
      // Auto-fetch free models if opening modal
      handleFetchModels(openRouterKey);
    }
  }, [isOpen, openRouterKey, openRouterModel, geminiKey, activeProvider]);

  const handleFetchModels = async (keyToUse?: string) => {
    setIsFetchingModels(true);
    setFetchSuccessMsg(null);
    try {
      const fetched = await fetchFreeOpenRouterModels(keyToUse || orKey);
      setModels(fetched);
      setFetchSuccessMsg(`Found ${fetched.length} free AI models on OpenRouter!`);
      setTimeout(() => setFetchSuccessMsg(null), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsFetchingModels(false);
    }
  };

  const handleSave = () => {
    onSaveConfig({
      openRouterKey: orKey.trim(),
      openRouterModel: orModel.trim() || 'openrouter/free',
      geminiKey: gemKey.trim(),
      activeProvider: provider,
    });
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-5 border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-xl shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-sm">AI Engine Configuration</h2>
              <p className="text-[11px] text-slate-500">
                100% Pure Bengali SOP Generator & Step Modifier
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Provider Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl mb-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setProvider('openrouter')}
            className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
              provider === 'openrouter'
                ? 'bg-white text-blue-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>OpenRouter (Free AI Models)</span>
            <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
              FREE
            </span>
          </button>

          <button
            type="button"
            onClick={() => setProvider('gemini')}
            className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
              provider === 'gemini'
                ? 'bg-white text-blue-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Google Gemini Direct</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="space-y-4 text-xs">
          {provider === 'openrouter' ? (
            <>
              {/* OpenRouter Info Notice */}
              <div className="bg-blue-50/80 border border-blue-200/80 p-3 rounded-xl text-blue-950 text-[11.5px] leading-relaxed">
                <p className="font-semibold text-blue-900 flex items-center gap-1.5 mb-1">
                  <span>⚡ OpenRouter Free AI Access</span>
                </p>
                <p className="text-slate-600 mb-1.5">
                  OpenRouter allows you to use top AI models like <strong>Gemma, Llama 3.3, DeepSeek, Qwen</strong> completely free. Your API key stays private in your browser’s local storage.
                </p>
                <p className="text-[11px] text-emerald-800 bg-emerald-50/80 p-1.5 rounded-lg border border-emerald-200/60 font-medium">
                  💡 <strong>টিপস:</strong> কোনো API Key ছাড়াও আমাদের বিল্ট-ইন বাংলা ইঞ্জিন ১০০% শুদ্ধ বাংলায় রূপান্তর করতে পারে। অতিরিক্ত AI শক্তি চাইলে একটি ফ্রি কী যুক্ত করতে পারেন।
                </p>
              </div>

              {/* API Key Field */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">OpenRouter API Key</label>
                  <a
                    href="https://openrouter.ai/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <span>Get free key at openrouter.ai/keys</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>

                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={orKey}
                    onChange={(e) => {
                      setOrKey(e.target.value);
                      setTestResult(null);
                    }}
                    placeholder="sk-or-v1-..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-3 pr-9 py-2 text-xs font-mono focus:outline-none focus:border-blue-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Key Test Action & Feedback */}
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[10.5px] text-slate-500">
                    {orKey.trim() ? 'কী চেক করে দেখতে পারেন:' : 'কী থাকলে কানেকশন টেস্ট করুন:'}
                  </span>
                  <button
                    type="button"
                    onClick={handleTestKey}
                    disabled={isTestingKey || !orKey.trim()}
                    className="text-[10.5px] bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-2.5 py-0.8 rounded-md font-medium cursor-pointer transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <RefreshCw className={`w-2.5 h-2.5 ${isTestingKey ? 'animate-spin' : ''}`} />
                    <span>{isTestingKey ? 'চেক হচ্ছে...' : 'টেস্ট কী (Test Key)'}</span>
                  </button>
                </div>

                {testResult && (
                  <div
                    className={`mt-1.5 p-2 rounded-lg text-[11px] flex items-center gap-1.5 border ${
                      testResult.success
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border-rose-200'
                    }`}
                  >
                    <span>{testResult.message}</span>
                  </div>
                )}
              </div>

              {/* Model Auto-Fetch and Selector */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <span>Select Free AI Model</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                      {models.length} Available
                    </span>
                  </label>

                  <button
                    type="button"
                    onClick={() => handleFetchModels()}
                    disabled={isFetchingModels}
                    className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-medium cursor-pointer disabled:opacity-50"
                    title="Fetch latest free models list from OpenRouter"
                  >
                    <RefreshCw className={`w-3 h-3 ${isFetchingModels ? 'animate-spin' : ''}`} />
                    <span>{isFetchingModels ? 'Fetching...' : 'Auto-Fetch Free Models'}</span>
                  </button>
                </div>

                {fetchSuccessMsg && (
                  <div className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 p-1.5 rounded-lg mb-1.5 flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>{fetchSuccessMsg}</span>
                  </div>
                )}

                <select
                  value={orModel}
                  onChange={(e) => setOrModel(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer transition"
                >
                  {models.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.id})
                    </option>
                  ))}
                </select>

                <div className="mt-1.5 text-[10.5px] text-slate-500 flex items-center justify-between">
                  <span>Selected Model: <strong className="text-slate-700 font-mono">{orModel}</strong></span>
                  {orModel.includes(':free') || orModel === 'openrouter/free' ? (
                    <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                      ✓ Free tier verified
                    </span>
                  ) : null}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Gemini Provider Form */}
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-amber-900 text-[11.5px] leading-relaxed">
                <p>
                  Direct Google Gemini API connection using Gemini 1.5 Flash.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">Google Gemini API Key</label>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <span>Get free Gemini key</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>

                <input
                  type={showKey ? 'text' : 'password'}
                  value={gemKey}
                  onChange={(e) => setGemKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-blue-500 transition"
                />
              </div>
            </>
          )}

          {/* Privacy footer */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <div className="flex items-center gap-1 text-emerald-600 font-medium">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              <span>100% Client-side (Stored safely in your browser)</span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition text-xs font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-4 py-1.5 rounded-lg text-xs font-semibold shadow-md transition cursor-pointer"
            >
              {saved ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Settings Saved!</span>
                </>
              ) : (
                <span>Save Configuration</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
