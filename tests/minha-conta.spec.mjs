import { test, expect } from "@playwright/test";

test("Minha conta: área de cliente tem navegação, perfil e segurança sem acesso fake",async({page})=>{
  await page.goto("/__e2e_conta");
  await expect(page.getByRole("heading",{level:1,name:"Minha conta",exact:true})).toBeVisible();
  await expect(page.getByRole("heading",{name:/Olá, Teste/i})).toBeVisible();
  await expect(page.getByRole("button",{name:/Voltar/})).toBeVisible();
  await expect(page.getByRole("button",{name:"Sair"})).toBeVisible();
  await expect(page.getByText("teste@example.com").first()).toBeVisible();
  await expect(page.getByRole("link",{name:/Abrir painel fake/})).toHaveCount(0);
  await page.getByRole("navigation",{name:"Seções da minha conta"}).getByRole("button",{name:"Meus dados"}).click();
  await expect(page.getByRole("heading",{name:"Meu perfil"})).toBeVisible();
  await expect(page.getByRole("heading",{name:"Segurança da conta"})).toBeVisible();
  await expect(page.getByRole("button",{name:"Salvar meu perfil"})).toBeVisible();
  await expect(page.getByRole("button",{name:"Alterar minha senha"})).toBeVisible();
  await expect(page.getByRole("button",{name:"Confirmar meu e-mail"})).toBeVisible();
  await page.getByRole("navigation",{name:"Seções da minha conta"}).getByRole("button",{name:"Minhas entregas"}).click();
  await expect(page.getByText("A consulta das suas entregas ainda está sendo integrada.")).toBeVisible();
  await page.getByRole("navigation",{name:"Seções da minha conta"}).getByRole("button",{name:"Minha empresa"}).click();
  await expect(page.getByRole("heading",{name:"Cadastro empresarial separado"})).toBeVisible();
  await expect(page.getByRole("link",{name:"Continuar cadastro empresarial →"})).toHaveAttribute("href","/cadastro/empresa/dados");
});

test("Minha conta: navegação mobile a 320px não fica cortada",async({browser})=>{
  const page=await browser.newPage({viewport:{width:320,height:650},isMobile:true,hasTouch:true});
  await page.goto("/__e2e_conta");
  await expect(page.getByRole("button",{name:/Voltar/})).toBeVisible();
  const nav=page.getByRole("navigation",{name:"Seções da minha conta"});
  for(const nome of ["Visão geral","Minhas entregas","Minha empresa","Meus dados"]) {
    await expect(nav.getByRole("button",{name:nome})).toBeVisible();
  }
  await nav.getByRole("button",{name:"Meus dados"}).click();
  await expect(page.getByRole("heading",{name:"Segurança da conta"})).toBeVisible();
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+2);
  expect(overflow).toBe(false);
  await page.close();
});
