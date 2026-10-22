// APENAS SIMULAÇÃO LOCAL. Este módulo NÃO envia dados ao Firebase nem compartilha entre usuários.
// Não usar dados reais de pessoas, placas, clientes ou notas fiscais nesta demonstração.
export type EstadoEntrega = "Aguardando coleta" | "Em rota" | "Entregue" | "Cancelada";
export type DemoVeiculo = {id:string;placa:string;tipo:"Moto"|"Carro"|"Van"};
export type DemoEntregador = {id:string;nome:string;veiculoId:string};
export type DemoEntrega = {id:string;nf:string;destinatario:string;destino:string;entregadorId:string;status:EstadoEntrega};
export type DemoEvento = {id:string;descricao:string;data:string};
export type DemoDados = {versao:1;veiculos:DemoVeiculo[];entregadores:DemoEntregador[];entregas:DemoEntrega[];historico:DemoEvento[]};

export const DADOS_INICIAIS:DemoDados={
  versao:1,
  veiculos:[
    {id:"v1",placa:"ABC1D23",tipo:"Moto"},
    {id:"v2",placa:"DEF4G56",tipo:"Moto"}
  ],
  entregadores:[
    {id:"m1",nome:"João Silva",veiculoId:"v1"},
    {id:"m2",nome:"Carlos Lima",veiculoId:"v2"}
  ],
  entregas:[
    {id:"n1",nf:"0045821",destinatario:"Oficina Exemplo A",destino:"Zona 07, Maringá",entregadorId:"m1",status:"Em rota"},
    {id:"n2",nf:"0045822",destinatario:"Oficina Exemplo B",destino:"Jardim Alvorada",entregadorId:"m2",status:"Em rota"},
    {id:"n3",nf:"0045823",destinatario:"Oficina Exemplo C",destino:"Centro, Maringá",entregadorId:"",status:"Aguardando coleta"}
  ],
  historico:[]
};

const STATUS:ReadonlyArray<EstadoEntrega>=["Aguardando coleta","Em rota","Entregue","Cancelada"];
const prefixo="toaki:simulacao-fase-b:v1:";
export function chaveDeSimulacao(uid:string) {return prefixo+uid;}
export function dadosIniciais():DemoDados {return JSON.parse(JSON.stringify(DADOS_INICIAIS)) as DemoDados;}
export function carregarDados(uid:string):DemoDados {
  try {
    const raw=sessionStorage.getItem(chaveDeSimulacao(uid));
    if(!raw)return dadosIniciais();
    const parsed:unknown=JSON.parse(raw);
    if(!parsed || typeof parsed!=="object")return dadosIniciais();
    const d=parsed as Partial<DemoDados>;
    if(d.versao!==1||!Array.isArray(d.entregas)||!Array.isArray(d.entregadores)||!Array.isArray(d.veiculos)||!Array.isArray(d.historico))return dadosIniciais();
    if(d.entregas.length>100||d.entregadores.length>50||d.veiculos.length>50||d.historico.length>100)return dadosIniciais();
    if(d.entregas.some(x=>typeof x?.nf!=="string"||!STATUS.includes(x.status)))return dadosIniciais();
    return d as DemoDados;
  } catch {return dadosIniciais();}
}
export function salvarDados(uid:string,dados:DemoDados):void {
  try{sessionStorage.setItem(chaveDeSimulacao(uid),JSON.stringify(dados));}catch{/* Modo privado pode impedir armazenamento; a sessão ainda funciona na memória. */}
}
export function limparDados(uid:string):void {
  try{sessionStorage.removeItem(chaveDeSimulacao(uid));}catch{/* Nada armazenado. */}
}
export function novoId():string {
  return typeof crypto!=="undefined" && typeof crypto.randomUUID==="function"
    ?crypto.randomUUID()
    :String(Date.now())+"-"+String(Math.random()).slice(2);
}
export function registrar(d:DemoDados,descricao:string):DemoDados {
  const event:DemoEvento={id:novoId(),descricao,data:new Date().toLocaleString("pt-BR")};
  return {...d,historico:[event,...d.historico].slice(0,40)};
}
export function proximoEstado(atual:EstadoEntrega):ReadonlyArray<EstadoEntrega> {
  if(atual==="Aguardando coleta")return ["Em rota","Cancelada"];
  if(atual==="Em rota")return ["Entregue","Cancelada"];
  return [];
}
export function placasValidas(placa:string):boolean {
  return /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(placa.trim().toUpperCase());
}
export function validarNota(nf:string):boolean {return /^[0-9]{1,9}$/.test(nf.trim());}
