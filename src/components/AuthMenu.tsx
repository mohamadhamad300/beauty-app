import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LogIn, UserPlus, LogOut, User } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../constants/theme';

export default function AuthMenu() {
  const { isLoggedIn, user, logout } = useAuth();
  const nav = useNavigation<any>();

  if (isLoggedIn && user) {
    return (
      <View style={s.row}>
        <View style={s.userInfo}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{user.name[0].toUpperCase()}</Text>
          </View>
          <Text style={s.userName} numberOfLines={1}>{user.name}</Text>
        </View>
        <Pressable style={s.btn} onPress={logout}>
          <LogOut color="#fff" size={16} />
          <Text style={s.btnText}>Sign Out</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.scroll}>
      <Pressable style={[s.btn, s.btnPrimary]} onPress={() => nav.navigate('SignIn')}>
        <LogIn color="#fff" size={16} />
        <Text style={s.btnText}>Sign In</Text>
      </Pressable>
      <Pressable style={s.btn} onPress={() => nav.navigate('Register')}>
        <UserPlus color="#fff" size={16} />
        <Text style={s.btnText}>Register</Text>
      </Pressable>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#222',
  },
  scroll: {
    flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, gap: 8,
    backgroundColor: '#222',
  },
  userInfo: {
    flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1,
  },
  avatar: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: {
    color: '#fff', fontSize: 14, fontWeight: '700',
  },
  userName: {
    color: '#fff', fontSize: 14, fontWeight: '600', flex: 1,
  },
  btn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#333', paddingVertical: 8, paddingHorizontal: 14,
    borderRadius: 8,
  },
  btnPrimary: {
    backgroundColor: colors.primary,
  },
  btnText: {
    color: '#fff', fontSize: 13, fontWeight: '600',
  },
});
