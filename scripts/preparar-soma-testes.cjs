"use strict";
/**
 * Provê EXCLUSIVAMENTE sandbox Soma para testes sem CNPJ.
 * Executar SOMENTE por workflow manual após revisão da conta e das permissões.
 * Nenhuma ação é executada na importação deste arquivo.
 */
const fs=require("node:fs");
const path=require("node:path");
const {createRequire}=require("node:module");
const {EMPRESA_TESTE_SOMA}=require("../functions/empresa-identidade.cjs");
const requireFunctions=createRequire(path.resolve(__dirname,"../functions/package.json"));

const PROJETO="toaki-cf058";
const EMAIL_PROPRIETARIO=process.env.TOAKI_EMAIL_PROPRIETARIO;
// Endereço da conta nunca fica no código versionado ou nos logs do GitHub.
const AUTORIZACAO="PROVISIONAR_SOMA_TESTE";
const MODOS=["verificar","provisionar"];

function garantir(condicao,mensagem){
  if(!condicao)throw Error(mensagem);
}
async function main(){
  const modo=process.argv[2]||"verificar";
  garantir(MODOS.includes(modo),"Modo indisponível.");
  const arquivo=process.env.GOOGLE_APPLICATION_CREDENTIALS;
  garantir(arquivo&&path.isAbsolute(arquivo),"Credencial não configurada.");
  const chave=JSON.parse(fs.readFileSync(arquivo,"utf8"));
  garantir(chave.project_id===PROJETO&&chave.type==="service_account","Projeto ou credencial divergente.");
  if(modo==="provisionar")garantir(process.env.TOAKI_CONFIRMACAO===AUTORIZACAO,"Provisionamento não autorizado.");
  const {initializeApp,applicationDefault}=requireFunctions("firebase-admin/app");
  const {getAuth}=requireFunctions("firebase-admin/auth");
  const {getFirestore,FieldValue}=requireFunctions("firebase-admin/firestore");
  const app=initializeApp({credential:applicationDefault(),projectId:PROJETO},"provisionar-soma-testes");
  const auth=getAuth(app);
  const db=getFirestore(app);
  garantir(typeof EMAIL_PROPRIETARIO==="string"&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(EMAIL_PROPRIETARIO),"Conta precisa ser definida por secret privado.");
  const usuario=await auth.getUserByEmail(EMAIL_PROPRIETARIO);
  garantir(!usuario.disabled,"Conta existente está desabilitada.");
  garantir(usuario.emailVerified===true,"A conta existente precisa confirmar o e-mail.");
  const antigas=usuario.customClaims||{};
  garantir(!antigas.role||["cliente","dono_empresa"].includes(antigas.role),"Conta tem privilégio incompatível.");
  garantir(!antigas.empresa_id||antigas.empresa_id===EMPRESA_TESTE_SOMA,"Conta já vinculada a outra empresa.");
  const empresaRef=db.doc("empresas/"+EMPRESA_TESTE_SOMA);
  const membroRef=empresaRef.collection("funcionarios").doc(usuario.uid);
  const empresa=await empresaRef.get();
  const membro=await membroRef.get();
  if(empresa.exists){
    const dados=empresa.data();
    garantir(dados.tipo_registro==="empresa_teste"&&dados.modo_teste===true&&dados.cnpj===null&&
      dados.responsavel_uid===usuario.uid&&dados.ambiente==="piloto",
      "O identificador de testes já existe com dados incompatíveis. Nenhuma alteração permitida.");
  }
  if(membro.exists)garantir(
    membro.data().papel==="dono_empresa"&&membro.data().ativo===true,
    "Associação preexistente incompatível com o sandbox.");
  if(modo==="verificar"){
    process.stdout.write(JSON.stringify({projeto:PROJETO,contaEncontra:true,emailConfirmado:true,
      sandboxExiste:empresa.exists,vinculoExiste:membro.exists,modo:"somente_leitura"})+"\n");
    return;
  }
  await db.runTransaction(async tx=>{
    // Revalidar no momento da escrita: nunca substituir empresa ou colaborador existente.
    const [empresaAtual,membroAtual]=await Promise.all([tx.get(empresaRef),tx.get(membroRef)]);
    if(empresaAtual.exists){
      const d=empresaAtual.data();
      garantir(d.tipo_registro==="empresa_teste"&&d.modo_teste===true&&d.cnpj===null&&
        d.responsavel_uid===usuario.uid&&d.ambiente==="piloto","Empresa encontrada com outro titular.");
    }else{
      tx.create(empresaRef,{
        tipo_registro:"empresa_teste",modo_teste:true,cnpj:null,
        titulo_registro:"Soma — Ambiente de Testes",nome_exibicao:"Soma — Testes",
        razao_social:"SOMA — EMPRESA FICTÍCIA (TESTES)",status:"ativa",
        ambiente:"piloto",responsavel_uid:usuario.uid,criado_em:FieldValue.serverTimestamp()
      });
    }
    if(membroAtual.exists){
      garantir(membroAtual.data().papel==="dono_empresa"&&membroAtual.data().ativo===true,
        "Vínculo de usuário incompatível.");
    }else{
      tx.create(membroRef,{
        tipo_registro:"funcionario_empresa",titulo_registro:"Responsável — Conta de Testes",
        nome_exibicao:"Responsável de testes",papel:"dono_empresa",ativo:true,
        ambiente:"piloto_teste",criado_em:FieldValue.serverTimestamp()
      });
    }
  });
  // Claims emitidas apenas para conta existente verificada, após criar vínculo verificável.
  await auth.setCustomUserClaims(usuario.uid,{
    ...antigas,role:"dono_empresa",empresa_id:EMPRESA_TESTE_SOMA
  });
  process.stdout.write(JSON.stringify({projeto:PROJETO,sandbox:"Soma — Testes",
    modo:"provisionamento_confirmado",semCnpj:true,contaAssociada:true})+"\n");
}
main().catch(error=>{
  // Os logs não contêm emails/UIDs, credenciais nem documentos do Firestore.
  const tipo=error?.code==="auth/user-not-found"?"conta_nao_encontrada":
    String(error?.code||"").includes("permission")||Number(error?.code)===7?"sem_permissao":"requisito_nao_atendido";
  process.stderr.write(JSON.stringify({status:"bloqueado",motivo:tipo})+"\n");
  process.exitCode=1;
});
