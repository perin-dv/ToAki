import { Navigate, useLocation } from "react-router-dom";
import { useAuth, type UserRole } from "../auth/AuthProvider";
import type { ReactNode } from "react";
type Area="empresa"|"admin"|"cliente"|"demo";
const companyRoles: UserRole[]=["dono_empresa","gestor","vendedor"];
export default function PrivateRoute({area,children}:{area:Area; children:ReactNode}) {
  const {user,role,loading}=useAuth();
  const location=useLocation();
  if (loading) return <div className="loading" role="status">Verificando acesso...</div>;
  if (!user) return <Navigate to="/login" replace state={{from:location.pathname}}/>;
  if (!user.emailVerified && area!=="cliente" && area!=="demo") return <Navigate to="/verificar-email" replace />;
  // Acesso por cargo é emitido por servidor confiável (custom claims).
  // Usuário sem cargo só vê um portal cliente vazio, SEM acesso a dados.
  const allowed=area==="demo"?true
    :area==="empresa"?!!role && companyRoles.includes(role)
    :area==="admin"?role==="admin_toaki"
    :role===null || role==="cliente";
  if(!allowed) return <Navigate to="/acesso-pendente" replace/>;
  return <>{children}</>;
}
