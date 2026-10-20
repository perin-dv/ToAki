import { signOut } from "firebase/auth";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../lib/firebase";
import { useAuth } from "../auth/AuthProvider";
import Brand from "../components/Brand";
import CompanyRegistration from "./CompanyRegistration";
import AdminRequests from "./AdminRequests";

function Shell({title,description,children}:{title:string;description:string;children:React.ReactNode}) {
  const {user,role}=useAuth();const navigate=useNavigate();
  const logout=async()=>{await signOut(auth);navigate("/login")};
  return <div className="private-app">
    <header className="private-header"><Brand compact/><div className="private-actions"><span>{user?.email} <small>({role??"cliente"})</small></span><button className="secondary" onClick={logout}>Sair</button></div></header>
    <main className="private-main"><div className="area-heading"><h1>{title}</h1><p>{description}</p></div>{children}</main>
  </div>;
}

export function CustomerPage() {
  const {user}=useAuth();
  return <Shell title="Minhas entregas" description="Acompanhe suas compras com segurança.">
    {!user?.emailVerified&&<div className="demo-warning" role="status">Você entrou com e-mail e senha no ambiente de testes. Para cadastrar uma empresa ou receber dados reais, será necessário confirmar seu e-mail quando solicitado.</div>}
    <div className="dash-grid">
      <section className="panel content-panel"><h2>Bem-vindo ao toAki</h2><p>Você ainda não possui entregas vinculadas à sua conta.</p><p className="helper">Quando uma empresa identificar sua compra e vincular a nota à sua conta, ela será listada aqui. Por segurança, digitar o número de uma NF não libera dados de terceiros.</p><span className="pill muted">Nenhuma entrega disponível</span></section>
      <section className="panel content-panel"><h2>Quer cadastrar sua empresa?</h2><p>Informe o CNPJ e solicite aprovação para gerenciar entregas da sua equipe.</p><a className="button-link primary" href="#cadastro-empresa">Solicitar acesso empresarial</a></section>
    </div>
    <div id="cadastro-empresa"><CompanyRegistration/></div>
    <div className="subtle small-foot">Sua conta cliente não recebe automaticamente acesso aos dados de outras pessoas, empresas ou notas fiscais.</div>
  </Shell>;
}

export function CompanyPage() {
  return <Shell title="Painel da empresa" description="Ambiente restrito a funcionários com cargo verificado.">
    <section className="panel content-panel"><h2>Estrutura da empresa</h2><p>Seu cargo foi identificado. A próxima etapa será associar este usuário a uma empresa/filial aprovada e carregar somente entregas autorizadas.</p><p className="helper">Ainda não conectamos pedidos, notas fiscais ou mapa real. Para ver o layout visual de demonstração, use o protótipo abaixo.</p><Link className="primary button-link" to="/demonstracao">Abrir protótipo com mapa fictício</Link></section>
  </Shell>;
}

export function AdminPage() {
  return <Shell title="Administração toAki" description="Acesso permitido somente ao perfil admin_toaki validado por custom claims.">
    <AdminRequests/>
    <section className="panel content-panel" style={{marginTop:16}}><h2>Próximos controles administrativos</h2><p>Aprovação de empresas, contratos, cobranças e atribuição de cargos serão operações validadas no backend e registradas na auditoria.</p><p className="helper">Não é possível conceder privilégios administrativos usando o navegador ou apenas o e-mail cadastrado.</p></section>
  </Shell>;
}
