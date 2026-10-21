import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import { getThemePreference, setThemePreference, type ThemePreference } from '@/lib/theme-storage';

type ThemeContextValue = {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getThemePreference().then((pref) => {
      if (active) {
        setPreferenceState(pref);
        setIsLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  async function setPreference(newPreference: ThemePreference) {
    await setThemePreference(newPreference);
    setPreferenceState(newPreference);
  }

  if (isLoading) return null;

  return (
    <ThemeContext.Provider value={{ preference, setPreference }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemePreference() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useThemePreference must be used within ThemeProvider');
  return context;
}
