import {test,expect} from "@playwright/test";

test("Fase B: destinatário, equipe e plano de teste com sessões isoladas",async({page})=>{
  await page.goto("/__e2e_demonstracao");
  const menu=page.getByRole("navigation",{name:"Menu completo do protótipo"});

  await menu.getByRole("button",{name:"Clientes e links"}).click();
  await expect(page.getByRole("heading",{name:"Cadastrar destinatário fictício"})).toBeVisible();
  await page.getByRole("textbox",{name:"Nome da oficina fictícia"}).fill("Oficina Exemplo D");
  await page.getByRole("button",{name:"Cadastrar destinatário"}).click();
  await expect(page.getByText("Oficina Exemplo D",{exact:true})).toBeVisible();

  await menu.getByRole("button",{name:"Empresa e equipe"}).click();
  await page.getByRole("textbox",{name:"Nome fictício do funcionário"}).fill("Marina Exemplo");
  await page.getByRole("combobox",{name:"Função fictícia"}).selectOption("Gestor");
  await page.getByRole("button",{name:"Cadastrar funcionário fictício"}).click();
  await expect(page.getByText("Marina Exemplo",{exact:true})).toBeVisible();

  await menu.getByRole("button",{name:"Assinatura"}).click();
  await expect(page.getByText("Nenhuma cobrança",{exact:true})).toBeVisible();
  await page.getByRole("button",{name:"Simular seleção"}).click();
  await expect(page.getByText("Plano ilustrativo alterado para Profissional")).toHaveCount(0); // evento visível no histórico
  await page.reload();
  await menu.getByRole("button",{name:"Assinatura"}).click();
  await expect(page.getByText("Selecionado na simulação",{exact:true})).toBeVisible();
  await menu.getByRole("button",{name:"Histórico e relatórios"}).click();
  await expect(page.getByText("Plano ilustrativo alterado para Profissional")).toBeVisible();
});

test("Fase B: comprovante fictício, filtro e CSV sem dados reais",async({page})=>{
  await page.goto("/__e2e_demonstracao");
  const menu=page.getByRole("navigation",{name:"Menu completo do protótipo"});
  await menu.getByRole("button",{name:"Entregas e NFs"}).click();
  const nf=page.locator(".demo-delivery-card").filter({hasText:"NF 0045821"});
  await nf.getByRole("button",{name:"Concluir entrega"}).click();
  await menu.getByRole("button",{name:"Comprovantes"}).click();
  await page.getByRole("combobox",{name:"NF entregue"}).selectOption({label:/NF 0045821/});
  await page.getByRole("textbox",{name:"Recebido por (nome inventado)"}).fill("Cliente Exemplo");
  await page.getByRole("textbox",{name:"Observação fictícia"}).fill("Recebido no balcão");
  await page.getByRole("button",{name:"Registrar recibo fictício"}).click();
  await expect(page.getByText("Recibo fictício — NF 0045821")).toBeVisible();

  await menu.getByRole("button",{name:"Histórico e relatórios"}).click();
  const download=page.waitForEvent("download");
  await page.getByRole("button",{name:"Exportar CSV fictício"}).click();
  const arquivo=await download;
  expect(arquivo.suggestedFilename()).toBe("toaki-simulacao.csv");
  await page.getByRole("textbox",{name:"Filtrar histórico fictício"}).fill("Recibo fictício");
  await expect(page.getByText("Recibo fictício da NF 0045821 registrado")).toBeVisible();
  await page.getByRole("textbox",{name:"Filtrar histórico fictício"}).fill("nenhum evento com essa frase");
  await expect(page.getByText("Nenhum evento encontrado.",{exact:false})).toBeVisible();
});

test("Fase B: módulos novos acessíveis pelo menu do celular",async({browser})=>{
  const page=await browser.newPage({viewport:{width:375,height:812},isMobile:true,hasTouch:true});
  await page.goto("/__e2e_demonstracao");
  for(const [nome,titulo] of [
    ["Clientes e links","Cadastrar destinatário fictício"],
    ["Comprovantes","Gerar comprovante fictício"],
    ["Histórico e relatórios","Histórico e relatórios"],
    ["Empresa e equipe","Empresa e filial fictícias"],
    ["Assinatura","Assinatura demonstrativa"]
  ]){
    await page.getByRole("button",{name:"Abrir menu completo"}).click();
    await page.getByRole("navigation",{name:"Menu completo do protótipo"}).getByRole("button",{name:nome}).click();
    await expect(page.getByRole("heading",{name:titulo,exact:true}).first()).toBeVisible();
  }
  await page.close();
});
