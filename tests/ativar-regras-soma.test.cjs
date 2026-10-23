"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const {spawnSync}=require("node:child_process");
const {inserirExcecaoSoma,selecionarArquivo}=require("../scripts/ativar-regras-soma.cjs");

const remota=[
"rules_version = '2';",
"service cloud.firestore {",
" match /databases/{database}/documents {",
"  function verificado() { return request.auth != null && request.auth.token.email_verified == true; }",
"  function proprietario(uid) {return verificado() && request.auth.uid == uid;}",
"  function adminToaki() {return verificado() && request.auth.token.role == 'admin_toaki';}",
"  function funcionarioPath(empresaId) {return /databases/$(database)/documents/empresas/$(empresaId)/funcionarios/$(request.auth.uid);}",
"  function funcionario(empresaId) {",
"   return verificado() && exists(funcionarioPath(empresaId))",
"     && get(funcionarioPath(empresaId)).data.ativo == true;",
"  }",
"  match /empresas/{empresaId} { allow read: if funcionario(empresaId); allow write: if false; }",
"  match /{document=**} {allow read, write: if false;}",
" }",
"}"
].join("\n");

test("altera somente funcionario mantendo todas as demais regras byte a byte",()=>{
 const ret=inserirExcecaoSoma(remota);
 assert.equal(ret.alterou,true);
 assert.equal(ret.texto.includes("request.auth.token.toaki_sandbox_tester == true"),true);
 assert.equal(ret.texto.includes("request.auth.token.empresa_id == empresaId"),true);
 assert.equal(ret.texto.includes("empresaId == 'empresa_teste_soma'"),true);
 assert.equal(ret.texto.includes("exists(funcionarioPath(empresaId))"),true);
 assert.equal(ret.texto.includes("allow write: if false;"),true);
 const subt=ret.texto.replace(
  "return (verificado() || (request.auth != null && empresaId == 'empresa_teste_soma' && request.auth.token.toaki_sandbox_tester == true && request.auth.token.empresa_id == empresaId))",
  "return verificado()");
 assert.equal(subt,remota);
 assert.deepEqual(inserirExcecaoSoma(ret.texto),{alterou:false,texto:ret.texto});
});
test("não altera estrutura remota desconhecida, ID arbitrário ou múltiplos arquivos",()=>{
 assert.throws(()=>inserirExcecaoSoma(remota.replace("return verificado() && exists","return true && exists")),/incompativel/);
 assert.throws(()=>inserirExcecaoSoma(remota.replace("ativo == true","ativo == false")),/incompativel/);
 assert.throws(()=>inserirExcecaoSoma(remota.replace("function funcionario(empresaId)","function membro(empresaId)")),/ambigua/);
 assert.throws(()=>inserirExcecaoSoma(remota+remota.slice(remota.indexOf("  function funcionario(empresaId)"),remota.indexOf("  match /empresas"))),/ambigua/);
 assert.throws(()=>selecionarArquivo({source:{files:[]}}),/multiarquivo/);
 assert.throws(()=>selecionarArquivo({source:{files:[{name:"a",content:"x"},{name:"b",content:"y"}]}}),/multiarquivo/);
});
test("execução sem credencial ou sem autorização jamais modifica Rules",()=>{
 const env={...process.env};delete env.GOOGLE_APPLICATION_CREDENTIALS;delete env.TOAKI_CONFIRMAR_ATIVACAO;
 const check=spawnSync(process.execPath,["scripts/ativar-regras-soma.cjs","ativar"],{env,encoding:"utf8",timeout:5000});
 assert.equal(check.status,1);
 assert.equal(check.stdout,"");
 assert.match(check.stderr,/ativacao_sem_confirmacao/);
 assert.doesNotMatch(check.stderr,/stack|Error at|private_key|client_email/);
});
test("não há substituição do arquivo remoto pelo arquivo local, nem deploy hosting live",()=>{
 const f=fs.readFileSync("scripts/ativar-regras-soma.cjs","utf8");
 assert.match(f,/selecionarArquivo\(rules\)/);
 assert.match(f,/const patch=inserirExcecaoSoma\(arquivo.content\)/);
 assert.match(f,/imediatamenteAntes.rulesetName!==release.rulesetName/);
 assert.match(f,/rulesetAnterior:release.rulesetName/);
 assert.doesNotMatch(f,/readFileSync\(["']firestore.rules["']/);
 assert.doesNotMatch(f,/firebase deploy|hosting:live/);
});

test("workflow só roda manualmente na main e nunca altera Hosting live",()=>{
 const yaml=fs.readFileSync(".github/workflows/firebase-ativar-fase-b-soma.yml","utf8");
 assert.match(yaml,/workflow_dispatch:/);
 assert.match(yaml,/github\.ref == 'refs\/heads\/main'/);
 assert.match(yaml,/github\.actor == github\.repository_owner/);
 assert.match(yaml,/secrets\.FIREBASE_SERVICE_ACCOUNT_TOAKI_CF058/);
 assert.match(yaml,/persist-credentials: false/);
 assert.doesNotMatch(yaml,/^  (push|pull_request|pull_request_target|schedule):/m);
 assert.match(yaml,/functions:operarEmpresaHomologacao,functions:alterarRegistroEmpresaPiloto/);
 assert.match(yaml,/TOAKI_PILOTO_EMPRESAS=empresa_teste_soma/);
 assert.match(yaml,/npm run test:security/);
 assert.match(yaml,/node scripts\/ativar-regras-soma\.cjs preparar/);
 assert.match(yaml,/node scripts\/ativar-regras-soma\.cjs ativar/);
 assert.match(yaml,/hosting:channel:deploy fase-b-web/);
 assert.doesNotMatch(yaml,/firebase deploy --only hosting|firebase deploy --only firestore|firebase deploy --force/);
 assert.doesNotMatch(yaml,/firebase use |hosting:channel:deploy live/);
});

test("Rules com exceção Soma diferente da aprovada nunca são aceitas automaticamente",()=>{
 const alterada=remota.replace("return verificado() && exists",
   "return verificado() || request.auth.token.toaki_sandbox_tester == true && exists");
 assert.throws(()=>inserirExcecaoSoma(alterada),/excecao_existente_inesperada/);
});
