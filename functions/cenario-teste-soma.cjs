"use strict";
const {onCall,HttpsError}=require("firebase-functions/v2/https");
const {getFirestore,FieldValue}=require("firebase-admin/firestore");
const {podeOperarEmpresa}=require("./acesso-identidade.cjs");
const {autorizarDestinoOperacional}=require("./ambiente-operacao.cjs");
const {EMPRESA,origem,cliente,veiculo,entregador,pedido,refs,respostaCenario,pertenceAoCenario,nomeRegistro,situacaoLegivel}=require("./cenario-teste-politica.cjs");
const opts={region:"southamerica-east1",maxInstances:2,timeoutSeconds:45,memory:"256MiB"};
exports.criarCenarioEntregaTesteSoma=onCall(opts,async request=>{
  if(!request.auth?.uid)throw new HttpsError("unauthenticated","Entre na conta empresarial da Soma.");
  if(request.data&&Object.keys(request.data).length)
    throw new HttpsError("invalid-argument","Este teste possui dados fixos, sem campos livres.");
  if(request.auth.token.empresa_id!==EMPRESA||
    !podeOperarEmpresa({empresaId:EMPRESA,claims:request.auth.token}))
    throw new HttpsError("permission-denied","Operação permitida somente na Soma de testes.");
  const db=getFirestore(),empresaRef=db.doc("empresas/"+EMPRESA);
  const membroRef=empresaRef.collection("funcionarios").doc(request.auth.uid);
  const [empresa,membro]=await Promise.all([empresaRef.get(),membroRef.get()]);
  if(!empresa.exists||empresa.data()?.status!=="ativa")
    throw new HttpsError("failed-precondition","Empresa fictícia inativa.");
  try{
    autorizarDestinoOperacional({
      projeto:process.env.GCLOUD_PROJECT||process.env.GCP_PROJECT||process.env.GOOGLE_CLOUD_PROJECT||"",
      empresaId:EMPRESA,empresa:empresa.data(),
      habilitacao:process.env.TOAKI_PILOTO_NO_ORIGINAL,
      empresasPermitidas:process.env.TOAKI_PILOTO_EMPRESAS
    });
  }catch(e){throw new HttpsError("failed-precondition",e.message);}
  if(!membro.exists||membro.data()?.ativo!==true||
    !["dono_empresa","gestor"].includes(membro.data()?.papel))
    throw new HttpsError("permission-denied","Somente gestores ativos da Soma podem criar o cenário.");
  const references=[
    empresaRef.collection("clientes").doc(refs.idCliente),
    empresaRef.collection("veiculos").doc(refs.idVeiculo),
    empresaRef.collection("entregadores_vinculados").doc(refs.idEntregador),
    empresaRef.collection("pedidos").doc(refs.idPedido),
    empresaRef.collection("placas_reservadas").doc(veiculo.placa),
    empresaRef.collection("nfs_reservadas").doc(pedido.numero_nf)
  ];
  return db.runTransaction(async tx=>{
    const docs=await Promise.all(references.map(ref=>tx.get(ref)));
    if(docs.some(d=>d.exists)){
      if(docs.every(d=>d.exists)&&docs.slice(0,4).every(d=>pertenceAoCenario(d.data()))&&
        docs[3].data()?.destinatario_id===refs.idCliente&&
        docs[3].data()?.entregador_id===refs.idEntregador&&
        docs[3].data()?.veiculo_id===refs.idVeiculo&&
        docs[1].data()?.placa===veiculo.placa&&
        docs[2].data()?.veiculo_id===refs.idVeiculo)
        return respostaCenario(true);
      throw new HttpsError("already-exists","Já existe um registro com o mesmo número ou placa. Nenhum dado foi alterado.");
    }
    const agora=FieldValue.serverTimestamp();
    const camposComuns={empresa_id:EMPRESA,ambiente_operacao:"piloto_teste",
      origem_teste:origem,ativo:true,criado_por_uid:request.auth.uid,
      criado_em:agora,atualizado_em:agora};
    tx.create(references[0],{...cliente,...camposComuns,tipo_registro:"cliente",
      titulo_registro:nomeRegistro("cliente",cliente),nome_exibicao:cliente.nome,status:"ativo"});
    tx.create(references[1],{...veiculo,...camposComuns,tipo_registro:"veiculo",
      titulo_registro:nomeRegistro("veiculo",veiculo),nome_exibicao:veiculo.categoria+" · "+veiculo.placa,
      status:"ativo"});
    tx.create(references[2],{...entregador,...camposComuns,tipo_registro:"entregador",
      titulo_registro:nomeRegistro("entregador",entregador),nome_exibicao:entregador.nome,status:"ativo"});
    tx.create(references[3],{...pedido,...camposComuns,tipo_registro:"pedido",
      titulo_registro:nomeRegistro("pedido",pedido),
      nome_exibicao:nomeRegistro("pedido",pedido),status:"pendente",
      situacao_legivel:situacaoLegivel("pendente"),
      destinatario_nome:cliente.nome,entregador_nome:entregador.nome,
      veiculo_placa:veiculo.placa});
    tx.create(references[4],{tipo_registro:"reserva_veiculo",
      titulo_registro:"Reserva — "+nomeRegistro("veiculo",veiculo),
      registro_id:refs.idVeiculo,origem_teste:origem,criado_em:agora});
    tx.create(references[5],{tipo_registro:"reserva_pedido",
      titulo_registro:"Reserva — "+nomeRegistro("pedido",pedido),
      registro_id:refs.idPedido,origem_teste:origem,criado_em:agora});
    tx.create(empresaRef.collection("historico").doc(),{
      tipo_registro:"auditoria_operacao_empresa",acao:"criar_cenario_ficticio",
      titulo_registro:"Cenário fictício Thiago → Sakamoto · NF "+pedido.numero_nf,
      registro_id:refs.idPedido,responsavel_uid:request.auth.uid,criado_em:agora
    });
    return respostaCenario(false);
  });
});
