import {test,expect} from "@playwright/test";

test("Acesso público: landing mostra escolha explícita entre cliente e empresa",async({page})=>{
  await page.goto("/");
  await expect(page.getByRole("heading",{name:/Sua entrega,/i})).toBeVisible();
  await expect(page.getByRole("link",{name:"Cadastrar como cliente →"})).toHaveAttribute("href","/cadastro/cliente");
  await expect(page.getByRole("link",{name:"Cadastrar minha empresa →"})).toHaveAttribute("href","/cadastro/empresa");
  await page.getByRole("link",{name:"Começar agora →"}).click();
  await expect(page.getByRole("heading",{name:"Como você quer se cadastrar?"})).toBeVisible();
  await page.getByRole("link",{name:/Sou cliente/}).click();
  await expect(page).toHaveURL(/\/cadastro\/cliente$/);
  await expect(page.getByRole("heading",{name:"Cadastro de cliente"})).toBeVisible();
  await expect(page.getByRole("button",{name:"Criar conta de cliente"})).toBeDisabled();
  await page.getByRole("link",{name:/Trocar tipo de cadastro/}).click();
  await page.getByRole("link",{name:/Tenho uma empresa/}).click();
  await expect(page).toHaveURL(/\/cadastro\/empresa$/);
  await expect(page.getByRole("heading",{name:"Cadastrar minha empresa"})).toBeVisible();
  await expect(page.getByText("Etapa 1 de 2:",{exact:false})).toBeVisible();
  await expect(page.getByRole("button",{name:"Criar acesso e continuar →"})).toBeDisabled();
  await expect(page.getByText("Criar a conta não concede cargo empresarial",{exact:false})).toBeVisible();
  await expect(page.getByRole("link",{name:"toAki, voltar ao início"})).toHaveAttribute("href","/");
});

test("Sem login nenhuma área privada é acessível por URL",async({page})=>{
  for(const p of ["/inicio","/cliente","/empresa","/cadastro/empresa/dados"]){
    await page.goto(p);
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading",{name:"Entrar no toAki"})).toBeVisible();
  }
  await page.goto("/demonstracao");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText("MAPA FICTÍCIO")).toHaveCount(0);
});

test("Login: conta, logo, criar e recuperar têm destino correto",async({page})=>{
  await page.goto("/login");
  await expect(page.getByRole("link",{name:"toAki, voltar ao início"})).toHaveAttribute("href","/");
  await page.getByRole("link",{name:"Criar conta"}).click();
  await expect(page).toHaveURL(/\/cadastro$/);
  await page.getByRole("link",{name:"Entrar",exact:true}).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.getByRole("link",{name:/Esqueceu sua senha/}).click();
  await expect(page).toHaveURL(/\/recuperar-senha$/);
  await page.getByRole("link",{name:"Voltar ao login"}).click();
  await expect(page).toHaveURL(/\/login$/);
});

test("Cadastro no celular: escolha e formulários não estouram viewport",async({browser})=>{
  const page=await browser.newPage({viewport:{width:320,height:700},isMobile:true,hasTouch:true});
  for(const p of ["/","/cadastro","/cadastro/cliente","/cadastro/empresa","/login"]){
    await page.goto(p);
    const over=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+3);
    expect(over, "overflow em "+p).toBe(false);
  }
  await page.close();
});
