export interface SOPPhoto {
  id: string;
  url: string;
  label: string; // e.g., "চিত্র-১", "চিত্র-২"
  name?: string;
}

export interface SOPHeader {
  companyName: string;
  logoUrl?: string;
  processName: string;
  model: string;
  stationLine: string;
  referenceNo: string;
  effectiveDate: string;
  revisionNo: string;
  reasonOfChanges: string;
  formatRefNo: string;
  preparedBy: {
    name: string;
    designation: string;
    dept: string;
    date: string;
    signatureImg?: string;
  };
  checkedBy: {
    name: string;
    designation: string;
    signatureImg?: string;
  };
  approvedBy: {
    name: string;
    designation: string;
    signatureImg?: string;
  };
}

export interface SOPProcedure {
  banglishInput: string;
  steps: string[];
  qualityPoints: string[];
  generalInstructions: string[];
}

export interface SOPSafety {
  instructionText: string;
  earMuff: boolean;
  gloves: boolean;
  goggles: boolean;
  safetyShoes: boolean;
  mask: boolean;
}

export interface SOPPartRow {
  sl: number;
  name: string;
  capacity: string;
  gas: string;
}

export interface SOPToolRow {
  sl: number;
  name: string;
  effectiveRange: string;
}

export interface SOPDocument {
  header: SOPHeader;
  photos: SOPPhoto[];
  procedure: SOPProcedure;
  safety: SOPSafety;
  parts: SOPPartRow[];
  tools: SOPToolRow[];
  imageFit?: 'contain' | 'cover';
  gridCols?: number;
}
