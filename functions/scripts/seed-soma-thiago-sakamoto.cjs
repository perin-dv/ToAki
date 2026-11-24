"use strict";

// Executado uma única vez após merge aprovado no GitHub.
// Apenas os quatro registros de TESTE abaixo da empresa_teste_soma.
// Não instala Functions, não altera Rules, Hosting, Auth, IAM ou GPS.
const fs=require("node:fs");
const path=require("node:path");
const {initializeApp,applicationDefault,deleteApp}=require("firebase-admin/app");
const {getFirestore,FieldValue}=require("firebase-admin/firestore");
const {EMPRESA,origem,cliente,veiculo,entregador,pedido,refs,pertenceAoCenario,nomeRegistro,situacaoLegivel}=require("../cenario-teste-politica.cjs");
const PROJETO="toaki-cf058";
const GUARD="AUTORIZADO_CENARIO_FICTICIO_SOMA_20261124";

function conferirAmbiente(){
  if(process.env.GITHUB_REPOSITORY!=="perin-dv/ToAki"||
     process.env.GITHUB_REF!=="refs/heads/main"||
     process.env.TOAKI_SEED_SOMA!==GUARD)
    throw Error("Bloqueado: somente workflow autorizado na main do ToAki.");
  if(process.env.FIRESTORE_EMULATOR_HOST||process.env.FIREBASE_AUTH_EMULATOR_HOST)
    throw Error("Emulador ativo: operação deve consultar o Firebase de testes autorizado.");
  const arquivo=process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if(!arquivo||!path.isAbsolute(arquivo)||!fs.existsSync(arquivo))
    throw Error("Credencial de serviço ausente: nada foi gravado.");
  const dados=JSON.parse(fs.readFileSync(arquivo,"utf8"));
  if(dados.type!=="service_account"||dados.project_id!==PROJETO)
    throw Error("Credencial de projeto diferente: operação bloqueada.");
}

