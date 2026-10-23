import { getIdTokenResult, type User } from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";
import { collection, getDocs, limit, query, onSnapshot, type DocumentData } from "firebase/firestore";
import { db, firebaseApp } from "./firebase";
import { exigirAmbienteOperacional } from "./ambiente";
import {identificadorEmpresaValido} from "./empresaId";

export type TipoOperacional="cliente"|"veiculo"|"entregador"|"pedido";
export type RegistroOperacional={
  id:string;titulo_registro:string;status:string;nome?:string;
  numero_nf?:string;placa?:string;categoria?:string;telefone?:string;
  cep?:string;logradouro?:string;numero?:string;complemento?:string;bairro?:string;cidade?:string;uf?:string;
  endereco_entrega?:string;destinatario_id?:string;entregador_id?:string;veiculo_id?:string;
  ativo?:boolean;criado_em?:unknown;
};
const colecao:Record<TipoOperacional,string>={
  cliente:"clientes",veiculo:"veiculos",entregador:"entregadores_vinculados",pedido:"pedidos"
};
export async function empresaAutorizada(user:User):Promise<string|null>{
  exigirAmbienteOperacional();
  const token=await getIdTokenResult(user,true);
  const id=token.claims.empresa_id;
  // Exceção apenas para conta previamente habilitada por administrador no sandbox.
  const sandbox=(id==="empresa_teste_soma"&&token.claims.toaki_sandbox_tester===true);
  if(!user.emailVerified&&!sandbox)return null;
  return typeof id==="string" && identificadorEmpresaValido(id)?id:null;
}
function converterRegistro(doc:{id:string;data:()=>DocumentData}):RegistroOperacional{
    const d:DocumentData=doc.data();
    return{
      id:doc.id,titulo_registro:typeof d.titulo_registro==="string"?d.titulo_registro:"Registro",
      status:typeof d.status==="string"?d.status:"",
      ativo:d.ativo!==false,
      nome:typeof d.nome==="string"?d.nome:undefined,
      numero_nf:typeof d.numero_nf==="string"?d.numero_nf:undefined,
      placa:typeof d.placa==="string"?d.placa:undefined,
      categoria:typeof d.categoria==="string"?d.categoria:undefined,
      telefone:typeof d.telefone==="string"?d.telefone:undefined,
      cep:typeof d.cep==="string"?d.cep:undefined,
      logradouro:typeof d.logradouro==="string"?d.logradouro:undefined,
      numero:typeof d.numero==="string"?d.numero:undefined,
      complemento:typeof d.complemento==="string"?d.complemento:undefined,
      bairro:typeof d.bairro==="string"?d.bairro:undefined,
      cidade:typeof d.cidade==="string"?d.cidade:undefined,
      uf:typeof d.uf==="string"?d.uf:undefined,
      destinatario_id:typeof d.destinatario_id==="string"?d.destinatario_id:undefined,
      entregador_id:typeof d.entregador_id==="string"?d.entregador_id:undefined,
      veiculo_id:typeof d.veiculo_id==="string"?d.veiculo_id:undefined,
      endereco_entrega:typeof d.endereco_entrega==="string"?d.endereco_entrega:undefined,
      criado_em:d.criado_em
    };
}
function caminho(empresaId:string,tipo:TipoOperacional){
  exigirAmbienteOperacional();
  if(!identificadorEmpresaValido(empresaId))throw Error("Empresa inválida.");
  return query(collection(db,"empresas",empresaId,colecao[tipo]),limit(100));
}
export function escutarRegistros(empresaId:string,tipo:TipoOperacional,receber:(items:RegistroOperacional[])=>void,falha:(erro:Error)=>void){
  return onSnapshot(caminho(empresaId,tipo),snap=>receber(snap.docs.map(converterRegistro)),err=>falha(err));
}
export async function listarRegistros(empresaId:string,tipo:TipoOperacional):Promise<RegistroOperacional[]>{
  const snap=await getDocs(caminho(empresaId,tipo));
  return snap.docs.map(converterRegistro);
}
export async function criarRegistro(empresaId:string,tipo:TipoOperacional,dados:Record<string,string>):Promise<string>{
  exigirAmbienteOperacional();
  if(!/^empresa_[0-9]{14}$/.test(empresaId))throw Error("Empresa inválida.");
  const operar=httpsCallable<
    {empresaId:string;tipo:TipoOperacional;dados:Record<string,string>},
    {ok:boolean;registroId:string}
  >(getFunctions(firebaseApp,"southamerica-east1"),"operarEmpresaHomologacao");
  const {data}=await operar({empresaId,tipo,dados});
  if(!data.ok||!data.registroId)throw Error("A gravação não foi confirmada.");
  return data.registroId;
}

export type AcaoOperacional="atualizar"|"desativar"|"mudar_status";
export async function alterarRegistro(empresaId:string,tipo:TipoOperacional,registroId:string,acao:AcaoOperacional,dados?:Record<string,string>,novoStatus?:string):Promise<void>{
  exigirAmbienteOperacional();
  if(!/^empresa_[0-9]{14}$/.test(empresaId)||!/^[A-Za-z0-9_-]{1,128}$/.test(registroId))
    throw Error("Registro ou empresa inválida.");
  const input=acao==="atualizar"?{empresaId,tipo,registroId,acao,dados}:
    acao==="mudar_status"?{empresaId,tipo,registroId,acao,novoStatus}:{empresaId,tipo,registroId,acao};
  const fn=httpsCallable<typeof input,{ok:boolean}>(getFunctions(firebaseApp,"southamerica-east1"),"alterarRegistroEmpresaPiloto");
  const {data}=await fn(input);
  if(!data.ok)throw Error("O servidor não confirmou a operação.");
}
