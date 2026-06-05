import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<string | null>;
  register: (name: string, email: string, password: string) => Promise<string | null>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

let nextId = 1;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, isLoggedIn: false });

  const login = useCallback(async (email: string, _password: string): Promise<string | null> => {
    await new Promise((r) => setTimeout(r, 500));
    if (!email.includes('@')) return 'Invalid email';
    const user: User = { id: String(nextId++), name: email.split('@')[0], email };
    setState({ user, isLoggedIn: true });
    return null;
  }, []);

  const register = useCallback(async (name: string, email: string, _password: string): Promise<string | null> => {
    await new Promise((r) => setTimeout(r, 500));
    if (!email.includes('@')) return 'Invalid email';
    if (name.length < 2) return 'Name too short';
    const user: User = { id: String(nextId++), name, email };
    setState({ user, isLoggedIn: true });
    return null;
  }, []);

  const logout = useCallback(() => {
    setState({ user: null, isLoggedIn: false });
  }, []);

  const value = useMemo(() => ({ ...state, login, register, logout }), [state, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
