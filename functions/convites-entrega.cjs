"use strict";
const {onCall,HttpsError}=require("firebase-functions/v2/https");
const {getFirestore,FieldValue}=require("firebase-admin/firestore");
const {getAuth}=require("firebase-admin/auth");
const {autorizarDestinoOperacional}=require("./ambiente-operacao.cjs");
const {podeOperarEmpresa}=require("./acesso-identidade.cjs");
const {
  validarEmissao,validarResgate,gerarToken,digerirToken,tokenConfere,
  idEntregaCliente,DURACAO_CONVITE_MS
}=require("./convite-politica.cjs");

const options={region:"southamerica-east1",maxInstances:3,timeoutSeconds:45,memory:"256MiB"};
const project=()=>process.env.GCLOUD_PROJECT||process.env.GCP_PROJECT||process.env.GOOGLE_CLOUD_PROJECT||"";
function verificarPiloto(empresaId,empresa){
  try{
    return autorizarDestinoOperacional({
      projeto:project(),empresaId,empresa,
      habilitacao:process.env.TOAKI_PILOTO_NO_ORIGINAL,
      empresasPermitidas:process.env.TOAKI_PILOTO_EMPRESAS
    });
  }catch(e){throw new HttpsError("failed-precondition",e.message);}
}
function dadosEntrega(empresaId,pedidoId,pedido,nomeEmpresa,agora){
  return {
    tipo_registro:"entrega_cliente_vinculada",
    titulo_registro:"NF "+pedido.numero_nf,
    empresa_id:empresaId,pedido_id:pedidoId,
    numero_nf:pedido.numero_nf,
    empresa_nome:nomeEmpresa,
    endereco_entrega:pedido.endereco_entrega||"",
    status:pedido.status,
    criado_em:agora,atualizado_em:agora
  };
}
exports.criarConviteEntregaPiloto=onCall(options,async request=>{
  if(!request.auth?.uid)throw new HttpsError("unauthenticated","Entre na conta empresarial.");
  let info;
  try{info=validarEmissao(request.data);}catch(e){throw new HttpsError("invalid-argument",e.message);}
  const {empresaId,pedidoId}=info;
  if(!podeOperarEmpresa({empresaId,claims:request.auth.token})||
     request.auth.token.empresa_id!==empresaId)
    throw new HttpsError("permission-denied","Sem autorização empresarial.");
  const db=getFirestore(),empresaRef=db.doc("empresas/"+empresaId);
  const membroRef=empresaRef.collection("funcionarios").doc(request.auth.uid);
  const [empresa,membro]=await Promise.all([empresaRef.get(),membroRef.get()]);
  if(!empresa.exists||empresa.data()?.status!=="ativa")throw new HttpsError("failed-precondition","Empresa inativa.");
  verificarPiloto(empresaId,empresa.data());
  if(!membro.exists||membro.data()?.ativo!==true||
    !["dono_empresa","gestor"].includes(membro.data()?.papel))
    throw new HttpsError("permission-denied","Apenas gestores autorizados podem convidar clientes.");

  const token=gerarToken(),hash=digerirToken(token),expiraEm=Date.now()+DURACAO_CONVITE_MS;
  const pedidoRef=empresaRef.collection("pedidos").doc(pedidoId);
  const conviteRef=empresaRef.collection("links_rastreamento").doc(pedidoId);
  const auditRef=empresaRef.collection("historico").doc();
  await db.runTransaction(async tx=>{
    const pedido=await tx.get(pedidoRef);
    if(!pedido.exists||pedido.data()?.ativo===false)throw new HttpsError("not-found","NF não encontrada.");
    const d=pedido.data();
    if(!["pendente","em_rota"].includes(d.status)||d.cliente_uid_vinculado)
      throw new HttpsError("failed-precondition","Essa NF não permite novo convite.");
    if(typeof d.destinatario_id!=="string"||!d.destinatario_id)
      throw new HttpsError("failed-precondition","NF sem destinatário cadastrado.");
    const cliente=await tx.get(empresaRef.collection("clientes").doc(d.destinatario_id));
    if(!cliente.exists||cliente.data()?.ativo===false)
      throw new HttpsError("failed-precondition","Destinatário desativado ou não encontrado.");
    const agora=FieldValue.serverTimestamp();
    // Uma única versão ativa por NF; novo convite invalida imediatamente o antigo.
    tx.set(conviteRef,{
      tipo_registro:"convite_acesso_entrega",empresa_id:empresaId,pedido_id:pedidoId,
      destinatario_id:d.destinatario_id,hash_token:hash,
      status:"pendente",expira_em_ms:expiraEm,
      emitido_por_uid:request.auth.uid,criado_em:agora
    });
    tx.create(auditRef,{
      tipo_registro:"auditoria_operacao_empresa",acao:"criar_convite_cliente",
      registro_id:pedidoId,responsavel_uid:request.auth.uid,criado_em:agora
    });
  });
  // Segredo retornado UMA vez ao gestor, sem persisti-lo em texto claro.
  return {ok:true,empresaId,pedidoId,token,expiraEm};
});

