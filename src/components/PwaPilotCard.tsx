import {useEffect,useState} from "react";
import {estaInstalado,instalarPwa,ouvirInstalacao} from "../lib/pwa";

const link="https://toaki-cf058--fase-a-go3l94zk.web.app/";
const apple=()=>/iPad|iPhone|iPod/i.test(navigator.userAgent);
const android=()=>/Android/i.test(navigator.userAgent);

export default function PwaPilotCard(){
  const [podeInstalar,setPodeInstalar]=useState(false);
  const [instalado,setInstalado]=useState(()=>estaInstalado());
  const [mostrar,setMostrar]=useState(false);
  const [mensagem,setMensagem]=useState("");
  const [ocupado,setOcupado]=useState(false);

  useEffect(()=>{
    return ouvirInstalacao(ev=>setPodeInstalar(Boolean(ev)));
  },[]);
  const instalar=async()=>{
    setMensagem("");setOcupado(true);
    const resultado=await instalarPwa();
    setOcupado(false);
    if(resultado==="accepted"){setInstalado(true);setMensagem("Pedido de instalação aceito. Confirme o ícone na tela inicial do seu aparelho.");}
    else if(resultado==="dismissed"){setMensagem("Instalação cancelada. Você pode tentar novamente pelo menu do navegador.");}
    else{setMostrar(true);setMensagem("O navegador não ofereceu instalação direta. Consulte as instruções abaixo.");}
  };
  const compartilhar=async()=>{
    setMensagem("");
    try{
      if(navigator.share){await navigator.share({title:"toAki — Ambiente piloto",text:"Acesse o toAki para testar seu cadastro e sua conta.",url:link});setMensagem("Opção de compartilhamento aberta.");return;}
      if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(link);setMensagem("Link de testes copiado!");return;}
      setMostrar(true);setMensagem("Copie o endereço de testes exibido abaixo.");
    }catch(e){
      if(e instanceof Error&&e.name==="AbortError")return;
      setMostrar(true);setMensagem("Não foi possível compartilhar automaticamente. Copie o endereço exibido abaixo.");
    }
  };
  return <section className="pwa-pilot-panel" aria-label="Instalação e convite para piloto">
    <div className="pwa-pilot-copy">
      <span className="pwa-pilot-eyebrow">TESTE NO CELULAR</span>
      <h2>Leve o toAki para sua tela inicial</h2>
      <p>Você pode abrir o site como um aplicativo e enviar o acesso para o segundo testador. É preciso internet para login e entregas.</p>
      <div className="pwa-actions">
        {instalado?<span className="pill muted">Aberto como aplicativo</span>:
          podeInstalar?<button type="button" className="primary" disabled={ocupado} onClick={()=>void instalar()}>{ocupado?"Abrindo instalação...":"Instalar toAki"}</button>:
            <button type="button" className="secondary" onClick={()=>setMostrar(x=>!x)} aria-expanded={mostrar}>Como adicionar à tela inicial</button>}
        <button type="button" className="secondary" onClick={()=>void compartilhar()}>Compartilhar link de testes</button>
      </div>
      {mensagem&&<p className="pwa-feedback" role="status">{mensagem}</p>}
      {mostrar&&<div className="pwa-instructions">
        {apple()
          ?<p><strong>iPhone / iPad:</strong> abra pelo Safari, toque em Compartilhar e escolha <strong>Adicionar à Tela de Início</strong>.</p>
          :android()
          ?<p><strong>Android:</strong> abra no Chrome, toque no menu ⋮ e escolha <strong>Instalar aplicativo</strong> ou <strong>Adicionar à tela inicial</strong>, se disponível.</p>
          :<p><strong>Computador:</strong> Chrome ou Edge podem mostrar o botão de instalar na barra de endereços. Em outros navegadores, use o site normalmente.</p>}
        <p className="pwa-visible-link">Endereço: <span>{link}</span></p>
      </div>}
    </div>
    <div className="pwa-mark" aria-hidden="true"><span>to</span><strong>aki</strong></div>
  </section>;
}
