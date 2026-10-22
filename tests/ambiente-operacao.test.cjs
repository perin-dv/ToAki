"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const {autorizarDestinoOperacional,autorizarAprovacaoEmpresa}=require("../functions/ambiente-operacao.cjs");

const empresaId="empresa_11222333000181";
const empresa={status:"ativa",ambiente:"piloto"};
const args={projeto:"toaki-cf058",empresaId,empresa,habilitacao:"habilitado",empresasPermitidas:empresaId};
const testar=(a)=>autorizarDestinoOperacional(a);

test("piloto no projeto original nasce bloqueado, mesmo com empresa ativa",()=>{
  assert.throws(()=>testar({...args,habilitacao:""}),/não foi habilitado/);
  assert.throws(()=>testar({...args,habilitacao:"true"}),/não foi habilitado/);
  assert.throws(()=>testar({...args,empresasPermitidas:""}),/lista explícita/);
});
test("somente empresa marcada e autorizada na lista exata pode gravar",()=>{
  assert.equal(testar(args),"piloto");
  assert.throws(()=>testar({...args,empresa:{status:"ativa"}}),/piloto ativo/);
  assert.throws(()=>testar({...args,empresa:{...empresa,status:"suspensa"}}),/piloto ativo/);
  assert.throws(()=>testar({...args,empresaId:"empresa_11222333000182"}),/lista explícita/);
  assert.throws(()=>testar({...args,empresasPermitidas:"empresa_112223330001810"}),/lista explícita/);
});
test("sem identificador de projeto ou empresa válida, bloqueia",()=>{
  assert.throws(()=>testar({...args,projeto:""}),/não identificado/);
  assert.throws(()=>testar({...args,empresaId:"outra_empresa"}),/não autorizado/);
});
test("não quebra o backend isolado já preparado para outros projetos",()=>{
  assert.equal(testar({...args,projeto:"toaki-homologacao-exemplo",habilitacao:"",empresasPermitidas:""}),"homologacao");
});

test("aprovação empresarial no Firebase original só é permitida para CNPJ pré-autorizado",()=>{
  const aprovar=(a)=>autorizarAprovacaoEmpresa(a);
  assert.throws(()=>aprovar({...args,habilitacao:undefined}),/não foi habilitado/);
  assert.throws(()=>aprovar({...args,empresasPermitidas:"empresa_99999999000199"}),/lista explícita/);
  assert.equal(aprovar(args),"piloto");
  assert.equal(aprovar({...args,projeto:"toaki-homologacao-exemplo",habilitacao:undefined}),"homologacao");
});
test("liberar a solicitação no frontend não concede permissão de backend",()=>{
  assert.throws(()=>autorizarDestinoOperacional({...args,empresa:{status:"ativa"}}),/piloto ativo/);
  assert.throws(()=>autorizarDestinoOperacional({...args,empresa:null}),/piloto ativo/);
  assert.throws(()=>autorizarDestinoOperacional({...args,empresasPermitidas:undefined}),/lista explícita/);
});

test("config de implantação do piloto não oferece deploy de Hosting live",()=>{
  const {readFileSync}=require("node:fs");
  const {join}=require("node:path");
  const conf=JSON.parse(readFileSync(join(__dirname,"../firebase.piloto.json"),"utf8"));
  assert.equal(Object.hasOwn(conf,"hosting"),false);
  assert.equal(conf.firestore.rules,"firestore.rules");
  assert.equal(conf.functions[0].source,"functions");
});
