import { useState, type FormEvent } from "react";
import { sendEmailVerification, sendPasswordResetEmail, updateProfile } from "firebase/auth";
import { auth } from "../lib/firebase";
import { useAuth } from "../auth/AuthProvider";

const mostrarData = (data?:string) => {
  if (!data) return "Não informado";
  const d=new Date(data);
  return Number.isNaN(d.getTime())?"Não informado":new Intl.DateTimeFormat("pt-BR",{dateStyle:"long"}).format(d);
};

export default function PerfilConta({onSaved}:{onSaved?:()=>void}={}){
  const {user,refreshClaims}=useAuth();
  const [nome,setNome]=useState(user?.displayName??"");
  const [salvando,setSalvando]=useState(false);
  const [solicitando,setSolicitando]=useState<"confirmacao"|"senha"|null>(null);
  const [erro,setErro]=useState("");
  const [mensagem,setMensagem]=useState("");

  const salvar=async(event:FormEvent)=>{
    event.preventDefault();setErro("");setMensagem("");
    const novoNome=nome.trim().replace(/\s+/g," ");
    if(novoNome.length<2||novoNome.length>80){setErro("Informe um nome entre 2 e 80 caracteres.");return;}
    const atual=auth.currentUser;
    if(!atual){setErro("Sua sessão expirou. Faça login novamente.");return;}
    setSalvando(true);
    try {
      await updateProfile(atual,{displayName:novoNome});
      await refreshClaims();
      onSaved?.();
      setMensagem("Seu nome foi atualizado no Firebase Authentication.");
    }catch {
      setErro("Não foi possível atualizar agora. Confira sua conexão e tente novamente.");
    }finally{setSalvando(false)}
  };

  const acao=async(tipo:"confirmacao"|"senha")=>{
    const atual=auth.currentUser;setErro("");setMensagem("");
    if(!atual?.email){setErro("Não encontramos um e-mail na sua conta.");return;}
    setSolicitando(tipo);
    try{
      if(tipo==="confirmacao"){
        await atual.reload();
        if(atual.emailVerified){await refreshClaims();setMensagem("Seu e-mail já está confirmado.");return;}
        await sendEmailVerification(atual);
        setMensagem("Enviamos um link para confirmar o seu e-mail. Abra sua caixa de entrada.");
      }else{
        await sendPasswordResetEmail(auth,atual.email);
        setMensagem("Solicitação realizada. Confira seu e-mail para redefinir a senha.");
      }
    }catch{
      setErro("Não foi possível enviar a solicitação. Aguarde um pouco e tente novamente.");
    }finally{setSolicitando(null)}
  };

  if(!user)return null;
  const avatar=(user.displayName||user.email||"T").trim().charAt(0).toLocaleUpperCase("pt-BR");
  return <div className="account-profile-grid">
    <section className="panel content-panel">
      <div className="account-card-title"><span className="account-avatar account-avatar-small" aria-hidden="true">{avatar}</span><div><h2>Meu perfil</h2><p>Informações reais do Firebase Authentication.</p></div></div>
      <form className="stack account-form" onSubmit={salvar}>
        <label>Nome de exibição<input type="text" value={nome} minLength={2} maxLength={80} autoComplete="name" onChange={e=>setNome(e.target.value)} placeholder="Como quer ser chamado?"/></label>
        <label>E-mail cadastrado<input type="email" value={user.email??""} readOnly aria-readonly="true"/></label>
        <button type="submit" className="primary" disabled={salvando}>{salvando?"Salvando...":"Salvar meu perfil"}</button>
      </form>
      {mensagem&&<p className="form-info" role="status">{mensagem}</p>}
      {erro&&<p className="form-error" role="alert">{erro}</p>}
    </section>
    <section className="panel content-panel">
      <div className="account-card-title"><div className="account-line-icon" aria-hidden="true">✓</div><div><h2>Segurança da conta</h2><p>Seu acesso é protegido pelo Firebase.</p></div></div>
      <dl className="account-facts">
        <div><dt>Verificação do e-mail</dt><dd><span className={user.emailVerified?"account-verified":"account-unverified"}>{user.emailVerified?"Confirmado":"Pendente"}</span></dd></div>
        <div><dt>Conta criada em</dt><dd>{mostrarData(user.metadata.creationTime)}</dd></div>
        <div><dt>Senha</dt><dd>Gerenciada com segurança pelo Firebase Authentication</dd></div>
      </dl>
      <div className="account-security-actions">
        {!user.emailVerified&&<button type="button" className="secondary" disabled={solicitando!==null} onClick={()=>void acao("confirmacao")}>{solicitando==="confirmacao"?"Enviando...":"Confirmar meu e-mail"}</button>}
        <button type="button" className="secondary" disabled={solicitando!==null} onClick={()=>void acao("senha")}>{solicitando==="senha"?"Enviando...":"Alterar minha senha"}</button>
      </div>
      <p className="helper">Não pedimos sua senha por mensagem. O processo de alteração é enviado exclusivamente para seu e-mail.</p>
    </section>
  </div>;
}
