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

  // Auto-sanitizer for AI over-translations of factory technical terms:
  res = res
    // Multi-word specific phrases first
    .replace(/স্মার্ট\s*কোডেড\s*প্রতীক\s*স্টিকারটি/gi, 'Smart QR Code Sticker-টি')
    .replace(/স্মার্ট\s*কোডেড\s*প্রতীক\s*স্টিকার/gi, 'Smart QR Code Sticker')
    .replace(/কোডেড\s*প্রতীক\s*স্টিকারটি/gi, 'QR Code Sticker-টি')
    .replace(/কোডেড\s*প্রতীক\s*স্টিকার(?:ের)?/gi, 'QR Code Sticker-এর')
    .replace(/কোডেড\s*প্রতীক\s*স্টিকার/gi, 'QR Code Sticker')
    .replace(/পণ্য\s*বারকোড\s*স্টিকার/gi, 'Product Barcode Sticker')
    .replace(/উপাদান\s*বারকোড\s*স্টিকার/gi, 'Component Barcode Sticker')

    // Scanner terms
    .replace(/স্মার্ট\s*কোড\s*স্ক্যানিং\s*যন্ত্র(?:ের)?/gi, 'Smart QR Code Scanner-এর')
    .replace(/স্মার্ট\s*কোড\s*স্ক্যানিং\s*যন্ত্রটি/gi, 'Smart QR Code Scanner-টি')
    .replace(/স্মার্ট\s*কোড\s*স্ক্যানিং\s*যন্ত্রে/gi, 'Smart QR Code Scanner-এ')
    .replace(/স্মার্ট\s*কোড\s*স্ক্যানিং\s*যন্ত্র/gi, 'Smart QR Code Scanner')

    // Process terms
    .replace(/স্মার্ট\s*কোড\s*প্রেরক\s*প্রক্রিয়া|স্মার্ট\s*কোড\s*প্রেরক\s*প্রক্রিয়া/gi, 'Smart QR Code Sender Process')
    .replace(/কোড\s*প্রেরক\s*প্রক্রিয়া|কোড\s*প্রেরক\s*প্রক্রিয়া/gi, 'Code Sender Process')

    // Smart QR terms
    .replace(/স্মার্ট\s*কোডেড\s*প্রতীকটি/gi, 'Smart QR Code-টি')
    .replace(/স্মার্ট\s*কোডেড\s*প্রতীকের/gi, 'Smart QR Code-এর')
    .replace(/স্মার্ট\s*কোডেড\s*প্রতীকে/gi, 'Smart QR Code-এ')
    .replace(/স্মার্ট\s*কোডেড\s*প্রতীক/gi, 'Smart QR Code')
    .replace(/স্মার্ট\s*কোডের/gi, 'Smart QR Code-এর')
    .replace(/স্মার্ট\s*কোড(?:টি)?/gi, 'Smart QR Code')

    // Standard QR terms
    .replace(/কোডেড\s*প্রতীকটি/gi, 'QR Code-টি')
    .replace(/কোডেড\s*প্রতীকের/gi, 'QR Code-এর')
    .replace(/কোডেড\s*প্রতীকে/gi, 'QR Code-এ')
    .replace(/কোডেড\s*প্রতীক/gi, 'QR Code')

    // Barcode terms
    .replace(/পণ্য\s*বারকোডের/gi, 'Product Barcode-এর')
    .replace(/পণ্য\s*বারকোড(?:টি)?/gi, 'Product Barcode')
    .replace(/উপাদান\s*বারকোডের/gi, 'Component Barcode-এর')
    .replace(/উপাদান\s*বারকোড(?:টি)?/gi, 'Component Barcode')

    // Indoor / Outdoor Units
    .replace(/এসি-এর\s*অভ্যন্তভাগের\s*এককের/gi, 'AC Indoor Unit-এর')
    .replace(/এসি-এর\s*অভ্যন্তভাগের\s*এককে/gi, 'AC Indoor Unit-এ')
    .replace(/এসি-এর\s*অভ্যন্তভাগের\s*এককটি/gi, 'AC Indoor Unit-টি')
    .replace(/এসি-এর\s*অভ্যন্তভাগের\s*একক/gi, 'AC Indoor Unit')
    .replace(/অভ্যন্তভাগের\s*এককের/gi, 'Indoor Unit-এর')
    .replace(/অভ্যন্তভাগের\s*এককে/gi, 'Indoor Unit-এ')
    .replace(/অভ্যন্তভাগের\s*এককটি/gi, 'Indoor Unit-টি')
    .replace(/অভ্যন্তভাগের\s*একক/gi, 'Indoor Unit')
    .replace(/বহির্ভাগের\s*এককের/gi, 'Outdoor Unit-এর')
    .replace(/বহির্ভাগের\s*এককে/gi, 'Outdoor Unit-এ')
    .replace(/বহির্ভাগের\s*এককটি/gi, 'Outdoor Unit-টি')
    .replace(/বহির্ভাগের\s*একক/gi, 'Outdoor Unit')

    // E-Service
    .replace(/বৈদ্যুতিক\s*সেবা\s*প্রণালীতে/gi, 'E-Service-এ')
    .replace(/বৈদ্যুতিক\s*সেবা\s*প্রণালী\s*থেকে/gi, 'E-Service থেকে')
    .replace(/বৈদ্যুতিক\s*সেবা\s*প্রণালী/gi, 'E-Service')

    // Poly
    .replace(/পলি\s*আবরণটি/gi, 'Poly-টি')
    .replace(/পলি\s*আবরণের/gi, 'Poly-র')
    .replace(/পলি\s*আবরণে/gi, 'Poly-তে')
    .replace(/পলি\s*আবরণ/gi, 'Poly')

    // Scanner
    .replace(/স্ক্যানিং\s*যন্ত্রের/gi, 'Scanner-এর')
    .replace(/স্ক্যানিং\s*যন্ত্রটি/gi, 'Scanner-টি')
    .replace(/স্ক্যানিং\s*যন্ত্রে/gi, 'Scanner-এ')
    .replace(/স্ক্যানিং\s*যন্ত্র/gi, 'Scanner')

    // Forma (Jig / Fixture)
    .replace(/মডেলভেদে\s*নির্ধারিত\s*ফর্ম\s*ব্যবহারের\s*মাধ্যমে/gi, 'Model অনুযায়ী নির্ধারিত Forma-র সাহায্যে')
    .replace(/নির্ধারিত\s*ফর্ম\s*ব্যবহারের\s*মাধ্যমে/gi, 'নির্ধারিত Forma-র সাহায্যে')
    .replace(/নির্ধারিত\s*ফর্ম/gi, 'নির্ধারিত Forma')
    .replace(/ফর্ম\s*ব্যবহারের\s*মাধ্যমে/gi, 'Forma-র সাহায্যে')
    .replace(/ফর্মের\s*সাহায্যে/gi, 'Forma-র সাহায্যে')
    .replace(/ফর্মের/gi, 'Forma-র')

    // Format English technical words followed by Bengali suffixes nicely: "Indoor Unit এর" -> "Indoor Unit-এর"
    .replace(/([A-Za-z0-9])\s+(এর|র|এ|তে|টি|টা|গুলো)(?=[\s.,!?।]|$)/g, '$1-$2');

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

