import { useState, type Dispatch, type FormEvent, type SetStateAction } from "react";
import {
  novoId, placasValidas, proximoEstado, registrar, validarNota,
  type DemoDados, type DemoEntrega, type DemoVeiculo, type EstadoEntrega
} from "./dadosDemo";
import {enderecoCompleto} from "../lib/cep";

type Atualizar=Dispatch<SetStateAction<DemoDados>>;
type Props={dados:DemoDados;atualizar:Atualizar;verMapa:(entregaId:string)=>void};
const titulo=(s:string)=>s.trim().replace(/\s+/g," ");

function Mensagem({erro,sucesso}:{erro:string;sucesso:string}) {
  return <>{erro&&<p role="alert" className="form-error">{erro}</p>}{sucesso&&<p role="status" className="form-info">{sucesso}</p>}</>;
}

export function EntregadoresDemo({dados,atualizar}:Pick<Props,"dados"|"atualizar">) {
  const [nome,setNome]=useState("");
  const [veiculoId,setVeiculoId]=useState("");
  const [editarId,setEditarId]=useState("");
  const [erro,setErro]=useState("");
  const [sucesso,setSucesso]=useState("");
  const [placa,setPlaca]=useState("");
  const [tipo,setTipo]=useState<DemoVeiculo["tipo"]>("Moto");
  const [editarVeiculo,setEditarVeiculo]=useState("");

  const limparMensagens=()=>{setErro("");setSucesso("");};
  const salvarEntregador=(e:FormEvent)=>{
    e.preventDefault();limparMensagens();
    const nomeLimpo=titulo(nome);
    if(nomeLimpo.length<2||nomeLimpo.length>80){setErro("Informe um nome entre 2 e 80 caracteres.");return;}
    if(veiculoId&&!dados.veiculos.some(v=>v.id===veiculoId)){setErro("Veículo inexistente.");return;}
    if(!editarId&&dados.entregadores.length>=50){setErro("Limite de demonstração: 50 entregadores.");return;}
    atualizar(estado=>registrar({
      ...estado,
      entregadores:editarId
        ?estado.entregadores.map(m=>m.id===editarId?{...m,nome:nomeLimpo,veiculoId}:m)
        :[...estado.entregadores,{id:novoId(),nome:nomeLimpo,veiculoId}]
    },editarId?"Entregador fictício atualizado: "+nomeLimpo:"Entregador fictício cadastrado: "+nomeLimpo));
    setNome("");setVeiculoId("");setEditarId("");setSucesso("Entregador salvo apenas nesta sessão de testes.");
  };
  const salvarVeiculo=(e:FormEvent)=>{
    e.preventDefault();limparMensagens();
    const placaLimpa=placa.trim().toUpperCase();
    if(!placasValidas(placaLimpa)){setErro("Use uma placa demonstrativa no padrão ABC1D23 ou ABC1234.");return;}
    if(dados.veiculos.some(v=>v.placa===placaLimpa&&v.id!==editarVeiculo)){setErro("Essa placa já está cadastrada na demonstração.");return;}
    if(!editarVeiculo&&dados.veiculos.length>=50){setErro("Limite de demonstração: 50 veículos.");return;}
    atualizar(estado=>registrar({
      ...estado,
      veiculos:editarVeiculo
        ?estado.veiculos.map(v=>v.id===editarVeiculo?{...v,placa:placaLimpa,tipo}:v)
        :[...estado.veiculos,{id:novoId(),placa:placaLimpa,tipo}]
    },editarVeiculo?"Veículo fictício atualizado: "+placaLimpa:"Veículo fictício cadastrado: "+placaLimpa));
    setPlaca("");setTipo("Moto");setEditarVeiculo("");setSucesso("Veículo salvo apenas nesta sessão de testes.");
  };

  const excluirEntregador=(id:string)=>{
    limparMensagens();
    if(dados.entregas.some(n=>n.entregadorId===id)){setErro("Este entregador está vinculado a uma NF fictícia. Reatribua a entrega primeiro.");return;}
    const nomeRemovido=dados.entregadores.find(m=>m.id===id)?.nome??"";
    atualizar(d=>registrar({...d,entregadores:d.entregadores.filter(m=>m.id!==id)},"Entregador fictício removido: "+nomeRemovido));
    if(editarId===id){setEditarId("");setNome("");setVeiculoId("");}
    setSucesso("Entregador removido da simulação.");
  };
  const excluirVeiculo=(id:string)=>{
    limparMensagens();
    if(dados.entregadores.some(m=>m.veiculoId===id)){setErro("Este veículo pertence a um entregador fictício. Troque o vínculo antes de removê-lo.");return;}
    atualizar(d=>registrar({...d,veiculos:d.veiculos.filter(v=>v.id!==id)},"Veículo fictício removido"));
    if(editarVeiculo===id){setEditarVeiculo("");setPlaca("");}
    setSucesso("Veículo removido da simulação.");
  };

  return <div className="demo-two-columns">
    <section className="panel content-panel">
      <div className="panel-head"><h2>Entregadores fictícios</h2><span className="pill muted">{dados.entregadores.length} cadastrados</span></div>
      <p className="helper">Cadastre, edite e vincule veículos para simular uma equipe. Use somente nomes inventados.</p>
      <form className="stack demo-form" onSubmit={salvarEntregador}>
        <label>Nome do entregador<input value={nome} onChange={e=>setNome(e.target.value)} maxLength={80} minLength={2} required placeholder="Ex.: João Exemplo"/></label>
        <label>Veículo<select value={veiculoId} onChange={e=>setVeiculoId(e.target.value)}><option value="">Sem veículo</option>{dados.veiculos.map(v=><option key={v.id} value={v.id}>{v.tipo} · {v.placa}</option>)}</select></label>
        <div className="demo-actions">
          <button className="primary" type="submit">{editarId?"Salvar alterações do entregador":"Cadastrar entregador"}</button>
          {editarId&&<button className="secondary" type="button" onClick={()=>{setEditarId("");setNome("");setVeiculoId("");}}>Cancelar edição</button>}
        </div>
      </form>
      <div className="demo-record-list">
        {dados.entregadores.map(m=><article key={m.id} className="demo-record">
          <div><strong>{m.nome}</strong><small>{dados.veiculos.find(v=>v.id===m.veiculoId)?.placa??"Sem veículo"}</small></div>
          <div className="demo-actions">
            <button className="secondary" type="button" onClick={()=>{setEditarId(m.id);setNome(m.nome);setVeiculoId(m.veiculoId);limparMensagens();}}>Editar</button>
            <button className="demo-danger" type="button" onClick={()=>excluirEntregador(m.id)} aria-label={"Excluir entregador "+m.nome}>Excluir</button>
          </div>
        </article>)}
      </div>
    </section>
    <section className="panel content-panel">
      <div className="panel-head"><h2>Veículos fictícios</h2><span className="pill muted">{dados.veiculos.length} cadastrados</span></div>
      <p className="helper">Placas e veículos servem somente para visualizar o funcionamento dos vínculos.</p>
      <form className="stack demo-form" onSubmit={salvarVeiculo}>
        <label>Placa de exemplo<input value={placa} onChange={e=>setPlaca(e.target.value.toUpperCase())} maxLength={7} minLength={7} required placeholder="ABC1D23" autoCapitalize="characters"/></label>
        <label>Categoria<select value={tipo} onChange={e=>setTipo(e.target.value as DemoVeiculo["tipo"])}><option>Moto</option><option>Carro</option><option>Van</option></select></label>
        <div className="demo-actions">
          <button className="primary" type="submit">{editarVeiculo?"Salvar veículo":"Cadastrar veículo"}</button>
          {editarVeiculo&&<button className="secondary" type="button" onClick={()=>{setEditarVeiculo("");setPlaca("");setTipo("Moto");}}>Cancelar edição</button>}
        </div>
      </form>
      <div className="demo-record-list">
        {dados.veiculos.map(v=><article key={v.id} className="demo-record">
          <div><strong>{v.placa}</strong><small>{v.tipo}</small></div>
          <div className="demo-actions">
            <button className="secondary" type="button" onClick={()=>{setEditarVeiculo(v.id);setPlaca(v.placa);setTipo(v.tipo);limparMensagens();}}>Editar</button>
            <button className="demo-danger" type="button" onClick={()=>excluirVeiculo(v.id)} aria-label={"Excluir veículo "+v.placa}>Excluir</button>
          </div>
        </article>)}
      </div>
    </section>
    <Mensagem erro={erro} sucesso={sucesso}/>
  </div>;
}

