import {useState} from "react";
import {Link,useLocation} from "react-router-dom";
import {useAuth} from "../auth/AuthProvider";
import {auth} from "../lib/firebase";
import {ambienteOperacional} from "../lib/ambiente";
import {aceitarConviteEquipe,lerConviteEquipe} from "../lib/equipeEmpresa";
import Brand from "../components/Brand";

export default function VincularEquipePage(){
  const {user,role,loading,refreshClaims}=useAuth();
  const location=useLocation();
  const convite=lerConviteEquipe(location.hash);
  const [busy,setBusy]=useState(false);
  const [erro,setErro]=useState("");
  const [concluido,setConcluido]=useState(false);
  const aceitar=async()=>{
    if(!user||!convite||busy)return;
    setBusy(true);setErro("");
    try{
      await user.reload();
      if(!auth.currentUser?.emailVerified)throw Error("Confirme seu e-mail antes de aceitar.");
      await aceitarConviteEquipe(convite.empresaId,convite.conviteId,convite.token);
      await refreshClaims();
      setConcluido(true);
      window.history.replaceState(window.history.state,"",location.pathname);
    }catch(e){setErro(e instanceof Error?e.message:"Não foi possível vincular sua conta à equipe.");}
    finally{setBusy(false);}
  };
  return <div className="private-app invite-page">
    <header className="private-header"><Brand compact/><Link to="/" className="top-signin">Voltar ao início</Link></header>
    <main className="private-main">
      <section className="panel invite-card">
        <span className="account-eyebrow">TOAKI · EQUIPE EMPRESARIAL</span>
        <h1>Aceitar convite da empresa</h1>
        <p>Este acesso é pessoal. A função e a empresa são definidas por um gestor autorizado, nunca pelo navegador.</p>
        {!convite?<p className="form-error" role="alert">Convite incompleto ou inválido. Solicite outro link à empresa.</p>:
         !ambienteOperacional?<p className="form-error" role="alert">Convites de equipe não estão habilitados neste ambiente.</p>:
         concluido?<div className="form-info" role="status"><strong>Seu vínculo com a equipe foi confirmado.</strong><p>O painel empresarial aparecerá com as permissões da sua função.</p><Link to="/inicio" className="primary button-link">Abrir painel empresarial</Link></div>:
         loading?<p role="status">Verificando identidade...</p>:
         !user?<div className="invite-actions"><p>Entre com o e-mail que recebeu o convite.</p><Link to="/login" state={{from:location.pathname+location.hash}} className="primary button-link">Entrar para aceitar</Link><p>Se ainda não tem conta, cadastre-se como pessoa física e volte a abrir este convite.</p><Link to="/cadastro/cliente" className="secondary button-link">Criar conta</Link></div>:
         role&&role!=="cliente"?<p className="form-error" role="alert">Esta conta já possui um cargo. Para entrar na equipe, use uma conta pessoal sem cargo empresarial.</p>:
         !user.emailVerified?<div className="invite-actions"><p>Confirme seu e-mail e volte ao link para continuar.</p><Link to="/verificar-email" className="secondary button-link">Verificar meu e-mail</Link></div>:
         <div className="invite-actions">
           <p>Ao confirmar, sua conta será vinculada à equipe desta empresa. Use apenas convites recebidos de pessoas conhecidas.</p>
           <button className="primary" type="button" disabled={busy} onClick={()=>void aceitar()}>{busy?"Confirmando...":"Confirmar vínculo com a equipe"}</button>
         </div>}
        {erro&&<p className="form-error" role="alert">{erro}</p>}
      </section>
    </main>
  </div>;
}