CRITICAL LANGUAGE & TERMINOLOGY GUIDELINES:
1. FLUENT MANUFACTURING BENGALI GRAMMAR:
   All verbs, sentence structures, instructions, and connectives MUST be in fluent, grammatically correct formal Bengali (e.g., 'নিতে হবে', 'সরিয়ে দিতে হবে', 'সঠিকভাবে স্থাপন করতে হবে', 'যাচাই করে দেখতে হবে', 'প্রবেশ করে সেটআপ নিশ্চিত করতে হবে', 'সতর্কতার সাথে হ্যান্ডেল করতে হবে')।
2. PRESERVE FACTORY TECHNICAL TERMS & HARDWARE IN ENGLISH:
   In Walton manufacturing plants (AC, Refrigerator, TV, Home Appliances, Electronics), all standard technical terms, machine names, software systems, parts, and sticker specifications MUST BE KEPT IN ENGLISH or standard factory Bengali:
   - PRESERVE IN CLEAN ENGLISH:
     • QR Code / Barcode (e.g., 'QR Code Sticker', 'Product Barcode', 'Smart QR Code', 'Smart QR')
     • Indoor Unit / Outdoor Unit (e.g., 'Indoor Unit-এর Frame', 'Outdoor Unit')
     • E-Service / WQMS (e.g., 'E-Service থেকে WQMS-এ প্রবেশ করে')
     • Poly / Forma / Frame / Model (e.g., 'Poly-টি সরিয়ে', 'Forma-র সাহায্যে', 'Indoor Unit-এর Frame')
     • Set Up / Scanner / Scan / Jig / Display / PCB / Sensor / Motor
     • Standard industrial acronyms: BOPP, PET, IDU, CAC, BTU, SL, WQMS, QR, AC
   - STRICTLY PROHIBITED OVER-TRANSLATIONS (NEVER USE THESE ARCHAIC TRANSLATIONS):
     ❌ DO NOT translate 'QR Code' or 'Smart QR' to 'কোডেড প্রতীক' or 'স্মার্ট কোডেড প্রতীক'! (Always keep as 'QR Code' / 'Smart QR Code').
     ❌ DO NOT translate 'Indoor Unit' to 'অভ্যন্তভাগের একক'! (Keep as 'Indoor Unit' or 'ইনডোর ইউনিট').
     ❌ DO NOT translate 'Outdoor Unit' to 'বহির্ভাগের একক'! (Keep as 'Outdoor Unit' or 'আউটডোর ইউনিট').
     ❌ DO NOT translate 'E-Service' to 'বৈদ্যুতিক সেবা প্রণালী'! (Keep as 'E-Service').
     ❌ DO NOT translate 'Poly' to 'পলি আবরণ'! (Keep as 'Poly' or 'পলি').
     ❌ DO NOT translate 'Forma' to 'ফর্ম'! (Keep as 'Forma' or 'ফরমা').
     ❌ DO NOT translate 'Scanner' to 'স্ক্যানিং যন্ত্র'! (Keep as 'Scanner' or 'স্ক্যানার').
