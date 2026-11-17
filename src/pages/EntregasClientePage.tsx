import {useEffect,useState} from "react";
import type {User} from "firebase/auth";
import {collection,limit,onSnapshot,query} from "firebase/firestore";
import {Link} from "react-router-dom";
import {db} from "../lib/firebase";
import {ambienteOperacional} from "../lib/ambiente";

/**
 * O cliente consulta SOMENTE clientes/{uid}/entregas, cujo uid vem do Firebase Auth.
 * A associação de uma NF a este caminho deve ser feita por backend autorizado;
 * o navegador não concede vínculos e não faz escrita nem pesquisa por NF de terceiros.
 */
export type EntregaCliente={
  id:string;numero_nf:string;empresa_nome:string;status:string;destino:string;titulo:string;
};
export type EstadoEntregasCliente={
  etapa:"inativo"|"sem_sessao"|"verificar_email"|"carregando"|"erro"|"pronto";
  entregas:EntregaCliente[];
};
function texto(dados:Record<string,unknown>,campo:string){
  const valor=dados[campo];
  return typeof valor==="string"?valor.trim().slice(0,180):"";
}
export function useEntregasCliente(user:User|null):EstadoEntregasCliente{
  const [estado,setEstado]=useState<EstadoEntregasCliente>({etapa:"carregando",entregas:[]});
  const uid=user?.uid??null;
  const emailVerificado=user?.emailVerified===true;
  useEffect(()=>{
    if(!uid){setEstado({etapa:"sem_sessao",entregas:[]});return;}
    if(!ambienteOperacional){setEstado({etapa:"inativo",entregas:[]});return;}
    if(!emailVerificado){setEstado({etapa:"verificar_email",entregas:[]});return;}
    setEstado({etapa:"carregando",entregas:[]});
    const ref=query(collection(db,"clientes",uid,"entregas"),limit(30));
    const parar=onSnapshot(ref,snapshot=>{
      const entregas=snapshot.docs.map(doc=>{
        const d=doc.data() as Record<string,unknown>;
        return {
          id:doc.id,numero_nf:texto(d,"numero_nf"),empresa_nome:texto(d,"empresa_nome"),
          status:texto(d,"status"),destino:texto(d,"endereco_entrega"),
          titulo:texto(d,"titulo_registro")
        };
      });
      setEstado({etapa:"pronto",entregas});
    },()=>setEstado({etapa:"erro",entregas:[]}));
    return()=>parar();
  },[uid,emailVerificado]);
  return estado;
}

export function EntregasClienteConteudo({estado}:{estado:EstadoEntregasCliente}){
  const [busca,setBusca]=useState("");
  if(estado.etapa==="sem_sessao")return <p>Entre na sua conta para consultar entregas autorizadas.</p>;
  if(estado.etapa==="inativo")return <p>A consulta de entregas não está habilitada neste ambiente. Nenhum pedido fictício será exibido.</p>;
  if(estado.etapa==="verificar_email")return <div><p>Confirme seu e-mail para consultar pedidos associados à sua identidade.</p><Link className="secondary button-link" to="/verificar-email">Confirmar meu e-mail</Link></div>;
  if(estado.etapa==="carregando")return <p role="status">Consultando suas entregas autorizadas no Firebase...</p>;
  if(estado.etapa==="erro")return <p role="alert" className="form-error">Não foi possível consultar suas entregas. Verifique o acesso e tente novamente.</p>;
  if(estado.entregas.length===0)return <div className="account-empty"><strong>Nenhuma entrega vinculada à sua conta.</strong><p>A empresa precisa associar uma entrega à sua identidade de forma segura. Informar uma NF não concede acesso a pedidos de outras pessoas.</p></div>;
  const filtradas=estado.entregas.filter(e=>[e.numero_nf,e.empresa_nome,e.status,e.titulo].join(" ").toLocaleLowerCase("pt-BR").includes(busca.toLocaleLowerCase("pt-BR")));
  return <div className="stack">
    <label>Pesquisar entre as minhas entregas
      <input type="search" value={busca} onChange={e=>setBusca(e.target.value)} placeholder="NF, empresa ou status"/>
    </label>
    <p className="helper">Exibindo até 30 entregas vinculadas e autorizadas no Firebase. Endereço de destino não é GPS ao vivo.</p>
    <div className="demo-record-list">
      {filtradas.length===0?<p>Nenhuma das suas entregas corresponde à busca.</p>:filtradas.map(e=>
        <article className="demo-record" key={e.id}>
          <div><strong>{e.numero_nf?"NF "+e.numero_nf:e.titulo||"Entrega vinculada"}</strong>
            <small>{e.empresa_nome||"Empresa não informada"}</small>
            <small>Status: {e.status||"Não informado"}</small>
            {e.destino&&<small>Destino: {e.destino}</small>}
          </div>
        </article>
      )}
    </div>
  </div>;
}
