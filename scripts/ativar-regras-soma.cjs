"use strict";
/**
 * Firebase Rules: modifica exclusivamente a exigência de e-mail verificado da
 * função funcionario(empresaId), SOMENTE para o tenant fictício Soma.
 * Preserva a versão REMOTA atual, jamais substitui pelo firestore.rules local.
 * Por padrão, DRY-RUN. Ativação exige confirmação literal pelo workflow manual.
 */
const fs=require("node:fs");
const path=require("node:path");
const crypto=require("node:crypto");
const {createRequire}=require("node:module");
const fromFunctions=createRequire(path.resolve(__dirname,"../functions/package.json"));
const PROJECT="toaki-cf058";
const REL="projects/"+PROJECT+"/releases/cloud.firestore";
const PREFIX="https://firebaserules.googleapis.com/v1/";
const ATIVACAO="ATIVAR_SOMA_FASE_B";
const sha=x=>crypto.createHash("sha256").update(x).digest("hex");

function inserirExcecaoSoma(original){
  if(typeof original!=="string"||!original.includes("rules_version = '2'")||
      !original.includes("service cloud.firestore"))throw Error("ruleset_inesperado");
  const assinatura=/function\s+funcionario\s*\(\s*empresaId\s*\)\s*\{/g;
  const matches=[...original.matchAll(assinatura)];
  if(matches.length!==1)throw Error("funcionario_ambigua_ou_ausente");
  const inicio=matches[0].index+matches[0][0].length;
  let profundidade=1, fim=inicio;
  for(;fim<original.length;fim++){
    const ch=original[fim];
    if(ch==="{")profundidade++;
    if(ch==="}"&&--profundidade===0)break;
    if(ch==="}"&&profundidade<0)throw Error("ruleset_malformado");
  }
  if(profundidade!==0)throw Error("ruleset_malformado");
  const corpo=original.slice(inicio,fim);
  const excecao="return (verificado() || (request.auth != null"+
    " && empresaId == 'empresa_teste_soma'"+
    " && request.auth.token.toaki_sandbox_tester == true"+
    " && request.auth.token.empresa_id == empresaId))";
  if(corpo.includes("toaki_sandbox_tester")){
    const restaurado=corpo.replace(excecao,"return verificado()");
    if(restaurado===corpo || corpo.split(excecao).length!==2 ||
       !restaurado.includes("exists(")||!restaurado.includes("get(")||
       !restaurado.includes("ativo == true"))
      throw Error("excecao_existente_inesperada");
    return {alterou:false,texto:original};
  }
  const verificacao=/return\s+verificado\(\)/g;
  if([...corpo.matchAll(verificacao)].length!==1 ||
    !corpo.includes("exists(")||!corpo.includes("get(")||
    !corpo.includes("ativo == true"))throw Error("funcionario_regra_incompativel");
  const atualizado=corpo.replace(verificacao,excecao);
  const novo=original.slice(0,inicio)+atualizado+original.slice(fim);
  if(novo===original || novo.slice(0,inicio)!==original.slice(0,inicio)||
    novo.slice(inicio+atualizado.length)!==original.slice(fim))
    throw Error("alteracao_fora_do_escopo");
  return {alterou:true,texto:novo};
}

function selecionarArquivo(ruleset){
  const arquivos=ruleset?.source?.files;
  if(!Array.isArray(arquivos)||arquivos.length!==1||
     typeof arquivos[0].content!=="string"||
     typeof arquivos[0].name!=="string")
    throw Error("ruleset_multiarquivo_ou_invalido");
  return arquivos[0];
}

async function main(){
  const modo=process.argv[2]||"preparar";
  if(!["preparar","ativar"].includes(modo))throw Error("modo_invalido");
  if(modo==="ativar"&&process.env.TOAKI_CONFIRMAR_ATIVACAO!==ATIVACAO)
    throw Error("ativacao_sem_confirmacao");
  const file=process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if(!file||!path.isAbsolute(file))throw Error("credencial_ausente");
  const cred=JSON.parse(fs.readFileSync(file,"utf8"));
  if(cred.type!=="service_account"||cred.project_id!==PROJECT)
    throw Error("projeto_incorreto");
  const {applicationDefault}=fromFunctions("firebase-admin/app");
  const access=await applicationDefault().getAccessToken();
  if(typeof access.access_token!=="string")throw Error("token_ausente");
  async function req(rota,method="GET",body){
    const r=await fetch(PREFIX+rota,{
      method,headers:{
        Authorization:"Bearer "+access.access_token,
        Accept:"application/json",
        ...(body?{"content-type":"application/json"}:{})
      },
      ...(body?{body:JSON.stringify(body)}:{}),
      signal:AbortSignal.timeout(20000)
    });
    if(!r.ok){
      if(r.status===403)throw Error("firebase_rules_sem_permissao");
      if(r.status===404)throw Error("firebase_rules_nao_encontradas");
      throw Error("firebase_rules_http_"+r.status);
    }
    return r.json();
  }
  const release=await req(REL);
  if(typeof release.rulesetName!=="string"||
     !release.rulesetName.startsWith("projects/"+PROJECT+"/rulesets/"))
     throw Error("ruleset_remoto_invalido");
  const rules=await req(release.rulesetName);
  const arquivo=selecionarArquivo(rules);
  const patch=inserirExcecaoSoma(arquivo.content);
  // A versão remota continua disponível como Ruleset imutável no próprio Firebase.
  process.stdout.write(JSON.stringify({
    projeto:PROJECT,modo,origem:release.rulesetName,
    hashOriginal:sha(arquivo.content),hashPreparado:sha(patch.texto),
    patchMinimo:patch.alterou,escopo:"funcionario(empresa_teste_soma)"
  })+"\n");
  if(modo==="preparar"){
    const destino=process.env.TOAKI_RULES_DESTINO;
    if(destino){
      if(!path.isAbsolute(destino)||!destino.startsWith("/tmp/")&&!destino.startsWith("/home/runner/work/_temp/"))
        throw Error("destino_rules_invalido");
      fs.writeFileSync(destino,patch.texto,{encoding:"utf8",mode:0o600});
      process.stdout.write('{"resultado":"rules_remotas_preparadas_para_emulador"}\\n');
    }
    return;
  }
  if(!patch.alterou){process.stdout.write('{"resultado":"excecao_existente_sem_escrita"}\n');return;}
  // Checagem tardia contra mudanças simultâneas de release. Sem isso, abortar.
  const atual=await req(REL);
  if(atual.rulesetName!==release.rulesetName)
    throw Error("ruleset_alterado_por_outro_operador");
  const criado=await req("projects/"+PROJECT+"/rulesets","POST",{
    source:{files:[{name:arquivo.name,content:patch.texto}]}
  });
  if(typeof criado.name!=="string"||
    !criado.name.startsWith("projects/"+PROJECT+"/rulesets/"))
    throw Error("ruleset_novo_invalido");
  const imediatamenteAntes=await req(REL);
  if(imediatamenteAntes.rulesetName!==release.rulesetName)
    throw Error("ruleset_alterado_por_outro_operador");
  await req(REL,"PATCH",{
    release:{name:REL,rulesetName:criado.name},
    updateMask:"rulesetName"
  });
  const publicado=await req(REL);
  if(publicado.rulesetName!==criado.name)
    throw Error("publicacao_nao_confirmada");
  process.stdout.write(JSON.stringify({
    resultado:"regras_soma_publicadas",projeto:PROJECT,
    rulesetAnterior:release.rulesetName,rulesetAtual:criado.name,
    somenteExcecaoSandbox:true
  })+"\n");
}
if(require.main===module){
  main().catch(e=>{
    // Nenhum conteúdo remoto de regras, conta, segredo ou stack nos logs.
    const code=String(e?.message||"falha_desconhecida");
    const seguro=/^[a-z_0-9]+$/.test(code)?code:"falha_nao_classificada";
    process.stderr.write(JSON.stringify({status:"bloqueado",motivo:seguro})+"\n");
    process.exitCode=1;
  });
}
module.exports={inserirExcecaoSoma,selecionarArquivo};
