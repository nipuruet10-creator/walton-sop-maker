import * as XLSX from 'xlsx';
import type { SOPDocument } from '../types/sop';

export function exportSOPToExcel(data: SOPDocument) {
  const wb = XLSX.utils.book_new();

  // 1. Overview & Process Sheet
  const headerData = [
    ['WALTON HI-TECH INDUSTRIES PLC.'],
    ['STANDARD OPERATING PROCEDURE (SOP) / কার্যপ্রণালী'],
    [],
    ['Process Name', data.header.processName, 'Station / Line', data.header.stationLine],
    ['Model', data.header.model, 'Reference No', data.header.referenceNo],
    ['Effective Date', data.header.effectiveDate, 'Revision No', data.header.revisionNo],
    ['Format Ref. No', data.header.formatRefNo, 'Reason of Changes', data.header.reasonOfChanges || 'N/A'],
    [],
    ['Prepared By', data.header.preparedBy.name, 'Checked By', data.header.checkedBy.name || 'Pending'],
    ['Designation', data.header.preparedBy.designation, 'Approved By', data.header.approvedBy.name || 'Pending'],
    [],
    ['=== কার্যপ্রণালী (WORK PROCEDURE) ==='],
    ['ক্রমিক নম্বর', 'কাজের বিস্তারিত বিবরণ'],
    ...data.procedure.steps.map((step, idx) => [idx + 1, step]),
    [],
    ['=== লক্ষণীয় বিষয় (CRITICAL QUALITY POINTS) ==='],
    ['ক্রমিক নম্বর', 'লক্ষণীয় বিষয়'],
    ...data.procedure.qualityPoints.map((point, idx) => [idx + 1, point]),
    [],
    ['=== সাধারণ নির্দেশনা (GENERAL INSTRUCTIONS) ==='],
    ['ক্রমিক নম্বর', 'সাধারণ নির্দেশনা'],
    ...data.procedure.generalInstructions.map((inst, idx) => [idx + 1, inst]),
    [],
    ['=== SAFETY & PPE INSTRUCTIONS ==='],
    ['Safety Directive', data.safety.instructionText],
    ['Ear Muff (শব্দ প্রতিরোধক যন্ত্র)', data.safety.earMuff ? 'REQUIRED (প্রয়োজনীয়)' : 'No'],
    ['Hand Gloves (হাত মোজা)', data.safety.gloves ? 'REQUIRED (প্রয়োজনীয়)' : 'No'],
    ['Safety Goggles (চশমা)', data.safety.goggles ? 'REQUIRED (প্রয়োজনীয়)' : 'No'],
    ['Safety Shoes (নিরাপত্তা জুতা)', data.safety.safetyShoes ? 'REQUIRED (প্রয়োজনীয়)' : 'No'],
    ['Mask (মাস্ক)', data.safety.mask ? 'REQUIRED (প্রয়োজনীয়)' : 'No'],
  ];

  const wsHeader = XLSX.utils.aoa_to_sheet(headerData);

  // Set column widths
  wsHeader['!cols'] = [
    { wch: 20 },
    { wch: 55 },
    { wch: 22 },
    { wch: 35 },
  ];

  XLSX.utils.book_append_sheet(wb, wsHeader, 'SOP Details');

  // 2. Parts Table Sheet
  const partsData = [
    ['SL. No', 'Parts Name', 'Capacity(BTU)', 'Gas'],
    ...data.parts.map(p => [p.sl, p.name, p.capacity, p.gas]),
  ];
  const wsParts = XLSX.utils.aoa_to_sheet(partsData);
  wsParts['!cols'] = [{ wch: 8 }, { wch: 30 }, { wch: 18 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, wsParts, 'Parts List');

  // 3. Tools Table Sheet
  const toolsData = [
    ['SL', 'Tool / Equipment Name', 'Effective Range'],
    ...data.tools.map(t => [t.sl, t.name, t.effectiveRange]),
  ];
  const wsTools = XLSX.utils.aoa_to_sheet(toolsData);
  wsTools['!cols'] = [{ wch: 8 }, { wch: 35 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(wb, wsTools, 'Tools & Equipment');

  // Generate and download .xlsx file
  const fileName = `${data.header.processName.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'walton_sop'}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
