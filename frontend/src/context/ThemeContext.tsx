import React, { createContext, useContext, useState, useEffect } from 'react';

type ThemeMode = 'dark' | 'light';

interface ThemeContextType {
  theme: ThemeMode;
  toggleTheme: (origin?: { x: number; y: number }) => void;
  setTheme: (theme: ThemeMode) => void;
  isCursorTrailEnabled: boolean;
  toggleCursorTrail: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('nexus_theme');
    return (saved as ThemeMode) || 'dark';
  });

  const [isCursorTrailEnabled, setIsCursorTrailEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('nexus_cursor_trail');
    return saved !== null ? saved === 'true' : true;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    } else {
      root.classList.add('dark');
      root.classList.remove('light');
      root.setAttribute('data-theme', 'dark');
    }
    localStorage.setItem('nexus_theme', theme);
  }, [theme]);

  const toggleTheme = (origin?: { x: number; y: number }) => {
    // If the browser supports View Transitions API, use circular clip-path wipe!
    if (typeof document !== 'undefined' && 'startViewTransition' in document) {
      const x = origin?.x ?? window.innerWidth - 40;
      const y = origin?.y ?? 40;
      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      );

      const transition = (document as any).startViewTransition(() => {
        setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
      });

      transition.ready.then(() => {
        const clipPath = [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${endRadius}px at ${x}px ${y}px)`
        ];
        document.documentElement.animate(
          {
            clipPath: clipPath,
          },
          {
            duration: 500,
            easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
            pseudoElement: '::view-transition-new(root)',
          }
        );
      }).catch(() => {
        // Fallback gracefully
      });
    } else {
      setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
    }
  };

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
  };

  const toggleCursorTrail = () => {
    setIsCursorTrailEnabled((prev) => {
      const next = !prev;
      localStorage.setItem('nexus_cursor_trail', String(next));
      return next;
    });
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        setTheme,
        isCursorTrailEnabled,
        toggleCursorTrail,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
