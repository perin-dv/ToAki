/**
 * GPS do entregador: leitura local, sem envio automático ao Firebase.
 * A gravação exige um vínculo de motorista autenticado + pedido em rota e
 * regras revisadas, que não estão implantados no piloto atual.
 */
export type PontoGpsLocal = {
  latitude: number;
  longitude: number;
  precisaoMetros: number;
  horario: number;
};
export const PRECISAO_MAXIMA_METROS = 200;
export type ResultadoGps =
  | {valido:true;ponto:PontoGpsLocal}
  | {valido:false;motivo:string};

export function validarPontoGps(
  coordenadas:Pick<GeolocationCoordinates,"latitude"|"longitude"|"accuracy">,
  horario:number,
  agora:number=Date.now()
):ResultadoGps{
  const {latitude,longitude,accuracy}=coordenadas;
  if (![latitude,longitude,accuracy,horario,agora].every(Number.isFinite) ||
    latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180)
    return {valido:false,motivo:"O aparelho retornou coordenadas inválidas."};
  if (accuracy < 0 || accuracy > PRECISAO_MAXIMA_METROS)
    return {valido:false,motivo:"Precisão baixa. Vá para uma área aberta e tente novamente."};
  if (horario > agora + 30000 || agora - horario > 60000)
    return {valido:false,motivo:"Posição desatualizada. Aguardando uma nova leitura do GPS."};
  return {valido:true,ponto:{
    latitude,longitude,precisaoMetros:Math.round(accuracy),horario
  }};
}

export function mensagemErroGps(erro:GeolocationPositionError):string{
  if(erro.code===1)return "Permissão de localização negada. Libere o GPS nas configurações do navegador.";
  if(erro.code===2)return "O aparelho não conseguiu obter sua localização. Confira o sinal GPS.";
  if(erro.code===3)return "Tempo esgotado ao buscar a localização. Tente novamente em um lugar aberto.";
  return "Não foi possível iniciar o GPS neste aparelho.";
}
