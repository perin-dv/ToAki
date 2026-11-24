"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const source=p=>fs.readFileSync(p,"utf8");

test("mapa central sempre renderiza em empresa autorizada sem exigir NF",()=>{
  const page=source("src/pages/SiteOperacionalPage.tsx");
  const block=page.split('<div className="real-map-content">')[1].split('</section>')[0];
  assert.ok(block.includes('<iframe className="real-map-frame"'));
  assert.ok(!block.includes("Nenhum endereço de NF disponível"));
  assert.ok(!block.includes("selecionada?.endereco_entrega?"));
  assert.ok(page.includes(':"Maringá, Paraná, Brasil"')||page.includes('||"Maringá, Paraná, Brasil"'));
  assert.ok(page.includes('modoMapa==="cidade"?12:16'));
  assert.ok(page.includes("src={urlMapa}"));
});
test("localização do aparelho é opcional, HTTPS e não é enviada ao Firebase",()=>{
  const page=source("src/pages/SiteOperacionalPage.tsx");
  const action=page.split("const localizarAparelho=()=>{")[1].split("  const pendentes=")[0];
  assert.ok(action.includes("window.isSecureContext"));
  assert.ok(action.includes("navigator.geolocation.getCurrentPosition"));
  assert.ok(action.includes("setModoMapa(\"aparelho\")"));
  assert.ok(page.includes("onClick={localizarAparelho}"));
  assert.ok(page.includes("Minha localização"));
  assert.doesNotMatch(action,/watchPosition|setDoc|addDoc|updateDoc|httpsCallable|sendBeacon|fetch\(/);
  assert.ok(page.includes("O site não envia seu próprio GPS ao Firebase"));
});
test("selecionar NF real permite GPS verificado e recusa localização antiga",()=>{
  const page=source("src/pages/SiteOperacionalPage.tsx");
  assert.ok(page.includes('r.endereco_entrega?"destino":"cidade"'));
  assert.ok(page.includes('Date.now()-r.posicao_atual.atualizado_em.toMillis()<120000'));
  assert.ok(page.includes('modoMapa==="entregador"&&focoGps'));
  assert.ok(page.includes('const enderecoSelecionado=modoMapa==="destino"'));
  assert.ok(page.includes("encodeURIComponent(focoMapa)"));
  assert.ok(page.includes("Ao selecionar uma NF, o Google Maps recebe o destino cadastrado"));
  assert.ok(!page.includes("setMostrarMapa"));
  assert.ok(page.includes("GPS autorizado do entregador"));
  assert.ok(page.includes("Não é possível consultar as NFs"));
  const css=source("src/styles.css");
  assert.ok(css.includes(".real-map-toolbar"));
  assert.ok(css.includes(".real-map-content>.real-map-frame"));
});
