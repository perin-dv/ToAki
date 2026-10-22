"use strict";

// Validações puras: nenhum identificador, papel ou estado é aceito sem verificação no servidor.
const EMPRESA=/^empresa_[0-9]{14}$/;
const ID=/^[A-Za-z0-9_-]{1,128}$/;
const HEX=/^[0-9a-f]+$/;
function falha(m){throw Error(m);}
function identificador(valor,classe){
  if(typeof valor!=="string"||!(classe==="empresa"?EMPRESA:ID).test(valor))falha("Identificador inválido: "+classe);
  return valor;
}
function conviteToken(valor){
  if(typeof valor!=="string")falha("Convite inválido.");
  const p=valor.split(".");
  if(p.length!==3||!EMPRESA.test(p[0])||p[1].length!==32||!HEX.test(p[1])||p[2].length!==64||!HEX.test(p[2]))falha("Convite inválido.");
  return {empresaId:p[0],conviteId:p[1],segredo:p[2]};
}
function posicaoValidada(d){
  if(!d||typeof d!=="object"||Array.isArray(d))falha("Posição inválida.");
  if(Object.keys(d).some(k=>!["pedidoId","latitude","longitude","precisao"].includes(k)))falha("Campo não autorizado.");
  const pedidoId=identificador(d.pedidoId,"pedido");
  if(!Number.isFinite(d.latitude)||d.latitude< -90||d.latitude>90)falha("Latitude inválida.");
  if(!Number.isFinite(d.longitude)||d.longitude< -180||d.longitude>180)falha("Longitude inválida.");
  if(!Number.isFinite(d.precisao)||d.precisao<0||d.precisao>200)falha("Precisão insuficiente para rastreamento.");
  return {pedidoId,latitude:d.latitude,longitude:d.longitude,precisao:d.precisao};
}
function podeEnviarPosicao(pedido,uid,agoraMs){
  if(!pedido||pedido.status!=="em_rota"||pedido.entregador_uid!==uid)falha("Esta entrega não está ativa para sua conta.");
  const anterior=pedido.posicao_atual?.recebida_em;
  const timestamp=typeof anterior?.toMillis==="function"?anterior.toMillis():0;
  if(timestamp && agoraMs-timestamp<10000)falha("Atualize a localização em alguns segundos.");
  return true;
}
module.exports={identificador,conviteToken,posicaoValidada,podeEnviarPosicao};
