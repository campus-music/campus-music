// Authentication context for mobile app
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { User, LoginRequest, SignupRequest } from "../../shared/types";
import { apiRequest, clearSession } from "./api";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginRequest) => Promise<void>;
  signup: (data: SignupRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const userData = await apiRequest<User>("/auth/me");
      setUser(userData);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      await refreshUser();
      setIsLoading(false);
    };
    checkAuth();
  }, [refreshUser]);

  const login = async (data: LoginRequest) => {
    const userData = await apiRequest<User>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
    setUser(userData);
  };

  const signup = async (data: SignupRequest) => {
    const userData = await apiRequest<User>("/auth/signup", {
      method: "POST",
      body: JSON.stringify(data),
    });
    setUser(userData);
  };

  const logout = async () => {
    try {
      await apiRequest("/auth/logout", { method: "POST" });
    } catch {
      // Ignore logout errors
    }
    await clearSession();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
