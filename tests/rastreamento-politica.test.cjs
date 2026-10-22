"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const {identificador,conviteToken,posicaoValidada,podeEnviarPosicao}=require("../functions/rastreamento-politica.cjs");
const eid="empresa_11222333000181";
test("convite liga empresa, ID e segredo longo sem aceitar tokens incorretos",()=>{
  assert.deepEqual(conviteToken(eid+"."+"a".repeat(32)+"."+"b".repeat(64)),{empresaId:eid,conviteId:"a".repeat(32),segredo:"b".repeat(64)});
  for(const valor of ["",eid+".x.x","empresa_outro."+"a".repeat(32)+"."+"b".repeat(64),eid+"."+"a".repeat(32)+"."+"b".repeat(30)])assert.throws(()=>conviteToken(valor),/Convite inválido/);
});
test("posição exige coordenadas reais, precisão e esquema fechado",()=>{
  assert.deepEqual(posicaoValidada({pedidoId:"nota1",latitude:-23.426,longitude:-51.936,precisao:13}),{pedidoId:"nota1",latitude:-23.426,longitude:-51.936,precisao:13});
  for(const p of [
    {pedidoId:"nota1",latitude:91,longitude:1,precisao:10},
    {pedidoId:"nota1",latitude:0,longitude:-181,precisao:10},
    {pedidoId:"nota1",latitude:0,longitude:0,precisao:201},
    {pedidoId:"nota1",latitude:NaN,longitude:0,precisao:10},
    {pedidoId:"nota1",latitude:0,longitude:0,precisao:10,status:"entregue"}
  ])assert.throws(()=>posicaoValidada(p));
});
test("motoboy só transmite em entrega própria e em rota; taxa limitada",()=>{
  assert.equal(podeEnviarPosicao({status:"em_rota",entregador_uid:"uid1"},"uid1",100000),true);
  assert.throws(()=>podeEnviarPosicao({status:"pendente",entregador_uid:"uid1"},"uid1",100000));
  assert.throws(()=>podeEnviarPosicao({status:"em_rota",entregador_uid:"uid2"},"uid1",100000));
  assert.throws(()=>podeEnviarPosicao({status:"em_rota",entregador_uid:"uid1",posicao_atual:{recebida_em:{toMillis:()=>97000}}},"uid1",100000),/alguns segundos/);
  assert.equal(identificador(eid,"empresa"),eid);
  assert.throws(()=>identificador("../a","pedido"),/inválido/);
});
