import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "../lib/firebase";

export type UserRole = "admin_toaki" | "dono_empresa" | "gestor" | "vendedor" | "entregador" | "cliente";
type AuthState = { user: User | null; role: UserRole | null; sandboxTester:boolean; loading: boolean; refreshClaims: () => Promise<void> };
const AuthContext = createContext<AuthState | null>(null);

const validRoles = new Set<UserRole>(["admin_toaki","dono_empresa","gestor","vendedor","entregador","cliente"]);
function parseRole(value: unknown): UserRole | null {
  return typeof value === "string" && validRoles.has(value as UserRole) ? value as UserRole : null;
}

export function AuthProvider({children}: {children: ReactNode}) {
  const [user,setUser] = useState<User|null>(null);
  const [role,setRole] = useState<UserRole|null>(null);
  const [sandboxTester,setSandboxTester] = useState(false);
  const [loading,setLoading] = useState(true);
  const refreshClaims = async () => {
    const current = auth.currentUser;
    if (!current) { setUser(null); setRole(null); setSandboxTester(false); return; }
    const result = await current.getIdTokenResult(true);
    setRole(parseRole(result.claims.role));
    setSandboxTester(result.claims.toaki_sandbox_tester===true && result.claims.empresa_id==="empresa_teste_soma");
    setUser(current);
  };
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async next => {
      setLoading(true);
      if (!next) { setUser(null); setRole(null); setSandboxTester(false); setLoading(false); return; }
      setUser(next);
      try {
        const token = await next.getIdTokenResult();
        setRole(parseRole(token.claims.role));
        setSandboxTester(token.claims.toaki_sandbox_tester===true && token.claims.empresa_id==="empresa_teste_soma");
      } catch { setRole(null); setSandboxTester(false); }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);
  const value = useMemo(() => ({user,role,sandboxTester,loading,refreshClaims}),[user,role,sandboxTester,loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx=useContext(AuthContext);
  if(!ctx) throw new Error("AuthProvider ausente");
  return ctx;
}

/** E2E: somente importado em builds --mode e2e. Não autentica usuários nem acessa Firestore. */
export function ContaTesteProvider({children}:{children:ReactNode}) {
  const falso={
    uid:"e2e-usuario-exemplo",
    email:"teste@example.com",
    displayName:"Teste Exemplo",
    emailVerified:false,
    metadata:{creationTime:"2026-10-22T10:00:00.000Z"}
  } as User;
  const value:AuthState={user:falso,role:null,sandboxTester:false,loading:false,refreshClaims:async()=>{}};
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
