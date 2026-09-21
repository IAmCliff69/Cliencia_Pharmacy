import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { loginUser, getMyProfile } from "../api/auth";
import type { UserResponse, UserLogin } from "../types/auth";

interface AuthContextType {
  user: UserResponse | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: UserLogin) => Promise<void>;
  refreshProfile: () => Promise<UserResponse>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // sessionStorage is tab-specific — each tab manages its own session
    const token = sessionStorage.getItem("access_token");

    if (!token) {
      setIsLoading(false);
      return;
    }

    getMyProfile()
      .then((profile) => setUser(profile))
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (credentials: UserLogin) => {
    const { access_token } = await loginUser(credentials);
    sessionStorage.setItem("access_token", access_token);
    const profile = await getMyProfile();
    setUser(profile);
  };

  const refreshProfile = async () => {
    const profile = await getMyProfile();
    setUser(profile);
    return profile;
  };

  const logout = () => {
    sessionStorage.removeItem("access_token");
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: user !== null,
    login,
    refreshProfile,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}