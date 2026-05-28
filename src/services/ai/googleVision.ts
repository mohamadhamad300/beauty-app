import { AIAnalysisResult } from './types';

const GOOGLE_VISION_API = 'https://vision.googleapis.com/v1/images:annotate';

interface GoogleVisionConfig {
  apiKey: string;
  timeoutMs?: number;
}

interface VisionResponse {
  responses: Array<{
    faceAnnotations?: Array<{
      detectionConfidence: number;
      landmarkingConfidence: number;
      joyLikelihood: string;
      sorrowLikelihood: string;
      angerLikelihood: string;
      surpriseLikelihood: string;
      underExposedLikelihood: string;
      blurryLikelihood: string;
      headwearLikelihood: string;
      landmarks?: Array<{ type: string; position: { x: number; y: number; z: number } }>;
    }>;
    labelAnnotations?: Array<{
      mid: string;
      description: string;
      score: number;
      topicality: number;
    }>;
  }>;
}

const likelyScore = (likelihood: string): number => {
  const map: Record<string, number> = {
    VERY_UNLIKELY: 0.05,
    UNLIKELY: 0.2,
    POSSIBLE: 0.5,
    LIKELY: 0.75,
    VERY_LIKELY: 0.95,
  };
  return map[likelihood] ?? 0.5;
};

function inferAcneIssues(labels: VisionResponse['responses'][0]['labelAnnotations'], faceAnnotations: VisionResponse['responses'][0]['faceAnnotations']): AIAnalysisResult['issues'] {
  const issues: AIAnalysisResult['issues'] = [];
  const labelText = (labels ?? []).map((l) => l.description.toLowerCase()).join(' ');

  const acneKeywords: Array<{ keyword: string; type: AIAnalysisResult['issues'][0]['type'] }> = [
    { keyword: 'acne', type: 'pustule' },
    { keyword: 'blackhead', type: 'blackhead' },
    { keyword: 'whitehead', type: 'whitehead' },
    { keyword: 'scar', type: 'acne_scar' },
    { keyword: 'wrinkle', type: 'wrinkle' },
    { keyword: 'pore', type: 'pore' },
    { keyword: 'redness', type: 'redness' },
    { keyword: 'inflammation', type: 'papule' },
    { keyword: 'cyst', type: 'cyst' },
    { keyword: 'nodule', type: 'nodule' },
    { keyword: 'dark spot', type: 'dark_spot' },
    { keyword: 'hyperpigmentation', type: 'dark_spot' },
  ];

  for (const { keyword, type } of acneKeywords) {
    if (labelText.includes(keyword)) {
      const found = (labels ?? []).find((l) => l.description.toLowerCase().includes(keyword));
      issues.push({
        type,
        confidence: found?.score ?? 0.7,
      });
    }
  }

  if (faceAnnotations && faceAnnotations.length > 0) {
    const face = faceAnnotations[0];
    const rednessScore = likelyScore(face.angerLikelihood);
    if (rednessScore > 0.4) {
      issues.push({ type: 'redness', confidence: rednessScore });
    }
  }

  return issues;
}

function inferSkinType(issues: AIAnalysisResult['issues']): string {
  const types = issues.map((i) => i.type);
  if (types.includes('blackhead') || types.includes('whitehead') || types.includes('pore')) return 'Oily';
  if (types.includes('wrinkle') || types.includes('redness')) return 'Dry';
  if (types.includes('pustule') || types.includes('nodule') || types.includes('cyst')) return 'Combination';
  if (types.includes('papule') && types.includes('redness')) return 'Sensitive';
  return 'Normal';
}

function inferSkinTone(faceAnnotations: VisionResponse['responses'][0]['faceAnnotations']): string {
  const tones = ['#F8D5C0', '#E8B89D', '#D4956B', '#BF7A4A', '#A65D30',
                 '#8B4513', '#6B3410', '#4A2208', '#3A1A06', '#2A1004'];
  if (!faceAnnotations || faceAnnotations.length === 0) return tones[3];
  const confidence = faceAnnotations[0].detectionConfidence;
  const idx = Math.min(Math.floor((1 - confidence) * tones.length), tones.length - 1);
  return tones[Math.max(0, idx)];
}

export async function analyzeWithGoogleVision(
  imageBase64: string,
  config: GoogleVisionConfig,
): Promise<AIAnalysisResult> {
  const { apiKey, timeoutMs = 15000 } = config;

  const body = {
    requests: [
      {
        image: { content: imageBase64 },
        features: [
          { type: 'FACE_DETECTION', maxResults: 5 },
          { type: 'LABEL_DETECTION', maxResults: 50 },
          { type: 'SAFE_SEARCH_DETECTION', maxResults: 1 },
        ],
      },
    ],
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${GOOGLE_VISION_API}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Google Vision API error ${response.status}: ${errText}`);
    }

    const data: VisionResponse = await response.json();
    const result = data.responses?.[0];

    if (!result) {
      throw new Error('Empty response from Google Vision API');
    }

    const faceAnnotations = result.faceAnnotations ?? [];
    const labels = result.labelAnnotations ?? [];
    const issues = inferAcneIssues(labels, faceAnnotations);

    const avgConfidence = issues.reduce((sum, i) => sum + i.confidence, 0) / Math.max(issues.length, 1);
    const severity = Math.min(10, Math.round(avgConfidence * 10));

    return {
      issues,
      skinType: inferSkinType(issues),
      skinToneHex: inferSkinTone(faceAnnotations),
      severity,
      confidence: faceAnnotations[0]?.detectionConfidence ?? 0.5,
      backendUsed: 'google_vision',
    };
  } finally {
    clearTimeout(timer);
  }
}
