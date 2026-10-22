import { getIdTokenResult, type User } from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";
import { collection, getDocs, limit, query, type DocumentData } from "firebase/firestore";
import { db, firebaseApp } from "./firebase";
import { exigirAmbienteOperacional } from "./ambiente";

export type TipoOperacional="cliente"|"veiculo"|"entregador"|"pedido";
export type RegistroOperacional={
  id:string;titulo_registro:string;status:string;nome?:string;
  numero_nf?:string;placa?:string;categoria?:string;telefone?:string;
  cep?:string;logradouro?:string;numero?:string;complemento?:string;bairro?:string;cidade?:string;uf?:string;
  endereco_entrega?:string;criado_em?:unknown;
};
const colecao:Record<TipoOperacional,string>={
  cliente:"clientes",veiculo:"veiculos",entregador:"entregadores_vinculados",pedido:"pedidos"
};
export async function empresaAutorizada(user:User):Promise<string|null>{
  exigirAmbienteOperacional();
  const token=await getIdTokenResult(user,true);
  if(!user.emailVerified)return null;
  const id=token.claims.empresa_id;
  return typeof id==="string" && /^empresa_[0-9]{14}$/.test(id)?id:null;
}
export async function listarRegistros(empresaId:string,tipo:TipoOperacional):Promise<RegistroOperacional[]>{
  exigirAmbienteOperacional();
  if(!/^empresa_[0-9]{14}$/.test(empresaId))throw Error("Empresa inválida.");
  const snap=await getDocs(query(collection(db,"empresas",empresaId,colecao[tipo]),limit(50)));
  return snap.docs.map(doc=>{
    const d:DocumentData=doc.data();
    return{
      id:doc.id,titulo_registro:typeof d.titulo_registro==="string"?d.titulo_registro:"Registro",
      status:typeof d.status==="string"?d.status:"",
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
      endereco_entrega:typeof d.endereco_entrega==="string"?d.endereco_entrega:undefined,
      criado_em:d.criado_em
    };
  });
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
