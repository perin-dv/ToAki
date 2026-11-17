import {test,expect} from "@playwright/test";

test("Painel operacional mostra dados reais ou estado de autorização, nunca entregas inventadas",async({page})=>{
  await page.goto("/__e2e_site_real");
  await expect(page.getByRole("heading",{name:"Central de rastreamento"})).toBeVisible();
  await expect(page.getByText(/nenhum dado fictício está sendo exibido/i)).toBeVisible();
  await expect(page.getByRole("button",{name:"Sair"})).toBeVisible();
  await expect(page.getByRole("link",{name:/ver demonstração separada/i})).toHaveAttribute("href","/demonstracao");
  await expect(page.getByText("NF 0045821")).toHaveCount(0);
  await expect(page.getByLabel("Mapa demonstrativo ilustrativo, sem GPS real")).toHaveCount(0);
});

test("Site real preserva menu aprovado e não estoura largura no celular",async({page})=>{
  await page.setViewportSize({width:375,height:812});
  await page.goto("/__e2e_site_real");
  await expect(page.getByRole("heading",{name:"Central de rastreamento"})).toBeVisible();
  await page.getByRole("button",{name:"Abrir menu completo"}).click();
  await expect(page.getByRole("navigation",{name:"Menu completo do sistema"})).toBeVisible();
  await expect(page.getByRole("button",{name:"Entregas e NFs"})).toBeVisible();
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+3);
  expect(overflow).toBe(false);
});

// O mapa operacional deve funcionar sem NF real; nesta rota e2e não é criado
// vínculo de empresa no Firebase. O comportamento do mapa é validado no teste
// estrutural abaixo; o Preview autenticado valida a exibição real em HTTPS.
test("sem empresa autenticada, a rota local de teste não inventa mapa de entregador",async({page})=>{
  await page.goto("/__e2e_site_real");
  await expect(page.getByText("NF 0045821")).toHaveCount(0);
  await expect(page.getByLabel("Mapa demonstrativo ilustrativo, sem GPS real")).toHaveCount(0);
});
