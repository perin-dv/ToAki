"use strict";
const {randomBytes}=require("node:crypto");

// Identificadores novos são pesquisáveis no Firestore sem renomear documentos existentes.
// O sufixo evita colisões entre pessoas com o mesmo nome, sem expor telefone/CPF.
function slug(nome){
  if(typeof nome!=="string")throw Error("Nome inválido.");
  return nome.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase()
    .replace(/[^a-z0-9]+/g,"_").replace(/^_+|_+$/g,"").slice(0,56);
}
function idRegistro(tipo,dados,sufixo=randomBytes(4).toString("hex")){
  if(tipo==="veiculo" && /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(dados.placa))
    return "veiculo_"+dados.placa;
  if(tipo==="pedido"&&/^[0-9]{1,20}$/.test(dados.numero_nf))
    return "nf_"+dados.numero_nf;
  if(["cliente","entregador"].includes(tipo)&&/^[0-9a-f]{8}$/.test(sufixo)){
    const nome=slug(dados.nome);
    if(!nome)throw Error("Nome inválido.");
    return tipo+"_"+nome+"_"+sufixo;
  }
  throw Error("Tipo ou identificador inválido.");
}
const statusLegivel={
  pendente:"Aguardando saída",
  em_rota:"Em rota (status registrado; GPS independente)",
  entregue:"Entrega registrada",
  cancelada:"Cancelada"
};
function situacaoLegivel(status){return statusLegivel[status]||"Não informada";}
function tituloRegistro(tipo,dados,referencias={}){
  if(tipo==="cliente")return "Cliente — "+dados.nome;
  if(tipo==="entregador")return "Entregador — "+dados.nome;
  if(tipo==="veiculo")return "Veículo — "+dados.categoria+" · placa "+dados.placa;
  if(tipo==="pedido")return "NF "+dados.numero_nf+" — "+(referencias.destinatario_nome||"Cliente vinculado");
  throw Error("Tipo inválido.");
}
module.exports={slug,idRegistro,situacaoLegivel,tituloRegistro};
