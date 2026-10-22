import {getFunctions,httpsCallable} from "firebase/functions";
import {firebaseApp} from "./firebase";
import {exigirAmbienteOperacional} from "./ambiente";

const functions=()=>{exigirAmbienteOperacional();return getFunctions(firebaseApp,"southamerica-east1");};
const invoke=async <I,O>(name:string,input:I):Promise<O>=>{
  const {data}=await httpsCallable<I,O>(functions(),name)(input);
  return data;
};
export const criarConviteEntregador=(empresaId:string,entregadorId:string)=>
  invoke<{empresaId:string;entregadorId:string},{token:string;expiraEm:number}>("criarConviteEntregadorPiloto",{empresaId,entregadorId});
export const aceitarConviteEntregador=(token:string)=>
  invoke<{token:string},{ok:boolean;empresaId:string;entregadorId:string}>("aceitarConviteEntregadorPiloto",{token});
export const iniciarEntrega=(empresaId:string,pedidoId:string,entregadorId:string)=>
  invoke<{empresaId:string;pedidoId:string;entregadorId:string},{ok:boolean}>("iniciarEntregaPiloto",{empresaId,pedidoId,entregadorId});
export const enviarGpsEntrega=(pedidoId:string,latitude:number,longitude:number,precisao:number)=>
  invoke<{pedidoId:string;latitude:number;longitude:number;precisao:number},{ok:boolean}>("enviarGpsEntregaPiloto",{pedidoId,latitude,longitude,precisao});
export const concluirEntrega=(pedidoId:string)=>
  invoke<{pedidoId:string},{ok:boolean}>("concluirEntregaPiloto",{pedidoId});
