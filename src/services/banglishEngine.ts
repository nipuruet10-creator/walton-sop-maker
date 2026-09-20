import { toBengaliNumber } from '../data/defaultSopData';

export interface GeneratedSOPContent {
  steps: string[];
  qualityPoints: string[];
  generalInstructions: string[];
}

type ReplacementFn = (substring: string, ...args: any[]) => string;

// 1. High-Priority Multi-word Factory Phrases and Idioms
const phraseDictionary: [RegExp, string | ReplacementFn][] = [
  // Photo reference patterns
  [/\(?\b(?:chobi|pic|photo|figure|chitra|citro|ছবি)[-_\s]*([0-9]+)\b\)?/gi, (_: string, n: string) => `(চিত্র-${toBengaliNumber(parseInt(n, 10))})`],

  // Equipment, Factory Terms & Industrial objects
  [/\b(?:smart\s*qr\s*code\s*sticker|smart\s*qr\s*sticker)\b/gi, 'Smart QR Code Sticker'],
  [/\b(?:smart\s*qr\s*code|smart\s*qr)\b/gi, 'Smart QR Code'],
  [/\b(?:qr\s*code\s*sticker|qr\s*sticker)\b/gi, 'QR Code Sticker'],
  [/\b(?:qr\s*code)\b/gi, 'QR Code'],
  [/\b(?:product\s*barcode\s*sticker|barcode\s*sticker)\b/gi, 'Barcode Sticker'],
  [/\b(?:product\s*barcode)\b/gi, 'Product Barcode'],
  [/\b(?:barcode)\b/gi, 'Barcode'],
  [/\b(?:indoor\s*unit)\b/gi, 'Indoor Unit'],
  [/\b(?:outdoor\s*unit)\b/gi, 'Outdoor Unit'],
  [/\b(?:e-service|eservice)\b/gi, 'E-Service'],
  [/\b(?:wqms)\b/gi, 'WQMS'],
  [/\b(?:packaging tape dispenser|packaging tape)\b/gi, 'প্যাকেজিং টেপ ডিসপেনসার'],
  [/\b(?:tape dispenser|dispenser)\b/gi, 'টেপ ডিসপেনসার'],
  [/\b(?:bopp tape)\b/gi, 'BOPP টেপ'],
  [/\b(?:pet belt machine)\b/gi, 'পেট বেল্ট মেশিন'],
  [/\b(?:pet belt|belt machine)\b/gi, 'পেট বেল্ট'],
  [/\b(?:cassette indoor cartoon|cassette indoor carton|cassette indoor)\b/gi, 'ক্যাসেট ইনডোর কার্টুন'],
  [/\b(?:cassette outdoor cartoon|cassette outdoor carton|cassette outdoor)\b/gi, 'ক্যাসেট আউটডোর কার্টুন'],
  [/\b(?:cassette idu)\b/gi, 'ক্যাসেট আইডিইউ'],
  [/\b(?:assembly line)\b/gi, 'অ্যাসেম্বলি লাইন'],
  [/\b(?:indoor cartoon|indoor carton|indoor kartun)\b/gi, 'ইনডোর কার্টুন'],
  [/\b(?:outdoor cartoon|outdoor carton|outdoor kartun)\b/gi, 'আউটডোর কার্টুন'],
  [/\b(?:refrigerator door groove|door groove)\b/gi, 'রেফ্রিজারেটর ডোর গ্রুভ'],
  [/\b(?:refrigerator door|fridge door)\b/gi, 'রেফ্রিজারেটর ডোর'],
  [/\b(?:refrigerator|fridge)\b/gi, 'রেফ্রিজারেটর'],
  [/\b(?:rubber gasket)\b/gi, 'রাবার গ্যাসকেট'],
  [/\b(?:magnetic seal)\b/gi, 'ম্যাগনেটিক সিল'],
  [/\b(?:four corner|char corner)\b/gi, 'চার কোণা'],
  [/\b(?:uniform gap)\b/gi, 'সুষম ফাঁকা স্থান'],
  [/\b(?:code\s*sender\s*process|code\s*sender)\b/gi, 'Code Sender Process'],
  [/\b(?:set\s*up|setup)\b/gi, 'Set Up'],
  [/\b(?:close kore|bondho kore)\b/gi, 'বন্ধ করে'],
  [/\b(?:soriye\s*dite\s*hobe|soriye\s*nite\s*hobe|remove\s*korte\s*hobe)\b/gi, 'সরিয়ে নিতে হবে'],
  [/\b(?:soriye\s*deya|soriye\s*dibo)\b/gi, 'সরিয়ে দিতে'],
  [/\b(?:probesh\s*kore|enter\s*kore)\b/gi, 'প্রবেশ করে'],
  [/\b(?:sahajjye|sahajje|help\s*e)\b/gi, 'সাহায্যে'],
  [/\b(?:nirdharito|fixed)\b/gi, 'নির্ধারিত'],
  [/\b(?:proyojyo|applicable)\b/gi, 'প্রযোজ্য'],
  [/\b(?:ase kina|ache kina)\b/gi, 'আছে কিনা'],

  // Multi-word action phrases & adverbs (with flexible whitespace and phonetic typo handling)
  [/\b(?:s+h?o+t+h?i+k+h?\s*(?:bhabe|vabe|babe|vhabe)|thik\s*(?:bhabe|vabe|babe|vhabe)|properly)\b/gi, 'সঠিকভাবে'],
  [/\b(?:valo\s*(?:bhabe|vabe|babe|vhabe)|bhalo\s*(?:bhabe|vabe|babe|vhabe)|well)\b/gi, 'ভালোভাবে'],
  [/\b(?:shundor\s*(?:bhabe|vabe|babe|vhabe)|sundor\s*(?:bhabe|vabe|babe|vhabe)|nicely)\b/gi, 'সুন্দরভাবে'],
  [/\b(?:shabdhan\s*e|shabdhane|carefully)\b/gi, 'সাবধানে'],
  [/\b(?:dhire\s*dhire|slowly)\b/gi, 'ধীরে ধীরে'],
  [/\b(?:druto|quickly|fast)\b/gi, 'দ্রুত'],
  [/\b(?:shokto\s*kore|tight\s*kore|tightly)\b/gi, 'দৃঢ়ভাবে'],
  [/\b(?:lagay\s*nite\s*hobe|lagaye\s*nite\s*hobe|lagiye\s*nite\s*hobe)\b/gi, 'লাগিয়ে নিতে হবে'],
  [/\b(?:lagay\s*dite\s*hobe|lagaye\s*dite\s*hobe|lagiye\s*dite\s*hobe)\b/gi, 'লাগিয়ে দিতে হবে'],
  [/\b(?:lagate\s*hobe|lagano\s*hobe)\b/gi, 'লাগাতে হবে'],
  [/\b(?:boshay\s*nite\s*hobe|boshiye\s*nite\s*hobe)\b/gi, 'বসিয়ে নিতে হবে'],
  [/\b(?:boshate\s*hobe|boshano\s*hobe|apply\s*korte\s*hobe)\b/gi, 'বসাতে হবে'],
  [/\b(?:kete\s*nite\s*hobe|kete\s*felte\s*hobe)\b/gi, 'কেটে নিতে হবে'],
  [/\b(?:use\s*korte\s*hobe|byabohar\s*korte\s*hobe)\b/gi, 'ব্যবহার করতে হবে'],
  [/\b(?:check\s*kore\s*nite\s*hobe|check\s*korte\s*hobe|inspect\s*korte\s*hobe|inspection\s*korte\s*hobe)\b/gi, 'যাচাই করতে হবে'],
  [/\b(?:porishkar\s*kore\s*nite\s*hobe|clean\s*kore\s*nite\s*hobe|clean\s*korte\s*hobe)\b/gi, 'পরিষ্কার করতে হবে'],
  [/\b(?:press\s*kore|chepe)\b/gi, 'চেপে'],
  [/\b(?:chihnito\s*sthane|chihnito\s*jaygay|marked\s*sthane|marked\s*jaygay)\b/gi, 'চিহ্নিত স্থানে'],
  [/\b(?:taping\s*sthane|taping\s*jaygay)\b/gi, 'টেপিং স্থানে'],
  [/\b(?:1\s*layer|ek\s*layer|one\s*layer)\b/gi, 'এক লেয়ার'],
  [/\b(?:every\s*ta|every\s*ti|proti\s*ta|protiti)\b/gi, 'প্রতিটি'],
  [/\b(?:dekhano\s*onujayi|dekhano\s*onushare|shown\s*onujayi)\b/gi, 'দেখানো অনুযায়ী'],
  [/\b(?:onusare|onushare|onujayi|according\s*to)\b/gi, 'অনুযায়ী'],
  [/\b(?:ubhoy\s*pashe|both\s*sides?\s*e)\b/gi, 'উভয় পাশে'],
  [/\b(?:char\s*pashe|four\s*sides?\s*e)\b/gi, 'চারপাশে'],
  [/\b(?:nirdishto\s*sthane|specific\s*places?\s*e)\b/gi, 'নির্দিষ্ট স্থানে'],
  [/\b(?:nicher\s*dike|bottom\s*side\s*e)\b/gi, 'নিচের দিকে'],
  [/\b(?:uporer\s*dike|top\s*side\s*e)\b/gi, 'উপরের দিকে'],
  [/\b(?:kheyal\s*rakhte\s*hobe|careful\s*thakte\s*hobe)\b/gi, 'খেয়াল রাখতে হবে'],
  [/\b(?:nishchit\s*korte\s*hobe|ensure\s*korte\s*hobe)\b/gi, 'নিশ্চিত করতে হবে'],
  [/\b(?:chide\s*na\s*jay|chire\s*na\s*jay|damage\s*na\s*hoy)\b/gi, 'ছিঁড়ে না যায়'],
  [/\b(?:baka\s*na\s*hoy)\b/gi, 'বাঁকা না হয়'],
  [/\b(?:shojasuji|straight)\b/gi, 'সোজাসুজি'],
  [/\b(?:obohito\s*korte\s*hobe|inform\s*korte\s*hobe|janate\s*hobe)\b/gi, 'অবহিত করতে হবে'],
  [/\b(?:bondho\s*rekhe|off\s*kore)\b/gi, 'বন্ধ রেখে'],
  [/\b(?:bidyut\s*opochoy\s*rodh|electricity\s*save)\b/gi, 'বিদ্যুৎ অপচয় রোধ'],
  [/\b(?:kajer\s*sheshe)\b/gi, 'কাজের শেষে'],
  [/\b(?:sokol\s*proyojoniyo)\b/gi, 'সকল প্রয়োজনীয়'],
  [/\b(?:line\s*supervisor|supervisor|supervisorke)\b/gi, 'লাইন সুপারভাইজারকে'],

  // Critical phrases & verification clauses (ensuring 100% translation without leftover Banglish words)
  [/\b(?:([০-৯\d]+)\s*layer\s*(?:hosse|hosshe|hocche|hoche|hoyeche|hoyese|hoise)\s*kina\s*(?:seta|sheta|ta)?\s*(?:check\s*(?:dite|korte|kore\s*nite)|inspection\s*korte|inspect\s*korte|verify\s*korte)\s*hobe)\b/gi, (_: string, n: string) => `${toBengaliNumber(parseInt(n, 10))} লেয়ার হচ্ছে কিনা তা যাচাই করতে হবে`],
  [/\b(?:(?:hosse|hosshe|hocche|hoche|hoyeche|hoyese|hoise)\s*kina\s*(?:seta|sheta|ta)?\s*(?:check\s*(?:dite|korte|kore\s*nite)|inspection\s*korte|inspect\s*korte|verify\s*korte)\s*hobe)\b/gi, 'হচ্ছে কিনা তা যাচাই করতে হবে'],
  [/\b(?:(?:ase|ache)\s*kina\s*(?:seta|sheta|ta)?\s*(?:check\s*(?:dite|korte|kore\s*nite)|inspection\s*korte|inspect\s*korte|verify\s*korte)\s*hobe)\b/gi, 'আছে কিনা তা যাচাই করতে হবে'],
  [/\b(?:thik\s*(?:ase|ache)\s*kina\s*(?:seta|sheta|ta)?\s*(?:check\s*(?:dite|korte|kore\s*nite)|inspection|inspect|verify)\s*hobe)\b/gi, 'ঠিক আছে কিনা তা যাচাই করতে হবে'],
  [/\b(?:(?:seta|sheta)\s*(?:check\s*dite\s*hobe|check\s*korte\s*hobe))\b/gi, 'তা যাচাই করতে হবে'],
  [/\b(?:(?:seta|sheta)\s*(?:nissit|nishchit|nischit|ensure)\s*korte\s*hobe)\b/gi, 'তা নিশ্চিত করতে হবে'],
  [/\b(?:check\s*dite\s*hobe|check\s*korte\s*hobe)\b/gi, 'যাচাই করতে হবে'],
  [/\b(?:check\s*kore\s*nite\s*hobe|check\s*kore\s*dekhte\s*hobe)\b/gi, 'যাচাই করে দেখতে হবে'],
  [/\b(?:hosse|hosshe|hocche|hoche)\s*kina\b/gi, 'হচ্ছে কিনা'],
  [/\b(?:hoyese|hoyeche|hoise)\s*kina\b/gi, 'হয়েছে কিনা'],
  [/\b(?:ase|ache)\s*kina\b/gi, 'আছে কিনা'],
  [/\b(?:thik\s*ase|thik\s*ache)\s*kina\b/gi, 'ঠিক আছে কিনা'],
  [/\b(?:thik\s*moto|thik\s*vabe|thik\s*bhabe)\b/gi, 'সঠিকভাবে'],
  [/\b(?:valo\s*moto|bhalo\s*moto)\b/gi, 'ভালোভাবে'],
  [/\b(?:kono\s*vabe\s*jeno|kono\s*bhabe\s*jeno)\b/gi, 'কোনোভাবে যেন'],
  [/\b(?:damage\s*na\s*hoy|nosto\s*na\s*hoy)\b/gi, 'নষ্ট না হয়'],
  [/\b(?:thaka\s*jabe\s*na)\b/gi, 'থাকা যাবে না'],
  [/\b(?:kora\s*jabe\s*na)\b/gi, 'করা যাবে না'],
  [/\b(?:deya\s*jabe\s*na)\b/gi, 'দেওয়া যাবে না'],
  [/\b(?:tight\s*dite\s*hobe|tight\s*korte\s*hobe)\b/gi, 'দৃঢ়ভাবে আটকাতে হবে'],
  [/\b(?:air\s*bubble\s*(?:thaka\s*jabe\s*na|na\s*thake))\b/gi, 'বাতাসের বুদ্বুদ থাকা যাবে না'],
  [/\b(?:faka\s*thaka\s*jabe\s*na|gap\s*thaka\s*jabe\s*na)\b/gi, 'ফাঁকা থাকা যাবে না'],
  [/\b(?:dhula\s*bali|dhulabali)\b/gi, 'ধুলাবালি'],
  [/\b(?:eta|eita)\s*(?:nissit|nishchit|nischit|nisshit)\s*korte\s*hobe\s*(?:je)?\b/gi, 'এটি নিশ্চিত করতে হবে যে'],
  [/\b(?:nissit|nishchit|nischit|nisshit)\s*korte\s*hobe\s*(?:je)?\b/gi, 'নিশ্চিত করতে হবে যে'],
  [/\b(?:2|dui)\s*layer\s*e\s*tape\s*dite\s*hobe\b/gi, '২ লেয়ারে টেপ দিতে হবে'],
  [/\b(?:2|dui)\s*layer\s*tape\s*deya\s*(?:hoyese|hoyeche|hoise)\b/gi, '২ লেয়ার টেপ দেওয়া হয়েছে'],
  [/\b([0-9]+)\s*layer\s*e\b/gi, (_: string, n: string) => `${toBengaliNumber(parseInt(n, 10))} লেয়ারে`],
  [/\b([0-9]+)\s*layer\b/gi, (_: string, n: string) => `${toBengaliNumber(parseInt(n, 10))} লেয়ার`],
  [/\b(?:tape\s*dite\s*hobe)\b/gi, 'টেপ দিতে হবে'],
  [/\b(?:deya\s*hoyese|deya\s*hoyeche|deoya\s*hoyese|deoya\s*hoyeche|deya\s*hoise)\b/gi, 'দেওয়া হয়েছে'],
  [/\b(?:lagano\s*hoyese|lagano\s*hoyeche)\b/gi, 'লাগানো হয়েছে'],
  [/\b(?:boshano\s*hoyese|boshano\s*hoyeche)\b/gi, 'বসানো হয়েছে'],
];

