import {test,expect} from "@playwright/test";

test("PWA tem manifesto e ícones quadrados válidos, sem cache de dados privados",async({page,request})=>{
  await page.goto("/");
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute("href","/manifest.webmanifest");
  const response=await request.get("/manifest.webmanifest");
  expect(response.ok()).toBeTruthy();
  const manifest=await response.json();
  expect(manifest.name).toMatch(/toAki/);
  expect(manifest.start_url).toBe("/inicio");
  expect(manifest.display).toBe("standalone");
  for(const sz of [192,512]){
    const response=await request.get("/icons/icon-"+sz+".png");
    expect(response.ok(),"icon "+sz).toBeTruthy();
    const content=await response.body();
    expect(content.subarray(0,8)).toEqual(Buffer.from([137,80,78,71,13,10,26,10]));
    expect(content.readUInt32BE(16)).toBe(sz);
    expect(content.readUInt32BE(20)).toBe(sz);
  }
  const sw=await request.get("/sw.js");
  expect(sw.ok()).toBeTruthy();
  const code=await sw.text();
  expect(code).not.toContain("caches.open");
  expect(code).not.toContain("localStorage");
  expect(code).not.toContain("firebase");
});

test("Home de piloto oferece instalação, compartilhamento e sair sem ir à tela Minha conta",async({page})=>{
  await page.goto("/__e2e_inicio");
  await expect(page.getByRole("heading",{name:/Olá, Teste/i})).toBeVisible();
  await expect(page.getByRole("heading",{name:"Leve o toAki para sua tela inicial"})).toBeVisible();
  await expect(page.getByRole("button",{name:"Compartilhar link de testes"})).toBeVisible();
  await expect(page.getByRole("button",{name:"Sair"})).toBeVisible();
  await expect(page.getByRole("link",{name:"toAki, voltar ao início"})).toHaveAttribute("href","/inicio");
  await expect(page.getByRole("navigation",{name:"Navegação do início"}).getByRole("link",{name:"Minha conta"})).toHaveAttribute("href","/cliente");
  await expect(page.getByRole("link",{name:"Abrir simulação →"})).toHaveAttribute("href","/demonstracao");
  await page.getByRole("button",{name:"Como adicionar à tela inicial"}).click();
  await expect(page.getByText("Endereço:",{exact:false})).toBeVisible();
  await expect(page.getByRole("button",{name:"Como adicionar à tela inicial"})).toHaveAttribute("aria-expanded","true");
});

test("Home mobile 320px tem PWA e rotas sem rolagem horizontal",async({browser})=>{
  const page=await browser.newPage({viewport:{width:320,height:720},isMobile:true,hasTouch:true});
  await page.goto("/__e2e_inicio");
  await expect(page.getByRole("heading",{name:"Leve o toAki para sua tela inicial"})).toBeVisible();
  await expect(page.getByRole("button",{name:"Sair"})).toBeVisible();
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+3);
  expect(overflow).toBe(false);
  await page.close();
});
