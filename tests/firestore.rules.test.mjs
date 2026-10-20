import { readFileSync } from "node:fs";
import { after, beforeEach, test } from "node:test";
import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { collection, deleteDoc, doc, getDoc, getDocs, limit, query, setDoc, updateDoc } from "firebase/firestore";

const env = await initializeTestEnvironment({
  projectId: "demo-toaki-rules",
  firestore: {
    host: "127.0.0.1",
    port: 8080,
    rules: readFileSync(new URL("../firestore.rules", import.meta.url), "utf8")
  }
});
after(async()=>{await env.cleanup()});
beforeEach(async()=>{await env.clearFirestore()});

const dono=()=>env.authenticatedContext("uid-dono",{
  email:"dono@exemplo.com",
  email_verified:true
}).firestore();
const outro=()=>env.authenticatedContext("uid-outra-pessoa",{
  email:"outra@exemplo.com",
  email_verified:true
}).firestore();
const admin=()=>env.authenticatedContext("uid-admin",{
  email:"admin@toaki.test",
  email_verified:true,
  role:"admin_toaki"
}).firestore();
const naoVerificado=()=>env.authenticatedContext("uid-dono",{
  email:"dono@exemplo.com",
  email_verified:false
}).firestore();
const anon=()=>env.unauthenticatedContext().firestore();

const caminho="solicitacoes_cadastro_empresas";
const solicitacao={
  tipo_registro:"solicitacao_cadastro_empresa",
  titulo_registro:"Solicitação de cadastro — Soma Distribuidora",
  uid_responsavel:"uid-dono",
  email_responsavel:"dono@exemplo.com",
  nome_responsavel:"João da Silva",
  cnpj:"11222333000181",
  razao_social:"Soma Distribuidora LTDA",
  nome_fantasia:"Soma",
  municipio:"Maringá",
  uf:"PR",
  telefone_contato:"44999999999",
  status:"aguardando_analise",
  criado_em:"2026-10-20T15:00:00.000Z"
};

test("solicitação: somente dono verificado pode criar a própria solicitação",async()=>{
  await assertSucceeds(setDoc(doc(dono(),caminho,"uid-dono"),solicitacao));
  await assertSucceeds(getDoc(doc(dono(),caminho,"uid-dono")));
  await assertFails(setDoc(doc(outro(),caminho,"uid-dono"),solicitacao));
  await assertFails(getDoc(doc(naoVerificado(),caminho,"uid-dono")));
});

test("solicitação: usuário não acessa a de outro, admin pode consultar",async()=>{
  await env.withSecurityRulesDisabled(async c=>setDoc(doc(c.firestore(),caminho,"uid-dono"),solicitacao));
  await assertFails(getDoc(doc(outro(),caminho,"uid-dono")));
  await assertFails(getDocs(collection(dono(),caminho)));
  await assertSucceeds(getDoc(doc(admin(),caminho,"uid-dono")));
  const docs=await assertSucceeds(getDocs(query(collection(admin(),caminho),limit(50))));
  if(docs.size!==1)throw Error("Admin deveria ver exatamente uma solicitação");
});

test("solicitação: rejeitar campos indevidos, mudança de status e alterações",async()=>{
  await assertFails(setDoc(doc(dono(),caminho,"uid-dono"),{...solicitacao,status:"aprovada"}));
  await assertFails(setDoc(doc(dono(),caminho,"uid-dono"),{...solicitacao,role:"admin_toaki"}));
  await assertFails(setDoc(doc(dono(),caminho,"uid-dono"),{...solicitacao,cnpj:"111"}));
  await assertFails(setDoc(doc(anon(),caminho,"uid-dono"),solicitacao));
  await env.withSecurityRulesDisabled(async c=>setDoc(doc(c.firestore(),caminho,"uid-dono"),solicitacao));
  await assertFails(updateDoc(doc(dono(),caminho,"uid-dono"),{status:"aprovada"}));
  await assertFails(deleteDoc(doc(dono(),caminho,"uid-dono")));
  await assertFails(updateDoc(doc(admin(),caminho,"uid-dono"),{status:"aprovada"}));
});

test("isolar entregas e funcionários entre empresas",async()=>{
  await env.withSecurityRulesDisabled(async c=>{
    const db=c.firestore();
    await setDoc(doc(db,"empresas","empresa_soma"),{nome_exibicao:"Soma Distribuidora"});
    await setDoc(doc(db,"empresas","empresa_outra"),{nome_exibicao:"Outra loja"});
    await setDoc(doc(db,"empresas","empresa_soma","funcionarios","uid-dono"),{ativo:true,papel:"vendedor",nome_exibicao:"João"});
    await setDoc(doc(db,"empresas","empresa_soma","entregas","entrega_nf_001"),{titulo_registro:"Entrega NF 001"});
    await setDoc(doc(db,"empresas","empresa_outra","entregas","entrega_nf_999"),{titulo_registro:"Entrega NF 999"});
  });
  await assertSucceeds(getDoc(doc(dono(),"empresas","empresa_soma")));
  await assertSucceeds(getDoc(doc(dono(),"empresas","empresa_soma","entregas","entrega_nf_001")));
  await assertFails(getDoc(doc(dono(),"empresas","empresa_outra")));
  await assertFails(getDoc(doc(dono(),"empresas","empresa_outra","entregas","entrega_nf_999")));
  await assertFails(setDoc(doc(dono(),"empresas","empresa_soma","entregas","entrega_nf_002"),{status:"entregue"}));
});

test("cliente lê somente a própria entrega previamente vinculada",async()=>{
  await env.withSecurityRulesDisabled(async c=>{
    const db=c.firestore();
    await setDoc(doc(db,"clientes","uid-dono","entregas","entrega_nf_001"),{titulo_registro:"Entrega NF 001"});
    await setDoc(doc(db,"clientes","uid-outra-pessoa","entregas","entrega_nf_002"),{titulo_registro:"Entrega NF 002"});
  });
  await assertSucceeds(getDoc(doc(dono(),"clientes","uid-dono","entregas","entrega_nf_001")));
  await assertFails(getDoc(doc(dono(),"clientes","uid-outra-pessoa","entregas","entrega_nf_002")));
  await assertFails(setDoc(doc(dono(),"clientes","uid-dono","entregas","entrega_nf_003"),{titulo_registro:"Entrega fictícia"}));
});

test("dados desconhecidos são bloqueados por padrão",async()=>{
  await assertFails(getDoc(doc(anon(),"empresas","empresa_soma")));
  await assertFails(getDoc(doc(dono(),"dados_privados","qualquer")));
  await assertFails(setDoc(doc(admin(),"auditoria","evento_forjado"),{status:"inventado"}));
});
