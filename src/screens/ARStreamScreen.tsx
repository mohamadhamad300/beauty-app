import { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, Pressable, Image, Dimensions,
} from 'react-native';
import { Camera, useCameraDevice, useCameraPermission, usePhotoOutput, CommonResolutions } from 'react-native-vision-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Wifi, WifiOff, Send } from 'lucide-react-native';
import * as FileSystem from 'expo-file-system';
import { colors } from '../constants/theme';
import { connectARServer, sendFrame, disconnectARServer } from '../services/arWebSocket';

const { width: SCREEN_W } = Dimensions.get('window');
const CAM_H = SCREEN_W * 4 / 3;
const CAPTURE_INTERVAL = 600;

type ServerStatus = 'idle' | 'connecting' | 'connected' | 'error';

export default function ARStreamScreen() {
  const insets = useSafeAreaInsets();
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('front');
  const photoOutput = usePhotoOutput({
    targetResolution: CommonResolutions.FHD_4_3,
    qualityPrioritization: 'speed',
    quality: 0.3,
  });
  const [serverStatus, setServerStatus] = useState<ServerStatus>('idle');
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [camError, setCamError] = useState<string | null>(null);
  const [serverAddress, setServerAddress] = useState('ws://10.0.0.23:4001');
  const streamRef = useRef(false);
  const frameSent = useRef(0);
  const frameRcvd = useRef(0);
  const busyRef = useRef(false);
  const [stats, setStats] = useState('');

  const tick = useCallback(() => {
    frameRcvd.current += 1;
  }, []);

  const onFrame = useCallback((base64jpeg: string) => {
    setProcessedImage(`data:image/jpeg;base64,${base64jpeg}`);
    busyRef.current = false;
    tick();
  }, [tick]);

  const onStatus = useCallback((status: ServerStatus, msg?: string) => {
    setServerStatus(status);
    if (status === 'error') {
      setCamError(msg || null);
    }
  }, []);

  const captureOne = useCallback(async (): Promise<void> => {
    if (!streamRef.current || busyRef.current) return;
    busyRef.current = true;
    let timedOut = false;
    setTimeout(() => { if (!timedOut) busyRef.current = false; }, 3000);
    try {
      const photo = await photoOutput.capturePhoto({
        qualityPrioritization: 'speed',
        quality: 0.3,
        enableShutterSound: false,
      }, {});
      const photoPath = await photo.saveToTemporaryFileAsync();
      const base64 = await FileSystem.readAsStringAsync(photoPath, {
        encoding: FileSystem.EncodingType.Base64,
      });
      photo.dispose();
      frameSent.current += 1;
      sendFrame(base64);
      setStats(`→${frameSent.current}  ←${frameRcvd.current}`);
    } catch (e: any) {
      timedOut = true;
      busyRef.current = false;
      if (streamRef.current) {
        setCamError(`Capture error: ${e.message}`);
      }
    }
  }, [photoOutput]);

  const startStream = useCallback(async () => {
    setCamError(null);
    setServerStatus('connecting');
    streamRef.current = true;
    frameSent.current = 0;
    frameRcvd.current = 0;
    setStats('');

    connectARServer(serverAddress, onFrame, onStatus);

    await new Promise((r) => setTimeout(r, 1000));

    const loop = async () => {
      if (!streamRef.current) return;
      await captureOne();
      if (streamRef.current) {
        setTimeout(loop, CAPTURE_INTERVAL);
      }
    };
    loop();
  }, [serverAddress, photoOutput, onFrame, onStatus, captureOne]);

  const stopStream = useCallback(() => {
    streamRef.current = false;
    busyRef.current = false;
    disconnectARServer();
    setServerStatus('idle');
  }, []);

  useEffect(() => {
    return () => {
      streamRef.current = false;
      busyRef.current = false;
      disconnectARServer();
    };
  }, []);

  if (!hasPermission) {
    return (
      <View style={[s.container, { paddingTop: insets.top }]}>
        <Text style={s.msg}>Camera access required</Text>
        <Pressable style={s.btn} onPress={requestPermission}>
          <Text style={s.btnText}>Grant Permission</Text>
        </Pressable>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={[s.container, { paddingTop: insets.top }]}>
        <Text style={s.msg}>No front camera</Text>
      </View>
    );
  }

  const isStreaming = serverStatus === 'connected' || serverStatus === 'connecting';
  const statusColor = serverStatus === 'connected' ? '#4CAF50' : serverStatus === 'connecting' ? '#FFC107' : serverStatus === 'error' ? '#F44336' : '#888';

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Text style={s.title}>AR Stream Test</Text>
        <View style={s.statusRow}>
          <View style={[s.statusDot, { backgroundColor: statusColor }]} />
          <Text style={s.statusText}>{serverStatus}</Text>
        </View>
      </View>

      <View style={s.camWrap}>
        <Camera
          style={{ width: SCREEN_W, height: CAM_H }}
          device={device}
          isActive={true}
          outputs={[photoOutput]}
          onError={(e) => setCamError(e.message)}
        />
        {processedImage && (
          <Image
            source={{ uri: processedImage }}
            style={[StyleSheet.absoluteFill, { width: SCREEN_W, height: CAM_H }]}
            resizeMode="contain"
          />
        )}
      </View>

      {camError && (
        <View style={s.errorBox}>
          <Text style={s.errorText}>{camError}</Text>
        </View>
      )}

      <View style={s.controls}>
        {!isStreaming ? (
          <Pressable style={s.testBtn} onPress={startStream}>
            <Send color="#fff" size={20} />
            <Text style={s.testBtnText}>Test AR Server</Text>
          </Pressable>
        ) : (
          <Pressable style={[s.testBtn, s.stopBtn]} onPress={stopStream}>
            <WifiOff color="#fff" size={20} />
            <Text style={s.testBtnText}>Disconnect</Text>
          </Pressable>
        )}
        {stats ? <Text style={s.framesText}>Sent {stats}</Text> : null}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a1a' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#222',
  },
  title: { color: '#fff', fontSize: 18, fontWeight: '700' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusText: { color: '#aaa', fontSize: 13, textTransform: 'capitalize' },
  camWrap: { width: SCREEN_W, height: CAM_H, position: 'relative' },
  errorBox: { backgroundColor: '#3a1a1a', padding: 10, margin: 8, borderRadius: 8 },
  errorText: { color: '#F44336', fontSize: 13 },
  controls: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 20 },
  testBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary,
    paddingVertical: 16, paddingHorizontal: 32, borderRadius: 14, gap: 10,
  },
  stopBtn: { backgroundColor: '#D32F2F' },
  testBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  framesText: { color: '#888', fontSize: 13 },
  msg: { color: '#fff', fontSize: 16 },
  btn: { backgroundColor: colors.primary, paddingVertical: 14, paddingHorizontal: 32, borderRadius: 12, marginTop: 20 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
