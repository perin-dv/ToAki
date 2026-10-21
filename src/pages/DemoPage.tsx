import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Brand from "../components/Brand";

type Delivery = {nf:string;person:string;place:string;status:string;eta:string;pos:{left:string;top:string}};
const entregas:Delivery[]=[
  {nf:"0045821",person:"João Silva",place:"Zona 07, Maringá",status:"Em rota",eta:"12 min",pos:{left:"38%",top:"36%"}},
  {nf:"0045822",person:"Carlos Lima",place:"Jardim Alvorada",status:"Em rota",eta:"22 min",pos:{left:"72%",top:"63%"}},
  {nf:"0045823",person:"Marcos Reis",place:"Centro, Maringá",status:"Aguardando coleta",eta:"—",pos:{left:"49%",top:"80%"}}
];
const menu=[
  {key:"inicio",icon:"⌂",name:"Início"},
  {key:"entregas",icon:"▣",name:"Entregas e NFs"},
  {key:"entregadores",icon:"♧",name:"Entregadores"},
  {key:"clientes",icon:"♧",name:"Clientes e links"},
  {key:"comprovantes",icon:"✓",name:"Comprovantes"},
  {key:"historico",icon:"◷",name:"Histórico e relatórios"},
  {key:"empresa",icon:"▤",name:"Empresa e equipe"},
  {key:"assinatura",icon:"▧",name:"Assinatura"}
] as const;
type MenuKey=typeof menu[number]["key"];

