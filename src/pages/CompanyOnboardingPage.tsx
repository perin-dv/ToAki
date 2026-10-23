import {Link} from "react-router-dom";
import Brand from "../components/Brand";
import CompanyRegistration from "./CompanyRegistration";
import {useAuth} from "../auth/AuthProvider";
import {ambienteOperacional, ambientePilotoOriginal} from "../lib/ambiente";
export default function CompanyOnboardingPage(){
  const {user,role,empresaId}=useAuth();
  const jaVinculada=!!empresaId&&(role==="dono_empresa"||role==="gestor"||role==="vendedor");
  return <div className="private-app">
    <header className="private-header"><Brand compact/><div className="home-top-actions"><Link to="/inicio">Início</Link><Link to="/cliente">Minha conta</Link></div></header>
    <main className="private-main company-onboarding">
      <div className="account-topline"><Link className="account-back" to="/inicio">← Voltar ao início</Link><span className="account-context">toAki / Cadastro empresarial</span></div>
      <div className="account-area-heading area-heading"><div><h1>Cadastro da minha empresa</h1><p>{jaVinculada?"Empresa encontrada no Firebase":"O cadastro é feito no próprio site e fica vinculado à sua conta."}</p></div><span className="account-role">Acesso empresarial</span></div>
      <section className="company-onboarding-steps" aria-label="Etapas do cadastro de empresa">
        <div className="company-stage company-stage-complete"><strong>1</strong><div><b>Acesso pessoal</b><span>Conta criada no Authentication</span></div></div>
        <div className="company-stage"><strong>2</strong><div><b>Validação empresarial</b><span>{jaVinculada?"Empresa vinculada ao Firebase":"CNPJ e responsável"}</span></div></div>
        <div className="company-stage"><strong>3</strong><div><b>Liberação</b><span>{jaVinculada?"Acesso vinculado":"Somente após análise"}</span></div></div>
      </section>
      <div className="company-onboarding-grid">
        <div><CompanyRegistration/></div>
        <section className="panel content-panel">
          <h2>Por que o cadastro é diferente?</h2>
          <p>O Firebase Authentication identifica sua conta. O cadastro empresarial é salvo no Firestore, e o servidor vincula o responsável à empresa após aprovação. Quando o vínculo estiver ativo, o painel reconhece a empresa automaticamente.</p>
          <div className="account-info-row"><span>Conta pessoal</span><strong>{user?.email}</strong></div>
          <div className="account-info-row"><span>E-mail</span><strong className={user?.emailVerified?"account-verified":"account-unverified"}>{user?.emailVerified?"Confirmado":jaVinculada&&empresaId==="empresa_teste_soma"?"Dispensado para testes":"Não confirmado"}</strong></div>
          <div className="account-info-row"><span>Empresa no Firebase</span><strong>{jaVinculada?"Empresa vinculada":"Aguardando aprovação"}</strong></div>
          {!ambienteOperacional&&<div className="demo-warning" role="status">Neste Preview, a conta de usuário usa Firebase Authentication. Solicitações de empresas permanecem bloqueadas até a ativação segura do piloto.</div>}{ambientePilotoOriginal&&!jaVinculada&&<div className="demo-warning" role="status">Piloto controlado: a solicitação é gravada no Firebase e analisada antes de conceder acesso a dados comerciais.</div>}
          {!user?.emailVerified&&!jaVinculada&&<Link to="/verificar-email" state={{from:"/cadastro/empresa/dados"}} className="primary button-link">Confirmar meu e-mail →</Link>}
        </section>
      </div>
    </main>
  </div>;
}