exports.resgatarConviteEntregaPiloto=onCall(options,async request=>{
  if(!request.auth?.uid)throw new HttpsError("unauthenticated","Entre na sua conta para vincular a entrega.");
  if(request.auth.token.email_verified!==true||
    ![undefined,null,"cliente"].includes(request.auth.token.role))
    throw new HttpsError("permission-denied","É necessário um perfil de cliente com e-mail confirmado.");
  let entrada;
  try{entrada=validarResgate(request.data);}catch(e){throw new HttpsError("invalid-argument",e.message);}
  const {empresaId,pedidoId,token}=entrada;
  const usuario=await getAuth().getUser(request.auth.uid);
  if(usuario.disabled||!usuario.emailVerified)
    throw new HttpsError("permission-denied","Confirme seu e-mail para receber entregas.");

  const db=getFirestore(),empresaRef=db.doc("empresas/"+empresaId);
  const pedidoRef=empresaRef.collection("pedidos").doc(pedidoId);
  const conviteRef=empresaRef.collection("links_rastreamento").doc(pedidoId);
  const espelhoRef=db.doc("clientes/"+usuario.uid+"/entregas/"+idEntregaCliente(empresaId,pedidoId));
  const historicoRef=empresaRef.collection("historico").doc();
  await db.runTransaction(async tx=>{
    const [empresa,convite,pedido,existente]=await Promise.all([
      tx.get(empresaRef),tx.get(conviteRef),tx.get(pedidoRef),tx.get(espelhoRef)
    ]);
    if(!empresa.exists||empresa.data()?.status!=="ativa")
      throw new HttpsError("failed-precondition","Empresa inativa.");
    verificarPiloto(empresaId,empresa.data());
    const c=convite.data(),d=pedido.data();
    if(!convite.exists||!pedido.exists||!c||!d||
      c.empresa_id!==empresaId||c.pedido_id!==pedidoId||
      c.status!=="pendente"||c.expira_em_ms<Date.now()||
      !tokenConfere(token,c.hash_token))
      throw new HttpsError("permission-denied","Convite inválido, utilizado ou expirado.");
    if(!["pendente","em_rota"].includes(d.status)||d.ativo===false||
      c.destinatario_id!==d.destinatario_id||
      d.cliente_uid_vinculado||existente.exists)
      throw new HttpsError("failed-precondition","A NF não está disponível para vínculo.");
    const agora=FieldValue.serverTimestamp();
    // Espelho privado + vínculo e consumo do convite na MESMA transação.
    tx.create(espelhoRef,dadosEntrega(empresaId,pedidoId,d,
      empresa.data().nome_exibicao||"Empresa autorizada",agora));
    tx.update(pedidoRef,{cliente_uid_vinculado:usuario.uid,atualizado_em:agora});
    tx.update(conviteRef,{status:"resgatado",vinculado_uid:usuario.uid,usado_em:agora});
    tx.create(historicoRef,{
      tipo_registro:"auditoria_operacao_empresa",acao:"cliente_vinculou_nf",
      registro_id:pedidoId,responsavel_uid:usuario.uid,criado_em:agora
    });
  });
  return {ok:true,numero_nf:"",mensagem:"Entrega vinculada à sua conta."};
});
