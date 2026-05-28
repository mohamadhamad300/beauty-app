declare module 'expo-asset' {
  export class Asset {
    uri: string;
    localUri: string | null;
    static fromModule(module: number): Asset;
    downloadAsync(): Promise<void>;
  }
}
