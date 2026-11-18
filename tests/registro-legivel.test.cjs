"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const {slug,idRegistro,situacaoLegivel,tituloRegistro}=require("../functions/registro-legivel.cjs");
test("novos documentos comerciais têm identificadores legíveis, sem migrar IDs existentes",()=>{
  assert.equal(idRegistro("pedido",{numero_nf:"000123"}),"nf_000123");
  assert.equal(idRegistro("veiculo",{placa:"ABC1D23"}),"veiculo_ABC1D23");
  assert.equal(idRegistro("cliente",{nome:"João da Silva"},"0123abcd"),"cliente_joao_da_silva_0123abcd");
  assert.equal(idRegistro("entregador",{nome:"Ana M. Costa"},"deadbeef"),"entregador_ana_m_costa_deadbeef");
  assert.equal(slug("D'Ávila & Filhos"),"d_avila_filhos");
});
test("validação de campos impede referências inventadas ou caminhos maliciosos",()=>{
  assert.throws(()=>idRegistro("pedido",{numero_nf:"../../../"}));
  assert.throws(()=>idRegistro("veiculo",{placa:"!!!"}));
  assert.throws(()=>idRegistro("cliente",{nome:"/"},"deadbeef"));
  assert.throws(()=>idRegistro("cliente",{nome:"Pessoa"},"..."));
});
test("títulos das pastas representam conteúdo real em português",()=>{
  assert.equal(tituloRegistro("cliente",{nome:"Maria de Teste"}),"Cliente — Maria de Teste");
  assert.equal(tituloRegistro("pedido",{numero_nf:"001"}, {destinatario_nome:"Maria de Teste"}),"NF 001 — Maria de Teste");
  assert.equal(situacaoLegivel("pendente"),"Aguardando saída");
  assert.match(situacaoLegivel("em_rota"),/GPS independente/);
});
test("backend deriva nomes a partir de documentos autorizados, nunca do cliente HTTP",()=>{
  const criar=fs.readFileSync("functions/operacoes.cjs","utf8");
  const alterar=fs.readFileSync("functions/alteracoes.cjs","utf8");
  const front=fs.readFileSync("src/pages/EmpresaOperacao.tsx","utf8");
  assert.match(criar,/const novo=coleção\.doc\(idRegistro\(tipo,dados\)\)/);
  assert.match(criar,/destinatario_nome=cliente\.data\(\)\.nome/);
  assert.match(criar,/entregador_nome=courier\.data\(\)\?\.nome/);
  assert.match(criar,/registro\.veiculo_placa=veiculo\.data\(\)\?\.placa/);
  assert.match(alterar,/dadosAtualizados\.destinatario_nome=cliente\.data\(\)\.nome/);
  assert.match(alterar,/situacao_legivel:situacaoLegivel\(entrada\.novoStatus\)/);
  assert.match(front,/Registrar saída \(sem GPS\)/);
  assert.match(front,/Registrar entrega \(sem comprovante\)/);
  assert.doesNotMatch(front,/GPS conectado ao entregador|Rota em tempo real ativa/);
});
