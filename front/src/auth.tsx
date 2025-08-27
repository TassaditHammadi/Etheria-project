import { createContext, useContext, useEffect, useState } from "react";

type AuthContextType = {
  token: string | null;
  setToken: (t: string | null) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>(null!);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => localStorage.getItem("access"));

  const setToken = (t: string | null) => {
    if (t) localStorage.setItem("access", t);
    else localStorage.removeItem("access");
    setTokenState(t);
  };

  const logout = () => setToken(null);

  // sync quand un autre onglet change le localStorage
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "access") setTokenState(localStorage.getItem("access"));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return <AuthContext.Provider value={{ token, setToken, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
