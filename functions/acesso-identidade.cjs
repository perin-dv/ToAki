"use strict";
// Contas de testes liberadas manualmente pelo Firebase Admin SDK podem operar
// SOMENTE no sandbox Soma. Isso não verifica nem altera o e-mail da conta.
const {EMPRESA_TESTE_SOMA}=require("./empresa-identidade.cjs");
function podeOperarEmpresa({empresaId,claims}){
  if(!claims||typeof claims!=="object")return false;
  if(claims.email_verified===true)return true;
  return empresaId===EMPRESA_TESTE_SOMA &&
    claims.toaki_sandbox_tester===true &&
    claims.empresa_id===EMPRESA_TESTE_SOMA;
}
module.exports={podeOperarEmpresa};
