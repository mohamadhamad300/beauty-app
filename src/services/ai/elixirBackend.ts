import { AIAnalysisResult } from './types';

interface ElixirBackendConfig {
  baseUrl: string;
  apiKey?: string;
  timeoutMs?: number;
}

interface ElixirAnalyzeResponse {
  issues: Array<{ type: string; confidence: number }>;
  skin_type: string;
  skin_tone_hex: string;
  severity: number;
  confidence: number;
}

export async function analyzeWithElixirBackend(
  imageBase64: string,
  config: ElixirBackendConfig,
): Promise<AIAnalysisResult> {
  const { baseUrl, apiKey, timeoutMs = 15000 } = config;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (apiKey) headers['X-API-Key'] = apiKey;

    const response = await fetch(`${baseUrl}/api/analyze`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ image: imageBase64 }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Elixir backend error ${response.status}: ${errText}`);
    }

    const data: ElixirAnalyzeResponse = await response.json();

    return {
      issues: data.issues.map((i) => ({
        type: i.type as AIAnalysisResult['issues'][0]['type'],
        confidence: i.confidence,
      })),
      skinType: data.skin_type,
      skinToneHex: data.skin_tone_hex,
      severity: data.severity,
      confidence: data.confidence,
      backendUsed: 'elixir_backend',
    };
  } finally {
    clearTimeout(timer);
  }
}
