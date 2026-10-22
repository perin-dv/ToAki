"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const {validarOperacao}=require("../functions/operacao-politica.cjs");
const id="empresa_11222333000181";
test("validacao operacional aceita cadastros limitados por tipo e empresa",()=>{
  assert.equal(validarOperacao({empresaId:id,tipo:"cliente",dados:{nome:"Oficina Exemplo A"}}).dados.nome,"Oficina Exemplo A");
  assert.equal(validarOperacao({empresaId:id,tipo:"veiculo",dados:{placa:"abc1d23",categoria:"Moto"}}).dados.placa,"ABC1D23");
  assert.equal(validarOperacao({empresaId:id,tipo:"entregador",dados:{nome:"Pedro Exemplo"}}).dados.nome,"Pedro Exemplo");
  assert.equal(validarOperacao({empresaId:id,tipo:"pedido",dados:{numero_nf:"000123",destinatario_id:"cliente123",endereco_entrega:"Rua Exemplo, 200"}}).dados.numero_nf,"000123");
});
test("rejeita payload com funções, papéis e status enviados pelo navegador",()=>{
  assert.throws(()=>validarOperacao({empresaId:id,tipo:"cliente",dados:{nome:"Oficina Exemplo",role:"admin_toaki"}}),/não autorizado/);
  assert.throws(()=>validarOperacao({empresaId:id,tipo:"pedido",dados:{numero_nf:"1",destinatario_id:"cliente123",endereco_entrega:"Rua Exemplo",status:"entregue"}}),/não autorizado/);
  assert.throws(()=>validarOperacao({empresaId:id,tipo:"funcionario",dados:{nome:"Teste"}}),/inválido/);
  assert.throws(()=>validarOperacao({empresaId:"empresa_de_outro",tipo:"cliente",dados:{nome:"Teste Usuário"}}),/Empresa inválida/);
  assert.throws(()=>validarOperacao({empresaId:id,tipo:"veiculo",dados:{placa:"1111111",categoria:"Moto"}}),/Placa inválida/);
});
test("não há operação de exclusão nem mudanças de papel no validador inicial",()=>{
  assert.throws(()=>validarOperacao({empresaId:id,tipo:"admin",dados:{papel:"admin"}}),/Tipo de cadastro inválido/);
  assert.throws(()=>validarOperacao({empresaId:id,tipo:"cliente",dados:{nome:"A"}}),/tamanho/);
});
