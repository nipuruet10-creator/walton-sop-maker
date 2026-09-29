import type { SOPDocument, SOPPartRow, SOPToolRow } from '../types/sop';
import type { UserProfile } from '../types/auth';

export interface ProcessConcern {
  id: string;
  code: string;
  name: string;
  shortName: string;
  description: string;
  icon: string;
  gradient: string;
  borderColor: string;
  accentColor: string;
  lightBg: string;
  assignedEngineers: {
    id: string;
    name: string;
    role: string;
  }[];
  starterPattern: {
    refPrefix: string;
    processName: string;
    model: string;
    stationLine: string;
    steps: string[];
    qualityPoints: string[];
    generalInstructions: string[];
    safety: {
      instructionText: string;
      earMuff: boolean;
      gloves: boolean;
      goggles: boolean;
      safetyShoes: boolean;
      mask: boolean;
    };
    parts: SOPPartRow[];
    tools: SOPToolRow[];
  };
}

export const PROCESS_CONCERNS: ProcessConcern[] = [
  {
    id: 'cac_idu',
    code: 'CAC-IDU',
    name: 'CAC IDU Assembly Line',
    shortName: 'CAC IDU',
    description: 'Commercial Air Conditioner Indoor Unit Body & Sub-Assembly Line',
    icon: '🏢',
    gradient: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)',
    borderColor: '#93C5FD',
    accentColor: '#1D4ED8',
    lightBg: '#EFF6FF',
    assignedEngineers: [
      { id: '54150', name: 'Dev (54150)', role: 'Lead Line Engineer' },
      { id: '45127', name: 'Rafi (45127)', role: 'Process Checker' },
    ],
    starterPattern: {
      refPrefix: 'REF-CAC-IDU',
      processName: 'CAC IDU Body Sub-Assembly and Evaporator Insertion Process',
      model: 'W-CAC-IDU-24K / 36K / 48K',
      stationLine: 'CAC IDU Line - Station 02',
      steps: [
        '১) ওয়ার্ক অর্ডার ও ড্রয়িং দেখে নির্দিষ্ট চেসিস এবং ব্যাক প্লেট ট্রলি থেকে গ্রহণ করতে হবে।',
        '২) ড্রয়িং অনুযায়ী সঠিক জায়গায় ইভাপোরেটর কয়েল স্থাপন করে ফিক্সিং স্ক্রু দিয়ে শক্ত করে আটকাতে হবে।',
        '৩) ব্লয়ার ফ্যান মোটর সঠিক পজিশনে বসিয়ে নির্দিষ্ট টর্ক স্ক্রু ড্রাইভার দিয়ে স্ক্রু টাইট দিতে হবে।',
        '৪) ওয়্যারিং হারনেস ও পিসিবি (PCB) কানেক্টর নির্দিষ্ট স্লটে লক করতে হবে এবং কোনো তার খোলা আছে কিনা তা চেক করতে হবে।',
        '৫) বডি ড্রেন প্যান ও কভার লাগিয়ে কিউআর (QR) কোড ও বারকোড স্ক্যানার দিয়ে সঠিকভাবে স্ক্যান করে পরবর্তী স্টেশনে পাঠাতে হবে।',
      ],
      qualityPoints: [
        '১. ইভাপোরেটরের অ্যালুমিনিয়াম ফিন কোনোভাবেই বাঁকা বা ড্যামেজ হওয়া যাবে না।',
        '২. স্ক্রু টাইট দেওয়ার সময় নির্ধারিত টর্ক (১.৮ - ২.২ N.m) মানতে হবে।',
        '৩. ওয়্যারিং কানেক্টরের লক সাউন্ড (ক্লিক) শুনে সঠিক সংযোগ নিশ্চিত করতে হবে।',
        '৪. কিউআর (QR) কোড ও ডব্লিউকিউএমএস (WQMS) সিস্টেমে স্ট্যাটাস ওকে (OK) নিশ্চিত হতে হবে।',
      ],
      generalInstructions: [
        'লাইন চালু করার আগে স্টেশনের ৫-এস (5S) নিশ্চিত করুন।',
        'যেকোনো আনকমন শব্দ বা ত্রুটি দেখলে সাথে সাথে লাইন সুপারভাইজারকে জানান।',
        'কাজ শেষে ব্যবহৃত টুলস নির্দিষ্ট স্ট্যান্ডে রাখুন।',
      ],
      safety: {
        instructionText: 'স্টেশনে অবশ্যই অ্যান্টি-স্ট্যাটিক গ্লাভস এবং সেফটি শু পরে কাজ করতে হবে। বৈদ্যুতিক যন্ত্রাংশে সাবধানে হাত দিন।',
        earMuff: false,
        gloves: true,
        goggles: false,
        safetyShoes: true,
        mask: true,
      },
      parts: [
        { sl: 1, name: 'Chassis Frame', capacity: '2.0 / 3.0 Ton', gas: 'N/A' },
        { sl: 2, name: 'Evaporator Coil Assembly', capacity: '24K / 36K', gas: 'R410A / R32' },
        { sl: 3, name: 'Cross Flow Blower Fan', capacity: 'Standard', gas: 'N/A' },
        { sl: 4, name: 'BLDC Fan Motor', capacity: '45W / 70W', gas: 'N/A' },
      ],
      tools: [
        { sl: 1, name: 'Torque Controlled Electric Screwdriver', effectiveRange: '1.5 - 2.5 N.m' },
        { sl: 2, name: 'Bar Code / QR Code Scanner', effectiveRange: 'Standard 2D' },
        { sl: 3, name: 'Air Blow Gun', effectiveRange: '0.4 - 0.6 MPa' },
        { sl: 4, name: 'Rubber Mallet Hammer', effectiveRange: 'N/A' },
      ],
    },
  },
  {
    id: 'cac_odu',
    code: 'CAC-ODU',
    name: 'CAC ODU Assembly Line',
    shortName: 'CAC ODU',
    description: 'Commercial AC Outdoor Unit Compressor, Condenser & Brazing Line',
    icon: '⚡',
    gradient: 'linear-gradient(135deg, #047857 0%, #10B981 100%)',
    borderColor: '#6EE7B7',
    accentColor: '#059669',
    lightBg: '#ECFDF5',
    assignedEngineers: [
      { id: '67544', name: 'Biplob (67544)', role: 'Lead Line Engineer' },
      { id: '58279', name: 'Emon (58279)', role: 'Process Checker' },
    ],
    starterPattern: {
      refPrefix: 'REF-CAC-ODU',
      processName: 'CAC ODU Compressor Installation and Copper Pipe Brazing Process',
      model: 'W-CAC-ODU-36K / 48K / 60K',
      stationLine: 'CAC ODU Line - Brazing Station 04',
      steps: [
        '১) ওডিইউ (ODU) বেস প্যানেলে কম্প্রেসর নির্দিষ্ট রাবার গ্রোমেট ও নাট-বোল্ট সহ স্থাপন করতে হবে।',
        '২) নাইট্রোজেন গ্যাস ফ্লাশিং চালু রেখে সাকশন ও ডিসচার্জ পাইপের জয়েন্টে গ্যাস ব্রেজিং করতে হবে।',
        '৩) ব্রেজিং জয়েন্টটি ঠাণ্ডা হওয়ার পর ভিজা সুতি কাপড় দিয়ে পরিষ্কার করে ফ্লাক্সের অবশিষ্টাংশ দূর করতে হবে।',
        '৪) কনডেন্সার কয়েল ও এক্সপেনশন ভালভ নির্দিষ্ট পাইপলাইনের সাথে সংযোগ দিতে হবে।',
        '৫) হাই প্রেসার নাইট্রোজেন দিয়ে প্রেসার হোল্ড টেস্ট সম্পন্ন করে ডব্লিউকিউএমএস (WQMS) সিস্টেমে বারকোড স্ক্যান করতে হবে।',
      ],
      qualityPoints: [
        '১. ব্রেজিং করার সময় পাইপের ভেতরে কোনো অবস্থাতেই কালো কার্বন বা অক্সিডেশন জমা হওয়া যাবে না।',
        '২. ব্রেজিং রিংয়ে ৩৬০ ডিগ্রি সমানভাবে ফিলার মেটাল গলিয়ে শক্ত লিকেজ-প্রুফ জয়েন্ট নিশ্চিত করতে হবে।',
        '৩. কম্প্রেসর টার্মিনাল কভারে কোনো অতিরিক্ত হিট দেওয়া সম্পূর্ণ নিষিদ্ধ।',
        '৪. প্রেসার ড্রপ টেস্টে প্রেশার নির্ধারিত মানের নিচে নামা যাবে না।',
      ],
      generalInstructions: [
        'গ্যাস সিলিন্ডারের রেগুলেটর প্রেসার চেক করে কাজ শুরু করুন।',
        'অগ্নি নির্বাপক সিলিন্ডার সর্বদা হাতের কাছে প্রস্তুত রাখুন।',
        'ব্রেজিং টর্চ ব্যবহারের সময় ফায়ার শিল্ড ব্যবহার করুন।',
      ],
      safety: {
        instructionText: 'ব্রেজিং করার সময় সেফটি গগলস, লেদার গ্লাভস, ফায়ার রেসিস্ট্যান্ট অ্যাপ্রন এবং সেফটি শু পরিধান বাধ্যতামূলক।',
        earMuff: false,
        gloves: true,
        goggles: true,
        safetyShoes: true,
        mask: true,
      },
      parts: [
        { sl: 1, name: 'Scroll / Rotary Compressor', capacity: '3.0 / 4.0 / 5.0 Ton', gas: 'R410A / R32' },
        { sl: 2, name: 'Condenser Coil Double Row', capacity: 'Multi-Bend', gas: 'N/A' },
        { sl: 3, name: 'Suction & Discharge Copper Tube', capacity: '5/8", 3/8"', gas: 'N/A' },
        { sl: 4, name: 'Electronic Expansion Valve (EEV)', capacity: 'Standard', gas: 'N/A' },
      ],
      tools: [
        { sl: 1, name: 'Oxy-Acetylene / LPG Brazing Torch', effectiveRange: 'Standard Flame' },
        { sl: 2, name: 'Nitrogen Purging Regulator Gauge', effectiveRange: '0.02 - 0.05 MPa' },
        { sl: 3, name: 'Electronic Torque Wrench', effectiveRange: '15 - 35 N.m' },
        { sl: 4, name: 'Pressure Leakage Tester Unit', effectiveRange: '0 - 4.5 MPa' },
      ],
    },
  },
  {
    id: 'rac_idu',
    code: 'RAC-IDU',
    name: 'RAC IDU Assembly Line',
    shortName: 'RAC IDU',
    description: 'Residential Split AC Indoor Unit High-Speed Production Line',
    icon: '❄️',
    gradient: 'linear-gradient(135deg, #0284C7 0%, #38BDF8 100%)',
    borderColor: '#7DD3FC',
    accentColor: '#0284C7',
    lightBg: '#F0F9FF',
    assignedEngineers: [
      { id: '7686', name: 'Jowel (7686)', role: 'Lead Line Engineer' },
      { id: '54634', name: 'Faiyaz (54634)', role: 'Process Checker' },
    ],
    starterPattern: {
      refPrefix: 'REF-RAC-IDU',
      processName: 'RAC IDU Main Body Wiring, Display Sub-Assembly & Packing Process',
      model: 'W-RAC-IDU-12K / 18K / 24K',
      stationLine: 'RAC IDU Line - Main Line Station 03',
      steps: [
        '১) কনভেয়ার বেল্ট থেকে বডি বেস গ্রহণ করে ভিজ্যুয়ালি কোনো স্ক্র্যাচ বা ত্রুটি আছে কিনা দেখতে হবে।',
        '২) ফ্রন্ট প্যানেলে এলইডি (LED) ডিসপ্লে বোর্ড বসিয়ে লকিং ক্লিপ শক্তভাবে লাগাতে হবে।',
        '৩) ড্রেন হোজ পাইপ নির্দিষ্ট স্লটে সঠিকভাবে পুশ করে লক করতে হবে যাতে পানি লিকেজ না হয়।',
        '৪) এয়ার ফিল্টার নেট সঠিক স্লাইডে বসিয়ে কভার লক সাউন্ড নিশ্চিত করতে হবে।',
        '৫) কিউআর (QR) স্টিকার নির্ধারিত স্থানে লাগিয়ে স্ক্যানার দিয়ে স্ক্যান করে প্যাকিং বেল্টে পাঠাতে হবে।',
      ],
      qualityPoints: [
        '১. ফ্রন্ট প্যানেলের জয়েন্টে কোনো ফাঁকা বা আনইভেন গ্যাপ থাকা যাবে না।',
        '২. এলইডি ডিসপ্লে বোর্ডের কানেক্টর পিন সোজা ও অক্ষত থাকতে হবে।',
        '৩. ড্রেন হোজ কোনোভাবেই বাঁকা বা আটকে থাকা যাবে না।',
        '৪. কিউআর কোড স্টিকার সম্পূর্ণ সোজা ও পরিষ্কারভাবে লাগানো থাকতে হবে।',
      ],
      generalInstructions: [
        'হ্যান্ড গ্লাভস পরিষ্কার রাখুন যেন প্লাস্টিক বডিতে কোনো তেলের দাগ না লাগে।',
        'প্যাকিংয়ের আগে বডির উপরিভাগ মাইক্রোফাইবার কাপড় দিয়ে মুছে নিন।',
      ],
      safety: {
        instructionText: 'স্টেশনে নন-স্ট্যাটিক ফ্যাব্রিক গ্লাভস এবং সেফটি শু পরা বাধ্যতামূলক। স্লিপারি ফ্লোরে সাবধানে চলুন।',
        earMuff: false,
        gloves: true,
        goggles: false,
        safetyShoes: true,
        mask: true,
      },
      parts: [
        { sl: 1, name: 'IDU Front Panel Cover', capacity: '1.0 / 1.5 / 2.0 Ton', gas: 'N/A' },
        { sl: 2, name: 'LED Display PCB Module', capacity: 'Digital 7-Segment', gas: 'N/A' },
        { sl: 3, name: 'Anti-Bacterial Air Filter', capacity: 'Standard', gas: 'N/A' },
        { sl: 4, name: 'Flexible Drain Hose', capacity: '16mm Dia', gas: 'N/A' },
      ],
      tools: [
        { sl: 1, name: 'Cordless Electric Screwdriver', effectiveRange: '1.2 - 1.8 N.m' },
        { sl: 2, name: 'Handheld QR Code Reader', effectiveRange: 'Instant Scan' },
        { sl: 3, name: 'Microfiber Cleaning Cloth', effectiveRange: 'Lint-Free' },
      ],
    },
  },
  {
    id: 'rac_odu',
    code: 'RAC-ODU',
    name: 'RAC ODU Assembly Line',
    shortName: 'RAC ODU',
    description: 'Residential Split AC Outdoor Unit Metal Casing, Motor & Piping Assembly',
    icon: '⚙️',
    gradient: 'linear-gradient(135deg, #4F46E5 0%, #818CF8 100%)',
    borderColor: '#A5B4FC',
    accentColor: '#4338CA',
    lightBg: '#EEF2FF',
    assignedEngineers: [
      { id: '56880', name: 'Hashmi (56880)', role: 'Lead Line Engineer' },
      { id: '54636', name: 'Pear (54636)', role: 'Process Checker' },
    ],
    starterPattern: {
      refPrefix: 'REF-RAC-ODU',
      processName: 'RAC ODU Motor, Fan Blade & Partition Plate Assembly Process',
      model: 'W-RAC-ODU-12K / 18K / 24K',
      stationLine: 'RAC ODU Line - Station 05',
      steps: [
        '১) মোটর ব্র্যাকেটে ফ্যান মোটর বসিয়ে ৪টি রাবার ওয়াশার সহ স্ক্রু দিয়ে আটকাতে হবে।',
        '২) এক্সিয়াল ফ্যান ব্লেড মোটর শ্যাফটে নির্দিষ্ট ডেপথ পর্যন্ত পুশ করে নাট টাইট দিতে হবে।',
        '৩) কনডেন্সার সাইড ও কম্প্রেসর সাইডের মধ্যবর্তী পার্টিশন প্লেট স্ক্রু দিয়ে বডিতে আটকাতে হবে।',
        '৪) মোটরের তারগুলো ক্ল্যাম্প দিয়ে পার্টিশন ওয়্যারিং গাইডে সুন্দরভাবে রুট করতে হবে।',
        '৫) হাত দিয়ে ফ্যান ঘুরিয়ে দেখতে হবে ব্লেড কোথাও স্পর্শ করছে কিনা এবং কিউআর কোড স্ক্যান করতে হবে।',
      ],
      qualityPoints: [
        '১. ফ্যান ব্লেড ও শ্রাউড কভারের মধ্যে ক্লিয়ারেন্স সমান (কমপক্ষে ৫ মিমি) হতে হবে।',
        '২. মোটর শ্যাফট নাটের টর্ক টাইটনেস সঠিক স্পেসিফিকেশন অনুযায়ী নিশ্চিত করতে হবে।',
        '৩. মোটরের তার কম্প্রেসরের গরম পাইপের সাথে যেন স্পর্শ না করে সেদিকে বিশেষ নজর দিতে হবে।',
      ],
      generalInstructions: [
        'প্রতিটি ইউনিটে ওয়্যারিং রুট করার পর কেবল টাই দিয়ে লক করুন।',
        'স্ক্রু টাইটনেস চেক করতে মার্কিং পেন ব্যবহার করুন।',
      ],
      safety: {
        instructionText: 'কাটিং এজ থেকে হাত বাঁচাতে হেভি ডিউটি গ্লাভস এবং সেফটি শু ব্যবহার আবশ্যক।',
        earMuff: false,
        gloves: true,
        goggles: false,
        safetyShoes: true,
        mask: true,
      },
      parts: [
        { sl: 1, name: 'ODU Fan Motor AC/BLDC', capacity: '30W / 45W / 65W', gas: 'N/A' },
        { sl: 2, name: 'Axial Fan Blade 3-Leaf', capacity: '400mm / 450mm Dia', gas: 'N/A' },
        { sl: 3, name: 'Metal Partition Plate', capacity: '0.8mm GI Sheet', gas: 'N/A' },
        { sl: 4, name: 'Anti-Vibration Rubber Grommet', capacity: 'High Damping', gas: 'N/A' },
      ],
      tools: [
        { sl: 1, name: 'Preset Torque Socket Wrench', effectiveRange: '4.0 - 6.0 N.m' },
        { sl: 2, name: 'Feeler Clearance Gauge', effectiveRange: '1 - 10 mm' },
        { sl: 3, name: 'Electric Pneumatic Screwdriver', effectiveRange: '2.5 - 3.5 N.m' },
      ],
    },
  },
  {
    id: 'cassette',
    code: 'CAC-CAS',
    name: 'Cassette & Floor Standing Line',
    shortName: 'Cassette / FST',
    description: 'Commercial 4-Way Ceiling Cassette & Floor Standing Units Line',
    icon: '🌀',
    gradient: 'linear-gradient(135deg, #7C3AED 0%, #C026D3 100%)',
    borderColor: '#E879F9',
    accentColor: '#7C3AED',
    lightBg: '#FAF5FF',
    assignedEngineers: [
      { id: '58102', name: 'Abdullah (58102)', role: 'Lead Line Engineer' },
      { id: '52800', name: 'Anam (52800)', role: 'Process Checker' },
    ],
    starterPattern: {
      refPrefix: 'REF-CAC-CAS',
      processName: 'Cassette 4-Way Grille, Drain Pump & Sub-Assembly Process',
      model: 'W-CAS-24K / 36K / 48K / 60K',
      stationLine: 'Cassette Line - Station 03',
      steps: [
        '১) ড্রেইন পাম্প মডিউলটি চেসিসের নির্দিষ্ট ড্রপ লোকেশনে বসিয়ে স্ক্রু দিয়ে ফিক্স করতে হবে।',
        '২) ফ্লোট সুইচ ও সেন্সর ওয়্যারিং সঠিক স্লটে লক করে পুশ ফিট টেস্ট করতে হবে।',
        '৩) ৪-ওয়ে সিলিং গ্রিল ও স্টেপার মোটর অ্যাসেম্বলি ড্রয়িং দেখে নির্ভুলভাবে স্থাপন করতে হবে।',
        '৪) সুইং লাভারের ফ্রি মুভমেন্ট টেস্ট করে কোনো জ্যামিং আছে কিনা নিশ্চিত করতে হবে।',
        '৫) টার্মিনাল ব্লকে কেবল কানেকশন চেক করে কিউআর (QR) স্ক্যানার দিয়ে রেকর্ড আপডেট করতে হবে।',
      ],
      qualityPoints: [
        '১. ড্রেইন পাম্প পাইপ কানেকশন সম্পূর্ণ টাইট ও কোনো বাঁকা ভাঁজ থাকা যাবে না।',
        '২. ৪-ওয়ে সুইং মোটর চলাকালীন কোনো মেকানিক্যাল ঘর্ষণ শব্দ হওয়া যাবে না।',
        '৩. সিলিং গ্রিলের ফোম ইনসুলেশন সম্পূর্ণ অক্ষত ও ফাঁকা-মুক্ত থাকতে হবে।',
      ],
      generalInstructions: [
        'গ্রিলের দৃশ্যমান প্লাস্টিক অংশে ময়লা বা তেলের দাগ লাগতে দেওয়া যাবে না।',
        'প্যাকিং বক্সে অতিরিক্ত ড্রপ টেস্ট চেক করে ডিসপ্যাচ করুন।',
      ],
      safety: {
        instructionText: 'সিলিং গ্রিল সাবধানে হ্যান্ডেল করুন। নন-স্লিপ গ্লাভস ও সেফটি শু পরুন।',
        earMuff: false,
        gloves: true,
        goggles: false,
        safetyShoes: true,
        mask: true,
      },
      parts: [
        { sl: 1, name: '4-Way Air Discharge Grille', capacity: 'Standard 950x950mm', gas: 'N/A' },
        { sl: 2, name: 'Condensate Drain Water Pump', capacity: 'Lift Head 750mm', gas: 'N/A' },
        { sl: 3, name: 'Water Level Float Switch', capacity: 'DC 5V Sensor', gas: 'N/A' },
        { sl: 4, name: 'Centrifugal Turbo Fan Blower', capacity: 'High Static', gas: 'N/A' },
      ],
      tools: [
        { sl: 1, name: 'Electric Torque Screwdriver', effectiveRange: '1.5 - 2.2 N.m' },
        { sl: 2, name: 'Drain Water Flow Simulator', effectiveRange: '500ml Test' },
        { sl: 3, name: 'Digital Multimeter', effectiveRange: '0 - 500V AC/DC' },
      ],
    },
  },
  {
    id: 'sheet_metal',
    code: 'SHT-MET',
    name: 'Sheet Metal & Press Shop',
    shortName: 'Sheet Metal',
    description: 'CNC Punching, Bending, Stamping, and Metal Chassis Fabrication Shop',
    icon: '🏗️',
    gradient: 'linear-gradient(135deg, #B45309 0%, #F59E0B 100%)',
    borderColor: '#FCD34D',
    accentColor: '#B45309',
    lightBg: '#FFFBEB',
    assignedEngineers: [
      { id: '45127', name: 'Rafi (45127)', role: 'Lead Line Engineer' },
      { id: '67544', name: 'Biplob (67544)', role: 'Process Checker' },
    ],
    starterPattern: {
      refPrefix: 'REF-SHT-MET',
      processName: 'ODU Top Cover & Side Panel CNC Bending & Stamping Inspection',
      model: 'All ODU Metal Casings (1.0 - 5.0 Ton)',
      stationLine: 'Press Shop - CNC Bending Cell 02',
      steps: [
        '১) সিএনসি (CNC) কাটিং শিট মেটাল শীট ট্রলি থেকে তুলে বেন্ডিং ডাইসে সঠিকভাবে বসাতে হবে।',
        '২) লেজার সেফটি গার্ড চেক করে বেন্ডিং পেডাল প্রেস করে নির্দিষ্ট অ্যাঙ্গেলে বাঁক সম্পন্ন করতে হবে।',
        '৩) বেন্ডিং অ্যাঙ্গেল ডিজিটাল প্রটেক্টর দিয়ে পরিমাপ করে ৯০০ ডিগ্রি নির্ভুলতা যাচাই করতে হবে।',
        '৪) ড্রয়িং অনুযায়ী স্ক্রু হোল সেন্টার ও ডায়ামিটার ভার্নিয়ার ক্যালিপার দিয়ে পরিমাপ করতে হবে।',
        '৫) পার্টসে কোনো অতিরিক্ত বার বা ধারালো এজ থাকলে গ্রাইন্ডিং করে বক্সে সাজাতে হবে।',
      ],
      qualityPoints: [
        '১. শিট মেটালের বেন্ডিং অ্যাঙ্গেল সহনশীলতা ±০.৫ ডিগ্রির মধ্যে সীমাবদ্ধ থাকতে হবে।',
        '২. কোনো ধরনের স্ক্র্যাচ, ডেন্ট বা ক্র্যাক থাকা সম্পূর্ণ নিষিদ্ধ।',
        '৩. সারফেসে কোনো অতিরিক্ত মেটাল বার (Burr) থাকা যাবে না।',
      ],
      generalInstructions: [
        'মেশিনে হাত দেওয়ার আগে ই-স্টপ ও সেফটি লাইট কার্টেন চেক করুন।',
        'কাটা স্ক্র্যাপ নির্দিষ্ট স্ক্র্যাপ বিনে ফেলুন।',
      ],
      safety: {
        instructionText: 'ধারালো মেটাল শিটের জন্য অ্যান্টি-কাট কেভলার গ্লাভস, সেফটি শু, এবং ইয়ার প্লাগ ব্যবহার বাধ্যতামূলক।',
        earMuff: true,
        gloves: true,
        goggles: true,
        safetyShoes: true,
        mask: false,
      },
      parts: [
        { sl: 1, name: 'Galvanized Steel Sheet (GI)', capacity: '0.8mm - 1.2mm Thk', gas: 'N/A' },
        { sl: 2, name: 'ODU Side Service Panel', capacity: 'Pre-Coated', gas: 'N/A' },
        { sl: 3, name: 'Compressor Mounting Bracket', capacity: '2.0mm Heavy Duty', gas: 'N/A' },
      ],
      tools: [
        { sl: 1, name: 'Digital Vernier Caliper', effectiveRange: '0 - 300 mm' },
        { sl: 2, name: 'Digital Bevel Angle Protector', effectiveRange: '0 - 360 Deg' },
        { sl: 3, name: 'Sheet Metal Deburring Tool', effectiveRange: 'Manual' },
      ],
    },
  },
  {
    id: 'heat_exchanger',
    code: 'HEX-PIP',
    name: 'Heat Exchanger & Piping',
    shortName: 'HEX & Piping',
    description: 'Condenser, Evaporator Coils, Hairpin Bending & Copper Header Brazing',
    icon: '🧪',
    gradient: 'linear-gradient(135deg, #0D9488 0%, #14B8A6 100%)',
    borderColor: '#99F6E4',
    accentColor: '#0F766E',
    lightBg: '#F0FDFA',
    assignedEngineers: [
      { id: '58279', name: 'Emon (58279)', role: 'Lead Line Engineer' },
      { id: '54636', name: 'Pear (54636)', role: 'Process Checker' },
    ],
    starterPattern: {
      refPrefix: 'REF-HEX-PIP',
      processName: 'Condenser Coil Hairpin Expansion & Return Bend Automatic Brazing',
      model: 'HEX Condenser 1.5T / 2.0T Gold Fin',
      stationLine: 'Heat Exchanger - Auto Brazing Station 01',
      steps: [
        '১) পাঞ্চড অ্যালুমিনিয়াম ফিন ব্লকে ইউ-হেয়ারপিন কপার টিউব সঠিকভাবে ইনসার্ট করতে হবে।',
        '২) ভার্টিক্যাল মেকানিক্যাল টিউব এক্সপান্ডারে কয়েল সেট করে এক্সপানশন সাইকেল রান করতে হবে।',
        '৩) রিটার্ন বেন্ডগুলোতে অটোমেটিক ফ্ল্যাক্সিং করে গ্যাস ব্রেজিং রিং স্থাপন করতে হবে।',
        '৪) কনভেয়ার অটোমেটিক ফ্লেমে ব্রেজিং সম্পন্ন করে কুলিং জোনে পাঠাতে হবে।',
        '৫) আন্ডার ওয়াটার হিলিয়াম অথবা ৩.৫ মেগাপ্যাসকেল নাইট্রোজেন টেস্ট ট্যাংকে লিকেজ পরীক্ষা করতে হবে।',
      ],
      qualityPoints: [
        '১. কপার টিউব এক্সপানশনের পর ফিনের সাথে ১০০% টাইট কনট্যাক্ট নিশ্চিত করতে হবে।',
        '২. পানির নিচে ১ মিনিট ডুবিয়ে রেখে কোনো ধরনের এয়ার বাবল লিকেজ থাকা যাবে না।',
        '৩. গোল্ড ফিনের হাইড্রোফিলিক লেয়ার অক্ষত থাকতে হবে।',
      ],
      generalInstructions: [
        'এক্সপান্ডার রডের লুব্রিকেশন লেভেল প্রতি শিফটে চেক করুন।',
        'টেস্ট ট্যাংকের পানির স্বচ্ছতা সর্বদা বজায় রাখুন।',
      ],
      safety: {
        instructionText: 'উচ্চচাপ নাইট্রোজেন ব্যবহারের সময় প্রেসার গেজ মনিটর করুন। সেফটি গগলস ও গ্লাভস পরুন।',
        earMuff: true,
        gloves: true,
        goggles: true,
        safetyShoes: true,
        mask: false,
      },
      parts: [
        { sl: 1, name: 'Inner Grooved Copper Tube', capacity: '7mm / 9.52mm Dia', gas: 'N/A' },
        { sl: 2, name: 'Hydrophilic Aluminum Fin Foil', capacity: '0.095mm Thk Gold Fin', gas: 'N/A' },
        { sl: 3, name: 'Copper Return U-Bends', capacity: 'Phosphorus Deoxidized', gas: 'N/A' },
      ],
      tools: [
        { sl: 1, name: 'Vertical Tube Mechanical Expander', effectiveRange: 'Multi-Spindle' },
        { sl: 2, name: 'Underwater High-Pressure Leak Test Tank', effectiveRange: '0 - 4.0 MPa' },
        { sl: 3, name: 'Optical Inspection Magnifier', effectiveRange: '10x Zoom' },
      ],
    },
  },
  {
    id: 'electrical_pcb',
    code: 'ELE-PCB',
    name: 'Electrical Control & Testing',
    shortName: 'Electrical / WQMS',
    description: 'Inverter Driver Boards, Harnessing, Hi-Pot & Electrical Testing',
    icon: '🔌',
    gradient: 'linear-gradient(135deg, #4338CA 0%, #6366F1 100%)',
    borderColor: '#C7D2FE',
    accentColor: '#4338CA',
    lightBg: '#EEF2FF',
    assignedEngineers: [
      { id: '52800', name: 'Anam (52800)', role: 'Lead Line Engineer' },
      { id: '50463', name: 'Sazzad (50463)', role: 'Supervisor & Automation Lead' },
    ],
    starterPattern: {
      refPrefix: 'REF-ELE-PCB',
      processName: 'Inverter PCB Box Assembly, Grounding & High-Voltage Withstand Test',
      model: 'All Inverter AC Models (Smart / Non-Smart)',
      stationLine: 'Electrical Testing - Station 04',
      steps: [
        '১) মেটাল ইলেকট্রিক্যাল বক্সে পিসিবি (PCB) বেস ব্র্যাকেটে বসিয়ে প্লাস্টিক স্ন্যাপ রিভেট দিয়ে আটকাতে হবে।',
        '২) পাওয়ার কেবল, রিঅ্যাক্টর এবং কম্প্রেসর ইউ-ভি-ডব্লিউ (U-V-W) টার্মিনাল নির্দিষ্ট স্ক্রু দিয়ে আটকাতে হবে।',
        '৩) গ্রাউন্ড ওয়্যার (হলুদ-সবুজ তার) মেটাল চেসিসে স্ক্রু ও টুথ ওয়াশার দিয়ে শক্ত করে টাইট দিতে হবে।',
        '৪) হাই-পট (Hi-Pot) ও গ্রাউন্ড কন্টিনিউটি টেস্টারে কানেক্ট করে ১৫০০ ভোল্ট টেস্ট পাস করতে হবে।',
        '৫) ডব্লিউকিউএমএস (WQMS) সফটওয়্যারে বারকোড স্ক্যান করে অনলাইন ডাটাবেজে টেস্ট রেজাল্ট আপলোড করতে হবে।',
      ],
      qualityPoints: [
        '১. গ্রাউন্ডিং রেজিস্ট্যান্সের মান অবশ্যই ০.১ ওহম (০.১ Ω)-এর নিচে হতে হবে।',
        '২. ইনসুলেশন রেজিস্ট্যান্সের মান ৫০০ ভোল্ট মেগারে ৫০ মেগাওহম (৫০ MΩ)-এর বেশি হতে হবে।',
        '৩. কোনো তারের ইনসুলেশন কাটা বা মেটাল এজের সাথে ঘষা লাগা যাবে না।',
        '৪. ডব্লিউকিউএমএস (WQMS) টেস্ট রেজাল্ট ১০০% পাস (PASS) স্ট্যাটাস নিশ্চিত হতে হবে।',
      ],
      generalInstructions: [
        'টেস্ট বেঞ্চে অ্যান্টি-স্ট্যাটিক রিস্টব্যান্ড পরিধান বাধ্যতামূলক।',
        'টেস্টারের কোনো প্রব হাত দিয়ে স্পর্শ করবেন না যখন হাই ভোল্টেজ একটিভ থাকে।',
      ],
      safety: {
        instructionText: 'উচ্চ ভোল্টেজ পরীক্ষা কেন্দ্রে সাবধানে থাকুন। ইনসুলেটিং শু ও রাবার ম্যাট ব্যবহার করুন।',
        earMuff: false,
        gloves: true,
        goggles: false,
        safetyShoes: true,
        mask: false,
      },
      parts: [
        { sl: 1, name: 'Inverter Main PCB Board', capacity: 'IGBT Driver IPM Module', gas: 'N/A' },
        { sl: 2, name: 'Reactor PFC Coil', capacity: '15mH / 20A', gas: 'N/A' },
        { sl: 3, name: 'Grounding Earth Wire', capacity: '1.5 sq mm Yellow-Green', gas: 'N/A' },
      ],
      tools: [
        { sl: 1, name: 'Comprehensive Electrical Safety Tester', effectiveRange: 'Hi-Pot 1500V, Earth 25A' },
        { sl: 2, name: 'Insulation Resistance Megger Meter', effectiveRange: '500V DC / 1000MΩ' },
        { sl: 3, name: 'WQMS Network Scanner & Barcode Reader', effectiveRange: 'Automatic Log' },
      ],
    },
  },
  {
    id: 'jigs_tooling',
    code: 'JIG-TOOL',
    name: 'Tooling, Jigs & Fixtures',
    shortName: 'Jigs & Tooling',
    description: 'Assembly Fixtures, Pneumatic Clamps, Poka-Yoke & Line Automation Fixtures',
    icon: '🔧',
    gradient: 'linear-gradient(135deg, #9333EA 0%, #A855F7 100%)',
    borderColor: '#D8B4FE',
    accentColor: '#9333EA',
    lightBg: '#FAF5FF',
    assignedEngineers: [
      { id: '54634', name: 'Faiyaz (54634)', role: 'Lead Line Engineer' },
      { id: '56880', name: 'Hashmi (56880)', role: 'Process Checker' },
    ],
    starterPattern: {
      refPrefix: 'REF-JIG-TOOL',
      processName: 'ODU Fan Motor Bracket Alignment Fixture Setting and Maintenance',
      model: 'All ODU Production Fixtures',
      stationLine: 'Jig Fabrication & Calibration Room',
      steps: [
        '১) মোটর ব্র্যাকেটের ড্রয়িং অনুসারে ফিক্সচারের বেস পিন ও ক্ল্যাম্পিং প্যাড পরীক্ষা করতে হবে।',
        '২) ডায়াল ইন্ডিকেটর দিয়ে ফিক্সচারের রেফারেন্স ফ্ল্যাটনেস ও সেন্টার অ্যালাইনমেন্ট চেক করতে হবে।',
        '৩) নিউমেটিক সিলিন্ডারের এয়ার প্রেসার ০.৫ মেগাপ্যাসকেলে সেট করে ক্ল্যাম্পিং ফোর্স পরীক্ষা করতে হবে।',
        '৪) স্যাম্পল পার্টস বসিয়ে পোকা-ইয়োকে (Poka-Yoke) সেন্সর সঠিক পজিশনে ডিটেক্ট করছে কিনা দেখতে হবে।',
        '৫) ক্যালিব্রেশন স্টিকার লাগিয়ে টুলিং রিলিজ ফর্মে সাইন করে প্রোডাকশন লাইনে হস্তান্তর করতে হবে।',
      ],
      qualityPoints: [
        '১. ফিক্সচারের লোকেটিং পিনের ক্ষয়জনিত টলারেন্স ০.০২ মিমি-এর মধ্যে থাকতে হবে।',
        '২. পোকা-ইয়োকে (Poka-Yoke) সেন্সর ভুল পার্টস দিলে তাৎক্ষণিক লাইন স্টপ সিগন্যাল দিতে হবে।',
        '৩. ক্ল্যাম্পিং প্যাডে পার্টসে কোনো ডেন্ট যাতে না পড়ে সেজন্য নাইলন প্যাড ব্যবহার করতে হবে।',
      ],
      generalInstructions: [
        'প্রতি সপ্তাহে স্লাইডিং পার্টসে লুব্রিকেশন অয়েল দিন।',
        'ক্যালিব্রেশন মেয়াদ শেষ হওয়ার আগে রিক্যালিব্রেট করুন।',
      ],
      safety: {
        instructionText: 'মেশিনিং ও ফিটিং কাজের সময় সেফটি চশমা এবং সেফটি শু পরা আবশ্যক।',
        earMuff: false,
        gloves: true,
        goggles: true,
        safetyShoes: true,
        mask: false,
      },
      parts: [
        { sl: 1, name: 'Precision Locating Pin', capacity: 'Hardened Steel HRC58', gas: 'N/A' },
        { sl: 2, name: 'Pneumatic Swing Clamp Cylinder', capacity: 'Bore 32mm / 40mm', gas: 'N/A' },
        { sl: 3, name: 'Photoelectric Poka-Yoke Sensor', capacity: 'Infrared NPN', gas: 'N/A' },
      ],
      tools: [
        { sl: 1, name: 'Magnetic Base Dial Indicator Gauge', effectiveRange: '0 - 10 mm / 0.01mm' },
        { sl: 2, name: 'Air Pressure Regulator with Filter', effectiveRange: '0 - 1.0 MPa' },
        { sl: 3, name: 'Hexagon Allen Key Set', effectiveRange: '1.5 - 10 mm' },
      ],
    },
  },
  {
    id: 'packaging_qa',
    code: 'PKG-QA',
    name: 'Final Inspection & Packaging',
    shortName: 'Packaging & QA',
    description: 'Final Product Appearance Audit, Accessory Bag, Carton Box & Strapping',
    icon: '📦',
    gradient: 'linear-gradient(135deg, #EA580C 0%, #FB923C 100%)',
    borderColor: '#FDBA74',
    accentColor: '#C2410C',
    lightBg: '#FFF7ED',
    assignedEngineers: [
      { id: '54636', name: 'Pear (54636)', role: 'Lead Line Engineer' },
      { id: '54150', name: 'Dev (54150)', role: 'Process Checker' },
    ],
    starterPattern: {
      refPrefix: 'REF-PKG-QA',
      processName: 'AC Unit Final Cosmetic Audit, Carton Box Packing & Automatic Strapping',
      model: 'All Walton AC Series (Residential & Commercial)',
      stationLine: 'Final Packing Line - End Station',
      steps: [
        '১) ইউনিটের চারপাশের প্লাস্টিক বডি ও মেটাল কেসিংয়ে কোনো দাগ, স্ক্র্যাচ বা স্ক্রু মিসিং আছে কিনা দেখতে হবে।',
        '২) রিমোট কন্ট্রোলার, ইউজার ম্যানুয়াল, ড্রেন হোজ এবং ওয়ারেন্টি কার্ড সহ এক্সেসরিজ ব্যাগ বক্সে রাখতে হবে।',
        '৩) পলিব্যাগ ও ইপিএস (EPS) থার্মোকোল কুশন দিয়ে ইউনিটের উভয় পাশ সঠিকভাবে কভার করতে হবে।',
        '৪) কার্টন বক্সে ইউনিট ইনসার্ট করে উপরের ফ্ল্যাপ টেপিং মেশিন দিয়ে নির্দিষ্ট টেনশনে সিল করতে হবে।',
        '৫) কিউআর (QR) বারকোড স্ক্যানার দিয়ে ফাইনাল স্ক্যানিং করে ডব্লিউকিউএমএস (WQMS) ইনভেন্টরিতে যুক্ত করতে হবে এবং স্ট্র্যাপিং করতে হবে।',
      ],
      qualityPoints: [
        '১. কার্টন বক্সের বাইরের মডেল ও সিরিয়াল নাম্বার লেবেল ইউনিটের কিউআর কোডের সাথে ১০০% মিলতে হবে।',
        '২. এক্সেসরিজ ব্যাগের প্রতিটি আইটেম চেকলিস্ট মিলিয়ে নিশ্চিত হতে হবে।',
        '৩. স্ট্র্যাপিং বেল্ট খুব বেশি ঢিলে বা বক্স ড্যামেজ হওয়ার মতো অতিরিক্ত টাইট হওয়া যাবে না।',
        '৪. ডব্লিউকিউএমএস (WQMS) সিস্টেমে স্ট্যাটাস কমপ্লিট (COMPLETE) না হওয়া পর্যন্ত ডিসপ্যাচ করা যাবে না।',
      ],
      generalInstructions: [
        'বক্স হ্যান্ডলিংয়ের সময় ড্রপ বা আছাড় দেওয়া সম্পূর্ণ নিষিদ্ধ।',
        'প্যাকিং টেপের প্রান্ত সোজা ও সমানভাবে বসান।',
      ],
      safety: {
        instructionText: 'ভারী কার্টন তোলার সময় পিঠ সোজা রেখে হাঁটুর ওপর ভর দিন। সেফটি শু পরুন।',
        earMuff: false,
        gloves: true,
        goggles: false,
        safetyShoes: true,
        mask: true,
      },
      parts: [
        { sl: 1, name: 'Heavy Duty 5-Ply Corrugated Carton Box', capacity: 'Drop Resistance', gas: 'N/A' },
        { sl: 2, name: 'EPS Molded Foam Cushion Left/Right', capacity: 'High Density Shock Absorb', gas: 'N/A' },
        { sl: 3, name: 'Accessory Kit (Remote, Manual, Batt)', capacity: 'Standard Pack', gas: 'N/A' },
      ],
      tools: [
        { sl: 1, name: 'Automatic Carton Sealing Machine', effectiveRange: 'BOPP Tape 60mm' },
        { sl: 2, name: 'Semi-Automatic PP Box Strapping Machine', effectiveRange: 'Tension 15-45kg' },
        { sl: 3, name: 'Wireless Industrial Barcode Terminal', effectiveRange: 'Long-Range 2D' },
      ],
    },
  },
];