// 2. Comprehensive Word-Level Dictionary (Banglish & English words mapped to formal Bengali)
const wordMap: Record<string, string> = {
  // Verification, Clauses & Adverbs
  hosse: 'হচ্ছে',
  hosshe: 'হচ্ছে',
  hocche: 'হচ্ছে',
  hoche: 'হচ্ছে',
  hosche: 'হচ্ছে',
  hoyese: 'হয়েছে',
  hoyeche: 'হয়েছে',
  hoise: 'হয়েছে',
  hoiche: 'হয়েছে',
  holo: 'হলো',
  kina: 'কিনা',
  seta: 'তা',
  sheta: 'তা',
  ta: 'তা',
  eta: 'এটি',
  eita: 'এটি',
  eti: 'এটি',
  eiti: 'এটি',
  oita: 'ঐটি',
  ota: 'ঐটি',
  je: 'যে',
  zate: 'যাতে',
  jate: 'যাতে',
  jeno: 'যেন',
  kono: 'কোনো',
  na: 'না',
  jodi: 'যদি',
  tobe: 'তবে',
  karon: 'কারণ',
  shudhu: 'শুধু',
  shudu: 'শুধু',
  nissit: 'নিশ্চিত',
  nischit: 'নিশ্চিত',
  nishchit: 'নিশ্চিত',
  nisshit: 'নিশ্চিত',
  layere: 'লেয়ারে',
  layer: 'লেয়ার',
  tapeti: 'টেপটি',
  tepti: 'টেপটি',
  tep: 'টেপ',
  tape: 'টেপ',
  damage: 'ক্ষতি',
  khoti: 'ক্ষতি',
  nosto: 'নষ্ট',
  dhula: 'ধুলা',
  bali: 'বালি',
  dhulabali: 'ধুলাবালি',
  moyla: 'ময়লা',
  dag: 'দাগ',
  truti: 'ত্রুটি',
  somossya: 'সমস্যা',
  somosya: 'সমস্যা',
  problem: 'সমস্যা',
  part: 'যন্ত্রাংশ',
  parts: 'যন্ত্রাংশ',
  jontropati: 'যন্ত্রপাতি',

  // Common action verbs & steps
  prothome: 'প্রথমে',
  first: 'প্রথমে',
  tarpor: 'তারপরে',
  then: 'তারপরে',
  sheshe: 'সবশেষে',
  finally: 'সবশেষে',
  sothik: 'সঠিক',
  shothik: 'সঠিক',
  shothikh: 'সঠিক',
  thik: 'ঠিক',
  vabe: 'ভাবে',
  bhabe: 'ভাবে',
  babe: 'ভাবে',
  vhabe: 'ভাবে',
  lagay: 'লাগিয়ে',
  lagaye: 'লাগিয়ে',
  lagiye: 'লাগিয়ে',
  lagate: 'লাগাতে',
  lagano: 'লাগানো',
  lagaba: 'লাগাবেন',
  boshay: 'বসিয়ে',
  boshiye: 'বসিয়ে',
  boshate: 'বসাতে',
  boshano: 'বসানো',
  boshabo: 'বসাবো',
  kete: 'কেটে',
  katte: 'কাটতে',
  kata: 'কাটা',
  nite: 'নিতে',
  niye: 'নিয়ে',
  dite: 'দিতে',
  diye: 'দিয়ে',
  deya: 'দেওয়া',
  dibo: 'দিবো',
  korte: 'করতে',
  kore: 'করে',
  kora: 'করা',
  korun: 'করুন',
  hobe: 'হবে',
  hoye: 'হয়ে',
  hoy: 'হয়',
  thake: 'থাকে',
  thakte: 'থাকতে',
  thakbe: 'থাকবে',
  thakle: 'থাকলে',
  rekhe: 'রেখে',
  rakhte: 'রাখতে',
  rakha: 'রাখা',
  rakhun: 'রাখুন',
  dekhe: 'দেখে',
  dekhte: 'দেখতে',
  dekha: 'দেখা',
  dekhun: 'দেখুন',
  pore: 'পরে',
  porte: 'পরতে',
  khule: 'খুলে',
  khulte: 'খুলতে',
  shuru: 'শুরু',
  start: 'শুরু',
  sesh: 'শেষ',
  shesh: 'শেষ',
  finish: 'শেষ',
  chalu: 'চালু',
  bondho: 'বন্ধ',
  off: 'বন্ধ',
  on: 'চালু',
  clean: 'পরিষ্কার',
  porishkar: 'পরিষ্কার',
  check: 'যাচাই',
  jajai: 'যাচাই',
  test: 'পরীক্ষা',
  inspect: 'পরিদর্শন',
  inspection: 'পরিদর্শন',
  press: 'চেপে',
  chepe: 'চেপে',
  tene: 'টেনে',
  tana: 'টানা',
  chapa: 'চাপা',
  ghuriye: 'ঘুরিয়ে',
  ghurano: 'ঘুরানো',
  mepe: 'মেপে',
  mapa: 'মাপা',

  // Nouns, Parts & Industrial terms
  belt: 'বেল্ট',
  beltti: 'বেল্টটি',
  setting: 'সেটিং',
  seting: 'সেটিং',
  tension: 'টেনশন',
  dial: 'ডায়াল',
  sensor: 'সেন্সর',
  wire: 'তার',
  pipe: 'পাইপ',
  screw: 'স্ক্রু',
  nut: 'নাট',
  bolt: 'বোল্ট',
  motor: 'মোটর',
  gas: 'গ্যাস',
  leak: 'লিক',
  groove: 'গ্রুভ',
  gasket: 'গ্যাসকেট',
  door: 'ডোর',
  rubber: 'রাবার',
  seal: 'সিল',
  corner: 'কোণা',
  gap: 'ফাঁকা স্থান',
  surface: 'পৃষ্ঠতল',
  dust: 'ধুলাবালি',
  defect: 'ত্রুটি',
  scratch: 'দাগ',
  cleaner: 'ক্লিনার',
  safety: 'নিরাপত্তা',
  shoes: 'জুতা',
  gloves: 'গ্লাভস',
  goggles: 'চশমা',
  mask: 'মাস্ক',
  operator: 'অপারেটর',
  engineer: 'প্রকৌশলী',
  line: 'লাইন',
  station: 'স্টেশন',
  floor: 'ফ্লোর',
  jonpotro: 'যন্ত্রপাতি',
  indoor: 'ইনডোর',
  outdoor: 'আউটডোর',
  cassette: 'ক্যাসেট',
  cartoon: 'কার্টুন',
  carton: 'কার্টুন',
  kartun: 'কার্টুন',
  katun: 'কার্টুন',
  cartoone: 'কার্টুনে',
  kartune: 'কার্টুনে',
  dispenser: 'ডিসপেনসার',
  forma: 'Forma',
  poly: 'Poly',
  frame: 'Frame',
  model: 'Model',
  scanner: 'Scanner',
  scan: 'স্ক্যান',
  barcode: 'Barcode',
  qr: 'QR',
  code: 'Code',
  setup: 'Set Up',
  idu: 'IDU',
  odu: 'ODU',
  cac: 'CAC',
  pcb: 'PCB',
  jig: 'Jig',
  sticker: 'Sticker',
  soriye: 'সরিয়ে',
  probesh: 'প্রবেশ',
  sahajjye: 'সাহায্যে',
  sahajje: 'সাহায্যে',
  nirdharito: 'নির্ধারিত',
  proyojyo: 'প্রযোজ্য',

  // Connectors & Adverbs
  er: 'এর',
  e: 'এ',
  te: 'তে',
  ti: 'টি',
  gulo: 'গুলো',
  theke: 'থেকে',
  lomba: 'লম্বা',
  shojasuji: 'সোজাসুজি',
  straight: 'সোজাসুজি',
  baka: 'বাঁকা',
  chide: 'ছিঁড়ে',
  chire: 'ছিঁড়ে',
  properly: 'সঠিকভাবে',
  carefully: 'সাবধানে',
  kheyal: 'খেয়াল',
  careful: 'সতর্ক',
  mot: 'মোট',
  total: 'মোট',
  ubhoy: 'উভয়',
  both: 'উভয়',
  pashe: 'পাশে',
  side: 'পাশে',
  nirdishto: 'নির্দিষ্ট',
  chihnito: 'চিহ্নিত',
  marked: 'চিহ্নিত',
  sthane: 'স্থানে',
  jaygay: 'জায়গায়',
  dike: 'দিকে',
  upore: 'উপরে',
  top: 'উপরে',
  niche: 'নিচে',
  bottom: 'নিচে',
  char: 'চার',
  four: 'চার',
  tin: 'তিন',
  three: 'তিন',
  dui: 'দুই',
  two: 'দুই',
  ek: 'এক',
  one: 'এক',
  sob: 'সব',
  shob: 'সব',
  all: 'সকল',
  sokol: 'সকল',
  proti: 'প্রতিটি',
  protiti: 'প্রতিটি',
  each: 'প্রতিটি',
  every: 'প্রতিটি',
  khub: 'খুব',
  onek: 'অনেক',
  ar: 'আর',
  ebong: 'এবং',
  and: 'এবং',
  ba: 'বা',
  or: 'অথবা',
  athoba: 'অথবা',
  kintu: 'কিন্তু',
  but: 'কিন্তু',
  somoy: 'সময়',
  time: 'সময়',
  mm: 'মিলিমিটার',
  cm: 'সেন্টিমিটার',
  kg: 'কেজি',
};

