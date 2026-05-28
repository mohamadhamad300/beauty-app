import { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Video, Upload, Sparkles, X, ChevronRight, Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import VideoAnalysisView from '../components/VideoAnalysisView';
import MedicalDisclaimer from '../components/MedicalDisclaimer';
import { colors } from '../constants/theme';
import { runSkinAnalysis } from '../services/skinAnalysis';
import { getSeverityColor } from '../services/severityRating';
import type { ScanResult } from '../types';

export default function VideoScannerScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation();
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);

  const pickVideo = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission Required', 'Please allow access to your photo library to select a video.');
      return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      quality: 1,
    });

    if (!res.canceled && res.assets[0]) {
      setVideoUri(res.assets[0].uri);
      setResult(null);
    }
  }, []);

  const startAnalysis = useCallback(async () => {
    if (!videoUri) return;
    setLoading(true);
    try {
      const scanResult = await runSkinAnalysis(videoUri);
      setResult(scanResult);
    } catch {
      Alert.alert('Analysis Failed', 'Could not analyze the video. Please try a different video.');
    } finally {
      setLoading(false);
    }
  }, [videoUri]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <Camera size={36} color={colors.primary} />
          <Text style={s.title}>Video Skin Scan</Text>
          <Text style={s.subtitle}>Upload a video of your face and we'll analyze your skin frame by frame</Text>
        </View>

        {!videoUri ? (
          <Pressable style={s.uploadZone} onPress={pickVideo}>
            <View style={s.uploadIconWrap}>
              <Upload size={32} color={colors.primary} />
            </View>
            <Text style={s.uploadTitle}>Select a Video</Text>
            <Text style={s.uploadDesc}>Choose a well-lit video with your face visible</Text>
            <View style={s.uploadBtn}>
              <Video size={18} color="#fff" />
              <Text style={s.uploadBtnText}>Choose from Gallery</Text>
            </View>
          </Pressable>
        ) : (
          <View style={s.resultSection}>
            {!result ? (
              <>
                <Text style={s.videoSelectedText}>Video selected</Text>
                {loading ? (
                  <View style={s.loadingWrap}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={s.loadingText}>Analyzing video...</Text>
                  </View>
                ) : (
                  <Pressable style={s.analyzeBtn} onPress={startAnalysis}>
                    <Sparkles size={20} color="#fff" />
                    <Text style={s.analyzeBtnText}>Analyze Skin</Text>
                  </Pressable>
                )}
              </>
            ) : (
              <>
                <VideoAnalysisView videoUri={videoUri} result={result} />

                <View style={s.scoreRow}>
                  <View style={[s.scoreBadge, { backgroundColor: getSeverityColor(result.severity) + '20' }]}>
                    <Text style={[s.scoreValue, { color: getSeverityColor(result.severity) }]}>{result.skinHealth}%</Text>
                    <Text style={s.scoreLabel}>Skin Health</Text>
                  </View>
                  <View style={[s.scoreBadge, { backgroundColor: getSeverityColor(result.severity) + '20' }]}>
                    <Text style={[s.scoreValue, { color: getSeverityColor(result.severity) }]}>{result.severity.toUpperCase()}</Text>
                    <Text style={s.scoreLabel}>Severity</Text>
                  </View>
                </View>

                <View style={s.section}>
                  <Text style={s.sectionTitle}>Condition Report</Text>
                  <Text style={s.conditionText}>{result.conditionSummary}</Text>
                </View>

                {result.recommendations.length > 0 && (
                  <View style={s.section}>
                    <Text style={s.sectionTitle}>Recommendations</Text>
                    {result.recommendations.map((rec, i) => (
                      <View key={i} style={s.recItem}>
                        <Text style={s.recBullet}>•</Text>
                        <Text style={s.recText}>{rec}</Text>
                      </View>
                    ))}
                  </View>
                )}

                <MedicalDisclaimer />
              </>
            )}
          </View>
        )}

        {videoUri && !loading && (
          <Pressable style={s.changeBtn} onPress={pickVideo}>
            <Text style={s.changeBtnText}>Change Video</Text>
          </Pressable>
        )}
      </ScrollView>

      <Pressable style={[s.closeBtn, { top: insets.top + 8 }]} onPress={() => nav.goBack()}>
        <X size={22} color={colors.text} />
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  content: { paddingTop: 80, paddingBottom: 40, paddingHorizontal: 24 },
  header: { alignItems: 'center', marginBottom: 32 },
  title: { fontSize: 24, fontWeight: '800', color: colors.text, marginTop: 12 },
  subtitle: { fontSize: 14, color: colors.textLight, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  uploadZone: {
    borderWidth: 2, borderStyle: 'dashed', borderColor: colors.primary + '40',
    borderRadius: 20, paddingVertical: 48, alignItems: 'center',
    backgroundColor: colors.primary + '08', marginBottom: 20,
  },
  uploadIconWrap: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: colors.primary + '15',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  uploadTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 8 },
  uploadDesc: { fontSize: 13, color: colors.textLight, textAlign: 'center', marginBottom: 24, paddingHorizontal: 24 },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 999 },
  uploadBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  resultSection: { marginBottom: 24 },
  videoSelectedText: { fontSize: 13, color: colors.success, fontWeight: '600', textAlign: 'center', marginBottom: 16 },
  loadingWrap: { alignItems: 'center', paddingVertical: 40 },
  loadingText: { color: colors.textLight, marginTop: 16, fontSize: 15 },
  analyzeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 999, marginBottom: 24 },
  analyzeBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  scoreRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  scoreBadge: { flex: 1, borderRadius: 12, padding: 16, alignItems: 'center' },
  scoreValue: { fontSize: 20, fontWeight: '800' },
  scoreLabel: { fontSize: 11, color: colors.textLight, marginTop: 4, textTransform: 'uppercase' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 8 },
  conditionText: { fontSize: 14, color: colors.textLight, lineHeight: 22 },
  recItem: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  recBullet: { color: colors.primary, fontWeight: '700' },
  recText: { fontSize: 13, color: colors.textLight, lineHeight: 20, flex: 1 },
  changeBtn: { alignItems: 'center', paddingVertical: 12 },
  changeBtnText: { color: colors.primary, fontWeight: '600', fontSize: 14 },
  closeBtn: { position: 'absolute', right: 16, backgroundColor: '#fff', width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
});
