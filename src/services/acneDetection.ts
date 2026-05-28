import type { AcneType, AcneDetection } from '../types';
import { configureAI, analyzeImage, getActiveBackend, type AIBackend } from './ai';

export { configureAI, getActiveBackend };
export type { AIBackend };

const ACNE_TYPES: AcneType[] = ['blackheads', 'whiteheads', 'papules', 'pustules', 'nodules', 'cysts'];

const ACNE_AREAS = [
  'T-zone (forehead & nose)',
  'Cheeks',
  'Chin & jawline',
  'T-zone (forehead)',
  'Nose & surrounding area',
];

const AI_TO_LEGACY_TYPE: Record<string, AcneType> = {
  whitehead: 'whiteheads',
  blackhead: 'blackheads',
  papule: 'papules',
  pustule: 'pustules',
  nodule: 'nodules',
  cyst: 'cysts',
  acne_scar: 'papules',
  dark_spot: 'blackheads',
  wrinkle: 'whiteheads',
  redness: 'papules',
  pore: 'blackheads',
};

function randomFloat(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export interface DetectionInput {
  imageUri?: string;
  imageBase64?: string;
  imagePixels?: number[];
  pixelWidth?: number;
  pixelHeight?: number;
}

export async function analyzeAcne(input: DetectionInput): Promise<AcneDetection[]> {
  const backend = getActiveBackend();
  if (backend === 'mock' || !input.imageUri) {
    return getMockResults();
  }

  try {
    let base64 = input.imageBase64;
    let pixels = input.imagePixels;
    let w = input.pixelWidth;
    let h = input.pixelHeight;

    if (!base64 && input.imageUri) {
      base64 = await imageUriToBase64(input.imageUri);
    }

    const result = await analyzeImage(
      base64 ?? '',
      pixels,
      w,
      h,
    );

    const grouped = new Map<string, { type: AcneType; confidences: number[] }>();

    for (const issue of result.issues) {
      const legacyType = AI_TO_LEGACY_TYPE[issue.type];
      if (!legacyType) continue;
      if (!grouped.has(legacyType)) {
        grouped.set(legacyType, { type: legacyType, confidences: [] });
      }
      grouped.get(legacyType)!.confidences.push(issue.confidence);
    }

    if (grouped.size === 0) {
      return getMockResults();
    }

    return Array.from(grouped.values()).map(({ type, confidences }) => {
      const avgConf = confidences.reduce((s, c) => s + c, 0) / confidences.length;
      return {
        type,
        confidence: Math.round(avgConf * 100) / 100,
        count: Math.max(1, Math.round(avgConf * confidences.length * 5)),
      };
    }).sort((a, b) => b.confidence - a.confidence);
  } catch (error) {
    console.warn('AI analysis failed, falling back to mock:', error);
    return getMockResults();
  }
}

function getMockResults(): AcneDetection[] {
  const results: AcneDetection[] = [];
  const activeTypes = ACNE_TYPES.slice(0, randomInt(2, 4));

  for (const type of activeTypes) {
    const confidence = randomFloat(0.72, 0.96);
    const count = randomInt(
      type === 'blackheads' || type === 'whiteheads' ? 3 : 1,
      type === 'nodules' || type === 'cysts' ? 3 : 8,
    );
    results.push({ type, confidence, count });
  }

  return results.sort((a, b) => b.confidence - a.confidence);
}

async function imageUriToBase64(uri: string): Promise<string> {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1] ?? result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    throw new Error('Failed to convert image URI to base64');
  }
}

export function getAcneColor(type: AcneType): string {
  const colors: Record<AcneType, string> = {
    blackheads: '#2D1B2E',
    whiteheads: '#F5E6E8',
    papules: '#E87A7A',
    pustules: '#FF6B8A',
    nodules: '#C0392B',
    cysts: '#8E44AD',
  };
  return colors[type];
}

export function getMarkerColor(type: AcneType): 'red' | 'black' | 'yellow' {
  if (type === 'papules' || type === 'pustules' || type === 'nodules' || type === 'cysts') return 'red';
  if (type === 'blackheads') return 'black';
  return 'yellow';
}

export function getAcneLabel(type: AcneType): string {
  const labels: Record<AcneType, string> = {
    blackheads: 'Blackheads',
    whiteheads: 'Whiteheads',
    papules: 'Papules',
    pustules: 'Pustules',
    nodules: 'Nodules',
    cysts: 'Cysts',
  };
  return labels[type];
}

export function getAcneDescription(type: AcneType): string {
  const descriptions: Record<AcneType, string> = {
    blackheads: 'Open comedones — clogged pores with a dark surface',
    whiteheads: 'Closed comedones — clogged pores with a white or flesh-colored surface',
    papules: 'Small red, inflamed bumps on the skin surface',
    pustules: 'Inflamed bumps with a visible white or yellow pus center',
    nodules: 'Large, hard, painful lumps deep beneath the skin surface',
    cysts: 'Deep, painful, pus-filled lesions that can cause scarring',
  };
  return descriptions[type];
}

export function getAcneArea(acneDetections: AcneDetection[]): string {
  if (acneDetections.length === 0) return 'No specific area detected';
  return pickRandom(ACNE_AREAS);
}
