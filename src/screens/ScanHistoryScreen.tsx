import { useCallback, useState } from 'react';
import { View, Text, Pressable, StyleSheet, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft, Clock, Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react-native';
import { colors } from '../constants/theme';
import { getSeverityColor, getSeverityLabel } from '../services/severityRating';
import type { ScanHistoryItem, RootStackParamList } from '../types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Nav = NativeStackNavigationProp<RootStackParamList>;

function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function getChangeIcon(current: number, previous?: number) {
  if (!previous) return <Minus size={16} color={colors.textMuted} />;
  const diff = current - previous;
  if (diff > 0) return <TrendingUp size={16} color="#7BC4A0" />;
  if (diff < 0) return <TrendingDown size={16} color="#E87A7A" />;
  return <Minus size={16} color={colors.textMuted} />;
}

function getChangeText(current: number, previous?: number): string {
  if (!previous) return 'Baseline';
  const diff = current - previous;
  const sign = diff > 0 ? '+' : '';
  return `${sign}${diff}% from last scan`;
}

function getSeverityChange(current: string, previous?: string): string {
  if (!previous) return '';
  const order = ['mild', 'moderate', 'severe'];
  const curIdx = order.indexOf(current);
  const prevIdx = order.indexOf(previous);
  if (curIdx < prevIdx) return 'Improved';
  if (curIdx > prevIdx) return 'Worsened';
  return 'Stable';
}

export default function ScanHistoryScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<Nav>();
  const route = useRoute<any>();
  const allHistory: ScanHistoryItem[] = route.params?.scanHistory || [];
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = allHistory.find(h => h.id === selectedId);
  const previous = selectedId ? allHistory[allHistory.indexOf(selected!) + 1] : undefined;

  const renderItem = useCallback(({ item, index }: { item: ScanHistoryItem; index: number }) => {
    const sevColor = getSeverityColor(item.severity);
    const isFirst = index === 0;
    const prevItem = index < allHistory.length - 1 ? allHistory[index + 1] : undefined;
    const changeText = isFirst && prevItem ? getChangeText(item.skinHealth, prevItem.skinHealth) : '';
    const sevChange = prevItem ? getSeverityChange(item.severity, prevItem.severity) : '';
    const isSelected = selectedId === item.id;

    return (
      <Pressable
        style={[styles.historyCard, isFirst && styles.latestCard, isSelected && styles.selectedCard]}
        onPress={() => setSelectedId(isSelected ? null : item.id)}
      >
        <View style={[styles.severityBar, { backgroundColor: sevColor }]} />
        <View style={styles.cardBody}>
          <View style={styles.cardTop}>
            {isFirst && <View style={styles.latestBadge}><Text style={styles.latestBadgeText}>Latest</Text></View>}
            <Text style={styles.dateText}><Clock size={12} color={colors.textLight} /> {formatDate(item.timestamp)}</Text>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Activity size={16} color={sevColor} />
              <Text style={styles.statLabel}>Score</Text>
              <Text style={[styles.statValue, { color: sevColor }]}>{item.skinHealth}</Text>
            </View>
            <View style={styles.stat}>
              <View style={[styles.severityDot, { backgroundColor: sevColor }]} />
              <Text style={styles.statLabel}>Severity</Text>
              <Text style={[styles.statValue, { color: sevColor }]}>{getSeverityLabel(item.severity)}</Text>
            </View>
            {item.skinType && (
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Type</Text>
                <Text style={[styles.statValue, { color: colors.text }]}>{item.skinType.charAt(0).toUpperCase() + item.skinType.slice(1)}</Text>
              </View>
            )}
          </View>
          {(changeText || sevChange) && (
            <View style={styles.changeRow}>
              {getChangeIcon(item.skinHealth, prevItem?.skinHealth)}
              <Text style={[styles.changeText, { color: item.skinHealth >= (prevItem?.skinHealth ?? 0) ? '#7BC4A0' : '#E87A7A' }]}>
                {changeText} {sevChange ? `· ${sevChange}` : ''}
              </Text>
            </View>
          )}
          {isSelected && previous && (
            <View style={styles.comparisonBox}>
              <Text style={styles.comparisonTitle}>Comparison with previous scan</Text>
              <View style={styles.comparisonRow}>
                <View style={styles.compItem}>
                  <Text style={styles.compLabel}>Current</Text>
                  <Text style={[styles.compValue, { color: getSeverityColor(item.severity) }]}>{item.skinHealth}</Text>
                </View>
                <Text style={styles.compVs}>vs</Text>
                <View style={styles.compItem}>
                  <Text style={styles.compLabel}>Previous</Text>
                  <Text style={[styles.compValue, { color: getSeverityColor(previous.severity) }]}>{previous.skinHealth}</Text>
                </View>
                <View style={styles.compChange}>
                  <Text style={styles.compLabel}>Change</Text>
                  <Text style={[styles.compValue, { color: item.skinHealth >= previous.skinHealth ? '#7BC4A0' : '#E87A7A' }]}>
                    {item.skinHealth - previous.skinHealth > 0 ? '+' : ''}{item.skinHealth - previous.skinHealth}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </Pressable>
    );
  }, [selectedId, allHistory]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => nav.goBack()} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Scan History</Text>
        <View style={{ width: 40 }} />
      </View>

      {allHistory.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No scans yet</Text>
          <Text style={styles.emptyDesc}>Complete your first skin analysis to see it here.</Text>
        </View>
      ) : (
        <FlatList
          data={allHistory}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.background },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600', color: colors.text },
  list: { padding: 16, gap: 10 },
  historyCard: { backgroundColor: colors.surface, borderRadius: 14, overflow: 'hidden', elevation: 1 },
  selectedCard: { borderWidth: 1, borderColor: colors.primary },
  latestCard: { borderWidth: 1, borderColor: colors.primary + '30' },
  severityBar: { width: 4, height: '100%', position: 'absolute', top: 0, left: 0, bottom: 0 },
  cardBody: { padding: 14, paddingLeft: 18 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  latestBadge: { backgroundColor: 'rgba(255,107,138,0.15)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  latestBadgeText: { fontSize: 10, fontWeight: '700', color: colors.primary },
  dateText: { fontSize: 12, color: colors.textLight, flexDirection: 'row', alignItems: 'center', gap: 4 },
  statsRow: { flexDirection: 'row', gap: 20 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statLabel: { fontSize: 11, color: colors.textLight },
  statValue: { fontSize: 14, fontWeight: '700' },
  severityDot: { width: 12, height: 12, borderRadius: 6 },
  changeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.background },
  changeText: { fontSize: 12, fontWeight: '600' },
  comparisonBox: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.background },
  comparisonTitle: { fontSize: 12, fontWeight: '600', color: colors.text, marginBottom: 8 },
  comparisonRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  compItem: { flex: 1, alignItems: 'center' },
  compLabel: { fontSize: 11, color: colors.textMuted, marginBottom: 2 },
  compValue: { fontSize: 18, fontWeight: '800' },
  compVs: { fontSize: 12, color: colors.textMuted },
  compChange: { flex: 1, alignItems: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 6 },
  emptyDesc: { fontSize: 14, color: colors.textLight, textAlign: 'center' },
});
