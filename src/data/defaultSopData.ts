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

export const defaultSopData: SOPDocument = {
  header: {
    companyName: 'Walton Hi-Tech Industries PLC.',
    logoUrl: '/walton-logo.png',
    processName: '',
    model: '',
    stationLine: '',
    referenceNo: '',
    effectiveDate: new Date().toISOString().split('T')[0],
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
  photos: [],
  procedure: {
    banglishInput: '',
    qualityBanglishInput: '',
    steps: [], // কার্যপ্রণালী সম্পূর্ণ ফাঁকা
    qualityPoints: [
      '১) পার্টস সংযোজনের পূর্বে কোনো ধরনের স্ক্র্যাচ, বাঁকা বা দৃশ্যমান ত্রুটি আছে কিনা যাচাই করুন।',
      '২) নির্দিষ্ট মডেল ড্রয়িং ও স্ট্যান্ডার্ড টর্ক অনুযায়ী স্ক্রু বা যন্ত্রাংশ সঠিকভাবে অ্যাসেম্বল করুন।',
      '৩) অ্যাসেম্বলির সময় কোনো অতিরিক্ত বল বা ভুল অ্যালাইনমেন্ট পরিহার করে প্রসেস মান বজায় রাখুন।',
    ],
    generalInstructions: [
      '১) কাজের শুরুতে ও শেষে কর্মক্ষেত্র সম্পূর্ণ পরিষ্কার ও পরিচ্ছন্ন রাখুন (5S স্ট্যান্ডার্ড বজায় রাখুন)।',
      '২) লাইন সুপারভাইজার ও প্রসেস নির্দেশিকা অনুযায়ী পার্টস ট্রে ও হ্যান্ডেলিং সরঞ্জামাদি ব্যবহার করুন।',
      '৩) কোনো অস্বাভাবিক শব্দ বা গুণগত সমস্যা দেখা দিলে অবিলম্বে সংশ্লিষ্ট লাইন ইন-চার্জকে অবগত করুন।',
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
  ],
  tools: [
    { sl: 1, name: '', effectiveRange: '' },
    { sl: 2, name: '', effectiveRange: '' },
    { sl: 3, name: '', effectiveRange: '' },
  ],
  stepFontSize: 'auto',
  qualityFontSize: 'auto',
};
