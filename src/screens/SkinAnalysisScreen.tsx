import { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions, Animated, Easing, ScrollView, Image as RNImage } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { X, Sparkles, Camera, CheckCircle2, ChevronRight, Eye, EyeOff, SunMedium, Clock } from 'lucide-react-native';
import CameraScanner from '../components/CameraScanner';
import FaceOverlay from '../components/FaceOverlay';
import MedicalDisclaimer from '../components/MedicalDisclaimer';
import FaceGuideIllustration from '../components/FaceGuideIllustration';
import MockFacePhoto from '../components/MockFacePhoto';
import PhotoAnalysisView from '../components/PhotoAnalysisView';
import BeforeAfterSlider from '../components/BeforeAfterSlider';
import DualCameraView from '../components/DualCameraView';
import { colors } from '../constants/theme';
import { runSkinAnalysis } from '../services/skinAnalysis';
import { getSeverityColor, getSeverityLabel } from '../services/severityRating';
import { getAcneLabel, getAcneDescription, getMarkerColor } from '../services/acneDetection';
import type { ScanResult, ScanHistoryItem, RootStackParamList } from '../types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
type ScanPhase = 'instructions' | 'positioning' | 'scanning' | 'processing' | 'complete';

const SIMULATED_SCAN_POINTS = [
  { x: SCREEN_WIDTH * 0.35, y: SCREEN_HEIGHT * 0.35, severity: 'low' as const },
  { x: SCREEN_WIDTH * 0.55, y: SCREEN_HEIGHT * 0.38, severity: 'medium' as const },
  { x: SCREEN_WIDTH * 0.45, y: SCREEN_HEIGHT * 0.45, severity: 'high' as const },
  { x: SCREEN_WIDTH * 0.50, y: SCREEN_HEIGHT * 0.52, severity: 'low' as const },
  { x: SCREEN_WIDTH * 0.40, y: SCREEN_HEIGHT * 0.48, severity: 'low' as const },
];

const LANDMARK_POSITIONS = [
  { x: SCREEN_WIDTH * 0.38, y: SCREEN_HEIGHT * 0.33 },
  { x: SCREEN_WIDTH * 0.62, y: SCREEN_HEIGHT * 0.33 },
  { x: SCREEN_WIDTH * 0.50, y: SCREEN_HEIGHT * 0.38 },
  { x: SCREEN_WIDTH * 0.42, y: SCREEN_HEIGHT * 0.44 },
  { x: SCREEN_WIDTH * 0.58, y: SCREEN_HEIGHT * 0.44 },
  { x: SCREEN_WIDTH * 0.50, y: SCREEN_HEIGHT * 0.48 },
];

function AnalyzingSpinner() {
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(spinAnim, { toValue: 1, duration: 1000, easing: Easing.linear, useNativeDriver: true })
    );
    anim.start();
    return () => anim.stop();
  }, [spinAnim]);

  const rotate = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Animated.View style={{ width: 48, height: 48, borderRadius: 24, borderWidth: 4, borderColor: 'rgba(255,255,255,0.2)', borderTopColor: colors.primary, transform: [{ rotate }] }} />
  );
}

function ScanningProgress() {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 1800, useNativeDriver: false }).start();
  }, [anim]);

  const width = anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={s.progressBar}>
      <Animated.View style={[s.progressFill, { width }]} />
    </View>
  );
}

function IssueMarker({ type, x, y, delay }: { type: string; x: number; y: number; delay: number }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.3)).current;
  const color = type === 'red' ? '#E87A7A' : type === 'black' ? '#2D1B2E' : '#F4C77A';

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 5, tension: 100, delay, useNativeDriver: true }),
    ]).start();
  }, [delay, opacity, scale]);

  return (
    <View style={[s.marker, { left: x - 8, top: y - 8, borderColor: color }]}>
      <Animated.View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color, opacity, transform: [{ scale }] }} />
    </View>
  );
}

