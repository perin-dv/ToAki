import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Brand from "../components/Brand";
import MenuIcon from "../components/MenuIcon";
import { useAuth } from "../auth/AuthProvider";
import { EntregadoresDemo, EntregasDemo } from "../demo/ModulosDemo";
import { ClientesDemo, ComprovantesDemo, HistoricoDemo, EmpresaDemo, AssinaturaDemo } from "../demo/ModulosExtras";
import { carregarDados, dadosIniciais, limparDados, salvarDados, type DemoDados } from "../demo/dadosDemo";

type Delivery = {id:string;nf:string;person:string;place:string;status:string;eta:string;pos:{left:string;top:string}};
const menu=[
  {key:"inicio",name:"Início"},
  {key:"entregas",name:"Entregas e NFs"},
  {key:"entregadores",name:"Entregadores"},
  {key:"clientes",name:"Clientes e links"},
  {key:"comprovantes",name:"Comprovantes"},
  {key:"historico",name:"Histórico e relatórios"},
  {key:"empresa",name:"Empresa e equipe"},
  {key:"assinatura",name:"Assinatura"}
] as const;
type MenuKey=typeof menu[number]["key"];

function MapIllustration({items,selected,onSelect}:{items:Delivery[];selected:number;onSelect:(i:number)=>void}) {
  return <div className="fake-map">
    <svg viewBox="0 0 720 510" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Mapa demonstrativo ilustrativo, sem GPS real">
      <rect width="720" height="510" fill="#e7eeea"/>
      <g fill="#cee0d4"><path d="M20 20h120v85H20zM565 18h129v80H565zM555 340h145v125H555zM20 320h115v158H20z"/><path d="M260 220h55v90h-55z"/></g>
      <g stroke="#fff" strokeWidth="14" fill="none">
        {[55,125,205,286,368,450].map(y=><path key={y} d={`M0 ${y} H720`}/>)}
        {[65,155,240,335,432,520,630].map(x=><path key={x} d={`M${x} 0 V510`}/>)}
      </g>
      <g stroke="#c6d9e7" strokeWidth="7" fill="none"><path d="M-20 490 600-20"/><path d="M700 520 180-20"/></g>
      <g fontSize="14" fontFamily="Arial" fill="#83959b"><text x="24" y="175">AV. BRASIL</text><text x="380" y="90">ZONA 07</text><text x="510" y="255">MARINGÁ</text><text x="100" y="414">CENTRO</text><text x="525" y="495">JARDIM ALVORADA</text></g>
      <path d="M108 330L270 330L270 184L355 184L355 115" fill="none" stroke="#ff780d" strokeWidth="6" strokeLinecap="round" strokeDasharray="12 7"/>
      <path d="M355 184L520 184L520 320" fill="none" stroke="#f6ac3a" strokeWidth="5" strokeDasharray="12 7"/>
    </svg>
    <div className="map-note">📍 Maringá, PR · MAPA FICTÍCIO</div>
    {items.map((d,i)=><button key={d.id} className={"marker "+(selected===i?"selected":"")} style={d.pos} onClick={()=>onSelect(i)} aria-label={`Selecionar entrega fictícia ${d.nf}`}><span className="marker-bubble">🛵</span><span className="marker-label"><b>{d.person.split(" ")[0]}</b><em>{d.status}</em></span></button>)}
    <span className="map-watermark">SIMULAÇÃO • SEM GPS</span>
  </div>;
}
export default function DemoPage() {
  const {user,role}=useAuth();
  const uid=user?.uid??"e2e";
  const [dados,setDados]=useState<DemoDados>(()=>carregarDados(uid));
  useEffect(()=>{salvarDados(uid,dados)},[uid,dados]);
  const [tab,setTab]=useState<MenuKey>("inicio");
  const [selected,setSelected]=useState(0);
  const [search,setSearch]=useState("");
  const entregas:Delivery[]=dados.entregas.map((n,i)=>({
    id:n.id,nf:n.nf,
    person:dados.entregadores.find(m=>m.id===n.entregadorId)?.nome??"Não atribuído",
    place:n.destino,status:n.status,eta:"Sem ETA real",
    pos:{left:(28+(i*17)%52)+"%",top:(28+(i*21)%49)+"%"}
  }));
  const emRota=entregas.filter(n=>n.status==="Em rota").length;
  const entregues=entregas.filter(n=>n.status==="Entregue").length;
  const pendentes=entregas.filter(n=>n.status==="Aguardando coleta").length;
  const [menuAberto,setMenuAberto]=useState(false);
  const mudarAba=(novaAba:MenuKey)=>{setTab(novaAba);setMenuAberto(false)};
  useEffect(()=>{
    if(!menuAberto)return;
    const anterior=document.body.style.overflow;
    document.body.style.overflow="hidden";
    const fecharComEscape=(evento:KeyboardEvent)=>{if(evento.key==="Escape")setMenuAberto(false)};
    window.addEventListener("keydown",fecharComEscape);
    return ()=>{
      document.body.style.overflow=anterior;
      window.removeEventListener("keydown",fecharComEscape);
    };
  },[menuAberto]);
  const filtered=useMemo(()=>entregas.filter(e=>[e.nf,e.person,e.place].join(" ").toLowerCase().includes(search.toLowerCase())),[search,dados]);
  const chosen=entregas[selected]??entregas[0];
  const verMapa=(id:string)=>{const i=entregas.findIndex(n=>n.id===id);setSelected(Math.max(i,0));mudarAba("inicio")};
  const panelTitle=menu.find(m=>m.key===tab)?.name??"Início";
  const accountPath=role==="admin_toaki"?"/admin":["dono_empresa","gestor","vendedor"].includes(role??"")?"/empresa":"/cliente";
  return <div className="demo-layout">
    {menuAberto&&<button className="drawer-backdrop" type="button" aria-label="Fechar menu lateral" onClick={()=>setMenuAberto(false)}/>}
    <aside id="demo-sidebar-menu" className={"demo-sidebar "+(menuAberto?"drawer-open":"")}>
      <div className="drawer-heading">
        <Brand/>
        <button className="drawer-close" type="button" aria-label="Fechar menu" onClick={()=>setMenuAberto(false)}>✕</button>
      </div>
      <nav aria-label="Menu completo do protótipo">
        {menu.map(m=><button type="button" key={m.key} onClick={()=>mudarAba(m.key)} className={"nav "+(tab===m.key?"active":"")} aria-current={tab===m.key?"page":undefined}><span className="nav-icon" aria-hidden="true"><MenuIcon name={m.key}/></span>{m.name}</button>)}
      </nav>
      <div className="sidebar-foot"><strong>Soma Distribuidora</strong><span>Filial Maringá · Simulação</span><Link to={accountPath} state={{from:"/demonstracao"}}>Minha conta →</Link></div>
    </aside>
    <div className="demo-body"><header className="mobile-top">
      <button className="mobile-menu-button" type="button" aria-label="Abrir menu completo" aria-controls="demo-sidebar-menu" aria-expanded={menuAberto} onClick={()=>setMenuAberto(true)}><MenuIcon name="menu" size={22}/> <span>Menu</span></button>
      <Brand compact/><Link to={accountPath} state={{from:"/demonstracao"}} className="top-signin">Minha conta →</Link>
    </header>
      <main className="demo-main">
        <div className="demo-head"><div><h1>{tab==="inicio"?"Central de rastreamento":panelTitle}</h1><p>toAki Business • Ambiente de demonstração</p></div><div className="head-right"><span className="fake-status">● Dados simulados</span><Link to={accountPath} state={{from:"/demonstracao"}} className="secondary">Minha conta</Link></div></div>
        <div className="demo-warning">SIMULAÇÃO: cadastros de teste salvos somente nesta aba do navegador; sem Firestore, GPS real, cobranças ou dados fiscais verdadeiros.</div>
        {tab==="inicio"?<><div className="stats">{[["📦",String(entregas.length),"Entregas hoje"],["🛵",String(emRota),"Em rota"],["✅",String(entregues),"Entregues"],["⏱",String(pendentes),"Pendentes"]].map(([icon,value,label])=><div key={label} className="stat"><span className="stat-icon">{icon}</span><div><strong>{value}</strong><small>{label}</small></div></div>)}</div>
          <div className="content-grid"><section className="panel map-shell"><div className="panel-head maphead"><h2>Mapa dos entregadores</h2><label className="search">⌕ <input type="search" placeholder="Buscar NF, pedido ou entregador..." value={search} onChange={e=>setSearch(e.target.value)} aria-label="Buscar entregas fictícias"/></label></div><MapIllustration items={entregas} selected={selected} onSelect={setSelected}/></section>
          <div className="right"><section className="panel"><div className="panel-head"><h2>Entregas em andamento</h2><span className="subtle">Fictícias</span></div>{filtered.length?filtered.map(e=>{const i=entregas.indexOf(e);return <button key={e.nf} className={"delivery "+(selected===i?"selected":"")} onClick={()=>setSelected(i)}><span className="bike">🛵</span><span className="copy"><strong>NF {e.nf}</strong><small>{e.person} · {e.place}</small></span><span className="delivery-side"><span className={"pill "+(e.status==="Em rota"?"":"muted")}>{e.status}</span><small>{e.eta}</small></span></button>;}):<p className="subtle">Nenhuma entrega encontrada.</p>}</section>
          <section className="panel"><div className="panel-head"><h2>Resumo do dia</h2><span className="subtle">Simulado</span></div><div className="mini-stat">{[[String(entregas.length),"Entregas"],[String(emRota),"Em rota"],[String(entregues),"Entregues"],[String(pendentes),"Pendentes"]].map(([value,label])=><div key={label}><strong>{value}</strong><small>{label}</small></div>)}</div></section>
          <section className="panel"><div className="panel-head"><h2>Detalhes da entrega</h2>{chosen&&<span className={"pill "+(chosen.status==="Em rota"?"":"muted")}>{chosen.status}</span>}</div>{chosen?<p className="details"><strong>NF {chosen.nf}</strong><br/>Entregador: {chosen.person}<br/>Destino: {chosen.place}<br/>Previsão: indisponível (simulação)<br/>Localização: simulada</p>:<p className="helper">Cadastre uma NF fictícia para visualizar detalhes.</p>}<button className="primary" onClick={()=>mudarAba("entregas")}>Gerenciar NFs →</button></section></div></div>
        </>:<div className="demo-modulos">
          {tab==="entregas"?<EntregasDemo dados={dados} atualizar={setDados} verMapa={verMapa}/>:
           tab==="entregadores"?<EntregadoresDemo dados={dados} atualizar={setDados}/>:
           tab==="clientes"?<ClientesDemo dados={dados} atualizar={setDados}/>:
           tab==="comprovantes"?<ComprovantesDemo dados={dados} atualizar={setDados}/>:
           tab==="historico"?<HistoricoDemo dados={dados}/>:
           tab==="empresa"?<EmpresaDemo dados={dados} atualizar={setDados}/>:
           <AssinaturaDemo dados={dados} atualizar={setDados}/>}
          <div className="demo-footer-actions">
            <span>Ambiente fictício — nenhum dado é enviado ao Firebase.</span>
            <button type="button" className="secondary" onClick={()=>{limparDados(uid);setDados(dadosIniciais());setSelected(0);}}>Reiniciar simulação</button>
          </div>
        </div>}

      </main>
      <nav className="mobile-nav" aria-label="Atalhos móveis do protótipo">
        {menu.filter(m=>["inicio","entregas","entregadores","empresa"].includes(m.key)).map(m=><button type="button" key={m.key} className={tab===m.key?"on":""} onClick={()=>mudarAba(m.key)} aria-current={tab===m.key?"page":undefined}><MenuIcon name={m.key} size={21}/>{m.name.split(" ")[0]}</button>)}
        <button type="button" className={menuAberto||!["inicio","entregas","entregadores","empresa"].includes(tab)?"on":""} aria-label="Abrir todos os módulos" aria-controls="demo-sidebar-menu" aria-expanded={menuAberto} onClick={()=>setMenuAberto(true)}><MenuIcon name="menu" size={21}/>Mais</button>
      </nav>
    </div>
  </div>;
}
