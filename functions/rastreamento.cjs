"use strict";
const {randomBytes,createHash,timingSafeEqual}=require("node:crypto");
const {onCall,HttpsError}=require("firebase-functions/v2/https");
const {getAuth}=require("firebase-admin/auth");
const {getFirestore,FieldValue,Timestamp}=require("firebase-admin/firestore");
const {autorizarDestinoOperacional}=require("./ambiente-operacao.cjs");
const {identificador,conviteToken,posicaoValidada,podeEnviarPosicao}=require("./rastreamento-politica.cjs");

const options={region:"southamerica-east1",maxInstances:3,timeoutSeconds:45,memory:"256MiB"};
const db=()=>getFirestore();
const empresaRef=id=>db().doc("empresas/"+id);
const hash=s=>createHash("sha256").update(s).digest("hex");
function uidVerificado(req){
  if(!req.auth?.uid||req.auth.token.email_verified!==true)throw new HttpsError("unauthenticated","Entre com uma conta de e-mail verificado.");
  return req.auth.uid;
}
function validarId(v,tipo){
  try{return identificador(v,tipo);}catch(e){throw new HttpsError("invalid-argument",e.message);}
}
function ambiente(empresaId,empresa){
  try {
    return autorizarDestinoOperacional({
      projeto:process.env.GCLOUD_PROJECT||process.env.GCP_PROJECT||process.env.GOOGLE_CLOUD_PROJECT||"",
      empresaId,empresa,habilitacao:process.env.TOAKI_PILOTO_NO_ORIGINAL,
      empresasPermitidas:process.env.TOAKI_PILOTO_EMPRESAS
    });
  }catch(e){throw new HttpsError("failed-precondition",e.message);}
}
async function membroEmpresa(empresaId,uid,papeis){
  const ref=empresaRef(empresaId);
  const [emp,membro]=await Promise.all([ref.get(),ref.collection("funcionarios").doc(uid).get()]);
  if(!emp.exists||emp.data().status!=="ativa")throw new HttpsError("failed-precondition","Empresa não está ativa.");
  ambiente(empresaId,emp.data());
  if(!membro.exists||membro.data().ativo!==true||!papeis.includes(membro.data().papel))
    throw new HttpsError("permission-denied","Seu perfil não tem permissão para esta operação.");
  return ref;
}
const GESTORES=["dono_empresa","gestor"];
const OPERADORES=["dono_empresa","gestor","vendedor"];

// O gestor gera um convite de uso único. Somente o motorista autenticado e verificado pode aceitá-lo.
exports.criarConviteEntregadorPiloto=onCall(options,async req=>{
  const uid=uidVerificado(req);
  const empresaId=validarId(req.data?.empresaId,"empresa");
  const entregadorId=validarId(req.data?.entregadorId,"entregador");
  const empresa=await membroEmpresa(empresaId,uid,GESTORES);
  const motoboy=await empresa.collection("entregadores_vinculados").doc(entregadorId).get();
  if(!motoboy.exists||motoboy.data().ativo===false||motoboy.data().uid_conta)
    throw new HttpsError("failed-precondition","Entregador inexistente ou já conectado a uma conta.");
  const conviteId=randomBytes(16).toString("hex");
  const segredo=randomBytes(32).toString("hex");
  const expiraEm=Timestamp.fromMillis(Date.now()+24*3600*1000);
  await empresa.collection("convites_entregador").doc(conviteId).create({
    tipo_registro:"convite_entregador",entregador_id:entregadorId,
    token_hash:hash(segredo),criado_por_uid:uid,criado_em:FieldValue.serverTimestamp(),
    expira_em:expiraEm,usado:false
  });
  return {token:empresaId+"."+conviteId+"."+segredo,expiraEm:expiraEm.toMillis()};
});

