"use strict";
/**
 * Diagnóstico de metadados Firebase, sem gravações e sem acessar conteúdo de documentos.
 * Executar somente via workflow_dispatch de branch principal revisada.
 */
const fs=require("node:fs");
const path=require("node:path");
const {createRequire}=require("node:module");

const PROJECT="toaki-cf058";
const COLECOES_PERMITIDAS=[
  "solicitacoes_cadastro_empresas","empresas","usuarios","clientes",
  "entregadores","planos","assinaturas","auditoria"
];
const FUNCOES_ESPERADAS=[
  "analisarCadastroEmpresa","operarEmpresaHomologacao","alterarRegistroEmpresaPiloto"
];
function statusErro(error){
  const raw=error?.code??error?.status;
  const code=Number(raw);
  if(code===7||code===403||raw==="PERMISSION_DENIED")return "sem_permissao";
  if(code===5||code===404)return "nao_encontrado";
  if(code===16||code===401)return "sem_autenticacao";
  return "indisponivel";
}
function imprimir(objeto){
  // Somente campos constantes e booleanos; nenhum ID de usuário, documento ou segredo.
  process.stdout.write(JSON.stringify(objeto,null,2)+"\n");
}
async function main(){
  const arquivo=process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if(!arquivo||!path.isAbsolute(arquivo))throw Error("Credencial do executor não configurada.");
  const cred=JSON.parse(fs.readFileSync(arquivo,"utf8"));
  if(cred.project_id!==PROJECT||cred.type!=="service_account")
    throw Error("Diagnóstico recusado: projeto Firebase ou tipo de credencial diferente.");
  const requireFunctions=createRequire(path.resolve(__dirname,"../functions/package.json"));
  const {initializeApp,applicationDefault}=requireFunctions("firebase-admin/app");
  const {getFirestore}=requireFunctions("firebase-admin/firestore");
  const app=initializeApp({credential:applicationDefault(),projectId:PROJECT},"toaki-diagnostico");
  const resultado={
    projeto:PROJECT,
    somenteLeitura:true,
    firestore:{status:"nao_verificado"},
    functions:{status:"nao_verificado"}
  };
  try {
    const colecoes=await getFirestore(app).listCollections();
    const encontradas=new Set(colecoes.map(c=>c.id));
    resultado.firestore={status:"ok",colecoes:Object.fromEntries(
      COLECOES_PERMITIDAS.map(nome=>[nome,encontradas.has(nome)])
    )};
    // Coleções desconhecidas ou IDs de documentos jamais são incluídos no relatório.
  }catch(error){
    resultado.firestore={status:statusErro(error)};
  }
  try {
    const credencial=app.options.credential;
    const token=await credencial.getAccessToken();
    const url="https://cloudfunctions.googleapis.com/v2/projects/"+PROJECT+
      "/locations/southamerica-east1/functions?pageSize=100";
    const resposta=await fetch(url,{
      method:"GET",
      headers:{Authorization:"Bearer "+token.access_token,Accept:"application/json"},
      signal:AbortSignal.timeout(15000)
    });
    if(resposta.status===403){
      resultado.functions={status:"sem_permissao"};
    }else if(resposta.status===401){
      resultado.functions={status:"sem_autenticacao"};
    }else if(resposta.status===404){
      resultado.functions={status:"nao_encontrado"};
    }else if(!resposta.ok){
      resultado.functions={status:"indisponivel"};
    }else{
      const body=await resposta.json();
      const nomes=new Set((body.functions||[]).map(f=>String(f.name||"").split("/").pop()));
      resultado.functions={status:"ok",funcoes:Object.fromEntries(
        FUNCOES_ESPERADAS.map(nome=>[nome,nomes.has(nome)])
      ),paginacaoIncompleta:!!body.nextPageToken};
    }
  }catch(error){
    resultado.functions={status:statusErro(error)};
  }
  imprimir(resultado);
}
main().catch(error=>{
  // Não imprimir stack trace com potenciais caminhos de credenciais.
  process.stderr.write("Diagnóstico bloqueado: configuração local inválida ou falha de execução.\n");
  process.exitCode=1;
});
