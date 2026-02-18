'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  mobileNumber: string;
  role?: string;
  tenantId?: number;
}

interface AuthContextType {
  user: User | null;
  login: (token: string, userData: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // 🔥 Restore from localStorage on app load
  useEffect(() => {
    const storedUser = localStorage.getItem("auth_user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = (token: string, userData: User) => {
    setUser(userData);

    // Store token for middleware
    document.cookie = `auth_token=${token}; path=/; max-age=86400; samesite=lax`;

    // Store user for offline restore
    localStorage.setItem("auth_user", JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);

    document.cookie = 'auth_token=; Max-Age=0; path=/;';
    localStorage.removeItem("auth_user");

    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
