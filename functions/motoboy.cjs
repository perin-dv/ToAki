"use strict";
const crypto=require("node:crypto");
const {onCall,HttpsError}=require("firebase-functions/v2/https");
const {getAuth}=require("firebase-admin/auth");
const {getFirestore,Timestamp,FieldValue}=require("firebase-admin/firestore");
const {getStorage}=require("firebase-admin/storage");
const {autorizarDestinoOperacional}=require("./ambiente-operacao.cjs");
const {podeOperarEmpresa}=require("./acesso-identidade.cjs");
const P=require("./motoboy-policy.cjs");
const opt={region:"southamerica-east1",maxInstances:4,timeoutSeconds:45,memory:"256MiB"};
const db=()=>getFirestore();
const emp=id=>db().doc("empresas/"+id);
function erro(e){throw e instanceof HttpsError?e:new HttpsError("invalid-argument",e.message||"Dados inválidos.");}
function auth(req){if(!req.auth?.uid||req.auth.token.email_verified!==true)throw new HttpsError("unauthenticated","Faça login e confirme o e-mail.");return req.auth.uid;}
function valida(input,fn){try{return fn(input);}catch(e){erro(e);}}
function ambiente(id,dados){
  try{autorizarDestinoOperacional({projeto:process.env.GCLOUD_PROJECT||process.env.GCP_PROJECT||process.env.GOOGLE_CLOUD_PROJECT||"",empresaId:id,empresa:dados,
    habilitacao:process.env.TOAKI_PILOTO_NO_ORIGINAL,empresasPermitidas:process.env.TOAKI_PILOTO_EMPRESAS});}
  catch(e){throw new HttpsError("failed-precondition",e.message);}
}
async function gestor(req,empresaId){
  const uid=auth(req);
  if(req.auth.token.empresa_id!==empresaId||!podeOperarEmpresa({empresaId,claims:req.auth.token}))
    throw new HttpsError("permission-denied","Sua conta não pertence à empresa.");
  const [e,m]=await Promise.all([emp(empresaId).get(),emp(empresaId).collection("funcionarios").doc(uid).get()]);
  if(!e.exists||e.data().status!=="ativa")throw new HttpsError("failed-precondition","Empresa inativa.");
  ambiente(empresaId,e.data());
  if(!m.exists||m.data().ativo!==true||!["dono_empresa","gestor"].includes(m.data().papel))
    throw new HttpsError("permission-denied","Somente gestor ativo pode convidar entregadores.");
}
async function entregador(req){
  const uid=auth(req);
  if(req.auth.token.role!=="entregador")throw new HttpsError("permission-denied","Conta não autorizada como entregador.");
  const mapping=await db().doc("entregadores/"+uid).get();
  if(!mapping.exists||mapping.data().ativo!==true)throw new HttpsError("permission-denied","Conta sem vínculo de entregador.");
  const empresaId=valida(mapping.data().empresa_id,P.empresaId);
  if(req.auth.token.empresa_id!==empresaId)throw new HttpsError("permission-denied","Empresa da sessão não confere.");
  const id=valida(mapping.data().entregador_id,v=>P.identificador(v,"Entregador"));
  const [e,m,c]=await Promise.all([
    emp(empresaId).get(),
    emp(empresaId).collection("funcionarios").doc(uid).get(),
    emp(empresaId).collection("entregadores_vinculados").doc(id).get()
  ]);
  if(!e.exists||e.data().status!=="ativa")throw new HttpsError("failed-precondition","Empresa inativa.");
  ambiente(empresaId,e.data());
  if(!m.exists||m.data().ativo!==true||m.data().papel!=="entregador"||
    !c.exists||c.data().ativo===false||c.data().uid_conta!==uid)
    throw new HttpsError("permission-denied","Vínculo do entregador não está ativo.");
  return {uid,empresaId,id,nome:c.data().nome||"Entregador"};
}
function mirror(pedidoData,empresaId,pedidoId){
  const uid=pedidoData.cliente_uid_vinculado;
  return typeof uid==="string"&&uid?
    db().doc("clientes/"+uid+"/entregas/"+empresaId+"__"+pedidoId):null;
}
function dadosTarefa(p,id,empresaId){
  return {pedidoId:id,empresaId,numeroNF:p.numero_nf||id,destinatario:p.destinatario_nome||"Cliente",
    endereco:p.endereco_entrega||"",veiculo:p.veiculo_placa||"",status:p.status||"pendente"};
}
function validarAtribuicao(p,c){
  if(!p||p.ativo===false||p.entregador_id!==c.id)throw new HttpsError("permission-denied","NF não atribuída a você.");
  if(p.entregador_uid&&p.entregador_uid!==c.uid)throw new HttpsError("permission-denied","NF associada a outra conta.");
}
exports.criarConviteMotoboyPiloto=onCall(opt,async req=>{
  const e=valida(req.data?.empresaId,P.empresaId);
  const id=valida(req.data?.entregadorId,v=>P.identificador(v,"Entregador"));
  const email=valida(req.data?.email,P.validarEmail);
  await gestor(req,e);
  const ref=emp(e).collection("entregadores_vinculados").doc(id);
  const snap=await ref.get();
  if(!snap.exists||snap.data().ativo===false||snap.data().uid_conta)
    throw new HttpsError("failed-precondition","Entregador inexistente, inativo ou já vinculado ao aplicativo.");
  const conviteId=crypto.randomBytes(16).toString("hex"),segredo=P.gerarSegredo();
  const agora=FieldValue.serverTimestamp(),expira=Timestamp.fromMillis(Date.now()+86400000);
  await emp(e).collection("convites_entregador").doc(conviteId).create({
    tipo_registro:"convite_entregador",titulo_registro:"Convite aplicativo — "+(snap.data().nome||"Entregador"),
    entregador_id:id,email_destinatario:email,hash_token:P.hash(segredo),criado_em:agora,expira_em:expira,
    criado_por_uid:req.auth.uid,status:"pendente"
  });
  return {ok:true,codigo:e+"."+conviteId+"."+segredo,expiraEm:expira.toMillis()};
});
exports.aceitarConviteMotoboyPiloto=onCall(opt,async req=>{
  const uid=auth(req);
  const parsed=valida(req.data?.codigo,P.validarToken);
  const role=req.auth.token.role;
  if(role&&!["cliente","entregador"].includes(role))
    throw new HttpsError("permission-denied","Esta conta já tem outro cargo.");
  if(req.auth.token.empresa_id&&req.auth.token.empresa_id!==parsed.empresaId)
    throw new HttpsError("permission-denied","Conta pertence a outra empresa.");
  const user=await getAuth().getUser(uid);
  if(user.disabled||!user.emailVerified||!user.email)
    throw new HttpsError("permission-denied","Confirme o e-mail antes de aceitar.");
  const conviteRef=emp(parsed.empresaId).collection("convites_entregador").doc(parsed.conviteId);
  const mapping=db().doc("entregadores/"+uid);
  let entregadorId="";
  await db().runTransaction(async tx=>{
    const [e,inv,prev]=await Promise.all([tx.get(emp(parsed.empresaId)),tx.get(conviteRef),tx.get(mapping)]);
    if(!e.exists||e.data().status!=="ativa")throw new HttpsError("failed-precondition","Empresa inativa.");
    ambiente(parsed.empresaId,e.data());
    const i=inv.data();
    if(!i||!P.segredoConfere(parsed.segredo,i.hash_token)||
      i.email_destinatario!==P.validarEmail(user.email))
      throw new HttpsError("permission-denied","Convite não corresponde à conta autenticada.");
    const id=valida(i.entregador_id,v=>P.identificador(v,"Entregador"));
    entregadorId=id;
    const driverRef=emp(parsed.empresaId).collection("entregadores_vinculados").doc(id);
    const employeeRef=emp(parsed.empresaId).collection("funcionarios").doc(uid);
    const [driver,member]=await Promise.all([tx.get(driverRef),tx.get(employeeRef)]);
    if(!driver.exists||driver.data().ativo===false||driver.data().uid_conta&&driver.data().uid_conta!==uid)
      throw new HttpsError("failed-precondition","Entregador indisponível.");
    if(prev.exists&&(prev.data().empresa_id!==parsed.empresaId||prev.data().entregador_id!==id))
      throw new HttpsError("permission-denied","Conta já vinculada a outro entregador.");
    if(member.exists&&member.data().papel!=="entregador")
      throw new HttpsError("permission-denied","Conta já tem função incompatível.");
    if(i.status==="resgatado"&&i.usado_por_uid===uid&&prev.exists)return;
    if(i.status!=="pendente"||i.expira_em?.toMillis?.()<Date.now())
      throw new HttpsError("failed-precondition","Convite usado ou expirado.");
    const ts=FieldValue.serverTimestamp();
    tx.update(conviteRef,{status:"resgatado",usado_em:ts,usado_por_uid:uid});
    tx.update(driverRef,{uid_conta:uid,atualizado_em:ts});
    tx.create(mapping,{tipo_registro:"entregador_autenticado",titulo_registro:"Entregador — "+driver.data().nome,
      empresa_id:parsed.empresaId,entregador_id:id,ativo:true,criado_em:ts});
    tx.create(employeeRef,{tipo_registro:"funcionario_empresa",titulo_registro:"Entregador — "+driver.data().nome,
      nome_exibicao:driver.data().nome,papel:"entregador",ativo:true,criado_em:ts});
    tx.create(emp(parsed.empresaId).collection("historico").doc(),{
      tipo_registro:"auditoria_entregador",titulo_registro:"Vínculo do aplicativo — "+driver.data().nome,
      acao:"vincular_entregador",registro_id:id,responsavel_uid:uid,criado_em:ts
    });
  });
  try{
    const u=await getAuth().getUser(uid);
    if(u.customClaims?.empresa_id&&u.customClaims.empresa_id!==parsed.empresaId)throw Error("Empresa inconsistente.");
    await getAuth().setCustomUserClaims(uid,{...(u.customClaims||{}),role:"entregador",empresa_id:parsed.empresaId});
  }catch{throw new HttpsError("internal","Vínculo salvo, mas o acesso ainda está pendente. Reabra o convite.");}
  return {ok:true,entregadorId,empresaId:parsed.empresaId};
});
exports.listarEntregasMotoboyPiloto=onCall(opt,async req=>{
  const c=await entregador(req);
  const list=await emp(c.empresaId).collection("pedidos").where("entregador_id","==",c.id).limit(60).get();
  return {ok:true,nome:c.nome,entregas:list.docs.filter(d=>d.data().ativo!==false)
    .map(d=>dadosTarefa(d.data(),d.id,c.empresaId))};
});
exports.iniciarEntregaMotoboyPiloto=onCall(opt,async req=>{
  const c=await entregador(req),id=valida(req.data?.pedidoId,v=>P.identificador(v,"NF"));
  const pedido=emp(c.empresaId).collection("pedidos").doc(id);
  await db().runTransaction(async tx=>{
    const p=await tx.get(pedido);if(!p.exists)throw new HttpsError("not-found","NF não encontrada.");
    const d=p.data();validarAtribuicao(d,c);
    if(d.status==="em_rota"&&d.entregador_uid===c.uid)return;
    if(d.status!=="pendente")throw new HttpsError("failed-precondition","Esta NF não está aguardando saída.");
    const m=mirror(d,c.empresaId,id);
    if(m&&!(await tx.get(m)).exists)throw new HttpsError("failed-precondition","Espelho do cliente inconsistente.");
    const ts=FieldValue.serverTimestamp();
    tx.update(pedido,{status:"em_rota",entregador_uid:c.uid,iniciou_em:ts,atualizado_em:ts});
    if(m)tx.update(m,{status:"em_rota",atualizado_em:ts});
    tx.set(db().doc("entregadores/"+c.uid+"/tarefas/"+id),{
      ...dadosTarefa({...d,status:"em_rota"},id,c.empresaId),tipo_registro:"tarefa_entregador",
      titulo_registro:"NF "+d.numero_nf+" — "+(d.destinatario_nome||"Cliente"),atualizado_em:ts
    });
    tx.create(emp(c.empresaId).collection("historico").doc(),{
      tipo_registro:"auditoria_entrega",titulo_registro:"Início de rota — NF "+d.numero_nf,
      acao:"iniciar_rota_motoboy",registro_id:id,responsavel_uid:c.uid,criado_em:ts});
  });
  return {ok:true};
});
exports.enviarGpsMotoboyPiloto=onCall(opt,async req=>{
  const c=await entregador(req);
  const pos=valida(req.data,P.gpsValido);
  const pedido=emp(c.empresaId).collection("pedidos").doc(pos.pedidoId);
  await db().runTransaction(async tx=>{
    const p=await tx.get(pedido);
    if(!p.exists)throw new HttpsError("not-found","Entrega não encontrada.");
    const d=p.data();validarAtribuicao(d,c);
    try{P.permissaoGps(d,c.uid,Date.now());}catch(e){throw new HttpsError("failed-precondition",e.message);}
    const m=mirror(d,c.empresaId,pos.pedidoId);
    if(m&&!(await tx.get(m)).exists)throw new HttpsError("failed-precondition","Espelho privado inconsistente.");
    const now=Timestamp.now();
    const gps={latitude:pos.latitude,longitude:pos.longitude,precisao:pos.precisao,
      atualizado_em:now};
    tx.update(pedido,{posicao_atual:gps,atualizado_em:now});
    if(m)tx.update(m,{posicao_atual:gps,atualizado_em:now});
  });
  return {ok:true};
});
exports.pararGpsMotoboyPiloto=onCall(opt,async req=>{
  const c=await entregador(req),id=valida(req.data?.pedidoId,v=>P.identificador(v,"NF"));
  const pedido=emp(c.empresaId).collection("pedidos").doc(id);
  await db().runTransaction(async tx=>{
    const p=await tx.get(pedido);if(!p.exists)throw new HttpsError("not-found","NF não encontrada.");
    const d=p.data();validarAtribuicao(d,c);
    const m=mirror(d,c.empresaId,id);
    if(m&&!(await tx.get(m)).exists)throw new HttpsError("failed-precondition","Espelho do cliente inconsistente.");
    tx.update(pedido,{posicao_atual:FieldValue.delete(),atualizado_em:FieldValue.serverTimestamp()});
    if(m)tx.update(m,{posicao_atual:FieldValue.delete(),atualizado_em:FieldValue.serverTimestamp()});
  });
  return {ok:true};
});
exports.concluirEntregaMotoboyPiloto=onCall(opt,async req=>{
  const c=await entregador(req),id=valida(req.data?.pedidoId,v=>P.identificador(v,"NF"));
  const pedido=emp(c.empresaId).collection("pedidos").doc(id);
  const snap=await pedido.get();if(!snap.exists)throw new HttpsError("not-found","NF não encontrada.");
  validarAtribuicao(snap.data(),c);
  if(snap.data().status==="entregue")return {ok:true,jaConcluida:true};
  if(snap.data().status!=="em_rota")throw new HttpsError("failed-precondition","Rota não iniciada.");
  const foto=P.nomeArquivo(c.empresaId,id,c.uid,"foto");
  const assinatura=P.nomeArquivo(c.empresaId,id,c.uid,"assinatura");
  // Nenhum URL público ou token de download é armazenado no Firestore.
  let objects;
  try{
    objects=await Promise.all([foto,assinatura].map(async path=>{
      const [metadata]=await getStorage().bucket().file(path).getMetadata();
      if(metadata.contentType!=="image/png"||Number(metadata.size)<64||
        Number(metadata.size)>(path.endsWith("foto.png")?8*1024*1024:2*1024*1024))
        throw Error("Foto ou assinatura fora do formato autorizado.");
      return path;
    }));
  }catch{throw new HttpsError("failed-precondition","Envie a foto e a assinatura antes de confirmar.");}
  await db().runTransaction(async tx=>{
    const p=await tx.get(pedido),d=p.data();if(!p.exists)throw new HttpsError("not-found","NF não encontrada.");
    validarAtribuicao(d,c);
    if(d.status==="entregue")return;
    if(d.status!=="em_rota")throw new HttpsError("failed-precondition","Entrega não está em rota.");
    const m=mirror(d,c.empresaId,id),comprovante=emp(c.empresaId).collection("comprovantes").doc(id);
    const [existente,espelho]=await Promise.all([tx.get(comprovante),m?tx.get(m):Promise.resolve(null)]);
    if(existente.exists)throw new HttpsError("already-exists","Esta entrega já tem comprovante.");
    if(m&&!espelho.exists)throw new HttpsError("failed-precondition","Espelho do cliente inconsistente.");
    const ts=FieldValue.serverTimestamp();
    tx.create(comprovante,{
      tipo_registro:"comprovante_entrega",titulo_registro:"Comprovante NF "+(d.numero_nf||id),
      pedido_id:id,entregador_uid:c.uid,arquivo_foto:objects[0],arquivo_assinatura:objects[1],criado_em:ts
    });
    tx.update(pedido,{status:"entregue",situacao_legivel:"Entrega registrada",posicao_atual:FieldValue.delete(),
      finalizado_em:ts,atualizado_em:ts,comprovante_id:id});
    if(m)tx.update(m,{status:"entregue",posicao_atual:FieldValue.delete(),atualizado_em:ts});
    tx.update(db().doc("entregadores/"+c.uid+"/tarefas/"+id),{status:"entregue",atualizado_em:ts});
    tx.create(emp(c.empresaId).collection("historico").doc(),{
      tipo_registro:"auditoria_entrega",titulo_registro:"Entrega comprovada — NF "+(d.numero_nf||id),
      acao:"confirmar_entrega_motoboy",registro_id:id,responsavel_uid:c.uid,criado_em:ts});
  });
  return {ok:true};
});
