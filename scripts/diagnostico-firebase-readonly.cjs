"use strict";
/**
 * Diagnóstico só de metadados. Usa APIs oficiais com verbos de leitura, sem SDK
 * externo, sem abrir documentos e sem imprimir credenciais ou identificadores.
 * Executável em main via workflow_dispatch após revisão explícita.
 */
const fs=require("node:fs");
const path=require("node:path");
const {createSign}=require("node:crypto");
const {identificarContaServico}=require("./identificar-conta-github.cjs");

const PROJECT="toaki-cf058";
const COLECOES=[
  "solicitacoes_cadastro_empresas","empresas","usuarios","clientes",
  "entregadores","planos","assinaturas","auditoria"
];
const FUNCTIONS=[
  "analisarCadastroEmpresa","operarEmpresaHomologacao","alterarRegistroEmpresaPiloto"
];
const STATUS={
  401:"sem_autenticacao",403:"sem_permissao",404:"nao_encontrado"
};
const apontar=(status)=>STATUS[status]||"indisponivel";
const report=(data)=>process.stdout.write(JSON.stringify(data,null,2)+"\n");
function jwtAssinado(cred){
  const agora=Math.floor(Date.now()/1000);
  const encode=x=>Buffer.from(JSON.stringify(x)).toString("base64url");
  const header=encode({alg:"RS256",typ:"JWT"});
  const payload=encode({
    iss:cred.client_email,
    scope:"https://www.googleapis.com/auth/datastore https://www.googleapis.com/auth/cloud-platform",
    aud:"https://oauth2.googleapis.com/token",
    iat:agora,
    exp:agora+1800
  });
  const mensagem=header+"."+payload;
  const assinador=createSign("RSA-SHA256");
  assinador.update(mensagem);
  assinador.end();
  return mensagem+"."+assinador.sign(cred.private_key).toString("base64url");
}
async function tokenSomenteLeitura(cred){
  const response=await fetch("https://oauth2.googleapis.com/token",{
    method:"POST",
    headers:{"content-type":"application/x-www-form-urlencoded"},
    body:new URLSearchParams({
      grant_type:"urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion:jwtAssinado(cred)
    }),
    signal:AbortSignal.timeout(15000)
  });
  if(!response.ok)return {status:apontar(response.status),value:""};
  const body=await response.json();
  return typeof body.access_token==="string"?
    {status:"ok",value:body.access_token}:{status:"indisponivel",value:""};
}
async function metadados(url,token,method="GET",body){
  const response=await fetch(url,{
    method,
    headers:{
      Authorization:"Bearer "+token,
      Accept:"application/json",
      ...(body?{"content-type":"application/json"}:{})
    },
    ...(body?{body:JSON.stringify(body)}:{}),
    signal:AbortSignal.timeout(15000)
  });
  return response.ok?{status:"ok",body:await response.json()}:
    {status:apontar(response.status),body:null};
}
async function main(){
  const arquivo=process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if(!arquivo||!path.isAbsolute(arquivo))throw Error("Credencial não configurada.");
  const cred=JSON.parse(fs.readFileSync(arquivo,"utf8"));
  if(cred.project_id!==PROJECT||cred.type!=="service_account"||
    typeof cred.private_key!=="string"||typeof cred.client_email!=="string")
    throw Error("Credencial de projeto diferente ou formato inválido.");
  const resultado={
    projeto:PROJECT,somenteMetadados:true,
    // Apenas categoria conhecida da identidade usada pelo GitHub Actions; nunca email ou chave.
    contaGitHubActions:identificarContaServico(cred.client_email),
    firestore:{status:"nao_verificado"},functions:{status:"nao_verificado"},
    regrasFirestore:{status:"nao_verificado"}
  };
  const token=await tokenSomenteLeitura(cred);
  if(token.status!=="ok"){
    resultado.firestore={status:token.status};
    resultado.functions={status:token.status};
    resultado.regrasFirestore={status:token.status};
    report(resultado);return;
  }
  try{
    // listCollectionIds é endpoint de LEITURA de metadados, apesar do verbo POST.
    // Não retorna documentos, dados de clientes ou IDs de usuários.
    const response=await metadados(
      "https://firestore.googleapis.com/v1/projects/"+PROJECT+
      "/databases/(default)/documents:listCollectionIds",
      token.value,"POST",{pageSize:100}
    );
    if(response.status==="ok"){
      const encontradas=new Set(response.body.collectionIds||[]);
      resultado.firestore={status:"ok",
        colecoes:Object.fromEntries(COLECOES.map(nome=>[nome,encontradas.has(nome)])),
        paginacaoIncompleta:!!response.body.nextPageToken};
    }else resultado.firestore={status:response.status};
  }catch{resultado.firestore={status:"indisponivel"};}
  try{
    const response=await metadados(
      "https://cloudfunctions.googleapis.com/v2/projects/"+PROJECT+
      "/locations/southamerica-east1/functions?pageSize=100",token.value
    );
    if(response.status==="ok"){
      const encontradas=new Set((response.body.functions||[])
        .map(f=>String(f.name||"").split("/").pop()));
      resultado.functions={status:"ok",
        funcoes:Object.fromEntries(FUNCTIONS.map(nome=>[nome,encontradas.has(nome)])),
        paginacaoIncompleta:!!response.body.nextPageToken};
    }else resultado.functions={status:response.status};
  }catch{resultado.functions={status:"indisponivel"};}
  // As regras remotas são consultadas APENAS em memória; nunca são exibidas em logs.
  // Nenhum Release ou Ruleset é criado/atualizado neste diagnóstico.
  try{
    const rel=await metadados(
      "https://firebaserules.googleapis.com/v1/projects/"+PROJECT+
      "/releases/cloud.firestore",token.value);
    if(rel.status!=="ok"){
      resultado.regrasFirestore={status:rel.status};
    }else{
      const nome=rel.body?.rulesetName;
      if(typeof nome!=="string"||!/^projects\/toaki-cf058\/rulesets\/[A-Za-z0-9_-]+$/.test(nome)){
        resultado.regrasFirestore={status:"indisponivel"};
      }else{
        const ruleset=await metadados("https://firebaserules.googleapis.com/v1/"+nome,token.value);
        if(ruleset.status!=="ok"){
          resultado.regrasFirestore={status:ruleset.status};
        }else{
          const arquivos=ruleset.body?.source?.files;
          const conteudos=Array.isArray(arquivos)?arquivos
            .filter(x=>typeof x?.content==="string").map(x=>x.content):[];
          const regrasLocais=fs.readFileSync(path.resolve(__dirname,"../firestore.rules"),"utf8");
          resultado.regrasFirestore={
            status:"ok",
            igualAoRepositorio:conteudos.some(c=>c.trim().replace(/\r\n/g,"\n")===regrasLocais.trim().replace(/\r\n/g,"\n")),
            possuiExcecaoSoma:conteudos.some(c=>c.includes("toaki_sandbox_tester")&&c.includes("empresa_teste_soma")),
            // O acesso ao backend não fica liberado por este booleano.
            necessitaRevisaoAntesDeploy:true
          };
        }
      }
    }
  }catch{resultado.regrasFirestore={status:"indisponivel"};}
  report(resultado);
}
main().catch(()=>{
  // Não imprimir exceções, arquivos, endpoints privados ou stack traces.
  process.stderr.write("Diagnóstico indisponível: configuração inválida ou credencial ausente.\n");
  process.exitCode=1;
});
