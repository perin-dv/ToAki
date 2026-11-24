"use strict";
const crypto=require("node:crypto");
const empresa=/^empresa_(?:teste_soma|[0-9]{14})$/;
const id=/^[a-zA-Z0-9_-]{1,128}$/;
function identificador(value,label){if(typeof value!=="string"||!id.test(value))throw Error(label+" inválido.");return value;}
function empresaId(value){if(typeof value!=="string"||!empresa.test(value))throw Error("Empresa inválida.");return value;}
function validarEmail(value){
  const e=typeof value==="string"?value.trim().toLowerCase():"";
  if(e.length<5||e.length>180||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))throw Error("E-mail inválido.");
  return e;
}
function validarToken(value){
  if(typeof value!=="string")throw Error("Convite inválido.");
  const p=value.split(".");
  if(p.length!==3||!empresa.test(p[0])||!/^[a-f0-9]{32}$/.test(p[1])||!/^[a-f0-9]{64}$/.test(p[2]))throw Error("Convite inválido.");
  return {empresaId:p[0],conviteId:p[1],segredo:p[2]};
}
function gerarSegredo(){return crypto.randomBytes(32).toString("hex");}
function hash(value){return crypto.createHash("sha256").update(value).digest("hex");}
function segredoConfere(token,esperado){
  if(typeof esperado!=="string"||!/^[a-f0-9]{64}$/.test(esperado))return false;
  return crypto.timingSafeEqual(Buffer.from(hash(token),"hex"),Buffer.from(esperado,"hex"));
}
function gpsValido(v){
  if(!v||typeof v!=="object"||Array.isArray(v)||Object.keys(v).some(k=>!["pedidoId","latitude","longitude","precisao"].includes(k)))throw Error("GPS inválido.");
  const pedidoId=identificador(v.pedidoId,"Entrega");
  for(const [k,min,max] of [["latitude",-90,90],["longitude",-180,180],["precisao",0,100]]){
    if(typeof v[k]!=="number"||!Number.isFinite(v[k])||v[k]<min||v[k]>max)throw Error("GPS sem precisão suficiente ou fora do intervalo: "+k);
  }
  return {pedidoId,latitude:v.latitude,longitude:v.longitude,precisao:v.precisao};
}
function nomeArquivo(empresa,pedido,uid,tipo){
  empresaId(empresa);identificador(pedido,"NF");identificador(uid,"Conta");
  if(!["foto","assinatura"].includes(tipo))throw Error("Comprovante inválido.");
  return "comprovantes/"+empresa+"/"+pedido+"/"+uid+"/"+(tipo==="foto"?"foto.jpg":"assinatura.png");
}
function permissaoGps(pedido,uid,now){
  if(!pedido||pedido.status!=="em_rota"||pedido.entregador_uid!==uid)throw Error("Rota não está ativa para esta conta.");
  const prev=pedido.posicao_atual?.atualizado_em?.toMillis?.()||0;
  if(prev&&now-prev<10000)throw Error("Envie GPS a cada 10 segundos ou mais.");
}
module.exports={identificador,empresaId,validarEmail,validarToken,gerarSegredo,hash,segredoConfere,gpsValido,nomeArquivo,permissaoGps};
