import {useCallback,useEffect,useRef,useState} from "react";
import {Link,useNavigate} from "react-router-dom";
import {signOut} from "firebase/auth";
import Brand from "../components/Brand";
import MenuIcon from "../components/MenuIcon";
import {useAuth} from "../auth/AuthProvider";
import {auth} from "../lib/firebase";
import {mensagemErroGps,validarPontoGps,type PontoGpsLocal} from "../lib/gpsMotoboy";

type EstadoGps="desligado"|"solicitando"|"ligado"|"pausado";

export default function GpsMotoboyPage(){
  const {user,role}=useAuth();
  const navegar=useNavigate();
  const observador=useRef<number|null>(null);
  const [estado,setEstado]=useState<EstadoGps>("desligado");
  const [ponto,setPonto]=useState<PontoGpsLocal|null>(null);
  const [aviso,setAviso]=useState("");
  const [saindo,setSaindo]=useState(false);

  const parar=useCallback((motivo:EstadoGps="desligado")=>{
    if(observador.current!==null){
      navigator.geolocation.clearWatch(observador.current);
      observador.current=null;
    }
    setEstado(motivo);
    setPonto(null);
  },[]);

  useEffect(()=>{
    // Consentimento válido apenas enquanto este painel estiver aberto e visível.
    const visibilidade=()=>{
      if(document.visibilityState==="hidden"){
        if(observador.current!==null)parar("pausado");
      }
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
    if(role!=="entregador" || !user){
      setAviso("Conta sem vínculo de entregador. Solicite acesso à empresa.");
      return;
    }
    if(observador.current!==null)return;
    if(!window.isSecureContext){
      setAviso("O GPS precisa de um site HTTPS ou de localhost.");
      return;
    }
    if(!("geolocation" in navigator)){
      setAviso("Este dispositivo ou navegador não oferece GPS.");
      return;
    }
    setEstado("solicitando");
    setPonto(null);
    try{
      observador.current=navigator.geolocation.watchPosition(
        posicao=>{
          const resultado=validarPontoGps(posicao.coords,posicao.timestamp);
          if(!resultado.valido){
            setAviso(resultado.motivo);
            setPonto(null);
            return;
          }
          setPonto(resultado.ponto);
          setEstado("ligado");
          setAviso("");
        },
        erro=>{
          const mensagem=mensagemErroGps(erro);
          setAviso(mensagem);
          if(erro.code===1)parar();
        },
        {enableHighAccuracy:true,maximumAge:0,timeout:20000}
      );
    }catch{
      parar();
      setAviso("Não foi possível acessar o GPS. Verifique as permissões do celular.");
    }
  };
  const sair=async()=>{
    parar();
    setSaindo(true);
    try{await signOut(auth);navegar("/login",{replace:true});}
    catch{setSaindo(false);setAviso("Não foi possível sair. Tente novamente.");}
  };
  const coordenadas=!!ponto;
  const horario=ponto?new Date(ponto.horario).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit",second:"2-digit"}):"—";
  const mapa=ponto?"https://www.google.com/maps?q="+encodeURIComponent(
    ponto.latitude.toFixed(6)+","+ponto.longitude.toFixed(6)):"";
  return <div className="gps-mobile-page">
    <header className="gps-mobile-header">
      <Brand compact/>
      <div className="gps-mobile-header-actions">
        <span className="gps-mobile-user">{user?.displayName||"Entregador"}</span>
        <button type="button" className="secondary" disabled={saindo} onClick={()=>void sair()}>{saindo?"Saindo...":"Sair"}</button>
      </div>
    </header>
    <main className="gps-mobile-content">
      <div className="gps-mobile-heading">
        <div className="gps-mobile-eyebrow"><MenuIcon name="entregadores" size={18}/> ÁREA DO MOTOBOY</div>
        <h1>Minha localização</h1>
        <p>Confira o GPS do seu celular antes de iniciar uma entrega.</p>
      </div>
      <section className="panel gps-mobile-card" aria-label="Leitura do GPS">
        <div className="gps-mobile-title">
          <div><h2>GPS do aparelho</h2><p className="helper">Somente leitura local, sem envio automático.</p></div>
          <span className={"gps-mobile-indicador "+(estado==="ligado"?"gps-mobile-ativo":"")}>
            {estado==="ligado"?"GPS ativo":estado==="solicitando"?"Obtendo sinal":estado==="pausado"?"Pausado":"Desligado"}
          </span>
        </div>
        <div className="gps-mobile-status" aria-live="polite">
          <span className="gps-mobile-target" aria-hidden="true"><MenuIcon name="entregadores" size={32}/></span>
          <strong>{coordenadas?"Localização encontrada":estado==="solicitando"?"Aguardando autorização e sinal GPS":"GPS não iniciado"}</strong>
          <p>{coordenadas?"A posição foi atualizada neste dispositivo.":estado==="pausado"?"A leitura foi interrompida ao sair desta tela.":"Ative somente quando quiser visualizar sua posição."}</p>
        </div>
        {coordenadas&&ponto&&<div className="gps-mobile-metricas">
          <div><small>Latitude</small><strong>{ponto.latitude.toFixed(6)}</strong></div>
          <div><small>Longitude</small><strong>{ponto.longitude.toFixed(6)}</strong></div>
          <div><small>Precisão aproximada</small><strong>{ponto.precisaoMetros} m</strong></div>
          <div><small>Última leitura</small><strong>{horario}</strong></div>
        </div>}
        {aviso&&<p className="form-error" role="alert">{aviso}</p>}
        <div className="gps-mobile-actions">
          {estado==="ligado"||estado==="solicitando"
            ?<button type="button" className="secondary" onClick={()=>parar()}>Desligar GPS</button>
            :<button type="button" className="primary" onClick={iniciar}>Ativar GPS neste aparelho</button>}
          {mapa&&<a className="secondary button-link" href={mapa} target="_blank" rel="noopener noreferrer">
            Abrir posição no Google Maps ↗
          </a>}
        </div>
        {coordenadas&&<p className="helper">Ao abrir o Google Maps, você compartilha essa posição com o Google. Isso não envia sua posição ao toAki.</p>}
      </section>
      <section className="panel gps-mobile-card">
        <h2>Entregas atribuídas</h2>
        <p className="subheading">A associação entre a conta do entregador e uma entrega em rota ainda precisa ser ativada no Firebase.</p>
        <div className="gps-mobile-empty">
          <MenuIcon name="entregas" size={25}/>
          <strong>Nenhuma entrega sincronizada neste estágio</strong>
          <p>Assim que seu vínculo empresarial e as permissões de rastreamento forem liberados, as rotas poderão aparecer aqui.</p>
        </div>
      </section>
      <section className="gps-mobile-privacy" aria-label="Privacidade e compartilhamento">
        <strong>Privacidade da localização</strong>
        <p>Esta etapa só testa o GPS do telefone. A posição não é gravada no Firestore, não aparece no painel da empresa e não é compartilhada com clientes. O envio dependerá de uma entrega atribuída, autorização explícita e regras de acesso próprias.</p>
        <p>O navegador ou PWA pode suspender o GPS quando o celular bloquear ou o aplicativo ficar em segundo plano.</p>
      </section>
      <Link to="/inicio" className="gps-mobile-bottom-link">Voltar ao início</Link>
    </main>
  </div>;
}
