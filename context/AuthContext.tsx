"use client";

import { localDb } from "@/lib/db";
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
  role?: string ;
  tenantId?: number;
  name?: string;
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

    // Store user for offline restore
    localStorage.setItem("auth_user", JSON.stringify(userData));
  };

  const logout = async () => {
    setUser(null);
    // 3. Clear all Dexie Database Tables
    try {
      await Promise.all([
        localDb.voters.clear(),
        localDb.syncQueue.clear(),
        localDb.tenants.clear(),
        localDb.workers.clear(),
      ]);
      console.log("Local database successfully wiped on logout.");
    } catch (error) {
      console.error("Failed to clear local database during logout:", error);
    }
    localStorage.removeItem("auth_user");
    console.trace("🚨 I AM REDIRECTING TO LOGIN! 🚨");
    window.location.href = "/login";
  };;

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