export function getAllConcerns(): ProcessConcern[] {
  return PROCESS_CONCERNS;
}

export function getConcernById(id: string): ProcessConcern | undefined {
  if (!id) return undefined;
  const clean = id.toLowerCase().trim();
  return PROCESS_CONCERNS.find(
    (c) =>
      c.id.toLowerCase() === clean ||
      c.code.toLowerCase() === clean ||
      c.name.toLowerCase().includes(clean)
  );
}

export function getConcernForUser(user: UserProfile | null): ProcessConcern {
  if (!user) return PROCESS_CONCERNS[0];
  // If user has explicit concernId
  if (user.concernId) {
    const found = getConcernById(user.concernId);
    if (found) return found;
  }

  // Check matching assigned engineers by ID or username
  const cleanId = String(user.employeeId || user.id);
  const foundByAssigned = PROCESS_CONCERNS.find((c) =>
    c.assignedEngineers.some(
      (eng) => eng.id === cleanId || eng.name.toLowerCase().includes(user.username.toLowerCase())
    )
  );
  if (foundByAssigned) return foundByAssigned;

  // Fallback to first concern (CAC IDU)
  return PROCESS_CONCERNS[0];
}

export function createStarterSOPForConcern(
  concernId: string,
  user: UserProfile | null
): SOPDocument {
  const concern = getConcernById(concernId) || PROCESS_CONCERNS[0];
  const dateStr = new Date().toISOString().split('T')[0];
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  const refNo = `${concern.starterPattern.refPrefix}-${randomSuffix}`;

  const userName = user?.name || user?.username || 'Process Engineer';
  const userDesig = user?.designation || 'Process Engineer';
  const userDept = user?.department || 'Process Development';

  return {
    id: `sop_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    status: 'draft',
    authorId: user?.id || 'Dev',
    authorName: userName,
    concernId: concern.id,
    concernName: concern.name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    header: {
      companyName: 'WALTON HI-TECH INDUSTRIES PLC',
      processName: concern.starterPattern.processName,
      model: concern.starterPattern.model,
      stationLine: concern.starterPattern.stationLine,
      referenceNo: refNo,
      effectiveDate: dateStr,
      revisionNo: '00',
      reasonOfChanges: 'Initial Release with Section Standard Pattern',
      formatRefNo: 'WHIPLC/AC/PD/SOP/01',
      preparedBy: {
        name: userName,
        designation: userDesig,
        dept: userDept,
        date: dateStr,
        signatureImg: user?.defaultSignatureImg,
      },
      checkedBy: {
        name: concern.assignedEngineers[1]?.name || 'Engr. Sazzad Mahmud (50463)',
        designation: 'Process Checker / Section In-Charge',
      },
      approvedBy: {
        name: 'Engr. Kamrul Hasan (44819)',
        designation: 'HOD / Lead Engineer',
      },
    },
    photos: [],
    procedure: {
      banglishInput: '',
      qualityBanglishInput: '',
      steps: [...concern.starterPattern.steps],
      qualityPoints: [...concern.starterPattern.qualityPoints],
      generalInstructions: [...concern.starterPattern.generalInstructions],
    },
    safety: {
      ...concern.starterPattern.safety,
    },
    parts: concern.starterPattern.parts.map((p, idx) => ({ ...p, sl: idx + 1 })),
    tools: concern.starterPattern.tools.map((t, idx) => ({ ...t, sl: idx + 1 })),
    imageFit: 'contain',
    gridCols: 3,
    stepFontSize: 'normal',
    qualityFontSize: 'normal',
    auditTrail: [
      {
        id: `audit_${Date.now()}`,
        action: 'create',
        performedBy: user?.username || 'user',
        performedByName: userName,
        role: user?.role || 'prepared_by',
        timestamp: new Date().toISOString(),
        note: `SOP initialized using ${concern.name} starter pattern`,
      },
    ],
  };
}
