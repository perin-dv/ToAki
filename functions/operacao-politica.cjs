"use strict";

// Validações puras para operações administrativas reais EM HOMOLOGAÇÃO.
const idOk=s=>typeof s==="string"&&/^[A-Za-z0-9_-]{1,128}$/.test(s);
function texto(s,min,max,obrigatorio=true){
  if((s===undefined||s===null||s==="")&&!obrigatorio)return "";
  if(typeof s!=="string")throw Error("Campo inválido.");
  const n=s.trim().replace(/\s+/g," ");
  if(n.length<min||n.length>max)throw Error("Campo fora do tamanho permitido.");
  return n;
}
function validarOperacao(input){
  if(!input||typeof input!=="object"||Array.isArray(input))throw Error("Operação inválida.");
  const {empresaId,tipo,dados}=input;
  if(!idOk(empresaId)||!/^empresa_[0-9]{14}$/.test(empresaId))throw Error("Empresa inválida.");
  if(!dados||typeof dados!=="object"||Array.isArray(dados))throw Error("Dados inválidos.");
  const campos=Object.keys(dados);
  const permitidos={
    cliente:["nome","telefone","endereco"],
    veiculo:["placa","categoria"],
    entregador:["nome","telefone"],
    pedido:["numero_nf","destinatario_id","entregador_id","endereco_entrega"]
  };
  if(!Object.prototype.hasOwnProperty.call(permitidos,tipo))throw Error("Tipo de cadastro inválido.");
  if(campos.some(c=>!permitidos[tipo].includes(c)))throw Error("Campo não autorizado.");
  if(tipo==="cliente")return{empresaId,tipo,dados:{
    nome:texto(dados.nome,3,100),
    telefone:texto(dados.telefone,0,20,false),
    endereco:texto(dados.endereco,0,180,false)
  }};
  if(tipo==="veiculo"){
    const placa=texto(dados.placa,7,7).toUpperCase();
    if(!/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(placa))throw Error("Placa inválida.");
    if(!["Moto","Carro","Van","Caminhão"].includes(dados.categoria))throw Error("Categoria inválida.");
    return{empresaId,tipo,dados:{placa,categoria:dados.categoria}};
  }
  if(tipo==="entregador")return{empresaId,tipo,dados:{
    nome:texto(dados.nome,3,100),
    telefone:texto(dados.telefone,0,20,false)
  }};
  const numero_nf=texto(dados.numero_nf,1,20);
  if(!/^[0-9]{1,20}$/.test(numero_nf))throw Error("Número de NF inválido.");
  if(!idOk(dados.destinatario_id))throw Error("Destinatário inválido.");
  const entregador_id=dados.entregador_id?texto(dados.entregador_id,1,128):"";
  if(entregador_id&&!idOk(entregador_id))throw Error("Entregador inválido.");
  return{empresaId,tipo,dados:{
    numero_nf,
    destinatario_id:dados.destinatario_id,
    entregador_id,
    endereco_entrega:texto(dados.endereco_entrega,5,180)
  }};
}
module.exports={validarOperacao};
