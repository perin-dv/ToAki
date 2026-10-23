import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "../lib/firebase";
import { identificadorEmpresaValido } from "../lib/empresaId";

export type UserRole = "admin_toaki" | "dono_empresa" | "gestor" | "vendedor" | "entregador" | "cliente";
type AuthState = {
  user: User | null;
  role: UserRole | null;
  empresaId: string | null;
  sandboxTester: boolean;
  loading: boolean;
  refreshClaims: () => Promise<void>;
};
const AuthContext = createContext<AuthState | null>(null);
const validRoles = new Set<UserRole>(["admin_toaki","dono_empresa","gestor","vendedor","entregador","cliente"]);

function parseRole(value: unknown): UserRole | null {
  return typeof value === "string" && validRoles.has(value as UserRole) ? value as UserRole : null;
}

/** O Auth é a identidade. O vínculo empresarial vem SOMENTE das claims assinadas pelo Firebase. */
export function AuthProvider({children}: {children: ReactNode}) {
  const [user,setUser] = useState<User|null>(null);
  const [role,setRole] = useState<UserRole|null>(null);
  const [empresaId,setEmpresaId] = useState<string|null>(null);
  const [sandboxTester,setSandboxTester] = useState(false);
  const [loading,setLoading] = useState(true);

  const limpar = useCallback(() => {
    setUser(null);setRole(null);setEmpresaId(null);setSandboxTester(false);
  },[]);

  const refreshClaims = useCallback(async () => {
    const current = auth.currentUser;
    if (!current) { limpar(); return; }
    const token = await current.getIdTokenResult(true);
    // Se a sessão trocou durante a consulta, não usar as claims de outra conta.
    if (auth.currentUser?.uid !== current.uid) return;
    const papel=parseRole(token.claims.role);
    const id=token.claims.empresa_id;
    setRole(papel);
    setEmpresaId(papel && typeof id==="string" && identificadorEmpresaValido(id) ? id : null);
    setSandboxTester(token.claims.toaki_sandbox_tester===true && id==="empresa_teste_soma");
    setUser(current);
  },[limpar]);

  useEffect(() => {
    let valido=true;
    const unsubscribe = onAuthStateChanged(auth, next => {
      if (!next) { limpar(); setLoading(false); return; }
      setUser(next);
      setLoading(true);
      // Uma nova sessão lê as claims do servidor, não depende de clicar em Atualizar permissão.
      void refreshClaims().catch(() => {
        if (valido) { setRole(null);setEmpresaId(null);setSandboxTester(false); }
      }).finally(() => { if(valido)setLoading(false); });
    });
    // Se o administrador concedeu uma permissão com o painel aberto, atualizar ao voltar à aba.
    const aoVoltar = () => {
      if (document.visibilityState==="visible" && auth.currentUser)
        void refreshClaims().catch(() => {/* erro permanece sem conceder acesso */});
    };
    document.addEventListener("visibilitychange",aoVoltar);
    window.addEventListener("focus",aoVoltar);
    return () => { valido=false;unsubscribe();document.removeEventListener("visibilitychange",aoVoltar);window.removeEventListener("focus",aoVoltar); };
  },[refreshClaims,limpar]);

  const value = useMemo(() => ({user,role,empresaId,sandboxTester,loading,refreshClaims}),
    [user,role,empresaId,sandboxTester,loading,refreshClaims]);
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
  const value:AuthState={user:falso,role:null,empresaId:null,sandboxTester:false,loading:false,refreshClaims:async()=>{}};
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
