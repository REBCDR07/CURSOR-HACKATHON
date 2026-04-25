import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  getSession,
  login as loginUser,
  logout as logoutUser,
  signupDoctor,
  signupPatient,
} from '../lib/auth';
import type { SessionData, UserRole } from '../types/domain';

interface AuthContextValue {
  loading: boolean;
  session: SessionData | null;
  refreshSession: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (
    role: UserRole,
    payload: {
      nom: string;
      prenom: string;
      email: string;
      password: string;
      specialite?: string;
      numeroRPPS?: string;
    },
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const STORAGE_ERROR = 'Stockage local indisponible. Relancez l\'application puis reessayez.';

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<SessionData | null>(null);

  const refreshSession = useCallback(async () => {
    try {
      const s = await getSession();
      setSession(s);
    } catch {
      setSession(null);
    }
  }, []);

  useEffect(() => {
    refreshSession().finally(() => setLoading(false));
  }, [refreshSession]);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const result = await loginUser(email, password);
        if (!result.success) return { success: false, error: result.error };
        await refreshSession();
        return { success: true };
      } catch {
        return { success: false, error: STORAGE_ERROR };
      }
    },
    [refreshSession],
  );

  const signup = useCallback<AuthContextValue['signup']>(
    async (role, payload) => {
      try {
        const result =
          role === 'patient'
            ? await signupPatient(payload.nom, payload.prenom, payload.email, payload.password)
            : await signupDoctor(
                payload.nom,
                payload.prenom,
                payload.email,
                payload.password,
                payload.specialite ?? '',
                payload.numeroRPPS ?? '',
              );

        if (!result.success) return { success: false, error: result.error };
        await refreshSession();
        return { success: true };
      } catch {
        return { success: false, error: STORAGE_ERROR };
      }
    },
    [refreshSession],
  );

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } finally {
      await refreshSession();
    }
  }, [refreshSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      loading,
      session,
      refreshSession,
      login,
      signup,
      logout,
    }),
    [loading, session, refreshSession, login, signup, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
