"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const {spawnSync}=require("node:child_process");
const {EMPRESA_TESTE_SOMA,identificadorEmpresaValido}=require("../functions/empresa-identidade.cjs");
const {validarOperacao,validarAlteracao}=require("../functions/operacao-politica.cjs");
const {autorizarDestinoOperacional,autorizarAprovacaoEmpresa}=require("../functions/ambiente-operacao.cjs");
const cred={projeto:"toaki-cf058",empresaId:EMPRESA_TESTE_SOMA,habilitacao:"habilitado",empresasPermitidas:EMPRESA_TESTE_SOMA};
const sandbox={status:"ativa",ambiente:"piloto",tipo_registro:"empresa_teste",modo_teste:true,cnpj:null};
test("empresa fictícia Soma não usa CNPJ e não aceita outras IDs arbitrárias",()=>{
 assert.equal(EMPRESA_TESTE_SOMA,"empresa_teste_soma");
 assert.equal(identificadorEmpresaValido(EMPRESA_TESTE_SOMA),true);
 assert.equal(identificadorEmpresaValido("empresa_11222333000181"),true);
 for(const id of ["soma","empresa_de_outro","empresa_teste_terceiros","empresas/teste","empresa_teste_soma/funcionarios",null]){
  assert.equal(identificadorEmpresaValido(id),false);
 }
});
test("apenas empresa fictícia marcada e pré-autorizada no backend pode operar",()=>{
 assert.equal(autorizarDestinoOperacional({...cred,empresa:sandbox}),"piloto_teste");
 assert.throws(()=>autorizarDestinoOperacional({...cred,empresa:sandbox,empresasPermitidas:""}),/lista explícita/);
 assert.throws(()=>autorizarDestinoOperacional({...cred,empresa:sandbox,habilitacao:""}),/não autorizada/);
 assert.throws(()=>autorizarDestinoOperacional({...cred,empresa:sandbox,projeto:"outro-projeto"}),/não autorizada/);
 assert.throws(()=>autorizarDestinoOperacional({...cred,empresa:{...sandbox,modo_teste:false}}),/sandbox autorizado/);
 assert.throws(()=>autorizarDestinoOperacional({...cred,empresa:{...sandbox,cnpj:"11222333000181"}}),/sandbox autorizado/);
 assert.throws(()=>autorizarDestinoOperacional({...cred,empresa:{...sandbox,ambiente:"producao"}}),/sandbox autorizado/);
 assert.throws(()=>autorizarDestinoOperacional({...cred,empresa:{...sandbox,status:"suspensa"}}),/sandbox autorizado/);
 assert.throws(()=>autorizarDestinoOperacional({...cred,empresa:null}),/sandbox autorizado/);
});
test("empresa de teste NÃO entra no fluxo de aprovação de CNPJ real",()=>{
 assert.throws(()=>autorizarAprovacaoEmpresa(cred),/Identificador de empresa não autorizado/);
});
test("cadastros e status validam sandbox, mantendo campos e referências controlados",()=>{
 const base={empresaId:EMPRESA_TESTE_SOMA,tipo:"veiculo",dados:{placa:"ABC1D23",categoria:"Moto"}};
 assert.equal(validarOperacao(base).empresaId,EMPRESA_TESTE_SOMA);
 assert.equal(validarAlteracao({...base,registroId:"moto123",acao:"atualizar"}).empresaId,EMPRESA_TESTE_SOMA);
 assert.throws(()=>validarOperacao({...base,dados:{...base.dados,role:"admin_toaki"}}),/não autorizado/);
 assert.throws(()=>validarAlteracao({...base,registroId:"moto123",acao:"atualizar",acesso_admin:true}),/não autorizado/);
});
test("workflow de provisionamento manual não expõe email nem roda em PR",()=>{
 const yaml=fs.readFileSync(".github/workflows/firebase-soma-sandbox.yml","utf8");
 const script=fs.readFileSync("scripts/preparar-soma-testes.cjs","utf8");
 assert.match(yaml,/workflow_dispatch:/);
 assert.match(yaml,/github.ref == 'refs\/heads\/main'/);
 assert.match(yaml,/TOAKI_EMAIL_PROPRIETARIO_SOMA/);
 assert.match(yaml,/PROVISIONAR_SOMA_TESTE/);
 assert.doesNotMatch(yaml,/^\s+(pull_request|pull_request_target|push):/m);
 assert.doesNotMatch(yaml,/firebase deploy|hosting:channel:deploy|firebase-tools deploy/);
 assert.doesNotMatch(script,/hotmail\.com|gmail\.com|@outlook/);
 assert.match(script,/process\.env\.TOAKI_CONFIRMACAO===AUTORIZACAO/);
 assert.match(script,/getUserByEmail\(EMAIL_PROPRIETARIO\)/);
 assert.match(script,/!usuario\.disabled/);
 assert.match(script,/usuario\.emailVerified===true/);
 assert.match(script,/empresa\.cnpj|cnpj:null/);
 assert.match(script,/modo==="verificar"/);
});
test("sem credenciais o provisionador sai sem escrita",()=>{
 const env={...process.env};delete env.GOOGLE_APPLICATION_CREDENTIALS;delete env.TOAKI_CONFIRMACAO;
 const cmd=spawnSync(process.execPath,["scripts/preparar-soma-testes.cjs","provisionar"],{env,encoding:"utf8",timeout:5000});
 assert.equal(cmd.status,1);
 assert.equal(cmd.stdout,"");
 assert.match(cmd.stderr,/"status":"bloqueado"/);
});
test("interface mostra estado de testes claramente e não aceita empresa arbitrária",()=>{
 const data=fs.readFileSync("src/lib/empresaId.ts","utf8");
 const site=fs.readFileSync("src/pages/SiteOperacionalPage.tsx","utf8");
 assert.match(data,/empresa_teste_soma/);
 assert.match(data,/\^empresa_\[0-9\]\{14\}\$/);
 assert.match(site,/Soma — Ambiente de Testes/);
 assert.match(site,/não possui CNPJ/);
});

test("falhas de verificação indicam motivo sanitizado sem imprimir a conta ou stack",()=>{
 const workflow=fs.readFileSync(".github/workflows/firebase-soma-sandbox.yml","utf8");
 const script=fs.readFileSync("scripts/preparar-soma-testes.cjs","utf8");
 assert.match(workflow,/Secret TOAKI_EMAIL_PROPRIETARIO_SOMA ausente/);
 for(const motivo of [
  "secret_email_soma_ausente_ou_invalido","conta_nao_encontrada","email_nao_verificado",
  "sem_permissao_firebase","conta_ja_vinculada_outra_empresa","credencial_projeto_incorreto"
 ])assert.ok(script.includes(motivo),"diagnóstico ausente: "+motivo);
 assert.match(script,/codigoSeguroDoErro\(error\)/);
 assert.doesNotMatch(script,/console\.error\(error\)|JSON\.stringify\(error\)|error\.stack/);
 const env={...process.env,GOOGLE_APPLICATION_CREDENTIALS:""};
 delete env.TOAKI_EMAIL_PROPRIETARIO;
 const r=spawnSync(process.execPath,["scripts/preparar-soma-testes.cjs","verificar"],{env,encoding:"utf8",timeout:5000});
 assert.equal(r.status,1);
 assert.match(r.stderr,/"motivo":"credencial_ausente"/);
 assert.doesNotMatch(r.stderr,/@|hotmail|gmail|private_key|at Object/);
});
