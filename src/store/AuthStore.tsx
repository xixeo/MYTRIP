import { Session, User } from '@supabase/supabase-js';
import React, { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';

import { supabase, supabaseConfigured } from '@/lib/supabase';

interface AuthContextValue {
  configured: boolean; loading: boolean; session: Session | null; user: User | null;
  signIn: (email: string, password: string) => Promise<string | undefined>;
  signUp: (email: string, password: string) => Promise<string | undefined>;
  signOut: () => Promise<void>;
}
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null); const [loading, setLoading] = useState(supabaseConfigured);
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session)).finally(() => setLoading(false));
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);
  const value = useMemo<AuthContextValue>(() => ({
    configured: supabaseConfigured, loading, session, user: session?.user ?? null,
    signIn: async (email, password) => { if (!supabase) return 'Supabase 환경 설정이 필요합니다.'; const { error } = await supabase.auth.signInWithPassword({ email, password }); return error?.message; },
    signUp: async (email, password) => { if (!supabase) return 'Supabase 환경 설정이 필요합니다.'; const { error } = await supabase.auth.signUp({ email, password }); return error?.message; },
    signOut: async () => { await supabase?.auth.signOut(); },
  }), [loading, session]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() { const value = useContext(AuthContext); if (!value) throw new Error('useAuth must be used inside AuthProvider'); return value; }
