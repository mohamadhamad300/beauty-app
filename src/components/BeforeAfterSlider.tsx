import { useRef, useState } from 'react';
import { View, Text, Image, StyleSheet, PanResponder, Dimensions } from 'react-native';
import { colors } from '../constants/theme';

const { width: W } = Dimensions.get('window');

export default function BeforeAfterSlider({ beforeUri }: { beforeUri: string }) {
  const [sliderX, setSliderX] = useState(W / 2 - 24);
  const imageW = W - 48;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_e, gs) => {
        const newX = Math.max(0, Math.min(imageW, gs.moveX - 24));
        setSliderX(newX);
      },
    })
  ).current;

  return (
    <View style={s.container}>
      <View style={[s.imageWrap, { width: imageW, height: imageW * 1.1 }]}>
        <Image source={{ uri: beforeUri }} style={[s.image, { width: imageW, height: imageW * 1.1 }]} resizeMode="cover" />

        <View style={[s.afterOverlay, { width: sliderX, height: imageW * 1.1, overflow: 'hidden' }]}>
          <View style={s.afterBadge}>
            <Text style={s.badgeText}>AI ANALYSIS</Text>
          </View>
        </View>

        <View style={[s.sliderLine, { left: sliderX, height: imageW * 1.1 }]}>
          <View style={s.sliderHandle} {...panResponder.panHandlers}>
            <View style={s.sliderArrow} />
            <View style={s.sliderArrow} />
          </View>
        </View>

        <View style={s.labels}>
          <Text style={s.labelBefore}>Before</Text>
          <Text style={s.labelAfter}>Analysis</Text>
        </View>
      </View>
      <Text style={s.hint}>Slide to compare — original photo vs AI analysis</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { marginBottom: 12 },
  imageWrap: { borderRadius: 16, overflow: 'hidden', position: 'relative', backgroundColor: '#000', alignSelf: 'center' },
  image: { position: 'absolute' },
  afterOverlay: { position: 'absolute', left: 0, top: 0, backgroundColor: 'rgba(255,107,138,0.15)', borderRightWidth: 2, borderRightColor: '#fff' },
  afterBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: colors.primary, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  badgeText: { fontSize: 9, fontWeight: '700', color: '#fff' },
  sliderLine: { position: 'absolute', top: 0, width: 2, backgroundColor: '#fff', zIndex: 10, alignItems: 'center' },
  sliderHandle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 2, elevation: 4, marginTop: 80 },
  sliderArrow: { width: 0, height: 0, borderTopWidth: 6, borderBottomWidth: 6, borderLeftWidth: 4, borderLeftColor: colors.text, borderTopColor: 'transparent', borderBottomColor: 'transparent' },
  labels: { position: 'absolute', bottom: 8, left: 8, right: 8, flexDirection: 'row', justifyContent: 'space-between' },
  labelBefore: { fontSize: 11, fontWeight: '700', color: '#fff', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  labelAfter: { fontSize: 11, fontWeight: '700', color: '#fff', backgroundColor: colors.primary + 'CC', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  hint: { fontSize: 11, color: colors.textLight, textAlign: 'center', marginTop: 6 },
});
