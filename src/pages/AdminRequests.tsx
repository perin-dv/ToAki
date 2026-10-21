import { useEffect, useState } from "react";
import { collection, getDocs, limit, query } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { db, firebaseApp } from "../lib/firebase";
import { useAuth } from "../auth/AuthProvider";

type Solicitacao = {
  uidSolicitante: string;
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
const backendAtivado=import.meta.env.VITE_ENABLE_ADMIN_APPROVAL === "true";

function formatarCnpj(value:string) {
  const n=value.replace(/[^0-9]/g,"");
  return n.length===14?`${n.slice(0,2)}.${n.slice(2,5)}.${n.slice(5,8)}/${n.slice(8,12)}-${n.slice(12)}`:value;
}

export default function AdminRequests() {
  const {refreshClaims}=useAuth();
  const [items,setItems]=useState<Solicitacao[]>([]);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  const [selecionada,setSelecionada]=useState<string|null>(null);
  const [justificativa,setJustificativa]=useState("");
  const [vinculoVerificado,setVinculoVerificado]=useState(false);

  const carregar=async()=>{
    setLoading(true);setError("");
    try {
      const result=await getDocs(query(collection(db,"solicitacoes_cadastro_empresas"),limit(50)));
      setItems(result.docs.map(snap=>{
        const d=snap.data();
        return {
          uidSolicitante:snap.id,
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
      setError("Não foi possível consultar solicitações. Confira o perfil administrador, as regras publicadas e a conexão.");
    } finally {setLoading(false)}
  };
  useEffect(()=>{void carregar()},[]);

  const analisar=async(acao:"aprovar"|"rejeitar",uidSolicitante:string)=>{
    if(!backendAtivado || !uidSolicitante || justificativa.trim().length<15 || busy)return;
    if(acao==="aprovar"&&!vinculoVerificado)return;
    setBusy(true);setError("");setNotice("");
    try {
      await refreshClaims();
      const confirmar=httpsCallable(getFunctions(firebaseApp,"southamerica-east1"),"analisarCadastroEmpresa");
      await confirmar({uidSolicitante,acao,justificativa:justificativa.trim(),vinculoVerificado});
      setNotice(acao==="aprovar"?"Solicitação aprovada; responsável deverá atualizar o login para receber suas permissões.":"Solicitação rejeitada e registrada na auditoria.");
      setSelecionada(null);setJustificativa("");setVinculoVerificado(false);
      await carregar();
    }catch{
      setError("A operação não foi concluída. Verifique autorização administrativa, conexão, dados e implantação do backend. Nenhuma aprovação é assumida até confirmação.");
    }finally {setBusy(false)}
  };

  return <section className="panel content-panel">
    <div className="panel-head">
      <div><h2>Solicitações de cadastro de empresas</h2><p className="helper">Até 50 registros por consulta, para revisão administrativa.</p></div>
      <button type="button" className="secondary" onClick={()=>void carregar()} disabled={loading||busy}>Atualizar lista</button>
    </div>
    {!backendAtivado&&<p className="demo-warning" role="status">Painel em preparação: aprovação e rejeição indisponíveis até publicar e validar a Cloud Function administrativa. Nenhuma empresa é aprovada apenas pelo navegador.</p>}
    <p className="form-info"><strong>Acesso restrito:</strong> exige perfil admin_toaki concedido no servidor e e-mail verificado. Cadastro de usuário comum nunca cria privilégio administrativo.</p>
    {loading&&<p role="status">Carregando solicitações...</p>}
    {error&&<p role="alert" className="form-error">{error}</p>}
    {notice&&<p role="status" className="form-info">{notice}</p>}
    {!loading&&!error&&items.length===0&&<p>Nenhuma solicitação de empresa encontrada.</p>}
    {!loading&&items.length>0&&<div className="requests-list">{items.map(s=><article className="request-item" key={s.uidSolicitante}>
      <div className="request-header"><strong>{s.titulo_registro||("Solicitação — "+s.razao_social)}</strong><span className="pill muted">{s.status.replaceAll("_"," ")||"Sem status"}</span></div>
      <dl>
        <div><dt>Nome fantasia</dt><dd>{s.nome_fantasia||"Não informado"}</dd></div>
        <div><dt>Razão social</dt><dd>{s.razao_social}</dd></div>
        <div><dt>CNPJ</dt><dd>{formatarCnpj(s.cnpj)}</dd></div>
        <div><dt>Responsável</dt><dd>{s.nome_responsavel}</dd></div>
        <div><dt>E-mail</dt><dd>{s.email_responsavel}</dd></div>
        <div><dt>Telefone</dt><dd>{s.telefone_contato}</dd></div>
        <div><dt>Cidade</dt><dd>{s.municipio} / {s.uf}</dd></div>
        <div><dt>Registrado em</dt><dd>{s.criado_em||"A confirmar"}</dd></div>
      </dl>
      {s.status==="aguardando_analise"&&<div className="review-actions">
        <button type="button" className="secondary" disabled={!backendAtivado||busy} onClick={()=>{setSelecionada(s.uidSolicitante===selecionada?null:s.uidSolicitante);setJustificativa("");setVinculoVerificado(false)}}>Analisar solicitação</button>
        {selecionada===s.uidSolicitante&&backendAtivado&&<div className="stack review-form">
          <p className="helper">Antes de aprovar, verifique documentos e autorização do responsável fora do formulário. A consulta do CNPJ não comprova propriedade.</p>
          <label>Justificativa da análise<textarea rows={3} minLength={15} maxLength={500} required value={justificativa} onChange={e=>setJustificativa(e.target.value)} placeholder="Descreva a verificação documental realizada"/></label>
          <label className="check-row"><input type="checkbox" checked={vinculoVerificado} onChange={e=>setVinculoVerificado(e.target.checked)}/> Conferi a identidade e a autorização de representar esta empresa.</label>
          <div className="review-buttons">
            <button type="button" className="primary" disabled={busy||justificativa.trim().length<15||!vinculoVerificado} onClick={()=>void analisar("aprovar",s.uidSolicitante)}>Aprovar empresa</button>
            <button type="button" className="secondary" disabled={busy||justificativa.trim().length<15} onClick={()=>void analisar("rejeitar",s.uidSolicitante)}>Rejeitar solicitação</button>
          </div>
        </div>}
      </div>}
    </article>)}</div>}
  </section>;
}
