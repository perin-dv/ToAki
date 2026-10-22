import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
export default function Brand({compact = false,onHomeClick}: {compact?: boolean;onHomeClick?:()=>void}) {
  const {user}=useAuth();
  return <Link className={"brand "+(compact?"brand-compact":"")} to={user?"/inicio":"/"} onClick={onHomeClick} aria-label="toAki, voltar ao início">
    <img src="/logo-toaki.webp" alt="toAki — Rastreie suas entregas em tempo real" width={188} height={62}/>
  </Link>;
}
