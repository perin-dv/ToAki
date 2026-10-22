import {useCallback,useEffect,useState,type MouseEvent} from "react";
import {collection,limit,onSnapshot,query} from "firebase/firestore";
import {signOut} from "firebase/auth";
import {Link,useNavigate} from "react-router-dom";
import {db,auth} from "../lib/firebase";
import {useAuth} from "../auth/AuthProvider";
import Brand from "../components/Brand";
import MenuIcon from "../components/MenuIcon";
import EmpresaOperacao from "./EmpresaOperacao";
import ColecaoEmpresaPage from "./ColecaoEmpresaPage";
import RelatoriosEmpresaPage from "./RelatoriosEmpresaPage";
import {ambienteOperacional} from "../lib/ambiente";
import {empresaAutorizada,type RegistroOperacional,type TipoOperacional} from "../lib/operacaoEmpresa";

// Esta página é a operação REAL. Dados demonstrativos pertencem exclusivamente a /demonstracao.
const menu=[
  {key:"inicio",name:"Início",icon:"inicio"},
  {key:"entregas",name:"Entregas e NFs",icon:"entregas"},
  {key:"entregadores",name:"Entregadores e veículos",icon:"entregadores"},
  {key:"clientes",name:"Clientes",icon:"clientes"},
  {key:"comprovantes",name:"Comprovantes",icon:"comprovantes"},
  {key:"historico",name:"Histórico e relatórios",icon:"historico"},
  {key:"empresa",name:"Empresa e equipe",icon:"empresa"},
  {key:"assinatura",name:"Assinatura",icon:"assinatura"}
] as const;
type Secao=typeof menu[number]["key"];
const empresaPapeis=["dono_empresa","gestor","vendedor"];

