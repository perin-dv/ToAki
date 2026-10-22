import {useEffect,useState,type FormEvent} from "react";
import {useAuth} from "../auth/AuthProvider";
import {empresaAutorizada,listarRegistros,criarRegistro,type TipoOperacional,type RegistroOperacional} from "../lib/operacaoEmpresa";
import EnderecoPorCep from "../components/EnderecoPorCep";
import {enderecoVazio,validarEndereco} from "../lib/cep";
import {ambientePilotoOriginal} from "../lib/ambiente";
import {criarConviteEntregador,iniciarEntrega} from "../lib/rastreamento";

const abas:{id:TipoOperacional;nome:string}[]=[
  {id:"cliente",nome:"Clientes"},
  {id:"entregador",nome:"Entregadores"},
  {id:"veiculo",nome:"Veículos"},
  {id:"pedido",nome:"Pedidos / NFs"}
];
const dadosEmBranco={nome:"",telefone:"",...enderecoVazio(),placa:"",categoria:"Moto",numero_nf:"",destinatario_id:"",entregador_id:"",endereco_entrega:""};
export default function EmpresaOperacao(){
  const {user,role}=useAuth();
  const [empresaId,setEmpresaId]=useState<string|null>(null);
  const [carregando,setCarregando]=useState(true);
  const [erro,setErro]=useState("");
  const [aviso,setAviso]=useState("");
  const [aba,setAba]=useState<TipoOperacional>("cliente");
  const [registros,setRegistros]=useState<RegistroOperacional[]>([]);
  const [clientes,setClientes]=useState<RegistroOperacional[]>([]);
  const [entregadores,setEntregadores]=useState<RegistroOperacional[]>([]);
  const [campos,setCampos]=useState({...dadosEmBranco});
  const [salvando,setSalvando]=useState(false);
  const [operando,setOperando]=useState("");
  const [destinos,setDestinos]=useState<Record<string,string>>({});
  const [conviteGerado,setConviteGerado]=useState<{nome:string;url:string}|null>(null);

  useEffect(()=>{
    let ativo=true;
    if(!user){setCarregando(false);return;}
    empresaAutorizada(user).then(id=>{
      if(ativo){setEmpresaId(id);setCarregando(false)}
    }).catch(()=>{if(ativo){setErro("Não foi possível validar seu vínculo com a empresa.");setCarregando(false)}});
    return()=>{ativo=false};
  },[user]);
  useEffect(()=>{
    if(!empresaId)return;
    let ativo=true;setErro("");
    Promise.all([
      listarRegistros(empresaId,aba),
      listarRegistros(empresaId,"cliente"),
      listarRegistros(empresaId,"entregador")
    ]).then(([items,c,d])=>{if(ativo){setRegistros(items);setClientes(c);setEntregadores(d)}})
      .catch(()=>{if(ativo)setErro("Não foi possível carregar os dados. Verifique a permissão da empresa e o Firestore.")});
    return()=>{ativo=false};
  },[empresaId,aba]);
  const alterar=(chave:keyof typeof dadosEmBranco,valor:string)=>setCampos(v=>({...v,[chave]:valor}));
  const enviar=async(evento:FormEvent)=>{
    evento.preventDefault();setErro("");setAviso("");
    if(!empresaId){setErro("Empresa ainda não autorizada.");return}
    if(aba==="cliente"){
      const erroEndereco=validarEndereco(campos);
      if(erroEndereco){setErro(erroEndereco);return;}
    }
    const payload:Record<string,string> = aba==="cliente"?
      {nome:campos.nome,telefone:campos.telefone,cep:campos.cep,logradouro:campos.logradouro,numero:campos.numero,complemento:campos.complemento,bairro:campos.bairro,cidade:campos.cidade,uf:campos.uf}:
      aba==="entregador"?{nome:campos.nome,telefone:campos.telefone}:
      aba==="veiculo"?{placa:campos.placa,categoria:campos.categoria}:
      {numero_nf:campos.numero_nf,destinatario_id:campos.destinatario_id,entregador_id:campos.entregador_id,endereco_entrega:campos.endereco_entrega};
    setSalvando(true);
    try{
      await criarRegistro(empresaId,aba,payload);
      setRegistros(await listarRegistros(empresaId,aba));
      if(aba==="cliente")setClientes(await listarRegistros(empresaId,"cliente"));
      if(aba==="entregador")setEntregadores(await listarRegistros(empresaId,"entregador"));
      setCampos({...dadosEmBranco});
      setAviso(ambientePilotoOriginal?"Registro confirmado no Firestore do piloto autorizado, com auditoria.":"Registro confirmado no Firestore de homologação, com auditoria.");
    }catch(e){
      const msg=e instanceof Error?e.message:"Não foi possível cadastrar.";
      setErro("Cadastro não realizado. "+msg);
    }finally{setSalvando(false)}
  };

  const atualizarLista=async()=>{
    if(!empresaId)return;
    setErro("");
    try{
      setRegistros(await listarRegistros(empresaId,aba));
      if(aba==="entregador"||aba==="pedido")setEntregadores(await listarRegistros(empresaId,"entregador"));
    }catch(e){setErro(e instanceof Error?e.message:"Não foi possível atualizar os registros.");}
  };
  const gerarConvite=async(r:RegistroOperacional)=>{
    if(!empresaId)return;
    setOperando(r.id);setErro("");setConviteGerado(null);
    try{
      const {token}=await criarConviteEntregador(empresaId,r.id);
      const url=window.location.origin+"/entregador?convite="+encodeURIComponent(token);
      setConviteGerado({nome:r.nome||"Entregador",url});
      setAviso("Convite individual válido por 24 horas. Compartilhe somente com o entregador cadastrado.");
    }catch(e){setErro(e instanceof Error?e.message:"Falha ao criar convite.");}
    finally{setOperando("");}
  };
  const iniciarRota=async(r:RegistroOperacional)=>{
    if(!empresaId)return;
    const entregadorId=destinos[r.id]||r.entregador_id||"";
    if(!entregadorId){setErro("Selecione um entregador com aplicativo vinculado.");return;}
    setOperando(r.id);setErro("");setAviso("");
    try{
      await iniciarEntrega(empresaId,r.id,entregadorId);
      setAviso("Entrega iniciada. A NF já aparecerá no aplicativo do entregador vinculado.");
      await atualizarLista();
    }catch(e){setErro(e instanceof Error?e.message:"Não foi possível iniciar a rota.");}
    finally{setOperando("");}
  };

  if(carregando)return <div role="status" className="loading">Validando vínculo da empresa...</div>;
  if(!empresaId)return <section className="panel content-panel account-full-panel">
    <h2>Empresa ainda não vinculada à sua conta</h2>
    <p className="helper">Sua empresa precisa estar aprovada e autorizada para o piloto. Somente usuários com vínculo ativo e cargo permitido podem cadastrar clientes, veículos e notas reais.</p>
    {erro&&<p role="alert" className="form-error">{erro}</p>}
  </section>;
  return <div className="account-content">
    <section className="account-operational-banner">
      <div><strong>Operação real — {ambientePilotoOriginal?"Piloto autorizado":"Homologação"}</strong><p>{ambientePilotoOriginal?"Registros persistidos na empresa piloto autorizada dentro do Firebase atual.":"Registros persistidos no Firestore do projeto de homologação separado."}</p></div>
      <span className="pill">Empresa autorizada</span>
    </section>
    <nav className="account-tabs account-operational-tabs" aria-label="Cadastros operacionais">
      {abas.map(x=><button type="button" key={x.id} className={"account-tab "+(aba===x.id?"account-tab-active":"")} onClick={()=>{setAba(x.id);setCampos({...dadosEmBranco});setAviso("");}} aria-current={aba===x.id?"page":undefined}>{x.nome}</button>)}
    </nav>
    <div className="demo-two-columns demo-delivery-layout">
      <section className="panel content-panel">
        <div className="account-section-heading"><div><h2>Novo cadastro — {abas.find(x=>x.id===aba)?.nome}</h2><p>Preencha com dados autorizados para a homologação.</p></div></div>
        <form className="stack demo-form" onSubmit={enviar}>
          {(aba==="cliente"||aba==="entregador")&&<>
            <label>Nome<input required minLength={3} maxLength={100} value={campos.nome} onChange={e=>alterar("nome",e.target.value)} placeholder="Nome do cadastro"/></label>
            <label>Telefone (opcional)<input maxLength={20} value={campos.telefone} onChange={e=>alterar("telefone",e.target.value)} inputMode="tel" placeholder="Contato autorizado"/></label>
          </>}
          {aba==="cliente"&&<EnderecoPorCep value={{cep:campos.cep,logradouro:campos.logradouro,numero:campos.numero,complemento:campos.complemento,bairro:campos.bairro,cidade:campos.cidade,uf:campos.uf}} onChange={endereco=>setCampos(v=>({...v,...endereco}))} prefix="empresa-cliente"/>}
          {aba==="veiculo"&&<>
            <label>Placa<input required minLength={7} maxLength={7} autoCapitalize="characters" value={campos.placa} onChange={e=>alterar("placa",e.target.value.toUpperCase())} placeholder="ABC1D23"/></label>
            <label>Categoria<select value={campos.categoria} onChange={e=>alterar("categoria",e.target.value)}><option>Moto</option><option>Carro</option><option>Van</option><option>Caminhão</option></select></label>
          </>}
          {aba==="pedido"&&<>
            <label>Número da NF<input required inputMode="numeric" maxLength={20} value={campos.numero_nf} onChange={e=>alterar("numero_nf",e.target.value)} placeholder="Apenas números"/></label>
            <label>Cliente autorizado<select required value={campos.destinatario_id} onChange={e=>alterar("destinatario_id",e.target.value)}><option value="">Selecione um cliente</option>{clientes.map(x=><option key={x.id} value={x.id}>{x.nome||x.titulo_registro}</option>)}</select></label>
            <label>Entregador (opcional)<select value={campos.entregador_id} onChange={e=>alterar("entregador_id",e.target.value)}><option value="">Aguardando atribuição</option>{entregadores.map(x=><option key={x.id} value={x.id}>{x.nome||x.titulo_registro}</option>)}</select></label>
            <label>Endereço da entrega<input required minLength={5} maxLength={180} value={campos.endereco_entrega} onChange={e=>alterar("endereco_entrega",e.target.value)} placeholder="Destino autorizado"/></label>
          </>}
          <button type="submit" disabled={salvando} className="primary">{salvando?"Salvando...":"Salvar no Firestore autorizado"}</button>
        </form>
        {erro&&<p role="alert" className="form-error">{erro}</p>}
        {aviso&&<p role="status" className="form-info">{aviso}</p>}
      </section>
      <section className="panel content-panel">
        <div className="account-section-heading"><div><h2>Registros da empresa</h2><p>Dados lidos diretamente do Firestore autorizado.</p></div>
          <button type="button" className="secondary" onClick={()=>void atualizarLista()}>Atualizar</button><span className="pill muted">{registros.length} exibidos</span></div>
        <div className="demo-record-list">
          {!registros.length&&<div className="account-empty"><strong>Sem registros nesta categoria</strong><p>Cadastre o primeiro registro no formulário ao lado.</p></div>}
          {registros.map(r=><article className="demo-record" key={r.id}>
            <div><strong>{r.titulo_registro}</strong><small>{r.placa||r.nome||r.numero_nf||""}</small>
              {r.cep&&<small>{[r.logradouro,r.numero,r.bairro,r.cidade,r.uf].filter(Boolean).join(", ")} · CEP {r.cep}</small>}
              <small>Status: {r.status==="em_rota"?"Em rota":r.status==="entregue"?"Entregue":r.status}</small>
              {aba==="entregador"&&<small>{r.uid_conta?"Aplicativo do entregador conectado":"Ainda não conectado ao aplicativo"}</small>}
              {aba==="pedido"&&r.posicao_atual&&r.status==="em_rota"&&<div className="courier-position">
                <small>GPS recebido · precisão de {Math.round(r.posicao_atual.precisao)} m</small>
                <a href={"https://www.google.com/maps?q="+r.posicao_atual.latitude+","+r.posicao_atual.longitude} target="_blank" rel="noopener noreferrer">Ver última posição no mapa ↗</a>
              </div>}
            </div>
            {aba==="entregador"&&!r.uid_conta&&["dono_empresa","gestor"].includes(role||"")&&
              <button type="button" className="secondary" disabled={operando===r.id} onClick={()=>void gerarConvite(r)}>Gerar convite do app</button>}
            {aba==="pedido"&&r.status==="pendente"&&<div className="courier-assignment">
              <label>Selecionar entregador com aplicativo
                <select aria-label={"Entregador da NF "+(r.numero_nf||r.id)} value={destinos[r.id]??r.entregador_id??""} onChange={e=>setDestinos(p=>({...p,[r.id]:e.target.value}))}>
                  <option value="">Selecione</option>
                  {entregadores.filter(e=>!!e.uid_conta).map(e=><option key={e.id} value={e.id}>{e.nome||e.titulo_registro}</option>)}
                </select>
              </label>
              <button type="button" className="primary" disabled={operando===r.id} onClick={()=>void iniciarRota(r)}>Iniciar rota</button>
            </div>}
          </article>)}
          {conviteGerado&&aba==="entregador"&&<div className="demo-warning courier-invite"><strong>Convite para {conviteGerado.nome}</strong>
            <p>Envie o link em particular ao entregador. Qualquer pessoa que obtiver o convite antes do uso poderá tentar vinculá-lo.</p>
            <input aria-label="Link privado do aplicativo de entregador" readOnly value={conviteGerado.url}/>
            <button className="secondary" type="button" onClick={()=>void navigator.clipboard?.writeText(conviteGerado.url)}>Copiar link do aplicativo</button>
          </div>}
        </div>
        <p className="helper">O vínculo com o entregador é feito por convite individual. O GPS aparece apenas nas entregas em rota; confira a posição atualizada no botão Atualizar. Rastreamento contínuo em segundo plano dependerá do app Android.</p>
      </section>
    </div>
  </div>;
}
