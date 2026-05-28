import { useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, FlatList, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft, Star, ShoppingCart, ShieldCheck } from 'lucide-react-native';
import { colors } from '../constants/theme';
import { getSeverityColor, getSeverityLabel } from '../services/severityRating';
import type { Product, ScanResult, RootStackParamList } from '../types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get('window');

const MOCK_PRODUCTS: Product[] = [
  { id: 'p1', name: 'Salicylic Acid Cleanser', brand: 'CeraVe', price: 14.99, image: '', category: 'cleanser', skinConcerns: ['acne', 'oiliness'], rating: 4.7 },
  { id: 'p2', name: 'Niacinamide Serum', brand: 'The Ordinary', price: 8.99, image: '', category: 'serum', skinConcerns: ['acne', 'dark_spots', 'oiliness'], rating: 4.5 },
  { id: 'p3', name: 'Hyaluronic Acid Moisturizer', brand: 'Neutrogena', price: 18.99, image: '', category: 'moisturizer', skinConcerns: ['dryness'], rating: 4.6 },
  { id: 'p4', name: 'SPF 50 Sunscreen', brand: 'La Roche-Posay', price: 22.99, image: '', category: 'sunscreen', skinConcerns: ['redness', 'dark_spots'], rating: 4.8 },
  { id: 'p5', name: 'Benzoyl Peroxide Gel', brand: 'PanOxyl', price: 11.49, image: '', category: 'serum', skinConcerns: ['acne'], rating: 4.3 },
  { id: 'p6', name: 'Retinol Serum', brand: 'CeraVe', price: 19.99, image: '', category: 'serum', skinConcerns: ['wrinkles', 'dark_spots'], rating: 4.4 },
  { id: 'p7', name: 'Clay Mask', brand: 'Innisfree', price: 15.99, image: '', category: 'mask', skinConcerns: ['oiliness', 'acne'], rating: 4.2 },
  { id: 'p8', name: 'Centella Cream', brand: 'COSRX', price: 24.99, image: '', category: 'moisturizer', skinConcerns: ['redness'], rating: 4.6 },
];

function getMatchReason(product: Product, scan: ScanResult): string {
  const hasAcne = scan.acneDetections.length > 0;
  const concernTypes: string[] = scan.concerns.map(c => c.type);

  if (product.skinConcerns.includes('acne') && hasAcne) return 'Targets active acne';
  if (product.skinConcerns.some(s => concernTypes.indexOf(s) >= 0)) return 'Addresses your skin concerns';
  return 'Recommended for your skin type';
}

function getMatchScore(product: Product, scan: ScanResult): number {
  let score = 0.5;
  const concernTypes: string[] = scan.concerns.map(c => c.type);
  for (const pc of product.skinConcerns) {
    if (pc === 'acne' && scan.acneDetections.length > 0) score += 0.3;
    if (concernTypes.includes(pc)) score += 0.2;
  }
  return Math.min(1, score);
}

export default function ProductMatchScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<Nav>();
  const route = useRoute<any>();
  const scanResult: ScanResult = route.params?.scanResult;

  const sortedProducts = [...MOCK_PRODUCTS]
    .map(p => ({ ...p, matchScore: getMatchScore(p, scanResult), matchReason: getMatchReason(p, scanResult) }))
    .sort((a, b) => b.matchScore - a.matchScore);

  const renderProduct = useCallback(({ item }: { item: Product & { matchScore: number; matchReason: string } }) => (
    <View style={styles.productCard}>
      <View style={styles.productImagePlaceholder}>
        <Text style={styles.productInitial}>{item.name[0]}</Text>
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productBrand}>{item.brand}</Text>
        <View style={styles.ratingRow}>
          <Star size={12} color={colors.warning} fill={colors.warning} />
          <Text style={styles.ratingText}>{item.rating}</Text>
          <Text style={styles.matchBadge}>{Math.round(item.matchScore * 100)}% match</Text>
        </View>
        <View style={styles.reasonRow}>
          <ShieldCheck size={12} color={colors.success} />
          <Text style={styles.reasonText}>{item.matchReason}</Text>
        </View>
      </View>
      <View style={styles.productRight}>
        <Text style={styles.price}>${item.price.toFixed(2)}</Text>
        <Pressable style={styles.addBtn}>
          <ShoppingCart size={14} color="#fff" />
        </Pressable>
      </View>
    </View>
  ), []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => nav.goBack()} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Recommended Products</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.scanBanner}>
        <Text style={styles.scanBannerTitle}>Based on your scan</Text>
        <Text style={styles.scanBannerScore}>
          Severity: <Text style={{ color: getSeverityColor(scanResult.severity) }}>{getSeverityLabel(scanResult.severity)}</Text>
          {'  |  '}Score: {scanResult.skinHealth}/100
        </Text>
      </View>

      <FlatList
        data={sortedProducts}
        keyExtractor={item => item.id}
        renderItem={renderProduct}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.background },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600', color: colors.text },
  scanBanner: { backgroundColor: colors.surface, paddingHorizontal: 20, paddingVertical: 14, marginHorizontal: 16, marginTop: 12, borderRadius: 12, elevation: 1 },
  scanBannerTitle: { fontSize: 13, color: colors.textLight, marginBottom: 4 },
  scanBannerScore: { fontSize: 15, fontWeight: '600', color: colors.text },
  list: { padding: 16, gap: 10 },
  productCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 14, padding: 12, elevation: 1 },
  productImagePlaceholder: { width: 52, height: 52, borderRadius: 12, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  productInitial: { fontSize: 20, fontWeight: '700', color: colors.primary },
  productInfo: { flex: 1, marginRight: 8 },
  productName: { fontSize: 14, fontWeight: '600', color: colors.text },
  productBrand: { fontSize: 12, color: colors.textLight, marginBottom: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  ratingText: { fontSize: 11, color: colors.textLight, marginRight: 6 },
  matchBadge: { fontSize: 11, fontWeight: '600', color: colors.success, backgroundColor: 'rgba(123,196,160,0.15)', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 },
  reasonRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  reasonText: { fontSize: 11, color: colors.textLight },
  productRight: { alignItems: 'flex-end', gap: 6 },
  price: { fontSize: 15, fontWeight: '700', color: colors.text },
  addBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
});
