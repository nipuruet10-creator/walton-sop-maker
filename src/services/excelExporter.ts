import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import type { SOPDocument } from '../types/sop';
import { toBengaliNumber } from '../data/defaultSopData';
import { WALTON_LOGO_BASE64 } from '../assets/waltonLogoBase64';

export async function exportSOPToExcel(data: SOPDocument) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Walton Hi-Tech Industries PLC';
  wb.lastModifiedBy = 'Walton SOP Maker';
  wb.created = new Date();

  // 1. Sheet 1: SOP Visual Layout (Identical to physical SOP document)
  const ws = wb.addWorksheet('SOP Visual Layout', {
    pageSetup: {
      orientation: 'landscape',
      paperSize: 9, // A4
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 1,
    },
    views: [{ showGridLines: true }],
  });

  // Set precise column widths (Cols A to I)
  ws.columns = [
    { width: 18 }, // A: Photo Label / Parts SL
    { width: 28 }, // B: Photo Title / Parts Name
    { width: 18 }, // C: Photo 2 Label / Capacity
    { width: 28 }, // D: Photo 2 Title / Gas
    { width: 4 },  // E: Column Divider
    { width: 8 },  // F: Step SL / Tool SL
    { width: 55 }, // G: Step details / Tool Name
    { width: 22 }, // H: Quality notes / Range
    { width: 16 }, // I: Status / Signature
  ];

  // Helper styles
  const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FF000000' } },
    left: { style: 'thin', color: { argb: 'FF000000' } },
    bottom: { style: 'thin', color: { argb: 'FF000000' } },
    right: { style: 'thin', color: { argb: 'FF000000' } },
  };

  const headerFill: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF1F5F9' },
  };

  const sectionFill: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF005697' }, // Walton Blue
  };

  // Row 1: Logo & Company Name + Station Line
  ws.mergeCells('A1:B1');
  ws.mergeCells('C1:D1');
  const c1 = ws.getCell('C1');
  c1.value = 'WALTON HI-TECH INDUSTRIES PLC.';
  c1.font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FF005697' } };
  c1.alignment = { vertical: 'middle', horizontal: 'left' };

  // ADD WALTON LOGO TO CELL A1
  try {
    const logoId = wb.addImage({
      base64: WALTON_LOGO_BASE64,
      extension: 'png',
    });
    ws.addImage(logoId, {
      tl: { col: 0.1, row: 0.1 },
      ext: { width: 130, height: 42 },
      editAs: 'oneCell',
    });
  } catch (err) {
    console.warn('Failed to embed logo in Excel, proceeding with text:', err);
  }

  ws.getCell('F1').value = 'Station / Line:';
  ws.getCell('F1').font = { bold: true, size: 10 };
  ws.mergeCells('G1:H1');
  ws.getCell('G1').value = data.header.stationLine;
  ws.getCell('I1').value = `Rev: ${data.header.revisionNo}`;

  // Row 2: Subtitle & Ref No
  ws.mergeCells('A2:D2');
  const c2 = ws.getCell('A2');
  c2.value = 'STANDARD OPERATING PROCEDURE (SOP) / কার্যপ্রণালী';
  c2.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF334155' } };
  c2.alignment = { vertical: 'middle', horizontal: 'center' };
  c2.fill = headerFill;

  ws.getCell('F2').value = 'Reference No:';
  ws.getCell('F2').font = { bold: true, size: 10 };
  ws.mergeCells('G2:H2');
  ws.getCell('G2').value = data.header.referenceNo;
  ws.getCell('I2').value = `Date: ${data.header.effectiveDate}`;

  // Row 3: Process Name & Prepared By
  ws.getCell('A3').value = 'Process Name:';
  ws.getCell('A3').font = { bold: true, size: 10 };
  ws.mergeCells('B3:D3');
  ws.getCell('B3').value = data.header.processName;
  ws.getCell('B3').font = { bold: true, size: 10 };

  ws.getCell('F3').value = 'Prepared By:';
  ws.getCell('F3').font = { bold: true, size: 10 };
  ws.mergeCells('G3:I3');
  ws.getCell('G3').value = data.header.preparedBy.name
    ? `${data.header.preparedBy.name} (${data.header.preparedBy.designation || 'Engineer'})`
    : 'N/A';

  // Row 4: Model & Approved By
  ws.getCell('A4').value = 'Model:';
  ws.getCell('A4').font = { bold: true, size: 10 };
  ws.mergeCells('B4:D4');
  ws.getCell('B4').value = data.header.model;

  ws.getCell('F4').value = 'Approved By:';
  ws.getCell('F4').font = { bold: true, size: 10 };
  ws.mergeCells('G4:I4');
  ws.getCell('G4').value = data.header.approvedBy.name || 'Pending Approval';

  // Row 5: Format Ref & Reason of Changes
  ws.getCell('A5').value = 'Format Ref:';
  ws.getCell('A5').font = { bold: true, size: 10 };
  ws.mergeCells('B5:D5');
  ws.getCell('B5').value = data.header.formatRefNo;

  ws.getCell('F5').value = 'Reason:';
  ws.getCell('F5').font = { bold: true, size: 10 };
  ws.mergeCells('G5:I5');
  ws.getCell('G5').value = data.header.reasonOfChanges || 'Initial Release / Standard Production';

  // Apply borders across header cells
  for (let r = 1; r <= 5; r++) {
    for (let c = 1; c <= 9; c++) {
      if (c !== 5) {
        ws.getRow(r).getCell(c).border = thinBorder;
      }
    }
  }

  // Row 6: Blank row
  ws.getRow(6).height = 10;

  // Row 7: Main Section Headers (Two-Column Layout)
  ws.mergeCells('A7:D7');
  const hLeft = ws.getCell('A7');
  hLeft.value = '📷 Photograph / Sketch / Demo View (If Required - Must be Clear)';
  hLeft.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
  hLeft.fill = sectionFill;
  hLeft.alignment = { horizontal: 'center', vertical: 'middle' };

  ws.mergeCells('F7:I7');
  const hRight = ws.getCell('F7');
  hRight.value = '📋 কার্যপ্রণালী (WORK PROCEDURE)';
  hRight.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
  hRight.fill = sectionFill;
  hRight.alignment = { horizontal: 'center', vertical: 'middle' };

  // Middle Section (Row 8+)
  // LEFT: Photo Grid
  let leftRow = 8;
  const photos = data.photos;
  for (let i = 0; i < photos.length; i += 2) {
    const p1 = photos[i];
    const p2 = photos[i + 1];

    ws.mergeCells(`A${leftRow}:B${leftRow}`);
    const cellP1 = ws.getCell(`A${leftRow}`);
    cellP1.value = `[${p1.label || `চিত্র-${toBengaliNumber(i + 1)}`}] ${p1.name || `Photo ${i + 1}`}`;
    cellP1.font = { bold: true, size: 9 };
    cellP1.alignment = { horizontal: 'center', vertical: 'middle' };
    cellP1.fill = headerFill;

    if (p2) {
      ws.mergeCells(`C${leftRow}:D${leftRow}`);
      const cellP2 = ws.getCell(`C${leftRow}`);
      cellP2.value = `[${p2.label || `চিত্র-${toBengaliNumber(i + 2)}`}] ${p2.name || `Photo ${i + 2}`}`;
      cellP2.font = { bold: true, size: 9 };
      cellP2.alignment = { horizontal: 'center', vertical: 'middle' };
      cellP2.fill = headerFill;
    }
    leftRow++;

    // Photo Box Placeholder / Info
    ws.mergeCells(`A${leftRow}:B${leftRow}`);
    const phBox1 = ws.getCell(`A${leftRow}`);
    phBox1.value = '(ছবি সংযুক্ত থাকবে / Image Attachment)';
    phBox1.font = { italic: true, size: 8, color: { argb: 'FF64748B' } };
    phBox1.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(leftRow).height = 42;

    if (p2) {
      ws.mergeCells(`C${leftRow}:D${leftRow}`);
      const phBox2 = ws.getCell(`C${leftRow}`);
      phBox2.value = '(ছবি সংযুক্ত থাকবে / Image Attachment)';
      phBox2.font = { italic: true, size: 8, color: { argb: 'FF64748B' } };
      phBox2.alignment = { horizontal: 'center', vertical: 'middle' };
    }
    leftRow++;
  }

  // RIGHT: Procedure Steps
  let rightRow = 8;
  data.procedure.steps.forEach((step, idx) => {
    ws.getCell(`F${rightRow}`).value = `${toBengaliNumber(idx + 1)})`;
    ws.getCell(`F${rightRow}`).font = { bold: true, size: 10 };
    ws.getCell(`F${rightRow}`).alignment = { horizontal: 'right', vertical: 'top' };

    ws.mergeCells(`G${rightRow}:I${rightRow}`);
    const stepCell = ws.getCell(`G${rightRow}`);
    stepCell.value = step.replace(/^([০-৯\d]+[\)\.\-:]\s*)/, '');
    stepCell.font = { size: 10 };
    stepCell.alignment = { wrapText: true, vertical: 'top' };
    rightRow++;
  });

  // Critical Quality Points
  rightRow++;
  ws.mergeCells(`F${rightRow}:I${rightRow}`);
  const qHeader = ws.getCell(`F${rightRow}`);
  qHeader.value = '⭐ লক্ষণীয় বিষয় (CRITICAL QUALITY POINTS)';
  qHeader.font = { bold: true, size: 10, color: { argb: 'FF92400E' } };
  qHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
  rightRow++;

  data.procedure.qualityPoints.forEach((pt, idx) => {
    ws.getCell(`F${rightRow}`).value = `${toBengaliNumber(idx + 1)})`;
    ws.getCell(`F${rightRow}`).font = { bold: true, size: 10 };
    ws.getCell(`F${rightRow}`).alignment = { horizontal: 'right', vertical: 'top' };

    ws.mergeCells(`G${rightRow}:I${rightRow}`);
    const ptCell = ws.getCell(`G${rightRow}`);
    ptCell.value = pt.replace(/^([০-৯\d]+[\)\.\-:]\s*)/, '');
    ptCell.font = { size: 10 };
    ptCell.alignment = { wrapText: true, vertical: 'top' };
    rightRow++;
  });

  // General Instructions
  rightRow++;
  ws.mergeCells(`F${rightRow}:I${rightRow}`);
  const gHeader = ws.getCell(`F${rightRow}`);
  gHeader.value = '📌 সাধারণ নির্দেশনা (GENERAL INSTRUCTIONS)';
  gHeader.font = { bold: true, size: 10, color: { argb: 'FF1E293B' } };
  gHeader.fill = headerFill;
  rightRow++;

  data.procedure.generalInstructions.forEach((inst, idx) => {
    ws.getCell(`F${rightRow}`).value = `${toBengaliNumber(idx + 1)})`;
    ws.getCell(`F${rightRow}`).font = { bold: true, size: 10 };
    ws.getCell(`F${rightRow}`).alignment = { horizontal: 'right', vertical: 'top' };

    ws.mergeCells(`G${rightRow}:I${rightRow}`);
    const instCell = ws.getCell(`G${rightRow}`);
    instCell.value = inst.replace(/^([০-৯\d]+[\)\.\-:]\s*)/, '');
    instCell.font = { size: 10 };
    instCell.alignment = { wrapText: true, vertical: 'top' };
    rightRow++;
  });

  // Bottom Tables Section
  const bottomStart = Math.max(leftRow + 1, rightRow + 1);

  // Left Bottom: Parts Table
  ws.mergeCells(`A${bottomStart}:D${bottomStart}`);
  const partsH = ws.getCell(`A${bottomStart}`);
  partsH.value = '📦 PARTS & MATERIALS';
  partsH.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
  partsH.fill = sectionFill;

  ws.getCell(`A${bottomStart + 1}`).value = 'SL';
  ws.getCell(`B${bottomStart + 1}`).value = 'Parts Name';
  ws.getCell(`C${bottomStart + 1}`).value = 'Capacity(BTU)';
  ws.getCell(`D${bottomStart + 1}`).value = 'Gas';
  ['A', 'B', 'C', 'D'].forEach((col) => {
    ws.getCell(`${col}${bottomStart + 1}`).font = { bold: true, size: 9 };
    ws.getCell(`${col}${bottomStart + 1}`).fill = headerFill;
  });

  data.parts.forEach((p, idx) => {
    const r = bottomStart + 2 + idx;
    ws.getCell(`A${r}`).value = p.sl;
    ws.getCell(`B${r}`).value = p.name;
    ws.getCell(`C${r}`).value = p.capacity;
    ws.getCell(`D${r}`).value = p.gas;
  });

  // Right Bottom: Safety & Tools
  ws.mergeCells(`F${bottomStart}:I${bottomStart}`);
  const safetyH = ws.getCell(`F${bottomStart}`);
  safetyH.value = '🛡️ SAFETY INSTRUCTION & PPE';
  safetyH.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
  safetyH.fill = sectionFill;

  const ppeText = [
    `Ear Muff: ${data.safety.earMuff ? 'YES' : 'NO'}`,
    `Hand Gloves: ${data.safety.gloves ? 'YES' : 'NO'}`,
    `Goggles: ${data.safety.goggles ? 'YES' : 'NO'}`,
    `Shoes: ${data.safety.safetyShoes ? 'YES' : 'NO'}`,
    `Mask: ${data.safety.mask ? 'YES' : 'NO'}`,
  ].join('   |   ');

  ws.mergeCells(`F${bottomStart + 1}:I${bottomStart + 1}`);
  ws.getCell(`F${bottomStart + 1}`).value = ppeText;
  ws.getCell(`F${bottomStart + 1}`).font = { size: 9, bold: true };

  ws.mergeCells(`F${bottomStart + 2}:I${bottomStart + 2}`);
  ws.getCell(`F${bottomStart + 2}`).value = `Directive: ${data.safety.instructionText}`;
  ws.getCell(`F${bottomStart + 2}`).font = { size: 9, italic: true };

  // Tools Table
  ws.mergeCells(`F${bottomStart + 3}:I${bottomStart + 3}`);
  const toolH = ws.getCell(`F${bottomStart + 3}`);
  toolH.value = '🔧 TOOLS & EQUIPMENTS';
  toolH.font = { bold: true, size: 10, color: { argb: 'FF1E293B' } };
  toolH.fill = headerFill;

  ws.getCell(`F${bottomStart + 4}`).value = 'SL';
  ws.mergeCells(`G${bottomStart + 4}:H${bottomStart + 4}`);
  ws.getCell(`G${bottomStart + 4}`).value = 'Tool / Equipment Name';
  ws.getCell(`I${bottomStart + 4}`).value = 'Effective Range';
  ['F', 'G', 'I'].forEach((col) => {
    ws.getCell(`${col}${bottomStart + 4}`).font = { bold: true, size: 9 };
  });

  data.tools.forEach((t, idx) => {
    const r = bottomStart + 5 + idx;
    ws.getCell(`F${r}`).value = t.sl;
    ws.mergeCells(`G${r}:H${r}`);
    ws.getCell(`G${r}`).value = t.name;
    ws.getCell(`I${r}`).value = t.effectiveRange;
  });

  // Sheet 2: Tabular Data for Formulas & Searching
  const wsTabular = wb.addWorksheet('Procedure Steps (ডাটা)');
  wsTabular.columns = [
    { header: 'ক্রমিক নং', key: 'sl', width: 10 },
    { header: 'কাজের বিবরণ (Bangla)', key: 'desc', width: 75 },
    { header: 'সম্পৃক্ত ছবি (Photo Link)', key: 'photo', width: 25 },
  ];
  data.procedure.steps.forEach((step, idx) => {
    const photoRef = (step.match(/\(চিত্র-[০-৯]+\)/) || [])[0] || '-';
    wsTabular.addRow({
      sl: toBengaliNumber(idx + 1),
      desc: step,
      photo: photoRef,
    });
  });

  // Sheet 3: Parts
  const wsParts = wb.addWorksheet('Parts List (যন্ত্রাংশ)');
  wsParts.columns = [
    { header: 'SL. No', key: 'sl', width: 10 },
    { header: 'Parts Name', key: 'name', width: 35 },
    { header: 'Capacity(BTU)', key: 'capacity', width: 20 },
    { header: 'Gas', key: 'gas', width: 18 },
  ];
  data.parts.forEach((p) => wsParts.addRow(p));

  // Sheet 4: Tools
  const wsTools = wb.addWorksheet('Tools List (টুলস)');
  wsTools.columns = [
    { header: 'SL', key: 'sl', width: 10 },
    { header: 'Tool / Equipment Name', key: 'name', width: 40 },
    { header: 'Effective Range', key: 'range', width: 25 },
  ];
  data.tools.forEach((t) => wsTools.addRow({ sl: t.sl, name: t.name, range: t.effectiveRange }));

  // Apply Nirmala UI as primary font across all worksheets & cells
  wb.eachSheet((sheet) => {
    sheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.font = {
          name: 'Nirmala UI',
          ...(cell.font || {}),
        };
      });
    });
  });

  // Generate binary buffer & trigger download via FileSaver
  const buffer = await wb.xlsx.writeBuffer();
  const safeName = data.header.processName.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'walton_sop';
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveAs(blob, `${safeName}.xlsx`);
}
