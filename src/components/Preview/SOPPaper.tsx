import React, { useState } from 'react';
import type { SOPDocument, SOPHeader } from '../../types/sop';
import { Check, ImageOff } from 'lucide-react';

interface SOPPaperProps {
  data: SOPDocument;
  onUpdateHeader?: (updates: Partial<SOPHeader>) => void;
  onUpdateStep?: (index: number, val: string) => void;
  onUpdateQuality?: (index: number, val: string) => void;
  onUpdateGeneral?: (index: number, val: string) => void;
}

export const SOPPaper: React.FC<SOPPaperProps> = ({
  data,
  onUpdateHeader,
  onUpdateStep,
  onUpdateQuality,
  onUpdateGeneral,
}) => {
  const { header, photos, procedure, safety, parts, tools, imageFit = 'contain', gridCols = 0 } = data;
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  const handleImgError = (id: string) => {
    setBrokenImages(prev => ({ ...prev, [id]: true }));
  };

  // Determine number of columns for photo grid
  const getNumCols = () => {
    if (gridCols === 2) return 2;
    if (gridCols === 3) return 3;
    if (gridCols === 4) return 4;
    return photos.length <= 4 ? 2 : 3;
  };

  const numCols = getNumCols();
  const visiblePhotos = photos.slice(0, 9);
  const photoRows: (typeof visiblePhotos)[] = [];
  for (let i = 0; i < visiblePhotos.length; i += numCols) {
    photoRows.push(visiblePhotos.slice(i, i + numCols));
  }

  const handleInlineHeaderChange = (field: keyof SOPHeader, value: string) => {
    if (onUpdateHeader) {
      onUpdateHeader({ [field]: value });
    }
  };

  // Dynamic step typography calibrated so 4 to 9 steps fill the right column with NO blank gap
  const getStepTypography = (count: number) => {
    if (count <= 4) return { container: 'space-y-3 p-3', text: 'text-[13px] leading-[1.8]' };
    if (count <= 6) return { container: 'space-y-2 p-2.5', text: 'text-[12px] leading-[1.7]' };
    if (count <= 8) return { container: 'space-y-1.5 p-2', text: 'text-[11px] leading-[1.5]' };
    return { container: 'space-y-1 p-1.5', text: 'text-[10px] leading-[1.35]' };
  };

  const stepStyle = getStepTypography(procedure.steps.length);

  return (
    <div
      id="sop-paper"
      className="sop-a4-landscape bg-white text-black font-sans border-2 border-black flex flex-col justify-between text-[11px] leading-tight select-text print:border-black"
      style={{
        width: '287mm',
        height: '198mm',
        minHeight: '198mm',
        maxHeight: '198mm',
        boxSizing: 'border-box',
      }}
    >
      {/* 1. TOP HEADER SECTION (Pure Flexbox - Bulletproof for PDF export) */}
      <div className="border-b-2 border-black w-full shrink-0">
        <div className="flex flex-row divide-x-2 divide-black w-full">
          {/* Company Brand (Left 50%) */}
          <div className="w-1/2 flex flex-col divide-y border-black">
            {/* Logo and Company Name */}
            <div className="flex flex-row items-center gap-3 px-3 py-1.5 bg-white min-h-[46px]">
              <img
                src={header.logoUrl || '/walton-logo.png'}
                alt="Walton Logo"
                className="h-9 w-9 object-contain shrink-0"
              />
              <span className="font-extrabold text-[16px] tracking-wide text-[#005697] font-sans">
                {header.companyName}
              </span>
            </div>

            {/* Process Name (Editable Inline) */}
            <div className="flex flex-row divide-x border-black text-[11px]">
              <div className="w-[28%] font-bold px-2 py-1 bg-slate-50 flex items-center shrink-0">
                Process Name
              </div>
              <div className="w-[72%] px-2 py-1 font-semibold flex items-center">
                <input
                  type="text"
                  value={header.processName}
                  onChange={(e) => handleInlineHeaderChange('processName', e.target.value)}
                  placeholder="Enter Process Name"
                  className="w-full bg-transparent border-none outline-none font-semibold text-slate-950 focus:bg-amber-50/70 rounded px-1"
                />
              </div>
            </div>

            {/* Model (Editable Inline) */}
            <div className="flex flex-row divide-x border-black text-[11px]">
              <div className="w-[28%] font-bold px-2 py-1 bg-slate-50 flex items-center shrink-0">
                Model
              </div>
              <div className="w-[72%] px-2 py-1 font-semibold flex items-center">
                <input
                  type="text"
                  value={header.model}
                  onChange={(e) => handleInlineHeaderChange('model', e.target.value)}
                  placeholder="Enter Model"
                  className="w-full bg-transparent border-none outline-none font-semibold text-slate-950 focus:bg-amber-50/70 rounded px-1"
                />
              </div>
            </div>
          </div>

          {/* Document Control Metadata & Signatures (Right 50%) */}
          <div className="w-1/2 flex flex-col text-[10px]">
            {/* Station / Line */}
            <div className="flex flex-row divide-x divide-black border-b border-black">
              <div className="w-[28%] font-bold px-2 py-0.5 bg-slate-50 shrink-0">Station / Line</div>
              <div className="w-[72%] px-2 py-0.5 font-medium">
                <input
                  type="text"
                  value={header.stationLine}
                  onChange={(e) => handleInlineHeaderChange('stationLine', e.target.value)}
                  placeholder="e.g. CAC IDU Assembly Line"
                  className="w-full bg-transparent border-none outline-none font-medium text-slate-900 focus:bg-amber-50/70 rounded px-0.5"
                />
              </div>
            </div>

            {/* Mid Row: Ref/Dates & Signatures */}
            <div className="flex flex-row divide-x divide-black border-b border-black">
              {/* Reference & Dates (45%) */}
              <div className="w-[45%] flex flex-col divide-y divide-black">
                <div className="flex flex-row divide-x divide-black">
                  <div className="w-[50%] font-bold px-1 py-0.5 bg-slate-50 text-[9px] shrink-0">Reference No:</div>
                  <div className="w-[50%] px-1 py-0.5 font-mono text-[9px]">
                    <input
                      type="text"
                      value={header.referenceNo}
                      onChange={(e) => handleInlineHeaderChange('referenceNo', e.target.value)}
                      placeholder="e.g. ACP17HtSpA0032"
                      className="w-full bg-transparent border-none outline-none font-mono text-[9px] text-slate-900 focus:bg-amber-50/70 rounded"
                    />
                  </div>
                </div>
                <div className="flex flex-row divide-x divide-black">
                  <div className="w-[50%] font-bold px-1 py-0.5 bg-slate-50 text-[9px] shrink-0">Effective Date :</div>
                  <div className="w-[50%] px-1 py-0.5 text-[9px]">
                    <input
                      type="text"
                      value={header.effectiveDate}
                      onChange={(e) => handleInlineHeaderChange('effectiveDate', e.target.value)}
                      placeholder="MM/DD/YYYY"
                      className="w-full bg-transparent border-none outline-none text-[9px] text-slate-900 focus:bg-amber-50/70 rounded"
                    />
                  </div>
                </div>
                <div className="flex flex-row divide-x divide-black">
                  <div className="w-[50%] font-bold px-1 py-0.5 bg-slate-50 text-[9px] shrink-0">Revision No:</div>
                  <div className="w-[50%] px-1 py-0.5 text-[9px]">
                    <input
                      type="text"
                      value={header.revisionNo}
                      onChange={(e) => handleInlineHeaderChange('revisionNo', e.target.value)}
                      placeholder="0"
                      className="w-full bg-transparent border-none outline-none text-[9px] text-slate-900 focus:bg-amber-50/70 rounded"
                    />
                  </div>
                </div>
              </div>

              {/* Signatures & Approvals (55%) */}
              <div className="w-[55%] flex flex-row divide-x divide-black">
                {/* Prepared By */}
                <div className="flex-1 flex flex-col justify-between p-1 bg-white text-[8.5px] min-h-[58px]">
                  <div className="font-bold text-center border-b border-black/30 pb-0.5 bg-slate-50">Prepared By</div>
                  <div className="flex-1 flex flex-col items-center justify-center p-0.5">
                    {header.preparedBy.signatureImg ? (
                      <img src={header.preparedBy.signatureImg} alt="Signature" className="max-h-7 max-w-full object-contain" />
                    ) : header.preparedBy.name ? (
                      <span className="font-semibold text-[8px] text-slate-800 text-center">{header.preparedBy.name}</span>
                    ) : (
                      <div className="h-5" />
                    )}
                  </div>
                  {header.preparedBy.date && (
                    <div className="text-[7px] text-slate-400 text-center">{header.preparedBy.date}</div>
                  )}
                </div>

                {/* Checked By */}
                <div className="flex-1 flex flex-col justify-between p-1 bg-white text-[8.5px] min-h-[58px]">
                  <div className="font-bold text-center border-b border-black/30 pb-0.5 bg-slate-50">Checked By</div>
                  <div className="flex-1 flex flex-col items-center justify-center p-0.5">
                    {header.checkedBy.signatureImg ? (
                      <img src={header.checkedBy.signatureImg} alt="Signature" className="max-h-7 max-w-full object-contain" />
                    ) : header.checkedBy.name ? (
                      <span className="font-semibold text-[8px] text-slate-800 text-center">{header.checkedBy.name}</span>
                    ) : (
                      <div className="h-5" />
                    )}
                  </div>
                </div>

                {/* Approved By */}
                <div className="flex-1 flex flex-col justify-between p-1 bg-white text-[8.5px] min-h-[58px]">
                  <div className="font-bold text-center border-b border-black/30 pb-0.5 bg-slate-50">Approved By</div>
                  <div className="flex-1 flex flex-col items-center justify-center p-0.5">
                    {header.approvedBy.signatureImg ? (
                      <img src={header.approvedBy.signatureImg} alt="Signature" className="max-h-7 max-w-full object-contain" />
                    ) : header.approvedBy.name ? (
                      <span className="font-semibold text-[8px] text-slate-800 text-center">{header.approvedBy.name}</span>
                    ) : (
                      <div className="h-5" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Reason of Changes and Format Ref.No */}
            <div className="flex flex-row divide-x divide-black text-[9.5px]">
              <div className="w-[28%] font-bold px-1.5 py-0.5 bg-slate-50 shrink-0">Reason of Changes</div>
              <div className="w-[32%] px-1.5 py-0.5 text-slate-600">
                <input
                  type="text"
                  value={header.reasonOfChanges}
                  onChange={(e) => handleInlineHeaderChange('reasonOfChanges', e.target.value)}
                  placeholder="-"
                  className="w-full bg-transparent border-none outline-none text-slate-900 focus:bg-amber-50/70 rounded"
                />
              </div>
              <div className="w-[40%] px-1.5 py-0.5 text-right font-mono text-[8.5px] text-slate-700 flex items-center justify-end shrink-0">
                <span>Format Ref.No:&nbsp;</span>
                <input
                  type="text"
                  value={header.formatRefNo}
                  onChange={(e) => handleInlineHeaderChange('formatRefNo', e.target.value)}
                  className="w-24 bg-transparent border-none outline-none font-mono text-[8.5px] text-right text-slate-900 focus:bg-amber-50/70 rounded"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN BODY (TWO COLUMNS: BALANCED PHOTOS & PURE BENGALI PROCEDURES) */}
      <div className="flex-1 flex flex-row divide-x-2 divide-black min-h-0 overflow-hidden w-full">
        {/* Left Column: Fixed 4-9 Photograph Grid with Natural Proportions (50%) */}
        <div className="w-1/2 flex flex-col min-h-0">
          {/* Header Bar */}
          <div className="w-full bg-slate-100 border-b border-black font-bold text-center py-1 text-[11px] tracking-tight shrink-0">
            Photograph / Sketch / Demo View ( If Required - Must be Clear )
          </div>

          {/* Photo Grid Container using Flexbox Rows */}
          <div className="flex-1 p-1.5 flex flex-col gap-1.5 min-h-0 overflow-hidden bg-slate-50/40">
            {photoRows.map((row, rowIdx) => (
              <div key={rowIdx} className="flex-1 flex flex-row gap-1.5 min-h-0">
                {row.map((photo) => (
                  <div
                    key={photo.id}
                    className="relative flex flex-col bg-white border border-black overflow-hidden min-h-0 h-full"
                    style={{ flex: `1 1 ${100 / numCols}%` }}
                  >
                    {/* Photo Viewport */}
                    <div className="flex-1 w-full h-full relative overflow-hidden bg-slate-100 flex items-center justify-center">
                      {brokenImages[photo.id] ? (
                        <div className="flex flex-col items-center justify-center text-slate-400 p-2 text-center">
                          <ImageOff className="w-5 h-5 mb-1 text-slate-300" />
                          <span className="text-[9px]">Photo {photo.label}</span>
                        </div>
                      ) : (
                        <img
                          src={photo.url}
                          alt={photo.label}
                          onError={() => handleImgError(photo.id)}
                          className={`w-full h-full ${
                            imageFit === 'contain' ? 'object-contain p-0.5' : 'object-cover'
                          }`}
                        />
                      )}

                      {/* Prominent Yellow Badge Label at Bottom Center */}
                      <div className="absolute bottom-1 inset-x-0 flex justify-center pointer-events-none">
                        <span className="bg-[#FFFF00] text-black font-bold font-bengali text-[11px] px-3 py-0.5 border border-black/70 shadow-sm leading-none">
                          {photo.label}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Work Procedures & Directives (50%) */}
        <div className="w-1/2 flex flex-col min-h-0 divide-y divide-black font-bengali">
          {/* 2.1 কার্যপ্রণালী (Procedure Steps in 100% Pure Bengali - Balanced to eliminate blank gap) */}
          <div className="flex-[3.2] flex flex-col min-h-0">
            <div className="bg-emerald-50 text-emerald-950 font-bold text-center py-0.5 text-[11.5px] border-b border-emerald-700/60 tracking-wide shrink-0">
              কার্যপ্রণালী
            </div>
            <div className={`flex-1 overflow-hidden ${stepStyle.container}`}>
              {procedure.steps.map((step, idx) => (
                <div
                  key={idx}
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => onUpdateStep?.(idx, e.currentTarget.textContent || '')}
                  className={`text-justify font-medium text-slate-950 focus:bg-amber-50/80 focus:outline-none rounded px-1 -mx-1 ${stepStyle.text}`}
                >
                  {step}
                </div>
              ))}
            </div>
          </div>

          {/* 2.2 লক্ষণীয় বিষয় (Quality Points) */}
          <div className="flex-[1.5] flex flex-col min-h-0">
            <div className="bg-slate-100 font-bold text-center py-0.5 text-[10.5px] border-b border-black shrink-0">
              লক্ষণীয় বিষয়
            </div>
            <div className="flex-1 p-2 space-y-1 overflow-hidden text-[11px] leading-relaxed">
              {procedure.qualityPoints.map((point, idx) => (
                <div
                  key={idx}
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => onUpdateQuality?.(idx, e.currentTarget.textContent || '')}
                  className="text-justify text-slate-900 focus:bg-amber-50/80 focus:outline-none rounded px-1 -mx-1"
                >
                  {point}
                </div>
              ))}
            </div>
          </div>

          {/* 2.3 সাধারণ নির্দেশনা (General Instructions) */}
          <div className="flex-[1.2] flex flex-col min-h-0">
            <div className="bg-slate-100 font-bold text-center py-0.5 text-[10.5px] border-b border-black shrink-0">
              সাধারণ নির্দেশনা
            </div>
            <div className="flex-1 p-2 space-y-0.5 overflow-hidden text-[10px] leading-relaxed">
              {procedure.generalInstructions.map((inst, idx) => (
                <div
                  key={idx}
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => onUpdateGeneral?.(idx, e.currentTarget.textContent || '')}
                  className="text-justify text-slate-800 focus:bg-amber-50/80 focus:outline-none rounded px-1 -mx-1"
                >
                  {inst}
                </div>
              ))}
            </div>
          </div>

          {/* 2.4 Safety Instruction (PPE Section) */}
          <div className="shrink-0 flex flex-col">
            <div className="bg-slate-100 font-bold text-center py-0.5 text-[10px] border-b border-black font-sans">
              Safety Instruction
            </div>
            <div className="p-1.5 flex flex-row items-center gap-2 bg-white">
              {/* Safety text statement (50%) */}
              <div className="w-1/2 text-[8.5px] leading-tight text-slate-800 text-center font-medium">
                {safety.instructionText}
              </div>

              {/* PPE Icons & Checkboxes (50%) */}
              <div className="w-1/2 flex flex-row justify-around items-end">
                {/* Ear Muff */}
                <div className="flex flex-col items-center">
                  <img src="/ppe/ear-muff.svg" alt="Ear Muff" className="h-6 w-6 object-contain mb-0.5" />
                  <div className="w-3.5 h-3.5 border border-black flex items-center justify-center bg-white text-[9px]">
                    {safety.earMuff && <Check className="w-3 h-3 text-black stroke-[3]" />}
                  </div>
                </div>

                {/* Gloves */}
                <div className="flex flex-col items-center">
                  <img src="/ppe/gloves.svg" alt="Gloves" className="h-6 w-6 object-contain mb-0.5" />
                  <div className="w-3.5 h-3.5 border border-black flex items-center justify-center bg-white text-[9px]">
                    {safety.gloves && <Check className="w-3 h-3 text-black stroke-[3]" />}
                  </div>
                </div>

                {/* Goggles */}
                <div className="flex flex-col items-center">
                  <img src="/ppe/goggles.svg" alt="Goggles" className="h-6 w-6 object-contain mb-0.5" />
                  <div className="w-3.5 h-3.5 border border-black flex items-center justify-center bg-white text-[9px]">
                    {safety.goggles && <Check className="w-3 h-3 text-black stroke-[3]" />}
                  </div>
                </div>

                {/* Safety Shoes */}
                <div className="flex flex-col items-center">
                  <img src="/ppe/safety-shoes.svg" alt="Safety Shoes" className="h-6 w-6 object-contain mb-0.5" />
                  <div className="w-3.5 h-3.5 border border-black flex items-center justify-center bg-white text-[9px]">
                    {safety.safetyShoes && <Check className="w-3 h-3 text-black stroke-[3]" />}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. BOTTOM TABLES SECTION (PARTS & TOOLS - Pure Flexbox & Tables) */}
      <div className="border-t-2 border-black flex flex-row divide-x-2 divide-black text-[9px] w-full shrink-0">
        {/* Parts Table (50%) */}
        <div className="w-1/2 flex flex-col">
          <table className="w-full border-collapse text-center">
            <thead>
              <tr className="bg-slate-100 border-b border-black font-bold">
                <th className="w-8 border-r border-black py-0.5">SL. No</th>
                <th className="border-r border-black py-0.5">Parts Name</th>
                <th className="w-24 border-r border-black py-0.5">Capacity(BTU)</th>
                <th className="w-16 py-0.5">Gas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/60">
              {parts.slice(0, 7).map((p, idx) => (
                <tr key={idx} className="h-[13px] leading-none">
                  <td className="border-r border-black/60 font-bold">{p.sl}</td>
                  <td className="border-r border-black/60 px-1 text-left truncate">{p.name}</td>
                  <td className="border-r border-black/60 px-1">{p.capacity}</td>
                  <td className="px-1">{p.gas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Tools & Equipments Table (50%) */}
        <div className="w-1/2 flex flex-col">
          <table className="w-full border-collapse text-center">
            <thead>
              <tr className="bg-slate-100 border-b border-black font-bold">
                <th colSpan={3} className="py-0.5 border-b border-black">Tools & Equipments</th>
              </tr>
              <tr className="bg-slate-50 border-b border-black font-bold">
                <th className="w-8 border-r border-black py-0.5">SL</th>
                <th className="border-r border-black py-0.5">Name</th>
                <th className="w-32 py-0.5">Effective Range</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/60">
              {tools.slice(0, 6).map((t, idx) => (
                <tr key={idx} className="h-[13px] leading-none">
                  <td className="border-r border-black/60 font-bold">{t.sl}</td>
                  <td className="border-r border-black/60 px-1 text-left truncate">{t.name}</td>
                  <td className="px-1 truncate">{t.effectiveRange}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
