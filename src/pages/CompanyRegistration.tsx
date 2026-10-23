import { FormEvent, useEffect, useState } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Link } from "react-router-dom";
import { ambienteOperacional, ambientePilotoOriginal } from "../lib/ambiente";
import { useAuth } from "../auth/AuthProvider";
import { consultarCnpj, normalizarCnpj, validarCnpj, type DadosCnpj } from "../lib/cnpj";

export default function CompanyRegistration() {
  const {user,role,empresaId,refreshClaims}=useAuth();
  const [cnpj,setCnpj]=useState("");const [dados,setDados]=useState<DadosCnpj|null>(null);const [nomeContato,setNomeContato]=useState("");const [telefone,setTelefone]=useState("");const [confirmado,setConfirmado]=useState(false);
  const [busy,setBusy]=useState(false);const [message,setMessage]=useState("");const [exists,setExists]=useState(false);
  const [carregandoSolicitacao,setCarregandoSolicitacao]=useState(true);
  // Pedido criado no próprio site; a aprovação e o vínculo aparecem em tempo real no Firestore.
  useEffect(()=>{
    setExists(false);setMessage("");setCarregandoSolicitacao(true);
    if(!ambienteOperacional||!user?.emailVerified||empresaId){setCarregandoSolicitacao(false);return;}
    const parar=onSnapshot(doc(db,"solicitacoes_cadastro_empresas",user.uid),snap=>{
      setCarregandoSolicitacao(false);
      if(!snap.exists()){setExists(false);return;}
      setExists(true);
      const status=String(snap.data().status??"aguardando_analise");
      if(status==="aprovada"){
        setMessage("Empresa aprovada. O vínculo está sendo carregado automaticamente do Firebase.");
        // Após a escrita transacional o servidor define as claims; atualizar token na sessão atual.
        void refreshClaims().catch(()=>setMessage("Empresa aprovada. Reabra o painel para atualizar o acesso."));
      }else if(status==="rejeitada"){
        setMessage("A solicitação foi analisada e não foi aprovada. Solicite uma revisão ao suporte.");
      }else setMessage("Sua empresa foi registrada no Firebase e aguarda análise. Não é necessário cadastrá-la novamente.");
    },()=>{
      setCarregandoSolicitacao(false);
      setMessage("Não foi possível consultar o cadastro no Firestore. Confira sua conexão e as permissões publicadas.");
    });
    return()=>parar();
  },[user?.uid,user?.emailVerified,empresaId,refreshClaims]);

  const lookup=async()=>{setMessage("");setDados(null);setConfirmado(false);if(!validarCnpj(cnpj)){setMessage("Informe um CNPJ numérico válido com 14 dígitos.");return;}setBusy(true);try{const resposta=await consultarCnpj(cnpj);if(normalizarCnpj(resposta.cnpj)!==normalizarCnpj(cnpj))throw new Error("A consulta retornou outro CNPJ. Tente novamente.");setDados(resposta)}catch(error){setMessage(error instanceof Error?error.message:"Erro na consulta.")}finally{setBusy(false)}};
  const submit=async(e:FormEvent)=>{e.preventDefault();if(!ambienteOperacional||!user?.emailVerified||!dados||!confirmado||exists||carregandoSolicitacao||normalizarCnpj(dados.cnpj)!==normalizarCnpj(cnpj))return;setBusy(true);setMessage("");try{await setDoc(doc(db,"solicitacoes_cadastro_empresas",user.uid),{
    tipo_registro:"solicitacao_cadastro_empresa",titulo_registro:"Solicitação de cadastro — "+dados.razao_social.slice(0,140),
    uid_responsavel:user.uid, email_responsavel:user.email||"",nome_responsavel:nomeContato.trim(),
    cnpj:normalizarCnpj(dados.cnpj),razao_social:dados.razao_social.trim(),nome_fantasia:dados.nome_fantasia.trim(),
    municipio:dados.municipio,uf:dados.uf,telefone_contato:telefone.trim(),status:"aguardando_analise",criado_em:new Date().toISOString()
  });setExists(true);setMessage("Empresa registrada no Firebase. Aguardando a análise administrativa para liberar o painel.");}catch{setMessage("Não foi possível enviar. O Firestore pode não estar ativado ou a solicitação já existe. Não tente criar outra conta.");}finally{setBusy(false)}};
  if(empresaId && (role==="dono_empresa"||role==="gestor"||role==="vendedor"))
    return <section className="panel content-panel"><h2>Empresa já vinculada à sua conta</h2>
      <p>Seu acesso empresarial já está associado ao Firebase. Não é necessário informar CNPJ nem cadastrar novamente a empresa.</p>
      <Link className="primary button-link" to="/inicio">Abrir painel da minha empresa →</Link>
    </section>;
  if(!ambienteOperacional) return <section className="panel content-panel"><h2>Solicitar cadastro de empresa</h2><p className="subheading">O envio de solicitações empresariais só será liberado após ativar o piloto autorizado no Firebase existente. Por enquanto, nenhum cadastro operacional real é gravado.</p><span className="pill muted">Piloto não habilitado</span></section>;
  if(!user?.emailVerified) return <section className="panel content-panel"><h2>Solicitar cadastro de empresa</h2><p className="subheading">Seu login já está funcionando no ambiente de testes. Para registrar uma empresa e armazenar dados comerciais, precisamos confirmar seu e-mail.</p><Link to="/verificar-email" state={{from:"/cadastro/empresa/dados"}} className="primary button-link">Confirmar e-mail para cadastrar empresa</Link></section>;
  if(carregandoSolicitacao)return <section className="panel content-panel"><h2>Cadastro da empresa</h2><p role="status">Consultando cadastro existente no Firebase...</p></section>;
  return <section className="panel content-panel"><h2>Solicitar cadastro de empresa</h2><p className="subheading">O CNPJ preenche os dados públicos, mas não comprova que você tem autorização para representar a empresa.</p>{ambientePilotoOriginal&&<div className="demo-warning" role="status">Piloto controlado: a solicitação é real e será salva no Firebase atual. A empresa só receberá acesso após análise administrativa e autorização explícita no backend.</div>}
  <form className="stack" onSubmit={submit}>
    <label>CNPJ<input value={cnpj} onChange={e=>{setCnpj(e.target.value);setDados(null);setConfirmado(false)}} inputMode="numeric" maxLength={18} required placeholder="00.000.000/0000-00" disabled={exists}/></label>
    <button type="button" className="secondary" disabled={busy||exists} onClick={lookup}>{busy?"Consultando...":"Consultar CNPJ na BrasilAPI"}</button>
    {dados&&<div className="result-box"><strong>{dados.razao_social}</strong><p>Nome fantasia: {dados.nome_fantasia||"Não informado"}</p><p>CNPJ: {dados.cnpj} · Situação: {dados.situacao_cadastral||"Não informada"}</p><p>{dados.logradouro}, {dados.numero} — {dados.bairro}<br/>{dados.municipio}/{dados.uf} · CEP {dados.cep}</p><p className="helper">Confirme os dados antes de solicitar. A consulta é informativa e não substitui a verificação do administrador.</p></div>}
    {dados&&<><label>Nome do responsável<input required maxLength={100} value={nomeContato} onChange={e=>setNomeContato(e.target.value)} placeholder="Nome para contato"/></label><label>Telefone de contato<input required maxLength={20} value={telefone} onChange={e=>setTelefone(e.target.value)} placeholder="(44) 99999-9999"/></label><label className="check-row"><input type="checkbox" checked={confirmado} onChange={e=>setConfirmado(e.target.checked)}/> Declaro que tenho autorização para solicitar o cadastro desta empresa e aceito a análise antes da liberação.</label></>}
    {message&&<p role="status" className={exists?"form-info":"helper"}>{message}</p>}
    <button className="primary" disabled={!dados||!confirmado||busy||exists||carregandoSolicitacao}>Registrar empresa no Firebase para análise</button>
  </form>
  </section>;
}