export function EntregasDemo({dados,atualizar,verMapa}:Props) {
  const [nf,setNf]=useState("");
  const [destinatario,setDestinatario]=useState("");
  const [destino,setDestino]=useState("");
  const [entregadorId,setEntregadorId]=useState("");
  const [editarId,setEditarId]=useState("");
  const [busca,setBusca]=useState("");
  const [erro,setErro]=useState("");
  const [sucesso,setSucesso]=useState("");

  const limpar=()=>{setNf("");setDestinatario("");setDestino("");setEntregadorId("");setEditarId("");};
  const selecionarDestinatario=(nome:string)=>{
    setDestinatario(nome);
    const cliente=dados.clientes.find(c=>c.nome.toLocaleLowerCase("pt-BR")===nome.trim().toLocaleLowerCase("pt-BR"));
    if(cliente?.endereco){
      const completo=enderecoCompleto(cliente.endereco);
      if(completo.length<=160)setDestino(completo);
    }
  };
  const salvar=(e:FormEvent)=>{
    e.preventDefault();setErro("");setSucesso("");
    const nota=nf.trim(),cliente=destinatario.trim(),local=destino.trim();
    if(!validarNota(nota)){setErro("A NF fictícia deve conter de 1 a 9 algarismos.");return;}
    if(cliente.length<3||cliente.length>80||local.length<5||local.length>160){setErro("Preencha destinatário e destino fictícios válidos.");return;}
    if(dados.entregas.some(x=>x.nf===nota&&x.id!==editarId)){setErro("Já existe uma NF com esse número na simulação.");return;}
    if(entregadorId&&!dados.entregadores.some(m=>m.id===entregadorId)){setErro("Entregador inexistente.");return;}
    const atual=dados.entregas.find(x=>x.id===editarId);
    if(atual&&atual.status!=="Aguardando coleta"){setErro("Para manter o histórico, só é possível editar NF que ainda aguarda coleta.");return;}
    if(!editarId&&dados.entregas.length>=100){setErro("Limite de demonstração: 100 entregas.");return;}
    const entrega:DemoEntrega={id:editarId||novoId(),nf:nota,destinatario:cliente,destino:local,entregadorId,status:"Aguardando coleta"};
    atualizar(d=>registrar({...d,entregas:editarId?d.entregas.map(x=>x.id===editarId?entrega:x):[entrega,...d.entregas]},
      (editarId?"NF fictícia atualizada: ":"NF fictícia criada: ")+nota));
    limpar();setSucesso("NF salva na simulação. Nada foi enviado ao Firestore.");
  };
  const alterar=(entrega:DemoEntrega,estado:EstadoEntrega)=>{
    setErro("");setSucesso("");
    if(!proximoEstado(entrega.status).includes(estado)){setErro("Transição de status não permitida.");return;}
    if(estado==="Em rota"&&!entrega.entregadorId){setErro("Atribua um entregador antes de colocar a NF em rota.");return;}
    atualizar(d=>registrar({...d,entregas:d.entregas.map(x=>x.id===entrega.id?{...x,status:estado}:x)},"NF fictícia "+entrega.nf+": "+estado));
    setSucesso("Status atualizado apenas na demonstração.");
  };
  const remover=(entrega:DemoEntrega)=>{
    setErro("");setSucesso("");
    if(entrega.status==="Em rota"){setErro("Cancele a entrega em rota antes de removê-la da simulação.");return;}
    if(dados.comprovantes.some(c=>c.entregaId===entrega.id)){setErro("Remova o recibo fictício antes de excluir esta NF.");return;}
    atualizar(d=>registrar({...d,entregas:d.entregas.filter(x=>x.id!==entrega.id)},"NF fictícia removida: "+entrega.nf));
    if(editarId===entrega.id)limpar();
    setSucesso("NF removida da simulação.");
  };
  const filtrar=dados.entregas.filter(x=>[x.nf,x.destinatario,x.destino].join(" ").toLocaleLowerCase("pt-BR").includes(busca.toLocaleLowerCase("pt-BR")));

  return <div className="demo-two-columns demo-delivery-layout">
    <section className="panel content-panel">
      <div className="panel-head"><h2>{editarId?"Editar nota fictícia":"Nova NF / pedido fictício"}</h2><span className="pill muted">Somente simulação</span></div>
      <p className="helper">Você pode cadastrar uma NF, escolher o entregador e movimentar os status. Não preencha dados de clientes reais.</p>
      <form className="stack demo-form" onSubmit={salvar}>
        <label>Número da NF<input value={nf} onChange={e=>setNf(e.target.value)} inputMode="numeric" minLength={1} maxLength={9} required placeholder="Ex.: 0045824"/></label>
        <label>Destinatário fictício<input value={destinatario} onChange={e=>selecionarDestinatario(e.target.value)} list="clientes-ficticios" maxLength={80} minLength={3} required placeholder="Ex.: Oficina Exemplo D"/><datalist id="clientes-ficticios">{dados.clientes.map(c=><option key={c.id} value={c.nome}/>)}</datalist></label>
        <label>Destino fictício<input value={destino} onChange={e=>setDestino(e.target.value)} minLength={5} maxLength={160} required placeholder="Ex.: Jardim Alvorada, Maringá"/><small>Ao escolher um cliente com CEP cadastrado, o destino é sugerido automaticamente. Confira antes de salvar.</small></label>
        <label>Entregador<select value={entregadorId} onChange={e=>setEntregadorId(e.target.value)}><option value="">Aguardando atribuição</option>{dados.entregadores.map(m=><option key={m.id} value={m.id}>{m.nome}</option>)}</select></label>
        <div className="demo-actions">
          <button className="primary" type="submit">{editarId?"Salvar alterações da NF":"Cadastrar NF fictícia"}</button>
          {editarId&&<button className="secondary" type="button" onClick={limpar}>Cancelar edição</button>}
        </div>
      </form>
      <Mensagem erro={erro} sucesso={sucesso}/>
    </section>
    <section className="panel content-panel">
      <div className="panel-head"><h2>Notas e pedidos</h2><span className="pill muted">{dados.entregas.length} registros</span></div>
      <label className="demo-search-label">Buscar NF ou destinatário<input type="search" value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar NF, destino ou destinatário"/></label>
      <div className="demo-record-list">
        {filtrar.length===0&&<p className="helper">Nenhuma NF fictícia encontrada.</p>}
        {filtrar.map(x=><article key={x.id} className="demo-record demo-delivery-card">
          <div className="demo-record-info"><strong>NF {x.nf}</strong><small>{x.destinatario} · {x.destino}</small><small>Entregador: {dados.entregadores.find(m=>m.id===x.entregadorId)?.nome??"Não atribuído"}</small><span className={"pill "+(x.status==="Em rota"?"":x.status==="Entregue"?"":"muted")}>{x.status}</span></div>
          <div className="demo-actions">
            <button type="button" className="secondary" onClick={()=>verMapa(x.id)}>Mapa fake</button>
            {x.status==="Aguardando coleta"&&<button type="button" className="secondary" onClick={()=>{setNf(x.nf);setDestinatario(x.destinatario);setDestino(x.destino);setEntregadorId(x.entregadorId);setEditarId(x.id);setErro("");}}>Editar NF</button>}
            {proximoEstado(x.status).map(estado=><button type="button" className="secondary" key={estado} onClick={()=>alterar(x,estado)}>{estado==="Em rota"?"Iniciar rota":estado==="Entregue"?"Concluir entrega":"Cancelar entrega"}</button>)}
            {x.status!=="Em rota"&&<button type="button" className="demo-danger" onClick={()=>remover(x)} aria-label={"Excluir NF "+x.nf}>Excluir</button>}
          </div>
        </article>)}
      </div>
    </section>
  </div>;
}

