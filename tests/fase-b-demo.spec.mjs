import {test,expect} from "@playwright/test";

test("Fase B demo: cadastrar entregador e NF, atribuir e concluir sem Firestore",async({page})=>{
  await page.goto("/__e2e_demonstracao");
  const menu=page.getByRole("navigation",{name:"Menu completo do protótipo"});
  await menu.getByRole("button",{name:"Entregadores"}).click();
  await expect(page.getByRole("heading",{name:"Entregadores fictícios"})).toBeVisible();
  await page.getByRole("textbox",{name:"Nome do entregador"}).fill("Roberto Exemplo");
  await page.getByRole("button",{name:"Cadastrar entregador"}).click();
  await expect(page.getByText("Roberto Exemplo").first()).toBeVisible();

  await menu.getByRole("button",{name:"Entregas e NFs"}).click();
  await page.getByRole("textbox",{name:"Número da NF"}).fill("0045824");
  await page.getByRole("combobox",{name:"Destinatário fictício"}).fill("Oficina Exemplo D");
  await page.getByRole("textbox",{name:"Destino fictício"}).fill("Maringá, Zona 02");
  await page.getByRole("combobox",{name:"Entregador",exact:true}).selectOption({label:"Roberto Exemplo"});
  await page.getByRole("button",{name:"Cadastrar NF fictícia"}).click();
  const entrega=page.locator(".demo-delivery-card").filter({hasText:"NF 0045824"});
  await expect(entrega).toBeVisible();
  await entrega.getByRole("button",{name:"Iniciar rota"}).click();
  await expect(entrega.getByText("Em rota", {exact:true})).toBeVisible();
  await entrega.getByRole("button",{name:"Concluir entrega"}).click();
  await expect(entrega.getByText("Entregue",{exact:true})).toBeVisible();

  await menu.getByRole("button",{name:"Comprovantes"}).click();
  await expect(page.getByText("NF 0045824")).toBeVisible();
  await menu.getByRole("button",{name:"Histórico e relatórios"}).click();
  await expect(page.getByText("NF fictícia 0045824: Entregue")).toBeVisible();

  await page.reload();
  await menu.getByRole("button",{name:"Entregas e NFs"}).click();
  await expect(page.locator(".demo-delivery-card").filter({hasText:"NF 0045824"})).toBeVisible();
  await page.getByRole("button",{name:"Reiniciar simulação"}).click();
  await expect(page.locator(".demo-delivery-card").filter({hasText:"NF 0045824"})).toHaveCount(0);
});

test("Fase B demo no celular: formulário de veículo responsivo e histórico",async({browser})=>{
  const page=await browser.newPage({viewport:{width:375,height:812},hasTouch:true,isMobile:true});
  await page.goto("/__e2e_demonstracao");
  const mobile=page.getByRole("navigation",{name:"Atalhos móveis do protótipo"});
  await mobile.getByRole("button",{name:"Entregadores"}).click();
  await expect(page.getByRole("heading",{name:"Veículos fictícios"})).toBeVisible();
  await page.getByRole("textbox",{name:"Placa de exemplo"}).fill("MNO7P89");
  await page.getByRole("combobox",{name:"Categoria"}).selectOption("Van");
  await page.getByRole("button",{name:"Cadastrar veículo"}).click();
  await expect(page.getByText("MNO7P89",{exact:true})).toBeVisible();
  await mobile.getByRole("button",{name:"Abrir todos os módulos"}).click();
  await page.getByRole("navigation",{name:"Menu completo do protótipo"})
    .getByRole("button",{name:"Histórico e relatórios"}).click();
  await expect(page.getByText("Veículo fictício cadastrado: MNO7P89")).toBeVisible();
  await page.close();
});
