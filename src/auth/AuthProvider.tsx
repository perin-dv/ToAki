import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "../lib/firebase";

export type UserRole = "admin_toaki" | "dono_empresa" | "gestor" | "vendedor" | "entregador" | "cliente";
type AuthState = { user: User | null; role: UserRole | null; loading: boolean; refreshClaims: () => Promise<void> };
const AuthContext = createContext<AuthState | null>(null);

const validRoles = new Set<UserRole>(["admin_toaki","dono_empresa","gestor","vendedor","entregador","cliente"]);
function parseRole(value: unknown): UserRole | null {
  return typeof value === "string" && validRoles.has(value as UserRole) ? value as UserRole : null;
}

export function AuthProvider({children}: {children: ReactNode}) {
  const [user,setUser] = useState<User|null>(null);
  const [role,setRole] = useState<UserRole|null>(null);
  const [loading,setLoading] = useState(true);
  const refreshClaims = async () => {
    const current = auth.currentUser;
    if (!current) { setUser(null); setRole(null); return; }
    const result = await current.getIdTokenResult(true);
    setRole(parseRole(result.claims.role));
    setUser(current);
  };
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async next => {
      setLoading(true);
      if (!next) { setUser(null); setRole(null); setLoading(false); return; }
      setUser(next);
      try {
        const token = await next.getIdTokenResult();
        setRole(parseRole(token.claims.role));
      } catch { setRole(null); }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);
  const value = useMemo(() => ({user,role,loading,refreshClaims}),[user,role,loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx=useContext(AuthContext);
  if(!ctx) throw new Error("AuthProvider ausente");
  return ctx;
}
