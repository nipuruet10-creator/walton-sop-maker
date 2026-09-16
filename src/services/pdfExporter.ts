import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';
import { WALTON_LOGO_BASE64 } from '../assets/waltonLogoBase64';

export async function downloadSOPAsPdf(elementId: string = 'sop-paper', processName: string = 'walton_sop') {
  const element = document.getElementById(elementId);
  if (!element) {
    alert('SOP document element not found for PDF generation.');
    return;
  }

  // Ensure all Google & Universal Bengali fonts are fully loaded
  if (document.fonts) {
    await document.fonts.ready;
  }

  // High DPI capture with html2canvas-pro (full support for oklch, lab, modern CSS colors)
  const canvas = await html2canvas(element, {
    scale: 2.5, // High DPI capture for crisp text and sharp photos
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: element.scrollWidth,
    onclone: (clonedDoc) => {
      const clonedPaper = clonedDoc.getElementById(elementId);
      if (clonedPaper) {
        // 1. Force Universal Bengali font stack with Nirmala UI and preserve word-spacing
        clonedPaper.style.fontFamily =
          "'Nirmala UI', 'Nirmala', 'SolaimanLipi', 'Kalpurush', 'Noto Sans Bengali', 'Hind Siliguri', 'Tiro Bangla', 'Vrinda', 'Segoe UI', Arial, sans-serif";
        clonedPaper.style.letterSpacing = '0.015px';
        clonedPaper.style.wordSpacing = 'normal';

        // 2. Flatten all <input> elements into standard text <span> to avoid html2canvas text-squashing
        const inputs = clonedPaper.querySelectorAll('input');
        inputs.forEach((input) => {
          const span = clonedDoc.createElement('span');
          span.textContent = input.value || input.placeholder || '';
          span.className = input.className;
          span.style.cssText = input.style.cssText;
          span.style.display = 'inline-block';
          span.style.fontFamily =
            "'Nirmala UI', 'Nirmala', 'SolaimanLipi', 'Kalpurush', 'Noto Sans Bengali', 'Hind Siliguri', 'Inter', sans-serif";
          span.style.letterSpacing = '0.02px';
          span.style.wordSpacing = 'normal';
          span.style.whiteSpace = 'normal';
          input.parentNode?.replaceChild(span, input);
        });

        // 3. Flatten any <textarea> elements
        const textareas = clonedPaper.querySelectorAll('textarea');
        textareas.forEach((ta) => {
          const div = clonedDoc.createElement('div');
          div.textContent = ta.value || '';
          div.className = ta.className;
          div.style.cssText = ta.style.cssText;
          div.style.fontFamily =
            "'Nirmala UI', 'Nirmala', 'SolaimanLipi', 'Kalpurush', 'Noto Sans Bengali', 'Hind Siliguri', sans-serif";
          div.style.letterSpacing = '0.015px';
          div.style.wordSpacing = 'normal';
          ta.parentNode?.replaceChild(div, ta);
        });

        // 4. Ensure the Walton logo in header is loaded with high-resolution base64
        const logoImgs = clonedPaper.querySelectorAll('img[alt*="Logo"], img[alt*="logo"], img[alt*="Walton"]');
        logoImgs.forEach((img: any) => {
          img.src = WALTON_LOGO_BASE64;
        });
      }

      // 5. Ensure all SVGs are rendered with geometric precision
      const svgs = clonedDoc.querySelectorAll('svg');
      svgs.forEach((svg) => {
        svg.setAttribute('shape-rendering', 'geometricPrecision');
      });
    },
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.95);

  // A4 Landscape: 297mm x 210mm
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  // Margins: 5mm around the 287mm x 198mm document
  const marginX = 5;
  const marginY = 5;
  const printWidth = 287;
  const printHeight = 198;

  pdf.addImage(imgData, 'JPEG', marginX, marginY, printWidth, printHeight);

  const safeTitle = processName.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'walton_sop';
  pdf.save(`${safeTitle}.pdf`);
}
