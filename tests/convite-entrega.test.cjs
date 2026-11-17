"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const {
  validarEmissao,validarResgate,gerarToken,digerirToken,tokenConfere,
  idEntregaCliente,DURACAO_CONVITE_MS
}=require("../functions/convite-politica.cjs");
const company="empresa_teste_soma",pedidoId="pedido_ABC";

test("convite exige empresa e NF exatos, rejeita campos de cargo e token forjado",()=>{
  assert.deepEqual(validarEmissao({empresaId:company,pedidoId}),{empresaId:company,pedidoId});
  assert.throws(()=>validarEmissao({empresaId:company,pedidoId,role:"admin_toaki"}),/Campos/);
  assert.throws(()=>validarEmissao({empresaId:"empresa_outra",pedidoId}),/Empresa/);
  assert.throws(()=>validarEmissao({empresaId:company,pedidoId:"../a"}),/NF/);
  assert.throws(()=>validarResgate({empresaId:company,pedidoId,token:"123456"}),/convite/);
});
test("token aleatório com 256 bits não fica persistido em texto claro",()=>{
  const a=gerarToken(),b=gerarToken();
  assert.equal(a.length,43);
  assert.notEqual(a,b);
  assert.notEqual(digerirToken(a),a);
  assert.equal(tokenConfere(a,digerirToken(a)),true);
  assert.equal(tokenConfere(b,digerirToken(a)),false);
  assert.equal(tokenConfere(a,"invalid"),false);
  assert.equal(validarResgate({empresaId:company,pedidoId,token:a}).token,a);
  assert.equal(DURACAO_CONVITE_MS,86400000);
});
test("id do espelho do cliente diferencia empresas e pedidos",()=>{
  assert.notEqual(idEntregaCliente(company,"pedido1"),idEntregaCliente(company,"pedido2"));
  assert.notEqual(idEntregaCliente(company,"pedido1"),idEntregaCliente("empresa_12345678901234","pedido1"));
});
test("resgate é por usuário autenticado, e-mail verificado e uma transação atômica",()=>{
  const code=fs.readFileSync("functions/convites-entrega.cjs","utf8");
  assert.match(code,/request\.auth\.token\.email_verified!==true/);
  assert.match(code,/getAuth\(\)\.getUser/);
  assert.match(code,/!usuario\.emailVerified/);
  assert.match(code,/verificarPiloto\(empresaId,empresa\.data\(\)\)/);
  assert.match(code,/\["dono_empresa","gestor"\]/);
  assert.match(code,/tx\.create\(espelhoRef/);
  assert.match(code,/tx\.update\(pedidoRef,\{cliente_uid_vinculado/);
  assert.match(code,/tx\.update\(conviteRef,\{status:"resgatado"/);
  assert.match(code,/tx\.get\(espelhoRef\)/);
  assert.match(code,/tokenConfere\(token,c\.hash_token\)/);
  assert.doesNotMatch(code,/setCustomUserClaims\(|email_verified:\s*true/);
  const changes=fs.readFileSync("functions/alteracoes.cjs","utf8");
  assert.match(changes,/if\(espelhoCliente\)tx\.update\(espelhoCliente,\{status:entrada\.novoStatus/);
});
test("frontend não usa NF pública e segredo não é enviado pela URL ao servidor",()=>{
  const link=fs.readFileSync("src/lib/vinculoEntrega.ts","utf8");
  const page=fs.readFileSync("src/pages/VincularEntregaPage.tsx","utf8");
  const companyPage=fs.readFileSync("src/pages/EmpresaOperacao.tsx","utf8");
  assert.match(link,/\+"\/vincular-entrega#"/);
  assert.match(page,/window\.history\.replaceState/);
  assert.match(page,/Confirmar vínculo desta entrega/);
  assert.match(companyPage,/Gerar link do cliente/);
  assert.doesNotMatch(page,/setDoc\(|addDoc\(|updateDoc\(/);
});
