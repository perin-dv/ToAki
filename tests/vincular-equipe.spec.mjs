import {test,expect} from "@playwright/test";
test("convite inválido da equipe nunca concede acesso",async({page})=>{
  await page.goto("/vincular-equipe#empresa=empresa_teste_soma&convite=conv_X&codigo=forjado");
  await expect(page.getByRole("heading",{name:"Aceitar convite da empresa"})).toBeVisible();
  await expect(page.getByRole("alert")).toContainText("Convite incompleto ou inválido");
  await expect(page.getByRole("button",{name:"Confirmar vínculo com a equipe"})).toHaveCount(0);
});
