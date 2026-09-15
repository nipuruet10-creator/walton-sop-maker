import { toBengaliNumber } from '../data/defaultSopData';
import type { GeneratedSOPContent } from './banglishEngine';

export interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  context_length?: number;
  isFree: boolean;
}

export const OPENROUTER_API_KEY_STORAGE = 'walton_sop_openrouter_api_key';
export const OPENROUTER_MODEL_STORAGE = 'walton_sop_openrouter_model';

// Fallback high-quality free models list
export const DEFAULT_FREE_MODELS: OpenRouterModel[] = [
  {
    id: 'openrouter/free',
    name: 'OpenRouter Free Auto-Router (Best Free Model Auto-Selected)',
    isFree: true,
    description: 'Automatically routes to the fastest, most reliable free model on OpenRouter',
  },
  {
    id: 'google/gemma-4-31b-it:free',
    name: 'Google: Gemma 4 31B IT (Free)',
    isFree: true,
    description: 'Google state-of-the-art open model with outstanding Bengali multilingual skills',
  },
  {
    id: 'google/gemma-4-26b-a4b-it:free',
    name: 'Google: Gemma 4 26B IT (Free)',
    isFree: true,
    description: 'Fast Google reasoning model with strong instruction following',
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct:free',
    name: 'Meta: Llama 3.3 70B Instruct (Free)',
    isFree: true,
    description: 'Meta flagship 70B parameter model with great reasoning and formatting',
  },
  {
    id: 'deepseek/deepseek-chat:free',
    name: 'DeepSeek: DeepSeek V3 (Free)',
    isFree: true,
    description: 'Top-tier general purpose LLM with deep multilingual proficiency',
  },
  {
    id: 'qwen/qwen-2.5-72b-instruct:free',
    name: 'Qwen: Qwen 2.5 72B Instruct (Free)',
    isFree: true,
    description: 'Powerful multilingual model with exceptional Bengali translation',
  },
  {
    id: 'google/gemini-2.0-flash-exp:free',
    name: 'Google: Gemini 2.0 Flash Exp (Free)',
    isFree: true,
    description: 'Next-generation ultra-fast multimodal model',
  },
];

/**
 * Fetch list of all active free models from OpenRouter API
 */
export async function fetchFreeOpenRouterModels(apiKey?: string): Promise<OpenRouterModel[]> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (apiKey && apiKey.trim()) {
      headers['Authorization'] = `Bearer ${apiKey.trim()}`;
    }

    const res = await fetch('https://openrouter.ai/api/v1/models', {
      headers,
    });

    if (!res.ok) {
      console.warn(`OpenRouter models API returned ${res.status}, using default free models.`);
      return DEFAULT_FREE_MODELS;
    }

    const data = await res.json();
    const rawList: any[] = data?.data || [];

    const freeModels: OpenRouterModel[] = rawList
      .filter((m: any) => {
        const id = m.id || '';
        const isFreeId = id.endsWith(':free') || id === 'openrouter/free';
        const isZeroPrice = m.pricing && m.pricing.prompt === '0' && m.pricing.completion === '0';
        return isFreeId || isZeroPrice;
      })
      .map((m: any) => ({
        id: m.id,
        name: m.name || m.id,
        description: m.description,
        context_length: m.context_length,
        isFree: true,
      }));

    if (freeModels.length === 0) {
      return DEFAULT_FREE_MODELS;
    }

    // Ensure openrouter/free is at the top if present, otherwise prepend it
    const hasAutoFree = freeModels.some((m) => m.id === 'openrouter/free');
    if (!hasAutoFree) {
      freeModels.unshift(DEFAULT_FREE_MODELS[0]);
    } else {
      freeModels.sort((a, b) => (a.id === 'openrouter/free' ? -1 : b.id === 'openrouter/free' ? 1 : 0));
    }

    return freeModels;
  } catch (error) {
    console.error('Failed to fetch OpenRouter models:', error);
    return DEFAULT_FREE_MODELS;
  }
}

/**
 * Clean up double brackets, danda spacing, and formatting
 */
