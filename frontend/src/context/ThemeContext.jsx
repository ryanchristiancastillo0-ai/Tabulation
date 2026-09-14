// providers/ThemeProvider.jsx
// Centralizes the admin dark/light theme state and shares it across all
// /admin routes (Dashboard, Leaderboard, etc.).
//
// The `dark` class is applied to a wrapping <div> so the CSS variables in
// index.css (.dark { ... }) cascade to every child page/component.

import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('adminDarkMode');
    return saved !== null ? saved === 'true' : false;
  });

  useEffect(() => {
    localStorage.setItem('adminDarkMode', dark);
  }, [dark]);

  const toggleDark = () => setDark((d) => !d);

  return (
    <ThemeContext.Provider value={{ dark, setDark, toggleDark }}>
      <div className={dark ? 'dark' : ''}>{children}</div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a <ThemeProvider>');
  }
  return ctx;
}