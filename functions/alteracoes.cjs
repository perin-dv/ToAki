"use strict";
const {onCall,HttpsError}=require("firebase-functions/v2/https");
const {getFirestore,FieldValue}=require("firebase-admin/firestore");
const {validarAlteracao,validarTransicaoStatus}=require("./operacao-politica.cjs");
const {autorizarDestinoOperacional}=require("./ambiente-operacao.cjs");

const colecoes={cliente:"clientes",entregador:"entregadores_vinculados",veiculo:"veiculos",pedido:"pedidos"};
const options={region:"southamerica-east1",maxInstances:3,timeoutSeconds:45,memory:"256MiB"};

exports.alterarRegistroEmpresaPiloto=onCall(options,async request=>{
  if(!request.auth?.uid||request.auth.token.email_verified!==true)
    throw new HttpsError("unauthenticated","Faça login e confirme seu e-mail.");
  let entrada;
  try{entrada=validarAlteracao(request.data);}
  catch(e){throw new HttpsError("invalid-argument",e.message);}
  const {empresaId,tipo,registroId,acao}=entrada;
  const uid=request.auth.uid;
  const db=getFirestore();
  const empresaRef=db.doc("empresas/"+empresaId);
  const funcionarioRef=empresaRef.collection("funcionarios").doc(uid);
  const [empresa,membro]=await Promise.all([empresaRef.get(),funcionarioRef.get()]);
  if(!empresa.exists||empresa.data()?.status!=="ativa")
    throw new HttpsError("failed-precondition","Empresa não está ativa.");
  try{autorizarDestinoOperacional({
    projeto:process.env.GCLOUD_PROJECT||process.env.GCP_PROJECT||process.env.GOOGLE_CLOUD_PROJECT||"",
    empresaId,empresa:empresa.data(),
    habilitacao:process.env.TOAKI_PILOTO_NO_ORIGINAL,
    empresasPermitidas:process.env.TOAKI_PILOTO_EMPRESAS
  });}catch(e){throw new HttpsError("failed-precondition",e.message);}
  if(!membro.exists||membro.data()?.ativo!==true)
    throw new HttpsError("permission-denied","Você não está autorizado nesta empresa.");
  const papel=membro.data().papel;
  if(!["dono_empresa","gestor"].includes(papel)&&!(tipo==="pedido"&&papel==="vendedor"&&acao!=="desativar"))
    throw new HttpsError("permission-denied","Seu cargo não permite alterar este registro.");

  const registroRef=empresaRef.collection(colecoes[tipo]).doc(registroId);
  const pedidos=empresaRef.collection("pedidos");
  await db.runTransaction(async tx=>{
    const existente=await tx.get(registroRef);
    if(!existente.exists)throw new HttpsError("not-found","Registro não encontrado nesta empresa.");
    const anterior=existente.data();
    if(anterior.ativo===false&&acao!=="mudar_status")
      throw new HttpsError("failed-precondition","Registro desativado não pode ser alterado.");

    let dadosAtualizados=null;
    if(acao==="atualizar"){
      const dados=entrada.dados;
      if(tipo==="veiculo"&&dados.placa!==anterior.placa)
        throw new HttpsError("failed-precondition","Não é possível trocar a placa cadastrada. Cadastre outro veículo.");
      if(tipo==="pedido"){
        if(anterior.status!=="pendente")throw new HttpsError("failed-precondition","Somente NF pendente pode ser editada.");
        if(dados.numero_nf!==anterior.numero_nf)
          throw new HttpsError("failed-precondition","Não altere o número da NF; crie outra NF após cancelar a anterior.");
      }
      dadosAtualizados={...dados};
      if(tipo==="entregador"){
        const mudaMoto=(dados.veiculo_id||"")!==(anterior.veiculo_id||"");
        if(mudaMoto){
          const vinculada=await tx.get(pedidos.where("entregador_id","==",registroId).limit(1));
          if(!vinculada.empty)throw new HttpsError("failed-precondition","Motorista já aparece em uma NF. A moto vinculada não pode ser alterada sem revisão.");
        }
        if(dados.veiculo_id){
          const moto=await tx.get(empresaRef.collection("veiculos").doc(dados.veiculo_id));
          if(!moto.exists||moto.data().ativo===false)
            throw new HttpsError("failed-precondition","Veículo não está ativo nesta empresa.");
        }
      }
      if(tipo==="pedido"){
        const cliente=await tx.get(empresaRef.collection("clientes").doc(dados.destinatario_id));
        if(!cliente.exists||cliente.data().ativo===false)
          throw new HttpsError("failed-precondition","Cliente não está ativo nesta empresa.");
        if(dados.veiculo_id&&!dados.entregador_id)
          throw new HttpsError("invalid-argument","Escolha um motorista antes da moto.");
        if(dados.entregador_id){
          const motorista=await tx.get(empresaRef.collection("entregadores_vinculados").doc(dados.entregador_id));
          if(!motorista.exists||motorista.data().ativo===false)
            throw new HttpsError("failed-precondition","Motorista não está ativo nesta empresa.");
          const motoVinculada=motorista.data().veiculo_id||"";
          if(motoVinculada&&dados.veiculo_id&&dados.veiculo_id!==motoVinculada)
            throw new HttpsError("failed-precondition","Moto incompatível com o motorista.");
          dadosAtualizados.veiculo_id=dados.veiculo_id||motoVinculada;
        }
        if(dadosAtualizados.veiculo_id){
          const moto=await tx.get(empresaRef.collection("veiculos").doc(dadosAtualizados.veiculo_id));
          if(!moto.exists||moto.data().ativo===false)
            throw new HttpsError("failed-precondition","Moto não está ativa nesta empresa.");
        }
      }
    }
    if(acao==="desativar"){
      const referencias=tipo==="cliente"?[pedidos.where("destinatario_id","==",registroId).limit(1)]:
        tipo==="entregador"?[pedidos.where("entregador_id","==",registroId).limit(1)]:
        [pedidos.where("veiculo_id","==",registroId).limit(1),
          empresaRef.collection("entregadores_vinculados").where("veiculo_id","==",registroId).limit(1)];
      for(const q of referencias){
        const uso=await tx.get(q);
        if(!uso.empty)throw new HttpsError("failed-precondition","Registro já está vinculado a outro cadastro; não pode ser desativado.");
      }
    }
    if(acao==="mudar_status"){
      if(anterior.ativo===false)throw new HttpsError("failed-precondition","NF inativa.");
      try{validarTransicaoStatus(anterior.status,entrada.novoStatus);}
      catch(e){throw new HttpsError("failed-precondition",e.message);}
      if(entrada.novoStatus==="em_rota"){
        if(!anterior.entregador_id)throw new HttpsError("failed-precondition","Escolha um motorista antes de iniciar a rota.");
        const entregador=await tx.get(empresaRef.collection("entregadores_vinculados").doc(anterior.entregador_id));
        if(!entregador.exists||entregador.data().ativo===false)
          throw new HttpsError("failed-precondition","Motorista desativado.");
      }
    }

    const agora=FieldValue.serverTimestamp();
    if(acao==="atualizar")tx.update(registroRef,{...dadosAtualizados,atualizado_em:agora,atualizado_por_uid:uid});
    if(acao==="desativar")tx.update(registroRef,{ativo:false,status:"inativo",desativado_em:agora,atualizado_em:agora});
    if(acao==="mudar_status")tx.update(registroRef,{status:entrada.novoStatus,atualizado_em:agora,atualizado_por_uid:uid});
    const titulo=anterior.titulo_registro||registroId;
    tx.create(empresaRef.collection("historico").doc(),{
      tipo_registro:"auditoria_operacao_empresa",acao:acao==="mudar_status"?"status_"+entrada.novoStatus:acao+"_"+tipo,
      titulo_registro:acao+" — "+titulo,registro_id:registroId,
      responsavel_uid:uid,criado_em:agora
    });
  });
  return {ok:true,registroId,acao};
});
