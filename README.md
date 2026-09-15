# Walton Hi-Tech Industries PLC. — Industrial SOP Maker

A manufacturing Standard Operating Procedure (SOP) generator and precision A4 landscape formatter built for industrial workflows. Features AI-powered Banglish-to-Bengali translation (supporting OpenRouter Free AI & Google Gemini), uniform photo matrix alignment, blank signature blocks, and 1-click export to Microsoft Excel (`.xlsx`) and high-resolution PDF.

## 🚀 Key Features

- **OpenRouter Free AI Integration**: Auto-fetches free AI models (`openrouter/free`, `gemma`, `llama-3.3-70b`, `deepseek`, etc.) to translate rough Banglish or English into 100% pure formal manufacturing Bengali (`কার্যপ্রণালী`).
- **Precision A4 Landscape Print Engine**: Strict single-page printable document (297mm × 210mm) with balanced typography and zero middle gap.
- **Fixed Photo Grid (4–9 Photos)**: Excel-style photo grid with automatic aspect ratio fitting (`Fit` vs `Fill`) and Walton yellow badges (`চিত্র-১` through `চিত্র-৯`).
- **Editable Process Information**: Inline editing for Process Name, Model, Station/Line, Reference No, Effective Date, and blank signature blocks for physical signs and stamps.
- **Export Formats**:
  - **Excel (`.xlsx`)**: Full structured workbook export using SheetJS.
  - **PDF (`.pdf`)**: 1-click client-side rasterized vector PDF export.
  - **Browser Print (`Ctrl + P`)**: Native vector A4 landscape print.

## 🛠️ Tech Stack

- **Framework**: React 19 + TypeScript + Vite 8
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Export Engines**: SheetJS (`xlsx`), jsPDF, html2canvas
- **Deployment**: Vercel ready (`vercel.json`)

## 📦 Deployment to Vercel

1. Import this repository into [Vercel](https://vercel.com).
2. Framework Preset: **Vite** (auto-detected).
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Click **Deploy**!

