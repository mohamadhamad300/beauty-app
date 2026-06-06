import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { LogIn, UserPlus, LogOut, Menu } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../constants/theme';

export default function AuthMenu() {
  const { isLoggedIn, user, logout } = useAuth();
  const nav = useNavigation<any>();
  const [open, setOpen] = useState(false);

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
    <View style={s.wrapper}>
      <Pressable style={s.hamburger} onPress={() => setOpen(!open)}>
        <Menu color="#fff" size={22} />
      </Pressable>
      {open && (
        <View style={s.dropdown}>
          <Pressable style={[s.dropBtn, s.btnPrimary]} onPress={() => { setOpen(false); nav.navigate('SignIn'); }}>
            <LogIn color="#fff" size={16} />
            <Text style={s.btnText}>Sign In</Text>
          </Pressable>
          <Pressable style={s.dropBtn} onPress={() => { setOpen(false); nav.navigate('Register'); }}>
            <UserPlus color="#fff" size={16} />
            <Text style={s.btnText}>Register</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: {
    position: 'relative', zIndex: 99,
  },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#222',
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
  hamburger: {
    padding: 10, alignItems: 'center', justifyContent: 'center',
  },
  dropdown: {
    position: 'absolute', top: 44, right: 8,
    backgroundColor: '#2a2a2a', borderRadius: 10,
    padding: 6, gap: 4, elevation: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 6,
    minWidth: 150,
  },
  dropBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#333', paddingVertical: 10, paddingHorizontal: 14,
    borderRadius: 8,
  },
  btnPrimary: {
    backgroundColor: colors.primary,
  },
  btnText: {
    color: '#fff', fontSize: 14, fontWeight: '600',
  },
});
