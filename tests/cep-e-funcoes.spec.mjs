import {test,expect} from "@playwright/test";
const menuName="Menu completo do protótipo";
test("CEP inexistente não inventa endereço e permite correção manual",async({page})=>{
  await page.route("https://viacep.com.br/ws/**",route=>route.fulfill({status:200,contentType:"application/json",body:'{"erro":true}'}));
  await page.goto("/__e2e_demonstracao");
  await page.getByRole("navigation",{name:menuName}).getByRole("button",{name:"Clientes e links"}).click();
  await page.getByRole("textbox",{name:"Nome da oficina fictícia"}).fill("Cliente Exemplo E");
  await page.getByRole("textbox",{name:"CEP"}).fill("99999999");
  await expect(page.getByText("CEP não encontrado.",{exact:false})).toBeVisible();
  await expect(page.getByRole("textbox",{name:"Rua / Logradouro"})).toHaveValue("");
  await page.getByRole("textbox",{name:"Rua / Logradouro"}).fill("Rua de Exemplo");
  await page.getByRole("textbox",{name:"Número"}).fill("S/N");
  await page.getByRole("textbox",{name:"Bairro"}).fill("Centro");
  await page.getByRole("textbox",{name:"Cidade"}).fill("Cidade de Exemplo");
  await page.getByRole("textbox",{name:"UF"}).fill("PR");
  await page.getByRole("button",{name:"Cadastrar destinatário"}).click();
  await expect(page.getByText("Cliente Exemplo E",{exact:true})).toBeVisible();
});

test("Trocar CEP remove endereço antigo e ignora resposta de busca atrasada",async({page})=>{
  await page.route("https://viacep.com.br/ws/**",async route=>{
    if(route.request().url().includes("01001000")){
      await new Promise(resolve=>setTimeout(resolve,800));
      return route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({logradouro:"Praça da Sé",bairro:"Sé",localidade:"São Paulo",uf:"SP"})}).catch(()=>{});
    }
    return route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({logradouro:"Avenida Brasil",bairro:"Centro",localidade:"Rio de Janeiro",uf:"RJ"})});
  });
  await page.goto("/__e2e_demonstracao");
  await page.getByRole("navigation",{name:menuName}).getByRole("button",{name:"Clientes e links"}).click();
  const cep=page.getByRole("textbox",{name:"CEP"});
  await cep.fill("01001000");
  await page.waitForTimeout(420);
  await cep.fill("20040002");
  await expect(page.getByRole("textbox",{name:"Rua / Logradouro"})).toHaveValue("Avenida Brasil");
  await page.waitForTimeout(850);
  await expect(page.getByRole("textbox",{name:"Cidade"})).toHaveValue("Rio de Janeiro");
  await expect(page.getByRole("textbox",{name:"UF"})).toHaveValue("RJ");
  await page.getByRole("textbox",{name:"Número"}).fill("512");
  await expect(page.getByRole("textbox",{name:"Número"})).toHaveValue("512");
});

test("CEP funciona no formulário de desktop e papel Transportadora aparece na equipe",async({page})=>{
  await page.route("https://viacep.com.br/ws/**",route=>route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({cep:"01001-000",logradouro:"Praça da Sé",bairro:"Sé",localidade:"São Paulo",uf:"SP"})}));
  await page.goto("/__e2e_demonstracao");
  await page.getByRole("navigation",{name:menuName}).getByRole("button",{name:"Clientes e links"}).click();
  await page.getByRole("textbox",{name:"CEP"}).fill("01001-000");
  await expect(page.getByRole("textbox",{name:"Rua / Logradouro"})).toHaveValue("Praça da Sé");
  await expect(page.getByRole("textbox",{name:"Número"})).toHaveValue("");
  await expect(page.getByRole("textbox",{name:"Complemento (opcional)"})).toHaveValue("");
  await page.getByRole("navigation",{name:menuName}).getByRole("button",{name:"Empresa e equipe"}).click();
  const funcoes=page.getByRole("combobox",{name:"Função fictícia"});
  for(const funcao of ["Gestor","Vendedor","Motoboy","Representante","Transportadora"]){
    await expect(funcoes.locator("option",{hasText:funcao})).toHaveCount(1);
  }
  await page.getByRole("textbox",{name:"Nome fictício do funcionário"}).fill("Transportadora Exemplo");
  await funcoes.selectOption("Transportadora");
  await page.getByRole("button",{name:"Cadastrar funcionário fictício"}).click();
  await expect(page.getByText("Transportadora · não tem login nem acesso real")).toBeVisible();
});
