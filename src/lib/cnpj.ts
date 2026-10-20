export function normalizarCnpj(value:string) {
  return value.replace(/[^0-9]/g,"");
}

// Validação numérica tradicional (CNPJ alfanumérico será contemplado posteriormente).
export function validarCnpj(value:string) {
  const digits=normalizarCnpj(value);
  if(digits.length!==14 || /^(\d)\1{13}$/.test(digits))return false;
  for(let size=12;size<=13;size++){
    const weights=size===12?[5,4,3,2,9,8,7,6,5,4,3,2]:[6,5,4,3,2,9,8,7,6,5,4,3,2];
    const sum=weights.reduce((s,w,i)=>s+Number(digits[i])*w,0);
    const expected=sum%11<2?0:11-sum%11;
    if(Number(digits[size])!==expected)return false;
  }
  return true;
}
export type DadosCnpj = {cnpj:string; razao_social:string; nome_fantasia:string; municipio:string; uf:string; cep:string; logradouro:string; numero:string; bairro:string; situacao_cadastral:string};
export async function consultarCnpj(cnpj:string):Promise<DadosCnpj>{
  const response=await fetch("https://brasilapi.com.br/api/cnpj/v1/"+encodeURIComponent(normalizarCnpj(cnpj)),{headers:{"Accept":"application/json"}});
  if(!response.ok) throw new Error("Consulta ao CNPJ indisponível. Confira os dados ou tente novamente.");
  const data:unknown=await response.json();
  if(typeof data!=="object" || data===null)throw new Error("Resposta inválida do serviço de CNPJ.");
  const obj=data as Record<string,unknown>;
  const field=(key:string)=>typeof obj[key]==="string"?String(obj[key]):"";
  return {cnpj:field("cnpj"),razao_social:field("razao_social"),nome_fantasia:field("nome_fantasia"),municipio:field("municipio"),uf:field("uf"),cep:field("cep"),logradouro:field("logradouro"),numero:field("numero"),bairro:field("bairro"),situacao_cadastral:field("descricao_situacao_cadastral")};
}
