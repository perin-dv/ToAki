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
  assert.ok(css.includes('--toaki-sidebar:#000000'));
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

test('Entrada inicial é login e demonstração fica como opção separada', () => {
  const main = file('src/main.tsx');
  const login = file('src/pages/AuthPages.tsx');
  assert.ok(main.includes('<Route path="/" element={<Navigate to="/login" replace/>}/>'));
  assert.ok(main.includes('<Route path="/demonstracao" element={<PrivateRoute area="demo"><DemoPage/></PrivateRoute>}/>'));
  assert.ok(login.includes('O painel de demonstração e seus menus são acessíveis somente após entrar na sua conta.'));
});

test('Fundo lateral preto uniforme e logo integrados no login e prototipo', () => {
  const css = file('src/styles.css');
  const brand = file('src/components/Brand.tsx');
  const auth = file('src/pages/AuthPages.tsx');
  assert.ok(css.includes('--toaki-sidebar:#000000'));
  assert.ok(css.includes('filter:contrast(1.2) saturate(1.02)'));
  assert.ok(css.includes('.demo-sidebar,.auth-intro,.private-header,.mobile-top,.mobile-nav'));
  assert.ok(brand.includes('to="/login"'));
  assert.ok(auth.includes('Já tem cadastro no Firebase Authentication?'));
  assert.ok(auth.includes('O painel de demonstração e seus menus são acessíveis somente após entrar na sua conta.'));
});

test('Cadastro de teste usa e-mail/senha sem link automático e protege dados empresariais', () => {
  const pages = file('src/pages/AuthPages.tsx');
  const cadastro = pages.split('export function RegisterPage()')[1].split('export function PasswordPage()')[0];
  const login = pages.split('export function LoginPage()')[1].split('export function RegisterPage()')[0];
  const confirmacao = pages.split('export function VerifyEmailPage()')[1];
  const guard = file('src/components/PrivateRoute.tsx');
  const empresa = file('src/pages/CompanyRegistration.tsx');
  assert.ok(cadastro.includes('createUserWithEmailAndPassword'));
  assert.ok(!cadastro.includes('sendEmailVerification('));
  assert.ok(cadastro.includes('navigate("/cliente")'));
  assert.ok(login.includes('if(!user.emailVerified){navigate(voltarAoDemo?"/demonstracao":"/cliente");return}'));
  assert.ok(guard.includes('!user.emailVerified && area!=="cliente"'));
  assert.ok(empresa.includes('if(!user?.emailVerified)return;getDoc('));
  assert.ok(empresa.includes('Confirmar e-mail para cadastrar empresa'));
  assert.ok(confirmacao.includes('sendEmailVerification(user)'));
});

test('No celular, Menu e Mais abrem os oito modulos em lateral acessivel', () => {
  const demo = file('src/pages/DemoPage.tsx');
  const css = file('src/styles.css');
  for (const nome of ['Início','Entregas e NFs','Entregadores','Clientes e links','Comprovantes','Histórico e relatórios','Empresa e equipe','Assinatura']) {
    assert.ok(demo.includes('name:"'+nome+'"'), 'Módulo ausente: ' + nome);
  }
  assert.ok(demo.includes('aria-label="Abrir menu completo"'));
  assert.ok(demo.includes('aria-label="Abrir todos os módulos"'));
  assert.ok(demo.includes('aria-controls="demo-sidebar-menu"'));
  assert.ok(demo.includes('onClick={()=>mudarAba(m.key)}'));
  assert.ok(demo.includes('setMenuAberto(false)'));
  assert.ok(demo.includes('evento.key==="Escape"'));
  assert.ok(demo.includes('className="drawer-backdrop"'));
  assert.ok(css.includes('.demo-sidebar.drawer-open'));
  assert.ok(css.includes('position:fixed'));
  assert.ok(css.includes('.drawer-backdrop'));
  assert.ok(css.includes('touch-action:manipulation'));
});

test('Demonstracao exige sessao; icones SVG correspondem a cada modulo', () => {
  const routes = file('src/main.tsx');
  const guard = file('src/components/PrivateRoute.tsx');
  const demo = file('src/pages/DemoPage.tsx');
  const icons = file('src/components/MenuIcon.tsx');
  const login = file('src/pages/AuthPages.tsx');
  assert.ok(routes.includes('<PrivateRoute area="demo"><DemoPage/></PrivateRoute>'));
  assert.ok(guard.includes('if (!user) return <Navigate to="/login"'));
  assert.ok(guard.includes('area==="demo"?true'));
  assert.ok(routes.includes('import.meta.env.MODE === "e2e"'));
  assert.ok(!demo.includes('to="/login"'));
  assert.ok(demo.includes('<MenuIcon name={m.key}'));
  assert.ok(demo.includes('accountPath'));
  for (const name of ['inicio','entregas','entregadores','clientes','comprovantes','historico','empresa','assinatura']) {
    assert.ok(icons.includes(name + ':'), 'SVG ausente: ' + name);
  }
  assert.ok(login.includes('voltarAoDemo'));
  assert.ok(!login.includes('<Link to="/demonstracao">'));
});

test('Cadastro real de usuario para piloto não libera cadastros empresariais',()=>{
  const auth=file('src/pages/AuthPages.tsx');
  const register=auth.split('export function RegisterPage()')[1].split('export function PasswordPage()')[0];
  const empresa=file('src/pages/CompanyRegistration.tsx');
  const config=file('src/lib/ambiente.ts');
  const privatePage=file('src/pages/PrivatePages.tsx');
  assert.ok(register.includes('createUserWithEmailAndPassword(auth,'));
  assert.ok(!register.includes('if(!ambienteHomologacao)'));
  assert.ok(register.includes('link do preview não é privado'));
  assert.ok(!register.includes('sendEmailVerification('));
  assert.ok(empresa.includes('if(!ambienteHomologacao) return'));
  assert.ok(config.includes('exigirHomologacao'));
  assert.ok(privatePage.includes('solicitações empresariais e operações de entregas reais continuam bloqueadas'));
});