function MapIllustration({selected,onSelect}:{selected:number;onSelect:(i:number)=>void}) {
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
    {entregas.map((d,i)=><button key={d.nf} className={"marker "+(selected===i?"selected":"")} style={d.pos} onClick={()=>onSelect(i)} aria-label={`Selecionar entrega fictícia ${d.nf}`}><span className="marker-bubble">🛵</span><span className="marker-label"><b>{d.person.split(" ")[0]}</b><em>{d.status}</em></span></button>)}
    <span className="map-watermark">SIMULAÇÃO • SEM GPS</span>
  </div>;
}
export default function DemoPage() {
  const [tab,setTab]=useState<MenuKey>("inicio");const[selected,setSelected]=useState(0);const[search,setSearch]=useState("");
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
  const filtered=useMemo(()=>entregas.filter(e=>[e.nf,e.person,e.place].join(" ").toLowerCase().includes(search.toLowerCase())),[search]);
  const chosen=entregas[selected];
  const panelTitle=menu.find(m=>m.key===tab)?.name??"Início";
  return <div className="demo-layout">
    {menuAberto&&<button className="drawer-backdrop" type="button" aria-label="Fechar menu lateral" onClick={()=>setMenuAberto(false)}/>}
    <aside id="demo-sidebar-menu" className={"demo-sidebar "+(menuAberto?"drawer-open":"")}>
      <div className="drawer-heading">
        <Brand/>
        <button className="drawer-close" type="button" aria-label="Fechar menu" onClick={()=>setMenuAberto(false)}>✕</button>
      </div>
      <nav aria-label="Menu completo do protótipo">
        {menu.map(m=><button type="button" key={m.key} onClick={()=>mudarAba(m.key)} className={"nav "+(tab===m.key?"active":"")} aria-current={tab===m.key?"page":undefined}><span className="nav-icon">{m.icon}</span>{m.name}</button>)}
      </nav>
      <div className="sidebar-foot"><strong>Soma Distribuidora</strong><span>Filial Maringá · Simulação</span><Link to="/login">Acessar sistema →</Link></div>
    </aside>
    <div className="demo-body"><header className="mobile-top">
      <button className="mobile-menu-button" type="button" aria-label="Abrir menu completo" aria-controls="demo-sidebar-menu" aria-expanded={menuAberto} onClick={()=>setMenuAberto(true)}>☰ <span>Menu</span></button>
      <Brand compact/><Link to="/login" className="top-signin">Entrar →</Link>
    </header>
      <main className="demo-main">
        <div className="demo-head"><div><h1>{tab==="inicio"?"Central de rastreamento":panelTitle}</h1><p>toAki Business • Ambiente de demonstração</p></div><div className="head-right"><span className="fake-status">● Dados simulados</span><Link to="/login" className="secondary">Entrar</Link></div></div>
        <div className="demo-warning">Demonstração visual — informações, localização, notas e previsão de chegada fictícias.</div>
        {tab==="inicio"?<><div className="stats">{[["📦","18","Entregas hoje"],["🛵","07","Em rota"],["✅","09","Entregues"],["⏱","02","Pendentes"]].map(([icon,value,label])=><div key={label} className="stat"><span className="stat-icon">{icon}</span><div><strong>{value}</strong><small>{label}</small></div></div>)}</div>
          <div className="content-grid"><section className="panel map-shell"><div className="panel-head maphead"><h2>Mapa dos entregadores</h2><label className="search">⌕ <input type="search" placeholder="Buscar NF, pedido ou entregador..." value={search} onChange={e=>setSearch(e.target.value)} aria-label="Buscar entregas fictícias"/></label></div><MapIllustration selected={selected} onSelect={setSelected}/></section>
          <div className="right"><section className="panel"><div className="panel-head"><h2>Entregas em andamento</h2><span className="subtle">Fictícias</span></div>{filtered.length?filtered.map(e=>{const i=entregas.indexOf(e);return <button key={e.nf} className={"delivery "+(selected===i?"selected":"")} onClick={()=>setSelected(i)}><span className="bike">🛵</span><span className="copy"><strong>NF {e.nf}</strong><small>{e.person} · {e.place}</small></span><span className="delivery-side"><span className={"pill "+(e.status==="Em rota"?"":"muted")}>{e.status}</span><small>{e.eta}</small></span></button>;}):<p className="subtle">Nenhuma entrega encontrada.</p>}</section>
          <section className="panel"><div className="panel-head"><h2>Resumo do dia</h2><span className="subtle">Exemplo</span></div><div className="mini-stat">{[["18","Entregas"],["07","Em rota"],["09","Entregues"],["02","Pendentes"]].map(([value,label])=><div key={label}><strong>{value}</strong><small>{label}</small></div>)}</div></section>
          <section className="panel"><div className="panel-head"><h2>Detalhes da entrega</h2><span className={"pill "+(chosen.status==="Em rota"?"":"muted")}>{chosen.status}</span></div><p className="details"><strong>NF {chosen.nf}</strong><br/>Entregador: {chosen.person}<br/>Destino: {chosen.place}<br/>Previsão fictícia: {chosen.eta}<br/>Localização: simulada</p><button className="primary" onClick={()=>mudarAba("entregas")}>Ver detalhes →</button></section></div></div>
        </>:<section className="panel content-panel"><div className="panel-head"><h2>{panelTitle}</h2><span className="pill muted">Protótipo</span></div>{tab==="entregas"?<div className="table-scroll"><table><thead><tr><th>Nota fiscal</th><th>Entregador</th><th>Destino</th><th>Status</th><th>Ação</th></tr></thead><tbody>{entregas.map((e,i)=><tr key={e.nf}><td>NF {e.nf}</td><td>{e.person}</td><td>{e.place}</td><td>{e.status}</td><td><button className="secondary" onClick={()=>{mudarAba("inicio");setSelected(i)}}>Ver mapa</button></td></tr>)}</tbody></table></div>:<p>A área <strong>{panelTitle}</strong> será conectada a informações reais nas próximas fases. Aqui mostramos apenas a organização visual.</p>}<p className="helper">Para autenticação, cadastro e solicitações reais, acesse a área de login.</p><Link className="primary button-link" to="/login">Ir para o login</Link></section>}
      </main>
      <nav className="mobile-nav" aria-label="Atalhos móveis do protótipo">
        {menu.filter(m=>["inicio","entregas","entregadores","empresa"].includes(m.key)).map(m=><button type="button" key={m.key} className={tab===m.key?"on":""} onClick={()=>mudarAba(m.key)} aria-current={tab===m.key?"page":undefined}><strong>{m.icon}</strong>{m.name.split(" ")[0]}</button>)}
        <button type="button" className={menuAberto||!["inicio","entregas","entregadores","empresa"].includes(tab)?"on":""} aria-label="Abrir todos os módulos" aria-controls="demo-sidebar-menu" aria-expanded={menuAberto} onClick={()=>setMenuAberto(true)}><strong>☰</strong>Mais</button>
      </nav>
    </div>
  </div>;
}
