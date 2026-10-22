"use strict";

// Piloto no mesmo Firebase permanece fechado por padrão.
// O frontend nunca pode liberar empresas ou habilitar gravações no backend.
const PROJETO_ORIGINAL="toaki-cf058";
function autorizarAprovacaoEmpresa({projeto,empresaId,habilitacao,empresasPermitidas}){
  if(typeof projeto!=="string"||!projeto.trim())
    throw Error("Projeto Firebase não identificado; operação bloqueada.");
  if(projeto!==PROJETO_ORIGINAL)return "homologacao";

  if(habilitacao!=="habilitado")
    throw Error("Piloto no Firebase principal não foi habilitado no backend.");
  if(typeof empresaId!=="string"||!/^empresa_[0-9]{14}$/.test(empresaId))
    throw Error("Identificador de empresa não autorizado para o piloto.");
  const permitidas=typeof empresasPermitidas==="string"
    ?empresasPermitidas.split(",").map(id=>id.trim()).filter(Boolean):[];
  if(!permitidas.includes(empresaId))
    throw Error("Empresa não está na lista explícita de autorização do piloto.");
  return "piloto";
}
function autorizarDestinoOperacional({projeto,empresaId,empresa,habilitacao,empresasPermitidas}){
  const ambiente=autorizarAprovacaoEmpresa({projeto,empresaId,habilitacao,empresasPermitidas});
  if(ambiente==="piloto" && (!empresa||empresa.status!=="ativa"||empresa.ambiente!=="piloto"))
    throw Error("Empresa não está marcada como piloto ativo.");
  return ambiente;
}

module.exports={PROJETO_ORIGINAL,autorizarAprovacaoEmpresa,autorizarDestinoOperacional};
