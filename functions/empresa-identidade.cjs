"use strict";
// ID especial e explícito para sandbox empresarial: NÃO é CNPJ de empresa.
const EMPRESA_TESTE_SOMA="empresa_teste_soma";
const EMPRESA_CNPJ=/^empresa_[0-9]{14}$/;
function identificadorEmpresaValido(id){
  return typeof id==="string"&&(EMPRESA_CNPJ.test(id)||id===EMPRESA_TESTE_SOMA);
}
module.exports={EMPRESA_TESTE_SOMA,identificadorEmpresaValido};
