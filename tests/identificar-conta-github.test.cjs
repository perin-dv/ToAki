"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const {identificarContaServico}=require("../scripts/identificar-conta-github.cjs");

test("reconhece somente as tres identidades autorizadas para diagnostico",()=>{
  assert.equal(identificarContaServico("firebase-adminsdk-fbsvc@toaki-cf058.iam.gserviceaccount.com"),"firebase_adminsdk");
  assert.equal(identificarContaServico("toaki-cf058@appspot.gserviceaccount.com"),"app_engine_default");
  assert.equal(identificarContaServico("591288979843-compute@developer.gserviceaccount.com"),"compute_default");
  assert.equal(identificarContaServico("conta-privada@example.com"),"outra_conta_nao_identificada");
  assert.equal(identificarContaServico(null),"outra_conta_nao_identificada");
});

test("diagnostico apenas informa a categoria, sem imprimir a credencial",()=>{
  const src=fs.readFileSync(path.resolve(__dirname,"../scripts/diagnostico-firebase-readonly.cjs"),"utf8");
  assert.match(src,/contaGitHubActions:identificarContaServico\(cred.client_email\)/);
  assert.doesNotMatch(src,/console\.log\(cred\)|report\(cred\)|report\(cred.client_email\)/);
  const wf=fs.readFileSync(path.resolve(__dirname,"../.github/workflows/firebase-diagnostico-readonly.yml"),"utf8");
  assert.match(wf,/workflow_dispatch:/);
  assert.match(wf,/github.ref == 'refs\/heads\/main'/);
  assert.doesNotMatch(wf,/^\s+(push|pull_request|pull_request_target):/m);
});
