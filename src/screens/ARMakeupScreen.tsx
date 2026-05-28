import { useState, useRef, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission, usePhotoOutput, usePreviewOutput, useObjectOutput } from 'react-native-vision-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Save, EyeOff } from 'lucide-react-native';
import { colors } from '../constants/theme';
import type { FaceZones } from '../services/faceDetection';
import { CommonResolutions } from 'react-native-vision-camera';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const CAM_H = SCREEN_W * 4 / 3;

type BrushTool = 'foundation' | 'blush' | 'lipstick' | 'eyeshadow';

interface MakeupLayer {
  id: string;
  zone: keyof FaceZones;
  color: string;
  opacity: number;
  brush: BrushTool;
}

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

function boundingBoxToZones(box: { x: number; y: number; width: number; height: number }): FaceZones {
  const fx = box.x * SCREEN_W;
  const fy = box.y * CAM_H;
  const fw = box.width * SCREEN_W;
  const fh = box.height * CAM_H;

  return {
    leftEye: { x: fx + fw * 0.28, y: fy + fh * 0.25, w: 30, h: 20 },
    rightEye: { x: fx + fw * 0.68, y: fy + fh * 0.25, w: 30, h: 20 },
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
    leftEye: { x: fx + fw * 0.28, y: fy + fh * 0.25, w: 30, h: 20 },
    rightEye: { x: fx + fw * 0.68, y: fy + fh * 0.25, w: 30, h: 20 },
    lips: { x: fx + fw * 0.25, y: fy + fh * 0.68, w: fw * 0.5, h: fh * 0.12 },
    leftCheek: { x: fx + fw * 0.03, y: fy + fh * 0.35, w: fw * 0.22, h: fh * 0.22 },
    rightCheek: { x: fx + fw * 0.75, y: fy + fh * 0.35, w: fw * 0.22, h: fh * 0.22 },
    forehead: { x: fx + fw * 0.17, y: fy + fh * 0.03, w: fw * 0.66, h: fh * 0.22 },
    nose: { x: fx + fw * 0.38, y: fy + fh * 0.42, w: fw * 0.24, h: fh * 0.2 },
    chin: { x: fx + fw * 0.28, y: fy + fh * 0.82, w: fw * 0.44, h: fh * 0.15 },
  };
}

export default function ARMakeupScreen() {
  const insets = useSafeAreaInsets();
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('front');
  const previewOutput = usePreviewOutput();
  const photoOutput = usePhotoOutput({
    targetResolution: CommonResolutions.UHD_4_3,
    qualityPrioritization: 'speed',
    quality: 0.3,
  });
  const [faceZones, setFaceZones] = useState<FaceZones>(initialZones);

  const objOutput = useObjectOutput({
    types: ['face'],
    onObjectsScanned(objects) {
      const face = objects.find((o) => o.type === 'face');
      if (face) {
        setFaceZones(boundingBoxToZones(face.boundingBox));
      }
    },
  });

  const [activeBrush, setActiveBrush] = useState<BrushTool>('lipstick');
  const [activeColor, setActiveColor] = useState('#DC143C');
  const [layers, setLayers] = useState<MakeupLayer[]>([]);
  const [showPalette, setShowPalette] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const initDone = useRef(false);

  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;
    setTimeout(() => {
      setLayers(makeAllLayers(initialZones()));
    }, 200);
  }, []);

  const makeAllLayers = (zones: FaceZones) => {
    const allBrushes: { brush: BrushTool; color: string }[] = [
      { brush: 'foundation', color: '#F4A460' },
      { brush: 'blush', color: '#FFB6C1' },
      { brush: 'lipstick', color: '#DC143C' },
      { brush: 'eyeshadow', color: '#C71585' },
    ];
    const newLayers: MakeupLayer[] = [];
    for (const { brush, color } of allBrushes) {
      for (const zone of BRUSH_TO_ZONE[brush]) {
        newLayers.push({ id: `${brush}-${zone}`, zone, color, opacity: 0.5, brush });
      }
    }
    return newLayers;
  };

  const handleBrushPress = (brush: BrushTool) => {
    setActiveBrush(brush);
    setShowPalette(false);
    const color = brush === 'lipstick' ? '#DC143C' :
      brush === 'blush' ? '#FFB6C1' :
      brush === 'foundation' ? '#F4A460' : '#C71585';
    setLayers((prev) => [
      ...prev.filter((l) => l.brush !== brush),
      ...BRUSH_TO_ZONE[brush].map((zone) => ({
        id: `${brush}-${zone}`, zone, color, opacity: 0.7, brush,
      })),
    ]);
  };

  const handleColorPress = (color: string) => {
    setActiveColor(color);
    setShowPalette(false);
    setLayers((prev) => [
      ...prev.filter((l) => l.brush !== activeBrush),
      ...BRUSH_TO_ZONE[activeBrush].map((zone) => ({
        id: `${activeBrush}-${zone}`, zone, color, opacity: 0.7, brush: activeBrush,
      })),
    ]);
  };

  const clearAll = () => setLayers([]);

  const getZoneStyle = (zone: keyof FaceZones) => {
    const z = faceZones[zone];
    if (!z) return {};
    return {
      position: 'absolute' as const,
      left: z.x, top: z.y, width: z.w, height: z.h,
      borderRadius: Math.min(z.w, z.h) * 0.3, opacity: 0.7,
    };
  };

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
          outputs={[previewOutput, photoOutput, objOutput]}
        />

        <View style={s.faceOverlay} pointerEvents="none">
          {layers.map((layer) => {
            const z = faceZones[layer.zone];
            if (!z) return null;
            return (
              <View key={layer.id} style={[getZoneStyle(layer.zone), { backgroundColor: layer.color }]} />
            );
          })}
          {Object.entries(faceZones).map(([name, z]) => (
            <View key={`z-${name}`} style={{
              position: 'absolute', left: z.x - 2, top: z.y - 2,
              width: z.w + 4, height: z.h + 4,
              borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.8)',
              borderRadius: Math.min(z.w, z.h) * 0.3,
              justifyContent: 'flex-start', alignItems: 'flex-end',
            }}>
              <Text style={{
                color: '#fff', fontSize: 8, fontWeight: '800',
                backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 3, paddingVertical: 1,
                borderTopLeftRadius: 4, borderBottomRightRadius: 4, overflow: 'hidden',
              }}>{name}</Text>
            </View>
          ))}
        </View>
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
  faceOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
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
