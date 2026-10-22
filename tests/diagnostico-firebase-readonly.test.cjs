"use strict";
const assert=require("node:assert/strict");
const test=require("node:test");
const fs=require("node:fs");
const {spawnSync}=require("node:child_process");
const path=require("node:path");

const raiz=path.resolve(__dirname,"..");
const source=fs.readFileSync(path.join(raiz,"scripts/diagnostico-firebase-readonly.cjs"),"utf8");
const workflow=fs.readFileSync(path.join(raiz,".github/workflows/firebase-diagnostico-readonly.yml"),"utf8");

test("workflow de leitura não roda em PR, push nem faz deploy",()=>{
  assert.match(workflow,/workflow_dispatch:/);
  assert.match(workflow,/github\.ref == 'refs\/heads\/main'/);
  assert.match(workflow,/persist-credentials: false/);
  assert.doesNotMatch(workflow,/^\s+(pull_request|pull_request_target|push):/m);
  assert.doesNotMatch(workflow,/firebase-tools|npm install|firebase deploy|hosting:channel:deploy/);
});
test("script consulta somente metadados e não contém métodos de escrita",()=>{
  assert.match(source,/documents:listCollectionIds/);
  assert.match(source,/cloudfunctions\.googleapis\.com\/v2/);
  assert.match(source,/method="GET"/);
  assert.doesNotMatch(source,/\.set\(|\.create\(|\.update\((?!mensagem\))|\.delete\(|setCustomUserClaims\(/);
  assert.match(source,/COLECOES\.map\(nome=>\[nome,encontradas\.has\(nome\)\]\)/);
});
test("sem credencial o diagnóstico falha fechado e não revela stack",()=>{
  const env={...process.env};
  delete env.GOOGLE_APPLICATION_CREDENTIALS;
  const run=spawnSync(process.execPath,[path.join(raiz,"scripts/diagnostico-firebase-readonly.cjs")],{env,encoding:"utf8",timeout:5000});
  assert.equal(run.status,1);
  assert.equal(run.stdout,"");
  assert.match(run.stderr,/Diagnóstico indisponível/);
  assert.doesNotMatch(run.stderr,/at Object|at async|private_key/);
});
