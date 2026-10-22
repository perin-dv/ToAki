import {useState, type Dispatch, type FormEvent, type SetStateAction} from "react";
import {novoId, registrar, type DemoDados, type DemoFuncionario, type DemoPlano} from "./dadosDemo";

type Alterar=Dispatch<SetStateAction<DemoDados>>;
type Props={dados:DemoDados;atualizar:Alterar};
const limparNome=(s:string)=>s.trim().replace(/\s+/g," ");
const MAX=70;

export function ClientesDemo({dados,atualizar}:Props) {
  const [nome,setNome]=useState("");
  const [erro,setErro]=useState("");
  const [sucesso,setSucesso]=useState("");
  const [busca,setBusca]=useState("");
  const criar=(evento:FormEvent)=>{
    evento.preventDefault();setErro("");setSucesso("");
    const n=limparNome(nome);
    if(n.length<3||n.length>MAX){setErro("Use um nome fictício entre 3 e 70 caracteres.");return}
    if(dados.clientes.length>=100){setErro("Limite da simulação: 100 destinatários.");return}
    if(dados.clientes.some(c=>c.nome.toLocaleLowerCase("pt-BR")===n.toLocaleLowerCase("pt-BR"))){setErro("Destinatário já cadastrado.");return}
    atualizar(d=>registrar({...d,clientes:[...d.clientes,{id:novoId(),nome:n}]},"Destinatário fictício cadastrado: "+n));
    setNome("");setSucesso("Destinatário salvo somente na simulação.");
  };
  const remover=(id:string)=>{
    setErro("");setSucesso("");
    const cliente=dados.clientes.find(c=>c.id===id);
    if(!cliente)return;
    if(dados.entregas.some(n=>n.destinatario===cliente.nome)){setErro("Há notas ligadas a esse destinatário; remova as NFs antes.");return}
    atualizar(d=>registrar({...d,clientes:d.clientes.filter(c=>c.id!==id)},"Destinatário fictício removido: "+cliente.nome));
    setSucesso("Destinatário removido da simulação.");
  };
  const filtrados=dados.clientes.filter(c=>c.nome.toLocaleLowerCase("pt-BR").includes(busca.toLocaleLowerCase("pt-BR")));
  return <div className="demo-two-columns">
    <section className="panel content-panel">
      <div className="panel-head"><h2>Cadastrar destinatário fictício</h2><span className="pill muted">Sem contatos reais</span></div>
      <p className="helper">Cadastre oficinas de exemplo para testar a lista de clientes. Nenhum link público é gerado.</p>
      <form className="stack demo-form" onSubmit={criar}>
        <label>Nome da oficina fictícia<input value={nome} onChange={e=>setNome(e.target.value)} minLength={3} maxLength={MAX} required placeholder="Ex.: Oficina Exemplo D"/></label>
        <button type="submit" className="primary">Cadastrar destinatário</button>
      </form>
      {erro&&<p role="alert" className="form-error">{erro}</p>}
      {sucesso&&<p role="status" className="form-info">{sucesso}</p>}
      <div className="demo-warning"><strong>Links protegidos:</strong> somente uma futura função no backend poderá criar links reais com expiração, revogação e escopo de uma NF.</div>
    </section>
    <section className="panel content-panel">
      <div className="panel-head"><h2>Clientes e entregas simuladas</h2><span className="pill muted">{dados.clientes.length} clientes</span></div>
      <label className="demo-search-label">Buscar cliente<input type="search" value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Nome da oficina fictícia"/></label>
      <div className="demo-record-list">
        {filtrados.length===0&&<p className="helper">Nenhum destinatário encontrado.</p>}
        {filtrados.map(c=>{
          const notas=dados.entregas.filter(n=>n.destinatario===c.nome);
          return <article key={c.id} className="demo-record">
            <div><strong>{c.nome}</strong><small>{notas.length} NFs associadas na simulação</small><small>{notas.map(n=>"NF "+n.nf+" ("+n.status+")").join(" · ")||"Sem notas"}</small></div>
            <div className="demo-actions"><button type="button" className="demo-danger" onClick={()=>remover(c.id)} aria-label={"Excluir cliente "+c.nome}>Excluir</button></div>
          </article>;
        })}
      </div>
    </section>
  </div>;
}