function cleanBengaliResult(text: string): string {
  let res = text
    .replace(/\(\(\s*([^)]+?)\s*\)\)/g, '($1)')
    .replace(/\(\s*\(/g, '(')
    .replace(/\)\s*\)/g, ')')
    .replace(/([।\.\,])\s*(\(চিত্র-[০-৯]+\))/g, ' $2')
    .replace(/[।\.]+/g, '।')
    .replace(/\s+([।,])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();

  // If sentence starts with "(চিত্র-X) অনুযায়ী", change to "চিত্র-X অনুযায়ী" without parenthesis
  res = res.replace(/^[\s\(]*(চিত্র-[০-৯]+)\)?\s*(এ\s+দেখানো\s+অনুযায়ী|অনুযায়ী|অনুসারে|মতে)/gi, '$1 $2');

  // Contractions
  res = res.replace(/([\u0995-\u09B9])\s+এর(?=[\s.,!?।]|$)/g, '$1ের');
  res = res.replace(/([\u0995-\u09B9])\s+এ(?=[\s.,!?।]|$)/g, '$1ে');
  res = res.replace(/([০-৯]+)\s+(টি|টা|খানা)(?=[\s.,!?।]|$)/g, '$1$2');

  if (!res.endsWith('।')) {
    res += '।';
  }

  res = res.replace(/(\(চিত্র-[০-৯]+\))\s*।+/g, '$1।');
  return res.replace(/।+/g, '।');
}

/**
 * Generate 100% Pure Bengali SOP with OpenRouter API
 */
