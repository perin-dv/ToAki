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
function referenciaOpcional(valor,nome){
  if(valor===undefined||valor===null||valor==="")return "";
  if(!idOk(valor))throw Error(nome+" inválido.");
  return valor;
}
function validarOperacao(input){
  if(!input||typeof input!=="object"||Array.isArray(input))throw Error("Operação inválida.");
  const {empresaId,tipo,dados}=input;
  if(!idOk(empresaId)||!/^empresa_[0-9]{14}$/.test(empresaId))throw Error("Empresa inválida.");
  if(!dados||typeof dados!=="object"||Array.isArray(dados))throw Error("Dados inválidos.");
  const campos=Object.keys(dados);
  const permitidos={
    cliente:["nome","telefone","cep","logradouro","numero","complemento","bairro","cidade","uf"],
    veiculo:["placa","categoria"],
    entregador:["nome","telefone","veiculo_id"],
    pedido:["numero_nf","destinatario_id","entregador_id","veiculo_id","endereco_entrega"]
  };
  if(!Object.prototype.hasOwnProperty.call(permitidos,tipo))throw Error("Tipo de cadastro inválido.");
  if(campos.some(c=>!permitidos[tipo].includes(c)))throw Error("Campo não autorizado.");
  if(tipo==="cliente"){
    const cep=texto(dados.cep,8,9).replace(/\D/g,"");
    if(!/^\d{8}$/.test(cep))throw Error("CEP inválido.");
    const uf=texto(dados.uf,2,2).toUpperCase();
    if(!/^(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)$/.test(uf))throw Error("UF inválida.");
    return{empresaId,tipo,dados:{
      nome:texto(dados.nome,3,100),
      telefone:texto(dados.telefone,0,20,false),
      cep,
      logradouro:texto(dados.logradouro,2,120),
      numero:texto(dados.numero,1,15),
      complemento:texto(dados.complemento,0,80,false),
      bairro:texto(dados.bairro,2,100),
      cidade:texto(dados.cidade,2,100),
      uf
    }};
  }
  if(tipo==="veiculo"){
    const placa=texto(dados.placa,7,7).toUpperCase();
    if(!/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(placa))throw Error("Placa inválida.");
    if(!["Moto","Carro","Van","Caminhão"].includes(dados.categoria))throw Error("Categoria inválida.");
    return{empresaId,tipo,dados:{placa,categoria:dados.categoria}};
  }
  if(tipo==="entregador")return{empresaId,tipo,dados:{
    nome:texto(dados.nome,3,100),
    telefone:texto(dados.telefone,0,20,false),
    veiculo_id:referenciaOpcional(dados.veiculo_id,"Veículo")
  }};
  const numero_nf=texto(dados.numero_nf,1,20);
  if(!/^[0-9]{1,20}$/.test(numero_nf))throw Error("Número de NF inválido.");
  if(!idOk(dados.destinatario_id))throw Error("Destinatário inválido.");
  const entregador_id=referenciaOpcional(dados.entregador_id,"Entregador");
  const veiculo_id=referenciaOpcional(dados.veiculo_id,"Veículo");
  return{empresaId,tipo,dados:{
    numero_nf,
    destinatario_id:dados.destinatario_id,
    entregador_id,veiculo_id,
    endereco_entrega:texto(dados.endereco_entrega,5,180)
  }};
}
function validarAlteracao(input){
  if(!input||typeof input!=="object"||Array.isArray(input))throw Error("Operação inválida.");
  const {empresaId,tipo,registroId,acao,dados,novoStatus}=input;
  if(!/^empresa_[0-9]{14}$/.test(empresaId||""))throw Error("Empresa inválida.");
  if(!idOk(registroId))throw Error("Registro inválido.");
  if(!["cliente","entregador","veiculo","pedido"].includes(tipo))throw Error("Tipo inválido.");
  if(!["atualizar","desativar","mudar_status"].includes(acao))throw Error("Ação inválida.");
  const chaves=["empresaId","tipo","registroId","acao",...(acao==="atualizar"?["dados"]:acao==="mudar_status"?["novoStatus"]:[])];
  if(Object.keys(input).some(k=>!chaves.includes(k)))throw Error("Campo não autorizado.");
  if(acao==="mudar_status"){
    if(tipo!=="pedido"||!["em_rota","entregue","cancelada"].includes(novoStatus))throw Error("Status inválido.");
    return {empresaId,tipo,registroId,acao,novoStatus};
  }
  if(acao==="desativar"){
    if(tipo==="pedido")throw Error("Não desative uma NF; use o status cancelada.");
    return {empresaId,tipo,registroId,acao};
  }
  return {...validarOperacao({empresaId,tipo,dados}),registroId,acao};
}
function validarTransicaoStatus(atual,novo){
  const permitidos={pendente:["em_rota","cancelada"],em_rota:["entregue","cancelada"]};
  if(!(permitidos[atual]||[]).includes(novo))throw Error("Transição de status não permitida.");
  return novo;
}
module.exports={validarOperacao,validarAlteracao,validarTransicaoStatus};