export function ComprovantesDemo({dados,atualizar}:Props) {
  const [entregaId,setEntregaId]=useState("");
  const [recebedor,setRecebedor]=useState("");
  const [observacao,setObservacao]=useState("");
  const [erro,setErro]=useState("");
  const [sucesso,setSucesso]=useState("");
  const disponiveis=dados.entregas.filter(n=>n.status==="Entregue"&&!dados.comprovantes.some(c=>c.entregaId===n.id));
  const criar=(evento:FormEvent)=>{
    evento.preventDefault();setErro("");setSucesso("");
    const n=dados.entregas.find(x=>x.id===entregaId);
    const pessoa=limparNome(recebedor);
    if(!n||n.status!=="Entregue"||dados.comprovantes.some(c=>c.entregaId===n.id)){
      setErro("Selecione uma NF concluída que ainda não tenha recibo.");return;
    }
    if(pessoa.length<2||pessoa.length>MAX||observacao.length>200){
      setErro("Informe um recebedor fictício e observação com até 200 caracteres.");return;
    }
    const instante=new Date().toLocaleString("pt-BR");
    atualizar(d=>registrar({...d,comprovantes:[{id:novoId(),entregaId:n.id,recebedor:pessoa,observacao:observacao.trim(),data:instante},...d.comprovantes]},"Recibo fictício da NF "+n.nf+" registrado"));
    setEntregaId("");setRecebedor("");setObservacao("");
    setSucesso("Recibo fictício registrado apenas nesta sessão. Nenhuma assinatura, foto ou geolocalização coletada.");
  };
  const excluir=(id:string)=>{
    setErro("");setSucesso("");
    atualizar(d=>registrar({...d,comprovantes:d.comprovantes.filter(x=>x.id!==id)},"Recibo fictício removido"));
    setSucesso("Recibo removido apenas da simulação.");
  };
  return <div className="demo-two-columns">
    <section className="panel content-panel">
      <div className="panel-head"><h2>Gerar comprovante fictício</h2><span className="pill muted">Sem foto nem assinatura</span></div>
      <p className="helper">Conclua uma entrega na tela de NFs para habilitar o recibo de teste.</p>
      <form className="stack demo-form" onSubmit={criar}>
        <label>NF entregue<select value={entregaId} onChange={e=>setEntregaId(e.target.value)} required>
          <option value="">Escolher nota concluída</option>
          {disponiveis.map(n=><option key={n.id} value={n.id}>NF {n.nf} · {n.destinatario}</option>)}
        </select></label>
        <label>Recebido por (nome inventado)<input value={recebedor} onChange={e=>setRecebedor(e.target.value)} minLength={2} maxLength={MAX} required placeholder="Ex.: Maria Exemplo"/></label>
        <label>Observação fictícia<textarea rows={3} value={observacao} onChange={e=>setObservacao(e.target.value)} maxLength={200} placeholder="Ex.: Entrega recebida no balcão"/></label>
        <button type="submit" className="primary" disabled={!disponiveis.length}>Registrar recibo fictício</button>
      </form>
      {erro&&<p role="alert" className="form-error">{erro}</p>}
      {sucesso&&<p role="status" className="form-info">{sucesso}</p>}
      <p className="helper">Comprovantes autênticos exigirão autorização do entregador, Storage privado e registro auditável no backend.</p>
    </section>
    <section className="panel content-panel">
      <div className="panel-head"><h2>Recibos de teste</h2><span className="pill muted">{dados.comprovantes.length} recibos</span></div>
      <div className="demo-record-list">
        {dados.comprovantes.length===0&&<p className="helper">Nenhum recibo simulado registrado.</p>}
        {dados.comprovantes.map(x=>{
          const nf=dados.entregas.find(n=>n.id===x.entregaId)?.nf??"removida";
          return <article className="demo-record" key={x.id}>
            <div><strong>Recibo fictício — NF {nf}</strong><small>Recebedor: {x.recebedor}</small><small>{x.data} · {x.observacao||"Sem observação"}</small></div>
            <div className="demo-actions"><button className="demo-danger" type="button" onClick={()=>excluir(x.id)}>Remover recibo</button></div>
          </article>;
        })}
      </div>
    </section>
  </div>;
}

