"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const {validarPedidoAdministrativo,validarRegistroSolicitado,validarCnpj}=require("../functions/politica.cjs");

const uid="uid-responsavel-001";
const pedido={uidSolicitante:uid,acao:"aprovar",vinculoVerificado:true,justificativa:"Responsável conferido com documento empresarial."};
const registro={
 uid_responsavel:uid,email_responsavel:"contato@empresa.exemplo",cnpj:"11222333000181",
 razao_social:"Soma Distribuidora LTDA",status:"aguardando_analise"
};

test("admin exige decisão explícita e conferência de vínculo",()=>{
 assert.deepEqual(validarPedidoAdministrativo(pedido),{uidSolicitante:uid,acao:"aprovar",justificativa:pedido.justificativa});
 assert.throws(()=>validarPedidoAdministrativo({...pedido,vinculoVerificado:false}),/verifica/);
 assert.throws(()=>validarPedidoAdministrativo({...pedido,acao:"ativar_admin"}),/Ação inválida/);
 assert.throws(()=>validarPedidoAdministrativo({...pedido,justificativa:"OK"}),/justificativa/);
});

test("validação de CNPJ impede números falsos e sequências repetidas",()=>{
 assert.equal(validarCnpj(registro.cnpj),true);
 assert.equal(validarCnpj("11111111111111"),false);
 assert.equal(validarCnpj("11222333000180"),false);
 assert.equal(validarCnpj("1122233300018"),false);
});

test("aprovação rejeita troca de conta, e-mail, CNPJ ou status",()=>{
 assert.deepEqual(validarRegistroSolicitado(registro,uid,"CONTATO@EMPRESA.EXEMPLO"),{
  cnpj:registro.cnpj,empresaId:"empresa_"+registro.cnpj,status:"aguardando_analise"
 });
 assert.throws(()=>validarRegistroSolicitado({...registro,uid_responsavel:"uid-outro"},uid,"contato@empresa.exemplo"),/Responsável inconsistente/);
 assert.throws(()=>validarRegistroSolicitado(registro,uid,"hacker@empresa.exemplo"),/E-mail/);
 assert.throws(()=>validarRegistroSolicitado({...registro,cnpj:"99999999999999"},uid,"contato@empresa.exemplo"),/CNPJ/);
 assert.throws(()=>validarRegistroSolicitado({...registro,status:"sem_analise"},uid,"contato@empresa.exemplo"),/Status/);
});
