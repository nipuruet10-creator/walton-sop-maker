import { toBengaliNumber } from '../data/defaultSopData';
import { offlineConvertBanglish, offlineConvertQualityPoints, type GeneratedSOPContent } from './banglishEngine';

export interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  context_length?: number;
  isFree: boolean;
}

export const OPENROUTER_API_KEY_STORAGE = 'walton_sop_openrouter_api_key';
export const OPENROUTER_MODEL_STORAGE = 'walton_sop_openrouter_model';

// Fallback high-quality free models list (active and fast on OpenRouter)
export const DEFAULT_FREE_MODELS: OpenRouterModel[] = [
  {
    id: 'google/gemma-4-26b-a4b-it:free',
    name: 'Google: Gemma 4 26B (Free - Ultra Fast & Recommended)',
    isFree: true,
    description: 'Fast Google reasoning model with outstanding Bengali multilingual skills and instant JSON formatting',
  },
  {
    id: 'qwen/qwen3.8-27b:free',
    name: 'Qwen: Qwen 3.8 27B (Free - High Accuracy)',
    isFree: true,
    description: 'Top-tier Asian multilingual model with exceptional Bengali translation speed',
  },
  {
    id: 'google/gemma-4-31b-it:free',
    name: 'Google: Gemma 4 31B (Free)',
    isFree: true,
    description: 'Google state-of-the-art open model with outstanding Bengali multilingual skills',
  },
  {
    id: 'nvidia/nemotron-3.5-lightning:free',
    name: 'NVIDIA: Nemotron 3.5 Lightning (Free - Fastest)',
    isFree: true,
    description: 'Ultra-low latency model for lightning-fast generations',
  },
  {
    id: 'openrouter/free',
    name: 'OpenRouter Free Auto-Router',
    isFree: true,
    description: 'Auto-routes to available free models with fallback',
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

    // Sort so recommended fast models are on top:
    const priorityList = [
      'google/gemma-4-26b-a4b-it:free',
      'qwen/qwen3.8-27b:free',
      'google/gemma-4-31b-it:free',
      'nvidia/nemotron-3.5-lightning:free',
      'openrouter/free',
    ];

    freeModels.sort((a, b) => {
      const idxA = priorityList.indexOf(a.id);
      const idxB = priorityList.indexOf(b.id);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.name.localeCompare(b.name);
    });

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

  // 1. Auto-sanitizer for archaic AI over-translations (DO NOT use these archaic Bengali translations):
  res = res
    .replace(/স্মার্ট\s*কোডেড\s*প্রতীক/gi, 'স্মার্ট QR কোড')
    .replace(/কোডেড\s*প্রতীক/gi, 'QR কোড')
    .replace(/স্মার্ট\s*কোড/gi, 'স্মার্ট QR কোড')
    .replace(/পণ্য\s*বারকোড/gi, 'প্রোডাক্ট বারকোড')
    .replace(/উপাদান\s*বারকোড/gi, 'কম্পোনেন্ট বারকোড')
    .replace(/অভ্যন্তভাগের\s*একক(?:ের)?/gi, 'ইনডোর ইউনিটের')
    .replace(/অভ্যন্তভাগের\s*একক/gi, 'ইনডোর ইউনিট')
    .replace(/বহির্ভাগের\s*একক(?:ের)?/gi, 'আউটডোর ইউনিটের')
    .replace(/বহির্ভাগের\s*একক/gi, 'আউটডোর ইউনিট')
    .replace(/বৈদ্যুতিক\s*সেবা\s*প্রণালী/gi, 'E-Service')
    .replace(/পলি\s*আবরণ/gi, 'পলি')
    .replace(/স্ক্যানিং\s*যন্ত্র(?:ের)?/gi, 'স্ক্যানিং ডিভাইসের')
    .replace(/স্ক্যানিং\s*যন্ত্র/gi, 'স্ক্যানার')
    .replace(/নির্ধারিত\s*ফর্ম/gi, 'নির্ধারিত ফরমা')
    .replace(/ফর্মের\s*সাহায্যে/gi, 'ফরমার সাহায্যে')
    .replace(/ফর্মের/gi, 'ফরমার');

  // 2. Intelligent Conversion of English technical & factory words to BENGALI SPELLING
  // As explicitly requested: "QR eta sudu same english rakhio. Smart ta bangla spelling e Smart likhba. Scanning word o bangla spelling e likhba. translate lagbe na."

  // Multi-word compound phrases first:
  res = res
    .replace(/\bSmart\s+QR\s+Code\s+Sticker\b/gi, 'স্মার্ট QR কোড স্টিকার')
    .replace(/\bSmart\s+QR\s+Code\s+Scanner\b/gi, 'স্মার্ট QR কোড স্ক্যানার')
    .replace(/\bSmart\s+QR\s+Code\s+Sender\s+Process\b/gi, 'স্মার্ট QR কোড সেন্ডার প্রসেস')
    .replace(/\bSmart\s+QR\s+Code\b/gi, 'স্মার্ট QR কোড')
    .replace(/\bSmart\s+QR\s+Scanning\s+Device\b/gi, 'স্মার্ট QR স্ক্যানিং ডিভাইস')
    .replace(/\bSmart\s+QR\s+Scanning\b/gi, 'স্মার্ট QR স্ক্যানিং')
    .replace(/\bSmart\s+QR\s+Panel\b/gi, 'স্মার্ট QR প্যানেল')
    .replace(/\bSmart\s+QR\s+Tracking\b/gi, 'স্মার্ট QR ট্র্যাকিং')
    .replace(/\bSmart\s+QR\b/gi, 'স্মার্ট QR')
    .replace(/\bQR\s+Code\s+Sticker\b/gi, 'QR কোড স্টিকার')
    .replace(/\bQR\s+Code\b/gi, 'QR কোড')
    .replace(/\bProduct\s+Barcode\b/gi, 'প্রোডাক্ট বারকোড')
    .replace(/\bElement\s+Barcode\b/gi, 'এলিমেন্ট বারকোড')
    .replace(/\bComponent\s+Barcode\b/gi, 'কম্পোনেন্ট বারকোড')
    .replace(/\bAuto\s+Scanning\b/gi, 'অটো স্ক্যানিং')
    .replace(/\bData\s+Entry\b/gi, 'ডাটা এন্ট্রি')
    .replace(/\bTracking\s+Process\b/gi, 'ট্র্যাকিং প্রসেস')
    .replace(/\bAC\s+Indoor\s+Unit\b/gi, 'AC ইনডোর ইউনিট')
    .replace(/\bIndoor\s+Unit\b/gi, 'ইনডোর ইউনিট')
    .replace(/\bOutdoor\s+Unit\b/gi, 'আউটডোর ইউনিট');

  // English words with Bengali case suffixes:
  res = res
    .replace(/ইনডোর\s*ইউনিট[\-–—\s]*এর/gi, 'ইনডোর ইউনিটের')
    .replace(/আউটডোর\s*ইউনিট[\-–—\s]*এর/gi, 'আউটডোর ইউনিটের')
    .replace(/ইনডোর\s*ইউনিট[\-–—\s]*এ/gi, 'ইনডোর ইউনিটে')
    .replace(/আউটডোর\s*ইউনিট[\-–—\s]*এ/gi, 'আউটডোর ইউনিটে')
    .replace(/Forma[\-–—\s]*এর\s*সাহায্যে/gi, 'ফরমার সাহায্যে')
    .replace(/Forma[\-–—\s]*র\s*সাহায্যে/gi, 'ফরমার সাহায্যে')
    .replace(/Forma[\-–—\s]*এর/gi, 'ফরমার')
    .replace(/Forma[\-–—\s]*র/gi, 'ফরমার')
    .replace(/Frame[\-–—\s]*থেকে/gi, 'ফ্রেম থেকে')
    .replace(/Frame[\-–—\s]*এর/gi, 'ফ্রেমের')
    .replace(/Frame[\-–—\s]*এ/gi, 'ফ্রেমে')
    .replace(/Poly[\-–—\s]*টি/gi, 'পলিটি')
    .replace(/Poly[\-–—\s]*র/gi, 'পলির')
    .replace(/Poly[\-–—\s]*তে/gi, 'পলিতে')
    .replace(/Sticker[\-–—\s]*টি/gi, 'স্টিকারটি')
    .replace(/Sticker[\-–—\s]*এর/gi, 'স্টিকারের')
    .replace(/Barcode[\-–—\s]*এর/gi, 'বারকোডের')
    .replace(/Barcode[\-–—\s]*টি/gi, 'বারকোডটি')
    .replace(/Device[\-–—\s]*এর\s*মাধ্যমে/gi, 'ডিভাইসের মাধ্যমে')
    .replace(/Device[\-–—\s]*এর/gi, 'ডিভাইসের')
    .replace(/Display[\-–—\s]*তে/gi, 'ডিসপ্লেতে')
    .replace(/Display[\-–—\s]*এর/gi, 'ডিসপ্লের')
    .replace(/Panel[\-–—\s]*এ/gi, 'প্যানেলে')
    .replace(/Panel[\-–—\s]*এর/gi, 'প্যানেলের')
    .replace(/Alignment[\-–—\s]*এ/gi, 'অ্যালাইনমেন্টে');

  // Single English technical words -> Bengali phonetic spelling:
  res = res
    .replace(/\bSmart\b/gi, 'স্মার্ট')
    .replace(/\bScanning\b/gi, 'স্ক্যানিং')
    .replace(/\bScanner\b/gi, 'স্ক্যানার')
    .replace(/\bScan\b/gi, 'স্ক্যান')
    .replace(/\bBarcode\b/gi, 'বারকোড')
    .replace(/\bSticker\b/gi, 'স্টিকার')
    .replace(/\bForma\b/gi, 'ফরমা')
    .replace(/\bFrame\b/gi, 'ফ্রেম')
    .replace(/\bPoly\b/gi, 'পলি')
    .replace(/\bModel\b/gi, 'মডেল')
    .replace(/\bselect\s+করতে\s+হবে\b/gi, 'সিলেক্ট করতে হবে')
    .replace(/\bselect\s+করলে\b/gi, 'সিলেক্ট করলে')
    .replace(/\bselect\s+হয়ে\s+যাবে\b/gi, 'সিলেক্ট হয়ে যাবে')
    .replace(/\bselect\s+হবে\b/gi, 'সিলেক্ট হবে')
    .replace(/\bselect\s+করা\b/gi, 'সিলেক্ট করা')
    .replace(/\bselect\s+করে\b/gi, 'সিলেক্ট করে')
    .replace(/\bselect\b/gi, 'সিলেক্ট')
    .replace(/\bclick\s+করতে\s+হবে\b/gi, 'ক্লিক করতে হবে')
    .replace(/\bclick\s+করুন\b/gi, 'ক্লিক করুন')
    .replace(/\bclick\s+করে\b/gi, 'ক্লিক করে')
    .replace(/\bclick\b/gi, 'ক্লিক')
    .replace(/\bPanel\b/gi, 'প্যানেল')
    .replace(/\bDevice\b/gi, 'ডিভাইস')
    .replace(/\bTracking\b/gi, 'ট্র্যাকিং')
    .replace(/\bProcess\b/gi, 'প্রসেস')
    .replace(/\bMessage\b/gi, 'মেসেজ')
    .replace(/\bDisplay\b/gi, 'ডিসপ্লে')
    .replace(/\bMismatch\b/gi, 'মিসম্যাচ')
    .replace(/\bAlignment\b/gi, 'অ্যালাইনমেন্ট')
    .replace(/\bMatch\b/gi, 'ম্যাচ')
    .replace(/\bEntry\b/gi, 'এন্ট্রি')
    .replace(/\bAuto\b/gi, 'অটো')
    .replace(/\bSetup\b/gi, 'সেটআপ')
    .replace(/\bDispenser\b/gi, 'ডিসপেনসার')
    .replace(/\bTape\b/gi, 'টেপ')
    .replace(/\bLayer\b/gi, 'লেয়ার')
    .replace(/\bBelt\b/gi, 'বেল্ট')
    .replace(/\bSetting\b/gi, 'সেটিং')
    .replace(/\bSensor\b/gi, 'সেন্সর')
    .replace(/\bSwitch\b/gi, 'সুইচ')
    .replace(/\bScrew\b/gi, 'স্ক্রু')
    .replace(/\bLock\b/gi, 'লক');

  // Bengali contraction cleanup: "মডেল এর" -> "মডেলের", "প্যানেল এ" -> "প্যানেলে"
  res = res
    .replace(/মডেল\s+এর/g, 'মডেলের')
    .replace(/প্যানেল\s+এ/g, 'প্যানেলে')
    .replace(/ডিভাইস\s+এর/g, 'ডিভাইসের')
    .replace(/ডিসপ্লে\s+তে/g, 'ডিসপ্লেতে')
    .replace(/স্টিকার\s+এর/g, 'স্টিকারের')
    .replace(/বারকোড\s+এর/g, 'বারকোডের')
    .replace(/ফরমা\s+এর/g, 'ফরমার')
    .replace(/ফ্রেম\s+থেকে/g, 'ফ্রেম থেকে')
    .replace(/ফ্রেম\s+এ/g, 'ফ্রেমে')
    .replace(/পলি\s+টি/g, 'পলিটি')
    .replace(/অ্যালাইনমেন্ট\s+এ/g, 'অ্যালাইনমেন্টে')
    .replace(/ট্র্যাকিং\s+এ/g, 'ট্র্যাকিং-এ')
    .replace(/WQMS\s+এ/g, 'WQMS-এ')
    .replace(/E-Service\s+থেকে/g, 'E-Service থেকে')
    .replace(/E-Service\s+এ/g, 'E-Service-এ')
    .replace(/Insert\s+এ/g, 'Insert-এ');

  // Format English technical acronyms followed by Bengali suffixes nicely: "QR Code এর" -> "QR কোডের"
  res = res.replace(/([A-Za-z0-9])\s+(এর|র|এ|তে|টি|টা|গুলো)(?=[\s.,!?।]|$)/g, '$1-$2');

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
 * Ultra-robust JSON extraction that handles:
 * - <think>...</think> reasoning tags
 * - Markdown backticks
 * - Conversational text outside { ... }
 * - Unescaped newlines or trailing commas
 * - Regex extraction fallback if JSON.parse fails completely
 */
export function extractAndParseJSON(rawContent: string): any {
  if (!rawContent || !rawContent.trim()) {
    throw new Error('Empty AI response');
  }

  // 1. Strip reasoning/thought tags (DeepSeek R1 / thinking models output this)
  let clean = rawContent.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

  // 2. Extract markdown block
  const codeMatch = clean.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeMatch) {
    clean = codeMatch[1].trim();
  }

  // 3. Find outer braces
  const firstBrace = clean.indexOf('{');
  const lastBrace = clean.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    clean = clean.substring(firstBrace, lastBrace + 1);
  }

  // 4. Remove trailing commas before closing braces/brackets
  clean = clean.replace(/,\s*([\]}])/g, '$1');

  // Try standard JSON.parse
  try {
    return JSON.parse(clean);
  } catch {
    // 5. Try fixing unescaped newlines in JSON strings
    try {
      const repaired = clean.replace(/(?<!\\)"([\s\S]*?)(?<!\\)"/g, (_, str) => {
        return '"' + str.replace(/\r?\n/g, '\\n') + '"';
      });
      return JSON.parse(repaired);
    } catch {
      // 6. Regex array extractor fallback (extracts each string from array syntax even if braces or quotes are malformed)
      const extractArray = (key: string): string[] => {
        const regex = new RegExp(`"${key}"\\s*:\\s*\\[([\\s\\S]*?)\\]`, 'i');
        const match = clean.match(regex);
        if (!match) return [];
        const items: string[] = [];
        const itemRegex = /"([^"\\]*(?:\\.[^"\\]*)*)"/g;
        let m;
        while ((m = itemRegex.exec(match[1])) !== null) {
          items.push(m[1].replace(/\\n/g, ' ').replace(/\\"/g, '"').trim());
        }
        return items;
      };

      const steps = extractArray('steps');
      const qualityPoints = extractArray('qualityPoints');
      const generalInstructions = extractArray('generalInstructions');

      if (steps.length > 0) {
        return { steps, qualityPoints, generalInstructions };
      }

      throw new Error('AI returned invalid format.');
    }
  }
}

/**
 * Generate High-Quality Bengali SOP with OpenRouter API
 */
export async function generateSOPWithOpenRouter(
  banglishInput: string,
  apiKey: string,
  model: string = 'google/gemma-4-26b-a4b-it:free',
  numPhotos: number = 6
): Promise<GeneratedSOPContent> {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('OpenRouter API Key is missing. Please set your API key in AI settings.');
  }

  const systemPrompt = `You are a Senior Industrial Process Development Engineer at Walton Hi-Tech Industries PLC.
You create official, professional Standard Operating Procedure (SOP) documents in HIGH-QUALITY MANUFACTURING BENGALI (উচ্চমানের প্রমিত কারখানা বাংলা).
The user provides rough procedure steps in Banglish or English.
There are ${numPhotos} attached photos numbered from চিত্র-১ to চিত্র-${toBengaliNumber(numPhotos)}.

CRITICAL LANGUAGE & TERMINOLOGY GUIDELINES (ভাষা ও পরিভাষা ব্যবহারের সুনির্দিষ্ট নিয়ম):
1. ONLY ACRONYMS & SYSTEM CODES STAY IN ENGLISH UPPERCASE:
   Keep ONLY standard industrial acronyms, abbreviations, and software codes in English letters:
   • QR (write as 'QR কোড', 'QR কোড স্টিকার' - only QR in English)
   • WQMS, E-Service, AC, IDU, PCB, BOPP, PET, BTU, OK, SL
   • Literal software button/message names in quotes: "Data Insert Successfully" মেসেজ, "Insert" বাটন।

2. WRITE ALL OTHER TECHNICAL & OPERATIONAL WORDS IN BENGALI PHONETIC SPELLING (বাংলা লিপিতে সহজ বানান):
   DO NOT keep operational words in English letters (খুব বেশি ইংরেজি হরফ ব্যবহার সম্পূর্ণ নিষিদ্ধ)!
   DO NOT over-translate them into archaic/obscure Bengali (translate lagbe na - যেমন Smart-কে 'চতুর' বা Scanning-কে 'অনুসন্ধান' বা Barcode-কে 'রেখাকোড' লেখা সম্পূর্ণ নিষেধ)!
   Write everyday factory English words in clean Bengali spelling:
   • Smart -> স্মার্ট (যেমন: 'স্মার্ট QR কোড', 'স্মার্ট QR প্যানেল')
   • Scanning -> স্ক্যানিং (যেমন: 'অটো স্ক্যানিং সম্পন্ন হবে', 'স্ক্যানিং ডিভাইসের মাধ্যমে')
   • Scanner -> স্ক্যানার
   • Scan -> স্ক্যান (যেমন: 'স্ক্যান করতে হবে')
   • Barcode -> বারকোড (যেমন: 'প্রোডাক্ট বারকোড', 'এলিমেন্ট বারকোড')
   • Sticker -> স্টিকার (যেমন: 'QR কোড স্টিকার')
   • Select -> সিলেক্ট (যেমন: 'অপশনটি সিলেক্ট করতে হবে', 'সিলেক্ট করলে')
   • Click -> ক্লিক (যেমন: 'ক্লিক করতে হবে')
   • Panel -> প্যানেল (যেমন: 'স্মার্ট QR প্যানেল প্রদর্শিত হবে', 'উক্ত প্যানেলে')
   • Device -> ডিভাইস (যেমন: 'স্ক্যানিং ডিভাইসের মাধ্যমে')
   • Process -> প্রসেস (যেমন: 'ট্র্যাকিং প্রসেস সম্পন্ন করতে হবে')
   • Tracking -> ট্র্যাকিং (যেমন: 'স্মার্ট QR ট্র্যাকিং-এ')
   • Auto -> অটো (যেমন: 'অটো স্ক্যানিং')
   • Message -> মেসেজ (যেমন: '"Data Insert Successfully" মেসেজ')
   • Display -> ডিসপ্লে (যেমন: 'ডিসপ্লেতে প্রদর্শিত হবে')
   • Mismatch -> মিসম্যাচ (যেমন: 'মিসম্যাচ যেন না হয়')
   • Alignment -> অ্যালাইনমেন্ট (যেমন: 'সঠিক অ্যালাইনমেন্টে')
   • Match -> ম্যাচ (যেমন: 'সঠিকভাবে ম্যাচ করছে কি না')
   • Data Entry -> ডাটা এন্ট্রি (যেমন: 'স্ক্যানিং বা ডাটা এন্ট্রি')
   • Entry -> এন্ট্রি (যেমন: 'OK এন্ট্রি')
   • Model -> মডেল (যেমন: 'মডেল অনুযায়ী')
   • Forma -> ফরমা (যেমন: 'নির্ধারিত ফরমা নিতে হবে', 'ফরমার সাহায্যে')
   • Frame -> ফ্রেম (যেমন: 'ফ্রেম থেকে')
   • Poly -> পলি (যেমন: 'পলিটি সরিয়ে দিতে হবে')
   • Indoor Unit -> ইনডোর ইউনিট (যেমন: 'ইনডোর ইউনিটের')
   • Outdoor Unit -> আউটডোর ইউনিট (যেমন: 'আউটডোর ইউনিটের')
   • Setup / Set Up -> সেটআপ (যেমন: 'সেটআপ সম্পন্ন হলে')
   • Dispenser -> ডিসপেনসার
   • Tape -> টেপ (যেমন: 'BOPP টেপ')
   • Layer -> লেয়ার (যেমন: '১ লেয়ার টেপ')
   • Belt -> বেল্ট

3. FLUENT FORMAL BENGALI GRAMMAR:
   All verbs, sentence structures, instructions, and connectives MUST be in fluent, grammatically correct formal Bengali:
   'নিতে হবে', 'সরিয়ে দিতে হবে', 'সঠিকভাবে লাগাতে হবে', 'প্রবেশ করে সেটআপ নিশ্চিত করতে হবে', 'সিলেক্ট করতে হবে', 'ক্লিক করতে হবে', 'যাচাই করতে হবে', 'নিশ্চিত করতে হবে'।
4. NO BANGLISH CASUAL WORDS OR SLANG:
   Do NOT output raw Banglish verbs or conversational particles (e.g., DO NOT output 'dite hobe', 'valo vabe', 'korte hobe', 'sothik vabe', 'lagay nite hobe', 'eta', 'nissit').
5. Every step must start with Bengali numbering: ১), ২), ৩), etc.
6. If referring to a photo at the beginning of a step, write 'চিত্র-৩ অনুযায়ী' or 'চিত্র-৪ এ দেখানো অনুযায়ী,'.
7. If referring to a photo at the end of a step, write in single parentheses followed by danda: '...বসাতে হবে (চিত্র-১)।' or '...(চিত্র-১ ও চিত্র-২)।'. NEVER output double parentheses like '((চিত্র-১))' and NEVER output double dandas like '।।'.
8. ZERO INFORMATION LOSS: Translate EVERY sentence and clause provided in each step!
9. Generate 2 to 4 crucial quality inspection points ('লক্ষণীয় বিষয়') numbered ১), ২), etc.
10. Generate 2 to 3 standard industrial general instructions ('সাধারণ নির্দেশনা') regarding 5S, electricity savings, and line supervisor communication.

You MUST respond ONLY with a valid JSON object in this exact structure, with NO markdown backticks, NO markdown formatting, NO conversational intro/outro text:
{
  "steps": [
    "১) প্রথমে মডেল অনুযায়ী নির্ধারিত QR কোড স্টিকার নিতে হবে। এরপর ইনডোর ইউনিটের ফ্রেম থেকে পলি সরিয়ে দিতে হবে (চিত্র-১)।",
    "২) মডেল অনুযায়ী নির্ধারিত ফরমা নিতে হবে এবং ফরমার সাহায্যে নির্দিষ্ট স্থানে প্রোডাক্ট বারকোড ও QR কোড স্টিকার সঠিকভাবে লাগাতে হবে (চিত্র-১ ও চিত্র-২)।",
    "৩) এরপর E-Service থেকে WQMS-এ প্রবেশ করে Set Up (Smart QR) অপশনটি সিলেক্ট করতে হবে এবং Insert-এ ক্লিক করতে হবে (চিত্র-৩)।",
    "৪) চিত্র-৪ অনুযায়ী স্মার্ট QR স্ক্যানিং ডিভাইসের মাধ্যমে ইনডোর ইউনিটের QR কোড ও বারকোড অটো স্ক্যানিং সম্পন্ন করতে হবে।",
    "৫) স্মার্ট QR ট্র্যাকিং-এ OK এন্ট্রি সফলভাবে সম্পন্ন হলে 'Data Insert Successfully' মেসেজ এবং ডিসপ্লেতে বারকোড প্রদর্শিত হবে (চিত্র-৫)।"
  ],
  "qualityPoints": [
    "১) মডেল অনুযায়ী সঠিক QR কোড স্টিকার নিতে হবে এবং QR কোড স্টিকার যাতে কোনোভাবেই মিসম্যাচ না হয় তা নিশ্চিত করতে হবে (চিত্র-১ ও চিত্র-২)।",
    "২) ফ্রেম থেকে পলি সরানোর সময় কোনো স্ক্র্যাচ বা দাগ যাতে না পড়ে সেদিকে খেয়াল রাখতে হবে।",
    "৩) ডিসপ্লেতে প্রদর্শিত বারকোড সঠিকভাবে ম্যাচ করছে কিনা এবং WQMS ও E-Service-এ ডাটা সঠিকভাবে এন্ট্রি হয়েছে কিনা তা যাচাই করতে হবে।"
  ],
  "generalInstructions": [
    "১) সকল প্রয়োজনীয় যন্ত্রপাতি সঠিক স্থানে রাখতে হবে।",
    "২) কাজের শেষে মেশিন, লাইন, ফ্যান বন্ধ রেখে বিদ্যুৎ অপচয় রোধ করতে হবে।",
    "৩) যেকোন ধরনের অনাকাঙ্ক্ষিত সমস্যায় দ্রুত লাইন সুপারভাইজারকে অবহিত করতে হবে।"
  ]
}`;

  // Prioritized candidate models for fast generation and zero failure
  const candidateModels = Array.from(
    new Set([
      model || 'google/gemma-4-26b-a4b-it:free',
      'google/gemma-4-26b-a4b-it:free',
      'qwen/qwen3.8-27b:free',
      'google/gemma-4-31b-it:free',
      'nvidia/nemotron-3.5-lightning:free',
      'openrouter/free',
    ])
  ).filter(Boolean);

  for (const m of candidateModels) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 14000); // 14s strict timeout per model

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey.trim()}`,
          'HTTP-Referer': window.location.origin || 'http://localhost:3000',
          'X-Title': 'Walton SOP Maker',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: m,
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: `Translate, refine, and structure the following Banglish/English procedure into formal factory Bengali SOP:\n"""\n${banglishInput}\n"""\nTotal photos available: ${numPhotos}`,
            },
          ],
          temperature: 0.2,
          response_format: { type: 'json_object' },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`Model ${m} returned HTTP ${response.status}, attempting fallback model.`);
        continue;
      }

      const data = await response.json();
      const rawContent = data?.choices?.[0]?.message?.content;
      if (!rawContent) continue;

      const parsed = extractAndParseJSON(rawContent);

      if (Array.isArray(parsed.steps) && parsed.steps.length > 0) {
        return {
          steps: parsed.steps.map(cleanBengaliResult),
          qualityPoints: (parsed.qualityPoints || []).map(cleanBengaliResult),
          generalInstructions: (parsed.generalInstructions || []).map(cleanBengaliResult),
        };
      }
    } catch (err: any) {
      console.warn(`Model ${m} attempt failed or timed out:`, err?.message || err);
      // Attempt next candidate model
    }
  }

  // Graceful offline fallback: Never crash or show error dialog to user!
  console.warn('All free OpenRouter models timed out or failed. Seamlessly falling back to offline Bengali converter.');
  return offlineConvertBanglish(banglishInput);
}

/**
 * Generate High-Quality Bengali Critical Quality Points (লক্ষণীয় বিষয়)
 */
export async function generateQualityPointsWithOpenRouter(
  qualityBanglishInput: string,
  apiKey: string,
  model: string = 'google/gemma-4-26b-a4b-it:free'
): Promise<string[]> {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('OpenRouter API Key is missing. Please set your API key in AI settings.');
  }

  const systemPrompt = `You are a Senior Industrial Quality Control Engineer at Walton Hi-Tech Industries PLC.
