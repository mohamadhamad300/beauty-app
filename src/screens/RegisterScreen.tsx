import { useState, useCallback } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../constants/theme';

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = useCallback(async () => {
    setLoading(true);
    const err = await register(name, email, password);
    setLoading(false);
    if (err) {
      Alert.alert('Error', err);
    } else {
      nav.goBack();
    }
  }, [name, email, password, register, nav]);

  return (
    <KeyboardAvoidingView style={[s.container, { paddingTop: insets.top }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.header}>
        <Pressable onPress={() => nav.goBack()} style={s.backBtn}>
          <ArrowLeft color="#fff" size={22} />
        </Pressable>
        <Text style={s.title}>Register</Text>
        <View style={{ width: 40 }} />
      </View>
      <View style={s.form}>
        <Text style={s.label}>Name</Text>
        <TextInput
          style={s.input}
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          placeholderTextColor="#666"
        />
        <Text style={s.label}>Email</Text>
        <TextInput
          style={s.input}
          value={email}
          onChangeText={setEmail}
          placeholder="your@email.com"
          placeholderTextColor="#666"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Text style={s.label}>Password</Text>
        <TextInput
          style={s.input}
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          placeholderTextColor="#666"
          secureTextEntry
        />
        <Pressable style={[s.submitBtn, loading && s.disabled]} onPress={handleRegister} disabled={loading}>
          <Text style={s.submitText}>{loading ? 'Creating account...' : 'Register'}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a1a' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: { padding: 8 },
  title: { color: '#fff', fontSize: 18, fontWeight: '700' },
  form: { padding: 24, gap: 8 },
  label: { color: '#aaa', fontSize: 13, fontWeight: '600', marginTop: 12 },
  input: {
    backgroundColor: '#222', color: '#fff', fontSize: 16,
    paddingVertical: 14, paddingHorizontal: 16, borderRadius: 10,
    borderWidth: 1, borderColor: '#333',
  },
  submitBtn: {
    backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 12,
    alignItems: 'center', marginTop: 24,
  },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  disabled: { opacity: 0.5 },
});
