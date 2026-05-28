import { useRef, useEffect, useState } from 'react';
import { View, Text, Image, Animated, StyleSheet, Dimensions } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { colors } from '../constants/theme';
import { getMarkerColor } from '../services/acneDetection';
import type { ScanResult } from '../types';

const { width: W } = Dimensions.get('window');

interface MarkerData {
  type: 'red' | 'black' | 'yellow';
  x: number;
  y: number;
  label: string;
}

function VideoMarker({ marker, delay }: { marker: MarkerData; delay: number }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.3)).current;

  const colorMap = { red: '#E87A7A', black: '#2D1B2E', yellow: '#F4C77A' };
  const color = colorMap[marker.type];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 5, tension: 100, delay, useNativeDriver: true }),
    ]).start();
  }, [delay, opacity, scale]);

  return (
    <View style={[st.marker, { left: marker.x - 12, top: marker.y - 12, borderColor: color }]}>
      <Animated.View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color, opacity, transform: [{ scale }] }} />
      <Animated.Text style={{ position: 'absolute', top: 14, fontSize: 9, fontWeight: '700', color, opacity }}>{marker.label}</Animated.Text>
    </View>
  );
}

export default function VideoAnalysisView({ videoUri, result }: { videoUri: string; result: ScanResult }) {
  const player = useVideoPlayer(videoUri, p => { p.loop = true; });
  const videoW = W - 48;
  const videoH = videoW * 0.5625;
  const marginX = 24;
  const marginY = 24;

  const markers: MarkerData[] = [];
  result.acneDetections.forEach((a, i) => {
    const color = getMarkerColor(a.type);
    const typeLabel = a.type.replace('heads', '').replace('ules', '').replace('ids', '').replace('ust', '.');
    for (let j = 0; j < Math.min(a.count, 4); j++) {
      markers.push({
        type: color,
        x: marginX + (i * 30) + (j * 20) + Math.random() * (videoW * 0.5 - marginX * 2),
        y: marginY + (i * 25) + (j * 15) + Math.random() * (videoH * 0.4 - marginY * 2),
        label: `${typeLabel} ×${a.count}`,
      });
    }
  });

  return (
    <View style={st.container}>
      <View style={st.videoWrap}>
        <VideoView
          player={player}
          style={{ width: videoW, height: videoH }}
          contentFit="contain"
          nativeControls={true}
        />
        <View style={st.markersLayer}>
          {markers.map((m, i) => (
            <VideoMarker key={i} marker={m} delay={i * 150 + 300} />
          ))}
        </View>
      </View>
      <View style={st.legend}>
        <View style={st.legendItem}>
          <View style={[st.legendDot, { backgroundColor: '#E87A7A' }]} />
          <Text style={st.legendText}>Inflamed acne</Text>
        </View>
        <View style={st.legendItem}>
          <View style={[st.legendDot, { backgroundColor: '#2D1B2E' }]} />
          <Text style={st.legendText}>Blackheads</Text>
        </View>
        <View style={st.legendItem}>
          <View style={[st.legendDot, { backgroundColor: '#F4C77A' }]} />
          <Text style={st.legendText}>Dry/rough areas</Text>
        </View>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  container: { marginBottom: 12 },
  videoWrap: { borderRadius: 16, overflow: 'hidden', position: 'relative', backgroundColor: '#000' },
  markersLayer: { position: 'absolute', inset: 0 },
  marker: { position: 'absolute', width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: colors.textLight },
});
