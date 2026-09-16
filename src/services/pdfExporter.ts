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

  // A4 Landscape 287mm x 198mm pixel dimensions at 96 DPI
  const A4_WIDTH_PX = 1085;
  const A4_HEIGHT_PX = 748;

  // High DPI capture with html2canvas-pro (full support for oklch, lab, modern CSS colors)
  const canvas = await html2canvas(element, {
    scale: 2.5, // 2.5x high DPI for razor-sharp Bengali text and photos
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    width: A4_WIDTH_PX,
    height: A4_HEIGHT_PX,
    windowWidth: 1400,
    windowHeight: 900,
    onclone: (clonedDoc) => {
      // 1. Neutralize zoom transform on the wrapper
      const clonedWrapper = clonedDoc.getElementById('sop-paper-wrapper');
      if (clonedWrapper) {
        clonedWrapper.style.transform = 'none';
        clonedWrapper.style.width = `${A4_WIDTH_PX}px`;
        clonedWrapper.style.height = `${A4_HEIGHT_PX}px`;
        clonedWrapper.style.padding = '0';
        clonedWrapper.style.margin = '0';
      }

      const clonedPaper = clonedDoc.getElementById(elementId);
      if (clonedPaper) {
        // Enforce exact A4 pixel boundaries and standard letter-spacing (prevents collapsed words)
        clonedPaper.style.transform = 'none';
        clonedPaper.style.width = `${A4_WIDTH_PX}px`;
        clonedPaper.style.height = `${A4_HEIGHT_PX}px`;
        clonedPaper.style.minWidth = `${A4_WIDTH_PX}px`;
        clonedPaper.style.maxWidth = `${A4_WIDTH_PX}px`;
        clonedPaper.style.minHeight = `${A4_HEIGHT_PX}px`;
        clonedPaper.style.maxHeight = `${A4_HEIGHT_PX}px`;
        clonedPaper.style.margin = '0';
        clonedPaper.style.padding = '0';
        clonedPaper.style.boxSizing = 'border-box';
        clonedPaper.style.letterSpacing = 'normal';
        clonedPaper.style.wordSpacing = 'normal';

        // Universal Bengali font stack with Nirmala UI as requested by user
        clonedPaper.style.fontFamily =
          "'Nirmala UI', 'Nirmala', 'SolaimanLipi', 'Kalpurush', 'Noto Sans Bengali', 'Hind Siliguri', 'Vrinda', sans-serif";

        // Flatten all <input> elements into standard <span> to avoid html2canvas input squashing
        const inputs = clonedPaper.querySelectorAll('input');
        inputs.forEach((input) => {
          const span = clonedDoc.createElement('span');
          span.textContent = input.value || input.placeholder || '';
          span.className = input.className;
          span.style.cssText = input.style.cssText;
          span.style.display = 'block';
          span.style.fontFamily =
            "'Nirmala UI', 'Nirmala', 'SolaimanLipi', 'Kalpurush', 'Noto Sans Bengali', 'Hind Siliguri', sans-serif";
          span.style.letterSpacing = 'normal';
          span.style.wordSpacing = 'normal';
          span.style.whiteSpace = 'normal';
          span.style.margin = '0';
          input.parentNode?.replaceChild(span, input);
        });

        // Flatten any <textarea> elements
        const textareas = clonedPaper.querySelectorAll('textarea');
        textareas.forEach((ta) => {
          const div = clonedDoc.createElement('div');
          div.textContent = ta.value || '';
          div.className = ta.className;
          div.style.cssText = ta.style.cssText;
          div.style.fontFamily =
            "'Nirmala UI', 'Nirmala', 'SolaimanLipi', 'Kalpurush', 'Noto Sans Bengali', 'Hind Siliguri', sans-serif";
          div.style.letterSpacing = 'normal';
          div.style.wordSpacing = 'normal';
          ta.parentNode?.replaceChild(div, ta);
        });

        // Ensure the Walton logo in header is loaded with high-resolution base64
        const logoImgs = clonedPaper.querySelectorAll('img[alt*="Logo"], img[alt*="logo"], img[alt*="Walton"]');
        logoImgs.forEach((img: any) => {
          img.src = WALTON_LOGO_BASE64;
        });
      }

      // Ensure all SVGs are rendered with geometric precision
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
