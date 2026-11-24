"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const p=require("../functions/motoboy-policy.cjs");
test("convite do motoboy contém segredo de 256 bits e hash não recuperável",()=>{
 const segredo=p.gerarSegredo(),token="empresa_teste_soma."+("a".repeat(32))+"."+segredo;
 assert.equal(segredo.length,64);
 assert.equal(p.validarToken(token).empresaId,"empresa_teste_soma");
 assert.equal(p.segredoConfere(segredo,p.hash(segredo)),true);
 assert.equal(p.segredoConfere("0".repeat(64),p.hash(segredo)),false);
 assert.throws(()=>p.validarToken("empresa_fake.x.y"));
 assert.equal(p.validarEmail(" Teste@Exemplo.com "),"teste@exemplo.com");
});
test("GPS rejeita precisão excessiva, campos suspeitos e localizações inválidas",()=>{
 const x={pedidoId:"nf_20261124001",latitude:-23.42,longitude:-51.93,precisao:15};
 assert.deepEqual(p.gpsValido(x),x);
 assert.throws(()=>p.gpsValido({...x,precisao:500}));
 assert.throws(()=>p.gpsValido({...x,role:"gestor"}));
 assert.throws(()=>p.gpsValido({...x,latitude:Infinity}));
 assert.throws(()=>p.permissaoGps({status:"pendente",entregador_uid:"u"},"u",Date.now()));
});
test("arquivo de comprovante sempre isolado por empresa, NF e conta",()=>{
 assert.equal(p.nomeArquivo("empresa_teste_soma","nf_20261124001","user1","foto"),
  "comprovantes/empresa_teste_soma/nf_20261124001/user1/foto.png");
 assert.throws(()=>p.nomeArquivo("empresa_teste_soma","../../segredo","u","foto"));
});
test("servidor requer vínculo de Auth, e-mail, consentimento do dispositivo e status",()=>{
 const src=fs.readFileSync("functions/motoboy.cjs","utf8");
 const storage=fs.readFileSync("storage.rules","utf8");
 assert.match(src,/email_destinatario/);
 assert.match(src,/user.emailVerified/);
 assert.match(src,/entregador_uid:c.uid/);
 assert.match(src,/P.permissaoGps/);
 assert.match(src,/posicao_atual:FieldValue.delete/);
 assert.match(src,/getMetadata/);
 assert.match(storage,/pedidoValido/);
 assert.match(storage,/allow list, update, delete: if false/);
 assert.doesNotMatch(src,/getDownloadURL|allowAll|setCustomUserClaims\(uid,\{role:"admin_toaki"/);
});
