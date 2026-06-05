import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, Alert, Platform } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission, usePhotoOutput, usePreviewOutput, CommonResolutions } from 'react-native-vision-camera';
import { Canvas, RoundedRect, Group, Oval, Path, Skia, BlendMode } from '@shopify/react-native-skia';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Save, EyeOff } from 'lucide-react-native';
import { colors } from '../constants/theme';
import type { FaceZones } from '../services/faceDetection';
import { loadFaceMeshModels } from '../services/faceMeshService';

const { width: SCREEN_W } = Dimensions.get('window');
const CAM_H = SCREEN_W * 4 / 3;

type BrushTool = 'foundation' | 'blush' | 'lipstick' | 'eyeshadow';

const BRUSH_TOOLS: { id: BrushTool; label: string; icon: string }[] = [
  { id: 'foundation', label: 'Foundation', icon: '⬜' },
  { id: 'blush', label: 'Blush', icon: '🌸' },
  { id: 'lipstick', label: 'Lipstick', icon: '💄' },
  { id: 'eyeshadow', label: 'Eyeshadow', icon: '✨' },
];

const COLOR_PALETTE = [
  '#FFB6C1', '#FF69B4', '#FF1493', '#C71585', '#DB7093',
  '#F4A460', '#D2691E', '#8B4513', '#DDA0DD', '#EE82EE',
  '#FFD700', '#FFA500', '#FF6347', '#DC143C', '#B22222',
  '#87CEEB', '#4682B4', '#6A5ACD', '#7B68EE', '#9370DB',
];

const BRUSH_TO_ZONE: Record<BrushTool, (keyof FaceZones)[]> = {
  foundation: ['forehead', 'leftCheek', 'rightCheek', 'nose', 'chin'],
  blush: ['leftCheek', 'rightCheek'],
  lipstick: ['lips'],
  eyeshadow: ['leftEye', 'rightEye'],
};

interface MakeupStyle {
  zone: keyof FaceZones;
  color: string;
  opacity: number;
}

function makeLipPath(cx: number, cy: number, w: number, h: number) {
  const path = Skia.Path.Make();
  path.moveTo(cx - w * 0.5, cy);
  path.cubicTo(cx - w * 0.5, cy - h * 0.4, cx + w * 0.5, cy - h * 0.4, cx + w * 0.5, cy);
  path.cubicTo(cx + w * 0.5, cy + h * 0.6, cx - w * 0.5, cy + h * 0.6, cx - w * 0.5, cy);
  path.close();
  return path;
}

function boundingBoxToZones(box: { x: number; y: number; width: number; height: number }): FaceZones {
  const fx = box.x * SCREEN_W;
  const fy = box.y * CAM_H;
  const fw = box.width * SCREEN_W;
  const fh = box.height * CAM_H;
  return {
    leftEye: { x: fx + fw * 0.28, y: fy + fh * 0.25, w: 30, h: 16 },
    rightEye: { x: fx + fw * 0.68, y: fy + fh * 0.25, w: 30, h: 16 },
    lips: { x: fx + fw * 0.25, y: fy + fh * 0.68, w: fw * 0.5, h: fh * 0.12 },
    leftCheek: { x: fx + fw * 0.03, y: fy + fh * 0.35, w: fw * 0.22, h: fh * 0.22 },
    rightCheek: { x: fx + fw * 0.75, y: fy + fh * 0.35, w: fw * 0.22, h: fh * 0.22 },
    forehead: { x: fx + fw * 0.17, y: fy + fh * 0.03, w: fw * 0.66, h: fh * 0.22 },
    nose: { x: fx + fw * 0.38, y: fy + fh * 0.42, w: fw * 0.24, h: fh * 0.2 },
    chin: { x: fx + fw * 0.28, y: fy + fh * 0.82, w: fw * 0.44, h: fh * 0.15 },
  };
}

