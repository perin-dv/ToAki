import {useEffect,useMemo,useState} from "react";
import {collection,limit,onSnapshot,query,type Timestamp} from "firebase/firestore";
import {db} from "../lib/firebase";
import {exigirAmbienteOperacional} from "../lib/ambiente";

type Filtro="todas"|"hoje"|"pendente"|"em_rota"|"entregue"|"cancelada";
type Pedido={
  id:string;numeroNF:string;status:string;destino:string;data:Date|null;
  clienteId:string;entregadorId:string
};
type Estado={
  carregando:boolean;erro:string;pedidos:Pedido[];
};
const limite=100;
function converterData(valor:unknown):Date|null {
  if(!valor||typeof valor!=="object"||!("toDate" in valor)||typeof valor.toDate!=="function")return null;
  try{
    const d=(valor as Timestamp).toDate();
    return Number.isNaN(d.valueOf())?null:d;
  }catch{return null;}
}
function inicioDoDia(d:Date):string{
  return d.toLocaleDateString("en-CA",{timeZone:"America/Sao_Paulo"});
}
function textoCSV(campo:string):string{
  // Evita execução de fórmula ao abrir planilha exportada.
  const seguro=/^[\s]*[=+\-@\t\r]/.test(campo)?"'"+campo:campo;
  return '"'+seguro.replace(/"/g,'""')+'"';
}
function exportarCSV(pedidos:Pedido[]):void{
  const colunas=["Numero da NF","Status","Data de cadastro","Destino"];
  const dados=pedidos.map(p=>[
    p.numeroNF,p.status,p.data?p.data.toLocaleString("pt-BR",{timeZone:"America/Sao_Paulo"}):"Não informada",p.destino
  ]);
  const csv="\uFEFF"+[colunas,...dados].map(linha=>linha.map(c=>textoCSV(c)).join(";")).join("\r\n");
  const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));
  const link=document.createElement("a");
  link.href=url;link.download="toaki-relatorio-entregas.csv";document.body.appendChild(link);link.click();link.remove();
  // A URL temporária é revogada após interação; o documento não recebe esse dado.
  window.setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export default function RelatoriosEmpresaPage({empresaId}:{empresaId:string}){
  const [estado,setEstado]=useState<Estado>({carregando:true,erro:"",pedidos:[]});
  const [filtro,setFiltro]=useState<Filtro>("todas");
  const [busca,setBusca]=useState("");
  const [referenciaHoje,setReferenciaHoje]=useState(()=>inicioDoDia(new Date()));

  useEffect(()=>{
    if(!/^empresa_[0-9]{14}$/.test(empresaId)){
      setEstado({carregando:false,erro:"Identificador de empresa inválido.",pedidos:[]});return;
    }
    try{exigirAmbienteOperacional();}
    catch(e){setEstado({carregando:false,erro:e instanceof Error?e.message:"Ambiente não autorizado.",pedidos:[]});return;}
    setEstado({carregando:true,erro:"",pedidos:[]});
    const ref=query(collection(db,"empresas",empresaId,"pedidos"),limit(limite));
    const parar=onSnapshot(ref,snapshot=>{
      const pedidos=snapshot.docs.map(p=>{
        const d=p.data();
        return {
          id:p.id,numeroNF:typeof d.numero_nf==="string"?d.numero_nf:p.id,
          status:typeof d.status==="string"?d.status:"desconhecido",
          destino:typeof d.endereco_entrega==="string"?d.endereco_entrega:"",
          data:converterData(d.criado_em),
          clienteId:typeof d.destinatario_id==="string"?d.destinatario_id:"",
          entregadorId:typeof d.entregador_id==="string"?d.entregador_id:""
        };
      });
      setEstado({carregando:false,erro:"",pedidos});
    },()=>{
      setEstado({carregando:false,erro:"Falha na consulta do Firestore ou falta de permissão. Nenhum resultado foi presumido.",pedidos:[]});
    });
    return()=>parar();
  },[empresaId]);
  const estatisticas=useMemo(()=>{
    const p=estado.pedidos;
    return {total:p.length,pendentes:p.filter(x=>x.status==="pendente").length,
      emRota:p.filter(x=>x.status==="em_rota").length,
      entregues:p.filter(x=>x.status==="entregue").length,
      canceladas:p.filter(x=>x.status==="cancelada").length};
  },[estado.pedidos]);
  const filtrados=useMemo(()=>estado.pedidos.filter(p=>{
    const coincide=filtro==="todas"||(filtro==="hoje"?p.data&&inicioDoDia(p.data)===referenciaHoje:p.status===filtro);
    const termo=busca.trim().toLocaleLowerCase("pt-BR");
    return coincide&&[p.numeroNF,p.status,p.destino].join(" ").toLocaleLowerCase("pt-BR").includes(termo);
  }),[estado.pedidos,filtro,busca,referenciaHoje]);

  return <div className="account-content">
    <section className="panel content-panel">
      <div className="account-section-heading"><div><h2>Relatório de entregas</h2>
        <p>Dados verdadeiros da empresa, atualizados pelo Firestore. Sem estimativas nem exemplos.</p></div>
        <span className="pill muted">Até {limite} NFs consultadas</span></div>
      {estado.carregando?<p role="status">Consultando registros no Firebase...</p>:
       estado.erro?<p role="alert" className="form-error">{estado.erro}</p>:<>
        <div className="stats">
          {([["NFs consultadas",estatisticas.total],["Pendentes",estatisticas.pendentes],
            ["Em rota",estatisticas.emRota],["Entregues",estatisticas.entregues],
            ["Canceladas",estatisticas.canceladas]] as const).map(([titulo,valor])=>
            <div key={titulo} className="stat"><strong>{valor}</strong><small>{titulo}</small></div>)}
        </div>
        <div className="report-toolbar">
          <label>Filtrar por situação
            <select value={filtro} onChange={e=>setFiltro(e.target.value as Filtro)}>
              <option value="todas">Todas</option><option value="hoje">Criadas hoje</option>
              <option value="pendente">Pendentes</option><option value="em_rota">Em rota</option>
              <option value="entregue">Entregues</option><option value="cancelada">Canceladas</option>
            </select>
          </label>
          <label>Pesquisar NF ou endereço
            <input type="search" value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Número ou destino"/>
          </label>
          <button type="button" className="secondary" onClick={()=>setReferenciaHoje(inicioDoDia(new Date()))}>Atualizar data</button>
          <button type="button" className="primary" disabled={!filtrados.length} onClick={()=>exportarCSV(filtrados)}>Exportar CSV ({filtrados.length})</button>
        </div>
        {filtrados.length===0?<p>Nenhuma entrega corresponde aos filtros.</p>:
          <div className="report-table-wrapper"><table className="report-table">
            <thead><tr><th>NF</th><th>Status</th><th>Cadastro</th><th>Destino</th></tr></thead>
            <tbody>{filtrados.map(p=><tr key={p.id}><td>{p.numeroNF}</td><td>{p.status==="em_rota"?"Em rota":p.status}</td>
              <td>{p.data?p.data.toLocaleString("pt-BR",{timeZone:"America/Sao_Paulo"}):"Não informada"}</td>
              <td>{p.destino||"Sem destino"}</td></tr>)}</tbody>
          </table></div>}
        <p className="helper">Resumo somente das primeiras {limite} NFs retornadas, sem paginação; não é a soma completa da empresa nem necessariamente apenas de hoje. A consulta não recebe dados de outra empresa.</p>
      </>}
    </section>
  </div>;
}