// Preserved industrial terms that should never be phonetically mangled
const PRESERVED_INDUSTRIAL_TERMS: Record<string, string> = {
  qr: 'QR',
  code: 'Code',
  barcode: 'Barcode',
  indoor: 'Indoor',
  unit: 'Unit',
  outdoor: 'Outdoor',
  poly: 'Poly',
  forma: 'Forma',
  frame: 'Frame',
  model: 'Model',
  setup: 'Set Up',
  scanner: 'Scanner',
  scan: 'স্ক্যান',
  eservice: 'E-Service',
  'e-service': 'E-Service',
  wqms: 'WQMS',
  bopp: 'BOPP',
  pet: 'PET',
  pcb: 'PCB',
  jig: 'Jig',
  sticker: 'Sticker',
  dispenser: 'ডিসপেনসার',
  smart: 'Smart',
  process: 'Process',
};

// 3. Fallback Phonetic Transliteration (Avro-like phonetic algorithm)
function phoneticWord(w: string): string {
  // If acronym (all caps like BOPP, IDU, CAC, PET, BTU, SL) or digits, keep as-is
  if (/^[A-Z0-9\-_]+$/.test(w) || /^[০-৯]+$/.test(w)) {
    return w;
  }

  const str = w.toLowerCase();

  if (PRESERVED_INDUSTRIAL_TERMS[str]) {
    return PRESERVED_INDUSTRIAL_TERMS[str];
  }

  // Basic Avro phonetic replacement rules
  const phoneticMap: [RegExp, string][] = [
    [/s+h?o+t+h?i+k+h?/g, 'সঠিক'],
    [/thik/g, 'ঠিক'],
    [/vabe|bhabe|babe|vhabe/g, 'ভাবে'],
    [/lagay|lagaye|lagiye/g, 'লাগিয়ে'],
    [/lagate/g, 'লাগাতে'],
    [/boshate|boshay|boshiye/g, 'বসাতে'],
    [/kete|katte/g, 'কেটে'],
    [/nite/g, 'নিতে'],
    [/dite/g, 'দিতে'],
    [/korte/g, 'করতে'],
    [/kore/g, 'করে'],
    [/hobe/g, 'হবে'],
    [/hoye/g, 'হয়ে'],
    [/rekhe/g, 'রেখে'],
    [/rakhte/g, 'রাখতে'],
    [/chobi/g, 'ছবি'],
    [/sthane/g, 'স্থানে'],
    [/chihnito/g, 'চিহ্নিত'],
    [/nirdishto/g, 'নির্দিষ্ট'],
    [/ubhoy/g, 'উভয়'],
    [/pashe/g, 'পাশে'],
    [/niche/g, 'নিচে'],
    [/upore/g, 'উপরে'],
    [/lomba/g, 'লম্বা'],
    [/theke/g, 'থেকে'],
    [/prothome/g, 'প্রথমে'],
    [/tarpor/g, 'তারপরে'],
    [/sheshe/g, 'সবশেষে'],
    [/jate/g, 'যাতে'],
    [/chire|chide/g, 'ছিঁড়ে'],
    [/baka/g, 'বাঁকা'],
    [/shojasuji/g, 'সোজাসুজি'],
    [/hosse|hosshe|hocche|hoche/g, 'হচ্ছে'],
    [/hoyese|hoyeche|hoise/g, 'হয়েছে'],
    [/kina/g, 'কিনা'],
    [/seta|sheta/g, 'তা'],
    [/kono/g, 'কোনো'],
    [/jeno/g, 'যেন'],
    [/dhula\s*bali|dhulabali|dhula/g, 'ধুলাবালি'],
    [/moyla/g, 'ময়লা'],
    [/damage|khoti/g, 'ক্ষতি'],
    [/nosto/g, 'নষ্ট'],
    [/truti|fault/g, 'ত্রুটি'],
    [/somossya|somosya|problem/g, 'সমস্যা'],
    [/karon/g, 'কারণ'],
    [/jodi/g, 'যদি'],
    [/tobe/g, 'তবে'],
    [/shudhu|shudu/g, 'শুধু'],
  ];

  for (const [pat, rep] of phoneticMap) {
    if (pat.test(str)) {
      return str.replace(pat, rep);
    }
  }

  return str;
}

