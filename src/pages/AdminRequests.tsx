import { useEffect, useState } from "react";
import { collection, getDocs, limit, query } from "firebase/firestore";
import { db } from "../lib/firebase";

type Solicitacao = {
  titulo_registro: string;
  razao_social: string;
  nome_fantasia: string;
  cnpj: string;
  nome_responsavel: string;
  email_responsavel: string;
  telefone_contato: string;
  municipio: string;
  uf: string;
  status: string;
  criado_em: string;
};
const texto=(v: unknown)=>typeof v==="string"?v:"";
function formatarCnpj(value:string) {
  const n=value.replace(/[^0-9]/g,"");
  return n.length===14?`${n.slice(0,2)}.${n.slice(2,5)}.${n.slice(5,8)}/${n.slice(8,12)}-${n.slice(12)}`:value;
}

export default function AdminRequests() {
  const [items,setItems]=useState<Solicitacao[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const carregar=async()=>{
    setLoading(true);setError("");
    try {
      const result=await getDocs(query(collection(db,"solicitacoes_cadastro_empresas"),limit(50)));
      setItems(result.docs.map(snap=>{
        const d=snap.data();
        return {
          titulo_registro:texto(d.titulo_registro),
          razao_social:texto(d.razao_social),
          nome_fantasia:texto(d.nome_fantasia),
          cnpj:texto(d.cnpj),
          nome_responsavel:texto(d.nome_responsavel),
          email_responsavel:texto(d.email_responsavel),
          telefone_contato:texto(d.telefone_contato),
          municipio:texto(d.municipio),
          uf:texto(d.uf),
          status:texto(d.status),
          criado_em:texto(d.criado_em)
        };
      }));
    } catch {
      setError("Não foi possível consultar solicitações. Confira o cargo de administrador, as regras publicadas e a conexão com o Firestore.");
    } finally {setLoading(false)}
  };
  useEffect(()=>{void carregar()},[]);
  return <section className="panel content-panel">
    <div className="panel-head">
      <div><h2>Solicitações de cadastro de empresas</h2><p className="helper">Mostrando até 50 registros. Aprovação não habilitada nesta etapa.</p></div>
      <button type="button" className="secondary" onClick={()=>void carregar()} disabled={loading}>Atualizar lista</button>
    </div>
    <p className="form-info"><strong>Consulta administrativa:</strong> ter um usuário no Firebase Authentication não concede o cargo de administrador. Ele só será atribuído por um serviço confiável, após validação.</p>
    {loading&&<p role="status">Carregando solicitações...</p>}
    {error&&<p role="alert" className="form-error">{error}</p>}
    {!loading&&!error&&items.length===0&&<p>Nenhuma solicitação de empresa encontrada.</p>}
    {!loading&&!error&&items.length>0&&<div className="requests-list">{items.map((s,i)=><article className="request-item" key={s.cnpj+"-"+i}>
      <div className="request-header"><strong>{s.titulo_registro||("Solicitação — "+s.razao_social)}</strong><span className="pill muted">{s.status.replaceAll("_"," ")||"Sem status"}</span></div>
      <dl><div><dt>Nome fantasia</dt><dd>{s.nome_fantasia||"Não informado"}</dd></div>
      <div><dt>Razão social</dt><dd>{s.razao_social}</dd></div>
      <div><dt>CNPJ</dt><dd>{formatarCnpj(s.cnpj)}</dd></div>
      <div><dt>Responsável</dt><dd>{s.nome_responsavel}</dd></div>
      <div><dt>E-mail</dt><dd>{s.email_responsavel}</dd></div>
      <div><dt>Telefone</dt><dd>{s.telefone_contato}</dd></div>
      <div><dt>Cidade</dt><dd>{s.municipio} / {s.uf}</dd></div>
      <div><dt>Registrado em</dt><dd>{s.criado_em||"A confirmar"}</dd></div></dl>
      <p className="helper">Revisar vínculos e dados antes de qualquer aprovação. Ação de aprovação exige backend com auditoria.</p>
    </article>)}</div>}
  </section>;
}
