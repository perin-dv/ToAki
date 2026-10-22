import { test, expect } from '@playwright/test';

test('cadastro no celular: senha fraca vermelha, média amarela e forte verde', async ({browser})=>{
  const page=await browser.newPage({viewport:{width:375,height:812},isMobile:true,hasTouch:true});
  await page.goto('/cadastro/cliente');
  await page.getByRole('textbox',{name:'Nome de contato'}).fill('Ana Ferreira');
  await page.getByRole('textbox',{name:'E-mail'}).fill('ana@example.com');

  const senha=page.locator('input[autocomplete="new-password"]').first();
  const confirmar=page.locator('input[autocomplete="new-password"]').nth(1);
  const indicador=page.locator('[data-strength]');
  const criar=page.getByRole('button',{name:'Criar conta de cliente'});

  await senha.fill('123456');
  await expect(indicador).toHaveAttribute('data-strength','fraca');
  await expect(page.getByText('Senha Fraca')).toBeVisible();
  await expect(criar).toBeDisabled();

  await senha.fill('SolNuvem2026');
  await expect(indicador).toHaveAttribute('data-strength','media');
  await expect(page.getByText('Senha Média')).toBeVisible();
  await expect(criar).toBeDisabled();

  await senha.fill('SolNuvem2026!Pato');
  await expect(indicador).toHaveAttribute('data-strength','forte');
  await expect(page.getByText('Senha Forte')).toBeVisible();
  await confirmar.fill('SenhaNaoIgual123!');
  await expect(page.getByText('As senhas não coincidem.')).toBeVisible();
  await expect(criar).toBeDisabled();

  await confirmar.fill('SolNuvem2026!Pato');
  await expect(page.getByText('As senhas coincidem.')).toBeVisible();
  await expect(criar).toBeEnabled();

  await page.getByRole('button',{name:'Mostrar senha'}).click();
  await expect(senha).toHaveAttribute('type','text');
  await expect(confirmar).toHaveAttribute('type','text');
  await page.getByRole('button',{name:'Ocultar senha'}).click();
  await expect(senha).toHaveAttribute('type','password');
  await expect(confirmar).toHaveAttribute('type','password');
  // Nunca criar conta real nos testes visuais.
  await page.close();
});

test('login mantém senha oculta até o usuário clicar para mostrar', async ({page})=>{
  await page.goto('/login');
  const senha=page.locator('input[autocomplete="current-password"]');
  await expect(senha).toHaveAttribute('type','password');
  await page.getByRole('button',{name:'Mostrar senha'}).click();
  await expect(senha).toHaveAttribute('type','text');
  await page.getByRole('button',{name:'Ocultar senha'}).click();
  await expect(senha).toHaveAttribute('type','password');
});
