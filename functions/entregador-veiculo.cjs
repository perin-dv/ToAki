"use strict";
const {onCall,HttpsError}=require("firebase-functions/v2/https");
const {getFirestore,FieldValue}=require("firebase-admin/firestore");
const {validarOperacao}=require("./operacao-politica.cjs");
const {idRegistro,tituloRegistro}=require("./registro-legivel.cjs");
const {autorizarDestinoOperacional}=require("./ambiente-operacao.cjs");
const {podeOperarEmpresa}=require("./acesso-identidade.cjs");
const opts={region:"southamerica-east1",maxInstances:3,timeoutSeconds:45,memory:"256MiB"};

exports.cadastrarEntregadorComVeiculoPiloto=onCall(opts,async request=>{
  if(!request.auth?.uid)throw new HttpsError("unauthenticated","Entre para cadastrar entregadores.");
  const input=request.data;
  if(!input||typeof input!=="object"||Array.isArray(input)
    ||Object.keys(input).some(k=>!["empresaId","nome","telefone","placa","categoria"].includes(k)))
    throw new HttpsError("invalid-argument","Dados do entregador inválidos.");
  let motorista,veiculo;
  try{
    veiculo=validarOperacao({empresaId:input.empresaId,tipo:"veiculo",dados:{
      placa:input.placa,categoria:input.categoria
    }}).dados;
    motorista=validarOperacao({empresaId:input.empresaId,tipo:"entregador",dados:{
      nome:input.nome,telefone:input.telefone||"",veiculo_id:idRegistro("veiculo",veiculo)
    }}).dados;
  }catch(e){throw new HttpsError("invalid-argument",e.message);}
  const empresaId=input.empresaId,uid=request.auth.uid;
  if(request.auth.token.empresa_id!==empresaId||
    !podeOperarEmpresa({empresaId,claims:request.auth.token}))
    throw new HttpsError("permission-denied","Sua conta não está vinculada a esta empresa.");
  const db=getFirestore(),empresaRef=db.doc("empresas/"+empresaId);
  const [empresa,membro]=await Promise.all([
    empresaRef.get(),empresaRef.collection("funcionarios").doc(uid).get()
  ]);
  if(!empresa.exists||empresa.data()?.status!=="ativa")
    throw new HttpsError("failed-precondition","Empresa não está ativa.");
  try{
    autorizarDestinoOperacional({
      projeto:process.env.GCLOUD_PROJECT||process.env.GCP_PROJECT||process.env.GOOGLE_CLOUD_PROJECT||"",
      empresaId,empresa:empresa.data(),
      habilitacao:process.env.TOAKI_PILOTO_NO_ORIGINAL,
      empresasPermitidas:process.env.TOAKI_PILOTO_EMPRESAS
    });
  }catch(e){throw new HttpsError("failed-precondition",e.message);}
  if(!membro.exists||membro.data()?.ativo!==true||
    !["dono_empresa","gestor"].includes(membro.data()?.papel))
    throw new HttpsError("permission-denied","Somente gestores ativos podem cadastrar a equipe de entregas.");

  const veiculoRef=empresaRef.collection("veiculos").doc(idRegistro("veiculo",veiculo));
  const motoristaRef=empresaRef.collection("entregadores_vinculados").doc(idRegistro("entregador",motorista));
  const reservaRef=empresaRef.collection("placas_reservadas").doc(veiculo.placa);
  await db.runTransaction(async tx=>{
    const [placaEmUso,veiculoEmUso]=await Promise.all([tx.get(reservaRef),tx.get(veiculoRef)]);
    if(placaEmUso.exists||veiculoEmUso.exists)
      throw new HttpsError("already-exists","A placa já pertence a um veículo cadastrado. Use o cadastro existente.");
    const agora=FieldValue.serverTimestamp();
    const comum={empresa_id:empresaId,ambiente_operacao:empresa.data().ambiente,
      ativo:true,criado_por_uid:uid,criado_em:agora,atualizado_em:agora};
    tx.create(veiculoRef,{...veiculo,...comum,tipo_registro:"veiculo",
      nome_exibicao:veiculo.categoria+" · "+veiculo.placa,
      titulo_registro:tituloRegistro("veiculo",veiculo),status:"ativo"});
    tx.create(motoristaRef,{...motorista,...comum,tipo_registro:"entregador",
      nome_exibicao:motorista.nome,titulo_registro:tituloRegistro("entregador",motorista),status:"ativo"});
    tx.create(reservaRef,{tipo_registro:"reserva_veiculo",registro_id:veiculoRef.id,
      titulo_registro:"Reserva — "+tituloRegistro("veiculo",veiculo),criado_em:agora});
    tx.create(empresaRef.collection("historico").doc(),{
      tipo_registro:"auditoria_operacao_empresa",acao:"cadastrar_entregador_veiculo",
      titulo_registro:"Entregador "+motorista.nome+" — "+veiculo.categoria+" "+veiculo.placa,
      registro_id:motoristaRef.id,responsavel_uid:uid,criado_em:agora
    });
  });
  return {ok:true,entregadorId:motoristaRef.id,veiculoId:veiculoRef.id};
});
