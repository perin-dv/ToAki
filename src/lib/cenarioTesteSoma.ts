import {getFunctions,httpsCallable} from "firebase/functions";
import {firebaseApp} from "./firebase";
import {exigirAmbienteOperacional} from "./ambiente";
export type CenarioSoma={ok:boolean;jaExistia:boolean;numeroNF:string;
  idCliente:string;idVeiculo:string;idEntregador:string;idPedido:string};
export async function criarCenarioTesteSoma():Promise<CenarioSoma>{
  exigirAmbienteOperacional();
  const chamar=httpsCallable<Record<string,never>,CenarioSoma>(
    getFunctions(firebaseApp,"southamerica-east1"),"criarCenarioEntregaTesteSoma");
  const {data}=await chamar({});
  if(!data.ok||!data.idPedido)throw Error("O servidor não confirmou os registros de teste.");
  return data;
}
