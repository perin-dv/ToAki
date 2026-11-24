"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const {validarOperacao}=require("../functions/operacao-politica.cjs");
const {idRegistro}=require("../functions/registro-legivel.cjs");
const empresaId="empresa_teste_soma";
test("um cadastro cria entregador e veículo vinculados com categoria única",()=>{
  for(const categoria of ["Moto","Carro","Van","Caminhão"]){
    const placa=validarOperacao({empresaId,tipo:"veiculo",dados:{placa:"TST1A24",categoria}}).dados;
    const vId=idRegistro("veiculo",placa);
    const d=validarOperacao({empresaId,tipo:"entregador",dados:{
      nome:"Thiago Teste",telefone:"",veiculo_id:vId
    }}).dados;
    assert.equal(d.veiculo_id,vId);
    assert.equal(placa.categoria,categoria);
  }
});
test("o servidor valida vínculo, reserva placa, faz transação e jamais concede cargo motoboy",()=>{
  const source=fs.readFileSync("functions/entregador-veiculo.cjs","utf8");
  assert.match(source,/request.auth.token.empresa_id!==empresaId/);
  assert.match(source,/autorizarDestinoOperacional/);
  assert.match(source,/tx.get\(reservaRef\)/);
  assert.match(source,/tx.create\(veiculoRef/);
  assert.match(source,/tx.create\(motoristaRef/);
  assert.match(source,/membro.data\(\)\?\.ativo!==true/);
  assert.doesNotMatch(source,/setCustomUserClaims|watchPosition|posicao_atual/);
});
test("interface oferece cadastro único e preenche veículo da NF ao escolher motorista",()=>{
  const source=fs.readFileSync("src/pages/EmpresaOperacao.tsx","utf8");
  assert.match(source,/Cadastrar entregador e veículo/);
  assert.match(source,/Veículo associado automaticamente/);
  assert.match(source,/cadastrarEntregadorComVeiculo/);
});
