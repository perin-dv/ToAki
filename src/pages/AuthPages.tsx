import { useState, type FormEvent, type ReactNode } from "react";
import { createUserWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail, signInWithEmailAndPassword, signOut, updateProfile } from "firebase/auth";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { auth } from "../lib/firebase";
import { useAuth } from "../auth/AuthProvider";
import Brand from "../components/Brand";

function message(error:unknown):string {
  const code=(error && typeof error==="object" && "code" in error)?String(error.code):"";
  return ({
    "auth/invalid-credential":"E-mail ou senha incorretos.",
    "auth/invalid-email":"E-mail inválido.",
    "auth/email-already-in-use":"Este e-mail já está cadastrado.",
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
  const [email,setEmail]=useState("");const[password,setPassword]=useState("");const[busy,setBusy]=useState(false);const[error,setError]=useState("");
  if(!loading&&user?.emailVerified)return <Navigate to={role==="admin_toaki"?"/admin":["dono_empresa","gestor","vendedor"].includes(role??"")?"/empresa":"/cliente"} replace/>;
  const submit=async(e:FormEvent)=>{e.preventDefault();setBusy(true);setError("");try{
    const {user}=await signInWithEmailAndPassword(auth,email.trim(),password);
    await user.reload();
    if(!user.emailVerified){navigate("/verificar-email");return}
    const token=await user.getIdTokenResult(true);
    const role=String(token.claims.role??"");
    navigate(role==="admin_toaki"?"/admin":["dono_empresa","gestor","vendedor"].includes(role)?"/empresa":"/cliente");
  }catch(e){setError(message(e))}finally{setBusy(false)}};
  return <Layout title="Entrar no toAki" description="Acesse usando seu e-mail e senha."><form className="stack" onSubmit={submit}>
    <label>E-mail<input required type="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} placeholder="voce@exemplo.com"/></label>
    <label>Senha<input required type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Sua senha"/></label>
    <Link className="right-link" to="/recuperar-senha">Esqueceu sua senha?</Link>
    {error&&<p className="form-error" role="alert">{error}</p>}
    <button className="primary" disabled={busy}>{busy?"Entrando...":"Entrar"}</button></form>
    <p className="auth-footer">Ainda não tem conta? <Link to="/cadastro">Criar conta</Link></p>
    <p className="helper">Acesso empresarial exige autorização específica.</p>
    <p className="auth-footer"><Link to="/demonstracao">Ver painel de demonstração (dados fictícios) →</Link></p>
  </Layout>;
}
export function RegisterPage() {
  const [name,setName]=useState("");const[email,setEmail]=useState("");const[password,setPassword]=useState("");const[busy,setBusy]=useState(false);const[error,setError]=useState("");const navigate=useNavigate();
  const submit=async(e:FormEvent)=>{e.preventDefault();setError("");if(password.length<10){setError("Use pelo menos 10 caracteres na senha.");return}setBusy(true);try{
    const {user}=await createUserWithEmailAndPassword(auth,email.trim(),password);
    await updateProfile(user,{displayName:name.trim()});
    await sendEmailVerification(user);
    navigate("/verificar-email");
  }catch(e){setError(message(e))}finally{setBusy(false)}};
  return <Layout title="Criar sua conta" description="Cadastre-se como cliente. Empresas precisam solicitar aprovação."><form className="stack" onSubmit={submit}>
    <label>Nome de contato<input required maxLength={100} autoComplete="name" value={name} onChange={e=>setName(e.target.value)} placeholder="Seu nome"/></label>
    <label>E-mail<input required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="voce@exemplo.com"/></label>
    <label>Senha<input required type="password" minLength={10} autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Mínimo de 10 caracteres"/></label>
    {error&&<p role="alert" className="form-error">{error}</p>}
    <button className="primary" disabled={busy}>{busy?"Cadastrando...":"Criar conta"}</button></form>
    <p className="helper">Sua conta não recebe acesso automático a nenhuma nota fiscal.</p>
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
  const resend=async()=>{if(!user)return;setBusy(true);try{await sendEmailVerification(user);setNotice("Link de confirmação enviado novamente.");}catch{setNotice("Tente reenviar mais tarde.")}finally{setBusy(false)}};
  return <Layout title="Verifique seu e-mail" description="Abra o link enviado para liberar o acesso."><div className="stack"><p className="helper">{user?.email||"Faça login para solicitar outro link."}</p>{notice&&<p className="form-info" role="status">{notice}</p>}<button className="primary" disabled={!user||busy} onClick={check}>Já confirmei meu e-mail</button><button className="secondary" disabled={!user||busy} onClick={resend}>Reenviar link</button><button className="text-button" onClick={async()=>{await signOut(auth);navigate("/login")}}>Sair</button></div></Layout>;
}
export function PendingPage() {
  const {role}=useAuth();return <Layout title="Acesso pendente" description="A sua conta existe, mas esta área exige autorização."><p className="helper">Perfil: {role||"sem função atribuída"}. Empresa e administração exigem aprovação.</p><Link to="/cliente" className="primary button-link">Ir para minha conta</Link></Layout>;
}
