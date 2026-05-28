import React, { useRef, useEffect } from 'react';
import { View, Text, Animated, Easing, StyleSheet } from 'react-native';
import Svg, { Path, G, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { colors } from '../constants/theme';

interface FaceOverlayProps {
  faceBounds?: { x: number; y: number; width: number; height: number };
  landmarks?: { x: number; y: number }[];
  scanPoints?: { x: number; y: number; severity: 'low' | 'medium' | 'high' }[];
  size: { width: number; height: number };
  isStable?: boolean;
  showInstructions?: boolean;
}

const severityColors = { low: '#7BC4A0', medium: '#F4C77A', high: '#E87A7A' };

function OvalFrame({ size }: { size: { width: number; height: number } }) {
  const cx = size.width / 2;
  const cy = size.height / 2;
  const rx = size.width * 0.3;
  const ry = size.height * 0.4;

  const bgPath = [
    `M 0 0 L ${size.width} 0 L ${size.width} ${size.height} L 0 ${size.height} Z`,
    `M ${cx - rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx - rx} ${cy}`,
  ].join(' ');

  const ovalPath = `M ${cx - rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx - rx} ${cy}`;

  return (
    <Svg width={size.width} height={size.height} style={{ position: 'absolute' }}>
      <Path d={bgPath} fill="rgba(0,0,0,0.35)" fillRule="evenodd" />
      <Path d={ovalPath} fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth={1.5} />
      <G>
        <Path d={`M ${cx - rx + 16} ${cy - ry} L ${cx - rx} ${cy - ry} L ${cx - rx} ${cy - ry + 16}`} fill="none" stroke="#FF6B8A" strokeWidth={3} strokeLinecap="round" />
        <Path d={`M ${cx + rx - 16} ${cy - ry} L ${cx + rx} ${cy - ry} L ${cx + rx} ${cy - ry + 16}`} fill="none" stroke="#FF6B8A" strokeWidth={3} strokeLinecap="round" />
        <Path d={`M ${cx - rx + 16} ${cy + ry} L ${cx - rx} ${cy + ry} L ${cx - rx} ${cy + ry - 16}`} fill="none" stroke="#FF6B8A" strokeWidth={3} strokeLinecap="round" />
        <Path d={`M ${cx + rx - 16} ${cy + ry} L ${cx + rx} ${cy + ry} L ${cx + rx} ${cy + ry - 16}`} fill="none" stroke="#FF6B8A" strokeWidth={3} strokeLinecap="round" />
      </G>
    </Svg>
  );
}

function ScanningArc({ size }: { size: { width: number; height: number } }) {
  const anim = useRef(new Animated.Value(0)).current;
  const cx = size.width / 2;
  const cy = size.height / 2;
  const rx = size.width * 0.31;
  const ry = size.height * 0.41;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(anim, { toValue: 1, duration: 2000, easing: Easing.linear, useNativeDriver: false })
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  const scanY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [cy - ry - 4, cy + ry + 4],
  });

  return (
    <View style={{ position: 'absolute', left: cx - rx, top: 0, width: rx * 2 }}>
      <Animated.View style={[s.scanLine, { transform: [{ translateY: scanY }] }]} />
    </View>
  );
}

export default function FaceOverlay({ faceBounds, landmarks, scanPoints, size, isStable = false, showInstructions = true }: FaceOverlayProps) {
  return (
    <View style={{ position: 'absolute', inset: 0 }}>
      <OvalFrame size={size} />
      <ScanningArc size={size} />

      {showInstructions && (
        <View style={s.instructionsOverlay}>
          <View style={s.faceIcon}>
            <View style={s.faceOval} />
            <View style={s.eyesRow}>
              <View style={s.eyeDot} />
              <View style={s.eyeDot} />
            </View>
            <View style={s.mouthLine} />
          </View>
          <Text style={s.instructionTitle}>
            {isStable ? 'Face Detected!' : 'Align Your Face'}
          </Text>
          <Text style={s.instructionDesc}>
            {isStable
              ? 'Hold still — capturing...'
              : 'Position your face inside the oval frame'}
          </Text>
        </View>
      )}

      {landmarks?.map((point, i) => (
        <View
          key={`lm-${i}`}
          style={{
            position: 'absolute', left: point.x - 3, top: point.y - 3,
            width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.8)',
          }}
        />
      ))}

      {scanPoints?.map((point, i) => (
        <View
          key={`sp-${i}`}
          style={{
            position: 'absolute', left: point.x - 8, top: point.y - 8,
            width: 16, height: 16, borderRadius: 8, borderWidth: 2,
            borderColor: severityColors[point.severity],
            backgroundColor: severityColors[point.severity] + '30',
          }}
        />
      ))}

      {faceBounds && (
        <View
          style={{
            position: 'absolute', left: faceBounds.x, top: faceBounds.y,
            width: faceBounds.width, height: faceBounds.height,
            borderRadius: 16, borderWidth: 2, borderColor: isStable ? '#7BC4A0' : '#FF6B8A',
          }}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  scanLine: {
    height: 2,
    backgroundColor: '#FF6B8A',
    opacity: 0.6,
    shadowColor: '#FF6B8A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 4,
  },
  instructionsOverlay: {
    position: 'absolute',
    bottom: 160,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  faceIcon: {
    width: 48,
    height: 56,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  faceOval: { width: 32, height: 40, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  eyesRow: { flexDirection: 'row', gap: 10, marginTop: -30 },
  eyeDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.6)' },
  mouthLine: { width: 12, height: 2, borderRadius: 1, backgroundColor: 'rgba(255,255,255,0.4)', marginTop: 6 },
  instructionTitle: { fontSize: 16, fontWeight: '700', color: '#fff', textAlign: 'center', marginBottom: 4 },
  instructionDesc: { fontSize: 13, color: 'rgba(255,255,255,0.7)', textAlign: 'center' },
});
