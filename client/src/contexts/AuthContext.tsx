import { createContext, useContext, useState, ReactNode, useEffect, useMemo } from "react";
import { authService } from "@/services/auth.service";
import { toast } from "sonner";
import { API_BASE_URL, apiOrigin, resolveAppUrl } from "@/config/env";

export type UserRole = "patient" | "doctor";

export interface User {
  id: string;
  prenom?: string;
  nom?: string;
  pseudo?: string;
  email: string;
  role: UserRole;
  specialite?: string;
  clinique?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<User>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  /** Base des appels API (ex. `/api` ou `https://…/api`) */
  apiBaseUrl: string;
  /** Origine backend si définie (`VITE_API_URL`), sinon chaîne vide en dev proxy */
  apiOrigin: string;
  /** URL du front (env ou navigateur) */
  appUrl: string;
}

interface RegisterData {
  prenom: string;
  nom: string;
  pseudo?: string;
  email: string;
  password: string;
  role: UserRole;
  specialite?: string;
  clinique?: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const data = await authService.login(email, password);
      const newUser: User = {
        id: data._id,
        email: data.email,
        role: data.role,
        pseudo: data.pseudo,
      };
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(newUser));
      setUser(newUser);
      toast.success("Connexion réussie !");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erreur de connexion");
      throw error;
    }
  };

  const register = async (data: RegisterData): Promise<User> => {
    try {
      const res = await authService.register(data);
      const newUser: User = {
        id: res._id,
        email: res.email,
        role: res.role,
        pseudo: res.pseudo,
      };
      localStorage.setItem("token", res.token);
      localStorage.setItem("user", JSON.stringify(newUser));
      setUser(newUser);
      toast.success("Compte créé avec succès !");
      return newUser;
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erreur lors de l'inscription");
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const envSlice = useMemo(
    () => ({
      apiBaseUrl: API_BASE_URL,
      apiOrigin,
      appUrl: resolveAppUrl(),
    }),
    []
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        isLoading,
        ...envSlice,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
