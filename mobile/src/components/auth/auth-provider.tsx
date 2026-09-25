import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import { AppState } from 'react-native';
import { setSessionRefreshHandler } from '@/lib/api';
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

  function applySession(session: AuthSessionResponse) {
    const sessionUser = getUserFromSession(session);
    setUser(sessionUser);
    setStatus(sessionUser ? 'authenticated' : 'unauthenticated');
  }

  async function refreshSession() {
    const session = await getMobileSession();
    applySession(session);
  }

  useEffect(() => {
    let isMounted = true;
    let refreshInterval: ReturnType<typeof setInterval> | null = null;

    const loadSession = async () => {
      try {
        const session = await getMobileSession();
        if (!isMounted) return;
        applySession(session);
      } 
      catch {
        if (!isMounted) return;
        setUser(null);
        setStatus('unauthenticated');
      }
    };

    const handleAppStateChange = (nextState: string) => {
      if (nextState === 'active') void loadSession();
    };

    void loadSession();
    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );

    refreshInterval = setInterval(() => {
      void loadSession();
    }, 10 * 60 * 1000);

    return () => {
      isMounted = false;
      subscription.remove();
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, []);

  useEffect(() => {
    setSessionRefreshHandler(async () => {
      try {
        const session = await getMobileSession();

        if (!session?.user) {
          setUser(null);
          setStatus('unauthenticated');
          return false;
        }

        applySession(session);
        return true;
      } catch {
        setUser(null);
        setStatus('unauthenticated');
        return false;
      }
    });

    return () => {
      setSessionRefreshHandler(null);
    };
  }, []);

  const value: AuthContextValue = {
    status,
    user,
    signIn: async (input) => {
      const session = await signInWithEmail(input);
      applySession(session);
    },
    register: async (input) => {
      const session = await registerWithEmail(input);
      applySession(session);
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