"use strict";
const {onCall,HttpsError}=require("firebase-functions/v2/https");
const {getFirestore,FieldValue}=require("firebase-admin/firestore");
const {validarOperacao}=require("./operacao-politica.cjs");
const {autorizarDestinoOperacional}=require("./ambiente-operacao.cjs");
const {podeOperarEmpresa}=require("./acesso-identidade.cjs");

const MAP={cliente:"clientes",veiculo:"veiculos",entregador:"entregadores_vinculados",pedido:"pedidos"};
exports.operarEmpresaHomologacao=onCall(
  {region:"southamerica-east1",maxInstances:3,timeoutSeconds:45,memory:"256MiB"},
  async(request)=>{
    if(!request.auth?.uid)
      throw new HttpsError("unauthenticated","Faça login para administrar entregas.");
    let input;
    try{input=validarOperacao(request.data)}catch(e){throw new HttpsError("invalid-argument",e.message)}
    const {empresaId,tipo,dados}=input;
    if(!podeOperarEmpresa({empresaId,claims:request.auth.token}))
      throw new HttpsError("permission-denied","Sua identidade não está autorizada para esta empresa.");
    const uid=request.auth.uid;
    const db=getFirestore();
    const empresaRef=db.doc("empresas/"+empresaId);
    const membroRef=empresaRef.collection("funcionarios").doc(uid);
    const [empresa,membro]=await Promise.all([empresaRef.get(),membroRef.get()]);
    if(!empresa.exists||empresa.data()?.status!=="ativa")
      throw new HttpsError("failed-precondition","Empresa não está ativa.");
    // No projeto original, só a empresa piloto explicitamente autorizada pode gravar.
    let ambiente;
    try {
      ambiente=autorizarDestinoOperacional({
        projeto:process.env.GCLOUD_PROJECT||process.env.GCP_PROJECT||process.env.GOOGLE_CLOUD_PROJECT||"",
        empresaId,empresa:empresa.data(),
        habilitacao:process.env.TOAKI_PILOTO_NO_ORIGINAL,
        empresasPermitidas:process.env.TOAKI_PILOTO_EMPRESAS
      });
    } catch(error) {
      throw new HttpsError("failed-precondition",error instanceof Error?error.message:"Ambiente não autorizado.");
    }
    const f=membro.data();
    if(!membro.exists||f?.ativo!==true)
      throw new HttpsError("permission-denied","Você não possui acesso autorizado a esta empresa.");
    const papéisGestao=["dono_empresa","gestor"];
    const papel=f.papel;
    if(!papéisGestao.includes(papel)&&!(tipo==="pedido"&&papel==="vendedor"))
      throw new HttpsError("permission-denied","Seu cargo não permite cadastrar esse registro.");

    const coleção=empresaRef.collection(MAP[tipo]);
    const novo=coleção.doc();
    const agora=FieldValue.serverTimestamp();
    const titulo=tipo==="pedido"?"NF "+dados.numero_nf:
      tipo==="veiculo"?"Veículo "+dados.placa:dados.nome;
    const audit=empresaRef.collection("historico").doc();
    const reserva=tipo==="veiculo"?empresaRef.collection("placas_reservadas").doc(dados.placa):
      tipo==="pedido"?empresaRef.collection("nfs_reservadas").doc(dados.numero_nf):null;

    await db.runTransaction(async tx=>{
      const registro={...dados};
      if(reserva){
        const existente=await tx.get(reserva);
        if(existente.exists)throw new HttpsError("already-exists","Esse número já está cadastrado nesta empresa.");
      }
      if(tipo==="entregador"&&dados.veiculo_id){
        const veiculo=await tx.get(empresaRef.collection("veiculos").doc(dados.veiculo_id));
        if(!veiculo.exists||veiculo.data()?.ativo===false)
          throw new HttpsError("failed-precondition","Veículo não está ativo nesta empresa.");
      }
      if(tipo==="pedido"){
        const cliente=await tx.get(empresaRef.collection("clientes").doc(dados.destinatario_id));
        if(!cliente.exists||cliente.data()?.ativo===false)
          throw new HttpsError("failed-precondition","Destinatário não encontrado nesta empresa.");
        if(dados.veiculo_id&&!dados.entregador_id)
          throw new HttpsError("invalid-argument","Selecione o entregador antes de vincular um veículo à NF.");
        if(dados.entregador_id){
          const courier=await tx.get(empresaRef.collection("entregadores_vinculados").doc(dados.entregador_id));
          if(!courier.exists||courier.data()?.ativo===false)
            throw new HttpsError("failed-precondition","Entregador não encontrado nesta empresa.");
          const associado=courier.data()?.veiculo_id||"";
          if(associado&&dados.veiculo_id&&associado!==dados.veiculo_id)
            throw new HttpsError("failed-precondition","A moto selecionada não corresponde ao veículo vinculado ao motorista.");
          registro.veiculo_id=dados.veiculo_id||associado;
        }
        if(registro.veiculo_id){
          const veiculo=await tx.get(empresaRef.collection("veiculos").doc(registro.veiculo_id));
          if(!veiculo.exists||veiculo.data()?.ativo===false)
            throw new HttpsError("failed-precondition","Veículo da NF não está ativo nesta empresa.");
        }
      }
      tx.create(novo,{
        ...registro,empresa_id:empresaId,tipo_registro:tipo,ambiente_operacao:ambiente,
        titulo_registro:titulo,status:tipo==="pedido"?"pendente":"ativo",
        ativo:true,criado_por_uid:uid,criado_em:agora,atualizado_em:agora
      });
      if(reserva)tx.create(reserva,{tipo_registro:"reserva_"+tipo,registro_id:novo.id,criado_em:agora});
      tx.create(audit,{
        tipo_registro:"auditoria_operacao_empresa",acao:"cadastrar_"+tipo,ambiente_operacao:ambiente,
        titulo_registro:"Cadastro "+tipo+" — "+titulo,registro_id:novo.id,
        responsavel_uid:uid,criado_em:agora
      });
    });
    return{ok:true,tipo,registroId:novo.id};
  }
);
