import {useEffect,useState,type ChangeEvent} from "react";
import {consultarCep,formatarCep,cepNumeros,type EnderecoCep} from "../lib/cep";

type Props={value:EnderecoCep;onChange:(value:EnderecoCep)=>void;prefix:string;disabled?:boolean};
export default function EnderecoPorCep({value,onChange,prefix,disabled=false}:Props){
  const [situacao,setSituacao]=useState<"aguardando"|"buscando"|"encontrado"|"incompleto"|"falha">("aguardando");
  const [aviso,setAviso]=useState("");
  const numeros=cepNumeros(value.cep);
  useEffect(()=>{
    if(numeros.length!==8){setSituacao("aguardando");setAviso("");return;}
    const controller=new AbortController();
    const timer=setTimeout(()=>{
      setSituacao("buscando");setAviso("Buscando endereço pelo CEP...");
      consultarCep(numeros,controller.signal).then(resultado=>{
        if(controller.signal.aborted)return;
        if(!resultado){setSituacao("incompleto");setAviso("CEP não encontrado. Confira o número ou preencha os campos manualmente.");return;}
        onChange({...value,...resultado,numero:value.numero,complemento:value.complemento});
        setSituacao("encontrado");
        setAviso(resultado.logradouro&&resultado.bairro?"Endereço localizado! Confira e informe o número.":"Cidade identificada. Complete rua, bairro e número.");
      }).catch(()=>{
        if(controller.signal.aborted)return;
        setSituacao("falha");setAviso("Consulta indisponível. Você pode preencher o endereço manualmente.");
      });
    },380);
    return()=>{clearTimeout(timer);controller.abort();};
    // Consulte novamente apenas se o CEP mudar, não quando o número for editado.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[numeros]);
  const mudarCep=(event:ChangeEvent<HTMLInputElement>)=>{
    const n=cepNumeros(event.target.value);
    if(n===numeros)return;
    setSituacao("aguardando");setAviso("");
    onChange({...value,cep:formatarCep(n),logradouro:"",bairro:"",cidade:"",uf:""});
  };
  const alterar=(key:keyof EnderecoCep,valor:string)=>onChange({...value,[key]:key==="uf"?valor.toUpperCase().slice(0,2):valor});
  return <fieldset className="cep-fields" disabled={disabled}>
    <legend>Endereço do cliente</legend>
    <div className="cep-grid">
      <label className="cep-postal">CEP
        <input required name={prefix+"-cep"} inputMode="numeric" autoComplete="postal-code" value={value.cep} onChange={mudarCep} placeholder="00000-000" maxLength={9} pattern="[0-9]{5}-?[0-9]{3}" aria-describedby={prefix+"-situacao"}/>
      </label>
      <div id={prefix+"-situacao"} role="status" aria-live="polite" className={"cep-status cep-"+situacao}>
        {aviso||"Informe os 8 dígitos do CEP para buscar rua, bairro, cidade e estado."}
      </div>
      <label className="cep-street">Rua / Logradouro
        <input required value={value.logradouro} onChange={e=>alterar("logradouro",e.target.value)} maxLength={120} placeholder="Rua ou avenida"/>
      </label>
      <label className="cep-number">Número
        <input required value={value.numero} onChange={e=>alterar("numero",e.target.value)} maxLength={15} placeholder="123 ou S/N" autoComplete="address-line2"/>
      </label>
      <label className="cep-complement">Complemento (opcional)
        <input value={value.complemento} onChange={e=>alterar("complemento",e.target.value)} maxLength={80} placeholder="Sala, bloco, fundos..."/>
      </label>
      <label className="cep-district">Bairro
        <input required value={value.bairro} onChange={e=>alterar("bairro",e.target.value)} maxLength={100} placeholder="Bairro"/>
      </label>
      <label className="cep-city">Cidade
        <input required value={value.cidade} onChange={e=>alterar("cidade",e.target.value)} maxLength={100} placeholder="Cidade"/>
      </label>
      <label className="cep-state">UF
        <input required value={value.uf} onChange={e=>alterar("uf",e.target.value.replace(/[^a-z]/gi,""))} minLength={2} maxLength={2} placeholder="PR"/>
      </label>
    </div>
  </fieldset>;
}
