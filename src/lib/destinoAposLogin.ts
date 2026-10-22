// Redirecionamentos só podem apontar para rotas internas previamente autorizadas.
// Convites nunca abrem URLs externas e não são salvos em armazenamento permanente.
const conviteDeEntregador=/^\/entregador\?convite=empresa_[0-9]{14}\.[0-9a-f]{32}\.[0-9a-f]{64}$/;
export function destinoAposLogin(origem:unknown):string{
  if(origem==="/cadastro/empresa/dados")return "/cadastro/empresa/dados";
  if(typeof origem==="string"&&conviteDeEntregador.test(origem))return origem;
  return "/inicio";
}
export function ehConviteEntregador(origem:string):boolean{
  return conviteDeEntregador.test(origem);
}
