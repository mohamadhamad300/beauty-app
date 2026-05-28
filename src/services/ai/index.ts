import { AIAnalysisResult, AIBackend } from './types';
import { analyzeWithGoogleVision } from './googleVision';
import { analyzeWithGemini } from './googleGemini';
import { analyzeWithTFLite, loadTFLiteModel, isModelAvailable } from './tflite';
import { analyzeWithElixirBackend } from './elixirBackend';

export type { AIAnalysisResult, AIBackend };
export { loadTFLiteModel, isModelAvailable };
export { analyzeWithGoogleVision, analyzeWithGemini, analyzeWithTFLite, analyzeWithElixirBackend };

export interface AIConfig {
  preferredBackend: AIBackend;
  googleVision?: { apiKey: string };
  googleGemini?: { apiKey: string };
  tflite?: { modelPath: string; labelsPath?: string };
  elixirBackend?: { baseUrl: string; apiKey?: string };
}

let config: AIConfig = { preferredBackend: 'mock' };

export function configureAI(cfg: AIConfig): void {
  config = cfg;

  if (cfg.tflite) {
    loadTFLiteModel({
      modelPath: cfg.tflite.modelPath,
      labelsPath: cfg.tflite.labelsPath,
    }).catch((e) => console.warn('Failed to preload TFLite model:', e));
  }
}

export function getActiveBackend(): AIBackend {
  return config.preferredBackend;
}

export async function analyzeImage(
  imageBase64: string,
  imagePixels?: number[],
  pixelWidth?: number,
  pixelHeight?: number,
): Promise<AIAnalysisResult> {
  const backend = config.preferredBackend;

  switch (backend) {
    case 'google_vision': {
      if (!config.googleVision?.apiKey) {
        throw new Error('Google Vision API key not configured');
      }
      return analyzeWithGoogleVision(imageBase64, {
        apiKey: config.googleVision.apiKey,
      });
    }

    case 'google_gemini': {
      if (!config.googleGemini?.apiKey) {
        throw new Error('Google Gemini API key not configured');
      }
      return analyzeWithGemini(imageBase64, {
        apiKey: config.googleGemini.apiKey,
      });
    }

    case 'tflite_mobilenetv2':
    case 'tflite_modeld': {
      if (!imagePixels || !pixelWidth || !pixelHeight) {
        throw new Error('Pixel data required for TFLite inference');
      }
      if (!config.tflite) {
        throw new Error('TFLite model not configured');
      }
      return analyzeWithTFLite(imagePixels, pixelWidth, pixelHeight, backend);
    }

    case 'elixir_backend': {
      if (!config.elixirBackend?.baseUrl) {
        throw new Error('Elixir backend URL not configured');
      }
      return analyzeWithElixirBackend(imageBase64, config.elixirBackend);
    }

    case 'mock':
    default: {
      throw new Error(
        'Mock backend selected. Call getMockResults() directly for mock data.',
      );
    }
  }
}