export function OutrosModulosDemo({secao,dados}:{secao:"clientes"|"comprovantes"|"historico"|"empresa"|"assinatura";dados:DemoDados}) {
  if(secao==="historico")return <section className="panel content-panel">
    <div className="panel-head"><h2>Histórico da simulação</h2><span className="pill muted">Não é auditoria real</span></div>
    {dados.historico.length===0?<p className="helper">Modifique um entregador, veículo ou NF fictícia para ver os eventos de teste aqui.</p>
      :<div className="demo-record-list">{dados.historico.map(e=><article className="demo-record" key={e.id}><div><strong>{e.descricao}</strong><small>{e.data}</small></div></article>)}</div>}
  </section>;
  if(secao==="clientes")return <section className="panel content-panel">
    <div className="panel-head"><h2>Destinatários fictícios</h2><span className="pill muted">Sem links públicos</span></div>
    <p className="helper">Os destinatários abaixo são derivados das NFs simuladas. Links públicos de rastreamento exigirão tokens temporários emitidos por backend seguro.</p>
    <div className="demo-record-list">{dados.entregas.map(n=><article className="demo-record" key={n.id}><div><strong>{n.destinatario}</strong><small>NF {n.nf} · {n.destino}</small></div><span className="pill muted">Sem link</span></article>)}</div>
  </section>;
  if(secao==="comprovantes")return <section className="panel content-panel">
    <div className="panel-head"><h2>Comprovantes</h2><span className="pill muted">Não conectados</span></div>
    <p className="helper">Entregas concluídas aparecem abaixo. A coleta de fotos, assinaturas e armazenamento privado será implementada com o aplicativo do entregador.</p>
    <div className="demo-record-list">{dados.entregas.filter(n=>n.status==="Entregue").length===0?<p>Nenhuma entrega fictícia concluída.</p>
      :dados.entregas.filter(n=>n.status==="Entregue").map(n=><article className="demo-record" key={n.id}><div><strong>NF {n.nf}</strong><small>{n.destinatario} · Entregue (simulação)</small></div><span className="pill muted">Sem foto</span></article>)}</div>
  </section>;
  if(secao==="empresa")return <section className="panel content-panel">
    <div className="panel-head"><h2>Empresa e equipe</h2><span className="pill muted">Soma Distribuidora · fictícia</span></div>
    <p className="helper">Neste painel estamos usando uma empresa fictícia para testar o fluxo sem criar cadastros no Firebase real. A aprovação de empresas por CNPJ permanece exclusiva do backend administrativo.</p>
    <div className="mini-stat"><div><strong>01</strong><small>Filial simulada</small></div><div><strong>{dados.entregadores.length}</strong><small>Entregadores</small></div><div><strong>{dados.veiculos.length}</strong><small>Veículos</small></div><div><strong>{dados.entregas.length}</strong><small>Notas</small></div></div>
    <p className="helper">Convites de funcionários, gestão de filiais e permissões reais são as próximas etapas da Fase A/B.</p>
  </section>;
  return <section className="panel content-panel"><div className="panel-head"><h2>Assinatura</h2><span className="pill muted">Sem cobrança</span></div>
    <p>Plano piloto demonstrativo do toAki.</p><p className="helper">Não existe contrato ou pagamento ativo nesta demonstração. Limites comerciais e integração financeira serão implementados depois da operação básica.</p>
  </section>;
}
