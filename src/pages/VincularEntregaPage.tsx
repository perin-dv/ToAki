import {useState} from "react";
import {Link,useLocation} from "react-router-dom";
import {useAuth} from "../auth/AuthProvider";
import Brand from "../components/Brand";
import {ambienteOperacional} from "../lib/ambiente";
import {lerConvite,resgatarConviteEntrega} from "../lib/vinculoEntrega";
import {auth} from "../lib/firebase";

export default function VincularEntregaPage(){
  const {user,role,loading,refreshClaims}=useAuth();
  const location=useLocation();
  const convite=lerConvite(location.hash);
  const [salvando,setSalvando]=useState(false);
  const [concluido,setConcluido]=useState(false);
  const [erro,setErro]=useState("");
  const loginDestino=location.pathname+location.hash;
  const confirmar=async()=>{
    if(!convite||!user||salvando)return;
    setSalvando(true);setErro("");
    try{
      await user.reload();
      await refreshClaims();
      if(!auth.currentUser?.emailVerified)throw Error("Confirme seu e-mail antes de aceitar o convite.");
      await resgatarConviteEntrega(convite.empresaId,convite.pedidoId,convite.token);
      setConcluido(true);
      // Nunca manter segredo de convite no histórico após utilizá-lo.
      window.history.replaceState(window.history.state,"",location.pathname);
    }catch(e){setErro(e instanceof Error?e.message:"Não foi possível vincular a entrega.");}
    finally{setSalvando(false);}
  };
  return <div className="private-app invite-page">
    <header className="private-header"><Brand compact/><Link to="/" className="top-signin">Voltar ao início</Link></header>
    <main className="private-main">
      <section className="panel invite-card">
        <span className="account-eyebrow">TOAKI · ACESSO PRIVADO</span>
        <h1>Vincular entrega à minha conta</h1>
        <p>Este convite dá acesso a uma única entrega. Não mostra localização de motoboy nem libera outras NFs.</p>
        {!ambienteOperacional?<p role="alert" className="form-error">O acesso às entregas não está habilitado neste ambiente.</p>:
         !convite?<p role="alert" className="form-error">Este link está incompleto ou inválido. Solicite outro à empresa.</p>:
         concluido?<div className="form-info" role="status"><strong>Entrega vinculada com sucesso!</strong><p>Consulte o status em Minha conta → Minhas entregas assim que a consulta privada estiver disponível.</p><Link className="primary button-link" to="/cliente?aba=entregas">Abrir minhas entregas</Link></div>:
         loading?<p role="status">Verificando sua conta...</p>:
         !user?<div className="invite-actions"><p>Entre com sua conta pessoal para aceitar a entrega. O convite só será consumido após sua confirmação.</p><Link className="primary button-link" state={{from:loginDestino}} to="/login">Entrar para vincular</Link><p>Não tem conta? Crie uma conta de cliente e depois abra novamente este convite.</p><Link to="/cadastro/cliente" className="secondary button-link">Criar conta de cliente</Link></div>:
         role&&role!=="cliente"?<p role="alert" className="form-error">Use uma conta pessoal de cliente, não uma conta de empresa ou entregador.</p>:
         !user.emailVerified?<div className="invite-actions"><p>Confirme o e-mail cadastrado para aceitar a entrega.</p><Link className="secondary button-link" to="/verificar-email">Verificar meu e-mail</Link><p>Depois de confirmar, volte a este convite e atualize a página.</p></div>:
         <div className="invite-actions"><p>O convite é pessoal, expira em 24 horas e só poderá ser utilizado uma vez. Confira se foi enviado pela empresa responsável.</p><button className="primary" disabled={salvando} onClick={()=>void confirmar()}>{salvando?"Vinculando...":"Confirmar vínculo desta entrega"}</button></div>}
        {erro&&<p role="alert" className="form-error">{erro}</p>}
      </section>
    </main>
  </div>;
}