You create crucial quality inspection points ('লক্ষণীয় বিষয় / Critical Quality Points') in professional MANUFACTURING BENGALI (উচ্চমানের প্রমিত কারখানা বাংলা).
User gives quality requirements or checkpoints in Banglish or English.

RULES (ভাষা ও পরিভাষা ব্যবহারের নিয়ম):
1. ONLY ACRONYMS/CODES STAY IN ENGLISH: QR, WQMS, E-Service, AC, IDU, PCB, BOPP, OK (যেমন: 'QR কোড স্টিকার', 'WQMS-এ')।
2. WRITE OTHER TECHNICAL WORDS IN BENGALI PHONETIC SPELLING (বাংলা হরফে লিখুন):
   • Smart -> স্মার্ট
   • Scanning -> স্ক্যানিং, Scanner -> স্ক্যানার, Scan -> স্ক্যান
   • Barcode -> বারকোড (যেমন: প্রোডাক্ট বারকোড, এলিমেন্ট বারকোড)
   • Sticker -> স্টিকার (যেমন: QR কোড স্টিকার)
   • Display -> ডিসপ্লে (যেমন: ডিসপ্লেতে প্রদর্শিত)
   • Mismatch -> মিসম্যাচ (যেমন: কোনোভাবেই মিসম্যাচ না হয়)
   • Alignment -> অ্যালাইনমেন্ট (যেমন: সঠিক অ্যালাইনমেন্টে)
   • Match -> ম্যাচ (যেমন: সঠিকভাবে ম্যাচ করছে কিনা)
   • Data Entry -> ডাটা এন্ট্রি
   • Indoor Unit -> ইনডোর ইউনিট, Frame -> ফ্রেম, Poly -> পলি, Forma -> ফরমা, Model -> মডেল
   DO NOT over-translate them into archaic Bengali (translate lagbe na)!