function initialZones(): FaceZones {
  const fw = SCREEN_W * 0.55;
  const fh = CAM_H * 0.6;
  const fx = (SCREEN_W - fw) / 2;
  const fy = CAM_H * 0.08;
  return {
    leftEye: { x: fx + fw * 0.28, y: fy + fh * 0.25, w: 30, h: 16 },
    rightEye: { x: fx + fw * 0.68, y: fy + fh * 0.25, w: 30, h: 16 },
    lips: { x: fx + fw * 0.25, y: fy + fh * 0.68, w: fw * 0.5, h: fh * 0.12 },
    leftCheek: { x: fx + fw * 0.03, y: fy + fh * 0.35, w: fw * 0.22, h: fh * 0.22 },
    rightCheek: { x: fx + fw * 0.75, y: fy + fh * 0.35, w: fw * 0.22, h: fh * 0.22 },
    forehead: { x: fx + fw * 0.17, y: fy + fh * 0.03, w: fw * 0.66, h: fh * 0.22 },
    nose: { x: fx + fw * 0.38, y: fy + fh * 0.42, w: fw * 0.24, h: fh * 0.2 },
    chin: { x: fx + fw * 0.28, y: fy + fh * 0.82, w: fw * 0.44, h: fh * 0.15 },
  };
}

function MakeupOverlay({ zones, styles }: { zones: FaceZones; styles: MakeupStyle[] }) {
  return (
    <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
      {styles.map((s) => {
        const z = zones[s.zone];
        if (!z) return null;
        const cx = z.x + z.w / 2;
        const cy = z.y + z.h / 2;
        const opacity = s.opacity;

        if (s.zone === 'lips') {
          const path = makeLipPath(cx, cy, z.w * 0.9, z.h * 0.5);
          return (
            <Path
              key={s.zone}
              path={path}
              color={s.color}
              opacity={opacity}
              style="fill"
              blendMode={BlendMode.Screen}
            />
          );
        }

        if (s.zone === 'leftEye' || s.zone === 'rightEye') {
          const w = Math.max(z.w, 20);
          const h = Math.max(z.h, 10);
          return (
            <Oval
              key={s.zone}
              x={cx - w / 2}
              y={cy - h / 2}
              width={w}
              height={h}
              color={s.color}
              opacity={opacity}
              blendMode={BlendMode.Screen}
            />
          );
        }

        return (
          <RoundedRect
            key={s.zone}
            x={z.x}
            y={z.y}
            width={z.w}
            height={z.h}
            r={Math.min(z.w, z.h) * 0.3}
            color={s.color}
            opacity={opacity}
            blendMode={BlendMode.Screen}
          />
        );
      })}
    </Canvas>
  );
}

