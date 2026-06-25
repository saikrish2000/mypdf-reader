import { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthCtx {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({ user: null, session: null, loading: true, signOut: async () => {} });

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const timeout = setTimeout(() => {
      if (!cancelled) setLoading(false);
    }, 5000);

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      if (cancelled) return;
      setSession(s);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setSession(data.session);
    }).catch((err) => {
      if (import.meta.env.DEV) console.warn('getSession failed:', err);
    }).finally(() => {
      if (cancelled) return;
      clearTimeout(timeout);
      setLoading(false);
    });

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      sub.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase?.auth.signOut();
  };

  return (
    <Ctx.Provider value={{ user: session?.user ?? null, session, loading, signOut }}>
      {children}
    </Ctx.Provider>
  );
};

export const useAuth = () => useContext(Ctx);
