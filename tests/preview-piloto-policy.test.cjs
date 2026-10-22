"use strict";
const {readFileSync}=require("node:fs");
const {test}=require("node:test");
const assert=require("node:assert/strict");
const workflow=readFileSync(".github/workflows/firebase-preview-piloto-web.yml","utf8");
const codigo=readFileSync("src/pages/CompanyRegistration.tsx","utf8");
const permissoes=readFileSync("src/lib/ambiente.ts","utf8");
const regras=readFileSync("firestore.rules","utf8");
test("workflow de piloto não publica Hosting live, Functions ou regras",()=>{
 assert.match(workflow,/workflow_dispatch:/);
 assert.match(workflow,/github\.ref == 'refs\/heads\/main'/);
 assert.match(workflow,/persist-credentials: false/);
 assert.match(workflow,/hosting:channel:deploy fase-b-web/);
 assert.doesNotMatch(workflow,/^\s+(pull_request_target|pull_request|push):/m);
 assert.doesNotMatch(workflow,/firebase deploy|firebase-tools deploy|--only firestore|--only functions|hosting:channel:deploy live/);
 assert.match(workflow,/VITE_ENABLE_ADMIN_APPROVAL: 'false'/);
 assert.match(workflow,/VITE_TOAKI_ENV: piloto/);
 assert.match(workflow,/--expires 7d/);
});
test("somente responsável verificado pode criar solicitação, sem autoaprovação",()=>{
 assert.match(codigo,/user\?\.emailVerified/);
 assert.match(codigo,/solicitacoes_cadastro_empresas/);
 assert.match(codigo,/status:"aguardando_analise"/);
 assert.match(codigo,/if\(!ambienteOperacional/);
 assert.match(regras,/allow create: if proprietario\(uid\)/);
 assert.match(regras,/request\.resource\.data\.status == 'aguardando_analise'/);
 assert.match(regras,/allow update, delete: if false/);
 assert.match(permissoes,/VITE_TOAKI_PILOTO_NO_ORIGINAL/);
});
test("Preview não promove privilégio de administrador pela flag do navegador",()=>{
 assert.match(workflow,/VITE_ENABLE_ADMIN_APPROVAL: 'false'/);
 assert.match(workflow,/FIREBASE_SERVICE_ACCOUNT_TOAKI_CF058/);
 assert.match(workflow,/k\.project_id!=="toaki-cf058"/);
 assert.doesNotMatch(workflow,/setCustomUserClaims|--only functions|firestore:rules/);
});