/**
 * Clean up double brackets, danda spacing, Bengali grammatical contractions, and formatting
 */
function cleanBanglaFormatting(text: string): string {
  let res = text
    // Replace double parenthesis like ((চিত্র-১)) with (চিত্র-১)
    .replace(/\(\(\s*([^)]+?)\s*\)\)/g, '($1)')
    .replace(/\(\s*\(/g, '(')
    .replace(/\)\s*\)/g, ')')
    // Clean redundant danda/period preceding (চিত্র-X)
    .replace(/([।\.\,])\s*(\(চিত্র-[০-৯]+\))/g, ' $2')
    // Clean multiple dandas or dots
    .replace(/[।\.]+/g, '।')
    // Remove space between word and punctuation
    .replace(/\s+([।,])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();

  // If sentence starts with "(চিত্র-X) অনুযায়ী" or "(চিত্র-X) অনুসারে", change to "চিত্র-X অনুযায়ী" without parenthesis
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

  // Bengali genitive contractions: 'কার্টুন এর' -> 'কার্টুনের', 'টেপ এর' -> 'টেপের', 'মেশিন এর' -> 'মেশিনের'
  res = res.replace(/([\u0995-\u09B9])\s+এর(?=[\s.,!?।]|$)/g, '$1ের');
  // Bengali locative contractions: 'কার্টুন এ' -> 'কার্টুনে', 'মেশিন এ' -> 'মেশিনে', 'লাইন এ' -> 'লাইনে' (not digits)
  res = res.replace(/([\u0995-\u09B9])\s+এ(?=[\s.,!?।]|$)/g, '$1ে');
  // Noun + quantifier spacing: '৪ টি' -> '৪টি', 'টেপ টি' -> 'টেপটি', 'কার্টুন টি' -> 'কার্টুনটি'
  res = res.replace(/([\u0980-\u09FF\d]+)\s+(টি|টা|খানা|গুলো)(?=[\s.,!?।]|$)/g, '$1$2');
  res = res.replace(/ধুলা\s+বালি/g, 'ধুলাবালি');

  // Ensure single terminal danda
  if (!res.endsWith('।')) {
    res += '।';
  }

  // Deduplicate terminal danda after parenthesis: '(চিত্র-১)।।' -> '(চিত্র-১)।'
  res = res.replace(/(\(চিত্র-[০-৯]+\))\s*।+/g, '$1।');
  return res.replace(/।+/g, '।');
}

