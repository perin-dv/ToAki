import { test, expect } from '@playwright/test';

const modulos = [
  'Início', 'Entregas e NFs', 'Entregadores', 'Clientes e links',
  'Comprovantes', 'Histórico e relatórios', 'Empresa e equipe', 'Assinatura'
];

test('celular: Menu lateral abre todos os 8 módulos, navega e fecha', async ({ browser }) => {
  const page = await browser.newPage({viewport: {width: 375, height: 812}, isMobile: true, hasTouch: true});
  await page.goto('/demonstracao');
  const abrir = page.getByRole('button', {name: 'Abrir menu completo'});
  await expect(abrir).toBeVisible();
  await abrir.click();
  const nav = page.getByRole('navigation', {name: 'Menu completo do protótipo'});
  await expect(nav).toBeVisible();
  for (const nome of modulos) {
    await expect(nav.getByRole('button', {name: nome, exact: true})).toBeVisible();
  }
  for (const nome of modulos.slice(1)) {
    await nav.getByRole('button', {name: nome, exact: true}).click();
    await expect(page.getByRole('heading', {name: nome, exact: true}).first()).toBeVisible();
    await expect(abrir).toHaveAttribute('aria-expanded','false');
    await abrir.click();
  }
  await page.keyboard.press('Escape');
  await expect(abrir).toHaveAttribute('aria-expanded','false');
  await page.getByRole('button', {name:'Abrir todos os módulos'}).click();
  await expect(nav).toBeVisible();
  await page.getByRole('button', {name:'Fechar menu lateral'}).click({position:{x:350,y:400}});
  await expect(abrir).toHaveAttribute('aria-expanded','false');
  await page.close();
});

test('celular estreito: acesso ao menu continua funcional', async ({browser}) => {
  const page=await browser.newPage({viewport:{width:320,height:640},isMobile:true,hasTouch:true});
  await page.goto('/demonstracao');
  await page.getByRole('button',{name:'Abrir todos os módulos'}).click();
  await page.getByRole('navigation',{name:'Menu completo do protótipo'})
    .getByRole('button',{name:'Clientes e links'}).click();
  await expect(page.getByRole('heading',{name:'Clientes e links',exact:true}).first()).toBeVisible();
  await page.close();
});

test('desktop: menu lateral permanece visível', async ({page}) => {
  await page.goto('/demonstracao');
  const nav=page.getByRole('navigation',{name:'Menu completo do protótipo'});
  await expect(nav).toBeVisible();
  await nav.getByRole('button',{name:'Assinatura'}).click();
  await expect(page.getByRole('heading',{name:'Assinatura',exact:true}).first()).toBeVisible();
});
