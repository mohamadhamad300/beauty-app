import { useRef, useEffect } from 'react';
import { View, Text, Image, Animated, StyleSheet, Dimensions } from 'react-native';
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

function PhotoMarker({ marker, delay }: { marker: MarkerData; delay: number }) {
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
    <View style={[st.marker, { left: marker.x - 12, top: marker.y - 12 }]}>
      <Animated.View style={[st.markerDot, { borderColor: color, backgroundColor: color + '22', opacity, transform: [{ scale }] }]} />
      <View style={{ position: 'absolute', bottom: -18, left: -20, right: -20, alignItems: 'center' }}>
        <Animated.Text style={{ fontSize: 10, fontWeight: '700', color, opacity }}>{marker.label}</Animated.Text>
      </View>
    </View>
  );
}

export default function PhotoAnalysisView({ photoUri, result }: { photoUri: string; result: ScanResult }) {
  const markers: MarkerData[] = [];
  const photoW = W - 48;
  const photoH = photoW * 1.1;
  const marginX = 24;
  const marginY = 24;

  result.acneDetections.forEach((a, i) => {
    const color = getMarkerColor(a.type);
    const typeLabel = a.type.replace('heads', '').replace('ules', '').replace('ids', '').replace('ust', '.');
    for (let j = 0; j < Math.min(a.count, 4); j++) {
      markers.push({
        type: color,
        x: marginX + (i * 30) + (j * 20) + Math.random() * (photoW * 0.5 - marginX * 2),
        y: marginY + (i * 25) + (j * 15) + Math.random() * (photoH * 0.4 - marginY * 2),
        label: `${typeLabel} ×${a.count}`,
      });
    }
  });

  return (
    <View style={st.container}>
      <View style={st.imageWrap}>
        <Image
          source={{ uri: photoUri }}
          style={st.photo}
          resizeMode="cover"
        />
        <View style={st.markersLayer}>
          {markers.map((m, i) => (
            <PhotoMarker key={i} marker={m} delay={i * 150 + 300} />
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
  imageWrap: { borderRadius: 16, overflow: 'hidden', position: 'relative', backgroundColor: '#000' },
  photo: { width: W - 48, height: (W - 48) * 1.1 },
  markersLayer: { position: 'absolute', inset: 0 },
  marker: { position: 'absolute', width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  markerDot: { width: 10, height: 10, borderRadius: 5, zIndex: 2 },
  markerRing: { position: 'absolute', width: 20, height: 20, borderRadius: 10, borderWidth: 2, opacity: 0.6 },
  markerLabel: { position: 'absolute', top: 14, fontSize: 9, fontWeight: '700', textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: colors.textLight },
});