export default function SkinAnalysisScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<Nav>();
  const [phase, setPhase] = useState<ScanPhase>('instructions');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);
  const [isFaceStable, setIsFaceStable] = useState(false);
  const [disclaimerAgreed, setDisclaimerAgreed] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<{ type: string; acneaType: string; confidence: number; x: number; y: number } | null>(null);

  const handleFrameCaptured = useCallback(async (uri: string) => {
    setPhotoUri(uri);
    setPhase('processing');
    const analysisResult = await runSkinAnalysis(uri);
    setResult(analysisResult);
    setScanHistory(prev => [{
      id: Date.now().toString(),
      timestamp: Date.now(),
      skinHealth: analysisResult.skinHealth,
      severity: analysisResult.severity,
      photoUri: uri,
      skinType: analysisResult.skinType,
      skinToneHex: analysisResult.skinToneHex,
    }, ...prev]);
    setPhase('complete');
  }, []);

  const startPositioning = useCallback(() => {
    setDisclaimerAgreed(true);
    setPhase('positioning');
  }, []);

  const startDemo = useCallback(async () => {
    setDisclaimerAgreed(true);
    setPhotoUri(null);
    setPhase('processing');
    const analysisResult = await runSkinAnalysis();
    setResult(analysisResult);
    setScanHistory(prev => [{
      id: Date.now().toString(),
      timestamp: Date.now(),
      skinHealth: analysisResult.skinHealth,
      severity: analysisResult.severity,
      photoUri: '',
      skinType: analysisResult.skinType,
      skinToneHex: analysisResult.skinToneHex,
    }, ...prev]);
    setPhase('complete');
  }, []);

  useEffect(() => {
    if (phase === 'positioning') {
      const timer = setTimeout(() => {
        setIsFaceStable(true);
        setTimeout(() => {
          setPhase('scanning');
        }, 800);
      }, 1200);
      return () => clearTimeout(timer);
    } else {
      setIsFaceStable(false);
    }
  }, [phase]);

  const resetScan = useCallback(() => { setPhase('instructions'); setResult(null); setPhotoUri(null); }, []);

  const handleViewProducts = useCallback(() => {
    if (result) {
      nav.navigate('ProductMatch', { scanResult: result });
    }
  }, [result, nav]);

  const handleViewHistory = useCallback(() => {
    nav.navigate('ScanHistory', { scanHistory });
  }, [scanHistory, nav]);

  if (result && phase === 'complete') {
    const totalSpots = result.acneDetections.reduce((s, d) => s + d.count, 0);
    const sevColor = getSeverityColor(result.severity);
    const healthAngle = (result.skinHealth / 100) * 360;

    const redSpots = result.acneDetections.filter(a => getMarkerColor(a.type) === 'red').reduce((s, d) => s + d.count, 0);
    const blackSpots = result.acneDetections.filter(a => getMarkerColor(a.type) === 'black').reduce((s, d) => s + d.count, 0);
    const yellowSpots = result.acneDetections.filter(a => getMarkerColor(a.type) === 'yellow').reduce((s, d) => s + d.count, 0);

    const acneMarkers = result.acneDetections.flatMap((a, i) => {
      const color = getMarkerColor(a.type);
      return Array.from({ length: Math.min(a.count, 4) }, (_, j) => ({
        type: color,
        acneaType: a.type,
        confidence: a.confidence,
        x: 40 + (i * 35) + (j * 22) + Math.random() * 120,
        y: 40 + (i * 28) + (j * 18) + Math.random() * 160,
      }));
    });

    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>

          {/* Snapshot with Health Score overlay */}
          <View style={s.heroSection}>
            <View style={s.photoPlaceholder}>
              {photoUri ? (
                <>
                  <RNImage source={{ uri: photoUri }} style={{ width: SCREEN_WIDTH - 24, height: (SCREEN_WIDTH - 24) * 0.85, position: 'absolute' }} resizeMode="cover" />
                  {acneMarkers.map((m, i) => (
                    <Pressable key={i} onPress={() => setSelectedMarker(selectedMarker?.x === m.x && selectedMarker?.y === m.y ? null : m)}>
                      <View style={[s.heroMarker, { left: m.x + 12, top: m.y + 12, backgroundColor: m.type === 'red' ? '#E87A7A' : m.type === 'black' ? '#2D1B2E' : '#F4C77A' }, selectedMarker?.x === m.x && selectedMarker?.y === m.y && s.heroMarkerSelected]} />
                    </Pressable>
                  ))}
                </>
              ) : (
                <MockFacePhoto
                  width={SCREEN_WIDTH - 24}
                  height={(SCREEN_WIDTH - 24) * 0.85}
                  markers={acneMarkers}
                />
              )}
              <View style={s.heroOverlay} />
            </View>
            <View style={s.heroContent}>
              <View style={s.heroScoreRow}>
                <View style={[s.gaugeRing, { borderColor: 'rgba(255,255,255,0.3)' }]}>
                  <View style={s.gaugeInner}>
                    <Text style={[s.gaugeValue, { color: '#fff' }]}>{result.skinHealth}</Text>
                    <Text style={s.gaugeUnit}>/100</Text>
                  </View>
                </View>
                <View style={s.heroScoreInfo}>
                  <Text style={s.heroScoreTitle}>Skin Health</Text>
                  <Text style={[s.heroScoreLabel, { color: sevColor }]}>{getSeverityLabel(result.severity)}</Text>
                  <View style={s.heroSkinTypeBadge}>
                    <Text style={s.heroSkinTypeText}>{result.skinType.charAt(0).toUpperCase() + result.skinType.slice(1)}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Selected marker zoom detail */}
          {selectedMarker && (
            <View style={s.zoomCard}>
              <View style={s.zoomHeader}>
                <View style={[s.zoomDot, { backgroundColor: selectedMarker.type === 'red' ? '#E87A7A' : selectedMarker.type === 'black' ? '#2D1B2E' : '#F4C77A' }]} />
                <Text style={s.zoomTitle}>{selectedMarker.type === 'red' ? 'Inflamed acne' : selectedMarker.type === 'black' ? 'Blackhead' : 'Pigmentation'} spot</Text>
                <Pressable onPress={() => setSelectedMarker(null)} style={s.zoomClose}>
                  <X size={16} color={colors.textMuted} />
                </Pressable>
              </View>
              <View style={s.zoomBody}>
                <View style={s.zoomDetailRow}>
                  <Text style={s.zoomLabel}>Type</Text>
                  <Text style={s.zoomValue}>{selectedMarker.acneaType.replace('heads', 'heads').replace('ules', 'ules').replace('ids', 'ids').replace('ust', 'ules')}</Text>
                </View>
                <View style={s.zoomDetailRow}>
                  <Text style={s.zoomLabel}>Confidence</Text>
                  <Text style={s.zoomValue}>{Math.round(selectedMarker.confidence * 100)}%</Text>
                </View>
                <View style={s.zoomDetailRow}>
                  <Text style={s.zoomLabel}>Marker color</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={[s.zoomMiniDot, { backgroundColor: selectedMarker.type === 'red' ? '#E87A7A' : selectedMarker.type === 'black' ? '#2D1B2E' : '#F4C77A' }]} />
                    <Text style={s.zoomValue}>{selectedMarker.type === 'red' ? 'Red (inflammation)' : selectedMarker.type === 'black' ? 'Black (clogged pore)' : 'Yellow (pigmentation)'}</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Detected Issues */}
          <View style={s.issuesSection}>
            <Text style={s.sectionLabel}>Detected Issues</Text>
            <View style={s.issuesCard}>
              <View style={s.issuesPhotoRow}>
                <View style={s.issuesPhotoPreview}>
                  {acneMarkers.slice(0, 12).map((m, i) => (
                    <View key={i} style={[s.issuesMarker, { left: m.x * 0.25 + 20, top: m.y * 0.25 + 20, backgroundColor: m.type === 'red' ? '#E87A7A' : m.type === 'black' ? '#2D1B2E' : '#F4C77A' }]} />
                  ))}
                </View>
                <Text style={s.issuesPhotoLabel}>Tap markers on photo</Text>
              </View>
              <View style={s.issuesList}>
              {redSpots > 0 && (
                <View style={s.issueRow}>
                  <View style={[s.issueDot, { backgroundColor: '#E87A7A' }]} />
                  <Text style={s.issueLabel}>Inflamed acne</Text>
                  <Text style={s.issueCount}>{redSpots} spots</Text>
                </View>
              )}
              {blackSpots > 0 && (
                <View style={s.issueRow}>
                  <View style={[s.issueDot, { backgroundColor: '#2D1B2E' }]} />
                  <Text style={s.issueLabel}>Blackheads / clogged pores</Text>
                  <Text style={s.issueCount}>{blackSpots} spots</Text>
                </View>
              )}
              {yellowSpots > 0 && (
                <View style={s.issueRow}>
                  <View style={[s.issueDot, { backgroundColor: '#F4C77A' }]} />
                  <Text style={s.issueLabel}>Dryness / pigmentation</Text>
                  <Text style={s.issueCount}>{yellowSpots} spots</Text>
                </View>
              )}
              {result.concerns.map((c, i) => (
                <View key={i} style={s.issueRow}>
                  <View style={[s.issueDot, { backgroundColor: c.severity === 'high' ? '#E87A7A' : c.severity === 'medium' ? '#F4C77A' : '#7BC4A0' }]} />
                  <Text style={s.issueLabel}>{c.type.replace('_', ' ')} ({c.area})</Text>
                  <Text style={s.issueCount}>{c.severity}</Text>
                </View>
              ))}
            </View>
          </View>
          </View>

          {/* Smart Advice */}
          <View style={s.adviceSection}>
            <View style={s.adviceIconWrap}>
              <Sparkles size={20} color={colors.primary} />
            </View>
            <Text style={s.adviceText}>{result.tip}</Text>
          </View>

          {/* Browse Products */}
          <Pressable style={s.productsBtn} onPress={handleViewProducts}>
            <Text style={s.productsBtnText}>Browse Recommended Products</Text>
            <ChevronRight size={18} color="#fff" />
          </Pressable>

          <MedicalDisclaimer />
          <View style={{ height: 40 }} />
        </ScrollView>

        <Pressable style={[s.closeBtn, { top: insets.top + 8, backgroundColor: 'rgba(0,0,0,0.05)' }]} onPress={resetScan}>
          <X size={22} color={colors.text} />
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: phase === 'instructions' ? colors.background : '#000' }}>
      {phase === 'instructions' ? (
        <View style={s.instructionsContainer}>
          <View style={s.instructionsHeader}>
            <Camera size={40} color={colors.primary} />
            <Text style={s.instructionsTitle}>AI Skin Analysis</Text>
            <Text style={s.instructionsSub}>Get a detailed report of your skin condition</Text>
          </View>

          <FaceGuideIllustration />

          <View style={s.instructionsSteps}>
            <View style={s.stepCard}>
              <View style={[s.stepIcon, { backgroundColor: '#FFF0F0' }]}>
                <EyeOff size={22} color={colors.primary} />
              </View>
              <View style={s.stepTextWrap}>
                <Text style={s.stepTitle}>Remove glasses & accessories</Text>
                <Text style={s.stepDesc}>Take off glasses, heavy jewelry, and hair from your face</Text>
              </View>
            </View>

            <View style={s.stepCard}>
              <View style={[s.stepIcon, { backgroundColor: '#FFF8E7' }]}>
                <SunMedium size={22} color={colors.warning} />
              </View>
              <View style={s.stepTextWrap}>
                <Text style={s.stepTitle}>Find good lighting</Text>
                <Text style={s.stepDesc}>Stand in natural daylight or a well-lit room for best results</Text>
              </View>
            </View>

            <View style={s.stepCard}>
              <View style={[s.stepIcon, { backgroundColor: '#F0FFF4' }]}>
                <Eye size={22} color={colors.success} />
              </View>
              <View style={s.stepTextWrap}>
                <Text style={s.stepTitle}>Face the camera directly</Text>
                <Text style={s.stepDesc}>Position your face inside the oval guide on the next screen</Text>
              </View>
            </View>
          </View>

          <Pressable style={s.startBtnLarge} onPress={startPositioning}>
            <Sparkles size={22} color="#fff" style={{ marginRight: 8 }} />
            <Text style={s.startBtnText}>Start Analysis</Text>
          </Pressable>

          <Pressable style={s.demoBtn} onPress={startDemo}>
            <Text style={s.demoBtnText}>Quick Demo (skip camera)</Text>
          </Pressable>

          <MedicalDisclaimer onAgree={() => setDisclaimerAgreed(true)} agreed={disclaimerAgreed} />

          {scanHistory.length > 0 && (
            <Pressable style={s.historyPreview} onPress={handleViewHistory}>
              <Clock size={14} color={colors.textLight} />
              <Text style={s.historyTitle}>View history ({scanHistory.length} scans)</Text>
              <View style={s.historyDots}>
                {scanHistory.slice(0, 5).map((h) => (
                  <View key={h.id} style={[s.historyDot, { backgroundColor: getSeverityColor(h.severity) }]} />
                ))}
              </View>
            </Pressable>
          )}
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <CameraScanner scanning={phase === 'scanning' || phase === 'processing'} onFrameCaptured={handleFrameCaptured} />
          <View style={{ position: 'absolute', inset: 0 }}>
            {(phase === 'positioning' || phase === 'scanning') && (
              <FaceOverlay
                size={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
                landmarks={LANDMARK_POSITIONS}
                scanPoints={SIMULATED_SCAN_POINTS}
                faceBounds={{ x: SCREEN_WIDTH * 0.15, y: SCREEN_HEIGHT * 0.15, width: SCREEN_WIDTH * 0.7, height: SCREEN_HEIGHT * 0.5 }}
                isStable={isFaceStable}
                showInstructions={true}
              />
            )}

            {phase === 'positioning' && (
              <View style={s.positioningOverlay}>
                <View style={[s.stabilityIndicator, { backgroundColor: isFaceStable ? 'rgba(123,196,160,0.3)' : 'rgba(232,122,122,0.3)' }]}>
                  <Text style={[s.stabilityText, { color: isFaceStable ? colors.success : '#fff' }]}>
                    {isFaceStable ? 'Face detected!' : 'Position your face in the frame...'}
                  </Text>
                </View>
              </View>
            )}

            {phase === 'scanning' && (
              <View style={s.scanningFooter}>
                <Text style={s.scanningText}>Capturing your skin...</Text>
                <ScanningProgress />
              </View>
            )}

            {phase === 'processing' && (
              <View style={s.processingOverlay}>
                <AnalyzingSpinner />
                <Text style={s.processingText}>Analyzing your skin with AI...</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {(phase === 'instructions' || phase === 'positioning' || phase === 'scanning') && (
        <Pressable style={[s.closeBtn, { top: insets.top + 8, backgroundColor: phase === 'instructions' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.2)' }]} onPress={resetScan}>
          <X size={22} color={phase === 'instructions' ? colors.text : '#fff'} />
        </Pressable>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  closeBtn: { position: 'absolute', left: 24, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  // Instructions
  instructionsContainer: { flex: 1, paddingHorizontal: 24, paddingTop: 60 },
  instructionsHeader: { alignItems: 'center', marginBottom: 32 },
  instructionsTitle: { fontSize: 28, fontWeight: '700', color: colors.text, marginTop: 12 },
  instructionsSub: { fontSize: 15, color: colors.textLight, marginTop: 4, textAlign: 'center' },
  instructionsSteps: { flex: 1, justifyContent: 'center', gap: 12 },
  stepCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 16, padding: 16, elevation: 1 },
  stepIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  stepTextWrap: { flex: 1 },
  stepTitle: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 2 },
  stepDesc: { fontSize: 13, color: colors.textLight, lineHeight: 18 },
  startBtnLarge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, paddingVertical: 18, borderRadius: 999, marginTop: 24, marginBottom: 8 },
  demoBtn: { alignItems: 'center', paddingVertical: 10 },
  demoBtnText: { color: colors.textMuted, fontSize: 13, fontWeight: '500', textDecorationLine: 'underline' },
  startBtnText: { fontSize: 18, fontWeight: '600', color: '#fff' },
  // History
  historyPreview: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 24, paddingVertical: 8 },
  historyTitle: { fontSize: 13, color: colors.textLight },
  historyDots: { flexDirection: 'row', gap: 4 },
  historyDot: { width: 8, height: 8, borderRadius: 4 },
  // Positioning
  positioningOverlay: { position: 'absolute', bottom: 120, left: 0, right: 0, alignItems: 'center' },
  stabilityIndicator: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 999 },
  stabilityText: { fontSize: 14, fontWeight: '500' },
  // Scanning
  scanningFooter: { position: 'absolute', bottom: 120, left: 0, right: 0, alignItems: 'center' },
  scanningText: { fontSize: 16, fontWeight: '500', color: '#fff', marginBottom: 12 },
  progressBar: { width: 200, height: 4, borderRadius: 2, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.2)' },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 2 },
  processingOverlay: { position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.3)' },
  processingText: { fontSize: 18, fontWeight: '500', color: '#fff', marginTop: 16 },
  // Markers
  marker: { position: 'absolute', width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  markerInner: { width: 8, height: 8, borderRadius: 4 },
  markerMini: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  // Hero - Snapshot + Score overlay
  heroSection: { position: 'relative', alignItems: 'center', marginBottom: 20 },
  heroPhotoWrap: { width: SCREEN_WIDTH - 24, height: (SCREEN_WIDTH - 24) * 0.85, borderRadius: 20, overflow: 'hidden' },
  photoPlaceholder: { width: SCREEN_WIDTH - 24, height: (SCREEN_WIDTH - 24) * 0.85, borderRadius: 20, backgroundColor: colors.surface, overflow: 'hidden' },
  heroOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%', backgroundColor: 'rgba(0,0,0,0.4)' },
  heroContent: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20 },
  heroScoreRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  gaugeRing: { width: 72, height: 72, borderRadius: 36, borderWidth: 4, alignItems: 'center', justifyContent: 'center' },
  gaugeInner: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  gaugeValue: { fontSize: 22, fontWeight: '800', color: '#fff' },
  gaugeUnit: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: -2 },
  heroScoreInfo: { flex: 1 },
  heroScoreTitle: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 2 },
  heroScoreLabel: { fontSize: 13, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase' },
  heroSkinTypeBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 },
  heroSkinTypeText: { fontSize: 12, fontWeight: '600', color: '#fff' },
  heroMarker: { position: 'absolute', width: 12, height: 12, borderRadius: 6, opacity: 0.85, borderWidth: 2, borderColor: '#fff' },
  heroMarkerSelected: { width: 18, height: 18, borderRadius: 9, opacity: 1, borderColor: '#FFD700', borderWidth: 3 },
  zoomCard: { marginHorizontal: 24, marginBottom: 16, backgroundColor: colors.surface, borderRadius: 14, padding: 14, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
  zoomHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  zoomDot: { width: 14, height: 14, borderRadius: 7, marginRight: 8 },
  zoomTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.text },
  zoomClose: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  zoomBody: { gap: 8 },
  zoomDetailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  zoomLabel: { fontSize: 13, color: colors.textMuted },
  zoomValue: { fontSize: 14, fontWeight: '600', color: colors.text, textTransform: 'capitalize' },
  zoomMiniDot: { width: 8, height: 8, borderRadius: 4 },
  // Detected Issues
  issuesSection: { paddingHorizontal: 24, marginBottom: 20 },
  sectionLabel: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 12 },
  issuesCard: { backgroundColor: colors.surface, borderRadius: 14, overflow: 'hidden' },
  issuesPhotoRow: { position: 'relative', height: 100, backgroundColor: '#F5F0EB', alignItems: 'center', justifyContent: 'center' },
  issuesPhotoPreview: { width: '100%', height: '100%', position: 'relative' },
  issuesMarker: { position: 'absolute', width: 8, height: 8, borderRadius: 4, opacity: 0.8 },
  issuesPhotoLabel: { position: 'absolute', fontSize: 10, color: colors.textMuted, bottom: 4 },
  issuesList: { padding: 16, gap: 12 },
  issueRow: { flexDirection: 'row', alignItems: 'center' },
  issueDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  issueLabel: { flex: 1, fontSize: 14, color: colors.text },
  issueCount: { fontSize: 14, fontWeight: '700', color: colors.text, textTransform: 'capitalize' },
  // Smart Advice
  adviceSection: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: '#FFF8E7', marginHorizontal: 24, marginBottom: 20, padding: 16, borderRadius: 14, borderLeftWidth: 3, borderLeftColor: colors.warning },
  adviceIconWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,107,138,0.15)', alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  adviceText: { flex: 1, fontSize: 14, lineHeight: 20, color: '#6B5C3A' },
  // Products button
  productsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.primary, marginHorizontal: 24, marginBottom: 20, paddingVertical: 14, borderRadius: 999 },
  productsBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
