import { readFileSync, existsSync } from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';

const file = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('Hosting compila para dist e Firebase do ToAki', () => {
  const config = JSON.parse(file('firebase.json'));
  assert.equal(config.hosting.public, 'dist');
  assert.ok(config.hosting.rewrites.some(rule => rule.source === '**' && rule.destination === '/index.html'));
  assert.equal(config.firestore.rules, 'firestore.rules');
  assert.equal(JSON.parse(file('.firebaserc')).projects.default, 'toaki-cf058');
});

test('Fase A migrou para React com portal de empresa, cliente e administração', () => {
  const index = file('index.html');
  const main = file('src/main.tsx');
  assert.ok(index.includes('/src/main.tsx'));
  for (const route of ['/login','/cadastro','/empresa','/cliente','/admin','/demonstracao']) {
    assert.ok(main.includes(route), 'rota faltante: ' + route);
  }
  assert.ok(existsSync(new URL('../src/pages/AuthPages.tsx', import.meta.url)));
  assert.ok(existsSync(new URL('../src/pages/PrivatePages.tsx', import.meta.url)));
});

test('Marca oficial, tema híbrido e mapa fake preservados no React', () => {
  const logo = file('src/components/Brand.tsx');
  const demo = file('src/pages/DemoPage.tsx');
  const css = file('src/styles.css');
  assert.ok(logo.includes('/logo-toaki.webp'));
  assert.ok(existsSync(new URL('../public/logo-toaki.webp', import.meta.url)));
  assert.ok(demo.includes('fake-map'));
  assert.ok(demo.includes('Mapa demonstrativo ilustrativo, sem GPS real'));
  assert.ok(css.includes('--toaki-sidebar:#0d111a'));
});

test('Regras do Firestore negam todos os dados por padrão', () => {
  const rules = file('firestore.rules');
  assert.ok(rules.includes('allow read, write: if false'));
  assert.ok(rules.includes('solicitacoes_cadastro_empresas'));
  assert.ok(rules.includes('allow get: if proprietario(uid) || adminToaki()'));
  assert.ok(rules.includes("request.resource.data.status == 'aguardando_analise'"));
  assert.ok(rules.includes('allow update, delete: if false'));
});

test('UID técnico não concede cargo e cadastro da empresa exige análise', () => {
  const guards = file('src/components/PrivateRoute.tsx');
  const req = file('src/pages/CompanyRegistration.tsx');
  assert.ok(guards.includes('role==="admin_toaki"'));
  assert.ok(req.includes('status:"aguardando_analise"'));
  assert.ok(req.includes('titulo_registro'));
  assert.ok(req.includes('razao_social'));
});

test('Arquivos privados permanecem excluídos do Git', () => {
  const ignore = file('.gitignore');
  for (const value of ['node_modules/', 'dist/', '.env']) assert.ok(ignore.includes(value));
});
