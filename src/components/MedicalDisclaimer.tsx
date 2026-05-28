import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { AlertTriangle, CheckCircle, Circle } from 'lucide-react-native';
import { colors } from '../constants/theme';

interface MedicalDisclaimerProps {
  onAgree?: () => void;
  agreed?: boolean;
}

export default function MedicalDisclaimer({ onAgree, agreed }: MedicalDisclaimerProps) {
  const [localAgreed, setLocalAgreed] = useState(false);
  const isAgreed = agreed ?? localAgreed;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AlertTriangle size={16} color={colors.warning} />
        <Text style={styles.title}>Important Medical Disclaimer</Text>
      </View>
      <Text style={styles.body}>
        This skin analysis is for informational and educational purposes only. It is
        not a medical diagnosis, does not replace professional dermatological advice,
        and should not be used to diagnose, treat, or manage any skin condition. Always
        consult a qualified dermatologist or healthcare provider for medical concerns.
      </Text>
      {onAgree && (
        <Pressable style={styles.agreeRow} onPress={() => { setLocalAgreed(!localAgreed); onAgree(); }}>
          {isAgreed ? <CheckCircle size={20} color={colors.primary} /> : <Circle size={20} color={colors.textMuted} />}
          <Text style={styles.agreeText}>I understand and agree to proceed</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF8E7',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  body: {
    fontSize: 12,
    lineHeight: 18,
    color: '#6B5C3A',
  },
  agreeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  agreeText: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '500',
    flex: 1,
  },
});
