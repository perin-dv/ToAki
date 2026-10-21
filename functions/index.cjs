"use strict";

/**
 * Backend privado do fluxo de análise empresarial.
 * A publicação deste serviço NÃO faz parte do Hosting Preview da Fase A.
 * Apenas um admin_toaki autorizado, com e-mail verificado, pode acionar.
 */
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp, getApps } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");
const { validarPedidoAdministrativo, validarRegistroSolicitado } = require("./politica.cjs");

if (!getApps().length) initializeApp();

function invalido(erro) {
  throw new HttpsError("invalid-argument", erro instanceof Error ? erro.message : "Dados inválidos.");
}

exports.analisarCadastroEmpresa = onCall(
  {region:"southamerica-east1",maxInstances:3,timeoutSeconds:45,memory:"256MiB"},
  async (request) => {
    const operador=request.auth;
    if (!operador || operador.token.role!=="admin_toaki" || operador.token.email_verified!==true)
      throw new HttpsError("permission-denied","Somente administradores autorizados podem analisar empresas.");

    let params;
    try { params=validarPedidoAdministrativo(request.data); } catch(e) { invalido(e); }
    const {uidSolicitante,acao,justificativa}=params;
    if(uidSolicitante===operador.uid)
      throw new HttpsError("permission-denied","Não é permitido analisar a própria solicitação.");

    const auth=getAuth();
    let responsavel;
    try { responsavel=await auth.getUser(uidSolicitante); }
    catch { throw new HttpsError("not-found","Conta responsável não encontrada."); }
    if(!responsavel.email || !responsavel.emailVerified)
      throw new HttpsError("failed-precondition","O responsável deve confirmar o e-mail antes da análise.");
    if(responsavel.disabled)
      throw new HttpsError("failed-precondition","A conta responsável está desativada.");
    if(responsavel.customClaims?.role && !["cliente","dono_empresa"].includes(responsavel.customClaims.role))
      throw new HttpsError("failed-precondition","O responsável possui um cargo incompatível.");

    const db=getFirestore();
    const pedidoRef=db.doc("solicitacoes_cadastro_empresas/"+uidSolicitante);
    const auditoriaRef=db.collection("auditoria").doc();
    const agora=FieldValue.serverTimestamp();

    // Todas as validações de reserva de CNPJ acontecem ANTES de qualquer escrita.
    const resultado=await db.runTransaction(async tx=>{
      const pedidoSnap=await tx.get(pedidoRef);
      if(!pedidoSnap.exists)throw new HttpsError("not-found","Solicitação não encontrada.");
      const pedido=pedidoSnap.data();
      let registro;
      try { registro=validarRegistroSolicitado(pedido,uidSolicitante,responsavel.email); }
      catch(e) { invalido(e); }
      const {cnpj,empresaId,status}=registro;

      if(status==="aprovada" && acao==="aprovar"){
        if(pedido.empresa_id!==empresaId)
          throw new HttpsError("failed-precondition","Empresa aprovada com vínculo inconsistente.");
        return {status:"aprovada",empresaId,reprocessamento:true};
      }
      if(status!=="aguardando_analise")
        throw new HttpsError("failed-precondition","Solicitação já analisada; a decisão não pode ser alterada pelo navegador.");

      if(acao==="rejeitar"){
        tx.update(pedidoRef,{
          status:"rejeitada",justificativa_analise:justificativa,
          analisado_por:operador.uid,analisado_em:agora
        });
        tx.set(auditoriaRef,{
          tipo_registro:"auditoria_cadastro_empresa",
          titulo_registro:"Cadastro rejeitado — "+pedido.razao_social,
          acao:"rejeitar_cadastro_empresa",responsavel_uid:operador.uid,
          solicitante_uid:uidSolicitante,cnpj,justificativa,criado_em:agora
        });
        return {status:"rejeitada",reprocessamento:false};
      }

      const empresaRef=db.doc("empresas/"+empresaId);
      const reservaRef=db.doc("cnpjs_reservados/"+cnpj);
      const funcionarioRef=empresaRef.collection("funcionarios").doc(uidSolicitante);
      const [empresaAtual,reservaAtual]=await Promise.all([tx.get(empresaRef),tx.get(reservaRef)]);
      if(empresaAtual.exists || reservaAtual.exists)
        throw new HttpsError("already-exists","Este CNPJ já está associado a uma empresa. Solicite revisão administrativa.");

      tx.create(empresaRef,{
        tipo_registro:"empresa",
        titulo_registro:"Empresa — "+pedido.razao_social,
        nome_exibicao:pedido.nome_fantasia || pedido.razao_social,
        cnpj,razao_social:pedido.razao_social,nome_fantasia:pedido.nome_fantasia,
        municipio:pedido.municipio,uf:pedido.uf,
        responsavel_uid:uidSolicitante,
        status:"ativa",criado_em:agora
      });
      tx.create(reservaRef,{
        tipo_registro:"reserva_cnpj_empresa",
        titulo_registro:"CNPJ — "+pedido.razao_social,
        empresa_id:empresaId,responsavel_uid:uidSolicitante,criado_em:agora
      });
      tx.create(funcionarioRef,{
        tipo_registro:"funcionario_empresa",
        titulo_registro:"Responsável — "+pedido.nome_responsavel,
        nome_exibicao:pedido.nome_responsavel,
        email:responsavel.email,papel:"dono_empresa",
        ativo:true,criado_em:agora
      });
      tx.update(pedidoRef,{
        status:"aprovada",empresa_id:empresaId,
        justificativa_analise:justificativa,
        analisado_por:operador.uid,analisado_em:agora
      });
      tx.set(auditoriaRef,{
        tipo_registro:"auditoria_cadastro_empresa",
        titulo_registro:"Cadastro aprovado — "+pedido.razao_social,
        acao:"aprovar_cadastro_empresa",responsavel_uid:operador.uid,
        solicitante_uid:uidSolicitante,empresa_id:empresaId,cnpj,
        justificativa,criado_em:agora
      });
      return {status:"aprovada",empresaId,reprocessamento:false};
    });

    if(acao==="aprovar") {
      // Se a criação da empresa foi concluída, mas a atualização da claim falhou,
      // executar a mesma aprovação novamente é seguro e permite recuperação.
      try {
        const claimsAtuais=(await auth.getUser(uidSolicitante)).customClaims || {};
        await auth.setCustomUserClaims(uidSolicitante,{...claimsAtuais,role:"dono_empresa"});
      } catch {
        throw new HttpsError("internal","Empresa aprovada, mas a permissão da conta está pendente. Reprocesse a aprovação.");
      }
    }
    return resultado;
  }
);
