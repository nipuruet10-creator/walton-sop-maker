import type { SOPDocument } from '../types/sop';

export const BENGALI_NUMERALS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export function toBengaliNumber(num: number): string {
  return num
    .toString()
    .split('')
    .map(digit => {
      const n = parseInt(digit, 10);
      return isNaN(n) ? digit : BENGALI_NUMERALS[n];
    })
    .join('');
}

import { offlineSampleImages } from './sampleImages';

// Offline sample images matching Walton SOP demo
const sampleImages = offlineSampleImages;

export const defaultSopData: SOPDocument = {
  header: {
    companyName: 'Walton Hi-Tech Industries PLC.',
    logoUrl: '/walton-logo.png',
    processName: 'BOPP Tape Attaching Working Procedure on Cassette IDU',
    model: 'All Cassette IDU',
    stationLine: 'CAC IDU Assembly Line',
    referenceNo: 'ACP17HtSpA0032',
    effectiveDate: '11/17/2024',
    revisionNo: '0',
    reasonOfChanges: '',
    formatRefNo: 'ACP17HtSpA0001 Rev: 00',
    preparedBy: {
      name: '',
      designation: '',
      dept: '',
      date: '',
      signatureImg: '',
    },
    checkedBy: {
      name: '',
      designation: '',
    },
    approvedBy: {
      name: '',
      designation: '',
    },
  },
  imageFit: 'contain',
  gridCols: 0, // 0 means auto
  photos: sampleImages.map((url, idx) => ({
    id: `photo-${idx + 1}`,
    url,
    label: `চিত্র-${toBengaliNumber(idx + 1)}`,
    name: `Step photo ${idx + 1}`,
  })),
  procedure: {
    banglishInput: `1) prothome Packaging Tape Dispenser theke 200 mm lomba BOPP tape kete nite hobe. sothik vabe lagay nite hobe.
2) Cassette indoor cartoon er chihnito sthane shothikbhabe tepti boshate hobe (chobi-1).
3) indoor cartoon er every ta taping jaygay ek layer BOPP tape use korte hobe (chobi-2).
4) chobi-3 onujayi Cassette indoor cartoon er nicher dike BOPP tape use korte hobe.
5) chobi-4 e dekhano onujayi, cartoon er ubhoy pashe 4 ti kore mot 8 ti nirdishto sthane BOPP tape use korte hobe.
6) chobi-5 onusare PET belt machine e 3 setting kore cartoone shothikbabe belt dite hobe.`,
    qualityBanglishInput: `1) belt laganor somoy nissit korte hobe jate cartoon chire na jay (chobi-6).
2) tape boshonor somoy kheyal rakhte hobe, jate tape baka na hoy ebong sojasuji thake.
3) protiti jaygay 1 layer tape shothikbhabe deya hoyese kina check korte hobe.`,
    steps: [
      '১) প্রথমে প্যাকেজিং টেপ ডিসপেনসার থেকে ২০০ মিলিমিটার লম্বা BOPP টেপ কেটে নিতে হবে। সঠিকভাবে লাগিয়ে নিতে হবে।',
      '২) ক্যাসেট ইনডোর কার্টুনের চিহ্নিত স্থানে সঠিকভাবে টেপটি বসাতে হবে (চিত্র-১)।',
      '৩) ইনডোর কার্টুনের প্রতিটি টেপিং স্থানে এক লেয়ার BOPP টেপ ব্যবহার করতে হবে (চিত্র-২)।',
      '৪) চিত্র-৩ অনুযায়ী ক্যাসেট ইনডোর কার্টুনের নিচের দিকে BOPP টেপ ব্যবহার করতে হবে।',
      '৫) চিত্র-৪ এ দেখানো অনুযায়ী, কার্টুনের উভয় পাশে ৪টি করে মোট ৮টি নির্দিষ্ট স্থানে BOPP টেপ ব্যবহার করতে হবে।',
      '৬) চিত্র-৫ অনুসারে পেট বেল্ট মেশিনে ৩ সেটিং করে কার্টুনে সঠিকভাবে বেল্ট দিতে হবে।',
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
  },
  safety: {
    instructionText: 'সব সময় নিরাপত্তা নির্দেশনাবলী অনুযায়ী জুতা, চশমা, শব্দ প্রতিরোধক যন্ত্র, হাত মোজা (গ্লোভস) পরে থাকতে হবে।',
    earMuff: false,
    gloves: true,
    goggles: false,
    safetyShoes: true,
    mask: false,
  },
  parts: [
    { sl: 1, name: '', capacity: '', gas: '' },
    { sl: 2, name: '', capacity: '', gas: '' },
    { sl: 3, name: '', capacity: '', gas: '' },
    { sl: 4, name: '', capacity: '', gas: '' },
    { sl: 5, name: '', capacity: '', gas: '' },
    { sl: 6, name: '', capacity: '', gas: '' },
    { sl: 7, name: '', capacity: '', gas: '' },
  ],
  tools: [
    { sl: 1, name: '', effectiveRange: '' },
    { sl: 2, name: '', effectiveRange: '' },
    { sl: 3, name: '', effectiveRange: '' },
    { sl: 4, name: '', effectiveRange: '' },
    { sl: 5, name: '', effectiveRange: '' },
    { sl: 6, name: '', effectiveRange: '' },
  ],
};
