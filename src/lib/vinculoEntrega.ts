import {getFunctions,httpsCallable} from "firebase/functions";
import {firebaseApp} from "./firebase";
import {exigirAmbienteOperacional} from "./ambiente";

const functions=()=>getFunctions(firebaseApp,"southamerica-east1");
export type ConviteEntrega={empresaId:string;pedidoId:string;token:string;expiraEm:number};
export async function criarConviteEntrega(empresaId:string,pedidoId:string):Promise<ConviteEntrega>{
  exigirAmbienteOperacional();
  const fn=httpsCallable<{empresaId:string;pedidoId:string},{ok:boolean}&ConviteEntrega>(functions(),"criarConviteEntregaPiloto");
  const {data}=await fn({empresaId,pedidoId});
  if(!data.ok||!data.token)throw Error("O servidor não confirmou o convite.");
  return data;
}
export async function resgatarConviteEntrega(empresaId:string,pedidoId:string,token:string){
  exigirAmbienteOperacional();
  const fn=httpsCallable<{empresaId:string;pedidoId:string;token:string},{ok:boolean}>(functions(),"resgatarConviteEntregaPiloto");
  const {data}=await fn({empresaId,pedidoId,token});
  if(!data.ok)throw Error("O servidor não confirmou o vínculo.");
}
export function montarLinkConvite(origem:string,convite:ConviteEntrega){
  // Fragmento URL: nunca enviado ao servidor de Hosting como path/query string.
  const params=new URLSearchParams({
    empresa:convite.empresaId,pedido:convite.pedidoId,codigo:convite.token
  });
  return origem+"/vincular-entrega#"+params.toString();
}
export function lerConvite(hash:string):{empresaId:string;pedidoId:string;token:string}|null{
  const params=new URLSearchParams(hash.replace(/^#/,""));
  const empresaId=params.get("empresa")||"",pedidoId=params.get("pedido")||"",token=params.get("codigo")||"";
  if(!/^empresa_(?:teste_soma|[0-9]{14})$/.test(empresaId)||
    !/^[A-Za-z0-9_-]{1,128}$/.test(pedidoId)||
    !/^[A-Za-z0-9_-]{43}$/.test(token))return null;
  return {empresaId,pedidoId,token};
}
