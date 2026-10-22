import {useEffect,useMemo,useState,type FormEvent} from "react";
import {useAuth} from "../auth/AuthProvider";
import {empresaAutorizada,escutarRegistros,criarRegistro,alterarRegistro,type TipoOperacional,type RegistroOperacional} from "../lib/operacaoEmpresa";
import EnderecoPorCep from "../components/EnderecoPorCep";
import {enderecoVazio,enderecoCompleto,validarEndereco} from "../lib/cep";
import {ambientePilotoOriginal} from "../lib/ambiente";

const abas:{id:TipoOperacional;nome:string}[]=[
  {id:"cliente",nome:"Clientes"},
  {id:"entregador",nome:"Motoristas"},
  {id:"veiculo",nome:"Veículos"},
  {id:"pedido",nome:"Pedidos / NFs"}
];
const vazio=()=>({nome:"",telefone:"",...enderecoVazio(),placa:"",categoria:"Moto",numero_nf:"",
  destinatario_id:"",entregador_id:"",veiculo_id:"",endereco_entrega:""});
type Campos=ReturnType<typeof vazio>;
const rotulo=(r:RegistroOperacional,tipo:TipoOperacional)=>{
  if(tipo==="veiculo")return (r.placa||"Sem placa")+" · "+(r.categoria||"Veículo");
  if(tipo==="pedido")return "NF "+(r.numero_nf||r.id);
  return r.nome||r.titulo_registro;
};
const filtrar=(lista:RegistroOperacional[],texto:string,tipo:TipoOperacional)=>{
  const termo=texto.trim().toLocaleLowerCase("pt-BR");
  return lista.filter(r=>r.ativo!==false&&rotulo(r,tipo).toLocaleLowerCase("pt-BR").includes(termo));
};
export default function EmpresaOperacao({abaInicial="cliente"}:{abaInicial?:TipoOperacional}){
  const {user,role}=useAuth();
  const [empresaId,setEmpresaId]=useState<string|null>(null);
  const [carregando,setCarregando]=useState(true);
  const [erro,setErro]=useState("");
  const [aviso,setAviso]=useState("");
  const [aba,setAba]=useState<TipoOperacional>(abaInicial);
  const [listas,setListas]=useState<Record<TipoOperacional,RegistroOperacional[]>>({
    cliente:[],entregador:[],veiculo:[],pedido:[]
  });
  const [campos,setCampos]=useState<Campos>(vazio);
  const [buscaLista,setBuscaLista]=useState("");
  const [buscaCliente,setBuscaCliente]=useState("");
  const [buscaMotorista,setBuscaMotorista]=useState("");
  const [buscaVeiculo,setBuscaVeiculo]=useState("");
  const [editando,setEditando]=useState<string|null>(null);
  const [salvando,setSalvando]=useState(false);
  const [operacaoId,setOperacaoId]=useState("");
  const podeGerenciar=role==="dono_empresa"||role==="gestor";
  const podeAlterar=podeGerenciar||(role==="vendedor"&&aba==="pedido");

  useEffect(()=>{
    let ativo=true;
    if(!user){setCarregando(false);return;}
    empresaAutorizada(user).then(id=>{if(ativo){setEmpresaId(id);setCarregando(false);}})
      .catch(()=>{if(ativo){setErro("Não foi possível validar seu vínculo com a empresa.");setCarregando(false);}});
    return()=>{ativo=false;};
  },[user]);
  useEffect(()=>{
    if(!empresaId)return;
    const cancelar=abas.map(item=>escutarRegistros(empresaId,item.id,docs=>{
      setListas(antigo=>({...antigo,[item.id]:docs}));
    },()=>setErro("Falha ao consultar dados reais do Firestore. Confira acesso e regras da empresa.")));
    return()=>cancelar.forEach(parar=>parar());
  },[empresaId]);
  const registros=listas[aba];
  const clientes=filtrar(listas.cliente,buscaCliente,"cliente");
  const motoristas=filtrar(listas.entregador,buscaMotorista,"entregador");
  const veiculos=filtrar(listas.veiculo,buscaVeiculo,"veiculo");
  const exibidos=useMemo(()=>registros.filter(r=>[rotulo(r,aba),r.placa,r.telefone,r.endereco_entrega,r.status]
    .join(" ").toLocaleLowerCase("pt-BR").includes(buscaLista.toLocaleLowerCase("pt-BR"))),[registros,aba,buscaLista]);
  const alterar=(chave:keyof Campos,valor:string)=>setCampos(v=>({...v,[chave]:valor}));
  const limpar=()=>{
    setCampos(vazio());setEditando(null);setBuscaCliente("");setBuscaMotorista("");setBuscaVeiculo("");
  };
  const mudarAba=(tipo:TipoOperacional)=>{setAba(tipo);limpar();setErro("");setAviso("");setBuscaLista("");};
  const escolherCliente=(id:string)=>{
    const cliente=listas.cliente.find(c=>c.id===id);
    setCampos(c=>{
      const enderecoCliente=cliente?.logradouro&&cliente.cidade?
        enderecoCompleto({cep:cliente.cep||"",logradouro:cliente.logradouro,numero:cliente.numero||"",
          complemento:cliente.complemento||"",bairro:cliente.bairro||"",cidade:cliente.cidade,uf:cliente.uf||""}):"";
      return {...c,destinatario_id:id,endereco_entrega:c.endereco_entrega||enderecoCliente};
    });
  };
  const escolherMotorista=(id:string)=>{
    const motorista=listas.entregador.find(r=>r.id===id);
    setCampos(c=>({...c,entregador_id:id,veiculo_id:motorista?.veiculo_id||""}));
    setBuscaVeiculo("");
  };
  const montarPayload=():Record<string,string>=>{
    if(aba==="cliente")return {nome:campos.nome,telefone:campos.telefone,cep:campos.cep,
      logradouro:campos.logradouro,numero:campos.numero,complemento:campos.complemento,
      bairro:campos.bairro,cidade:campos.cidade,uf:campos.uf};
    if(aba==="entregador")return {nome:campos.nome,telefone:campos.telefone,veiculo_id:campos.veiculo_id};
    if(aba==="veiculo")return {placa:campos.placa,categoria:campos.categoria};
    return {numero_nf:campos.numero_nf,destinatario_id:campos.destinatario_id,
      entregador_id:campos.entregador_id,veiculo_id:campos.veiculo_id,endereco_entrega:campos.endereco_entrega};
  };
  const enviar=async(evento:FormEvent)=>{
    evento.preventDefault();setErro("");setAviso("");
    if(!empresaId){setErro("Empresa ainda não autorizada.");return;}
    if(!podeAlterar){setErro("Seu cargo não permite salvar este cadastro.");return;}
    if(aba==="cliente"){const e=validarEndereco(campos);if(e){setErro(e);return;}}
    setSalvando(true);
    try{
      if(editando)await alterarRegistro(empresaId,aba,editando,"atualizar",montarPayload());
      else await criarRegistro(empresaId,aba,montarPayload());
      setAviso(editando?"Alterações confirmadas no Firestore da sua empresa.":"Cadastro confirmado no Firestore da sua empresa.");
      limpar();
    }catch(e){setErro("Operação não realizada: "+(e instanceof Error?e.message:"Falha desconhecida."));}
    finally{setSalvando(false);}
  };
  const editar=(r:RegistroOperacional)=>{
    if(!podeAlterar)return;
    setEditando(r.id);setErro("");setAviso("");setBuscaCliente("");setBuscaMotorista("");setBuscaVeiculo("");
    setCampos({...vazio(),
      nome:r.nome||"",telefone:r.telefone||"",placa:r.placa||"",categoria:r.categoria||"Moto",
      cep:r.cep||"",logradouro:r.logradouro||"",numero:r.numero||"",complemento:r.complemento||"",
      bairro:r.bairro||"",cidade:r.cidade||"",uf:r.uf||"",numero_nf:r.numero_nf||"",
      destinatario_id:r.destinatario_id||"",entregador_id:r.entregador_id||"",
      veiculo_id:r.veiculo_id||"",endereco_entrega:r.endereco_entrega||""});
    document.querySelector(".account-operational-tabs")?.scrollIntoView({behavior:"smooth",block:"start"});
  };
  const desativar=async(r:RegistroOperacional)=>{
    if(!empresaId||!podeGerenciar)return;
    if(!window.confirm("Desativar "+rotulo(r,aba)+"? O histórico será preservado."))return;
    setOperacaoId(r.id);setErro("");setAviso("");
    try{await alterarRegistro(empresaId,aba,r.id,"desativar");
      setAviso("Cadastro desativado no Firestore. Ele não aparecerá nas opções de novos pedidos.");}
    catch(e){setErro(e instanceof Error?e.message:"Não foi possível desativar.");}
    finally{setOperacaoId("");}
  };
  const mudarStatus=async(r:RegistroOperacional,novoStatus:string)=>{
    if(!empresaId||!podeAlterar)return;
    if(!window.confirm("Atualizar a NF "+(r.numero_nf||r.id)+" para "+novoStatus.replace("_"," ")+"?"))return;
    setOperacaoId(r.id);setErro("");setAviso("");
    try{await alterarRegistro(empresaId,"pedido",r.id,"mudar_status",undefined,novoStatus);
      setAviso("Status atualizado no Firebase e registrado no histórico.");}
    catch(e){setErro(e instanceof Error?e.message:"Não foi possível mudar o status.");}
    finally{setOperacaoId("");}
  };
  if(carregando)return <div role="status" className="loading">Validando vínculo da empresa...</div>;
  if(!empresaId)return <section className="panel content-panel account-full-panel">
    <h2>Empresa ainda não vinculada à sua conta</h2><p>Conclua a solicitação de cadastro empresarial. A aprovação é obrigatória antes de salvar clientes, motos, motoristas e NFs.</p>
    {erro&&<p role="alert" className="form-error">{erro}</p>}
  </section>;
  return <div className="account-content">
    <section className="account-operational-banner">
      <div><strong>Operação real — {ambientePilotoOriginal?"Empresa piloto autorizada":"Homologação"}</strong>
        <p>Cadastros, buscas e status ligados ao Firestore desta empresa. Alterações feitas em outra sessão atualizam as listas.</p>
      </div><span className="pill">Empresa autorizada</span>
    </section>
    <nav className="account-tabs account-operational-tabs" aria-label="Cadastros operacionais">
      {abas.map(item=><button type="button" key={item.id} className={"account-tab "+(aba===item.id?"account-tab-active":"")}
        aria-current={aba===item.id?"page":undefined} onClick={()=>mudarAba(item.id)}>{item.nome}</button>)}
    </nav>
    <div className="demo-two-columns demo-delivery-layout">
      <section className="panel content-panel">
        <div className="account-section-heading"><div><h2>{editando?"Editar":"Novo cadastro —"} {abas.find(item=>item.id===aba)?.nome}</h2>
          <p>Os dados são gravados na empresa autorizada, nunca em uma simulação do navegador.</p></div></div>
        {podeAlterar?<form className="stack demo-form" onSubmit={enviar}>
          {(aba==="cliente"||aba==="entregador")&&<>
            <label>Nome<input required minLength={3} maxLength={100} value={campos.nome} onChange={e=>alterar("nome",e.target.value)} placeholder="Nome cadastrado"/></label>
            <label>Telefone (opcional)<input maxLength={20} value={campos.telefone} onChange={e=>alterar("telefone",e.target.value)} inputMode="tel"/></label>
          </>}
          {aba==="cliente"&&<EnderecoPorCep value={{cep:campos.cep,logradouro:campos.logradouro,numero:campos.numero,
            complemento:campos.complemento,bairro:campos.bairro,cidade:campos.cidade,uf:campos.uf}}
            onChange={endereco=>setCampos(c=>({...c,...endereco}))} prefix="empresa-cliente"/>}
          {aba==="veiculo"&&<>
            <label>Placa<input required minLength={7} maxLength={7} readOnly={!!editando}
              value={campos.placa} onChange={e=>alterar("placa",e.target.value.toUpperCase())} placeholder="ABC1D23"/></label>
            <label>Categoria<select value={campos.categoria} onChange={e=>alterar("categoria",e.target.value)}>
              <option>Moto</option><option>Carro</option><option>Van</option><option>Caminhão</option></select></label>
          </>}
          {(aba==="entregador"||aba==="pedido")&&<div className="form-search-reference">
            <label>Buscar moto/veículo por placa<input type="search" value={buscaVeiculo}
              onChange={e=>setBuscaVeiculo(e.target.value)} placeholder="Digite a placa cadastrada..."/></label>
            <label>Veículo vinculado<select value={campos.veiculo_id} onChange={e=>alterar("veiculo_id",e.target.value)}>
              <option value="">Sem veículo definido</option>
              {listas.veiculo.filter(v=>v.id===campos.veiculo_id||veiculos.some(x=>x.id===v.id)).filter(v=>v.ativo!==false)
                .map(v=><option key={v.id} value={v.id}>{rotulo(v,"veiculo")}</option>)}
            </select></label>
            {listas.veiculo.length===0&&<p className="helper">Cadastre a moto em Veículos antes de vinculá-la.</p>}
          </div>}
          {aba==="pedido"&&<>
            <label>Número da NF<input required inputMode="numeric" maxLength={20} readOnly={!!editando}
              value={campos.numero_nf} onChange={e=>alterar("numero_nf",e.target.value)} placeholder="Digite a NF"/></label>
            <div className="form-search-reference">
              <label>Buscar cliente<input type="search" value={buscaCliente} onChange={e=>setBuscaCliente(e.target.value)}
                placeholder="Comece a digitar o nome do cliente..."/></label>
              <label>Cliente cadastrado<select required value={campos.destinatario_id} onChange={e=>escolherCliente(e.target.value)}>
                <option value="">Selecione o cliente</option>
                {listas.cliente.filter(r=>r.id===campos.destinatario_id||clientes.some(c=>c.id===r.id))
                  .filter(r=>r.ativo!==false).map(r=><option key={r.id} value={r.id}>{rotulo(r,"cliente")}</option>)}
              </select></label>
              {clientes.length===0&&<p className="helper">Nenhum cliente corresponde à busca. Cadastre o destinatário primeiro.</p>}
            </div>
            <div className="form-search-reference">
              <label>Buscar motorista<input type="search" value={buscaMotorista} onChange={e=>setBuscaMotorista(e.target.value)}
                placeholder="Digite o nome do motorista..."/></label>
              <label>Motorista responsável<select value={campos.entregador_id} onChange={e=>escolherMotorista(e.target.value)}>
                <option value="">Aguardando atribuição</option>
                {listas.entregador.filter(r=>r.id===campos.entregador_id||motoristas.some(c=>c.id===r.id))
                  .filter(r=>r.ativo!==false).map(r=><option key={r.id} value={r.id}>{rotulo(r,"entregador")}</option>)}
              </select></label>
            </div>
            <label>Destino da entrega<input required minLength={5} maxLength={180} value={campos.endereco_entrega}
              onChange={e=>alterar("endereco_entrega",e.target.value)} placeholder="Endereço cadastrado ou destino autorizado"/></label>
          </>}
          <div className="form-operational-buttons">
            <button type="submit" disabled={salvando} className="primary">{salvando?"Gravando...":editando?"Salvar alterações":"Cadastrar no Firebase"}</button>
            {editando&&<button type="button" className="secondary" onClick={limpar}>Cancelar edição</button>}
          </div>
        </form>:<p>Seu perfil pode consultar estes cadastros, mas alterações exigem permissão de gestor.</p>}
        {erro&&<p role="alert" className="form-error">{erro}</p>}
        {aviso&&<p role="status" className="form-info">{aviso}</p>}
      </section>
      <section className="panel content-panel">
        <div className="account-section-heading"><div><h2>{abas.find(item=>item.id===aba)?.nome} cadastrados</h2>
          <p>Lista sincronizada com o Firestore. Os registros permanecem após sair e entrar.</p></div>
          <span className="pill muted">{registros.length} registros</span></div>
        <label className="form-search-reference">Buscar {aba==="pedido"?"NF":aba==="veiculo"?"placa":"nome"}<input type="search"
          value={buscaLista} onChange={e=>setBuscaLista(e.target.value)} placeholder="Pesquisar registros salvos..."/></label>
        <div className="demo-record-list">
          {!exibidos.length&&<div className="account-empty"><strong>Nenhum registro encontrado</strong>
            <p>Cadastre um registro ou altere sua busca.</p></div>}
          {exibidos.map(r=><article className="demo-record operational-record" key={r.id}>
            <div><strong>{rotulo(r,aba)}</strong>
              {r.telefone&&<small>Contato: {r.telefone}</small>}
              {r.cep&&<small>{[r.logradouro,r.numero,r.bairro,r.cidade,r.uf].filter(Boolean).join(", ")} · CEP {r.cep}</small>}
              {r.veiculo_id&&<small>Veículo: {rotulo(listas.veiculo.find(v=>v.id===r.veiculo_id)||{id:r.veiculo_id,titulo_registro:"Veículo",status:""},"veiculo")}</small>}
              {r.entregador_id&&<small>Motorista: {listas.entregador.find(e=>e.id===r.entregador_id)?.nome||"Motorista cadastrado"}</small>}
              {r.endereco_entrega&&<small>Destino: {r.endereco_entrega}</small>}
              <small>Status: {r.status==="em_rota"?"Em rota":r.status==="entregue"?"Entregue":r.status==="pendente"?"Pendente":r.status}</small>
            </div>
            {podeAlterar&&r.ativo!==false&&<div className="operational-record-actions">
              {(aba!=="pedido"||r.status==="pendente")&&<button type="button" className="secondary" onClick={()=>editar(r)}>Editar</button>}
              {aba!=="pedido"&&podeGerenciar&&<button type="button" className="secondary" disabled={operacaoId===r.id}
                onClick={()=>void desativar(r)}>Desativar</button>}
              {aba==="pedido"&&r.status==="pendente"&&<>
                {r.entregador_id&&<button type="button" className="primary" disabled={operacaoId===r.id}
                  onClick={()=>void mudarStatus(r,"em_rota")}>Iniciar rota</button>}
                <button type="button" className="secondary" disabled={operacaoId===r.id} onClick={()=>void mudarStatus(r,"cancelada")}>Cancelar NF</button>
              </>}
              {aba==="pedido"&&r.status==="em_rota"&&<>
                <button type="button" className="primary" disabled={operacaoId===r.id} onClick={()=>void mudarStatus(r,"entregue")}>Marcar entregue</button>
                <button type="button" className="secondary" disabled={operacaoId===r.id} onClick={()=>void mudarStatus(r,"cancelada")}>Cancelar rota</button>
              </>}
            </div>}
          </article>)}
        </div>
        <p className="helper">Os vínculos usam IDs internos da sua empresa. Referências inválidas ou de outra empresa são recusadas pelo servidor. Desativar cadastros em uso é bloqueado para preservar o histórico.</p>
      </section>
    </div>
  </div>;
}
