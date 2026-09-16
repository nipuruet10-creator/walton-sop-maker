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

  // 1. Sheet 1: SOP Visual Layout (Matches physical Walton SOP document)
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

  // Set balanced column widths (Cols A to I)
  // Col F is 18 so 'Station / Line:', 'Reference No:', 'Prepared By:', 'Approved By:' never truncate
  ws.columns = [
    { width: 14 }, // A: Photo Label / Parts SL
    { width: 30 }, // B: Photo Title / Parts Name
    { width: 14 }, // C: Photo 2 Label / Capacity
    { width: 30 }, // D: Photo 2 Title / Gas
    { width: 3 },  // E: Column Divider
    { width: 18 }, // F: Header Label / Step SL / Tool SL
    { width: 52 }, // G: Step Details / Tool Name
    { width: 18 }, // H: Quality Notes / Effective Range
    { width: 16 }, // I: Status / Date / Signature
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

  const subHeaderFill: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE2E8F0' },
  };

  const sectionFill: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF005697' }, // Walton Blue
  };

  const amberFill: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFEF3C7' }, // Quality Amber
  };

  // Border helper function for a range of cells
  function applyBorders(startCol: number, startRow: number, endCol: number, endRow: number) {
    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        const cell = ws.getRow(r).getCell(c);
        cell.border = thinBorder;
      }
    }
  }

  // Row 1: Logo & Company Name (A1:D1) + Station Line & Rev (F1:I1)
  ws.getRow(1).height = 45;
  ws.mergeCells('A1:B1');
  ws.mergeCells('C1:D1');
  const c1 = ws.getCell('C1');
  c1.value = 'WALTON HI-TECH INDUSTRIES PLC.';
  c1.font = { name: 'Nirmala UI', size: 13, bold: true, color: { argb: 'FF005697' } };
  c1.alignment = { vertical: 'middle', horizontal: 'left' };

  // EMBED WALTON LOGO TO CELL A1 (Clean raw base64)
  try {
    const rawLogoBase64 = WALTON_LOGO_BASE64.replace(/^data:image\/[a-z]+;base64,/, '');
    const logoId = wb.addImage({
      base64: rawLogoBase64,
      extension: 'png',
    });
    ws.addImage(logoId, {
      tl: { col: 0.15, row: 0.1 },
      ext: { width: 135, height: 42 },
      editAs: 'oneCell',
    });
  } catch (err) {
    console.warn('Failed to embed logo in Excel, proceeding with text:', err);
    ws.getCell('A1').value = 'WALTON';
    ws.getCell('A1').font = { name: 'Nirmala UI', size: 14, bold: true, color: { argb: 'FF005697' } };
    ws.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' };
  }

  ws.getCell('F1').value = 'Station / Line:';
  ws.getCell('F1').font = { name: 'Nirmala UI', bold: true, size: 10 };
  ws.getCell('F1').alignment = { vertical: 'middle', horizontal: 'left' };
  ws.mergeCells('G1:H1');
  ws.getCell('G1').value = data.header.stationLine;
  ws.getCell('G1').alignment = { vertical: 'middle', horizontal: 'left' };
  ws.getCell('I1').value = `Rev: ${data.header.revisionNo}`;
  ws.getCell('I1').alignment = { vertical: 'middle', horizontal: 'center' };

  // Row 2: Subtitle & Ref No / Date
  ws.getRow(2).height = 24;
  ws.mergeCells('A2:D2');
  const c2 = ws.getCell('A2');
  c2.value = 'STANDARD OPERATING PROCEDURE (SOP) / কার্যপ্রণালী';
  c2.font = { name: 'Nirmala UI', size: 11, bold: true, color: { argb: 'FF1E293B' } };
  c2.alignment = { vertical: 'middle', horizontal: 'center' };
  c2.fill = headerFill;

  ws.getCell('F2').value = 'Reference No:';
  ws.getCell('F2').font = { name: 'Nirmala UI', bold: true, size: 10 };
  ws.getCell('F2').alignment = { vertical: 'middle', horizontal: 'left' };
  ws.mergeCells('G2:H2');
  ws.getCell('G2').value = data.header.referenceNo;
  ws.getCell('G2').font = { name: 'Nirmala UI', size: 10 };
  ws.getCell('G2').alignment = { vertical: 'middle', horizontal: 'left' };
  ws.getCell('I2').value = `Date: ${data.header.effectiveDate}`;
  ws.getCell('I2').alignment = { vertical: 'middle', horizontal: 'center' };

  // Row 3: Process Name & Prepared By / Checked By
  ws.getRow(3).height = 22;
  ws.getCell('A3').value = 'Process Name:';
  ws.getCell('A3').font = { name: 'Nirmala UI', bold: true, size: 10 };
  ws.getCell('A3').fill = headerFill;
  ws.getCell('A3').alignment = { vertical: 'middle', horizontal: 'left' };
  ws.mergeCells('B3:D3');
  ws.getCell('B3').value = data.header.processName;
  ws.getCell('B3').font = { name: 'Nirmala UI', bold: true, size: 10 };
  ws.getCell('B3').alignment = { vertical: 'middle', horizontal: 'left' };

  ws.getCell('F3').value = 'Prepared By:';
  ws.getCell('F3').font = { name: 'Nirmala UI', bold: true, size: 10 };
  ws.getCell('F3').alignment = { vertical: 'middle', horizontal: 'left' };
  ws.getCell('G3').value = data.header.preparedBy.name
    ? `${data.header.preparedBy.name} (${data.header.preparedBy.designation || 'Engineer'})`
    : 'N/A';
  ws.getCell('G3').alignment = { vertical: 'middle', horizontal: 'left' };
  ws.getCell('H3').value = 'Checked By:';
  ws.getCell('H3').font = { name: 'Nirmala UI', bold: true, size: 10 };
  ws.getCell('H3').alignment = { vertical: 'middle', horizontal: 'left' };
  ws.getCell('I3').value = data.header.checkedBy.name || 'Pending';
  ws.getCell('I3').alignment = { vertical: 'middle', horizontal: 'center' };

  // Row 4: Model & Approved By / Format Ref
  ws.getRow(4).height = 22;
  ws.getCell('A4').value = 'Model:';
  ws.getCell('A4').font = { name: 'Nirmala UI', bold: true, size: 10 };
  ws.getCell('A4').fill = headerFill;
  ws.getCell('A4').alignment = { vertical: 'middle', horizontal: 'left' };
  ws.mergeCells('B4:D4');
  ws.getCell('B4').value = data.header.model;
  ws.getCell('B4').font = { name: 'Nirmala UI', size: 10 };
  ws.getCell('B4').alignment = { vertical: 'middle', horizontal: 'left' };

  ws.getCell('F4').value = 'Approved By:';
  ws.getCell('F4').font = { name: 'Nirmala UI', bold: true, size: 10 };
  ws.getCell('F4').alignment = { vertical: 'middle', horizontal: 'left' };
  ws.getCell('G4').value = data.header.approvedBy.name || 'Pending Approval';
  ws.getCell('G4').alignment = { vertical: 'middle', horizontal: 'left' };
  ws.getCell('H4').value = 'Format Ref:';
  ws.getCell('H4').font = { name: 'Nirmala UI', bold: true, size: 10 };
  ws.getCell('H4').alignment = { vertical: 'middle', horizontal: 'left' };
  ws.getCell('I4').value = data.header.formatRefNo;
  ws.getCell('I4').alignment = { vertical: 'middle', horizontal: 'center' };

  // Row 5: Format Ref & Reason of Changes
  ws.getRow(5).height = 22;
  ws.getCell('A5').value = 'Format Ref No:';
  ws.getCell('A5').font = { name: 'Nirmala UI', bold: true, size: 10 };
  ws.getCell('A5').fill = headerFill;
  ws.getCell('A5').alignment = { vertical: 'middle', horizontal: 'left' };
  ws.mergeCells('B5:D5');
  ws.getCell('B5').value = data.header.formatRefNo;
  ws.getCell('B5').font = { name: 'Nirmala UI', size: 10 };
  ws.getCell('B5').alignment = { vertical: 'middle', horizontal: 'left' };

  ws.getCell('F5').value = 'Reason of Change:';
  ws.getCell('F5').font = { name: 'Nirmala UI', bold: true, size: 10 };
  ws.getCell('F5').alignment = { vertical: 'middle', horizontal: 'left' };
  ws.mergeCells('G5:I5');
  ws.getCell('G5').value = data.header.reasonOfChanges || 'Initial Release / Standard Production';
  ws.getCell('G5').font = { name: 'Nirmala UI', size: 10 };
  ws.getCell('G5').alignment = { vertical: 'middle', horizontal: 'left' };

  // Apply complete borders to header rows (Cols A-D and F-I)
  applyBorders(1, 1, 4, 5);
  applyBorders(6, 1, 9, 5);

  // Row 6: Blank row
  ws.getRow(6).height = 8;

  // Row 7: Main Section Headers (Two-Column Layout)
  ws.getRow(7).height = 26;
  ws.mergeCells('A7:D7');
  const hLeft = ws.getCell('A7');
  hLeft.value = '📷 Photograph / Sketch / Demo View (If Required - Must be Clear)';
  hLeft.font = { name: 'Nirmala UI', bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
  hLeft.fill = sectionFill;
  hLeft.alignment = { horizontal: 'center', vertical: 'middle' };

  ws.mergeCells('F7:I7');
  const hRight = ws.getCell('F7');
  hRight.value = '📋 কার্যপ্রণালী (WORK PROCEDURE)';
  hRight.font = { name: 'Nirmala UI', bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
  hRight.fill = sectionFill;
  hRight.alignment = { horizontal: 'center', vertical: 'middle' };

  applyBorders(1, 7, 4, 7);
  applyBorders(6, 7, 9, 7);

  // Middle Section (Row 8+)
  // LEFT: Photo Grid
  let leftRow = 8;
  const photos = data.photos;
  for (let i = 0; i < photos.length; i += 2) {
    const p1 = photos[i];
    const p2 = photos[i + 1];

    ws.getRow(leftRow).height = 20;
    ws.mergeCells(`A${leftRow}:B${leftRow}`);
    const cellP1 = ws.getCell(`A${leftRow}`);
    cellP1.value = `[${p1.label || `চিত্র-${toBengaliNumber(i + 1)}`}] ${p1.name || `Photo ${i + 1}`}`;
    cellP1.font = { name: 'Nirmala UI', bold: true, size: 9 };
    cellP1.alignment = { horizontal: 'center', vertical: 'middle' };
    cellP1.fill = headerFill;

    if (p2) {
      ws.mergeCells(`C${leftRow}:D${leftRow}`);
      const cellP2 = ws.getCell(`C${leftRow}`);
      cellP2.value = `[${p2.label || `চিত্র-${toBengaliNumber(i + 2)}`}] ${p2.name || `Photo ${i + 2}`}`;
      cellP2.font = { name: 'Nirmala UI', bold: true, size: 9 };
      cellP2.alignment = { horizontal: 'center', vertical: 'middle' };
      cellP2.fill = headerFill;
    } else {
      ws.mergeCells(`C${leftRow}:D${leftRow}`);
    }
    applyBorders(1, leftRow, 4, leftRow);
    leftRow++;

    // Photo Box Placeholder / Embedded Image
    ws.getRow(leftRow).height = 55;
    ws.mergeCells(`A${leftRow}:B${leftRow}`);
    const phBox1 = ws.getCell(`A${leftRow}`);
    phBox1.value = `(${p1.label || `চিত্র-${toBengaliNumber(i + 1)}`} - ছবি সংযুক্ত)`;
    phBox1.font = { name: 'Nirmala UI', italic: true, size: 9, color: { argb: 'FF64748B' } };
    phBox1.alignment = { horizontal: 'center', vertical: 'middle' };

    // Try embedding image if base64 exists
    if (p1.url && p1.url.startsWith('data:image/')) {
      try {
        const p1Clean = p1.url.replace(/^data:image\/[a-z]+;base64,/, '');
        const p1Ext = p1.url.includes('image/jpeg') || p1.url.includes('image/jpg') ? 'jpeg' : 'png';
        const p1Id = wb.addImage({ base64: p1Clean, extension: p1Ext as any });
        ws.addImage(p1Id, {
          tl: { col: 0.1, row: leftRow - 0.95 },
          ext: { width: 175, height: 70 },
          editAs: 'oneCell',
        });
      } catch (e) {
        // ignore image error
      }
    }

    if (p2) {
      ws.mergeCells(`C${leftRow}:D${leftRow}`);
      const phBox2 = ws.getCell(`C${leftRow}`);
      phBox2.value = `(${p2.label || `চিত্র-${toBengaliNumber(i + 2)}`} - ছবি সংযুক্ত)`;
      phBox2.font = { name: 'Nirmala UI', italic: true, size: 9, color: { argb: 'FF64748B' } };
      phBox2.alignment = { horizontal: 'center', vertical: 'middle' };

      if (p2.url && p2.url.startsWith('data:image/')) {
        try {
          const p2Clean = p2.url.replace(/^data:image\/[a-z]+;base64,/, '');
          const p2Ext = p2.url.includes('image/jpeg') || p2.url.includes('image/jpg') ? 'jpeg' : 'png';
          const p2Id = wb.addImage({ base64: p2Clean, extension: p2Ext as any });
          ws.addImage(p2Id, {
            tl: { col: 2.1, row: leftRow - 0.95 },
            ext: { width: 175, height: 70 },
            editAs: 'oneCell',
          });
        } catch (e) {
          // ignore image error
        }
      }
    } else {
      ws.mergeCells(`C${leftRow}:D${leftRow}`);
    }
    applyBorders(1, leftRow, 4, leftRow);
    leftRow++;
  }

  // RIGHT: Procedure Steps
  let rightRow = 8;
  data.procedure.steps.forEach((step, idx) => {
    const cleanStep = step.replace(/^([০-৯\d]+[\)\.\-:]\s*)/, '');
    const calculatedHeight = Math.max(26, Math.ceil(cleanStep.length / 42) * 18);
    ws.getRow(rightRow).height = calculatedHeight;

    ws.getCell(`F${rightRow}`).value = `${toBengaliNumber(idx + 1)})`;
    ws.getCell(`F${rightRow}`).font = { name: 'Nirmala UI', bold: true, size: 10 };
    ws.getCell(`F${rightRow}`).alignment = { horizontal: 'center', vertical: 'middle' };

    ws.mergeCells(`G${rightRow}:I${rightRow}`);
    const stepCell = ws.getCell(`G${rightRow}`);
    stepCell.value = cleanStep;
    stepCell.font = { name: 'Nirmala UI', size: 10 };
    stepCell.alignment = { wrapText: true, vertical: 'middle', horizontal: 'left' };

    applyBorders(6, rightRow, 9, rightRow);
    rightRow++;
  });

  // Critical Quality Points Section
  ws.getRow(rightRow).height = 24;
  ws.mergeCells(`F${rightRow}:I${rightRow}`);
  const qHeader = ws.getCell(`F${rightRow}`);
  qHeader.value = '⭐ লক্ষণীয় বিষয় (CRITICAL QUALITY POINTS)';
  qHeader.font = { name: 'Nirmala UI', bold: true, size: 10, color: { argb: 'FF92400E' } };
  qHeader.fill = amberFill;
  qHeader.alignment = { horizontal: 'center', vertical: 'middle' };
  applyBorders(6, rightRow, 9, rightRow);
  rightRow++;

  data.procedure.qualityPoints.forEach((pt, idx) => {
    const cleanPt = pt.replace(/^([০-৯\d]+[\)\.\-:]\s*)/, '');
    const calculatedHeight = Math.max(24, Math.ceil(cleanPt.length / 42) * 18);
    ws.getRow(rightRow).height = calculatedHeight;

    ws.getCell(`F${rightRow}`).value = `${toBengaliNumber(idx + 1)})`;
    ws.getCell(`F${rightRow}`).font = { name: 'Nirmala UI', bold: true, size: 10 };
    ws.getCell(`F${rightRow}`).alignment = { horizontal: 'center', vertical: 'middle' };

    ws.mergeCells(`G${rightRow}:I${rightRow}`);
    const ptCell = ws.getCell(`G${rightRow}`);
    ptCell.value = cleanPt;
    ptCell.font = { name: 'Nirmala UI', size: 10 };
    ptCell.alignment = { wrapText: true, vertical: 'middle', horizontal: 'left' };

    applyBorders(6, rightRow, 9, rightRow);
    rightRow++;
  });

  // General Instructions Section
  ws.getRow(rightRow).height = 24;
  ws.mergeCells(`F${rightRow}:I${rightRow}`);
  const gHeader = ws.getCell(`F${rightRow}`);
  gHeader.value = '📌 সাধারণ নির্দেশনা (GENERAL INSTRUCTIONS)';
  gHeader.font = { name: 'Nirmala UI', bold: true, size: 10, color: { argb: 'FF1E293B' } };
  gHeader.fill = subHeaderFill;
  gHeader.alignment = { horizontal: 'center', vertical: 'middle' };
  applyBorders(6, rightRow, 9, rightRow);
  rightRow++;

  data.procedure.generalInstructions.forEach((inst, idx) => {
    const cleanInst = inst.replace(/^([০-৯\d]+[\)\.\-:]\s*)/, '');
    const calculatedHeight = Math.max(24, Math.ceil(cleanInst.length / 42) * 18);
    ws.getRow(rightRow).height = calculatedHeight;

    ws.getCell(`F${rightRow}`).value = `${toBengaliNumber(idx + 1)})`;
    ws.getCell(`F${rightRow}`).font = { name: 'Nirmala UI', bold: true, size: 10 };
    ws.getCell(`F${rightRow}`).alignment = { horizontal: 'center', vertical: 'middle' };

    ws.mergeCells(`G${rightRow}:I${rightRow}`);
    const instCell = ws.getCell(`G${rightRow}`);
    instCell.value = cleanInst;
    instCell.font = { name: 'Nirmala UI', size: 10 };
    instCell.alignment = { wrapText: true, vertical: 'middle', horizontal: 'left' };

    applyBorders(6, rightRow, 9, rightRow);
    rightRow++;
  });

  // Bottom Tables Section
  const bottomStart = Math.max(leftRow + 1, rightRow + 1);

  // Left Bottom: Parts Table
  ws.getRow(bottomStart).height = 24;
  ws.mergeCells(`A${bottomStart}:D${bottomStart}`);
  const partsH = ws.getCell(`A${bottomStart}`);
  partsH.value = '📦 PARTS & MATERIALS';
  partsH.font = { name: 'Nirmala UI', bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
  partsH.fill = sectionFill;
  partsH.alignment = { horizontal: 'center', vertical: 'middle' };
  applyBorders(1, bottomStart, 4, bottomStart);

  ws.getRow(bottomStart + 1).height = 20;
  ws.getCell(`A${bottomStart + 1}`).value = 'SL';
  ws.getCell(`B${bottomStart + 1}`).value = 'Parts Name';
  ws.getCell(`C${bottomStart + 1}`).value = 'Capacity(BTU)';
  ws.getCell(`D${bottomStart + 1}`).value = 'Gas';
  ['A', 'B', 'C', 'D'].forEach((col) => {
    const c = ws.getCell(`${col}${bottomStart + 1}`);
    c.font = { name: 'Nirmala UI', bold: true, size: 9 };
    c.fill = subHeaderFill;
    c.alignment = { horizontal: 'center', vertical: 'middle' };
  });
  applyBorders(1, bottomStart + 1, 4, bottomStart + 1);

  data.parts.forEach((p, idx) => {
    const r = bottomStart + 2 + idx;
    ws.getRow(r).height = 18;
    ws.getCell(`A${r}`).value = p.sl;
    ws.getCell(`A${r}`).alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getCell(`B${r}`).value = p.name;
    ws.getCell(`B${r}`).alignment = { horizontal: 'left', vertical: 'middle' };
    ws.getCell(`C${r}`).value = p.capacity;
    ws.getCell(`C${r}`).alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getCell(`D${r}`).value = p.gas;
    ws.getCell(`D${r}`).alignment = { horizontal: 'center', vertical: 'middle' };
    applyBorders(1, r, 4, r);
  });

  // Right Bottom: Safety & Tools
  ws.getRow(bottomStart).height = 24;
  ws.mergeCells(`F${bottomStart}:I${bottomStart}`);
  const safetyH = ws.getCell(`F${bottomStart}`);
  safetyH.value = '🛡️ SAFETY INSTRUCTION & PPE';
  safetyH.font = { name: 'Nirmala UI', bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
  safetyH.fill = sectionFill;
  safetyH.alignment = { horizontal: 'center', vertical: 'middle' };
  applyBorders(6, bottomStart, 9, bottomStart);

  const ppeText = [
    `[${data.safety.earMuff ? '✓' : ' '}] Ear Muff`,
    `[${data.safety.gloves ? '✓' : ' '}] Gloves`,
    `[${data.safety.goggles ? '✓' : ' '}] Goggles`,
    `[${data.safety.safetyShoes ? '✓' : ' '}] Safety Shoes`,
    `[${data.safety.mask ? '✓' : ' '}] Mask`,
  ].join('    |    ');

  ws.getRow(bottomStart + 1).height = 22;
  ws.mergeCells(`F${bottomStart + 1}:I${bottomStart + 1}`);
  const ppeCell = ws.getCell(`F${bottomStart + 1}`);
  ppeCell.value = ppeText;
  ppeCell.font = { name: 'Nirmala UI', size: 9, bold: true, color: { argb: 'FF0F172A' } };
  ppeCell.fill = headerFill;
  ppeCell.alignment = { horizontal: 'center', vertical: 'middle' };
  applyBorders(6, bottomStart + 1, 9, bottomStart + 1);

  ws.getRow(bottomStart + 2).height = 22;
  ws.mergeCells(`F${bottomStart + 2}:I${bottomStart + 2}`);
  const dirCell = ws.getCell(`F${bottomStart + 2}`);
  dirCell.value = `Directive: ${data.safety.instructionText}`;
  dirCell.font = { name: 'Nirmala UI', size: 9, italic: true };
  dirCell.alignment = { horizontal: 'center', vertical: 'middle' };
  applyBorders(6, bottomStart + 2, 9, bottomStart + 2);

  // Tools Table Header
  ws.getRow(bottomStart + 3).height = 22;
  ws.mergeCells(`F${bottomStart + 3}:I${bottomStart + 3}`);
  const toolH = ws.getCell(`F${bottomStart + 3}`);
  toolH.value = '🔧 TOOLS & EQUIPMENTS';
  toolH.font = { name: 'Nirmala UI', bold: true, size: 10, color: { argb: 'FF1E293B' } };
  toolH.fill = subHeaderFill;
  toolH.alignment = { horizontal: 'center', vertical: 'middle' };
  applyBorders(6, bottomStart + 3, 9, bottomStart + 3);

  ws.getRow(bottomStart + 4).height = 20;
  ws.getCell(`F${bottomStart + 4}`).value = 'SL';
  ws.getCell(`F${bottomStart + 4}`).alignment = { horizontal: 'center', vertical: 'middle' };
  ws.mergeCells(`G${bottomStart + 4}:H${bottomStart + 4}`);
  ws.getCell(`G${bottomStart + 4}`).value = 'Tool / Equipment Name';
  ws.getCell(`G${bottomStart + 4}`).alignment = { horizontal: 'left', vertical: 'middle' };
  ws.getCell(`I${bottomStart + 4}`).value = 'Effective Range';
  ws.getCell(`I${bottomStart + 4}`).alignment = { horizontal: 'center', vertical: 'middle' };
  ['F', 'G', 'I'].forEach((col) => {
    ws.getCell(`${col}${bottomStart + 4}`).font = { name: 'Nirmala UI', bold: true, size: 9 };
    ws.getCell(`${col}${bottomStart + 4}`).fill = headerFill;
  });
  applyBorders(6, bottomStart + 4, 9, bottomStart + 4);

  data.tools.forEach((t, idx) => {
    const r = bottomStart + 5 + idx;
    ws.getRow(r).height = 18;
    ws.getCell(`F${r}`).value = t.sl;
    ws.getCell(`F${r}`).alignment = { horizontal: 'center', vertical: 'middle' };
    ws.mergeCells(`G${r}:H${r}`);
    ws.getCell(`G${r}`).value = t.name;
    ws.getCell(`G${r}`).alignment = { horizontal: 'left', vertical: 'middle' };
    ws.getCell(`I${r}`).value = t.effectiveRange;
    ws.getCell(`I${r}`).alignment = { horizontal: 'center', vertical: 'middle' };
    applyBorders(6, r, 9, r);
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

  // Apply Nirmala UI as primary font across ALL worksheets & cells
  wb.eachSheet((sheet) => {
    sheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.font = {
          ...(cell.font || {}),
          name: 'Nirmala UI',
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
