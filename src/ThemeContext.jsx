import { createContext, useContext, useState, useEffect } from 'react';

// Theme definitions
const themes = {
  dark: {
    bg: "#050705",      // Deep obsidian
    card: "#0D110D",    // Subtle elevation
    border: "#1A1F1A",  // Hairline border
    accent: "#BAFFD1",  // Minimalist Mint (soft & clean)
    yellow: "#E6D5A7",  // Desaturated gold
    blue: "#A7C7E6",    // Desaturated steel blue
    muted: "#5C665C",   // Low-contrast label text
    white: "#E8EEE8",   // Off-white for high readability
    red: "#CF9292",     // Soft rose (less aggressive)
  },
  light: {
    bg: "#F8FAF8",      // Soft off-white background
    card: "#FFFFFF",    // Pure white cards
    border: "#E5E9E5",  // Light gray borders
    accent: "#2D5A2D",  // Deep forest green
    yellow: "#B8860B",  // Dark goldenrod
    blue: "#4169E1",    // Royal blue
    muted: "#6B7B6B",   // Medium gray text
    white: "#1C241C",   // Dark forest text
    red: "#DC143C",     // Crimson red
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