import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function downloadSOPAsPdf(elementId: string = 'sop-paper', processName: string = 'walton_sop') {
  const element = document.getElementById(elementId);
  if (!element) {
    alert('SOP document element not found for PDF generation.');
    return;
  }

  // Create high-resolution canvas capture
  const canvas = await html2canvas(element, {
    scale: 2.5, // High DPI capture for crisp text and sharp photos
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: element.scrollWidth,
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
