import { useRef, useEffect, useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { CameraView } from 'expo-camera';
import { Camera } from 'expo-camera';
import { RefreshCw, Camera as CameraIcon } from 'lucide-react-native';
import { colors } from '../constants/theme';

const { width: W, height: H } = Dimensions.get('window');

interface CameraScannerProps {
  onFrameCaptured?: (uri: string) => void;
  scanning?: boolean;
}

export default function CameraScanner({ onFrameCaptured, scanning }: CameraScannerProps) {
  const cameraRef = useRef<CameraView>(null);
  const [permission, setPermission] = useState<boolean | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facing, setFacing] = useState<'front' | 'back'>('front');
  const [mountKey, setMountKey] = useState(0);
  const capturedRef = useRef(false);

  useEffect(() => {
    (async () => {
      const { granted } = await Camera.requestCameraPermissionsAsync();
      setPermission(granted);
    })();
  }, [mountKey]);

  useEffect(() => {
    if (!cameraReady) {
      const timer = setTimeout(() => {
        if (!cameraReady && permission) {
          setCameraError('Camera did not start. Try switching camera or restarting.');
        }
      }, 15000);
      return () => clearTimeout(timer);
    }
  }, [cameraReady, permission]);

  const handleMountError = useCallback((event: { message: string }) => {
    setCameraError(event.message);
  }, []);

  const capture = useCallback(async () => {
    if (!onFrameCaptured) return;
    for (let i = 0; i < 5; i++) {
      if (cameraRef.current) {
        try {
          const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
          if (photo?.uri) {
            onFrameCaptured(photo.uri);
            return;
          }
        } catch {}
      }
      await new Promise(r => setTimeout(r, 200));
    }
  }, [onFrameCaptured]);

  useEffect(() => {
    if (scanning && !capturedRef.current && cameraReady) {
      capturedRef.current = true;
      const timer = setTimeout(capture, 1500);
      return () => clearTimeout(timer);
    }
    if (!scanning) capturedRef.current = false;
  }, [scanning, cameraReady, capture]);

  const retry = useCallback(() => {
    setCameraReady(false);
    setCameraError(null);
    setMountKey(k => k + 1);
  }, []);

  const toggleFacing = useCallback(() => {
    setFacing(f => (f === 'front' ? 'back' : 'front'));
    setCameraReady(false);
    setCameraError(null);
    setMountKey(k => k + 1);
  }, []);

  if (cameraError) {
    return (
      <View style={[s.flex, s.center]}>
        <CameraIcon size={48} color={colors.textMuted} />
        <Text style={s.errorTitle}>Camera Unavailable</Text>
        <Text style={s.errorDesc}>{cameraError}</Text>
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
          <Pressable style={s.btn} onPress={toggleFacing}>
            <RefreshCw size={16} color="#fff" />
            <Text style={s.btnText}> Switch Camera</Text>
          </Pressable>
          <Pressable style={s.btn} onPress={retry}>
            <Text style={s.btnText}>Retry</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (permission === false) {
    return (
      <View style={[s.flex, s.center]}>
        <Text style={s.permissionTitle}>Camera Access Needed</Text>
        <Text style={s.permissionDesc}>Allow camera access in settings to scan your skin.</Text>
        <Pressable style={s.btn} onPress={retry}>
          <Text style={s.btnText}>Check Permission</Text>
        </Pressable>
      </View>
    );
  }

  if (permission === null) {
    return (
      <View style={[s.flex, s.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={s.loadingText}>Requesting camera access...</Text>
      </View>
    );
  }

  return (
    <View style={s.flex}>
      <CameraView
        key={mountKey}
        ref={cameraRef}
        facing={facing}
        mode="picture"
        style={{ width: W, height: H }}
        active={true}
        onCameraReady={() => setCameraReady(true)}
        onMountError={handleMountError}
      />
      <Pressable style={s.flipBtn} onPress={toggleFacing}>
        <RefreshCw size={20} color="#fff" />
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, paddingHorizontal: 32 },
  permissionTitle: { fontSize: 20, fontWeight: '700', color: colors.text, textAlign: 'center', marginBottom: 12 },
  permissionDesc: { fontSize: 14, color: colors.textLight, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  errorTitle: { fontSize: 18, color: '#E87A7A', fontWeight: '700', marginTop: 16, marginBottom: 8 },
  errorDesc: { fontSize: 13, color: colors.textLight, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  loadingText: { color: colors.textLight, fontSize: 15, marginTop: 16 },
  btn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 999 },
  btnText: { fontWeight: '600', color: '#fff', fontSize: 14 },
  flipBtn: { position: 'absolute', bottom: 100, right: 24, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
});
