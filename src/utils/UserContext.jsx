import React, { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('property_dna_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Keep context in sync with localStorage (e.g. after sign-in from main app)
  useEffect(() => {
    const sync = () => {
      try {
        const stored = localStorage.getItem('property_dna_user');
        setUser(stored ? JSON.parse(stored) : null);
      } catch {
        setUser(null);
      }
    };
    window.addEventListener('storage', sync);
    // Also re-check every time the tab gains focus (same-tab sign-in)
    window.addEventListener('focus', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('focus', sync);
    };
  }, []);

  const signOut = () => {
    localStorage.removeItem('property_dna_user');
    setUser(null);
  };

  return (
    <UserContext.Provider value={{ user, setUser, signOut }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used inside <UserProvider>');
  return ctx;
}
