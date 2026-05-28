export type AIBackend = 'google_vision' | 'google_gemini' | 'tflite_mobilenetv2' | 'tflite_modeld' | 'elixir_backend' | 'mock';

export interface AIAnalysisResult {
  issues: DetectedIssue[];
  skinType: string;
  skinToneHex: string;
  severity: number;
  confidence: number;
  backendUsed: AIBackend;
}

export interface DetectedIssue {
  type: AcneType;
  confidence: number;
  boundingBox?: { x: number; y: number; width: number; height: number };
}

export type AcneType =
  | 'whitehead'
  | 'blackhead'
  | 'papule'
  | 'pustule'
  | 'nodule'
  | 'cyst'
  | 'acne_scar'
  | 'dark_spot'
  | 'wrinkle'
  | 'redness'
  | 'pore'
  | 'unknown';

export const ACNE_TYPE_LABELS: Record<AcneType, string> = {
  whitehead: 'Whitehead',
  blackhead: 'Blackhead',
  papule: 'Papule',
  pustule: 'Pustule',
  nodule: 'Nodule',
  cyst: 'Cyst',
  acne_scar: 'Acne Scar',
  dark_spot: 'Dark Spot',
  wrinkle: 'Wrinkle',
  redness: 'Redness',
  pore: 'Enlarged Pore',
  unknown: 'Unknown',
};

export const ACNE_TYPE_COLORS: Record<AcneType, string> = {
  whitehead: '#FFD700',
  blackhead: '#333333',
  papule: '#FF4444',
  pustule: '#FFAA00',
  nodule: '#CC0000',
  cyst: '#8800AA',
  acne_scar: '#996666',
  dark_spot: '#664433',
  wrinkle: '#AABBCC',
  redness: '#FF6666',
  pore: '#888888',
  unknown: '#999999',
};