const safeCSV=(value:string)=>'"'+ (/^[\s]*[=+\-@]/.test(value)?"'":"")+value.replace(/"/g,'""')+'"';
function csvDownload(dados:DemoDados){
  const cabecalho=["NF","Destinatário fictício","Destino fictício","Entregador fictício","Status"];
  const rows=dados.entregas.map(n=>[
    n.nf,n.destinatario,n.destino,dados.entregadores.find(m=>m.id===n.entregadorId)?.nome??"Sem entregador",n.status
  ]);
  const texto="\uFEFF"+[cabecalho,...rows].map(r=>r.map(safeCSV).join(";")).join("\r\n");
  const blob=new Blob([texto],{type:"text/csv;charset=utf-8"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");a.href=url;a.download="toaki-simulacao.csv";a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export function HistoricoDemo({dados}:Pick<Props,"dados">) {
  const [filtro,setFiltro]=useState("");
  const eventos=dados.historico.filter(e=>e.descricao.toLocaleLowerCase("pt-BR").includes(filtro.toLocaleLowerCase("pt-BR")));
  const emRota=dados.entregas.filter(n=>n.status==="Em rota").length;
  return <section className="panel content-panel">
    <div className="panel-head"><h2>Histórico e relatórios</h2><span className="pill muted">Simulação local</span></div>
    <div className="demo-report-stats mini-stat"><div><strong>{dados.entregas.length}</strong><small>NFs fictícias</small></div><div><strong>{emRota}</strong><small>Em rota</small></div><div><strong>{dados.entregas.filter(n=>n.status==="Entregue").length}</strong><small>Entregues</small></div><div><strong>{dados.comprovantes.length}</strong><small>Recibos</small></div></div>
    <div className="demo-actions demo-report-controls">
      <button type="button" className="secondary" onClick={()=>csvDownload(dados)}>Exportar CSV fictício</button>
    </div>
    <label className="demo-search-label">Filtrar histórico fictício<input type="search" value={filtro} onChange={e=>setFiltro(e.target.value)} placeholder="Ex.: NF, veículo, destinatário"/></label>
    <div className="demo-record-list">
      {eventos.length===0&&<p className="helper">Nenhum evento encontrado. Faça uma alteração simulada para visualizar o histórico.</p>}
      {eventos.map(e=><article className="demo-record" key={e.id}><div><strong>{e.descricao}</strong><small>{e.data}</small></div></article>)}
    </div>
    <p className="helper">Este histórico não é um registro de auditoria oficial e o CSV não contém dados reais.</p>
  </section>;
}

export function EmpresaDemo({dados,atualizar}:Props) {
  const [nome,setNome]=useState("");
  const [funcao,setFuncao]=useState<DemoFuncionario["funcao"]>("Vendedor");
  const [erro,setErro]=useState("");
  const [sucesso,setSucesso]=useState("");
  const criar=(evento:FormEvent)=>{
    evento.preventDefault();setErro("");setSucesso("");
    const n=limparNome(nome);
    if(n.length<3||n.length>MAX||dados.equipe.length>=50){setErro("Nome fictício inválido ou limite de 50 colaboradores atingido.");return;}
    atualizar(d=>registrar({...d,equipe:[...d.equipe,{id:novoId(),nome:n,funcao}]},"Colaborador fictício cadastrado: "+n));
    setNome("");setSucesso("Colaborador de demonstração cadastrado. Nenhum convite real enviado.");
  };
  const excluir=(id:string)=>{
    const f=dados.equipe.find(x=>x.id===id);if(!f)return;
    atualizar(d=>registrar({...d,equipe:d.equipe.filter(x=>x.id!==id)},"Colaborador fictício removido: "+f.nome));
    setSucesso("Colaborador removido da simulação.");
  };
  return <div className="demo-two-columns">
    <section className="panel content-panel">
      <div className="panel-head"><h2>Empresa e filial fictícias</h2><span className="pill muted">Sem acesso administrativo</span></div>
      <div className="demo-record"><div><strong>Soma Distribuidora — Exemplo</strong><small>Filial Maringá / PR</small><small>Este registro não representa uma empresa aprovada.</small></div></div>
      <div className="mini-stat demo-report-stats"><div><strong>1</strong><small>Filial</small></div><div><strong>{dados.equipe.length}</strong><small>Colaboradores</small></div><div><strong>{dados.veiculos.length}</strong><small>Veículos</small></div><div><strong>{dados.entregas.length}</strong><small>NFs</small></div></div>
      <p className="helper">Convites, filiais, papéis reais e permissões entre empresas exigem backend e controle por tenant.</p>
    </section>
    <section className="panel content-panel">
      <div className="panel-head"><h2>Equipe da simulação</h2><span className="pill muted">{dados.equipe.length} membros</span></div>
      <form className="stack demo-form" onSubmit={criar}>
        <label>Nome fictício do funcionário<input value={nome} onChange={e=>setNome(e.target.value)} minLength={3} maxLength={MAX} required placeholder="Ex.: Marina Exemplo"/></label>
        <label>Função fictícia<select value={funcao} onChange={e=>setFuncao(e.target.value as DemoFuncionario["funcao"])}><option>Vendedor</option><option>Gestor</option></select></label>
        <button type="submit" className="primary">Cadastrar funcionário fictício</button>
      </form>
      {erro&&<p role="alert" className="form-error">{erro}</p>}
      {sucesso&&<p role="status" className="form-info">{sucesso}</p>}
      <div className="demo-record-list">
        {dados.equipe.map(f=><article key={f.id} className="demo-record"><div><strong>{f.nome}</strong><small>{f.funcao} · não tem login nem acesso real</small></div><div className="demo-actions"><button type="button" className="demo-danger" onClick={()=>excluir(f.id)}>Excluir</button></div></article>)}
      </div>
    </section>
  </div>;
}

export function AssinaturaDemo({dados,atualizar}:Props) {
  const trocar=(plano:DemoPlano)=>{
    atualizar(d=>registrar({...d,plano},"Plano ilustrativo alterado para "+plano));
  };
  return <section className="panel content-panel">
    <div className="panel-head"><h2>Assinatura demonstrativa</h2><span className="pill muted">Nenhuma cobrança</span></div>
    <p className="helper">Escolher um plano aqui não cria contrato, cobrança, Pix ou assinatura real.</p>
    <div className="demo-plan-grid">
      {(["Piloto","Profissional"] as const).map(plano=><article key={plano} className={"demo-plan "+(dados.plano===plano?"demo-plan-selected":"")}>
        <strong>{plano}</strong>
        <p>{plano==="Piloto"?"Modo inicial com dados fictícios.":"Prévia visual de uma modalidade futura."}</p>
        <span className="pill muted">{dados.plano===plano?"Selecionado na simulação":"Não selecionado"}</span>
        <button type="button" className={dados.plano===plano?"secondary":"primary"} disabled={dados.plano===plano} onClick={()=>trocar(plano)}>{dados.plano===plano?"Plano demonstrativo atual":"Simular seleção"}</button>
      </article>)}
    </div>
    <p className="helper">Assinaturas e pagamentos serão liberados apenas depois das regras comerciais, limites de uso e integração de cobrança terem sido validados.</p>
  </section>;
}
