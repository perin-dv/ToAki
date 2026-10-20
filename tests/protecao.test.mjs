import { readFileSync, existsSync } from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';

const file = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('Hosting aponta exclusivamente para a pasta compilada', () => {
  const config = JSON.parse(file('firebase.json'));
  assert.equal(config.hosting.public, 'dist');
  assert.ok(config.hosting.rewrites.some((rule) => rule.source === '**' && rule.destination === '/index.html'));
});

test('Projeto Firebase separado de outros aplicativos', () => {
  const config = JSON.parse(file('.firebaserc'));
  assert.equal(config.projects.default, 'toaki-cf058');
  assert.ok(!file('firebase.json').includes('temnaloja'));
});

test('Interface de demonstracao mantem os oito modulos e o mapa fake', () => {
  const html = file('index.html');
  for (const text of ['toAki', 'Entregas e NFs', 'Entregadores', 'Clientes e links', 'Comprovantes', 'Histórico e relatórios', 'Empresa e equipe', 'Assinatura']) {
    assert.ok(html.includes(text), 'Falta um modulo/identidade: ' + text);
  }
  assert.ok(html.includes('fake-map'));
  assert.ok(html.includes('simulado') || html.includes('ilustrativo'));
});

test('Nao versionar arquivos locais ou segredos acidentalmente', () => {
  const ignore = file('.gitignore');
  for (const target of ['node_modules/', 'dist/', '.env']) {
    assert.ok(ignore.includes(target));
  }
  assert.ok(existsSync(new URL('../package.json', import.meta.url)));
});

test('Logo oficial aparece no desktop e no celular', () => {
  const html = file('index.html');
  assert.equal((html.match(/class="brand-logo"/g) ?? []).length, 2);
  assert.ok(html.includes('src="/logo-toaki.webp"'));
  assert.ok(existsSync(new URL('../public/logo-toaki.webp', import.meta.url)));
});
