import type { AcneDetection, SeverityLevel, SkinConcern, SkinType } from '../types';

export interface SeverityInput {
  skinHealth: number;
  acneDetections: AcneDetection[];
  concerns: SkinConcern[];
}

export function calculateSeverity(input: SeverityInput): SeverityLevel {
  const { skinHealth, acneDetections, concerns } = input;
  const highConcerns = concerns.filter(c => c.severity === 'high').length;
  const severeAcne = acneDetections.filter(a => a.type === 'nodules' || a.type === 'cysts').length;
  const totalAcne = acneDetections.reduce((sum, a) => sum + a.count, 0);

  if (skinHealth < 50 || severeAcne > 1 || highConcerns >= 2 || totalAcne > 20) return 'severe';
  if (skinHealth < 75 || highConcerns > 0 || totalAcne > 8 || severeAcne > 0) return 'moderate';
  return 'mild';
}

export function classifySkinType(concerns: SkinConcern[], acneDetections: AcneDetection[]): SkinType {
  const hasOiliness = concerns.some(c => c.type === 'oiliness');
  const hasDryness = concerns.some(c => c.type === 'dryness');
  const hasAcne = acneDetections.length > 0;
  const hasRedness = concerns.some(c => c.type === 'redness');

  if (hasOiliness && hasDryness) return 'combination';
  if (hasOiliness || hasAcne) return 'oily';
  if (hasDryness) return 'dry';
  if (hasRedness) return 'sensitive';
  return 'normal';
}

export function generateSkinToneHex(): string {
  const tones = ['#F5D0B5', '#E8C5A5', '#D4A574', '#C49A6C', '#A67B5B', '#8D6B4A', '#6B4F3A', '#5C3D2E', '#3E2723', '#2C1810'];
  return tones[Math.floor(Math.random() * tones.length)];
}

export function getSeverityColor(severity: SeverityLevel): string {
  switch (severity) {
    case 'mild': return '#7BC4A0';
    case 'moderate': return '#F4C77A';
    case 'severe': return '#E87A7A';
  }
}

export function getSeverityLabel(severity: SeverityLevel): string {
  switch (severity) {
    case 'mild': return 'Mild';
    case 'moderate': return 'Moderate';
    case 'severe': return 'Severe';
  }
}
