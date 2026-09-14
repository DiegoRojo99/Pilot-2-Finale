import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';

import { getMobileSession, registerWithEmail, signInWithEmail, signOut as signOutRequest } from '@/lib/auth';
import type { AuthSessionResponse, AuthUser } from '@/types/api';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

type AuthContextValue = {
  status: AuthStatus;
  user: AuthUser | null;
  signIn: (input: { email: string; password: string }) => Promise<void>;
  register: (input: { name: string; email: string; password: string }) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function getUserFromSession(session: AuthSessionResponse) {
  return session?.user ?? null;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);

  async function applySession(session: AuthSessionResponse) {
    const sessionUser = getUserFromSession(session);
    setUser(sessionUser);
    setStatus(sessionUser ? 'authenticated' : 'unauthenticated');
  }

  async function refreshSession() {
    const session = await getMobileSession();
    await applySession(session);
  }

  useEffect(() => {
    let isMounted = true;

    void getMobileSession()
      .then((session) => {
        if (!isMounted) return;
        void applySession(session);
      })
      .catch(() => {
        if (!isMounted) return;
        setUser(null);
        setStatus('unauthenticated');
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const value: AuthContextValue = {
    status,
    user,
    signIn: async (input) => {
      const session = await signInWithEmail(input);
      await applySession(session);
    },
    register: async (input) => {
      const session = await registerWithEmail(input);
      await applySession(session);
    },
    signOut: async () => {
      await signOutRequest();
      setUser(null);
      setStatus('unauthenticated');
    },
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }

  return context;
}