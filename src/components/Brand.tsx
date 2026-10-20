import { Link } from "react-router-dom";
export default function Brand({compact = false}: {compact?: boolean}) {
  return <Link className={"brand "+(compact?"brand-compact":"")} to="/demonstracao" aria-label="toAki, início">
    <img src="/logo-toaki.webp" alt="toAki — Rastreie suas entregas em tempo real" width={188} height={62}/>
  </Link>;
}
