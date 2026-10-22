import {test,expect} from "@playwright/test";

test("Instalacao opcional mantém manifesto e ícones sem forçar tela vertical",async({page,request})=>{
  await page.goto("/");
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute("href","/manifest.webmanifest");
  const response=await request.get("/manifest.webmanifest");
  expect(response.ok()).toBeTruthy();
  const manifest=await response.json();
  expect(manifest.name).toMatch(/toAki/);
  expect(manifest.start_url).toBe("/inicio");
  expect(manifest.display).toBe("standalone");
  expect(manifest.orientation).toBe("any");
  for(const size of [192,512]){
    const response=await request.get("/icons/icon-"+size+".png");
    expect(response.ok(),"icon "+size).toBeTruthy();
    const png=await response.body();
    expect(png.subarray(0,8)).toEqual(Buffer.from([137,80,78,71,13,10,26,10]));
    expect(png.readUInt32BE(16)).toBe(size);
    expect(png.readUInt32BE(20)).toBe(size);
  }
  const sw=await request.get("/sw.js");
  expect(sw.ok()).toBeTruthy();
  const code=await sw.text();
  expect(code).not.toContain("caches.open");
  expect(code).not.toContain("localStorage");
});

test("A Home autenticada é o painel empresarial com mapa e oito módulos, não a tela intermediária",async({page})=>{
  await page.goto("/__e2e_inicio");
  await expect(page.getByRole("heading",{level:1,name:"Central de rastreamento"})).toBeVisible();
  await expect(page.getByRole("heading",{name:"Mapa dos entregadores"})).toBeVisible();
  await expect(page.getByRole("img",{name:"Mapa demonstrativo ilustrativo, sem GPS real"})).toBeVisible();
  await expect(page.getByText("Painel da empresa • Simulação para computador e celular")).toBeVisible();
  await expect(page.getByRole("button",{name:"Sair"})).toBeVisible();
  const nav=page.getByRole("navigation",{name:"Menu completo do protótipo"});
  await expect(nav.getByRole("button",{name:"Entregas e NFs"})).toBeVisible();
  await expect(nav.getByRole("button",{name:"Entregadores"})).toBeVisible();
  await nav.getByRole("button",{name:"Entregadores"}).click();
  await expect(page.getByRole("heading",{level:1,name:"Entregadores"})).toBeVisible();
  await page.getByRole("link",{name:"toAki, voltar ao início"}).click();
  await expect(page.getByRole("heading",{level:1,name:"Central de rastreamento"})).toBeVisible();
  await expect(page.getByRole("heading",{name:"Mapa dos entregadores"})).toBeVisible();
});

test("Desktop, notebook, tablet e celular mostram o painel sem rolagem horizontal",async({browser})=>{
  for(const [width,height] of [[1600,900],[1280,800],[820,1000],[375,812],[320,700]]){
    const page=await browser.newPage({viewport:{width,height},isMobile:width<=375,hasTouch:width<=375});
    await page.goto("/__e2e_inicio");
    await expect(page.getByRole("heading",{level:1,name:"Central de rastreamento"})).toBeVisible();
    await expect(page.getByRole("heading",{name:"Mapa dos entregadores"})).toBeVisible();
    await expect(page.locator(".fake-map")).toBeVisible();
    await expect(page.getByRole("button",{name:"Sair"})).toBeVisible();
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+3);
    expect(overflow,"Painel estourou na largura "+width+"px").toBe(false);
    await page.close();
  }
});
