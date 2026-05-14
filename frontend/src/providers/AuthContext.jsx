// context/AuthContext.jsx
// Provides token, school_id, and admin info to the entire app.
// Wrap your <App /> with <AuthProvider> in main.jsx.

import React, { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    // Rehydrate from localStorage on page refresh
    try {
      const stored = localStorage.getItem('auth');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Call this after a successful login
  const login = useCallback((data) => {
    // data = { token, admin: { id, name, email, school_id, school_name, school_logo, plan } }
    localStorage.setItem('auth', JSON.stringify(data));
    setAuth(data);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('auth');
    setAuth(null);
  }, []);

  const value = {
    token:     auth?.token     ?? null,
    admin:     auth?.admin     ?? null,
    school_id: auth?.admin?.school_id ?? null,
    isLoggedIn: !!auth?.token,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook — use anywhere: const { token, school_id } = useAuth();
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}