"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const {validarOperacao,validarAlteracao,validarTransicaoStatus}=require("../functions/operacao-politica.cjs");
const id="empresa_11222333000181";
const endereco={cep:"01001-000",logradouro:"Praça da Sé",numero:"123",complemento:"Sala 2",bairro:"Sé",cidade:"São Paulo",uf:"SP"};
test("validacao operacional aceita cadastros limitados por tipo e empresa",()=>{
  assert.equal(validarOperacao({empresaId:id,tipo:"cliente",dados:{nome:"Oficina Exemplo A",...endereco}}).dados.nome,"Oficina Exemplo A");
  assert.equal(validarOperacao({empresaId:id,tipo:"veiculo",dados:{placa:"abc1d23",categoria:"Moto"}}).dados.placa,"ABC1D23");
  assert.equal(validarOperacao({empresaId:id,tipo:"entregador",dados:{nome:"Pedro Exemplo"}}).dados.nome,"Pedro Exemplo");
  assert.equal(validarOperacao({empresaId:id,tipo:"pedido",dados:{numero_nf:"000123",destinatario_id:"cliente123",endereco_entrega:"Rua Exemplo, 200"}}).dados.numero_nf,"000123");
});
test("rejeita payload com funções, papéis e status enviados pelo navegador",()=>{
  assert.throws(()=>validarOperacao({empresaId:id,tipo:"cliente",dados:{nome:"Oficina Exemplo",...endereco,role:"admin_toaki"}}),/não autorizado/);
  assert.throws(()=>validarOperacao({empresaId:id,tipo:"pedido",dados:{numero_nf:"1",destinatario_id:"cliente123",endereco_entrega:"Rua Exemplo",status:"entregue"}}),/não autorizado/);
  assert.throws(()=>validarOperacao({empresaId:id,tipo:"funcionario",dados:{nome:"Teste"}}),/inválido/);
  assert.throws(()=>validarOperacao({empresaId:"empresa_de_outro",tipo:"cliente",dados:{nome:"Teste Usuário"}}),/Empresa inválida/);
  assert.throws(()=>validarOperacao({empresaId:id,tipo:"veiculo",dados:{placa:"1111111",categoria:"Moto"}}),/Placa inválida/);
});
test("não há operação de exclusão nem mudanças de papel no validador inicial",()=>{
  assert.throws(()=>validarOperacao({empresaId:id,tipo:"admin",dados:{papel:"admin"}}),/Tipo de cadastro inválido/);
  assert.throws(()=>validarOperacao({empresaId:id,tipo:"cliente",dados:{nome:"A",...endereco}}),/tamanho/);
});

test("cliente empresarial exige CEP completo, número e UF brasileira",()=>{
  const base={empresaId:id,tipo:"cliente"};
  assert.equal(validarOperacao({...base,dados:{nome:"Oficina Exemplo A",...endereco}}).dados.cep,"01001000");
  assert.throws(()=>validarOperacao({...base,dados:{nome:"Oficina Exemplo A",...endereco,cep:"123"}}),/CEP|tamanho/);
  assert.throws(()=>validarOperacao({...base,dados:{nome:"Oficina Exemplo A",...endereco,uf:"XX"}}),/UF inválida/);
  assert.throws(()=>validarOperacao({...base,dados:{nome:"Oficina Exemplo A",...endereco,numero:""}}),/tamanho|Campo/);
  assert.throws(()=>validarOperacao({...base,dados:{nome:"Oficina Exemplo A",...endereco,acesso_admin:"sim"}}),/não autorizado/);
});

test("motorista pode selecionar veículo cadastrado pelo ID, NF vincula cliente, moto e motorista",()=>{
  assert.deepEqual(validarOperacao({empresaId:id,tipo:"entregador",dados:{nome:"Pedro Exemplo",veiculo_id:"veiculo123"}}).dados,{
    nome:"Pedro Exemplo",telefone:"",veiculo_id:"veiculo123"
  });
  const nf=validarOperacao({empresaId:id,tipo:"pedido",dados:{
    numero_nf:"0034",destinatario_id:"cliente123",entregador_id:"driver123",
    veiculo_id:"veiculo123",endereco_entrega:"Rua dos Pioneiros, 150"
  }});
  assert.equal(nf.dados.veiculo_id,"veiculo123");
  assert.equal(nf.dados.entregador_id,"driver123");
  assert.throws(()=>validarOperacao({empresaId:id,tipo:"pedido",dados:{
    numero_nf:"0034",destinatario_id:"cliente123",veiculo_id:"../../../",endereco_entrega:"Rua Teste, 1"
  }}),/inválido/);
});
test("edição, desativação e transições não permitem comandos nem papéis arbitrários",()=>{
  const base={empresaId:id,tipo:"cliente",registroId:"cliente123"};
  assert.equal(validarAlteracao({...base,acao:"atualizar",dados:{nome:"Empresa A",...endereco}}).acao,"atualizar");
  assert.equal(validarAlteracao({...base,acao:"desativar"}).acao,"desativar");
  assert.throws(()=>validarAlteracao({...base,acao:"desativar",role:"admin_toaki"}),/não autorizado/);
  assert.throws(()=>validarAlteracao({...base,acao:"excluir"}),/Ação inválida/);
  assert.throws(()=>validarAlteracao({...base,tipo:"pedido",acao:"desativar"}),/cancelada/);
  assert.throws(()=>validarAlteracao({...base,acao:"mudar_status",novoStatus:"entregue"}),/Status inválido/);
  assert.throws(()=>validarAlteracao({...base,acao:"atualizar",dados:{nome:"Empresa A",...endereco,ativo:true}}),/não autorizado/);
  assert.equal(validarTransicaoStatus("pendente","em_rota"),"em_rota");
  assert.equal(validarTransicaoStatus("em_rota","entregue"),"entregue");
  assert.equal(validarTransicaoStatus("pendente","cancelada"),"cancelada");
  assert.throws(()=>validarTransicaoStatus("pendente","entregue"),/não permitida/);
  assert.throws(()=>validarTransicaoStatus("entregue","em_rota"),/não permitida/);
});
