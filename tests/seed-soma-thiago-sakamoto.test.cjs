"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const {EMPRESA,cliente,veiculo,entregador,pedido,refs}=require("../functions/cenario-teste-politica.cjs");

test("identificadores do cenário são previsíveis, fictícios e vinculados",()=>{
  assert.equal(EMPRESA,"empresa_teste_soma");
  assert.equal(cliente.nome,"Sakamoto (teste)");
  assert.equal(entregador.nome,"Thiago (teste)");
  assert.equal(veiculo.categoria,"Moto");
  assert.equal(veiculo.placa,"TST1A24");
  assert.equal(pedido.numero_nf,"20261124001");
  assert.equal(pedido.destinatario_id,refs.idCliente);
  assert.equal(pedido.entregador_id,refs.idEntregador);
  assert.equal(pedido.veiculo_id,refs.idVeiculo);
});
test("script protege projeto, empresa, transação, idempotência e confirmação após gravação",()=>{
  const code=fs.readFileSync("functions/scripts/seed-soma-thiago-sakamoto.cjs","utf8");
  assert.match(code,/GITHUB_REPOSITORY!=="perin-dv\/ToAki"/);
  assert.match(code,/GITHUB_REF!=="refs\/heads\/main"/);
  assert.match(code,/TOAKI_SEED_SOMA!==GUARD/);
  assert.match(code,/dados\.project_id!==PROJETO/);
  assert.match(code,/info\?\.tipo_registro!=="empresa_teste"/);
  assert.match(code,/info\?\.modo_teste!==true/);
  assert.match(code,/info\?\.cnpj!==null/);
  assert.match(code,/presentes===6/);
  assert.match(code,/db\.runTransaction/);
  assert.match(code,/tx\.create\(referencias\[3\]/);
  assert.match(code,/Promise\.all\(referencias\.map\(r=>r\.get\(\)\)\)/);
  assert.doesNotMatch(code,/setCustomUserClaims|watchPosition|updateDoc|tx\.delete/);
});
test("workflow só usa credencial em push da main ou dispatch explícito",()=>{
  const yaml=fs.readFileSync(".github/workflows/firebase-semente-soma-apos-merge.yml","utf8");
  assert.match(yaml,/branches: \[main\]/);
  assert.match(yaml,/seed-soma-thiago-sakamoto\.cjs/);
  assert.match(yaml,/FIREBASE_SERVICE_ACCOUNT_TOAKI_CF058/);
  assert.doesNotMatch(yaml,/firebase deploy|hosting:channel:deploy|firestore:rules/);
});