export default function SiteOperacionalPage(){
  const {user,role}=useAuth();
  const navegar=useNavigate();
  const [secao,setSecao]=useState<Secao>("inicio");
  const [menuAberto,setMenuAberto]=useState(false);
  const [empresaId,setEmpresaId]=useState<string|null>(null);
  const [carregando,setCarregando]=useState(true);
  const [registros,setRegistros]=useState<RegistroOperacional[]>([]);
  const [erro,setErro]=useState("");
  const [busca,setBusca]=useState("");
  const [nfSelecionada,setNfSelecionada]=useState<string|null>(null);
  const [mostrarMapa,setMostrarMapa]=useState(false);
  const [saindo,setSaindo]=useState(false);

  const acessoEmpresa=!!role&&empresaPapeis.includes(role);
  useEffect(()=>{
    let ativo=true;
    setEmpresaId(null);setCarregando(true);setRegistros([]);setErro("");
    if(!user||!acessoEmpresa||!ambienteOperacional){setCarregando(false);return;}
    empresaAutorizada(user).then(id=>{if(ativo){setEmpresaId(id);setCarregando(false);}})
      .catch(()=>{if(ativo){setErro("Não foi possível validar seu vínculo empresarial.");setCarregando(false);}});
    return()=>{ativo=false;};
  },[user,acessoEmpresa]);

  useEffect(()=>{
    if(!empresaId){setRegistros([]);return;}
    // Somente dados tenant do Firestore, com regras de permissão aplicadas pelo servidor.
    const caminho=collection(db,"empresas",empresaId,"pedidos");
    const cancel=onSnapshot(query(caminho,limit(50)),snapshot=>{
      setRegistros(snapshot.docs.map(item=>{
        const d=item.data();
        const status=typeof d.status==="string"?d.status:"não informado";
        return {id:item.id,titulo_registro:typeof d.titulo_registro==="string"?d.titulo_registro:"NF cadastrada",
          status,numero_nf:typeof d.numero_nf==="string"?d.numero_nf:undefined,
          endereco_entrega:typeof d.endereco_entrega==="string"?d.endereco_entrega:undefined,
          criado_em:d.criado_em};
      }));
      setErro("");
    },()=>{
      setRegistros([]);
      setErro("Não foi possível consultar as NFs. Verifique as permissões e as regras publicadas do Firestore.");
    });
    return()=>cancel();
  },[empresaId]);

  useEffect(()=>{
    if(!menuAberto)return;
    const anterior=document.body.style.overflow;
    document.body.style.overflow="hidden";
    const fechar=(evento:KeyboardEvent)=>{if(evento.key==="Escape")setMenuAberto(false);};
    window.addEventListener("keydown",fechar);
    return()=>{document.body.style.overflow=anterior;window.removeEventListener("keydown",fechar);};
  },[menuAberto]);

  const mudarSecao=useCallback((proxima:Secao)=>{
    setSecao(proxima);setMenuAberto(false);setMostrarMapa(false);
  },[]);
  const voltar=(evento:MouseEvent<HTMLAnchorElement>)=>{evento.preventDefault();mudarSecao("inicio");};
  const sair=async()=>{
    setSaindo(true);setErro("");
    try{await signOut(auth);navegar("/login",{replace:true});}
    catch{setErro("Não foi possível sair.");setSaindo(false);}
  };
  const pendentes=registros.filter(r=>r.status==="pendente").length;
  const emRota=registros.filter(r=>r.status==="em_rota").length;
  const entregues=registros.filter(r=>r.status==="entregue").length;
  const filtrados=registros.filter(r=>[r.numero_nf,r.endereco_entrega,r.status].join(" ").toLocaleLowerCase("pt-BR").includes(busca.toLocaleLowerCase("pt-BR")));
  const selecionada=registros.find(r=>r.id===nfSelecionada)??filtrados[0]??null;
  const secaoNome=menu.find(m=>m.key===secao)?.name??"Início";
  const cadastroAba:Record<"entregas"|"entregadores"|"clientes",TipoOperacional>={
    entregas:"pedido",entregadores:"entregador",clientes:"cliente"
  };
  const destinosAutorizados=!!empresaId&&acessoEmpresa&&ambienteOperacional;

  return <div className="demo-layout">
    {menuAberto&&<button type="button" className="drawer-backdrop" aria-label="Fechar menu lateral" onClick={()=>setMenuAberto(false)}/>}
    <aside id="demo-sidebar-menu" className={"demo-sidebar "+(menuAberto?"drawer-open":"")}>
      <div className="drawer-heading"><Brand onHomeClick={voltar}/><button className="drawer-close" type="button" onClick={()=>setMenuAberto(false)} aria-label="Fechar menu">✕</button></div>
      <nav aria-label="Menu completo do sistema">
        {menu.map(m=><button key={m.key} type="button" className={"nav "+(secao===m.key?"active":"")} onClick={()=>mudarSecao(m.key)} aria-current={secao===m.key?"page":undefined}>
          <span className="nav-icon"><MenuIcon name={m.icon}/></span>{m.name}
        </button>)}
      </nav>
      <div className="sidebar-foot"><strong>toAki — painel empresarial</strong><span>{destinosAutorizados?"Dados da empresa autorizada":"Acesso operacional pendente"}</span><Link to={role==="admin_toaki"?"/admin":acessoEmpresa?"/empresa":"/cliente"}>Minha conta →</Link></div>
    </aside>
    <div className="demo-body">
      <header className="mobile-top"><button type="button" className="mobile-menu-button" aria-label="Abrir menu completo" aria-controls="demo-sidebar-menu" aria-expanded={menuAberto} onClick={()=>setMenuAberto(true)}><MenuIcon name="menu"/> Menu</button><Brand compact onHomeClick={voltar}/><Link className="top-signin" to={acessoEmpresa?"/empresa":"/cliente"}>Minha conta →</Link></header>
      <main className="demo-main">
        <div className="demo-head"><div><h1>{secao==="inicio"?"Central de rastreamento":secaoNome}</h1><p>Painel operacional — informações do Firebase autorizado</p></div>
          <div className="head-right"><Link to={role==="admin_toaki"?"/admin":acessoEmpresa?"/empresa":"/cliente"} className="secondary">Minha conta</Link><button className="secondary" type="button" disabled={saindo} onClick={()=>void sair()}>{saindo?"Saindo...":"Sair"}</button></div>
        </div>
        {!ambienteOperacional&&<div className="demo-warning" role="status">A integração operacional com o Firebase ainda não foi habilitada. Nenhum dado fictício está sendo exibido como entrega real. <Link to="/demonstracao">Ver demonstração separada</Link>.</div>}
        {ambienteOperacional&&!acessoEmpresa&&<section className="panel content-panel"><h2>Você ainda não tem um painel empresarial autorizado</h2><p>As entregas só aparecem após aprovação da empresa e vínculo da sua conta. Não mostramos dados de outras empresas.</p>
          {role==="admin_toaki"?<Link className="primary button-link" to="/admin">Abrir administração</Link>:<Link className="primary button-link" to="/cadastro/empresa/dados">Solicitar cadastro de empresa</Link>}</section>}
        {carregando&&<p role="status">Verificando autorização no Firebase...</p>}
        {ambienteOperacional&&acessoEmpresa&&!carregando&&!empresaId&&<section className="panel content-panel"><h2>Empresa ainda não liberada</h2><p>O vínculo precisa ser aprovado por um administrador e confirmado no Firebase. Os dados de exemplo foram removidos da tela operacional.</p><Link to="/cadastro/empresa/dados" className="secondary button-link">Consultar solicitação</Link></section>}
        {erro&&<p role="alert" className="form-error">{erro}</p>}
        {destinosAutorizados&&secao==="inicio"&&<>
          <div className="stats">
            {([["📋",registros.length,"NFs carregadas"],["🛵",emRota,"Em rota"],["✅",entregues,"Entregues"],["⏱",pendentes,"Pendentes"]] as const).map(([icone,quantidade,rotulo])=>
              <div key={rotulo} className="stat"><span className="stat-icon">{icone}</span><div><strong>{quantidade}</strong><small>{rotulo}</small></div></div>)}
          </div>
          <div className="content-grid">
            <section className="panel map-shell">
              <div className="panel-head maphead"><h2>Mapa das entregas</h2><label className="search">⌕ <input type="search" value={busca} onChange={e=>setBusca(e.target.value)} aria-label="Buscar NFs reais" placeholder="Buscar NF ou endereço..."/></label></div>
              <div className="real-map-content">
                {selecionada?.endereco_entrega?
                  <><p><strong>NF {selecionada.numero_nf??selecionada.id}</strong> — {selecionada.endereco_entrega}</p>
                  {!mostrarMapa?<div className="real-map-empty"><span>Mapa por endereço</span><p>Para evitar compartilhar o endereço com um serviço externo sem sua ação, escolha abrir o mapa.</p><button className="primary" type="button" onClick={()=>setMostrarMapa(true)}>Abrir mapa do endereço</button></div>:
                    <iframe key={selecionada.id} className="real-map-frame" title={"Mapa do endereço da NF "+(selecionada.numero_nf??selecionada.id)} loading="lazy" referrerPolicy="no-referrer" src={"https://www.google.com/maps?q="+encodeURIComponent(selecionada.endereco_entrega)+"&output=embed"}/>}
                  <p className="helper">Mapa baseado no endereço cadastrado; não representa localização GPS do entregador.</p></>
                :<div className="real-map-empty"><strong>Nenhum endereço de NF disponível</strong><p>Cadastre uma entrega autorizada para visualizar o endereço no mapa. Nenhuma localização fictícia é apresentada.</p></div>}
              </div>
            </section>
            <div className="right">
              <section className="panel"><div className="panel-head"><h2>NFs consultadas</h2><span className="subtle">Até 50 registros</span></div>
                {!filtrados.length?<p className="subtle">Nenhuma NF cadastrada ou encontrada.</p>:filtrados.map(r=><button type="button" key={r.id} className={"delivery "+(selecionada?.id===r.id?"selected":"")} onClick={()=>{setNfSelecionada(r.id);setMostrarMapa(false);}}>
                  <span className="bike">📦</span><span className="copy"><strong>NF {r.numero_nf??r.id}</strong><small>{r.endereco_entrega??"Endereço não informado"}</small></span>
                  <span className="delivery-side"><span className={"pill "+(r.status==="em_rota"?"":"muted")}>{r.status==="em_rota"?"Em rota":r.status==="entregue"?"Entregue":r.status==="pendente"?"Pendente":r.status}</span></span>
                </button>)}
              </section>
              <section className="panel"><div className="panel-head"><h2>Detalhes da NF</h2></div>
                {selecionada?<p className="details"><strong>NF {selecionada.numero_nf??selecionada.id}</strong><br/>Destino: {selecionada.endereco_entrega??"Não informado"}<br/>Status: {selecionada.status}<br/>GPS: ainda não conectado a este painel</p>:<p className="helper">Nenhuma NF selecionada.</p>}
                <button className="primary" type="button" onClick={()=>mudarSecao("entregas")}>Gerenciar NFs →</button></section>
            </div>
          </div>
          <p className="helper">As NFs são sincronizadas com o Firestore. Os indicadores refletem até 50 documentos consultados, não todos os pedidos da empresa.</p>
        </>}
        {destinosAutorizados&&secao!=="inicio"&&<div className="demo-modulos">
          {(secao==="entregas"||secao==="entregadores"||secao==="clientes")?
            <EmpresaOperacao key={secao} abaInicial={cadastroAba[secao]}/>:
            secao==="comprovantes"?<ColecaoEmpresaPage empresaId={empresaId!} grupo="comprovantes"/>:
            secao==="historico"?(["dono_empresa","gestor"].includes(role??"")?
              <><RelatoriosEmpresaPage empresaId={empresaId!}/><ColecaoEmpresaPage empresaId={empresaId!} grupo="historico"/></>:
              <section className="panel content-panel"><h2>Histórico de operações</h2><p>Seu perfil não tem acesso aos eventos administrativos. Peça autorização ao gestor.</p></section>):
            secao==="empresa"?(["dono_empresa","gestor"].includes(role??"")?
              <><ColecaoEmpresaPage empresaId={empresaId!} grupo="funcionarios"/><section className="panel content-panel"><Link to="/empresa" className="primary button-link">Ver perfil e permissões empresariais →</Link></section></>:
              <section className="panel content-panel"><h2>Equipe</h2><p>Somente gestores autorizados podem visualizar a equipe.</p></section>):
            <section className="panel content-panel"><h2>{secaoNome}</h2>
              <p>Assinaturas e pagamentos reais ainda não estão habilitados. Nenhuma cobrança fictícia será apresentada como confirmada.</p>
            </section>}
        </div>}
      </main>
      <nav className="mobile-nav" aria-label="Atalhos móveis do painel">
        {menu.filter(m=>["inicio","entregas","entregadores","empresa"].includes(m.key)).map(m=><button type="button" key={m.key} className={secao===m.key?"on":""} onClick={()=>mudarSecao(m.key)}><MenuIcon name={m.icon} size={21}/>{m.name.split(" ")[0]}</button>)}
        <button type="button" aria-label="Abrir todos os módulos" aria-controls="demo-sidebar-menu" aria-expanded={menuAberto} onClick={()=>setMenuAberto(true)}><MenuIcon name="menu" size={21}/>Mais</button>
      </nav>
    </div>
  </div>;
}
