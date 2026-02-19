"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

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
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start as loading
  // 🔥 Restore from localStorage on app load
  useEffect(() => {
    const storedUser = localStorage.getItem("auth_user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse stored user", e);
      }
    }
    // 2. Crucially, mark loading as false AFTER the check is complete
    setIsLoading(false);
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

    document.cookie = "auth_token=; Max-Age=0; path=/;";
    localStorage.removeItem("auth_user");
console.trace("🚨 I AM REDIRECTING TO LOGIN! 🚨");
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
