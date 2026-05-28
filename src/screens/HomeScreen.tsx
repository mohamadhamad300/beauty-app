import { View, Text, ScrollView, Pressable, StyleSheet, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  Sparkles, Droplets, Sun, ChevronRight, Bell, FlaskConical, Leaf,
} from 'lucide-react-native';
import { colors } from '../constants/theme';
import ProductCard from '../components/ProductCard';
import type { Product, RootStackParamList } from '../types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get('window');

const MOCK_PRODUCTS: Product[] = [
  { id: '1', name: 'Hydra Glow Serum', brand: 'Glow Lab', price: 48.00, image: '', category: 'serum', skinConcerns: ['dryness'], rating: 4.8 },
  { id: '2', name: 'Gentle Cleansing Oil', brand: 'Pure Beauty', price: 32.00, image: '', category: 'cleanser', skinConcerns: ['acne'], rating: 4.6 },
  { id: '3', name: 'Vitamin C Brightening Cream', brand: 'Radiance Co', price: 54.00, image: '', category: 'moisturizer', skinConcerns: ['dark_spots'], rating: 4.9 },
  { id: '4', name: 'SPF 50 Sun Shield', brand: 'SunSafe', price: 28.00, image: '', category: 'sunscreen', skinConcerns: ['redness'], rating: 4.7 },
];

const CATEGORIES = [
  { icon: Droplets, label: 'Cleansers', color: '#7BC4A0' },
  { icon: Sparkles, label: 'Moisturizers', color: '#FF8FA3' },
  { icon: FlaskConical, label: 'Serums', color: '#C08497' },
  { icon: Sun, label: 'Sunscreen', color: '#F4C77A' },
  { icon: Leaf, label: 'Masks', color: '#7BC4A0' },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<Nav>();

  return (
    <View style={[s.screen, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={[s.header, { paddingTop: insets.top + 16 }]}>
          {/* Top Bar */}
          <View style={s.topBar}>
            <View>
              <Text style={s.welcomeText}>Welcome back</Text>
              <Text style={s.glowTitle}>Glowing</Text>
            </View>
            <Pressable style={s.bellBtn}>
              <Bell size={22} color={colors.text} />
            </Pressable>
          </View>

          {/* Daily Glow Score */}
          <View style={s.scoreCard}>
            <View style={s.scoreRow}>
              <View>
                <Text style={s.scoreLabel}>Daily Glow Score</Text>
                <Text style={s.scoreValue}>85</Text>
                <Text style={s.scoreSub}>Looking radiant today!</Text>
              </View>
              <View style={s.scoreCircle}>
                <Text style={s.scoreGrade}>A</Text>
                <Text style={s.scoreGradeLabel}>Grade</Text>
              </View>
            </View>
          </View>

          {/* Quick Scan CTA */}
          <Pressable style={s.scanCta} onPress={() => nav.navigate('SkinAnalysis')}>
            <View style={s.scanCtaRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.scanCtaTitle}>New Skin Analysis</Text>
                <Text style={s.scanCtaDesc}>
                  Scan your face to get personalized skincare recommendations.
                </Text>
                <View style={s.scanCtaBtnRow}>
                  <View style={s.scanCtaBtn}>
                    <Text style={s.scanCtaBtnText}>Start Scan</Text>
                  </View>
                  <ChevronRight size={20} color={colors.primary} style={{ marginLeft: 8 }} />
                </View>
              </View>
              <View style={s.scanCtaIcon}>
                <Sparkles size={32} color={colors.primary} />
              </View>
            </View>
          </Pressable>
        </View>

        {/* Categories */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Categories</Text>
            <Text style={s.sectionLink}>See All</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {CATEGORIES.map((cat, i) => (
              <Pressable key={i} style={s.catItem}>
                <View style={[s.catIcon, { backgroundColor: cat.color + '20' }]}>
                  <cat.icon size={26} color={cat.color} />
                </View>
                <Text style={s.catLabel}>{cat.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Recommended Products */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Recommended for You</Text>
            <Text style={s.sectionLink}>View All</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {MOCK_PRODUCTS.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </ScrollView>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingHorizontal: 24 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  welcomeText: { fontSize: 14, fontWeight: '500', color: colors.primary },
  glowTitle: { fontSize: 32, color: colors.text, fontFamily: 'Georgia' },
  bellBtn: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, elevation: 2 },
  scoreCard: { backgroundColor: colors.primary, borderRadius: 24, padding: 24, marginBottom: 32 },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  scoreLabel: { fontSize: 14, fontWeight: '500', color: 'rgba(255,255,255,0.8)' },
  scoreValue: { fontSize: 40, color: '#fff', fontFamily: 'Georgia' },
  scoreSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  scoreCircle: { width: 96, height: 96, borderRadius: 48, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' },
  scoreGrade: { fontSize: 28, fontWeight: '700', color: '#fff' },
  scoreGradeLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  scanCta: { backgroundColor: colors.surface, borderRadius: 16, padding: 20, marginBottom: 32, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4 },
  scanCtaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  scanCtaTitle: { fontSize: 18, color: colors.text, fontFamily: 'Georgia', marginBottom: 4 },
  scanCtaDesc: { fontSize: 14, lineHeight: 20, color: colors.textLight, marginBottom: 12 },
  scanCtaBtnRow: { flexDirection: 'row', alignItems: 'center' },
  scanCtaBtn: { backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 999 },
  scanCtaBtnText: { fontWeight: '600', color: '#fff' },
  scanCtaIcon: { marginLeft: 16, width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,107,138,0.1)' },
  section: { marginBottom: 24, paddingHorizontal: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 20, color: colors.text, fontFamily: 'Georgia' },
  sectionLink: { fontSize: 14, fontWeight: '500', color: colors.primary },
  catItem: { marginRight: 16, alignItems: 'center' },
  catIcon: { width: 64, height: 64, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  catLabel: { fontSize: 12, fontWeight: '500', color: colors.text },
});
