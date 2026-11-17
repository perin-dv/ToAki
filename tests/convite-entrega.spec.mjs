import {test,expect} from "@playwright/test";
test("convite inválido não exige Firebase nem revela NF",async({page})=>{
  await page.goto("/vincular-entrega#empresa=empresa_teste_soma&pedido=x&codigo=invalido");
  await expect(page.getByRole("heading",{name:"Vincular entrega à minha conta"})).toBeVisible();
  await expect(page.getByRole("alert")).toContainText("inválido");
  await expect(page.getByRole("button",{name:"Confirmar vínculo desta entrega"})).toHaveCount(0);
});
