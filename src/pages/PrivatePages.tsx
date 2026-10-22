import { useState, type ReactNode } from "react";
import { signOut } from "firebase/auth";
import { useLocation, useNavigate } from "react-router-dom";
import { auth } from "../lib/firebase";
import { useAuth } from "../auth/AuthProvider";
import Brand from "../components/Brand";
import MenuIcon from "../components/MenuIcon";
import PerfilConta from "./PerfilConta";
import CompanyRegistration from "./CompanyRegistration";
import AdminRequests from "./AdminRequests";

type AbaCliente="inicio"|"entregas"|"empresa"|"perfil";
const abasCliente:{id:AbaCliente;titulo:string;icone:"inicio"|"entregas"|"empresa"|"clientes"}[]=[
  {id:"inicio",titulo:"Visão geral",icone:"inicio"},
  {id:"entregas",titulo:"Minhas entregas",icone:"entregas"},
  {id:"empresa",titulo:"Minha empresa",icone:"empresa"},
  {id:"perfil",titulo:"Meus dados",icone:"clientes"}
];
function nomeConta(nome:string|null|undefined,email:string|null|undefined){
  return (nome?.trim()||email?.split("@")[0]||"Olá").split(" ")[0];
}
function Shell({title,description,children}:{title:string;description:string;children:ReactNode}) {
  const {user,role}=useAuth();
  const location=useLocation();
  const navigate=useNavigate();
  const [saindo,setSaindo]=useState(false);
  const [erro,setErro]=useState("");
  const logout=async()=>{
    setSaindo(true);setErro("");
    try{await signOut(auth);navigate("/login",{replace:true});}
    catch{setErro("Não foi possível encerrar a sessão. Tente novamente.");setSaindo(false);}
  };
  const voltar=()=>{
    // A página Minha conta deve ter uma saída navegável, inclusive após atualização.
    if(location.state?.from==="/demonstracao"){navigate("/demonstracao");return;}
    if(window.history.length>1){navigate(-1);return;}
    navigate("/demonstracao");
  };
  const avatar=(user?.displayName||user?.email||"T").trim().charAt(0).toLocaleUpperCase("pt-BR");
  return <div className="private-app">
    <header className="private-header">
      <div className="account-header-left"><Brand compact/><span className="account-header-label">PORTAL DO USUÁRIO</span></div>
      <div className="private-actions"><span className="account-header-email">{user?.email}</span><span className="account-header-avatar" aria-label="Conta autenticada">{avatar}</span><button type="button" className="account-logout" onClick={()=>void logout()} disabled={saindo}>{saindo?"Saindo...":"Sair"}</button></div>
    </header>
    <main className="private-main">
      <div className="account-topline"><button type="button" className="account-back" onClick={voltar}><span aria-hidden="true">←</span> Voltar</button><span className="account-context">toAki <span aria-hidden="true">/</span> {title}</span></div>
      {erro&&<p role="alert" className="form-error">{erro}</p>}
      <div className="area-heading account-area-heading"><div><h1>{title}</h1><p>{description}</p></div><span className="account-role">{role==="admin_toaki"?"Administrador":role==="dono_empresa"?"Responsável pela empresa":role==="gestor"?"Gestor":role==="vendedor"?"Vendedor":"Cliente"}</span></div>
      {children}
    </main>
  </div>;
}
export function CustomerPage() {
  const {user}=useAuth();
  const [aba,setAba]=useState<AbaCliente>("inicio");
  const nome=nomeConta(user?.displayName,user?.email);
  return <Shell title="Minha conta" description="Seus dados, entregas e solicitações em um só lugar.">
    <section className="account-hero" aria-label="Boas-vindas">
      <div className="account-hero-copy"><span className="account-eyebrow">ÁREA DO CLIENTE</span><h2>Olá, {nome}! <span aria-hidden="true">👋</span></h2>
        <p>Acompanhe sua conta no toAki. Apenas informações autorizadas são exibidas aqui.</p>
        <div className="account-hero-meta"><span><span className="account-dot"/> Sessão autenticada</span><span>{user?.emailVerified?"E-mail confirmado":"E-mail pendente de confirmação"}</span></div>
      </div>
      <div className="account-hero-art" aria-hidden="true"><span className="account-hero-route"/><span className="account-hero-pin">⌖</span></div>
    </section>
    <nav className="account-tabs" aria-label="Seções da minha conta">
      {abasCliente.map(a=><button type="button" key={a.id} className={"account-tab "+(aba===a.id?"account-tab-active":"")} aria-current={aba===a.id?"page":undefined} onClick={()=>setAba(a.id)}>
        <MenuIcon name={a.icone} size={18}/><span>{a.titulo}</span>
      </button>)}
    </nav>
    {aba==="inicio"&&<div className="account-content">
      <div className="account-summary">
        <article className="account-summary-card"><div className="account-summary-icon orange"><MenuIcon name="entregas" size={21}/></div><div><span>Minhas entregas</span><strong className="account-summary-word">Aguardando</strong><small>Integração das entregas em preparação</small></div></article>
        <article className="account-summary-card"><div className="account-summary-icon blue"><MenuIcon name="empresa" size={21}/></div><div><span>Acesso empresarial</span><strong className="account-summary-word">Não liberado</strong><small>Necessita solicitação e aprovação</small></div></article>
        <article className="account-summary-card"><div className="account-summary-icon green"><MenuIcon name="clientes" size={21}/></div><div><span>Meu perfil</span><strong className="account-summary-word">{user?.displayName?"Preenchido":"Incompleto"}</strong><small>Dados do Firebase Authentication</small></div></article>
      </div>
      <div className="account-overview-grid">
        <section className="panel account-overview-panel">
          <div className="account-section-heading"><div><h2>Suas entregas</h2><p>Pedidos vinculados à sua identidade aparecem aqui.</p></div><span className="pill muted">Integração pendente</span></div>
          <div className="account-empty"><span className="account-empty-icon"><MenuIcon name="entregas" size={31}/></span><strong>O histórico das suas entregas estará disponível aqui.</strong><p>Quando uma empresa associar uma nota à sua conta com segurança, ela aparecerá aqui. Informar um número de NF não libera dados de terceiros.</p><button type="button" className="secondary" onClick={()=>setAba("entregas")}>Ver minhas entregas</button></div>
        </section>
        <section className="panel account-overview-panel">
          <div className="account-section-heading"><div><h2>Minha conta</h2><p>Acesso e informações pessoais.</p></div></div>
          <div className="account-info-row"><span>E-mail cadastrado</span><strong>{user?.email}</strong></div>
          <div className="account-info-row"><span>Verificação do e-mail</span><strong className={user?.emailVerified?"account-verified":"account-unverified"}>{user?.emailVerified?"Confirmado":"Pendente"}</strong></div>
          <div className="account-info-row"><span>Nome</span><strong>{user?.displayName||"Não informado"}</strong></div>
          <div className="account-overview-actions"><button type="button" className="primary" onClick={()=>setAba("perfil")}>Gerenciar meu perfil</button><button type="button" className="secondary" onClick={()=>setAba("empresa")}>Minha empresa</button></div>
        </section>
      </div>
    </div>}
    {aba==="entregas"&&<section className="panel content-panel account-full-panel">
      <div className="account-section-heading"><div><h2>Minhas entregas</h2><p>Consultas privadas, disponíveis após vínculo seguro com a empresa.</p></div><span className="pill muted">Integração pendente</span></div>
      <div className="account-empty"><span className="account-empty-icon"><MenuIcon name="entregas" size={32}/></span><strong>A consulta das suas entregas ainda está sendo integrada.</strong><p>Estamos preparando a conexão entre empresas e clientes. NFs de terceiros não são mostradas sem autorização.</p></div>
    </section>}
    {aba==="perfil"&&<PerfilConta/>}
    {aba==="empresa"&&<div className="account-business">
      <div className="account-business-intro"><h2>Vincular minha empresa</h2><p>O cadastro por CNPJ exige comprovação do vínculo e aprovação administrativa; consultar o CNPJ não concede acesso.</p></div>
      <CompanyRegistration/>
    </div>}
    <div className="account-footer"><span>toAki · Ambiente em desenvolvimento</span><span>Seus dados de acesso são gerenciados pelo Firebase Authentication.</span></div>
  </Shell>;
}
export function CompanyPage(){
  return <Shell title="Painel da empresa" description="Acesso reservado a usuários com permissão empresarial.">
    <section className="panel content-panel account-full-panel"><div className="account-section-heading"><div><h2>Estrutura da empresa</h2><p>Somente dados da sua empresa, após vínculo e autorização.</p></div></div>
      <div className="account-empty"><span className="account-empty-icon"><MenuIcon name="empresa" size={31}/></span><strong>Estamos preparando o painel operacional.</strong><p>Entregadores, veículos e pedidos reais serão habilitados após vinculá-los a uma empresa aprovada em um Firebase de homologação.</p></div>
    </section>
    <div className="account-profile-shortcut"><PerfilConta/></div>
  </Shell>;
}
export function AdminPage(){
  return <Shell title="Administração toAki" description="Acesso permitido somente ao perfil admin_toaki validado por custom claims.">
    <AdminRequests/>
    <section className="panel content-panel" style={{marginTop:16}}><h2>Controles administrativos</h2><p>Cadastros empresariais, contratos, cobrança e cargos exigem operações no backend com registro de auditoria.</p><p className="helper">E-mails ou botões não concedem permissões administrativas.</p></section>
    <div className="account-profile-shortcut"><PerfilConta/></div>
  </Shell>;
}
