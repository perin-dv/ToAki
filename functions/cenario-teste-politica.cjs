"use strict";
const {validarOperacao}=require("./operacao-politica.cjs");
const {idRegistro,tituloRegistro,situacaoLegivel}=require("./registro-legivel.cjs");

// Nomes/placa/endereço são EXCLUSIVAMENTE exemplos fictícios. Não representam
// uma pessoa, veículo, CEP de entrega ou nota fiscal real.
const EMPRESA="empresa_teste_soma";
const origem="cenario_ficticio_thiago_sakamoto";
const cliente=validarOperacao({empresaId:EMPRESA,tipo:"cliente",dados:{
  nome:"Sakamoto (teste)",telefone:"",cep:"87020000",
  logradouro:"Rua Exemplo (fictícia)",numero:"100",complemento:"",
  bairro:"Centro",cidade:"Maringá",uf:"PR"
}}).dados;
const veiculo=validarOperacao({empresaId:EMPRESA,tipo:"veiculo",dados:{
  placa:"TST1A24",categoria:"Moto"
}}).dados;
const idVeiculo=idRegistro("veiculo",veiculo);
const entregador=validarOperacao({empresaId:EMPRESA,tipo:"entregador",dados:{
  nome:"Thiago (teste)",telefone:"",veiculo_id:idVeiculo
}}).dados;
const idCliente="cliente_sakamoto_teste_soma";
const idEntregador="entregador_thiago_teste_soma";
const pedido=validarOperacao({empresaId:EMPRESA,tipo:"pedido",dados:{
  numero_nf:"20261124001",destinatario_id:idCliente,
  entregador_id:idEntregador,veiculo_id:idVeiculo,
  endereco_entrega:"Rua Exemplo (fictícia), 100, Centro, Maringá - PR"
}}).dados;
const idPedido=idRegistro("pedido",pedido);
const refs={idCliente,idVeiculo,idEntregador,idPedido,numeroNF:pedido.numero_nf};
function respostaCenario(jaExistia=false){return {ok:true,jaExistia,...refs};}
function pertenceAoCenario(dados){return dados?.origem_teste===origem&&dados?.empresa_id===EMPRESA;}
function nomeRegistro(tipo,dados){return tituloRegistro(tipo,dados,{destinatario_nome:cliente.nome});}
module.exports={EMPRESA,origem,cliente,veiculo,entregador,pedido,refs,respostaCenario,pertenceAoCenario,nomeRegistro,situacaoLegivel};