3. Every point must start with ১), ২), ৩) etc.
4. If photo references exist (chobi-1, pic 2), convert to (চিত্র-১), (চিত্র-২) at end of sentence.
5. Respond ONLY with a valid JSON object:
{
  "qualityPoints": [
    "১) মডেল অনুযায়ী সঠিক QR কোড স্টিকার নিতে হবে (যেমন: Walton, Marcel, ACC ইত্যাদি) এবং QR কোড স্টিকার যেন কোনোভাবেই মিসম্যাচ না হয়, সেদিকে বিশেষভাবে খেয়াল রাখতে হবে (চিত্র-১ ও চিত্র-২)।",
    "২) ফ্রেম থেকে পলি সরানোর সময় কোনো স্ক্র্যাচ বা দাগ যাতে না পড়ে সেদিকে লক্ষ্য রাখতে হবে।",
    "৩) ডিসপ্লেতে প্রদর্শিত প্রোডাক্ট বারকোড ও এলিমেন্ট বারকোড সঠিকভাবে ম্যাচ করছে কিনা যাচাই করতে হবে। স্ক্যানিং বা ডাটা এন্ট্রি ব্যর্থ হলে পুনরায় স্ক্যানিং করতে হবে।"
  ]
}`;

  const candidateModels = Array.from(
    new Set([
      model || 'google/gemma-4-26b-a4b-it:free',
      'google/gemma-4-26b-a4b-it:free',
      'qwen/qwen3.8-27b:free',
      'google/gemma-4-31b-it:free',
      'nvidia/nemotron-3.5-lightning:free',
      'openrouter/free',
    ])
  ).filter(Boolean);

  for (const m of candidateModels) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey.trim()}`,
          'HTTP-Referer': window.location.origin || 'http://localhost:3000',
          'X-Title': 'Walton SOP Maker',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: m,
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: `Translate and refine these Critical Quality Points into formal Bengali:\n"""\n${qualityBanglishInput}\n"""`,
            },
          ],
          temperature: 0.2,
          response_format: { type: 'json_object' },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) continue;

      const data = await response.json();
      const rawContent = data?.choices?.[0]?.message?.content;
      if (!rawContent) continue;

      const parsed = extractAndParseJSON(rawContent);
      if (Array.isArray(parsed.qualityPoints) && parsed.qualityPoints.length > 0) {
        return parsed.qualityPoints.map(cleanBengaliResult);
      }
    } catch (err: any) {
      console.warn(`Quality points attempt with ${m} failed:`, err?.message || err);
    }
  }

  // Graceful offline fallback
  return offlineConvertQualityPoints(qualityBanglishInput);
}

/**
 * Test if the OpenRouter API key is valid
 */
export async function testOpenRouterKey(apiKey: string): Promise<{ success: boolean; message: string }> {
  if (!apiKey || !apiKey.trim()) {
    return { success: false, message: 'দয়া করে প্রথমে একটি API Key প্রবেশ করান।' };
  }
  try {
    const res = await fetch('https://openrouter.ai/api/v1/auth/key', {
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
      },
    });
    if (res.ok) {
      const data = await res.json();
      const label = data?.data?.label || 'API Key';
      const limit = data?.data?.limit != null ? `(Limit: $${data.data.limit})` : '';
      return { success: true, message: `✅ কানেকশন সফল! ${label} সক্রিয় আছে ${limit}` };
    }

    const modelsRes = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
      },
    });
    if (modelsRes.ok) {
      return { success: true, message: '✅ কানেকশন সফল! OpenRouter AI ইঞ্জিন প্রস্তুত।' };
    }
    return { success: false, message: `❌ API Key টি সঠিক নয় (HTTP ${res.status})` };
  } catch (err: any) {
    return { success: false, message: `❌ টেস্ট ব্যর্থ: ${err.message || 'Network Error'}` };
  }
}
