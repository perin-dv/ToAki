import {useEffect,useState} from "react";
import {collection,limit,onSnapshot,query,where} from "firebase/firestore";
import {db} from "../lib/firebase";
import {exigirAmbienteOperacional} from "../lib/ambiente";

type Plano={id:string;nome:string;descricao:string};
type Assinatura={id:string;planoId:string;status:string};
type Estado={
  carregando:boolean;erroPlanos:string;erroAssinatura:string;
  planos:Plano[];assinaturas:Assinatura[];
};
export default function AssinaturaEmpresaPage({empresaId}:{empresaId:string}){
  const [estado,setEstado]=useState<Estado>({carregando:true,erroPlanos:"",erroAssinatura:"",planos:[],assinaturas:[]});
  const [carregouPlanos,setCarregouPlanos]=useState(false);
  const [carregouAssinaturas,setCarregouAssinaturas]=useState(false);
  useEffect(()=>{
    setEstado({carregando:true,erroPlanos:"",erroAssinatura:"",planos:[],assinaturas:[]});
    setCarregouPlanos(false);setCarregouAssinaturas(false);
    try{exigirAmbienteOperacional();}
    catch(e){
      setEstado({carregando:false,erroPlanos:e instanceof Error?e.message:"Ambiente não autorizado.",erroAssinatura:"",planos:[],assinaturas:[]});
      return;
    }
    if(!/^empresa_[0-9]{14}$/.test(empresaId)){
      setEstado({carregando:false,erroPlanos:"Empresa inválida.",erroAssinatura:"",planos:[],assinaturas:[]});return;
    }
    // O filtro publicado==true é necessário às regras do Firestore.
    const planos=query(collection(db,"planos"),where("publicado","==",true),limit(20));
    const assinaturas=query(collection(db,"assinaturas"),where("empresa_id","==",empresaId),limit(10));
    const cancelarPlanos=onSnapshot(planos,snap=>{
      setCarregouPlanos(true);
      setEstado(s=>({...s,erroPlanos:"",planos:snap.docs.map(d=>{
        const p=d.data();
        return {id:d.id,nome:typeof p.nome==="string"?p.nome:"Plano cadastrado",
          descricao:typeof p.descricao==="string"?p.descricao:"Detalhes ainda não publicados"};
      })}));
    },()=>{setCarregouPlanos(true);setEstado(s=>({...s,erroPlanos:"Não foi possível consultar planos publicados.",planos:[]}));});
    const cancelarAssinatura=onSnapshot(assinaturas,snap=>{
      setCarregouAssinaturas(true);
      setEstado(s=>({...s,erroAssinatura:"",assinaturas:snap.docs.map(d=>{
        const p=d.data();
        return {id:d.id,planoId:typeof p.plano_id==="string"?p.plano_id:"",
          status:typeof p.status==="string"?p.status:"Não informado"};
      })}));
    },()=>{setCarregouAssinaturas(true);setEstado(s=>({...s,erroAssinatura:"Não foi possível consultar sua assinatura ou perfil sem permissão de gestor.",assinaturas:[]}));});
    return()=>{cancelarPlanos();cancelarAssinatura();};
  },[empresaId]);
  const carregando=estado.carregando&&!(carregouPlanos&&carregouAssinaturas);
  return <section className="panel content-panel">
    <div className="account-section-heading"><div><h2>Planos e assinatura</h2>
      <p>Dados consultados no Firebase; nenhum pagamento é simulado.</p></div></div>
    {carregando&&<p role="status">Conferindo planos e assinaturas...</p>}
    {estado.erroAssinatura?<p role="alert" className="form-error">{estado.erroAssinatura}</p>:
      !carregando&&<div className="account-summary">
        <div className="account-summary-card"><span>Assinatura da empresa</span>
          <strong>{estado.assinaturas.length?estado.assinaturas.map(a=>a.status).join(", "):"Sem assinatura cadastrada"}</strong>
          {estado.assinaturas.length>0&&<small>Plano: {estado.planos.find(p=>p.id===estado.assinaturas[0].planoId)?.nome||"Não identificado"}</small>}
        </div>
      </div>}
    {estado.erroPlanos?<p role="alert" className="form-error">{estado.erroPlanos}</p>:
      !carregando&&<div className="demo-record-list">
        {estado.planos.length===0?<p>Não há planos publicados para consulta.</p>:
          estado.planos.map(p=><article className="demo-record" key={p.id}><div><strong>{p.nome}</strong><small>{p.descricao}</small></div></article>)}
      </div>}
    <p className="helper">Ainda não é possível contratar, alterar ou pagar uma assinatura nesta tela. O checkout será conectado a um provedor de pagamentos e validado por webhook antes de liberar qualquer plano.</p>
  </section>;
}
