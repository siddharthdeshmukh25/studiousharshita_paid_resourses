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

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/admin');
  const storageKey = isAdmin ? 'admin_theme' : 'website_theme';
  const [theme, setThemeState] = useState<Theme>('light');
  const isLoadingTheme = useRef(true);

  useEffect(() => {
    // Force dark mode for admin pages
    if (isAdmin) {
      isLoadingTheme.current = true;
      setThemeState('dark');
      document.documentElement.classList.add('dark');
      localStorage.setItem(storageKey, 'dark');
      return;
    }
    
    const savedTheme = localStorage.getItem(storageKey) === 'dark' ? 'dark' : 'light';
    isLoadingTheme.current = true;
    setThemeState(savedTheme);
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
  }, [storageKey, isAdmin]);

  useEffect(() => {
    if (isLoadingTheme.current) {
      isLoadingTheme.current = false;
      return;
    }
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem(storageKey, theme);
  }, [storageKey, theme]);

  const toggleTheme = () => {
    // Prevent theme toggle for admin pages
    if (isAdmin) {
      return;
    }
    
    setThemeState((currentTheme) => {
      const nextTheme: Theme = currentTheme === 'light' ? 'dark' : 'light';
      document.documentElement.classList.toggle('dark', nextTheme === 'dark');
      localStorage.setItem(storageKey, nextTheme);
      return nextTheme;
    });
  };

  const setTheme = (newTheme: Theme) => {
    // Prevent theme change for admin pages
    if (isAdmin) {
      return;
    }
    
    setThemeState(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
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