/**
 * Translates a single line of Banglish / English text to pure Bengali
 */
export function translateSingleLine(line: string): string {
  // 1. Strip leading numbering: "1.", "1)", "(1)", "step 1:", "১)", etc.
  let cleaned = line.replace(/^(\d+[\.\)\-:]|\([0-9]+\)|step\s*\d+:?|[০-৯]+[\)\.\-:])\s*/i, '');

  // 2. Pass 1: Apply Multi-word Phrase Dictionary
  for (const [pattern, replacement] of phraseDictionary) {
    if (typeof replacement === 'string') {
      cleaned = cleaned.replace(pattern, replacement);
    } else if (typeof replacement === 'function') {
      cleaned = cleaned.replace(pattern, replacement as any);
    }
  }

  // 3. Pass 2: Word-by-word token translation
  cleaned = cleaned
    .split(/(\s+|[.,;!?()]+)/)
    .map(token => {
      if (!token.trim() || /^[.,;!?()]+$/.test(token)) return token;

      const lower = token.toLowerCase();
      if (wordMap[lower]) {
        return wordMap[lower];
      }

      // Suffix handling: e.g. 'shothikbhabe', 'shothikhbabe', 'shothikbabe'
      if (/(?:bhabe|vabe|babe|vhabe)$/i.test(lower)) {
        const stem = lower.replace(/(?:bhabe|vabe|babe|vhabe)$/i, '');
        if (wordMap[stem]) return `${wordMap[stem]}ভাবে`;
        if (/^s+h?o+t+h?i+k+h?$/i.test(stem)) return 'সঠিকভাবে';
        if (/^valo|^bhalo/i.test(stem)) return 'ভালোভাবে';
        if (/^shundor|^sundor/i.test(stem)) return 'সুন্দরভাবে';
      }
      if (lower.endsWith('er')) {
        const stem = lower.slice(0, -2);
        if (wordMap[stem]) return `${wordMap[stem]}ের`;
      }
      if (lower.endsWith('e') && lower.length > 2) {
        const stem = lower.slice(0, -1);
        if (wordMap[stem]) return `${wordMap[stem]}ে`;
      }

      return phoneticWord(token);
    })
    .join('');

  // 4. Convert isolated English digits to Bengali numerals
  cleaned = cleaned.replace(/\b(\d+)\b/g, (match) => {
    const val = parseInt(match, 10);
    return toBengaliNumber(val);
  });

  // 5. Final Polish: Clean danda and formatting
  return cleanBanglaFormatting(cleaned);
}

