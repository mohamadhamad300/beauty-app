import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, G, Rect, Defs, LinearGradient, Stop } from 'react-native-svg';
import { colors } from '../constants/theme';

const SIZE = 200;

function FaceOutline() {
  return (
    <Svg width={SIZE} height={SIZE * 1.15} viewBox="0 0 200 230">
      <Defs>
        <LinearGradient id="skinGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FDE8E8" />
          <Stop offset="1" stopColor="#F5D0D0" />
        </LinearGradient>
      </Defs>

      {/* Face oval */}
      <Path
        d="M100 15 C145 15 180 45 180 95 C180 145 160 200 100 215 C40 200 20 145 20 95 C20 45 55 15 100 15Z"
        fill="url(#skinGrad)"
        stroke="#FF6B8A"
        strokeWidth={2.5}
        strokeDasharray="6,3"
      />

      {/* Eyes */}
      <Circle cx="72" cy="90" r="8" fill="#fff" stroke="#2D1B2E" strokeWidth={1.5} />
      <Circle cx="72" cy="90" r="3.5" fill="#2D1B2E" />
      <Circle cx="128" cy="90" r="8" fill="#fff" stroke="#2D1B2E" strokeWidth={1.5} />
      <Circle cx="128" cy="90" r="3.5" fill="#2D1B2E" />

      {/* Eyebrows */}
      <Path d="M60 75 Q72 68 84 75" fill="none" stroke="#2D1B2E" strokeWidth={2} strokeLinecap="round" />
      <Path d="M116 75 Q128 68 140 75" fill="none" stroke="#2D1B2E" strokeWidth={2} strokeLinecap="round" />

      {/* Nose */}
      <Path d="M100 98 Q108 110 105 120 Q100 125 95 120 Q92 110 100 98" fill="none" stroke="#D4A574" strokeWidth={1.5} />

      {/* Lips */}
      <Path d="M82 140 Q100 148 118 140" fill="none" stroke="#E87A7A" strokeWidth={2} strokeLinecap="round" />
      <Path d="M82 140 Q100 148 118 140 Q100 152 82 140" fill="#E87A7A" opacity={0.3} />

      {/* Corner brackets */}
      <G>
        <Path d="M18 40 L18 30 L28 30" fill="none" stroke="#7BC4A0" strokeWidth={2.5} strokeLinecap="round" />
        <Path d="M182 40 L182 30 L172 30" fill="none" stroke="#7BC4A0" strokeWidth={2.5} strokeLinecap="round" />
        <Path d="M18 195 L18 205 L28 205" fill="none" stroke="#7BC4A0" strokeWidth={2.5} strokeLinecap="round" />
        <Path d="M182 195 L182 205 L172 205" fill="none" stroke="#7BC4A0" strokeWidth={2.5} strokeLinecap="round" />
      </G>

      {/* Distance markers */}
      <G opacity={0.4}>
        <Path d="M40 25 L100 15" stroke="#8A7A8B" strokeWidth={1} strokeDasharray="3,2" />
        <Path d="M160 25 L100 15" stroke="#8A7A8B" strokeWidth={1} strokeDasharray="3,2" />
      </G>
    </Svg>
  );
}

export default function FaceGuideIllustration() {
  return (
    <View style={s.container}>
      <View style={s.illustrationCard}>
        <FaceOutline />
      </View>

      <View style={s.stepsContainer}>
        <View style={s.step}>
          <View style={[s.stepNum, { backgroundColor: colors.success }]}>
            <Text style={s.stepNumText}>1</Text>
          </View>
          <Text style={s.stepText}>Face the camera directly</Text>
        </View>
        <View style={s.step}>
          <View style={[s.stepNum, { backgroundColor: colors.warning }]}>
            <Text style={s.stepNumText}>2</Text>
          </View>
          <Text style={s.stepText}>Align your face inside the oval</Text>
        </View>
        <View style={s.step}>
          <View style={[s.stepNum, { backgroundColor: '#7BC4A0' }]}>
            <Text style={s.stepNumText}>3</Text>
          </View>
          <Text style={s.stepText}>Keep a neutral expression</Text>
        </View>
      </View>

      <View style={s.faceGuide}>
        <View style={s.guideRow}>
          <View style={s.guideItem}>
            <View style={[s.guideDot, { backgroundColor: '#7BC4A0' }]} />
            <Text style={s.guideText}>Correct</Text>
          </View>
          <View style={s.guideItem}>
            <View style={[s.guideDot, { backgroundColor: '#E87A7A' }]} />
            <Text style={s.guideText}>Too close</Text>
          </View>
          <View style={s.guideItem}>
            <View style={[s.guideDot, { backgroundColor: '#E87A7A' }]} />
            <Text style={s.guideText}>Too far</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { alignItems: 'center' },
  illustrationCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  stepsContainer: { width: '100%', gap: 8, marginBottom: 16 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepNum: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  stepText: { fontSize: 14, color: colors.text, flex: 1 },
  faceGuide: { backgroundColor: colors.surface, borderRadius: 12, padding: 12, width: '100%' },
  guideRow: { flexDirection: 'row', justifyContent: 'space-around' },
  guideItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  guideDot: { width: 10, height: 10, borderRadius: 5 },
  guideText: { fontSize: 12, color: colors.textLight },
});
