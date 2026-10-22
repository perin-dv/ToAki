import {Link, Navigate} from "react-router-dom";
import {useAuth} from "../auth/AuthProvider";
import Brand from "../components/Brand";
import MenuIcon from "../components/MenuIcon";

export function PublicHomePage(){
  const {user,loading}=useAuth();
  if(loading)return <div className="loading" role="status">Carregando toAki...</div>;
  if(user)return <Navigate to="/inicio" replace/>;
  return <div className="start-page">
    <header className="start-header"><Brand compact/><nav aria-label="Acesso principal"><Link to="/login" className="start-header-link">Já tenho conta</Link><Link to="/cadastro" className="primary button-link">Criar conta</Link></nav></header>
    <main className="start-main">
      <section className="start-hero">
        <div><span className="start-kicker">BEM-VINDO AO TOAKI</span><h1>Sua entrega,<br/><em>mais perto.</em></h1><p>Uma plataforma para acompanhar entregas e organizar a operação de quem envia, transporta e recebe.</p>
          <div className="start-actions"><Link className="primary button-link" to="/cadastro">Começar agora →</Link><Link className="secondary button-link" to="/login">Entrar na minha conta</Link></div>
        </div>
        <div className="start-illustration" aria-hidden="true"><div className="start-circle"><MenuIcon name="entregas" size={64}/><span className="start-pin">●</span></div><span className="start-stroke start-stroke-one"/><span className="start-stroke start-stroke-two"/></div>
      </section>
      <section className="start-choices" aria-label="Como você vai utilizar o toAki?">
        <div className="start-section-head"><span>PRIMEIROS PASSOS</span><h2>Como você vai usar o toAki?</h2><p>Escolha o cadastro adequado. Os acessos são diferentes.</p></div>
        <div className="start-choice-grid">
          <article className="start-choice">
            <span className="start-choice-icon"><MenuIcon name="clientes" size={25}/></span><h3>Sou cliente</h3><p>Para receber informações de uma entrega. Crie sua conta gratuitamente, sem aprovação de empresa.</p><Link to="/cadastro/cliente" className="primary button-link">Cadastrar como cliente →</Link>
          </article>
          <article className="start-choice">
            <span className="start-choice-icon"><MenuIcon name="empresa" size={25}/></span><h3>Tenho uma empresa</h3><p>Para cadastrar notas fiscais, veículos, entregadores e controlar suas entregas. O acesso empresarial exige verificação.</p><Link to="/cadastro/empresa" className="secondary button-link">Cadastrar minha empresa →</Link>
          </article>
        </div>
      </section>
    </main>
    <footer className="start-footer">toAki · Rastreamento de entregas • Ambiente piloto</footer>
  </div>;
}

const nome=(name:string|null|undefined,email:string|null|undefined)=>(name?.trim()||email?.split("@")[0]||"Usuário").split(" ")[0];
export function HomePage(){
  const {user,role}=useAuth();
  const isEmpresa=["dono_empresa","gestor","vendedor"].includes(role??"");
  const painel=isEmpresa?"/empresa":role==="admin_toaki"?"/admin":"/cliente";
  return <div className="private-app">
    <header className="private-header">
      <Brand compact/>
      <nav className="home-top-actions" aria-label="Navegação do início"><Link to="/inicio" aria-current="page">Início</Link><Link to={painel}>Minha conta</Link><Link to="/cliente?aba=perfil" className="home-avatar-link" aria-label="Meus dados">{(user?.displayName||user?.email||"T")[0].toUpperCase()}</Link></nav>
    </header>
    <main className="private-main home-main">
      <div className="home-heading"><span>PAINEL INICIAL</span><h1>Olá, {nome(user?.displayName,user?.email)}!</h1><p>Escolha o que deseja fazer. Seu acesso está conectado ao Firebase Authentication.</p></div>
      <section className="home-intro" aria-label="Bem-vindo ao toAki">
        <div><span className="account-eyebrow">TOAKI • VISÃO GERAL</span><h2>Seu ponto de partida para todas as entregas.</h2><p>O toAki está em fase de testes. Sua conta é real, mas os cadastros operacionais ainda estão sendo conectados com segurança.</p><Link to={painel} className="primary button-link">Abrir minha conta →</Link></div>
        <div aria-hidden="true" className="home-intro-icon"><MenuIcon name="entregas" size={82}/></div>
      </section>
      <div className="home-grid">
        <Link to={painel} className="home-feature-card"><span className="home-feature-icon"><MenuIcon name="clientes" size={24}/></span><strong>Minha conta</strong><p>Veja seu perfil, altere nome, confira segurança e acesse suas informações.</p><span className="home-card-more">Acessar →</span></Link>
        <Link to={isEmpresa?"/empresa":"/cliente?aba=entregas"} className="home-feature-card"><span className="home-feature-icon"><MenuIcon name="entregas" size={24}/></span><strong>{isEmpresa?"Painel empresarial":"Minhas entregas"}</strong><p>{isEmpresa?"Cadastros e operações da empresa, quando autorizados.":"Consulte entregas quando sua conta estiver vinculada a pedidos."}</p><span className="home-card-more">Acessar →</span></Link>
        <Link to={isEmpresa?"/empresa":"/cadastro/empresa/dados"} className="home-feature-card"><span className="home-feature-icon"><MenuIcon name="empresa" size={24}/></span><strong>{isEmpresa?"Minha empresa":"Cadastrar empresa"}</strong><p>{isEmpresa?"Consulte seu vínculo empresarial e as permissões.":"Seu CNPJ segue um processo separado do cadastro de cliente."}</p><span className="home-card-more">Acessar →</span></Link>
      </div>
      <section className="home-demo-strip"><div><strong>Experimentar o painel demonstrativo</strong><p>Use o mapa e os cadastros fictícios, sem criar notas fiscais reais.</p></div><Link className="secondary button-link" to="/demonstracao">Abrir simulação →</Link></section>
      <p className="helper">Para sair da conta, abra Minha conta e selecione Sair. O login não é uma página inicial após autenticação.</p>
    </main>
  </div>;
}
