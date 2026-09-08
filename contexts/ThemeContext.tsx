'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Flip the `dark` class on <html> with transitions suppressed for one frame, so
// the page background, sidebar, navbar and icons all switch at the same instant
// instead of animating at different speeds (which shows a staggered flash where
// one area changes before the others).
function applyThemeClass(theme: Theme) {
  const root = document.documentElement;
  root.classList.add('theme-switching');
  root.classList.toggle('dark', theme === 'dark');
  // Force a reflow so the suppression applies before the class change paints,
  // then release it on the next frame.
  void root.offsetWidth;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      root.classList.remove('theme-switching');
    });
  });
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/admin');
  const storageKey = isAdmin ? 'admin_theme' : 'website_theme';
  const [theme, setThemeState] = useState<Theme>('light');
  const isLoadingTheme = useRef(true);

  useEffect(() => {
    // Apply the saved theme for the current area (admin vs public site).
    const savedTheme = localStorage.getItem(storageKey) === 'dark' ? 'dark' : 'light';
    isLoadingTheme.current = true;
    setThemeState(savedTheme);
    applyThemeClass(savedTheme);
  }, [storageKey]);

  useEffect(() => {
    if (isLoadingTheme.current) {
      isLoadingTheme.current = false;
      return;
    }
    applyThemeClass(theme);
    localStorage.setItem(storageKey, theme);
  }, [storageKey, theme]);

  const toggleTheme = () => {
    setThemeState((currentTheme) => {
      const nextTheme: Theme = currentTheme === 'light' ? 'dark' : 'light';
      applyThemeClass(nextTheme);
      localStorage.setItem(storageKey, nextTheme);
      return nextTheme;
    });
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    applyThemeClass(newTheme);
    localStorage.setItem(storageKey, newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