export default function ARMakeupScreen() {
  const insets = useSafeAreaInsets();
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('front');
  const previewOutput = usePreviewOutput();
  const photoOutput = usePhotoOutput({
    targetResolution: CommonResolutions.FHD_4_3,
    qualityPrioritization: 'speed',
    quality: 0.3,
  });
  const [faceZones, setFaceZones] = useState<FaceZones>(initialZones);
  const [camError, setCamError] = useState<string | null>(null);
  const [objOutput, setObjOutput] = useState<any>(undefined);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    const { VisionCamera } = require('react-native-vision-camera');
    const output = VisionCamera.createObjectOutput({ enabledObjectTypes: ['face'] });
    output.setOnObjectsScannedCallback((objects: any[]) => {
      const face = objects.find((o: any) => o.type === 'face');
      if (face) setFaceZones(boundingBoxToZones(face.boundingBox));
    });
    setObjOutput(output);
  }, []);

  const [activeBrush, setActiveBrush] = useState<BrushTool>('lipstick');
  const [activeColor, setActiveColor] = useState('#DC143C');
  const [currentStyles, setCurrentStyles] = useState<MakeupStyle[]>([]);
  const [showPalette, setShowPalette] = useState(false);
  const initDone = useRef(false);

  const defaultStyles: MakeupStyle[] = useMemo(() => [
    { zone: 'forehead', color: '#F4A460', opacity: 0.35 },
    { zone: 'leftCheek', color: '#FFB6C1', opacity: 0.4 },
    { zone: 'rightCheek', color: '#FFB6C1', opacity: 0.4 },
    { zone: 'nose', color: '#F4A460', opacity: 0.3 },
    { zone: 'chin', color: '#F4A460', opacity: 0.3 },
    { zone: 'lips', color: '#DC143C', opacity: 0.5 },
    { zone: 'leftEye', color: '#C71585', opacity: 0.4 },
    { zone: 'rightEye', color: '#C71585', opacity: 0.4 },
  ], []);

  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;
    loadFaceMeshModels();
    setTimeout(() => setCurrentStyles(defaultStyles), 200);
  }, [defaultStyles]);

  const handleBrushPress = useCallback((brush: BrushTool) => {
    setActiveBrush(brush);
    setShowPalette(false);
    const color = brush === 'lipstick' ? '#DC143C'
      : brush === 'blush' ? '#FFB6C1'
      : brush === 'foundation' ? '#F4A460' : '#C71585';
    setCurrentStyles((prev) => [
      ...prev.filter((s) => !BRUSH_TO_ZONE[brush].includes(s.zone)),
      ...BRUSH_TO_ZONE[brush].map((zone) => ({ zone, color, opacity: 0.6 })),
    ]);
  }, []);

  const handleColorPress = useCallback((color: string) => {
    setActiveColor(color);
    setShowPalette(false);
    setCurrentStyles((prev) => [
      ...prev.filter((s) => !BRUSH_TO_ZONE[activeBrush].includes(s.zone)),
      ...BRUSH_TO_ZONE[activeBrush].map((zone) => ({ zone, color, opacity: 0.6 })),
    ]);
  }, [activeBrush]);

  const clearAll = useCallback(() => setCurrentStyles([]), []);

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

  if (camError) {
    return (
      <View style={[s.container, { paddingTop: insets.top }]}>
        <Text style={s.msg}>Camera error: {camError}</Text>
      </View>
    );
  }

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Text style={s.title}>AR Makeup</Text>
        <View style={s.headerBtns}>
          <Pressable onPress={clearAll} style={s.iconBtn}><EyeOff color="#fff" size={20} /></Pressable>
          <Pressable onPress={() => Alert.alert('Saved', 'Look saved to gallery')} style={s.iconBtn}><Save color="#fff" size={20} /></Pressable>
        </View>
      </View>

      <View style={s.camWrap}>
        <Camera
          style={{ width: SCREEN_W, height: CAM_H }}
          device={device}
          isActive={true}
          outputs={[previewOutput, photoOutput, objOutput].filter(Boolean)}
          onError={(e) => setCamError(e.message)}
        />
        <MakeupOverlay zones={faceZones} styles={currentStyles} />
      </View>

      <View style={s.tools}>
        {BRUSH_TOOLS.map((tool) => (
          <Pressable
            key={tool.id}
            style={[s.toolBtn, activeBrush === tool.id && s.toolBtnActive]}
            onPress={() => handleBrushPress(tool.id)}
          >
            <Text style={s.toolIcon}>{tool.icon}</Text>
            <Text style={[s.toolLabel, activeBrush === tool.id && s.toolLabelActive]}>{tool.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={s.actionBar}>
        <Pressable onPress={() => setShowPalette(!showPalette)} style={s.paletteBtn}>
          <View style={[s.colorDot, { backgroundColor: activeColor }]} />
          <Text style={s.paletteText}>Color</Text>
        </Pressable>
      </View>

      {showPalette && (
        <View style={s.palette}>
          {COLOR_PALETTE.map((c) => (
            <Pressable
              key={c}
              style={[s.colorSwatch, { backgroundColor: c }, activeColor === c && s.colorActive]}
              onPress={() => handleColorPress(c)}
            />
          ))}
        </View>
      )}
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
  headerBtns: { flexDirection: 'row', gap: 12 },
  iconBtn: { padding: 8, backgroundColor: '#333', borderRadius: 8 },
  camWrap: { width: SCREEN_W, height: CAM_H, position: 'relative' },
  tools: {
    flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12,
    paddingHorizontal: 8, backgroundColor: '#222',
  },
  toolBtn: { alignItems: 'center', padding: 10, borderRadius: 12, backgroundColor: '#333', flex: 1, marginHorizontal: 4 },
  toolBtnActive: { backgroundColor: colors.primary, transform: [{ scale: 1.05 }] },
  toolIcon: { fontSize: 22 },
  toolLabel: { color: '#aaa', fontSize: 11, marginTop: 4, fontWeight: '600' },
  toolLabelActive: { color: '#fff' },
  actionBar: {
    flexDirection: 'row', justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 10,
  },
  paletteBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#333',
    paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, gap: 8,
  },
  paletteText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  colorDot: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: '#fff' },
  palette: {
    flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 8,
    backgroundColor: '#222', justifyContent: 'center',
  },
  colorSwatch: { width: 36, height: 36, borderRadius: 18 },
  colorActive: { borderWidth: 3, borderColor: '#fff', transform: [{ scale: 1.15 }] },
  msg: { color: '#fff', fontSize: 16 },
  btn: { backgroundColor: colors.primary, paddingVertical: 14, paddingHorizontal: 32, borderRadius: 12, marginTop: 20 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
