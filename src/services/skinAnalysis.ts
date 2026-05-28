import type { ScanResult, SkinConcern, AcneDetection, SkinType } from '../types';
import { analyzeAcne } from './acneDetection';
import { calculateSeverity, classifySkinType, generateSkinToneHex } from './severityRating';

const CONCERN_TYPES = ['dryness', 'oiliness', 'redness', 'wrinkles', 'dark_spots'] as const;

const CONCERN_AREAS = [
  'T-zone (forehead & nose)', 'Cheeks', 'Chin & jawline',
  'Under eyes', 'Around mouth', 'Nose area', 'Temple area',
];

const RECOMMENDATIONS: Record<string, string[]> = {
  acne: [
    'Use a gentle salicylic acid cleanser twice daily',
    'Apply benzoyl peroxide spot treatment on active breakouts',
    'Incorporate a niacinamide serum to regulate oil production',
    'Avoid heavy, pore-clogging moisturizers',
  ],
  dryness: [
    'Use a hyaluronic acid serum on damp skin',
    'Apply a rich ceramide moisturizer morning and night',
    'Avoid hot water when cleansing your face',
    'Use a humidifier in dry environments',
  ],
  oiliness: [
    'Use a gel-based cleanser with salicylic acid',
    'Apply a lightweight, oil-free moisturizer',
    'Use blotting papers throughout the day',
    'Incorporate a clay mask 2-3 times per week',
  ],
  redness: [
    'Use a gentle, fragrance-free cleanser',
    'Apply a soothing cream with centella asiatica',
    'Avoid harsh exfoliants and physical scrubs',
    'Use SPF 50+ mineral sunscreen daily',
  ],
  wrinkles: [
    'Apply a retinol serum at night',
    'Use a peptide moisturizer to support collagen',
    'Always wear SPF 50+ to prevent further damage',
    'Consider a vitamin C serum for antioxidant protection',
  ],
  dark_spots: [
    'Use a vitamin C serum in the morning',
    'Apply niacinamide to fade hyperpigmentation',
    'Use SPF 50+ consistently to prevent darkening',
    'Consider azelaic acid for stubborn spots',
  ],
};

const SKIN_TYPE_RECS: Record<SkinType, string[]> = {
  oily: [
    'Use a mattifying sunscreen SPF 50',
    'Try a sulfur mask once a week',
    'Avoid heavy oils like coconut oil',
  ],
  dry: [
    'Layer hydrating toner before moisturizer',
    'Use a cream cleanser instead of foam',
    'Apply squalane oil to lock in moisture',
  ],
  combination: [
    'Use a balancing toner for T-zone',
    'Apply rich cream on cheeks, gel on forehead',
    'Use a gentle enzyme exfoliant weekly',
  ],
  normal: [
    'Maintain your balanced routine',
    'Use a broad-spectrum SPF 30+ daily',
    'Exfoliate gently once a week',
  ],
  sensitive: [
    'Patch test all new products',
    'Use a barrier repair moisturizer',
    'Avoid fragrance, alcohol, and essential oils',
  ],
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

function pickRandomN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function generateConcerns(acneCount: number): SkinConcern[] {
  const concerns: SkinConcern[] = [];
  const numConcerns = randomInt(1, 3);
  const selected = pickRandomN([...CONCERN_TYPES], numConcerns);
  for (const type of selected) {
    concerns.push({
      type,
      severity: randomFloat(0, 1) > 0.6 ? 'high' : randomFloat(0, 1) > 0.4 ? 'medium' : 'low',
      area: pickRandom(CONCERN_AREAS),
    });
  }
  return concerns;
}

function generateConditionSummary(severity: string, detections: AcneDetection[], concerns: SkinConcern[], skinType: SkinType): string {
  const totalAcne = detections.reduce((s, d) => s + d.count, 0);
  const concernLabels = concerns.map(c => c.type.replace('_', ' ')).join(', ');
  const typeLabel = skinType.charAt(0).toUpperCase() + skinType.slice(1);

  let base = `Your skin type appears to be **${typeLabel}**. `;
  if (severity === 'severe') {
    base += `Your skin shows significant concern with ${totalAcne} detected lesions.`;
  } else if (severity === 'moderate') {
    base += `Your skin has ${totalAcne} visible spots with noticeable ${concernLabels || 'texture changes'}.`;
  } else {
    base += `Your skin is in good condition with minor ${concernLabels || 'imperfections'}.`;
  }
  if (concernLabels) base += ` Additional concerns: ${concernLabels}.`;
  return base;
}

function generateTip(detections: AcneDetection[], concerns: SkinConcern[]): string {
  const hasAcne = detections.length > 0;
  const hasOiliness = concerns.some(c => c.type === 'oiliness');
  const hasDryness = concerns.some(c => c.type === 'dryness');
  const hasRedness = concerns.some(c => c.type === 'redness');

  if (hasAcne) return 'Avoid touching your face throughout the day. Use a salicylic acid cleanser to keep pores clear.';
  if (hasOiliness) return 'Blot excess oil with paper sheets and use a lightweight gel moisturizer.';
  if (hasDryness) return 'Apply hyaluronic acid serum on damp skin and follow with a ceramide moisturizer.';
  if (hasRedness) return 'Use a soothing centella asiatica cream and avoid harsh exfoliants.';
  return 'Always wear SPF 50+ sunscreen daily to protect your skin barrier.';
}

function generateRecommendations(acneTypes: string[], concerns: SkinConcern[], skinType: SkinType): string[] {
  const recs: string[] = [];

  for (const type of acneTypes) {
    if (RECOMMENDATIONS.acne) recs.push(...pickRandomN(RECOMMENDATIONS.acne, 2));
  }

  for (const concern of concerns) {
    const concernRecs = RECOMMENDATIONS[concern.type];
    if (concernRecs) recs.push(...pickRandomN(concernRecs, 1));
  }

  const skinTypeRecs = SKIN_TYPE_RECS[skinType];
  if (skinTypeRecs) recs.push(...pickRandomN(skinTypeRecs, 1));

  return recs.slice(0, 6);
}

export async function runSkinAnalysis(imageUri?: string, imageBase64?: string): Promise<ScanResult> {
  const acneDetections = await analyzeAcne({ imageUri, imageBase64 });
  const concerns = generateConcerns(acneDetections.length);
  const skinHealth = Math.max(30, Math.min(98, randomInt(55, 95) - acneDetections.length * 3 - concerns.length * 2));
  const severity = calculateSeverity({ skinHealth, acneDetections, concerns });
  const skinType = classifySkinType(concerns, acneDetections);
  const skinToneHex = generateSkinToneHex();
  const acneTypes = acneDetections.map(a => a.type);
  const recommendations = generateRecommendations(acneTypes, concerns, skinType);
  const conditionSummary = generateConditionSummary(severity, acneDetections, concerns, skinType);
  const tip = generateTip(acneDetections, concerns);

  return {
    timestamp: Date.now(),
    skinHealth,
    severity,
    acneDetections,
    concerns,
    recommendations,
    conditionSummary,
    tip,
    skinType,
    skinToneHex,
  };
}