export async function generateSOPWithOpenRouter(
  banglishInput: string,
  apiKey: string,
  model: string = 'openrouter/free',
  numPhotos: number = 6
): Promise<GeneratedSOPContent> {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('OpenRouter API Key is missing. Please set your API key in AI settings.');
  }

  const systemPrompt = `You are a Senior Industrial Process Development Engineer at Walton Hi-Tech Industries PLC.
You create official, professional Standard Operating Procedure (SOP) documents in 100% PURE, FLAWLESS MANUFACTURING BENGALI (সম্পূর্ণ শুদ্ধ ও প্রমিত কারখানা বাংলা).
The user provides rough procedure steps in Banglish or English.
There are ${numPhotos} attached photos numbered from চিত্র-১ to চিত্র-${toBengaliNumber(numPhotos)}.

CRITICAL LANGUAGE & FORMATTING RULES:
1. Output MUST BE 100% PURE FORMAL MANUFACTURING BENGALI (সম্পূর্ণ প্রমিত বাংলা).
2. DO NOT leave ANY English words, Banglish words, or English particles (e.g., NEVER output 'er', 'e', 'te', 'ti', 'dite hobe', 'valo vabe', 'korte hobe', 'every', 'kartun', 'sothik vabe', 'lagay nite hobe').
3. Translate all technical terms naturally into Bengali (e.g. 'প্যাকেজিং টেপ ডিসপেনসার', 'কার্টুনের চিহ্নিত স্থানে', 'ভালোভাবে বসাতে হবে', 'BOPP টেপ', 'পেট বেল্ট মেশিন', 'সঠিকভাবে লাগিয়ে নিতে হবে', 'রেফ্রিজারেটর ডোর গ্রুভ', 'রাবার গ্যাসকেট', 'ম্যাগনেটিক সিল').
4. Standard industrial acronyms (BOPP, PET, IDU, CAC, BTU, SL) can remain in uppercase Latin characters.
5. Every step must start with Bengali numbering: ১), ২), ৩), etc.
6. If referring to a photo at the beginning of a step, write 'চিত্র-৩ অনুযায়ী' or 'চিত্র-৪ এ দেখানো অনুযায়ী,'.
7. If referring to a photo at the end of a step, write in single parentheses followed by danda: '...বসাতে হবে (চিত্র-১)।'. NEVER output double parentheses like '((চিত্র-১))' and NEVER output double dandas like '।।'.
8. Generate 2 to 4 crucial quality inspection points ('লক্ষণীয় বিষয়') numbered ১), ২), etc.
9. Generate 2 to 3 standard industrial general instructions ('সাধারণ নির্দেশনা') regarding 5S, electricity savings, and line supervisor communication.

You MUST respond ONLY with a valid JSON object in this exact structure, with NO markdown backticks, NO markdown formatting, NO conversational intro/outro text:
{
  "steps": [
    "১) প্রথমে প্যাকেজিং টেপ ডিসপেনসার থেকে ২০০ মিলিমিটার লম্বা BOPP টেপ কেটে নিতে হবে এবং সঠিকভাবে লাগিয়ে নিতে হবে।",
    "২) ক্যাসেট ইনডোর কার্টুনের চিহ্নিত স্থানে সঠিকভাবে টেপটি বসাতে হবে (চিত্র-১)।",
    "৩) ইনডোর কার্টুনের প্রতিটি টেপিং স্থানে এক লেয়ার BOPP টেপ ব্যবহার করতে হবে (চিত্র-২)।",
    "৪) চিত্র-৩ অনুযায়ী ক্যাসেট ইনডোর কার্টুনের নিচের দিকে BOPP টেপ ব্যবহার করতে হবে।",
    "৫) চিত্র-৪ এ দেখানো অনুযায়ী, কার্টুনের উভয় পাশে ৪টি করে মোট ৮টি নির্দিষ্ট স্থানে BOPP টেপ ব্যবহার করতে হবে।",
    "৬) চিত্র-৫ অনুসারে পেট বেল্ট মেশিনে ৩ সেটিং করে কার্টুনে সঠিকভাবে বেল্ট দিতে হবে।"
  ],
  "qualityPoints": [
    "১) বেল্ট লাগানোর সময় নিশ্চিত করতে হবে যাতে কার্টুন ছিঁড়ে না যায়। (চিত্র-৬)",
    "২) টেপ বসানোর সময় খেয়াল রাখতে হবে, যাতে টেপ বাঁকা না হয় এবং সোজাসুজি থাকে।",
    "৩) প্রতিটি জায়গায় এক লেয়ার টেপ সঠিকভাবে দেওয়া হয়েছে কিনা তা যাচাই করতে হবে।"
  ],
  "generalInstructions": [
    "১) সকল প্রয়োজনীয় যন্ত্রপাতি সঠিক স্থানে রাখতে হবে।",
    "২) কাজের শেষে মেশিন, লাইন, ফ্যান বন্ধ রেখে বিদ্যুৎ অপচয় রোধ করতে হবে।",
    "৩) যেকোন ধরনের অনাকাঙ্ক্ষিত সমস্যায় দ্রুত লাইন সুপারভাইজারকে অবহিত করতে হবে।"
  ]
}`;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey.trim()}`,
      'HTTP-Referer': window.location.origin || 'http://localhost:3000',
      'X-Title': 'Walton SOP Maker',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model || 'openrouter/free',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Translate, refine, and structure the following Banglish/English procedure into 100% formal Bengali SOP:\n"""\n${banglishInput}\n"""\nTotal photos available: ${numPhotos}`,
        },
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    let errMsg = `OpenRouter API Error: HTTP ${response.status}`;
    try {
      const errJson = await response.json();
      errMsg = errJson?.error?.message || errMsg;
    } catch {
      const errText = await response.text();
      if (errText) errMsg = `${errMsg} - ${errText.slice(0, 200)}`;
    }
    throw new Error(errMsg);
  }

  const data = await response.json();
  const rawContent = data?.choices?.[0]?.message?.content;
  if (!rawContent) {
    throw new Error('Received empty response from OpenRouter AI model.');
  }

  // Extract JSON from content (handles if model wrapped in ```json ... ```)
  let cleanJson = rawContent.trim();
  const jsonMatch = cleanJson.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    cleanJson = jsonMatch[1].trim();
  }

  let parsed: GeneratedSOPContent;
  try {
    parsed = JSON.parse(cleanJson);
  } catch (err) {
    console.error('Failed to parse JSON directly, attempting fallback extraction:', rawContent);
    // Fallback extraction of { ... }
    const firstBrace = cleanJson.indexOf('{');
    const lastBrace = cleanJson.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      parsed = JSON.parse(cleanJson.substring(firstBrace, lastBrace + 1));
    } else {
      throw new Error('AI returned invalid format. Please try again or switch to another free model.');
    }
  }

  if (!Array.isArray(parsed.steps) || parsed.steps.length === 0) {
    throw new Error('AI did not return any procedure steps.');
  }

  return {
    steps: parsed.steps.map(cleanBengaliResult),
    qualityPoints: (parsed.qualityPoints || []).map(cleanBengaliResult),
    generalInstructions: (parsed.generalInstructions || []).map(cleanBengaliResult),
  };
}
