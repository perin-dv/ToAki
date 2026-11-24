import {getFunctions,httpsCallable} from "firebase/functions";
import {firebaseApp} from "./firebase";
import {exigirAmbienteOperacional} from "./ambiente";
import {identificadorEmpresaValido} from "./empresaId";
export type ConviteMotoboy={ok:boolean;codigo:string;expiraEm:number};
export async function criarConviteMotoboy(empresaId:string,entregadorId:string,email:string):Promise<ConviteMotoboy>{
  exigirAmbienteOperacional();
  if(!identificadorEmpresaValido(empresaId))throw Error("Empresa inválida.");
  const func=httpsCallable<{empresaId:string;entregadorId:string;email:string},ConviteMotoboy>(
    getFunctions(firebaseApp,"southamerica-east1"),"criarConviteMotoboyPiloto");
  const {data}=await func({empresaId,entregadorId,email:email.trim()});
  if(!data.ok||!data.codigo)throw Error("Código não confirmado pelo servidor.");
  return data;
}
