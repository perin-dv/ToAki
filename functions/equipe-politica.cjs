"use strict";
const {randomBytes,createHash,timingSafeEqual}=require("node:crypto");
const {identificadorEmpresaValido}=require("./empresa-identidade.cjs");
const ID=/^[A-Za-z0-9_-]{1,128}$/;
const TOKEN=/^[A-Za-z0-9_-]{43}$/;
const CONVITE=/^conv_[A-Za-z0-9_-]{16,32}$/;
const PAPEIS=["gestor","vendedor"];
const validadeMs=24*60*60*1000;
function campos(d,obrigatorios){
  if(!d||typeof d!=="object"||Array.isArray(d)
    ||Object.keys(d).some(k=>!obrigatorios.includes(k))
    ||obrigatorios.some(k=>!(k in d)))throw Error("Campos não permitidos.");
}
function empresa(valor){
  if(!identificadorEmpresaValido(valor))throw Error("Empresa inválida.");
  return valor;
}
function email(valor){
  if(typeof valor!=="string")throw Error("E-mail inválido.");
  const normal=valor.trim().toLowerCase();
  if(normal.length>180||normal.length<5||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normal))
    throw Error("E-mail inválido.");
  return normal;
}
function criar(d){
  campos(d,["empresaId","email","papel"]);
  if(!PAPEIS.includes(d.papel))throw Error("Papel não permitido.");
  return {empresaId:empresa(d.empresaId),email:email(d.email),papel:d.papel};
}
function aceitar(d){
  campos(d,["empresaId","conviteId","token"]);
  if(typeof d.conviteId!=="string"||!CONVITE.test(d.conviteId)
    ||typeof d.token!=="string"||!TOKEN.test(d.token))
    throw Error("Convite inválido.");
  return {empresaId:empresa(d.empresaId),conviteId:d.conviteId,token:d.token};
}
function desligar(d){
  campos(d,["empresaId","funcionarioId"]);
  if(typeof d.funcionarioId!=="string"||!ID.test(d.funcionarioId))
    throw Error("Funcionário inválido.");
  return {empresaId:empresa(d.empresaId),funcionarioId:d.funcionarioId};
}
function gerarToken(){return randomBytes(32).toString("base64url");}
function gerarConviteId(){return "conv_"+randomBytes(12).toString("base64url");}
function resumo(token){return createHash("sha256").update(token).digest("hex");}
function confere(token,hash){
  if(typeof token!=="string"||!TOKEN.test(token)||typeof hash!=="string"||!/^[a-f0-9]{64}$/.test(hash))return false;
  return timingSafeEqual(Buffer.from(resumo(token),"hex"),Buffer.from(hash,"hex"));
}
const nomePapel=p=>p==="dono_empresa"?"Responsável":p==="gestor"?"Gestor":p==="vendedor"?"Vendedor":"Sem função";
module.exports={criar,aceitar,desligar,email,empresa,gerarToken,gerarConviteId,resumo,confere,nomePapel,validadeMs};
