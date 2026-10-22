/** ID sintético do tenant de testes; nunca é um CNPJ e não libera acesso por si só. */
export const EMPRESA_TESTE_SOMA="empresa_teste_soma";
export function identificadorEmpresaValido(id:unknown):id is string{
  return typeof id==="string"&&(id===EMPRESA_TESTE_SOMA||/^empresa_[0-9]{14}$/.test(id));
}
