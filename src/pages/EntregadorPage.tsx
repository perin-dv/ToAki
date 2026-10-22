import {useCallback,useEffect,useRef,useState} from "react";
import {Link,useNavigate,useSearchParams} from "react-router-dom";
import {collection,doc,getDoc,getDocs} from "firebase/firestore";
import {db} from "../lib/firebase";
import {useAuth} from "../auth/AuthProvider";
import Brand from "../components/Brand";
import {ambienteOperacional} from "../lib/ambiente";
import {aceitarConviteEntregador,enviarGpsEntrega,concluirEntrega} from "../lib/rastreamento";

type Tarefa={id:string;empresa_id:string;numero_nf:string;endereco_entrega:string;status:string};
type Vinculo={empresa_id:string;entregador_id:string;ativo:boolean};
export default function EntregadorPage(){
  const {user,refreshClaims}=useAuth();
  const navigate=useNavigate();
  const [params]=useSearchParams();
  const [tarefas,setTarefas]=useState<Tarefa[]>([]);
  const [vinculo,setVinculo]=useState<Vinculo|null>(null);
  const [selecionada,setSelecionada]=useState("");
  const [carregando,setCarregando]=useState(true);
  const [conectando,setConectando]=useState(false);
  const [finalizando,setFinalizando]=useState(false);
  const [erro,setErro]=useState("");
  const [mensagem,setMensagem]=useState("");
  const [rastreando,setRastreando]=useState(false);
  const [ultimoEnvio,setUltimoEnvio]=useState<string|null>(null);
  const watchId=useRef<number|null>(null);
  const envioPendente=useRef(false);
  const ultimoMomento=useRef(0);
  const token=params.get("convite")||"";
  useEffect(()=>{
    const manifest=document.querySelector('link[rel="manifest"]');
    const anterior=manifest?.getAttribute("href")||"/manifest.webmanifest";
    manifest?.setAttribute("href","/manifest-entregador.webmanifest");
    const titleAnterior=document.title;
    document.title="toAki Entregador — Minhas Entregas";
    return ()=>{manifest?.setAttribute("href",anterior);document.title=titleAnterior;};
  },[]);
  const parar=useCallback(()=>{
    if(watchId.current!==null&&typeof navigator!=="undefined"&&navigator.geolocation){
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current=null;
    }
    setRastreando(false);
  },[]);
  const recarregar=useCallback(async()=>{
    if(!user||!ambienteOperacional){setCarregando(false);return;}
    setCarregando(true);
    try{
      const snap=await getDoc(doc(db,"entregadores",user.uid));
      if(snap.exists()&&snap.data().ativo===true){
        const v=snap.data() as Vinculo;
        setVinculo(v);
        const itens=await getDocs(collection(db,"entregadores",user.uid,"tarefas"));
        setTarefas(itens.docs.map(item=>{
          const d=item.data();
          return {id:item.id,empresa_id:String(d.empresa_id||""),
            numero_nf:String(d.numero_nf||item.id),endereco_entrega:String(d.endereco_entrega||""),
            status:String(d.status||"pendente")};
        }));
      }else{setVinculo(null);setTarefas([]);}
    }catch{
      setErro("Não foi possível consultar suas entregas. Verifique seu login e permissões.");
    }finally{setCarregando(false);}
  },[user]);
  useEffect(()=>{void recarregar();},[recarregar]);
  useEffect(()=>{
    const aoOcultar=()=>{if(document.visibilityState!=="visible"){parar();setMensagem("Rastreamento pausado: mantenha o app aberto para enviar localização.");}};
    document.addEventListener("visibilitychange",aoOcultar);
    return()=>{document.removeEventListener("visibilitychange",aoOcultar);parar();};
  },[parar]);
  const aceitar=async()=>{
    if(!token||!user?.emailVerified)return;
    parar();setErro("");setMensagem("");setConectando(true);
    try{
      await aceitarConviteEntregador(token);
      await refreshClaims();
      navigate("/entregador",{replace:true});
      setMensagem("Aplicativo vinculado à empresa. Atualize a lista para ver suas entregas.");
      await recarregar();
    }catch(e){setErro(e instanceof Error?e.message:"Não foi possível confirmar o convite.");}
    finally{setConectando(false);}
  };
  const iniciarGps=()=>{
    if(!selecionada||!vinculo||!user?.emailVerified)return;
    const tarefa=tarefas.find(t=>t.id===selecionada);
    if(!tarefa||tarefa.status!=="em_rota"){setErro("Selecione uma entrega em rota.");return;}
    if(!("geolocation" in navigator)){setErro("Este celular não oferece geolocalização pelo navegador.");return;}
    if(!window.isSecureContext){setErro("GPS exige HTTPS. Acesse pelo link seguro do aplicativo.");return;}
    if(watchId.current!==null)return;
    setErro("");setMensagem("Solicitando permissão de localização...");
    watchId.current=navigator.geolocation.watchPosition(pos=>{
      if(document.visibilityState!=="visible")return;
      if(pos.coords.accuracy>200){setMensagem("Aguardando GPS com precisão melhor que 200 metros.");return;}
      const agora=Date.now();
      if(envioPendente.current||agora-ultimoMomento.current<15000)return;
      envioPendente.current=true;
      enviarGpsEntrega(selecionada,pos.coords.latitude,pos.coords.longitude,pos.coords.accuracy)
        .then(()=>{ultimoMomento.current=Date.now();setUltimoEnvio(new Date().toLocaleTimeString("pt-BR"));setMensagem("Localização enviada para a empresa.");})
        .catch(e=>{const texto=e instanceof Error?e.message:"Falha no envio do GPS.";setErro(texto);parar();})
        .finally(()=>{envioPendente.current=false;});
    },e=>{
      setErro(e.code===1?"Permissão de GPS negada. Ative a localização e tente novamente.":"GPS indisponível. Confira sinal e permissões.");
      parar();
    },{enableHighAccuracy:true,maximumAge:5000,timeout:15000});
    setRastreando(true);
  };
  const finalizar=async()=>{
    if(!selecionada)return;
    parar();setFinalizando(true);setErro("");setMensagem("");
    try{await concluirEntrega(selecionada);setMensagem("Entrega concluída. GPS interrompido.");setSelecionada("");await recarregar();}
    catch(e){setErro(e instanceof Error?e.message:"Não foi possível concluir.");}
    finally{setFinalizando(false);}
  };
  const tarefaAtiva=tarefas.find(t=>t.id===selecionada);
  if(!user)return <p>Faça login para abrir seu aplicativo de entregas.</p>;
  return <div className="private-app courier-page">
    <header className="private-header"><Brand compact/><Link className="courier-header-link" to="/inicio">Voltar ao toAki</Link></header>
    <main className="private-main">
      <div className="area-heading"><h1>Aplicativo do entregador</h1><p>Minhas entregas · localização somente durante uma rota autorizada</p></div>
      {!ambienteOperacional&&<div className="demo-warning">O aplicativo está em preparação. A integração real só será habilitada no Preview do piloto após aprovação e implantação.</div>}
      {!user.emailVerified&&<section className="panel content-panel"><h2>Confirme seu e-mail</h2><p>O vínculo com a empresa exige confirmação de e-mail.</p><Link to="/verificar-email" state={{from:window.location.pathname+window.location.search}} className="primary button-link">Verificar e-mail</Link></section>}
      {ambienteOperacional&&user.emailVerified&&token&&<section className="panel content-panel">
        <h2>Convite para integrar a equipe</h2>
        <p>Ao confirmar, sua conta será vinculada ao entregador cadastrado pela empresa. O GPS não será ativado automaticamente.</p>
        <button type="button" className="primary" disabled={conectando} onClick={()=>void aceitar()}>{conectando?"Validando...":"Aceitar convite"}</button>
      </section>}
      {ambienteOperacional&&user.emailVerified&&<section className="panel content-panel courier-panel">
        <div className="panel-head"><h2>Minhas entregas</h2><button type="button" className="secondary" onClick={()=>void recarregar()}>Atualizar</button></div>
        {carregando?<p>Carregando tarefas...</p>:!vinculo?<p>Nenhuma empresa vinculada. Solicite ao gestor um convite individual.</p>:tarefas.length===0?<p>Nenhuma entrega atribuída à sua conta.</p>:<div className="courier-jobs">
          {tarefas.map(t=><button key={t.id} type="button" disabled={rastreando&&selecionada!==t.id} onClick={()=>{if(!rastreando){setSelecionada(t.id);setErro("");}}} className={"courier-job "+(selecionada===t.id?"courier-job-active":"")}>
            <strong>NF {t.numero_nf}</strong><span>{t.endereco_entrega}</span><small>{t.status==="em_rota"?"Em rota":t.status==="entregue"?"Entregue":t.status}</small>
          </button>)}
        </div>}
        {tarefaAtiva&&<div className="courier-actions">
          <p><strong>Entrega selecionada:</strong> NF {tarefaAtiva.numero_nf}</p>
          {tarefaAtiva.status==="em_rota"&&<>
            <p>O compartilhamento usa o GPS do celular, com sua permissão. Ao sair desta tela ou tocar em Pausar, o envio é interrompido. Não funciona continuamente em segundo plano.</p>
            <button className="primary" type="button" disabled={rastreando} onClick={iniciarGps}>Iniciar GPS desta entrega</button>
            <button className="secondary" type="button" disabled={!rastreando} onClick={()=>{parar();setMensagem("GPS pausado.");}}>Pausar GPS</button>
            <button className="secondary" type="button" disabled={finalizando} onClick={()=>void finalizar()}>{finalizando?"Finalizando...":"Marcar como entregue"}</button>
          </>}
          {ultimoEnvio&&<p>Última posição enviada: {ultimoEnvio}</p>}
        </div>}
      </section>}
      {erro&&<p role="alert" className="form-error">{erro}</p>}
      {mensagem&&<p role="status" className="form-info">{mensagem}</p>}
    </main>
  </div>;
}
