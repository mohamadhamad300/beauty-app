declare module '@tensorflow/tfjs' {
  export function tensor3d(data: Float32Array, shape: [number, number, number]): any;
  export function expandDims(tensor: any, axis: number): any;
  export function squeeze(tensor: any): any;
  export function loadGraphModel(path: string): Promise<any>;
  export interface Tensor {
    dataSync(): Float32Array;
    shape: number[];
    dispose(): void;
  }
}

declare module '@tensorflow/tfjs-tflite' {
  export function loadGraphModel(path: string): Promise<any>;
}
