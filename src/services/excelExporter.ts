import * as XLSX from 'xlsx';
import type { SOPDocument } from '../types/sop';
import { toBengaliNumber } from '../data/defaultSopData';

export function exportSOPToExcel(data: SOPDocument) {
  const wb = XLSX.utils.book_new();

  // Grid sizing:
  // Cols A-D (0-3): Left Column (Photos, Parts)
  // Col E (4): Space / Gap Divider
  // Cols F-I (5-8): Right Column (Procedure, Quality Points, General Instructions, Safety, Tools)

  const maxRows = 45;
  const grid: any[][] = Array.from({ length: maxRows }, () => Array(9).fill(''));
  const merges: XLSX.Range[] = [];

  const addMerge = (sR: number, sC: number, eR: number, eC: number) => {
    merges.push({ s: { r: sR, c: sC }, e: { r: eR, c: eC } });
  };

  // 1. HEADER SECTION (Rows 0-5)
  // Row 0: Company Header & Station Info
  grid[0][0] = 'WALTON HI-TECH INDUSTRIES PLC.';
  addMerge(0, 0, 0, 3);
  grid[0][5] = 'Station / Line:';
  grid[0][6] = data.header.stationLine;
  addMerge(0, 6, 0, 7);
  grid[0][8] = `Rev: ${data.header.revisionNo}`;

  // Row 1: Document Subtitle & Ref No
  grid[1][0] = 'STANDARD OPERATING PROCEDURE (SOP) / কার্যপ্রণালী';
  addMerge(1, 0, 1, 3);
  grid[1][5] = 'Reference No:';
  grid[1][6] = data.header.referenceNo;
  addMerge(1, 6, 1, 7);
  grid[1][8] = `Date: ${data.header.effectiveDate}`;

  // Row 2: Process Name & Prepared By
  grid[2][0] = 'Process Name:';
  grid[2][1] = data.header.processName;
  addMerge(2, 1, 2, 3);
  grid[2][5] = 'Prepared By:';
  grid[2][6] = data.header.preparedBy.name ? `${data.header.preparedBy.name} (${data.header.preparedBy.designation || 'Engineer'})` : 'N/A';
  addMerge(2, 6, 2, 8);

  // Row 3: Model & Checked / Approved
  grid[3][0] = 'Model:';
  grid[3][1] = data.header.model;
  addMerge(3, 1, 3, 3);
  grid[3][5] = 'Approved By:';
  grid[3][6] = data.header.approvedBy.name || 'Pending Approval';
  addMerge(3, 6, 3, 8);

  // Row 4: Format Ref & Reason of Changes
  grid[4][0] = 'Format Ref. No:';
  grid[4][1] = data.header.formatRefNo;
  addMerge(4, 1, 4, 3);
  grid[4][5] = 'Reason of Changes:';
  grid[4][6] = data.header.reasonOfChanges || 'Initial Release / Standard Production';
  addMerge(4, 6, 4, 8);

  // Row 5: Empty separator
  grid[5][0] = '------------------------------------------------------------';
  addMerge(5, 0, 5, 3);
  grid[5][5] = '------------------------------------------------------------';
  addMerge(5, 5, 5, 8);

  // 2. MAIN SECTION HEADERS (Row 6)
  grid[6][0] = '📷 Photograph / Sketch / Demo View (If Required - Must be Clear)';
  addMerge(6, 0, 6, 3);
  grid[6][5] = '📋 কার্যপ্রণালী (WORK PROCEDURE)';
  addMerge(6, 5, 6, 8);

  // 3. MIDDLE BODY (Row 7+)
  // LEFT SIDE: Photo Layout Grid
  const photos = data.photos;
  let leftRow = 7;
  for (let i = 0; i < photos.length; i += 2) {
    const p1 = photos[i];
    const p2 = photos[i + 1];

    grid[leftRow][0] = `[${p1.label || `চিত্র-${toBengaliNumber(i + 1)}`}] ${p1.name || `Photo ${i + 1}`}`;
    addMerge(leftRow, 0, leftRow, 1);

    if (p2) {
      grid[leftRow][2] = `[${p2.label || `চিত্র-${toBengaliNumber(i + 2)}`}] ${p2.name || `Photo ${i + 2}`}`;
      addMerge(leftRow, 2, leftRow, 3);
    }
    leftRow++;

    grid[leftRow][0] = '(ছবি সংযুক্ত থাকবে)';
    addMerge(leftRow, 0, leftRow, 1);
    if (p2) {
      grid[leftRow][2] = '(ছবি সংযুক্ত থাকবে)';
      addMerge(leftRow, 2, leftRow, 3);
    }
    leftRow += 2;
  }

  // RIGHT SIDE: Procedure Steps, Quality Points, General Instructions
  let rightRow = 7;
  data.procedure.steps.forEach((step, idx) => {
    grid[rightRow][5] = `${toBengaliNumber(idx + 1)})`;
    grid[rightRow][6] = step.replace(/^([০-৯\d]+[\)\.\-:]\s*)/, '');
    addMerge(rightRow, 6, rightRow, 8);
    rightRow++;
  });

  // Critical Quality Points
  rightRow++;
  grid[rightRow][5] = '⭐ লক্ষণীয় বিষয় (CRITICAL QUALITY POINTS)';
  addMerge(rightRow, 5, rightRow, 8);
  rightRow++;

  data.procedure.qualityPoints.forEach((point, idx) => {
    grid[rightRow][5] = `${toBengaliNumber(idx + 1)})`;
    grid[rightRow][6] = point.replace(/^([০-৯\d]+[\)\.\-:]\s*)/, '');
    addMerge(rightRow, 6, rightRow, 8);
    rightRow++;
  });

  // General Instructions
  rightRow++;
  grid[rightRow][5] = '📌 সাধারণ নির্দেশনা (GENERAL INSTRUCTIONS)';
  addMerge(rightRow, 5, rightRow, 8);
  rightRow++;

  data.procedure.generalInstructions.forEach((inst, idx) => {
    grid[rightRow][5] = `${toBengaliNumber(idx + 1)})`;
    grid[rightRow][6] = inst.replace(/^([০-৯\d]+[\)\.\-:]\s*)/, '');
    addMerge(rightRow, 6, rightRow, 8);
    rightRow++;
  });

  // 4. BOTTOM SECTION: Parts (Left) & Safety / Tools (Right)
  const bottomStart = Math.max(leftRow + 1, rightRow + 1);

  // Left Bottom: Parts Table
  grid[bottomStart][0] = '📦 PARTS & MATERIALS';
  addMerge(bottomStart, 0, bottomStart, 3);

  // Right Bottom: Safety Instructions
  grid[bottomStart][5] = '🛡️ SAFETY INSTRUCTION & PPE';
  addMerge(bottomStart, 5, bottomStart, 8);

  // Row bottomStart + 1
  grid[bottomStart + 1][0] = 'SL';
  grid[bottomStart + 1][1] = 'Parts Name';
  grid[bottomStart + 1][2] = 'Capacity(BTU)';
  grid[bottomStart + 1][3] = 'Gas';

  const ppeList = [
    `Ear Muff: ${data.safety.earMuff ? 'YES' : 'NO'}`,
    `Hand Gloves: ${data.safety.gloves ? 'YES' : 'NO'}`,
    `Goggles: ${data.safety.goggles ? 'YES' : 'NO'}`,
    `Safety Shoes: ${data.safety.safetyShoes ? 'YES' : 'NO'}`,
    `Mask: ${data.safety.mask ? 'YES' : 'NO'}`,
  ].join('  |  ');
  grid[bottomStart + 1][5] = ppeList;
  addMerge(bottomStart + 1, 5, bottomStart + 1, 8);

  // Safety directive text
  grid[bottomStart + 2][5] = `Directive: ${data.safety.instructionText}`;
  addMerge(bottomStart + 2, 5, bottomStart + 2, 8);

  // Tools Table Header on Right
  grid[bottomStart + 3][5] = '🔧 TOOLS & EQUIPMENTS';
  addMerge(bottomStart + 3, 5, bottomStart + 3, 8);

  grid[bottomStart + 4][5] = 'SL';
  grid[bottomStart + 4][6] = 'Tool / Equipment Name';
  addMerge(bottomStart + 4, 6, bottomStart + 4, 7);
  grid[bottomStart + 4][8] = 'Effective Range';

  // Fill Parts rows on left
  data.parts.forEach((p, i) => {
    const r = bottomStart + 2 + i;
    if (r < maxRows) {
      grid[r][0] = p.sl;
      grid[r][1] = p.name;
      grid[r][2] = p.capacity;
      grid[r][3] = p.gas;
    }
  });

  // Fill Tools rows on right
  data.tools.forEach((t, i) => {
    const r = bottomStart + 5 + i;
    if (r < maxRows) {
      grid[r][5] = t.sl;
      grid[r][6] = t.name;
      addMerge(r, 6, r, 7);
      grid[r][8] = t.effectiveRange;
    }
  });

  // Trim trailing empty rows
  let lastFilled = maxRows - 1;
  while (lastFilled > bottomStart + 6 && grid[lastFilled].every((cell: any) => !cell)) {
    lastFilled--;
  }
  const cleanGrid = grid.slice(0, lastFilled + 2);

  const wsLayout = XLSX.utils.aoa_to_sheet(cleanGrid);
  wsLayout['!merges'] = merges;

  // Set precise column widths to create the balanced SOP view
  wsLayout['!cols'] = [
    { wch: 18 }, // Col A: Photo 1 Label / Parts SL
    { wch: 28 }, // Col B: Photo 1 Title / Parts Name
    { wch: 18 }, // Col C: Photo 2 Label / Capacity
    { wch: 28 }, // Col D: Photo 2 Title / Gas
    { wch: 3 },  // Col E: Space Divider
    { wch: 6 },  // Col F: Procedure Numbering / Tool SL
    { wch: 50 }, // Col G: Procedure Content / Tool Name
    { wch: 22 }, // Col H: Procedure Extra / Range
    { wch: 16 }, // Col I: Status
  ];

  XLSX.utils.book_append_sheet(wb, wsLayout, 'SOP Visual Layout');

  // Sheet 2: Procedure & Quality Points (Tabular view for data sorting)
  const tabularData = [
    ['WALTON HI-TECH INDUSTRIES PLC. - SOP DATA TABLE'],
    ['Process Name', data.header.processName, 'Station / Line', data.header.stationLine],
    [],
    ['=== কার্যপ্রণালী (PROCEDURE STEPS) ==='],
    ['ক্রমিক নং', 'কাজের বিবরণ (Bangla)', 'সম্পৃক্ত ছবি (Photo Link)'],
    ...data.procedure.steps.map((step, idx) => {
      const photoRef = (step.match(/\(চিত্র-[০-৯]+\)/) || [])[0] || '-';
      return [toBengaliNumber(idx + 1), step, photoRef];
    }),
    [],
    ['=== লক্ষণীয় বিষয় (CRITICAL QUALITY POINTS) ==='],
    ['ক্রমিক নং', 'লক্ষণীয় বিষয়', 'সম্পৃক্ত ছবি'],
    ...data.procedure.qualityPoints.map((p, idx) => {
      const photoRef = (p.match(/\(চিত্র-[০-৯]+\)/) || [])[0] || '-';
      return [toBengaliNumber(idx + 1), p, photoRef];
    }),
    [],
    ['=== সাধারণ নির্দেশনা (GENERAL INSTRUCTIONS) ==='],
    ['ক্রমিক নং', 'নির্দেশনা'],
    ...data.procedure.generalInstructions.map((inst, idx) => [toBengaliNumber(idx + 1), inst]),
  ];
  const wsTabular = XLSX.utils.aoa_to_sheet(tabularData);
  wsTabular['!cols'] = [{ wch: 10 }, { wch: 75 }, { wch: 25 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsTabular, 'Procedure Steps (বিস্তারিত)');

  // Sheet 3: Parts List
  const partsData = [
    ['SL. No', 'Parts Name', 'Capacity(BTU)', 'Gas'],
    ...data.parts.map(p => [p.sl, p.name, p.capacity, p.gas]),
  ];
  const wsParts = XLSX.utils.aoa_to_sheet(partsData);
  wsParts['!cols'] = [{ wch: 8 }, { wch: 35 }, { wch: 20 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, wsParts, 'Parts List (যন্ত্রাংশ)');

  // Sheet 4: Tools List
  const toolsData = [
    ['SL', 'Tool / Equipment Name', 'Effective Range'],
    ...data.tools.map(t => [t.sl, t.name, t.effectiveRange]),
  ];
  const wsTools = XLSX.utils.aoa_to_sheet(toolsData);
  wsTools['!cols'] = [{ wch: 8 }, { wch: 40 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(wb, wsTools, 'Tools List (টুলস)');

  // Generate and download .xlsx file
  const fileName = `${data.header.processName.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'walton_sop'}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