function valido(snap){
  return snap.exists&&pertenceAoCenario(snap.data());
}
async function executar(){
  conferirAmbiente();
  const app=initializeApp({credential:applicationDefault(),projectId:PROJETO});
  try{
    const db=getFirestore(app),empresaRef=db.doc("empresas/"+EMPRESA);
    const referencias=[
      empresaRef.collection("clientes").doc(refs.idCliente),
      empresaRef.collection("veiculos").doc(refs.idVeiculo),
      empresaRef.collection("entregadores_vinculados").doc(refs.idEntregador),
      empresaRef.collection("pedidos").doc(refs.idPedido),
      empresaRef.collection("placas_reservadas").doc(veiculo.placa),
      empresaRef.collection("nfs_reservadas").doc(pedido.numero_nf)
    ];
    const resultado=await db.runTransaction(async tx=>{
      const [empresaSnap,...docs]=await Promise.all([
        tx.get(empresaRef),...referencias.map(r=>tx.get(r))
      ]);
      const info=empresaSnap.data();
      if(!empresaSnap.exists||info?.status!=="ativa"||
         info?.ambiente!=="piloto"||info?.tipo_registro!=="empresa_teste"||
         info?.modo_teste!==true||info?.cnpj!==null)
        throw Error("Empresa Soma não corresponde ao sandbox fictício autorizado.");
      const presentes=docs.filter(d=>d.exists).length;
      if(presentes!==0){
        const consistentes=presentes===6&&docs.slice(0,4).every(valido)&&
          docs[3].data().destinatario_id===refs.idCliente&&
          docs[3].data().entregador_id===refs.idEntregador&&
          docs[3].data().veiculo_id===refs.idVeiculo&&
          docs[1].data().placa===veiculo.placa&&
          docs[2].data().veiculo_id===refs.idVeiculo&&
          docs[4].data().registro_id===refs.idVeiculo&&
          docs[5].data().registro_id===refs.idPedido;
        if(!consistentes)
          throw Error("Há registros conflitantes: nenhum documento foi alterado. Inspecione o Firestore antes de prosseguir.");
        return "já existia";
      }
      const agora=FieldValue.serverTimestamp();
      const comum={
        empresa_id:EMPRESA,ambiente_operacao:"piloto_teste",
        origem_teste:origem,ativo:true,criado_por_uid:"sistema_teste_soma",
        criado_em:agora,atualizado_em:agora
      };
      tx.create(referencias[0],{
        ...cliente,...comum,tipo_registro:"cliente",
        titulo_registro:nomeRegistro("cliente",cliente),nome_exibicao:cliente.nome,
        status:"ativo"
      });
      tx.create(referencias[1],{
        ...veiculo,...comum,tipo_registro:"veiculo",
        titulo_registro:nomeRegistro("veiculo",veiculo),
        nome_exibicao:veiculo.categoria+" · "+veiculo.placa,status:"ativo"
      });
      tx.create(referencias[2],{
        ...entregador,...comum,tipo_registro:"entregador",
        titulo_registro:nomeRegistro("entregador",entregador),
        nome_exibicao:entregador.nome,status:"ativo"
      });
      tx.create(referencias[3],{
        ...pedido,...comum,tipo_registro:"pedido",
        titulo_registro:nomeRegistro("pedido",pedido),
        nome_exibicao:nomeRegistro("pedido",pedido),
        destinatario_nome:cliente.nome,entregador_nome:entregador.nome,
        veiculo_placa:veiculo.placa,status:"pendente",
        situacao_legivel:situacaoLegivel("pendente")
      });
      tx.create(referencias[4],{
        tipo_registro:"reserva_veiculo",
        titulo_registro:"Reserva — "+nomeRegistro("veiculo",veiculo),
        registro_id:refs.idVeiculo,origem_teste:origem,criado_em:agora
      });
      tx.create(referencias[5],{
        tipo_registro:"reserva_pedido",
        titulo_registro:"Reserva — "+nomeRegistro("pedido",pedido),
        registro_id:refs.idPedido,origem_teste:origem,criado_em:agora
      });
      tx.create(empresaRef.collection("historico").doc(),{
        tipo_registro:"auditoria_operacao_empresa",
        titulo_registro:"Cenário fictício Thiago → Sakamoto — NF "+pedido.numero_nf,
        acao:"criar_cenario_ficticio",registro_id:refs.idPedido,
        responsavel_uid:"sistema_teste_soma",criado_em:agora
      });
      return "criado";
    });
    // Verificar gravação REAL no Firestore, não somente resultado da transação.
    const confirmacao=await Promise.all(referencias.map(r=>r.get()));
    if(!confirmacao.slice(0,4).every(valido)||
      confirmacao[3].data().destinatario_id!==refs.idCliente||
      confirmacao[3].data().entregador_id!==refs.idEntregador||
      confirmacao[3].data().veiculo_id!==refs.idVeiculo||
      confirmacao[3].data().numero_nf!==pedido.numero_nf)
      throw Error("Não foi possível confirmar o cenário no Firestore após a gravação.");
    console.log("FIRESTORE_VERIFICADO: "+resultado);
    console.log("empresa: "+EMPRESA);
    console.log("cliente: "+refs.idCliente+" — "+cliente.nome);
    console.log("entregador: "+refs.idEntregador+" — "+entregador.nome);
    console.log("veiculo: "+refs.idVeiculo+" — "+veiculo.categoria+" "+veiculo.placa);
    console.log("nf: "+refs.idPedido+" — número "+pedido.numero_nf);
    console.log("Nota: dados fictícios; sem conta de motoboy, sem GPS e sem emissão fiscal.");
  }finally{
    await deleteApp(app);
  }
}
executar().catch(e=>{
  console.error("SEMENTE_NAO_CONFIRMADA: "+e.message);
  process.exitCode=1;
});
