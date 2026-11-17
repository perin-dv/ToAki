"use strict";
const {createHash,randomBytes,timingSafeEqual}=require("node:crypto");
const {identificadorEmpresaValido}=require("./empresa-identidade.cjs");
const ID=/^[A-Za-z0-9_-]{1,128}$/;
const TOKEN=/^[A-Za-z0-9_-]{43}$/;
const DURACAO_CONVITE_MS=24*60*60*1000;
function entrada(obj,campos){
  if(!obj||typeof obj!=="object"||Array.isArray(obj))throw Error("Solicitação inválida.");
  if(Object.keys(obj).some(chave=>!campos.includes(chave))||campos.some(chave=>!(chave in obj)))
    throw Error("Campos de solicitação inválidos.");
  if(!identificadorEmpresaValido(obj.empresaId)||!ID.test(obj.pedidoId))
    throw Error("Empresa ou NF inválida.");
}
function validarEmissao(obj){
  entrada(obj,["empresaId","pedidoId"]);
  return {empresaId:obj.empresaId,pedidoId:obj.pedidoId};
}
function validarResgate(obj){
  entrada(obj,["empresaId","pedidoId","token"]);
  if(typeof obj.token!=="string"||!TOKEN.test(obj.token))
    throw Error("Código de convite inválido.");
  return {empresaId:obj.empresaId,pedidoId:obj.pedidoId,token:obj.token};
}
function gerarToken(){return randomBytes(32).toString("base64url");}
function digerirToken(token){return createHash("sha256").update(token).digest("hex");}
function tokenConfere(token,hash){
  if(typeof hash!=="string"||!/^[a-f0-9]{64}$/.test(hash)||!TOKEN.test(token))return false;
  return timingSafeEqual(Buffer.from(digerirToken(token),"hex"),Buffer.from(hash,"hex"));
}
function idEntregaCliente(empresaId,pedidoId){
  if(!identificadorEmpresaValido(empresaId)||!ID.test(pedidoId))throw Error("Identificador inválido.");
  return empresaId+"__"+pedidoId;
}
module.exports={validarEmissao,validarResgate,gerarToken,digerirToken,tokenConfere,idEntregaCliente,DURACAO_CONVITE_MS};
