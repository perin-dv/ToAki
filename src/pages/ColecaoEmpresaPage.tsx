import {useEffect,useState} from "react";
import {collection,limit,onSnapshot,query,type DocumentData} from "firebase/firestore";
import {db} from "../lib/firebase";
import {exigirAmbienteOperacional} from "../lib/ambiente";
import {identificadorEmpresaValido} from "../lib/empresaId";

type Grupo="funcionarios"|"historico"|"comprovantes";
type Linha={id:string;titulo:string;detalhe:string;data:string};
const config:Record<Grupo,{titulo:string;vazio:string;detalhe:string}>={
  funcionarios:{titulo:"Equipe autorizada",vazio:"Nenhum funcionário vinculado.",detalhe:"Convites, edição de cargos e desligamento ainda serão conectados ao backend."},
  historico:{titulo:"Histórico de operações",vazio:"Nenhum evento de auditoria encontrado.",detalhe:"Exibe os eventos autorizados registrados pelo backend, sem dados fictícios."},
  comprovantes:{titulo:"Comprovantes da empresa",vazio:"Nenhum comprovante registrado.",detalhe:"A criação e consulta de fotos/assinaturas reais ainda serão implementadas; nenhum recibo fictício é exibido."}
};
function formatarData(x:unknown):string{
  if(!x||typeof x!=="object"||!("toDate" in x)||typeof x.toDate!=="function")return "Data indisponível";
  try{return (x.toDate() as Date).toLocaleString("pt-BR");}catch{return "Data indisponível";}
}
function converter(d:DocumentData,id:string,grupo:Grupo):Linha{
  const titulo=typeof d.titulo_registro==="string"?d.titulo_registro:grupo==="funcionarios"?(typeof d.nome_exibicao==="string"?d.nome_exibicao:"Membro da equipe"):"Registro autorizado";
  const detalhe=grupo==="funcionarios"?`${String(d.papel??"Papel não informado")} · ${d.ativo===true?"Ativo":"Inativo"}`:
    grupo==="historico"?String(d.acao??"Evento"):String(d.observacao??"Comprovante cadastrado");
  return {id,titulo,detalhe,data:formatarData(d.criado_em)};
}
export default function ColecaoEmpresaPage({empresaId,grupo}:{empresaId:string;grupo:Grupo}){
  const [dados,setDados]=useState<Linha[]>([]);
  const [carregando,setCarregando]=useState(true);
  const [erro,setErro]=useState("");
  useEffect(()=>{
    setCarregando(true);setErro("");setDados([]);
    try{exigirAmbienteOperacional();}catch(e){setErro(e instanceof Error?e.message:"Ambiente não autorizado.");setCarregando(false);return;}
    if(!identificadorEmpresaValido(empresaId)){setErro("Empresa inválida.");setCarregando(false);return;}
    const cancelar=onSnapshot(query(collection(db,"empresas",empresaId,grupo),limit(50)),snap=>{
      setDados(snap.docs.map(item=>converter(item.data(),item.id,grupo)));
      setCarregando(false);setErro("");
    },()=>{setDados([]);setCarregando(false);setErro("Sem permissão para consultar esta coleção da empresa ou falha de conexão.");});
    return()=>cancelar();
  },[empresaId,grupo]);
  return <section className="panel content-panel">
    <div className="panel-head"><h2>{config[grupo].titulo}</h2><span className="subtle">Até 50 registros</span></div>
    {carregando?<p role="status">Consultando Firestore...</p>:erro?<p role="alert" className="form-error">{erro}</p>:dados.length===0?<p>{config[grupo].vazio}</p>:<div className="demo-record-list">
      {dados.map(d=><article className="demo-record" key={d.id}><div><strong>{d.titulo}</strong><small>{d.detalhe}</small><small>{d.data}</small></div></article>)}
    </div>}
    <p className="helper">{config[grupo].detalhe}</p>
  </section>;
}
