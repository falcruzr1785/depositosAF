// src/context/AuthContext.tsx
import {
  createContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  login as apiLogin,
  getMe,
  getAuthToken,
  clearAuthToken as apiClearAuth,
} from "../utils/api";


// Ajusta este tipo si /api/v1/auth/me devuelve más/menos campos
export type Me = {
  cedula: string;
  is_admin?: boolean;
  disabled?: boolean;
  full_name?: string;

};

export type AuthContextValue = {
  user: Me | null;
  loading: boolean;
  login: (cedula: string, password: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  // Al montar: si hay token, trae el perfil
  useEffect(() => {
    let alive = true;

    const token = getAuthToken();
    if (!token) {
      setLoading(false);
      return;
    }

    getMe()
      .then((u) => {
        if (alive) setUser(u);
      })
      .catch(() => {
        // Si falla (401/expirado), limpia el token
        apiClearAuth();
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  async function login(cedula: string, password: string) {
    // apiLogin guarda el token en localStorage
    await apiLogin(cedula, password);
    const u = await getMe();
    setUser(u);
  }

  function logout() {
    apiClearAuth();
    setUser(null);
  }

  async function refresh() {
    const u = await getMe();
    setUser(u);
  }

  const value: AuthContextValue = { user, loading, login, logout, refresh };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}


