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
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  // Starts true: on first load we don't yet know if the stored token
  // (if any) is still valid, so routes shouldn't decide anything until
  // this initial check finishes.
  const [isLoading, setIsLoading] = useState(true);

  // On app start, if there's a token in localStorage, try to load the
  // current user's profile with it. If it's expired/invalid, the axios
  // 401 interceptor will already clear it and redirect — we just need
  // to handle the "no token at all" and "success" cases here.
  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      setIsLoading(false);
      return;
    }

    getMyProfile()
      .then((profile) => setUser(profile))
      .catch(() => {
        // Token was invalid/expired; interceptor already cleared it.
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (credentials: UserLogin) => {
    const { access_token } = await loginUser(credentials);
    localStorage.setItem("access_token", access_token);

    const profile = await getMyProfile();
    setUser(profile);
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: user !== null,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook for consuming the context — throws early if used outside
// the provider, which is a much clearer error than a silent undefined.
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}