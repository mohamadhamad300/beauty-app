import { useRef, useEffect } from 'react';
import { View, Text, Image, Animated, StyleSheet, Dimensions } from 'react-native';
import { Camera, ScanLine } from 'lucide-react-native';
import { colors } from '../constants/theme';
import { getSeverityColor } from '../services/severityRating';
import type { ScanResult } from '../types';

const { width: W } = Dimensions.get('window');

export default function DualCameraView({ photoUri, result }: { photoUri: string; result: ScanResult }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const sevColor = getSeverityColor(result.severity);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, [fadeAnim]);

  return (
    <View style={s.container}>
      {/* Title */}
      <View style={s.titleRow}>
        <Camera size={16} color={colors.primary} />
        <Text style={s.title}>Camera Capture</Text>
        <View style={[s.badge, { backgroundColor: sevColor + '20' }]}>
          <Text style={[s.badgeText, { color: sevColor }]}>{result.skinHealth}</Text>
        </View>
      </View>

      {/* Side-by-side view */}
      <View style={s.dualView}>
        {/* LEFT: Original photo */}
        <View style={s.viewPane}>
          <View style={s.paneLabel}>
            <Text style={s.paneLabelText}>Original</Text>
          </View>
          <Image source={{ uri: photoUri }} style={s.paneImage} resizeMode="cover" />
        </View>

        {/* RIGHT: Analyzed with markers */}
        <View style={s.viewPane}>
          <View style={[s.paneLabel, { backgroundColor: colors.primary }]}>
            <ScanLine size={10} color="#fff" />
            <Text style={[s.paneLabelText, { marginLeft: 3 }]}>Analysis</Text>
          </View>
          <Image source={{ uri: photoUri }} style={s.paneImage} resizeMode="cover" />
          <Animated.View style={[s.overlay, { opacity: fadeAnim }]}>
            {result.acneDetections.map((a, i) => {
              const color = a.type === 'blackheads' ? '#2D1B2E'
                : a.type === 'whiteheads' ? '#F5E6E8'
                : a.type === 'papules' || a.type === 'pustules' ? '#E87A7A'
                : '#8E44AD';
              const count = Math.min(a.count, 3);
              return Array.from({ length: count }, (_, j) => {
                const x = 10 + (i * 35) + (j * 20) + Math.random() * 30;
                const y = 20 + (i * 30) + (j * 15) + Math.random() * 40;
                return (
                  <View key={`${i}-${j}`} style={[s.marker, { left: x, top: y, borderColor: color }]}>
                    <View style={[s.markerInner, { backgroundColor: color }]} />
                  </View>
                );
              });
            })}
          </Animated.View>
        </View>
      </View>

      {/* Stats row */}
      <View style={s.statsRow}>
        <View style={s.stat}>
          <Text style={s.statValue}>{result.skinHealth}</Text>
          <Text style={s.statLabel}>Score</Text>
        </View>
        <View style={[s.statDivider]} />
        <View style={s.stat}>
          <Text style={[s.statValue, { color: sevColor }]}>{result.severity.toUpperCase()}</Text>
          <Text style={s.statLabel}>Severity</Text>
        </View>
        <View style={s.statDivider} />
        <View style={s.stat}>
          <Text style={s.statValue}>{result.acneDetections.reduce((s, d) => s + d.count, 0)}</Text>
          <Text style={s.statLabel}>Spots</Text>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 12,
    elevation: 1,
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  dualView: {
    flexDirection: 'row',
    gap: 8,
  },
  viewPane: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#000',
  },
  paneLabel: {
    position: 'absolute',
    top: 4,
    left: 4,
    zIndex: 5,
    backgroundColor: 'rgba(0,0,0,0.5)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  paneLabelText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
  },
  paneImage: {
    width: (W - 64) / 2,
    height: (W - 64) / 2 * 1.2,
  },
  overlay: {
    position: 'absolute',
    inset: 0,
  },
  marker: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.background,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  statLabel: {
    fontSize: 10,
    color: colors.textLight,
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.background,
  },
});
