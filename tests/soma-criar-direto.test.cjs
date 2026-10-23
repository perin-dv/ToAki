"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const {readFileSync}=require("node:fs");

const yml=readFileSync(".github/workflows/soma-criar-empresa-teste.yml","utf8");
const script=readFileSync("scripts/preparar-soma-testes.cjs","utf8");

test("um workflow separado e explícito cria Soma sem depender do seletor verificar",()=>{
 assert.match(yml,/name: CRIAR SOMA TESTE - provisionamento manual/);
 assert.match(yml,/workflow_dispatch:/);
 assert.doesNotMatch(yml,/^    inputs:/m);
 assert.match(yml,/node scripts\/preparar-soma-testes\.cjs provisionar/);
 assert.match(yml,/TOAKI_CONFIRMACAO: PROVISIONAR_SOMA_TESTE/);
 assert.match(script,/process\.env\.TOAKI_CONFIRMACAO===AUTORIZACAO/);
});
test("somente o proprietário na main executa e segredo nunca alcança código de PR",()=>{
 assert.match(yml,/github\.actor == github\.repository_owner/);
 assert.match(yml,/github\.ref == 'refs\/heads\/main'/);
 assert.match(yml,/persist-credentials: false/);
 assert.match(yml,/secrets\.FIREBASE_SERVICE_ACCOUNT_TOAKI_CF058/);
 assert.match(yml,/secrets\.TOAKI_EMAIL_PROPRIETARIO_SOMA/);
 assert.doesNotMatch(yml,/^  (push|pull_request|pull_request_target|schedule):/m);
 assert.doesNotMatch(yml,/firebase deploy|hosting:channel:deploy|--only firestore|setCustomUserClaims.*admin_toaki/);
 assert.match(yml,/trap 'rm -f "\$CRED"' EXIT/);
});
test("script provisiona somente tenant de teste e não usa CNPJ ou bypass de identificação",()=>{
 assert.match(script,/EMPRESA_TESTE_SOMA/);
 assert.match(script,/tipo_registro:"empresa_teste",modo_teste:true,cnpj:null/);
 assert.match(script,/usuario\.disabled/);
 assert.match(script,/toaki_sandbox_tester:true/);
 assert.match(script,/garantir\(!antigas\.empresa_id\|\|antigas\.empresa_id===EMPRESA_TESTE_SOMA/);
 assert.doesNotMatch(script,/emailVerified\s*=\s*true|admin_toaki/);
});
