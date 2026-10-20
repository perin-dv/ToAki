import { FormEvent, useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../auth/AuthProvider";
import { consultarCnpj, normalizarCnpj, validarCnpj, type DadosCnpj } from "../lib/cnpj";

export default function CompanyRegistration() {
  const {user}=useAuth();
  const [cnpj,setCnpj]=useState("");const [dados,setDados]=useState<DadosCnpj|null>(null);const [nomeContato,setNomeContato]=useState("");const [telefone,setTelefone]=useState("");const [confirmado,setConfirmado]=useState(false);
  const [busy,setBusy]=useState(false);const [message,setMessage]=useState("");const [exists,setExists]=useState(false);
  useEffect(()=>{let mounted=true;if(!user)return;getDoc(doc(db,"solicitacoes_cadastro_empresas",user.uid)).then(snap=>{if(mounted&&snap.exists()){setExists(true);setMessage("Sua solicitação de cadastro já foi registrada e aguarda análise.");}}).catch(()=>{if(mounted)setMessage("Não foi possível consultar solicitações. Verifique se o Firestore foi ativado.");});return()=>{mounted=false}},[user]);
  const lookup=async()=>{setMessage("");setDados(null);setConfirmado(false);if(!validarCnpj(cnpj)){setMessage("Informe um CNPJ numérico válido com 14 dígitos.");return;}setBusy(true);try{setDados(await consultarCnpj(cnpj))}catch(error){setMessage(error instanceof Error?error.message:"Erro na consulta.")}finally{setBusy(false)}};
  const submit=async(e:FormEvent)=>{e.preventDefault();if(!user?.emailVerified||!dados||!confirmado||exists)return;setBusy(true);setMessage("");try{await setDoc(doc(db,"solicitacoes_cadastro_empresas",user.uid),{
    tipo_registro:"solicitacao_cadastro_empresa",titulo_registro:"Solicitação de cadastro — "+dados.razao_social.slice(0,140),
    uid_responsavel:user.uid, email_responsavel:user.email||"",nome_responsavel:nomeContato.trim(),
    cnpj:normalizarCnpj(dados.cnpj),razao_social:dados.razao_social.trim(),nome_fantasia:dados.nome_fantasia.trim(),
    municipio:dados.municipio,uf:dados.uf,telefone_contato:telefone.trim(),status:"aguardando_analise",criado_em:new Date().toISOString()
  });setExists(true);setMessage("Solicitação enviada. Um administrador precisa verificar o responsável antes de liberar a empresa.");}catch{setMessage("Não foi possível enviar. O Firestore pode não estar ativado ou a solicitação já existe. Não tente criar outra conta.");}finally{setBusy(false)}};
  return <section className="panel content-panel"><h2>Solicitar cadastro de empresa</h2><p className="subheading">O CNPJ preenche os dados públicos, mas não comprova que você tem autorização para representar a empresa.</p>
  <form className="stack" onSubmit={submit}>
    <label>CNPJ<input value={cnpj} onChange={e=>{setCnpj(e.target.value);setDados(null);setConfirmado(false)}} inputMode="numeric" maxLength={18} required placeholder="00.000.000/0000-00" disabled={exists}/></label>
    <button type="button" className="secondary" disabled={busy||exists} onClick={lookup}>{busy?"Consultando...":"Consultar CNPJ na BrasilAPI"}</button>
    {dados&&<div className="result-box"><strong>{dados.razao_social}</strong><p>Nome fantasia: {dados.nome_fantasia||"Não informado"}</p><p>CNPJ: {dados.cnpj} · Situação: {dados.situacao_cadastral||"Não informada"}</p><p>{dados.logradouro}, {dados.numero} — {dados.bairro}<br/>{dados.municipio}/{dados.uf} · CEP {dados.cep}</p><p className="helper">Confirme os dados antes de solicitar. A consulta é informativa e não substitui a verificação do administrador.</p></div>}
    {dados&&<><label>Nome do responsável<input required maxLength={100} value={nomeContato} onChange={e=>setNomeContato(e.target.value)} placeholder="Nome para contato"/></label><label>Telefone de contato<input required maxLength={20} value={telefone} onChange={e=>setTelefone(e.target.value)} placeholder="(44) 99999-9999"/></label><label className="check-row"><input type="checkbox" checked={confirmado} onChange={e=>setConfirmado(e.target.checked)}/> Declaro que tenho autorização para solicitar o cadastro desta empresa e aceito a análise antes da liberação.</label></>}
    {message&&<p role="status" className={exists?"form-info":"helper"}>{message}</p>}
    <button className="primary" disabled={!dados||!confirmado||busy||exists}>Enviar solicitação para análise</button>
  </form>
  </section>;
}
