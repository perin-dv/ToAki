"use strict";
const {onCall,HttpsError}=require("firebase-functions/v2/https");
const {getAuth}=require("firebase-admin/auth");
const {getFirestore,FieldValue}=require("firebase-admin/firestore");
const {autorizarDestinoOperacional}=require("./ambiente-operacao.cjs");
const {podeOperarEmpresa}=require("./acesso-identidade.cjs");
const {criar,aceitar,desligar,email,gerarToken,gerarConviteId,resumo,confere,nomePapel,validadeMs}=require("./equipe-politica.cjs");

const options={region:"southamerica-east1",maxInstances:3,timeoutSeconds:45,memory:"256MiB"};
const projeto=()=>process.env.GCLOUD_PROJECT||process.env.GCP_PROJECT||process.env.GOOGLE_CLOUD_PROJECT||"";
function invalido(e){throw new HttpsError("invalid-argument",e.message);}
function piloto(empresaId,d){
  try{
    return autorizarDestinoOperacional({
      projeto:projeto(),empresaId,empresa:d,
      habilitacao:process.env.TOAKI_PILOTO_NO_ORIGINAL,
      empresasPermitidas:process.env.TOAKI_PILOTO_EMPRESAS
    });
  }catch(e){throw new HttpsError("failed-precondition",e.message);}
}
async function autorizado(req,empresaId){
  if(!req.auth?.uid)throw new HttpsError("unauthenticated","Faça login.");
  if(!podeOperarEmpresa({empresaId,claims:req.auth.token})||req.auth.token.empresa_id!==empresaId)
    throw new HttpsError("permission-denied","Conta não vinculada à empresa.");
  const empresaRef=getFirestore().doc("empresas/"+empresaId);
  const [empresa,membro]=await Promise.all([
    empresaRef.get(),empresaRef.collection("funcionarios").doc(req.auth.uid).get()
  ]);
  if(!empresa.exists||empresa.data()?.status!=="ativa")
    throw new HttpsError("failed-precondition","Empresa inativa.");
  piloto(empresaId,empresa.data());
  if(!membro.exists||membro.data()?.ativo!==true||
    !["dono_empresa","gestor"].includes(membro.data()?.papel))
    throw new HttpsError("permission-denied","Somente gestores ativos acessam a equipe.");
  return {empresaRef,papel:membro.data().papel};
}
exports.criarConviteEquipePiloto=onCall(options,async req=>{
  let p;try{p=criar(req.data);}catch(e){invalido(e);}
  const {empresaRef,papel}=await autorizado(req,p.empresaId);
  if(p.papel==="gestor"&&papel!=="dono_empresa")
    throw new HttpsError("permission-denied","Somente o responsável pode convidar gestores.");
  const token=gerarToken(),conviteId=gerarConviteId();
  const expiraEm=Date.now()+validadeMs;
  const ref=empresaRef.collection("convites_equipe").doc(conviteId);
  await getFirestore().runTransaction(async tx=>{
    const agora=FieldValue.serverTimestamp();
    tx.create(ref,{
      tipo_registro:"convite_funcionario_empresa",
      titulo_registro:"Convite de equipe — "+nomePapel(p.papel),
      email_destinatario:p.email,papel:p.papel,hash_token:resumo(token),
      status:"pendente",expira_em_ms:expiraEm,
      criado_por_uid:req.auth.uid,criado_em:agora
    });
    tx.create(empresaRef.collection("historico").doc(),{
      tipo_registro:"auditoria_operacao_empresa",acao:"convidar_funcionario",
      titulo_registro:"Convite de equipe — "+nomePapel(p.papel),
      responsavel_uid:req.auth.uid,criado_em:agora
    });
  });
  // Retornar o segredo uma única vez. Firebase armazena apenas seu hash.
  return {ok:true,empresaId:p.empresaId,conviteId,token,expiraEm};
});
exports.aceitarConviteEquipePiloto=onCall(options,async req=>{
  if(!req.auth?.uid||req.auth.token.email_verified!==true)
    throw new HttpsError("unauthenticated","Entre com e-mail confirmado.");
  const cargo=req.auth.token.role;
  if(cargo&&!["cliente"].includes(cargo))
    throw new HttpsError("permission-denied","Use uma conta pessoal sem cargo empresarial.");
  if(req.auth.token.empresa_id)
    throw new HttpsError("permission-denied","Conta já está vinculada a uma empresa.");
  let p;try{p=aceitar(req.data);}catch(e){invalido(e);}
  const usuario=await getAuth().getUser(req.auth.uid);
  if(usuario.disabled||!usuario.emailVerified||!usuario.email)
    throw new HttpsError("permission-denied","Conta sem e-mail confirmado.");
  const emailUsuario=email(usuario.email);
  const db=getFirestore(),empresaRef=db.doc("empresas/"+p.empresaId);
  const conviteRef=empresaRef.collection("convites_equipe").doc(p.conviteId);
  const membroRef=empresaRef.collection("funcionarios").doc(req.auth.uid);
  let papelConcedido="";
  await db.runTransaction(async tx=>{
    const [emp,convite,membro]=await Promise.all([
      tx.get(empresaRef),tx.get(conviteRef),tx.get(membroRef)
    ]);
    if(!emp.exists||emp.data()?.status!=="ativa")
      throw new HttpsError("failed-precondition","Empresa inativa.");
    piloto(p.empresaId,emp.data());
    const conviteDados=convite.data();
    if(!convite.exists||!conviteDados||!confere(p.token,conviteDados.hash_token)||
      conviteDados.email_destinatario!==emailUsuario)
      throw new HttpsError("permission-denied","Convite não corresponde a esta conta.");
    if(!["gestor","vendedor"].includes(conviteDados.papel))
      throw new HttpsError("failed-precondition","Convite com função inválida.");
    papelConcedido=conviteDados.papel;
    if(conviteDados.status==="resgatado"&&conviteDados.usado_por_uid===req.auth.uid
      &&membro.exists&&membro.data().ativo===true&&membro.data().papel===papelConcedido)
      return; // Retentativa segura caso a atualização de claims tenha falhado.
    if(conviteDados.status!=="pendente"||!Number.isFinite(conviteDados.expira_em_ms)||
      conviteDados.expira_em_ms<Date.now())
      throw new HttpsError("failed-precondition","Convite expirado ou utilizado.");
    if(membro.exists)
      throw new HttpsError("failed-precondition","A conta já pertenceu à equipe; solicite revisão ao responsável.");
    const agora=FieldValue.serverTimestamp();
    const nome=usuario.displayName?.trim().slice(0,100)||emailUsuario.split("@")[0];
    tx.create(membroRef,{
      tipo_registro:"funcionario_empresa",
      titulo_registro:nomePapel(papelConcedido)+" — "+nome,
      nome_exibicao:nome,email:emailUsuario,papel:papelConcedido,
      ativo:true,criado_em:agora,convite_id:p.conviteId
    });
    tx.update(conviteRef,{status:"resgatado",usado_por_uid:req.auth.uid,usado_em:agora});
    tx.create(empresaRef.collection("historico").doc(),{
      tipo_registro:"auditoria_operacao_empresa",acao:"funcionario_aceitou_convite",
      titulo_registro:"Equipe — "+nome+" ("+nomePapel(papelConcedido)+")",
      responsavel_uid:req.auth.uid,criado_em:agora
    });
  });
  // Concessão de cargo é exclusiva do Admin SDK; o usuário nunca define claims.
  try{
    const u=await getAuth().getUser(req.auth.uid);
    const claims=u.customClaims||{};
    if(![undefined,null,"cliente",papelConcedido].includes(claims.role)||
      (claims.empresa_id&&claims.empresa_id!==p.empresaId))
      throw Error("Conta com outro cargo.");
    await getAuth().setCustomUserClaims(req.auth.uid,{
      ...claims,role:papelConcedido,empresa_id:p.empresaId
    });
  }catch{
    throw new HttpsError("internal","Vínculo salvo; repita o link com a mesma conta para atualizar seu acesso.");
  }
  return {ok:true,papel:papelConcedido};
});
exports.desativarFuncionarioPiloto=onCall(options,async req=>{
  let p;try{p=desligar(req.data);}catch(e){invalido(e);}
  const {empresaRef,papel}=await autorizado(req,p.empresaId);
  if(p.funcionarioId===req.auth.uid)
    throw new HttpsError("failed-precondition","Você não pode desativar sua própria conta.");
  const membroRef=empresaRef.collection("funcionarios").doc(p.funcionarioId);
  await getFirestore().runTransaction(async tx=>{
    const membro=await tx.get(membroRef);
    if(!membro.exists)throw new HttpsError("not-found","Funcionário não encontrado.");
    const alvo=membro.data();
    if(alvo.papel==="dono_empresa"||(alvo.papel==="gestor"&&papel!=="dono_empresa"))
      throw new HttpsError("permission-denied","Seu cargo não permite desligar este membro.");
    if(!["vendedor","gestor"].includes(alvo.papel))
      throw new HttpsError("failed-precondition","Cargo não gerenciável por este módulo.");
    if(alvo.ativo!==true)return;
    const agora=FieldValue.serverTimestamp();
    tx.update(membroRef,{ativo:false,desativado_em:agora});
    tx.create(empresaRef.collection("historico").doc(),{
      tipo_registro:"auditoria_operacao_empresa",acao:"desativar_funcionario",
      titulo_registro:"Funcionário desativado — "+(alvo.nome_exibicao||"Membro"),
      registro_id:p.funcionarioId,responsavel_uid:req.auth.uid,criado_em:agora
    });
  });
  // A regra do Firestore e as Functions já negam acesso após a transação.
  // Remover claims é limpeza adicional, nunca o único controle de autorização.
  try{
    const u=await getAuth().getUser(p.funcionarioId);
    const claims={...(u.customClaims||{})};
    if(claims.empresa_id===p.empresaId&&["vendedor","gestor"].includes(claims.role)){
      delete claims.role;delete claims.empresa_id;
      await getAuth().setCustomUserClaims(p.funcionarioId,claims);
    }
  }catch{
    throw new HttpsError("internal","Acesso ao banco bloqueado; atualização de sessão pendente.");
  }
  return {ok:true};
});
