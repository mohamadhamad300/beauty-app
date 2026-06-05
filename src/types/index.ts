export type AcneType = 'blackheads' | 'whiteheads' | 'papules' | 'pustules' | 'nodules' | 'cysts';

export type SeverityLevel = 'mild' | 'moderate' | 'severe';
export type SkinType = 'oily' | 'dry' | 'combination' | 'normal' | 'sensitive';

export interface AcneDetection {
  type: AcneType;
  confidence: number;
  count: number;
}

export interface SkinConcern {
  type: 'acne' | 'dryness' | 'oiliness' | 'redness' | 'wrinkles' | 'dark_spots';
  severity: 'low' | 'medium' | 'high';
  area: string;
}

export interface ScanResult {
  timestamp: number;
  skinHealth: number;
  severity: SeverityLevel;
  acneDetections: AcneDetection[];
  concerns: SkinConcern[];
  recommendations: string[];
  conditionSummary: string;
  tip: string;
  skinType: SkinType;
  skinToneHex: string;
}

export interface ScanHistoryItem {
  id: string;
  timestamp: number;
  skinHealth: number;
  severity: SeverityLevel;
  photoUri: string;
  skinType: SkinType;
  skinToneHex: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  image: string;
  category: 'cleanser' | 'moisturizer' | 'serum' | 'sunscreen' | 'mask';
  skinConcerns: string[];
  rating: number;
}

export type RootStackParamList = {
  Home: undefined;
  SkinAnalysis: { scanResult?: ScanResult; scanHistory?: ScanHistoryItem[] } | undefined;
  ProductMatch: { scanResult: ScanResult };
  ScanHistory: { scanHistory: ScanHistoryItem[] };
  ProductDetail: { product: Product };
  VirtualTryOn: undefined;
  VideoScanner: undefined;
  ARMakeup: undefined;
  ARStream: undefined;
  SignIn: undefined;
  Register: undefined;
};

export type TabParamList = {
  HomeTab: undefined;
  ScanTab: undefined;
  VideoTab: undefined;
  ARTab: undefined;
  ARStreamTab: undefined;
};