/**
 * Intelligent Offline Banglish to 100% Pure Bengali Converter
 */
export function offlineConvertBanglish(input: string): GeneratedSOPContent {
  const lines = input
    .split(/\n+/)
    .map(l => l.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return {
      steps: [
        '১) প্রথমে প্যাকেজিং টেপ ডিসপেনসার থেকে ২০০ মিলিমিটার লম্বা BOPP টেপ কেটে নিতে হবে। সঠিকভাবে লাগিয়ে নিতে হবে।',
        '২) ক্যাসেট ইনডোর কার্টুনের চিহ্নিত স্থানে সঠিকভাবে টেপটি বসাতে হবে (চিত্র-১)।',
        '৩) ইনডোর কার্টুনের প্রতিটি টেপিং স্থানে এক লেয়ার BOPP টেপ ব্যবহার করতে হবে (চিত্র-২)।',
      ],
      qualityPoints: [
        '১) বেল্ট লাগানোর সময় নিশ্চিত করতে হবে যাতে কার্টুন ছিঁড়ে না যায়। (চিত্র-৬)',
        '২) টেপ বসানোর সময় খেয়াল রাখতে হবে, যাতে টেপ বাঁকা না হয় এবং সোজাসুজি থাকে।',
        '৩) প্রতিটি জায়গায় এক লেয়ার টেপ সঠিকভাবে দেওয়া হয়েছে কিনা তা যাচাই করতে হবে।',
      ],
      generalInstructions: [
        '১) সকল প্রয়োজনীয় যন্ত্রপাতি সঠিক স্থানে রাখতে হবে।',
        '২) কাজের শেষে মেশিন, লাইন, ফ্যান বন্ধ রেখে বিদ্যুৎ অপচয় রোধ করতে হবে।',
        '৩) যেকোন ধরনের অনাকাঙ্ক্ষিত সমস্যায় দ্রুত লাইন সুপারভাইজারকে অবহিত করতে হবে।',
      ],
    };
  }

  const steps: string[] = lines.map((line, index) => {
    const cleaned = translateSingleLine(line);
    const prefix = `${toBengaliNumber(index + 1)}) `;
    return `${prefix}${cleaned}`;
  });

  // Dynamic context-aware quality points based on input contents
  const isRefrigerator = /refrigerator|gasket|fridge|groove/i.test(input);
  const qualityPoints = isRefrigerator
    ? [
        '১) গ্যাসকেট লাগানোর পর নিশ্চিত হতে হবে যাতে কোনো ফাঁকা বা লিকেজ না থাকে। (চিত্র-১)',
        '২) ডোর ফ্রেমের চার কোণায় গ্যাসকেট সঠিকভাবে লক হয়েছে কিনা তা পরীক্ষা করতে হবে। (চিত্র-২)',
        '৩) ডোর বন্ধ করে ম্যাগনেটিক সিল সর্বত্র সমানভাবে লেগেছে কিনা তা যাচাই করতে হবে। (চিত্র-৩)',
      ]
    : [
        '১) বেল্ট লাগানোর সময় নিশ্চিত করতে হবে যাতে কার্টুন ছিঁড়ে না যায়। (চিত্র-৬)',
        '২) টেপ বসানোর সময় খেয়াল রাখতে হবে, যাতে টেপ বাঁকা না হয় এবং সোজাসুজি থাকে।',
        '৩) প্রতিটি জায়গায় এক লেয়ার টেপ সঠিকভাবে দেওয়া হয়েছে কিনা তা যাচাই করতে হবে।',
      ];

  return {
    steps,
    qualityPoints,
    generalInstructions: [
      '১) সকল প্রয়োজনীয় যন্ত্রপাতি সঠিক স্থানে রাখতে হবে।',
      '২) কাজের শেষে মেশিন, লাইন, ফ্যান বন্ধ রেখে বিদ্যুৎ অপচয় রোধ করতে হবে।',
      '৩) যেকোন ধরনের অনাকাঙ্ক্ষিত সমস্যায় দ্রুত লাইন সুপারভাইজারকে অবহিত করতে হবে।',
    ],
  };
}

