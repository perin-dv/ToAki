import {useEffect,useMemo,useState,type FormEvent} from "react";
import {collection,limit,onSnapshot,query} from "firebase/firestore";
import {db} from "../lib/firebase";
import {useAuth} from "../auth/AuthProvider";
import {convidarEquipe,desativarMembro,linkEquipe,type PapelEquipe} from "../lib/equipeEmpresa";
import {identificadorEmpresaValido} from "../lib/empresaId";
import {exigirAmbienteOperacional} from "../lib/ambiente";

type Membro={id:string;nome:string;email:string;papel:string;ativo:boolean};
const tituloPapel=(v:string)=>v==="dono_empresa"?"Responsável pela empresa":v==="gestor"?"Gestor":v==="vendedor"?"Vendedor":"Perfil não informado";
const texto=(v:unknown)=>typeof v==="string"?v:"";
export default function EquipeEmpresaPage({empresaId}:{empresaId:string}){
  const {user,role}=useAuth();
  const [membros,setMembros]=useState<Membro[]>([]);
  const [carregando,setCarregando]=useState(true);
  const [erro,setErro]=useState("");
  const [aviso,setAviso]=useState("");
  const [email,setEmail]=useState("");
  const [papel,setPapel]=useState<PapelEquipe>("vendedor");
  const [convite,setConvite]=useState<{link:string;expiraEm:number}|null>(null);
  const [busy,setBusy]=useState(false);
  const [desligando,setDesligando]=useState("");
  const [busca,setBusca]=useState("");
  useEffect(()=>{
    setMembros([]);setCarregando(true);setErro("");
    try{exigirAmbienteOperacional();if(!identificadorEmpresaValido(empresaId))throw Error("Empresa inválida.");}
    catch(e){setErro(e instanceof Error?e.message:"Ambiente não autorizado.");setCarregando(false);return;}
    const parar=onSnapshot(query(collection(db,"empresas",empresaId,"funcionarios"),limit(100)),snap=>{
      setMembros(snap.docs.map(doc=>{
        const d=doc.data();return {id:doc.id,nome:texto(d.nome_exibicao)||texto(d.titulo_registro)||"Membro da equipe",
          email:texto(d.email),papel:texto(d.papel),ativo:d.ativo===true};
      }));
      setCarregando(false);setErro("");
    },()=>{setCarregando(false);setMembros([]);setErro("Sem permissão para consultar funcionários desta empresa.");});
    return()=>parar();
  },[empresaId]);
  const ordem=useMemo(()=>membros.filter(m=>[m.nome,m.email,tituloPapel(m.papel)]
    .join(" ").toLowerCase().includes(busca.trim().toLowerCase()))
    .sort((a,b)=>Number(b.ativo)-Number(a.ativo)||a.nome.localeCompare(b.nome,"pt-BR")),[membros,busca]);
  const criar=async(e:FormEvent)=>{
    e.preventDefault();setErro("");setAviso("");setConvite(null);setBusy(true);
    try{
      const c=await convidarEquipe(empresaId,email,papel);
      setConvite({link:linkEquipe(window.location.origin,c),expiraEm:c.expiraEm});
      setAviso("Convite gerado. Compartilhe privadamente com o e-mail informado. Válido por 24 horas e de uso único.");
    }catch(err){setErro(err instanceof Error?err.message:"Não foi possível gerar convite.");}
    finally{setBusy(false);}
  };
  const desligar=async(m:Membro)=>{
    if(!user||m.id===user.uid)return;
    if(!window.confirm("Desativar o acesso de "+m.nome+"? Esta pessoa perderá acesso aos dados da empresa."))return;
    setDesligando(m.id);setErro("");setAviso("");
    try{await desativarMembro(empresaId,m.id);setAviso("Acesso de "+m.nome+" desativado na empresa.");}
    catch(err){setErro(err instanceof Error?err.message:"Não foi possível desativar.");}
    finally{setDesligando("");}
  };
  return <div className="team-layout">
    <section className="panel content-panel">
      <div className="panel-head"><h2>Equipe autorizada</h2><span className="subtle">Até 100 membros</span></div>
      <p className="helper">Pessoas vinculadas à sua empresa, com nomes e funções. Identificadores de autenticação não são exibidos.</p>
      <label className="team-search">Pesquisar funcionário<input value={busca} type="search" onChange={e=>setBusca(e.target.value)} placeholder="Nome, e-mail ou função"/></label>
      {carregando?<p role="status">Consultando equipe no Firebase...</p>:erro?<p role="alert" className="form-error">{erro}</p>:
       ordem.length===0?<p>Nenhum funcionário corresponde à consulta.</p>:
       <div className="demo-record-list">
         {ordem.map(m=><article className="demo-record team-record" key={m.id}>
           <div><strong>{m.nome}</strong><small>{tituloPapel(m.papel)} · {m.ativo?"Ativo":"Acesso desativado"}</small>{m.email&&<small>{m.email}</small>}</div>
           {m.ativo&&m.id!==user?.uid&&m.papel!=="dono_empresa"&&(role==="dono_empresa"||m.papel==="vendedor")&&
             <button className="secondary" type="button" disabled={desligando===m.id} onClick={()=>void desligar(m)}>
               {desligando===m.id?"Desativando...":"Desativar acesso"}
             </button>}
         </article>)}
       </div>}
    </section>
    <section className="panel content-panel">
      <div className="panel-head"><h2>Convidar funcionário</h2></div>
      <p>Um convite só pode ser usado pela conta correspondente ao e-mail escolhido, após confirmação do endereço.</p>
      <form className="stack" onSubmit={e=>void criar(e)}>
        <label>E-mail de quem entrará na equipe<input type="email" required maxLength={180} value={email}
          placeholder="colega@exemplo.com" onChange={e=>{setEmail(e.target.value);setConvite(null);}}/></label>
        <label>Função<select value={papel} onChange={e=>{setPapel(e.target.value as PapelEquipe);setConvite(null);}}>
          <option value="vendedor">Vendedor — cadastrar e acompanhar NFs</option>
          {role==="dono_empresa"&&<option value="gestor">Gestor — administrar operação e equipe</option>}
        </select></label>
        <button type="submit" className="primary" disabled={busy}>{busy?"Gerando convite...":"Gerar convite de acesso"}</button>
      </form>
      {aviso&&<p role="status" className="form-info">{aviso}</p>}
      {erro&&<p role="alert" className="form-error">{erro}</p>}
      {convite&&<div className="invite-output" role="status">
        <strong>Link de acesso privado</strong>
        <p>Válido até {new Date(convite.expiraEm).toLocaleString("pt-BR")}. Compartilhe somente com o destinatário.</p>
        <input type="text" aria-label="Link privado de funcionário" readOnly value={convite.link} onFocus={e=>e.target.select()}/>
        <button type="button" className="secondary" onClick={()=>void navigator.clipboard?.writeText(convite.link)}>Copiar link</button>
        <p>O link não concede privilégios sem autenticação, e-mail confirmado e validação pelo servidor.</p>
      </div>}
      <p className="helper">O responsável não pode ser removido por este painel. Reativação e troca de função exigirão revisão administrativa.</p>
    </section>
  </div>;
}