// Um convite não concede privilégio administrativo. Vínculo e papel são concedidos pelo servidor.
exports.aceitarConviteEntregadorPiloto=onCall(options,async req=>{
  const uid=uidVerificado(req);
  let p;
  try{p=conviteToken(req.data?.token);}catch(e){throw new HttpsError("invalid-argument",e.message);}
  const papel=req.auth.token.role;
  if(papel && !["cliente","entregador"].includes(papel))
    throw new HttpsError("permission-denied","Conta já possui outro cargo; use uma conta específica do entregador.");
  const empresa=empresaRef(p.empresaId);
  const convite=empresa.collection("convites_entregador").doc(p.conviteId);
  const mapa=db().doc("entregadores/"+uid);
  const usuarioRef=empresa.collection("funcionarios").doc(uid);
  let entregadorId="";
  await db().runTransaction(async tx=>{
    const [emp,snap,mapeado,func]=await Promise.all([tx.get(empresa),tx.get(convite),tx.get(mapa),tx.get(usuarioRef)]);
    if(!emp.exists||emp.data().status!=="ativa")throw new HttpsError("failed-precondition","Empresa não está ativa.");
    ambiente(p.empresaId,emp.data());
    if(!snap.exists)throw new HttpsError("permission-denied","Convite não encontrado.");
    const c=snap.data();
    const esperado=Buffer.from(c.token_hash||"","hex");
    const fornecido=Buffer.from(hash(p.segredo),"hex");
    if(esperado.length!==fornecido.length||!timingSafeEqual(esperado,fornecido))
      throw new HttpsError("permission-denied","Convite inválido.");
    if(!c.usado && (!c.expira_em?.toMillis||c.expira_em.toMillis()<Date.now()))
      throw new HttpsError("failed-precondition","Convite expirado.");
    if(c.usado && c.usado_por_uid!==uid)throw new HttpsError("permission-denied","Convite já utilizado.");
    entregadorId=c.entregador_id;
    const motoristaRef=empresa.collection("entregadores_vinculados").doc(entregadorId);
    const motorista=await tx.get(motoristaRef);
    if(!motorista.exists||motorista.data().ativo===false)
      throw new HttpsError("failed-precondition","Entregador inativo.");
    if(motorista.data().uid_conta && motorista.data().uid_conta!==uid)
      throw new HttpsError("permission-denied","Entregador já vinculado.");
    if(mapeado.exists && (mapeado.data().empresa_id!==p.empresaId||mapeado.data().entregador_id!==entregadorId))
      throw new HttpsError("permission-denied","Conta já vinculada a outro entregador.");
    if(func.exists && func.data().papel!=="entregador")
      throw new HttpsError("permission-denied","Conta já tem acesso incompatível.");
    if(!c.usado){
      tx.update(convite,{usado:true,usado_por_uid:uid,usado_em:FieldValue.serverTimestamp()});
      tx.update(motoristaRef,{uid_conta:uid,atualizado_em:FieldValue.serverTimestamp()});
      tx.set(mapa,{empresa_id:p.empresaId,entregador_id:entregadorId,ativo:true,criado_em:FieldValue.serverTimestamp()});
      tx.set(usuarioRef,{tipo_registro:"funcionario_empresa",titulo_registro:"Entregador — "+(motorista.data().nome||"Motorista"),
        nome_exibicao:motorista.data().nome||"Entregador",papel:"entregador",ativo:true,
        criado_em:FieldValue.serverTimestamp()});
    }
  });
  // Retentativa com o mesmo convite repara claims se houve falha na emissão do token.
  try {
    const user=await getAuth().getUser(uid);
    await getAuth().setCustomUserClaims(uid,{...(user.customClaims||{}),role:"entregador",empresa_id:p.empresaId});
  }catch{throw new HttpsError("internal","Vínculo salvo. Entre novamente ou repita a confirmação do convite para atualizar o acesso.");}
  return {ok:true,empresaId:p.empresaId,entregadorId};
});

// Funcionário com permissão seleciona uma NF pendente e um entregador já vinculado a uma conta.
exports.iniciarEntregaPiloto=onCall(options,async req=>{
  const uid=uidVerificado(req);
  const empresaId=validarId(req.data?.empresaId,"empresa");
  const pedidoId=validarId(req.data?.pedidoId,"pedido");
  const entregadorId=validarId(req.data?.entregadorId,"entregador");
  const emp=await membroEmpresa(empresaId,uid,OPERADORES);
  const pedidoRef=emp.collection("pedidos").doc(pedidoId);
  const motoristaRef=emp.collection("entregadores_vinculados").doc(entregadorId);
  await db().runTransaction(async tx=>{
    const [pedido,motorista]=await Promise.all([tx.get(pedidoRef),tx.get(motoristaRef)]);
    if(!pedido.exists||pedido.data().status!=="pendente")throw new HttpsError("failed-precondition","NF não está pendente.");
    const destino=pedido.data().endereco_entrega;
    if(!destino||!String(destino).trim())throw new HttpsError("failed-precondition","NF sem destino válido.");
    const uidBoy=motorista.data()?.uid_conta;
    if(!motorista.exists||motorista.data().ativo===false||typeof uidBoy!=="string")
      throw new HttpsError("failed-precondition","Entregador ainda não vinculou o aplicativo.");
    const mapa=await tx.get(db().doc("entregadores/"+uidBoy));
    if(!mapa.exists||mapa.data().ativo!==true||mapa.data().empresa_id!==empresaId||mapa.data().entregador_id!==entregadorId)
      throw new HttpsError("failed-precondition","Vínculo do entregador não está ativo.");
    tx.update(pedidoRef,{status:"em_rota",entregador_id:entregadorId,entregador_uid:uidBoy,
      iniciou_em:FieldValue.serverTimestamp(),atualizado_em:FieldValue.serverTimestamp()});
    tx.set(db().doc("entregadores/"+uidBoy+"/tarefas/"+pedidoId),{
      empresa_id:empresaId,pedido_id:pedidoId,numero_nf:pedido.data().numero_nf,
      endereco_entrega:destino,status:"em_rota",iniciou_em:FieldValue.serverTimestamp()});
    tx.create(emp.collection("historico").doc(),{tipo_registro:"auditoria_rastreamento",acao:"iniciar_entrega",
      titulo_registro:"Início da entrega NF "+pedido.data().numero_nf,pedido_id:pedidoId,entregador_uid:uidBoy,
      responsavel_uid:uid,criado_em:FieldValue.serverTimestamp()});
  });
  return {ok:true};
});