/**
 * Google Gemini AI Generation for Banglish -> High-Quality Bengali SOP
 */
export async function generateSOPWithGemini(
  banglishInput: string,
  apiKey: string,
  numPhotos: number = 6
): Promise<GeneratedSOPContent> {
  const prompt = `You are a Senior Industrial Process Development Engineer at Walton Hi-Tech Industries PLC.
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

User Banglish Input:
"""
${banglishInput}
"""

You MUST reply ONLY with valid JSON in this exact structure without markdown formatting or codeblocks:
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

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Gemini API Error: ${response.status} - ${err}`);
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) throw new Error('Empty response from Gemini');

    const parsed: GeneratedSOPContent = JSON.parse(rawText.trim());

    // Clean any double parentheses or unwanted spacing from AI response
    parsed.steps = parsed.steps.map(cleanBanglaFormatting);
    parsed.qualityPoints = parsed.qualityPoints.map(cleanBanglaFormatting);
    parsed.generalInstructions = parsed.generalInstructions.map(cleanBanglaFormatting);

    return parsed;
  } catch (error) {
    console.error('Gemini generation failed, falling back to offline converter:', error);
    throw error;
  }
}

/**
 * Offline converter for Critical Quality Points
 */
export function offlineConvertQualityPoints(text: string): string[] {
  if (!text || !text.trim()) return [];
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const points: string[] = [];
  lines.forEach((line, idx) => {
    const cleanLine = line.replace(/^([০-৯\d]+[\)\.\-:]\s*)/, '').trim();
    if (!cleanLine) return;
    const translated = translateSingleLine(cleanLine);
    points.push(`${toBengaliNumber(idx + 1)}) ${translated}`);
  });
  return points;
}

