import {getFunctions,httpsCallable} from "firebase/functions";
import {firebaseApp} from "./firebase";
import {exigirAmbienteOperacional} from "./ambiente";
const fn=()=>getFunctions(firebaseApp,"southamerica-east1");
export type PapelEquipe="gestor"|"vendedor";
export type ConviteEquipe={empresaId:string;conviteId:string;token:string;expiraEm:number};
export async function convidarEquipe(empresaId:string,email:string,papel:PapelEquipe):Promise<ConviteEquipe>{
  exigirAmbienteOperacional();
  const call=httpsCallable<{empresaId:string;email:string;papel:PapelEquipe},{ok:boolean}&ConviteEquipe>(fn(),"criarConviteEquipePiloto");
  const {data}=await call({empresaId,email,papel});
  if(!data.ok||!data.token)throw Error("Convite não confirmado.");
  return data;
}
export function linkEquipe(origem:string,c:ConviteEquipe){
  const hash=new URLSearchParams({empresa:c.empresaId,convite:c.conviteId,codigo:c.token});
  return origem+"/vincular-equipe#"+hash.toString();
}
export function lerConviteEquipe(hash:string):{empresaId:string;conviteId:string;token:string}|null{
  const p=new URLSearchParams(hash.replace(/^#/,""));
  const empresaId=p.get("empresa")||"",conviteId=p.get("convite")||"",token=p.get("codigo")||"";
  if(!/^empresa_(?:teste_soma|[0-9]{14})$/.test(empresaId)
    ||!/^conv_[A-Za-z0-9_-]{16,32}$/.test(conviteId)
    ||!/^[A-Za-z0-9_-]{43}$/.test(token))return null;
  return {empresaId,conviteId,token};
}
export async function aceitarConviteEquipe(empresaId:string,conviteId:string,token:string){
  exigirAmbienteOperacional();
  const call=httpsCallable<{empresaId:string;conviteId:string;token:string},{ok:boolean}>(fn(),"aceitarConviteEquipePiloto");
  const {data}=await call({empresaId,conviteId,token});
  if(!data.ok)throw Error("Não foi possível confirmar o convite.");
}
export async function desativarMembro(empresaId:string,funcionarioId:string){
  exigirAmbienteOperacional();
  const call=httpsCallable<{empresaId:string;funcionarioId:string},{ok:boolean}>(fn(),"desativarFuncionarioPiloto");
  const {data}=await call({empresaId,funcionarioId});
  if(!data.ok)throw Error("A desativação não foi confirmada.");
}