// GPS ativo só com botão do motorista e NF em rota. Coordenadas nunca são aceitas como cargo ou estado.
exports.enviarGpsEntregaPiloto=onCall(options,async req=>{
  const uid=uidVerificado(req);
  let pos;
  try{pos=posicaoValidada(req.data);}catch(e){throw new HttpsError("invalid-argument",e.message);}
  const mapa=await db().doc("entregadores/"+uid).get();
  if(!mapa.exists||mapa.data().ativo!==true)
    throw new HttpsError("permission-denied","Entregador sem vínculo ativo.");
  const empresaId=validarId(mapa.data().empresa_id,"empresa");
  const emp=await empresaRef(empresaId).get();
  if(!emp.exists||emp.data().status!=="ativa")throw new HttpsError("permission-denied","Empresa desativada.");
  ambiente(empresaId,emp.data());
  const pedidoRef=empresaRef(empresaId).collection("pedidos").doc(pos.pedidoId);
  const tarefaRef=db().doc("entregadores/"+uid+"/tarefas/"+pos.pedidoId);
  await db().runTransaction(async tx=>{
    const [pedido,tarefa]=await Promise.all([tx.get(pedidoRef),tx.get(tarefaRef)]);
    if(!tarefa.exists||tarefa.data().empresa_id!==empresaId||tarefa.data().status!=="em_rota")
      throw new HttpsError("permission-denied","Entrega não atribuída a você.");
    try{podeEnviarPosicao(pedido.data(),uid,Date.now());}
    catch(e){throw new HttpsError("failed-precondition",e.message);}
    const recebidaEm=Timestamp.now();
    tx.update(pedidoRef,{posicao_atual:{latitude:pos.latitude,longitude:pos.longitude,
      precisao:pos.precisao,recebida_em:recebidaEm},atualizado_em:recebidaEm});
    // Histórico técnico com validade prevista. TTL deve ser ativado antes de operar em produção.
    tx.create(empresaRef(empresaId).collection("posicoes").doc(),{
      tipo_registro:"posicao_entrega",pedido_id:pos.pedidoId,entregador_uid:uid,
      latitude:pos.latitude,longitude:pos.longitude,precisao:pos.precisao,
      criado_em:recebidaEm,expira_em:Timestamp.fromMillis(Date.now()+72*3600*1000)
    });
  });
  return {ok:true};
});

exports.concluirEntregaPiloto=onCall(options,async req=>{
  const uid=uidVerificado(req);
  const pedidoId=validarId(req.data?.pedidoId,"pedido");
  const mapa=await db().doc("entregadores/"+uid).get();
  if(!mapa.exists||mapa.data().ativo!==true)throw new HttpsError("permission-denied","Entregador sem vínculo.");
  const empresaId=validarId(mapa.data().empresa_id,"empresa");
  const emp=await empresaRef(empresaId).get();
  if(!emp.exists||emp.data().status!=="ativa")throw new HttpsError("permission-denied","Empresa desativada.");
  ambiente(empresaId,emp.data());
  const pedidoRef=empresaRef(empresaId).collection("pedidos").doc(pedidoId);
  const tarefaRef=db().doc("entregadores/"+uid+"/tarefas/"+pedidoId);
  await db().runTransaction(async tx=>{
    const [pedido,tarefa]=await Promise.all([tx.get(pedidoRef),tx.get(tarefaRef)]);
    if(!pedido.exists||pedido.data().status!=="em_rota"||pedido.data().entregador_uid!==uid||!tarefa.exists||tarefa.data().status!=="em_rota")
      throw new HttpsError("permission-denied","Entrega não está ativa para você.");
    tx.update(pedidoRef,{status:"entregue",finalizado_em:FieldValue.serverTimestamp(),
      posicao_atual:FieldValue.delete(),atualizado_em:FieldValue.serverTimestamp()});
    tx.update(tarefaRef,{status:"entregue",finalizado_em:FieldValue.serverTimestamp()});
    tx.create(empresaRef(empresaId).collection("historico").doc(),{tipo_registro:"auditoria_rastreamento",
      acao:"concluir_entrega",titulo_registro:"Entrega finalizada NF "+(pedido.data().numero_nf||pedidoId),
      pedido_id:pedidoId,entregador_uid:uid,criado_em:FieldValue.serverTimestamp()});
  });
  return {ok:true};
});
