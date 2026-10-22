import {test,expect} from "@playwright/test";

test("app do entregador só funciona com autenticação",async({page})=>{
  await page.goto("/entregador");
  await expect(page).toHaveURL(/\/login$/);
});

test("GPS nunca inicia automaticamente na interface de testes",async({page})=>{
  await page.goto("/__e2e_entregador");
  await expect(page.getByRole("heading",{name:"Aplicativo do entregador"})).toBeVisible();
  await expect(page.getByText(/integração real só será habilitada no Preview do piloto/)).toBeVisible();
  await expect(page.getByText(/Confirme seu e-mail/).first()).toBeVisible();
  await expect(page.getByRole("button",{name:"Iniciar GPS desta entrega"})).toHaveCount(0);
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute("href","/manifest-entregador.webmanifest");
  const manifestResponse=await page.request.get("/manifest-entregador.webmanifest");
  expect(manifestResponse.ok()).toBeTruthy();
  const manifest=await manifestResponse.json();
  expect(manifest.id).toBe("/entregador");
  expect(manifest.start_url).toBe("/entregador");
});

test("app do entregador é responsivo em celular sem vazamento horizontal",async({page})=>{
  await page.setViewportSize({width:320,height:700});
  await page.goto("/__e2e_entregador");
  await expect(page.getByRole("heading",{name:"Aplicativo do entregador"})).toBeVisible();
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+3);
  expect(overflow).toBe(false);
});
