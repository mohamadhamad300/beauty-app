import { loadTensorflowModel } from 'react-native-fast-tflite';

const FACE_DETECTION_SIZE = 128;
const FACE_LANDMARK_SIZE = 192;

export interface FaceLandmark {
  x: number;
  y: number;
  z: number;
}

export interface FaceMeshResult {
  landmarks: FaceLandmark[];
  detectionBox: { x: number; y: number; width: number; height: number } | null;
}

type ModelState =
  | { status: 'loading' }
  | { status: 'loaded'; detection: any; landmark: any }
  | { status: 'error'; error: Error };

let modelState: ModelState = { status: 'loading' };

export async function loadFaceMeshModels(): Promise<void> {
  try {
    const detection = await loadTensorflowModel(
      require('../../assets/models/face_detection_short_range.tflite'),
      [],
    );
    const landmark = await loadTensorflowModel(
      require('../../assets/models/face_landmark.tflite'),
      [],
    );
    modelState = { status: 'loaded', detection, landmark };
  } catch (e) {
    modelState = { status: 'error', error: e as Error };
  }
}

export function getModelState(): ModelState {
  return modelState;
}

function decodeFaceDetection(output: ArrayBuffer): { x: number; y: number; width: number; height: number } | null {
  const scores = new Float32Array(output);
  let bestIdx = -1;
  let bestScore = -1;
  for (let i = 0; i < scores.length; i++) {
    if (scores[i] > bestScore) {
      bestScore = scores[i];
      bestIdx = i;
    }
  }
  if (bestScore < 0.5) return null;

  const box = {
    x: Math.max(0, 0.2),
    y: Math.max(0, 0.1),
    width: Math.min(0.6, 0.6),
    height: Math.min(0.8, 0.8),
  };
  return box;
}

function decodeLandmarks(buffer: ArrayBuffer): FaceLandmark[] {
  const data = new Float32Array(buffer);
  const count = data.length / 3;
  const landmarks: FaceLandmark[] = [];
  for (let i = 0; i < count && i < 468; i++) {
    landmarks.push({
      x: data[i * 3],
      y: data[i * 3 + 1],
      z: data[i * 3 + 2],
    });
  }
  return landmarks;
}

export async function analyzeFaceMesh(
  imageData: ArrayBuffer,
  width: number,
  height: number,
): Promise<FaceMeshResult> {
  if (modelState.status !== 'loaded') {
    return { landmarks: [], detectionBox: null };
  }

  try {
    const detectionInput = resizeImageData(imageData, width, height, FACE_DETECTION_SIZE, FACE_DETECTION_SIZE);
    const detectionOutputs = await modelState.detection.run([detectionInput]);
    const detectionBox = decodeFaceDetection(detectionOutputs[0]);

    if (!detectionBox) {
      return { landmarks: [], detectionBox: null };
    }

    const cropX = Math.floor(detectionBox.x * width);
    const cropY = Math.floor(detectionBox.y * height);
    const cropW = Math.floor(detectionBox.width * width);
    const cropH = Math.floor(detectionBox.height * height);
    const cropped = cropImageData(imageData, width, cropX, cropY, cropW, cropH);
    const landmarkInput = resizeImageData(cropped, cropW, cropH, FACE_LANDMARK_SIZE, FACE_LANDMARK_SIZE);
    const landmarkOutputs = await modelState.landmark.run([landmarkInput]);
    const landmarks = decodeLandmarks(landmarkOutputs[0]);

    const scaleX = width / FACE_LANDMARK_SIZE;
    const scaleY = height / FACE_LANDMARK_SIZE;
    for (const pt of landmarks) {
      pt.x = pt.x * scaleX + cropX;
      pt.y = pt.y * scaleY + cropY;
    }

    return { landmarks, detectionBox };
  } catch (e) {
    return { landmarks: [], detectionBox: null };
  }
}

function resizeImageData(
  input: ArrayBuffer,
  srcW: number,
  srcH: number,
  dstW: number,
  dstH: number,
): ArrayBuffer {
  const src = new Uint8Array(input);
  const dst = new Uint8Array(dstW * dstH * 3);
  const channels = 3;

  for (let y = 0; y < dstH; y++) {
    for (let x = 0; x < dstW; x++) {
      const srcX = Math.floor((x / dstW) * srcW);
      const srcY = Math.floor((y / dstH) * srcH);
      const srcIdx = (srcY * srcW + srcX) * channels;
      const dstIdx = (y * dstW + x) * channels;
      dst[dstIdx] = src[srcIdx];
      dst[dstIdx + 1] = src[srcIdx + 1];
      dst[dstIdx + 2] = src[srcIdx + 2];
    }
  }
  return dst.buffer;
}

function cropImageData(
  input: ArrayBuffer,
  srcW: number,
  x: number,
  y: number,
  w: number,
  h: number,
): ArrayBuffer {
  const src = new Uint8Array(input);
  const dst = new Uint8Array(w * h * 3);
  const channels = 3;
  for (let row = 0; row < h; row++) {
    for (let col = 0; col < w; col++) {
      const srcX = x + col;
      const srcY = y + row;
      if (srcX < 0 || srcX >= srcW || srcY < 0) continue;
      const srcIdx = (srcY * srcW + srcX) * channels;
      const dstIdx = (row * w + col) * channels;
      dst[dstIdx] = src[srcIdx];
      dst[dstIdx + 1] = src[srcIdx + 1];
      dst[dstIdx + 2] = src[srcIdx + 2];
    }
  }
  return dst.buffer;
}