3. CLEAN SUFFIXES FOR ENGLISH TERMS:
   When attaching Bengali case endings to English words, format them cleanly: 'QR Code Sticker-টি', 'Indoor Unit-এর Frame থেকে', 'Poly-টি সরিয়ে', 'Forma-র সাহায্যে', 'WQMS-এ প্রবেশ করে', 'Product Barcode ও QR Code Sticker সঠিকভাবে লাগিয়ে দিতে হবে'।
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
    "১) প্রথমে নির্ধারিত Model-এর জন্য প্রযোজ্য QR Code Sticker নিতে হবে। এরপর Indoor Unit-এর Frame থেকে Poly-টি সরিয়ে নিতে হবে (চিত্র-১)।",
    "২) Model অনুযায়ী নির্ধারিত Forma নিতে হবে এবং Forma-র সাহায্যে নির্দিষ্ট স্থানে Product Barcode ও QR Code Sticker সঠিকভাবে লাগিয়ে দিতে হবে (চিত্র-১ ও চিত্র-২)।",
    "৩) এরপর E-Service থেকে WQMS-এ প্রবেশ করে Set Up (Smart QR Code Sender Process) সম্পন্ন করতে হবে (চিত্র-৩)।",
    "৪) চিত্র-৪ অনুযায়ী প্যাকেজিং টেপ ডিসপেনসার থেকে ২০০ মিলিমিটার লম্বা BOPP টেপ কেটে কার্টুনে ১ লেয়ার টেপ ব্যবহার করতে হবে।",
    "৫) চিত্র-৫ অনুসারে পেট বেল্ট মেশিনে ৩ সেটিং করে কার্টুনে সঠিকভাবে বেল্ট দিতে হবে।"
  ],
  "qualityPoints": [
    "১) QR Code Sticker এবং Product Barcode যাতে নির্দিষ্ট স্থানে সোজাভাবে এবং কোনো ভাঁজ বা এয়ার বাবল ছাড়া লাগানো থাকে তা নিশ্চিত করতে হবে (চিত্র-১ ও চিত্র-২)।",
    "২) Frame থেকে Poly সরানোর সময় কোনো স্ক্র্যাচ বা দাগ যাতে না পড়ে সেদিকে খেয়াল রাখতে হবে।",
    "৩) WQMS এবং E-Service-এ ডাটা সঠিকভাবে সেটআপ হয়েছে কিনা তা যাচাই করতে হবে।"
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

RULES:
1. Fluency & Grammar: Pure, formal Bengali sentences.
2. Technical Terms: Preserve standard factory terms in English (e.g., QR Code, Barcode, Product Barcode, Component Barcode, Indoor Unit, Outdoor Unit, Poly, Forma, Frame, Sensor, PCB, BOPP Tape, Scanner, WQMS, E-Service).
   - NEVER translate 'QR Code' to 'কোডেড প্রতীক'.
   - NEVER translate 'Indoor Unit' to 'অভ্যন্তভাগের একক'.
   - NEVER translate 'E-Service' to 'বৈদ্যুতিক সেবা প্রণালী'.
   - NEVER translate 'Poly' to 'পলি আবরণ'.
   - NEVER translate 'Forma' to 'ফর্ম'.
   - NEVER translate 'Scanner' to 'স্ক্যানিং যন্ত্র'.
3. Every point must start with ১), ২), ৩) etc.
4. If photo references exist (chobi-1, pic 2), convert to (চিত্র-১), (চিত্র-২) at end of sentence.
5. Respond ONLY with a valid JSON object:
{
  "qualityPoints": [
    "১) Indoor Unit-এ QR Code Sticker এবং Barcode যাতে নির্দিষ্ট স্থানে সোজাভাবে লাগানো থাকে তা নিশ্চিত করতে হবে (চিত্র-১ ও চিত্র-২)।",
    "২) Frame থেকে Poly সরানোর সময় কোনো স্ক্র্যাচ বা দাগ যাতে না পড়ে সেদিকে লক্ষ্য রাখতে হবে।",
    "৩) WQMS ও E-Service-এ স্ক্যান করে ডাটা সঠিকভাবে এন্ট্রি হয়েছে কিনা তা যাচাই করতে হবে।"
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
