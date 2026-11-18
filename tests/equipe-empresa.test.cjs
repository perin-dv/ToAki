"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const {criar,aceitar,desligar,email,gerarToken,gerarConviteId,resumo,confere,nomePapel,validadeMs}=require("../functions/equipe-politica.cjs");
const empresaId="empresa_teste_soma";
test("convite só aceita papel gestor ou vendedor e e-mail válido",()=>{
  assert.deepEqual(criar({empresaId,email:" Teste@Exemplo.Com ",papel:"vendedor"}),
    {empresaId,email:"teste@exemplo.com",papel:"vendedor"});
  for(const papel of ["dono_empresa","admin_toaki","entregador","cliente","root"]){
    assert.throws(()=>criar({empresaId,email:"a@exemplo.com",papel}),/Papel/);
  }
  assert.throws(()=>criar({empresaId,email:"teste@exemplo.com",papel:"vendedor",ativo:true}),/Campos/);
  assert.throws(()=>criar({empresaId:"empresa_fake",email:"teste@exemplo.com",papel:"vendedor"}),/Empresa/);
  assert.throws(()=>email("invalido"),/E-mail/);
});
test("token tem 256 bits, hash não reversível e comparação constante",()=>{
  const t=gerarToken(),u=gerarToken(),c=gerarConviteId();
  assert.equal(t.length,43);assert.notEqual(t,u);
  assert.match(c,/^conv_[A-Za-z0-9_-]{16,32}$/);
  assert.equal(confere(t,resumo(t)),true);
  assert.equal(confere(u,resumo(t)),false);
  assert.equal(confere(t,"invalido"),false);
  assert.equal(aceitar({empresaId,conviteId:c,token:t}).token,t);
  assert.equal(validadeMs,86400000);
  assert.equal(nomePapel("gestor"),"Gestor");
  assert.throws(()=>aceitar({empresaId,conviteId:c,token:"abc"}),/inválido/);
  assert.throws(()=>desligar({empresaId,funcionarioId:"../outro"}),/inválido/);
});
test("backend restringe papéis, exige endereço confirmado e não permite autodesligamento",()=>{
  const backend=fs.readFileSync("functions/equipe-empresa.cjs","utf8");
  assert.match(backend,/p\.papel==="gestor"&&papel!=="dono_empresa"/);
  assert.match(backend,/req\.auth\.token\.empresa_id!==empresaId/);
  assert.match(backend,/usuario\.disabled\|\|!usuario\.emailVerified/);
  assert.match(backend,/conviteDados\.email_destinatario!==emailUsuario/);
  assert.match(backend,/tx\.create\(membroRef/);
  assert.match(backend,/tx\.update\(conviteRef,\{status:"resgatado"/);
  assert.match(backend,/setCustomUserClaims/);
  assert.match(backend,/p\.funcionarioId===req\.auth\.uid/);
  assert.match(backend,/alvo\.papel==="dono_empresa"/);
  assert.match(backend,/tx\.update\(membroRef,\{ativo:false/);
});
test("interface lista nomes e funções e nunca oferece escrita direta no Firestore",()=>{
  const page=fs.readFileSync("src/pages/EquipeEmpresaPage.tsx","utf8");
  const invite=fs.readFileSync("src/pages/VincularEquipePage.tsx","utf8");
  const link=fs.readFileSync("src/lib/equipeEmpresa.ts","utf8");
  assert.match(page,/Equipe autorizada/);
  assert.match(page,/Identificadores de autenticação não são exibidos/);
  assert.match(page,/Desativar acesso/);
  assert.match(page,/Vendedor — cadastrar e acompanhar NFs/);
  assert.match(link,/\+"\/vincular-equipe#"/);
  assert.match(invite,/window\.history\.replaceState/);
  assert.doesNotMatch(page,/addDoc\(|setDoc\(|updateDoc\(|deleteDoc\(/);
});
