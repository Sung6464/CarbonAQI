import { createContext, useContext, useState, useEffect } from 'react';

// Theme definitions
const themes = {
  dark: {
    bg: "#121413",
    card: "#1E2320",
    border: "rgba(255,255,255,0.05)",
    accent: "#10B981",
    blue: "#06B6D4",
    yellow: "#10B981",
    muted: "#94A3B8",
    white: "#F8FAFC",
    red: "#F87171",
    shadow: "0 24px 60px rgba(0, 0, 0, 0.35)",
  },
  light: {
    bg: "#F8FAFC",
    card: "#FFFFFF",
    border: "rgba(15,23,42,0.08)",
    accent: "#10B981",
    blue: "#06B6D4",
    yellow: "#10B981",
    muted: "#64748B",
    white: "#0F172A",
    red: "#EF4444",
    shadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
  }
};

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('dark');

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('carboniq-theme');
    if (savedTheme && themes[savedTheme]) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    const palette = themes[theme];
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.style.setProperty("--color-bg", palette.bg);
    root.style.setProperty("--color-surface", palette.card);
    root.style.setProperty("--color-accent", palette.accent);
    root.style.setProperty("--color-accent-secondary", palette.blue);
    root.style.setProperty("--color-accent-soft", theme === "dark" ? "#34D399" : "#67E8F9");
    root.style.setProperty("--color-text-primary", palette.white);
    root.style.setProperty("--color-text-secondary", palette.muted);
    root.style.setProperty("--color-border", palette.border);
    root.style.setProperty("--color-shadow", palette.shadow);
  }, [theme]);

  // Save theme to localStorage when changed
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('carboniq-theme', newTheme);
  };

  const colors = themes[theme];

  return (
    <ThemeContext.Provider value={{ theme, colors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
