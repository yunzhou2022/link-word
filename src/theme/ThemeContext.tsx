import { createContext, useContext, useMemo } from 'react';
import { THEMES, DEFAULT_THEME_ID, type Theme } from './themes';
import { useSettings } from '../hooks/useSettings';

const ThemeContext = createContext<Theme>(THEMES[DEFAULT_THEME_ID]);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings();
  const theme = useMemo(
    () => THEMES[settings.themeId] ?? THEMES[DEFAULT_THEME_ID],
    [settings.themeId],
  );
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
