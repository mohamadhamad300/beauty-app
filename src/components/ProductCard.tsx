import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Star } from 'lucide-react-native';
import { colors } from '../constants/theme';
import type { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onPress?: () => void;
}

export default function ProductCard({ product, onPress }: ProductCardProps) {
  return (
    <Pressable style={s.card} onPress={onPress}>
      <View style={s.imageContainer}>
        <View style={s.imagePlaceholder}>
          <Text style={s.imageLetter}>{product.name.charAt(0)}</Text>
        </View>
      </View>

      <View style={s.content}>
        <View style={s.ratingRow}>
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={12}
              color={i < Math.floor(product.rating) ? colors.gold : colors.textMuted}
              fill={i < Math.floor(product.rating) ? colors.gold : 'transparent'}
            />
          ))}
          <Text style={s.ratingText}>{product.rating}</Text>
        </View>

        <Text style={s.name} numberOfLines={1}>{product.name}</Text>
        <Text style={s.brand}>{product.brand}</Text>

        <View style={s.priceRow}>
          <Text style={s.price}>${product.price.toFixed(2)}</Text>
          <Pressable style={s.addBtn}>
            <Text style={s.addBtnText}>+ Add</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: { width: 165, marginRight: 12, marginBottom: 16, borderRadius: 16, backgroundColor: colors.surface, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4 },
  imageContainer: { height: 165, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  imagePlaceholder: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(232,201,160,0.4)' },
  imageLetter: { fontSize: 32 },
  content: { padding: 12 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  ratingText: { marginLeft: 4, fontSize: 12, color: colors.textMuted },
  name: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 4 },
  brand: { fontSize: 12, color: colors.textLight, marginBottom: 8 },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  price: { fontSize: 16, fontWeight: '700', color: colors.primary },
  addBtn: { backgroundColor: 'rgba(255,107,138,0.1)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 },
  addBtnText: { fontSize: 12, fontWeight: '500', color: colors.primary },
});
