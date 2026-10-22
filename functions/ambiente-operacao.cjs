"use strict";

// Piloto com apenas um projeto Firebase: desabilitado por padrão.
// Ter acesso ao painel ou conhecer o ID de uma empresa nunca libera gravações.
const PROJETO_ORIGINAL="toaki-cf058";
function autorizarDestinoOperacional({projeto,empresaId,empresa,habilitacao,empresasPermitidas}){
  if(typeof projeto!=="string"||!projeto.trim())
    throw Error("Projeto Firebase não identificado; operação bloqueada.");
  if(projeto!==PROJETO_ORIGINAL)return "homologacao";

  if(habilitacao!=="habilitado")
    throw Error("Piloto no Firebase principal não foi habilitado no backend.");
  if(typeof empresaId!=="string"||!/^empresa_[0-9]{14}$/.test(empresaId))
    throw Error("Identificador de empresa não autorizado para o piloto.");
  if(!empresa||empresa.status!=="ativa"||empresa.ambiente!=="piloto")
    throw Error("Empresa não está marcada como piloto ativo.");
  const permitidas=typeof empresasPermitidas==="string"
    ?empresasPermitidas.split(",").map(id=>id.trim()).filter(Boolean):[];
  if(!permitidas.includes(empresaId))
    throw Error("Empresa não está na lista explícita de autorização do piloto.");
  return "piloto";
}

module.exports={PROJETO_ORIGINAL,autorizarDestinoOperacional};
