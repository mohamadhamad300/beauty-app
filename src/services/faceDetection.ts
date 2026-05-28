export interface FaceZones {
  leftEye: { x: number; y: number; w: number; h: number };
  rightEye: { x: number; y: number; w: number; h: number };
  lips: { x: number; y: number; w: number; h: number };
  leftCheek: { x: number; y: number; w: number; h: number };
  rightCheek: { x: number; y: number; w: number; h: number };
  forehead: { x: number; y: number; w: number; h: number };
  nose: { x: number; y: number; w: number; h: number };
  chin: { x: number; y: number; w: number; h: number };
}

export async function loadFaceModel(): Promise<boolean> {
  return true;
}

export async function detectFace(
  _imageBase64: string,
  photoWidth: number,
  photoHeight: number,
  displayWidth: number,
  displayHeight: number,
): Promise<FaceZones> {
  const sx = displayWidth / photoWidth;
  const sy = displayHeight / photoHeight;
  const fw = photoWidth * 0.55;
  const fh = photoHeight * 0.6;
  const fx = (photoWidth - fw) / 2;
  const fy = photoHeight * 0.08;

  const c = (x: number, y: number) => ({ x: x * sx, y: y * sy });

  return {
    leftEye: { ...c(fx + fw * 0.28, fy + fh * 0.25), w: 30, h: 20 },
    rightEye: { ...c(fx + fw * 0.68, fy + fh * 0.25), w: 30, h: 20 },
    lips: { ...c(fx + fw * 0.25, fy + fh * 0.68), w: fw * 0.5 * sx, h: fh * 0.12 * sy },
    leftCheek: { ...c(fx + fw * 0.03, fy + fh * 0.35), w: fw * 0.22 * sx, h: fh * 0.22 * sy },
    rightCheek: { ...c(fx + fw * 0.75, fy + fh * 0.35), w: fw * 0.22 * sx, h: fh * 0.22 * sy },
    forehead: { ...c(fx + fw * 0.17, fy + fh * 0.03), w: fw * 0.66 * sx, h: fh * 0.22 * sy },
    nose: { ...c(fx + fw * 0.38, fy + fh * 0.42), w: fw * 0.24 * sx, h: fh * 0.2 * sy },
    chin: { ...c(fx + fw * 0.28, fy + fh * 0.82), w: fw * 0.44 * sx, h: fh * 0.15 * sy },
  };
}
