import {Link} from "react-router-dom";
import Brand from "../components/Brand";
import CompanyRegistration from "./CompanyRegistration";
import {useAuth} from "../auth/AuthProvider";
import {ambienteHomologacao} from "../lib/ambiente";
export default function CompanyOnboardingPage(){
  const {user}=useAuth();
  return <div className="private-app">
    <header className="private-header"><Brand compact/><div className="home-top-actions"><Link to="/inicio">Início</Link><Link to="/cliente">Minha conta</Link></div></header>
    <main className="private-main company-onboarding">
      <div className="account-topline"><Link className="account-back" to="/inicio">← Voltar ao início</Link><span className="account-context">toAki / Cadastro empresarial</span></div>
      <div className="account-area-heading area-heading"><div><h1>Cadastro da minha empresa</h1><p>Esse processo é diferente do cadastro de cliente.</p></div><span className="account-role">Acesso empresarial</span></div>
      <section className="company-onboarding-steps" aria-label="Etapas do cadastro de empresa">
        <div className="company-stage company-stage-complete"><strong>1</strong><div><b>Acesso pessoal</b><span>Conta criada no Authentication</span></div></div>
        <div className="company-stage"><strong>2</strong><div><b>Validação empresarial</b><span>E-mail, CNPJ e responsável</span></div></div>
        <div className="company-stage"><strong>3</strong><div><b>Liberação</b><span>Somente após análise</span></div></div>
      </section>
      <div className="company-onboarding-grid">
        <div><CompanyRegistration/></div>
        <section className="panel content-panel">
          <h2>Por que o cadastro é diferente?</h2>
          <p>Uma conta de cliente é pessoal e não precisa de aprovação. Uma empresa poderá cadastrar notas fiscais, atribuir entregadores e consultar clientes. Por segurança, o CNPJ e o responsável precisam ser validados antes desse acesso.</p>
          <div className="account-info-row"><span>Conta pessoal</span><strong>{user?.email}</strong></div>
          <div className="account-info-row"><span>E-mail</span><strong className={user?.emailVerified?"account-verified":"account-unverified"}>{user?.emailVerified?"Confirmado":"Não confirmado"}</strong></div>
          <div className="account-info-row"><span>Permissão para NFs</span><strong>Não liberada</strong></div>
          {!ambienteHomologacao&&<div className="demo-warning" role="status">Neste Preview, o cadastro do usuário já é real. O envio da solicitação empresarial está temporariamente desativado para não alterar empresas do projeto original.</div>}
          {!user?.emailVerified&&<Link to="/verificar-email" state={{from:"/cadastro/empresa/dados"}} className="primary button-link">Confirmar meu e-mail →</Link>}
        </section>
      </div>
    </main>
  </div>;
}
