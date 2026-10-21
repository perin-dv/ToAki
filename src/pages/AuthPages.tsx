import { useState, type FormEvent, type ReactNode } from "react";
import { createUserWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail, signInWithEmailAndPassword, signOut, updateProfile } from "firebase/auth";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { auth } from "../lib/firebase";
import { useAuth } from "../auth/AuthProvider";
import Brand from "../components/Brand";
import { avaliarSenha } from "../lib/passwordStrength";

function message(error:unknown):string {
  const code=(error && typeof error==="object" && "code" in error)?String(error.code):"";
  return ({
    "auth/invalid-credential":"E-mail ou senha incorretos.",
    "auth/invalid-email":"E-mail inválido.",
    "auth/email-already-in-use":"Não foi possível criar essa conta. Se já tem cadastro, use Entrar ou Recuperar senha.",
    "auth/weak-password":"Escolha uma senha mais forte.",
    "auth/too-many-requests":"Muitas tentativas; tente mais tarde.",
    "auth/operation-not-allowed":"Ative E-mail/senha no Firebase Authentication.",
    "auth/network-request-failed":"Não foi possível conectar ao Firebase."
  } as Record<string,string>)[code]??"Não foi possível concluir. Confira os dados e tente novamente.";
}
function Layout({title,description,children}:{title:string;description:string;children:ReactNode}) {
  return <div className="auth-screen"><aside className="auth-intro"><Brand/><h1>Suas entregas, mais perto.</h1><p>Rastreamento de entregas para empresas, entregadores e clientes.</p><div className="auth-intro-footer">toAki · Sua entrega, no mapa</div></aside><main className="auth-panel"><div><div className="auth-mobile-logo"><Brand compact/></div><div className="auth-card"><h2>{title}</h2><p className="subheading">{description}</p>{children}</div></div></main></div>;
}
export function LoginPage() {
  const {user,role,loading}=useAuth();const navigate=useNavigate();
  const [email,setEmail]=useState("");const[password,setPassword]=useState("");const[mostrarSenha,setMostrarSenha]=useState(false);const[busy,setBusy]=useState(false);const[error,setError]=useState("");
  if(!loading&&user)return <Navigate to={!user.emailVerified?"/cliente":role==="admin_toaki"?"/admin":["dono_empresa","gestor","vendedor"].includes(role??"")?"/empresa":"/cliente"} replace/>;
  const submit=async(e:FormEvent)=>{e.preventDefault();setBusy(true);setError("");try{
    const {user}=await signInWithEmailAndPassword(auth,email.trim(),password);
    await user.reload();
    if(!user.emailVerified){navigate("/cliente");return}
    const token=await user.getIdTokenResult(true);
    const role=String(token.claims.role??"");
    navigate(role==="admin_toaki"?"/admin":["dono_empresa","gestor","vendedor"].includes(role)?"/empresa":"/cliente");
  }catch(e){setError(message(e))}finally{setBusy(false)}};
  return <Layout title="Entrar no toAki" description="Acesse usando seu e-mail e senha."><form className="stack" onSubmit={submit}>
    <label>E-mail<input required type="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} placeholder="voce@exemplo.com"/></label>
    <label>Senha<span className="password-input"><input required type={mostrarSenha?"text":"password"} autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Sua senha"/><button type="button" className="password-toggle" onClick={()=>setMostrarSenha(!mostrarSenha)} aria-label={mostrarSenha?"Ocultar senha":"Mostrar senha"} aria-pressed={mostrarSenha}>{mostrarSenha?"Ocultar":"Mostrar"}</button></span></label>
    <Link className="right-link" to="/recuperar-senha">Esqueceu sua senha?</Link>
    {error&&<p className="form-error" role="alert">{error}</p>}
    <button className="primary" disabled={busy}>{busy?"Entrando...":"Entrar"}</button></form>
    <p className="auth-footer">Ainda não tem conta? <Link to="/cadastro">Criar conta</Link></p>
    <p className="helper">Já tem cadastro no Firebase Authentication? Use Entrar com o mesmo e-mail e senha. Criar conta é somente para novos usuários. O acesso empresarial exige autorização específica.</p>
    <p className="auth-footer"><Link to="/demonstracao">Ver painel de demonstração (dados fictícios) →</Link></p>
  </Layout>;
}
export function RegisterPage() {
  const [name,setName]=useState("");
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [confirmar,setConfirmar]=useState("");
  const [mostrarSenha,setMostrarSenha]=useState(false);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const navigate=useNavigate();
  const avaliacao=avaliarSenha(password,email,name);
  const senhasIguais=confirmar.length>0 && password===confirmar;

  const submit=async(e:FormEvent)=>{
    e.preventDefault();setError("");
    if(name.trim().length<2){setError("Informe seu nome de contato.");return}
    if(!avaliacao.aceita){setError("Escolha uma senha média ou forte antes de continuar.");return}
    if(password!==confirmar){setError("A confirmação de senha não corresponde.");return}
    setBusy(true);
    try{
      const {user}=await createUserWithEmailAndPassword(auth,email.trim().toLowerCase(),password);
      // Nunca salvar senhas em Firestore, logs ou armazenamento local.
      try{await updateProfile(user,{displayName:name.trim()})}catch{ /* O cadastro já existe; não solicitar nova conta. */ }
      // No modo de testes, criar conta NÃO dispara e-mail de confirmação.
      // A confirmação é solicitada somente para cadastro empresarial.
      navigate("/cliente");
    }catch(e){setError(message(e))}finally{setBusy(false)}
  };

  return <Layout title="Criar sua conta" description="Cadastre-se como cliente. Empresas precisam solicitar aprovação.">
    <form className="stack" onSubmit={submit}>
      <label>Nome de contato<input required minLength={2} maxLength={100} autoComplete="name" value={name} onChange={e=>setName(e.target.value)} placeholder="Seu nome"/></label>
      <label>E-mail<input required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="voce@exemplo.com"/></label>
      <label>Senha<span className="password-input"><input required type={mostrarSenha?"text":"password"} minLength={12} maxLength={128} autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Pelo menos 12 caracteres" aria-describedby="senha-qualidade" /><button type="button" className="password-toggle" onClick={()=>setMostrarSenha(!mostrarSenha)} aria-label={mostrarSenha?"Ocultar senha":"Mostrar senha"} aria-pressed={mostrarSenha}>{mostrarSenha?"Ocultar":"Mostrar"}</button></span></label>
      <div className={"password-feedback password-"+avaliacao.forca} id="senha-qualidade" data-strength={avaliacao.forca}>
        <div className="password-meter" role="progressbar" aria-label="Força da senha" aria-valuemin={0} aria-valuemax={100} aria-valuenow={avaliacao.percentual}><span style={{width:avaliacao.percentual+"%"}}/></div>
        <div className="password-meta"><strong>{password?"Senha "+avaliacao.rotulo:"Força da senha"}</strong><span>{avaliacao.sugestao}</span></div>
      </div>
      <label>Confirmar senha<input required type={mostrarSenha?"text":"password"} minLength={12} maxLength={128} autoComplete="new-password" value={confirmar} onChange={e=>setConfirmar(e.target.value)} placeholder="Digite a senha novamente" aria-describedby="senha-confirmacao"/></label>
      {confirmar&&<p className={senhasIguais?"password-match":"form-error"} id="senha-confirmacao" role="status">{senhasIguais?"As senhas coincidem.":"As senhas não coincidem."}</p>}
      {error&&<p role="alert" className="form-error">{error}</p>}
      <button className="primary" disabled={busy||!avaliacao.aceita||!senhasIguais}>{busy?"Cadastrando...":"Criar conta"}</button>
    </form>
    <p className="helper">Por segurança, use uma senha exclusiva, de preferência uma frase longa. O toAki não guarda sua senha no Firestore. A verificação de e-mail será exigida antes de solicitar acesso empresarial.</p>
    <p className="auth-footer"><Link to="/login">Já tenho uma conta</Link></p>
  </Layout>;
}
export function PasswordPage() {
  const [email,setEmail]=useState("");const[busy,setBusy]=useState(false);const[notice,setNotice]=useState("");
  const submit=async(e:FormEvent)=>{e.preventDefault();setBusy(true);try{await sendPasswordResetEmail(auth,email.trim())}catch{/* Evitar enumeração de usuários */}finally{setNotice("Se o e-mail estiver cadastrado, enviaremos as instruções.");setBusy(false)}};
  return <Layout title="Recuperar senha" description="Informe seu e-mail de cadastro."><form className="stack" onSubmit={submit}><label>E-mail<input required type="email" value={email} onChange={e=>setEmail(e.target.value)}/></label>{notice&&<p className="form-info" role="status">{notice}</p>}<button className="primary" disabled={busy}>{busy?"Enviando...":"Solicitar recuperação"}</button></form><p className="auth-footer"><Link to="/login">Voltar ao login</Link></p></Layout>;
}
export function VerifyEmailPage() {
  const {user,refreshClaims}=useAuth();const navigate=useNavigate();const[busy,setBusy]=useState(false);const[notice,setNotice]=useState("");
  const check=async()=>{if(!user)return;setBusy(true);try{await user.reload();await refreshClaims();if(auth.currentUser?.emailVerified)navigate("/cliente");else setNotice("E-mail ainda não confirmado.");}catch{setNotice("Não foi possível verificar agora.")}finally{setBusy(false)}};
  const resend=async()=>{if(!user)return;setBusy(true);try{await sendEmailVerification(user);setNotice("O e-mail de confirmação foi enviado porque você solicitou.");}catch{setNotice("Tente reenviar mais tarde.")}finally{setBusy(false)}};
  return <Layout title="Verifique seu e-mail" description="Esta confirmação só é necessária para solicitar acesso empresarial e consultar dados privados quando estes serviços estiverem disponíveis. Nenhum e-mail é enviado automaticamente ao criar a conta."><div className="stack"><p className="helper">{user?.email||"Faça login para solicitar outro link."}</p>{notice&&<p className="form-info" role="status">{notice}</p>}<button className="primary" disabled={!user||busy} onClick={check}>Já confirmei meu e-mail</button><button className="secondary" disabled={!user||busy} onClick={resend}>Enviar e-mail de verificação</button><button className="text-button" onClick={async()=>{await signOut(auth);navigate("/login")}}>Sair</button></div></Layout>;
}
export function PendingPage() {
  const {role}=useAuth();return <Layout title="Acesso pendente" description="A sua conta existe, mas esta área exige autorização."><p className="helper">Perfil: {role||"sem função atribuída"}. Empresa e administração exigem aprovação.</p><Link to="/cliente" className="primary button-link">Ir para minha conta</Link></Layout>;
}
