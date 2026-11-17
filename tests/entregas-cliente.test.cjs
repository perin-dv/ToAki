"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const src=p=>fs.readFileSync(path.join(root,p),"utf8");

test("cliente consulta apenas subcolecao do proprio uid verificado, sem procurar NF de outros",()=>{
  const c=src("src/pages/EntregasClientePage.tsx");
  assert.ok(c.includes('collection(db,"clientes",uid,"entregas")'));
  assert.ok(c.includes("const uid=user?.uid??null"));
  assert.ok(c.includes("if(!emailVerificado)"));
  assert.ok(c.includes("if(!ambienteOperacional)"));
  assert.ok(c.includes("onSnapshot(ref,snapshot=>"));
  assert.ok(c.includes('limit(30)'));
  assert.ok(c.includes("return()=>parar()"));
  assert.doesNotMatch(c,/collectionGroup\(|httpsCallable|addDoc\(|setDoc\(|updateDoc\(|deleteDoc\(|sessionStorage|dadosIniciais/);
});

test("tela cliente substitui dados ficticios por contador e lista de leitura Firebase",()=>{
  const pg=src("src/pages/PrivatePages.tsx");
  const c=src("src/pages/EntregasClientePage.tsx");
  assert.ok(pg.includes("useEntregasCliente(user)"));
  assert.ok(pg.includes("<EntregasClienteConteudo estado={estadoEntregas}/>"));
  assert.ok(!pg.includes("Integração das entregas em preparação"));
  assert.ok(!pg.includes("A consulta das suas entregas ainda está sendo integrada."));
  assert.ok(c.includes("Nenhuma entrega vinculada à sua conta."));
  assert.ok(c.includes("não é GPS ao vivo"));
});
