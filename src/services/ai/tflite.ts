import { AIAnalysisResult } from './types';

type TFLiteBackend = 'tflite_mobilenetv2' | 'tflite_modeld';

interface TFLiteConfig {
  modelPath: string;
  labelsPath?: string;
  inputSize?: number;
}

let modelConfig: TFLiteConfig | null = null;
let loadedModel: {
  predict: (pixels: Float32Array, inputSize: number) => Float32Array;
  dispose: () => void;
} | null = null;
let modelAvailable = false;

const ACNE_CLASSES = ['normal', 'whitehead', 'blackhead', 'papule', 'pustule', 'nodule', 'cyst'];

const SKIN_TONE_PALETTE = [
  '#F8D5C0', '#E8B89D', '#D4956B', '#BF7A4A', '#A65D30',
  '#8B4513', '#6B3410', '#4A2208', '#3A1A06', '#2A1004',
];

export function isModelAvailable(): boolean {
  return modelAvailable;
}

export async function loadTFLiteModel(config: TFLiteConfig): Promise<void> {
  modelConfig = config;
  loadedModel = null;
  modelAvailable = false;

  try {
    const tfjs = await import('@tensorflow/tfjs');
    const model = await (tfjs as any).loadGraphModel(config.modelPath);

    loadedModel = {
      predict: (pixels: Float32Array, inputSize: number) => {
        const input = (tfjs as any).tensor3d(pixels, [inputSize, inputSize, 3]);
        const batched = (tfjs as any).expandDims(input, 0);
        const output = (model as any).predict(batched);
        const squeezed = (tfjs as any).squeeze(output);
        const data = squeezed.dataSync() as Float32Array;
        input.dispose();
        batched.dispose();
        output.dispose();
        squeezed.dispose();
        return data;
      },
      dispose: () => model.dispose(),
    };

    modelAvailable = true;
    console.log('TFLite model loaded successfully');
  } catch (e) {
    console.warn('TFLite model not available:', e);
  }
}

async function loadAcneLabels(): Promise<string[]> {
  if (!modelConfig?.labelsPath) return ACNE_CLASSES;
  try {
    const response = await fetch(modelConfig.labelsPath);
    const text = await response.text();
    const labels = text.split('\n').map((l) => l.trim()).filter(Boolean);
    return labels.length >= 3 ? labels : ACNE_CLASSES;
  } catch {
    return ACNE_CLASSES;
  }
}

function preprocessImagePixels(
  pixels: number[],
  width: number,
  height: number,
  inputSize: number,
): Float32Array {
  const size = inputSize || 224;
  const result = new Float32Array(size * size * 3);
  const scaleX = width / size;
  const scaleY = height / size;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const srcX = Math.floor(x * scaleX);
      const srcY = Math.floor(y * scaleY);
      const srcIdx = (srcY * width + srcX) * 4;
      const dstIdx = (y * size + x) * 3;
      result[dstIdx] = pixels[srcIdx] / 255;
      result[dstIdx + 1] = pixels[srcIdx + 1] / 255;
      result[dstIdx + 2] = pixels[srcIdx + 2] / 255;
    }
  }
  return result;
}

export async function analyzeWithTFLite(
  imagePixels: number[],
  width: number,
  height: number,
  backend: TFLiteBackend,
): Promise<AIAnalysisResult> {
  if (!loadedModel) {
    throw new Error('TFLite not loaded. Call loadTFLiteModel first.');
  }

  const labels = await loadAcneLabels();
  const inputSize = modelConfig?.inputSize ?? 224;
  const input = preprocessImagePixels(imagePixels, width, height, inputSize);
  const output = loadedModel.predict(input, inputSize);

  const predictions: Array<{ index: number; score: number; label: string }> = [];
  for (let i = 0; i < Math.min(output.length, labels.length); i++) {
    predictions.push({ index: i, score: output[i], label: labels[i] });
  }

  const acneLabels = ['whitehead', 'blackhead', 'papule', 'pustule', 'nodule', 'cyst'];
  const issues = predictions
    .filter((p) => acneLabels.includes(p.label) && p.score > 0.3)
    .map((p) => ({
      type: p.label as AIAnalysisResult['issues'][0]['type'],
      confidence: Math.min(1, Math.round(p.score * 100) / 100),
    }));

  const normalScore = predictions.find((p) => p.label === 'normal')?.score ?? 0.5;
  let skinType = 'Normal';
  if (normalScore < 0.3 && issues.length > 0) {
    const types = issues.map((i) => i.type);
    if (types.includes('blackhead') || types.includes('whitehead')) skinType = 'Oily';
    else if (types.includes('nodule') || types.includes('cyst')) skinType = 'Combination';
    else if (types.includes('papule') || types.includes('pustule')) skinType = 'Sensitive';
    else skinType = 'Dry';
  }

  const severity = Math.min(10, Math.round(
    issues.reduce((sum, i) => sum + i.confidence, 0) / Math.max(issues.length, 1) * 8,
  ));

  const toneIdx = Math.min(
    Math.floor((1 - normalScore) * SKIN_TONE_PALETTE.length),
    SKIN_TONE_PALETTE.length - 1,
  );

  return {
    issues,
    skinType,
    skinToneHex: SKIN_TONE_PALETTE[Math.max(0, toneIdx)],
    severity,
    confidence: normalScore,
    backendUsed: backend,
  };
}
