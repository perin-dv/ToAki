import {useCallback,useEffect,useRef,useState} from "react";
import {mensagemErroGps,validarPontoGps,type PontoGpsLocal} from "../lib/gpsMotoboy";

type EstadoGps="desligado"|"solicitando"|"ligado"|"pausado";

/**
 * Mapa da localização do próprio dispositivo, independente de empresa,
 * entregador, moto ou NF. Não envia localização ao Firebase nem prova
 * rastreamento de entregas. O usuário consente com GPS + mapa externo.
 */
export default function MapaGpsAparelho(){
  const observador=useRef<number|null>(null);
  const [estado,setEstado]=useState<EstadoGps>("desligado");
  const [ponto,setPonto]=useState<PontoGpsLocal|null>(null);
  const [aviso,setAviso]=useState("");

  const parar=useCallback((proximo:EstadoGps="desligado")=>{
    if(observador.current!==null){
      navigator.geolocation.clearWatch(observador.current);
      observador.current=null;
    }
    setEstado(proximo);
    setPonto(null);
  },[]);

  useEffect(()=>{
    // Não continuar lendo o dispositivo quando o usuário deixar o painel.
    const visibilidade=()=>{
      if(document.visibilityState==="hidden"&&observador.current!==null)parar("pausado");
    };
    document.addEventListener("visibilitychange",visibilidade);
    return()=>{
      document.removeEventListener("visibilitychange",visibilidade);
      if(observador.current!==null){
        navigator.geolocation.clearWatch(observador.current);
        observador.current=null;
      }
    };
  },[parar]);

  const iniciar=()=>{
    setAviso("");
    if(!window.isSecureContext){
      setAviso("O GPS exige HTTPS ou localhost confiável.");
      return;
    }
    if(!("geolocation" in navigator)){
      setAviso("Este aparelho ou navegador não disponibiliza localização.");
      return;
    }
    if(observador.current!==null)return;
    setEstado("solicitando");
    setPonto(null);
    try{
      observador.current=navigator.geolocation.watchPosition(
        posicao=>{
          const resultado=validarPontoGps(posicao.coords,posicao.timestamp);
          if(!resultado.valido){
            setPonto(null);
            setAviso(resultado.motivo);
            return;
          }
          setPonto(resultado.ponto);
          setEstado("ligado");
          setAviso("");
        },
        erro=>{
          const mensagem=mensagemErroGps(erro);
          if(erro.code===1)parar();
          setAviso(mensagem);
        },
        {enableHighAccuracy:true,maximumAge:0,timeout:20000}
      );
    }catch{
      parar();
      setAviso("Não foi possível iniciar a localização deste aparelho.");
    }
  };
  // Coordenadas aproximadas no embed evitam recarregar o mapa a cada oscilação
  // inferior a ~1 metro; os valores precisos permanecem visíveis no texto.
  const urlMapa=ponto
    ?"https://www.google.com/maps?q="+ponto.latitude.toFixed(5)+","+ponto.longitude.toFixed(5)+"&z=17&output=embed"
    :"";
  const horario=ponto?new Date(ponto.horario).toLocaleTimeString("pt-BR"):"";
  return <section className="panel gps-local-panel" aria-label="Mapa GPS deste aparelho">
    <div className="panel-head gps-local-heading">
      <div><h2>GPS do meu aparelho</h2><p className="helper">Localização real do dispositivo, sem precisar cadastrar moto ou entrega.</p></div>
      <span className={"gps-mobile-indicador "+(estado==="ligado"?"gps-mobile-ativo":"")} aria-live="polite">
        {estado==="ligado"?"GPS ativo":estado==="solicitando"?"Buscando GPS":estado==="pausado"?"Pausado":"GPS desligado"}
      </span>
    </div>
    {ponto?<iframe className="gps-local-frame" title="Mapa da localização autorizada deste aparelho"
      src={urlMapa} loading="lazy" referrerPolicy="no-referrer"/>:
      <div className="real-map-empty gps-local-placeholder">
        <strong>Localização ainda não ativada</strong>
        <p>O mapa mostrará somente o lugar informado pelo GPS deste aparelho, quando você permitir. Não usamos marcadores fictícios.</p>
      </div>}
    <div className="gps-local-actions">
      <button type="button" className="primary" disabled={estado==="ligado"||estado==="solicitando"} onClick={iniciar}>Ativar GPS e abrir mapa</button>
      {(estado==="ligado"||estado==="solicitando")&&
        <button type="button" className="secondary" onClick={()=>parar()}>Desligar GPS</button>}
    </div>
    {ponto&&<p className="gps-local-coordinates">
      Latitude: {ponto.latitude.toFixed(6)} · Longitude: {ponto.longitude.toFixed(6)} ·
      Precisão informada: {ponto.precisaoMetros} m · Atualização: {horario}
    </p>}
    {aviso&&<p className="form-error" role="alert">{aviso}</p>}
    <p className="helper">Ao ativar, você autoriza o navegador a obter sua posição e o Google Maps a recebê-la para exibir o mapa.
      O toAki não grava esta leitura no Firestore, não a transmite à empresa e não acompanha uma entrega.
      A leitura para quando você desliga, sai da página ou deixa a aba em segundo plano.</p>
  </section>;
}
