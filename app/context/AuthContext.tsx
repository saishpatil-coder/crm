'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

// Define what your User object looks like
interface User {
  id: string;
  phone: string;
  role?: string;
  // add other fields you return from your backend like 'tenantId'
}

interface AuthContextType {
  user: User | null;
  login: (token: string, userData: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = (token: string, userData: User) => {
    console.log("context : ",userData)
    // 1. Save user in state
    setUser(userData);
    // 2. Save token in a cookie so middleware can read it on page reloads
    document.cookie = `auth_token=${token}; path=/; max-age=116786400; secure; samesite=lax`;
  };

  const logout = () => {
    setUser(null);
    document.cookie = 'auth_token=; Max-Age=0; path=/;';
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the auth context easily
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};