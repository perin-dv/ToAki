export type EnderecoCep={cep:string;logradouro:string;numero:string;complemento:string;bairro:string;cidade:string;uf:string};
export const enderecoVazio=():EnderecoCep=>({cep:"",logradouro:"",numero:"",complemento:"",bairro:"",cidade:"",uf:""});
export const cepNumeros=(cep:string)=>cep.replace(/\D/g,"").slice(0,8);
export const formatarCep=(cep:string)=>{const c=cepNumeros(cep);return c.length>5?c.slice(0,5)+"-"+c.slice(5):c};
export const enderecoCompleto=(e:EnderecoCep)=>[e.logradouro,e.numero,e.complemento,e.bairro,e.cidade,e.uf].filter(Boolean).join(", ");
export function validarEndereco(e:EnderecoCep):string|null {
  if(cepNumeros(e.cep).length!==8)return "Informe um CEP de 8 dígitos.";
  if(e.logradouro.trim().length<2)return "Informe o logradouro (rua/avenida).";
  if(!e.numero.trim())return "Informe o número do endereço ou S/N.";
  if(e.bairro.trim().length<2)return "Informe o bairro.";
  if(e.cidade.trim().length<2)return "Informe a cidade.";
  if(!/^[A-Z]{2}$/.test(e.uf.trim().toUpperCase()))return "Informe a UF com 2 letras.";
  return null;
}
type ViaCep={erro?:boolean;cep?:string;logradouro?:string;bairro?:string;localidade?:string;uf?:string};
type BrasilApi={cep?:string;street?:string;neighborhood?:string;city?:string;state?:string};
export async function consultarCep(cep:string,signal?:AbortSignal):Promise<Pick<EnderecoCep,"cep"|"logradouro"|"bairro"|"cidade"|"uf">|null> {
  const n=cepNumeros(cep);
  if(n.length!==8)throw new Error("CEP precisa ter 8 dígitos.");
  const get=async(url:string)=>{
    const res=await fetch(url,{signal,headers:{Accept:"application/json"}});
    if(!res.ok)throw new Error("Consulta indisponível");
    return res.json();
  };
  try{
    const raw=await get("https://viacep.com.br/ws/"+n+"/json/") as ViaCep;
    if(raw.erro===true)return null;
    if(raw.localidade&&raw.uf){
      return {cep:formatarCep(n),logradouro:raw.logradouro||"",bairro:raw.bairro||"",cidade:raw.localidade,uf:raw.uf.toUpperCase()};
    }
  }catch(error){if(signal?.aborted)throw error}
  const raw=await get("https://brasilapi.com.br/api/cep/v1/"+n) as BrasilApi;
  if(!raw.city||!raw.state)return null;
  return {cep:formatarCep(n),logradouro:raw.street||"",bairro:raw.neighborhood||"",cidade:raw.city,uf:raw.state.toUpperCase()};
}
