import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { configureAI } from './src/services/acneDetection';

const VISION_KEY = process.env.EXPO_PUBLIC_GOOGLE_VISION_API_KEY ?? '';
const GEMINI_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';

export default function App() {
  useEffect(() => {
    if (VISION_KEY) {
      configureAI({ preferredBackend: 'google_vision', googleVision: { apiKey: VISION_KEY } });
    } else if (GEMINI_KEY) {
      configureAI({ preferredBackend: 'google_gemini', googleGemini: { apiKey: GEMINI_KEY } });
    }
  }, []);

  return (
    <SafeAreaProvider>
      <AppNavigator />
    </SafeAreaProvider>
  );
}
