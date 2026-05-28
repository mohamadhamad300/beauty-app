import { AIAnalysisResult } from './types';

const GEMINI_API = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

interface GeminiConfig {
  apiKey: string;
  timeoutMs?: number;
}

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text?: string;
      }>;
    };
    finishReason: string;
  }>;
}

const SYSTEM_PROMPT = `You are a professional dermatology AI assistant. Analyze the face image and return ONLY a valid JSON object (no markdown, no code blocks):

{
  "issues": [
    {"type": "blackhead|whitehead|papule|pustule|nodule|cyst|acne_scar|dark_spot|wrinkle|redness|pore", "confidence": 0.0-1.0}
  ],
  "skin_type": "Oily|Dry|Combination|Normal|Sensitive",
  "skin_tone_hex": "#hexcolor",
  "severity": 0-10,
  "confidence": 0.0-1.0
}

Skin tone must be one of: #F8D5C0 #E8B89D #D4956B #BF7A4A #A65D30 #8B4513 #6B3410 #4A2208 #3A1A06 #2A1004
Severity = 0 (perfect) to 10 (severe).
Issues must have at least one item if acne is visible, or empty array for clear skin.`;

export async function analyzeWithGemini(
  imageBase64: string,
  config: GeminiConfig,
): Promise<AIAnalysisResult> {
  const { apiKey, timeoutMs = 20000 } = config;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${GEMINI_API}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: SYSTEM_PROMPT },
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: imageBase64,
              },
            },
          ],
        }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 512,
        },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error ${response.status}: ${errText}`);
    }

    const data: GeminiResponse = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error('Empty response from Gemini API');
    }

    const cleanJson = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    return {
      issues: (parsed.issues ?? []).map((i: { type: string; confidence: number }) => ({
        type: i.type as AIAnalysisResult['issues'][0]['type'],
        confidence: i.confidence,
      })),
      skinType: parsed.skin_type ?? 'Normal',
      skinToneHex: parsed.skin_tone_hex ?? '#D4956B',
      severity: parsed.severity ?? 0,
      confidence: parsed.confidence ?? 0.5,
      backendUsed: 'google_gemini',
    };
  } finally {
    clearTimeout(timer);
  }
}
