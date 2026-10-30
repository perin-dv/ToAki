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
  for (const route of ['/login','/cadastro','/empresa','/cliente','/admin']) {
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

test('Entrada pública oferece funcionalidades reais e não expõe a demonstração técnica', () => {
  const main = file('src/main.tsx');
  const login = file('src/pages/AuthPages.tsx');
  assert.ok(main.includes('<Route path="/" element={<PublicHomePage/>}/>'));
  assert.ok(main.includes('<Route path="/inicio" element={<PrivateRoute area="demo"><SiteOperacionalPage/></PrivateRoute>}/>'));
  assert.ok(!main.includes('<Route path="/demonstracao"'));
  assert.ok(login.includes('Após entrar, você verá apenas informações que sua conta está autorizada a acessar.'));
});

test('Fundo lateral preto uniforme e logo integrados no login e prototipo', () => {
  const css = file('src/styles.css');
  const brand = file('src/components/Brand.tsx');
  const auth = file('src/pages/AuthPages.tsx');
  assert.ok(css.includes('--toaki-sidebar:#000000'));
  assert.ok(css.includes('filter:contrast(1.2) saturate(1.02)'));
  assert.ok(css.includes('.demo-sidebar,.auth-intro,.private-header,.mobile-top,.mobile-nav'));
  assert.ok(brand.includes('to={user?"/inicio":"/"}'));
  assert.ok(auth.includes('Já tem cadastro no Firebase Authentication?'));
  assert.ok(auth.includes('Após entrar, você verá apenas informações que sua conta está autorizada a acessar.'));
});

test('Cadastro de teste usa e-mail/senha sem link automático e protege dados empresariais', () => {
  const pages = file('src/pages/AuthPages.tsx');
  const cadastro = pages.split('export function RegisterPage({tipo}')[1].split('export function PasswordPage()')[0];
  const login = pages.split('export function LoginPage()')[1].split('export function RegisterChoicePage()')[0];
  const confirmacao = pages.split('export function VerifyEmailPage()')[1];
  const guard = file('src/components/PrivateRoute.tsx');
  const empresa = file('src/pages/CompanyRegistration.tsx');
  assert.ok(cadastro.includes('createUserWithEmailAndPassword'));
  assert.ok(!cadastro.includes('sendEmailVerification('));
  assert.ok(cadastro.includes('navigate(tipo==="empresa"?"/cadastro/empresa/dados":"/inicio"'));
  assert.ok(login.includes('navigate(returnTo,{replace:true})'));
  assert.ok(guard.includes('!user.emailVerified && area!=="cliente"'));
  assert.ok(empresa.includes('onSnapshot(doc(db,"solicitacoes_cadastro_empresas",user.uid)'));
  assert.ok(empresa.includes('if(!ambienteOperacional||!user?.emailVerified'));
  assert.ok(empresa.includes('ja vinculada') || empresa.includes('já vinculada'));
  assert.ok(empresa.includes('await setDoc('));
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

test('Demonstracao existe apenas no modo de teste técnico; icones SVG correspondem aos módulos', () => {
  const routes = file('src/main.tsx');
  const guard = file('src/components/PrivateRoute.tsx');
  const demo = file('src/pages/DemoPage.tsx');
  const icons = file('src/components/MenuIcon.tsx');
  const login = file('src/pages/AuthPages.tsx');
  assert.ok(!routes.includes('<PrivateRoute area="demo"><DemoPage/></PrivateRoute>'));
  assert.ok(guard.includes('if (!user) return <Navigate to="/login"'));
  assert.ok(guard.includes('area==="demo"?true'));
  assert.ok(routes.includes('import.meta.env.MODE === "e2e"'));
  assert.ok(!demo.includes('to="/login"'));
  assert.ok(demo.includes('<MenuIcon name={m.key}'));
  assert.ok(demo.includes('accountPath'));
  for (const name of ['inicio','entregas','entregadores','clientes','comprovantes','historico','empresa','assinatura']) {
    assert.ok(icons.includes(name + ':'), 'SVG ausente: ' + name);
  }
  assert.ok(login.includes('returnTo'));
  assert.ok(!login.includes('<Link to="/demonstracao">'));
});

test('Cadastro real de usuario para piloto não libera cadastros empresariais',()=>{
  const auth=file('src/pages/AuthPages.tsx');
  const register=auth.split('export function RegisterPage({tipo}')[1].split('export function PasswordPage()')[0];
  const empresa=file('src/pages/CompanyRegistration.tsx');
  const config=file('src/lib/ambiente.ts');
  const privatePage=file('src/pages/PrivatePages.tsx');
  assert.ok(register.includes('createUserWithEmailAndPassword(auth,'));
  assert.ok(!register.includes('if(!ambienteHomologacao)'));
  assert.ok(register.includes('link de testes não é privado'));
  assert.ok(!register.includes('sendEmailVerification('));
  assert.ok(empresa.includes('if(!ambienteOperacional) return'));
  assert.ok(empresa.includes('ambientePilotoOriginal'));
  assert.ok(empresa.includes('A empresa só receberá acesso após análise administrativa'));
  assert.ok(config.includes('exigirAmbienteOperacional'));
  assert.ok(config.includes('VITE_TOAKI_PILOTO_NO_ORIGINAL'));
  assert.ok(config.includes('ambientePilotoOriginal'));
  assert.ok(privatePage.includes('ambienteOperacional?<EmpresaOperacao/>'));
  assert.ok(privatePage.includes('Cadastros empresariais e entregas reais continuam bloqueados'));
});

test('Fluxo correto: landing, cliente e empresa separados, home apos login, logo e voltar seguros',()=>{
 const routes=file('src/main.tsx');
 const auth=file('src/pages/AuthPages.tsx');
 const brand=file('src/components/Brand.tsx');
 const privatePages=file('src/pages/PrivatePages.tsx');
 const start=file('src/pages/HomePages.tsx');
 assert.ok(routes.includes('<Route path="/cadastro/cliente" element={<RegisterPage tipo="cliente"/>}/>'));
 assert.ok(routes.includes('<Route path="/cadastro/empresa" element={<RegisterPage tipo="empresa"/>}/>'));
 assert.ok(routes.includes('<Route path="/cadastro/empresa/dados" element={<PrivateRoute area="demo"><CompanyOnboardingPage/></PrivateRoute>}/>'));
 assert.ok(auth.includes('export function RegisterChoicePage()'));
 assert.ok(auth.includes('navigate(returnTo,{replace:true})'));
 assert.ok(auth.includes('navigate(tipo==="empresa"?"/cadastro/empresa/dados":"/inicio"'));
 assert.ok(brand.includes('to={user?"/inicio":"/"}'));
 assert.ok(privatePages.includes('const voltar=()=>navigate("/inicio")'));
 assert.ok(!privatePages.includes('navigate(-1)'));
 assert.ok(start.includes('Cadastrar como cliente'));
 assert.ok(start.includes('Cadastrar minha empresa'));
 assert.ok(routes.includes('<Route path="/inicio" element={<PrivateRoute area="demo"><SiteOperacionalPage/></PrivateRoute>}/>'));
 assert.ok(file("src/pages/DemoPage.tsx").includes("onHomeClick={voltarAoMapa}"));
});

test('O painel operacional não usa dados simulados ou SVG fictício no /inicio',()=>{
  const main=file('src/main.tsx');
  const site=file('src/pages/SiteOperacionalPage.tsx');
  const demo=file('src/pages/DemoPage.tsx');
  assert.ok(main.includes('<Route path="/inicio" element={<PrivateRoute area="demo"><SiteOperacionalPage/></PrivateRoute>}/>'));
  assert.ok(!main.includes('<Route path="/demonstracao"'));
  assert.ok(site.includes('onSnapshot(query(caminho,limit(50))'));
  assert.ok(site.includes('Nenhuma localização fictícia'));
  assert.ok(!site.includes('dadosIniciais('));
  assert.ok(!site.includes('sessionStorage'));
  assert.ok(!site.includes('MapIllustration'));
  assert.ok(demo.includes('MAPA FICTÍCIO'));
  assert.ok(file('ROADMAP_SITE_OFICIAL.md').includes('Flutter'));
});

test("Relatórios operacionais usam dados de pedidos do Firestore, não exemplos fictícios",()=>{
  const site=file("src/pages/SiteOperacionalPage.tsx");
  const relatorio=file("src/pages/RelatoriosEmpresaPage.tsx");
  assert.ok(site.includes('import RelatoriosEmpresaPage from "./RelatoriosEmpresaPage"'));
  assert.ok(site.includes('<RelatoriosEmpresaPage empresaId={empresaId!}/>'));
  assert.ok(relatorio.includes('collection(db,"empresas",empresaId,"pedidos")'));
  assert.ok(relatorio.includes("onSnapshot(ref,snapshot=>"));
  assert.ok(relatorio.includes("Até {limite} NFs consultadas"));
  assert.ok(relatorio.includes('textoCSV(c)'));
  assert.ok(!relatorio.includes("sessionStorage"));
  assert.ok(!relatorio.includes("dadosIniciais"));
});

test("Planos e assinaturas consultam apenas documentos permitidos pelo Firestore",()=>{
  const modulo=file("src/pages/AssinaturaEmpresaPage.tsx");
  const painel=file("src/pages/SiteOperacionalPage.tsx");
  assert.ok(modulo.includes('where("publicado","==",true)'));
  assert.ok(modulo.includes('where("empresa_id","==",empresaId)'));
  assert.ok(modulo.includes("nenhum pagamento é simulado"));
  assert.ok(modulo.includes("checkout será conectado"));
  assert.ok(painel.includes("<AssinaturaEmpresaPage empresaId={empresaId!}/>"));
  assert.ok(!modulo.includes("sessionStorage"));
});

test("Após aprovação empresarial o painel pode atualizar claims sem desconectar a conta",()=>{
  const site=file("src/pages/SiteOperacionalPage.tsx");
  assert.ok(site.includes("const {user,role,refreshClaims}=useAuth()"));
  assert.ok(site.includes("await refreshClaims()"));
  assert.ok(site.includes("Verificar se minha empresa foi aprovada"));
  assert.ok(site.includes("Atualizar permissão da minha conta"));
});

test("Diagnóstico do Firebase usa apenas metadados e não injeta segredo em PR",()=>{
  const workflow=file(".github/workflows/firebase-diagnostico-readonly.yml");
  const script=file("scripts/diagnostico-firebase-readonly.cjs");
  assert.ok(workflow.includes("workflow_dispatch:"));
  assert.ok(workflow.includes("github.ref == 'refs/heads/main'"));
  assert.ok(workflow.includes("persist-credentials: false"));
  assert.ok(workflow.includes("secrets.FIREBASE_SERVICE_ACCOUNT_TOAKI_CF058"));
  assert.ok(!/^[ ]+(pull_request|pull_request_target|push):/m.test(workflow));
  assert.ok(!/firebase(?:-tools)?\s+deploy|hosting:channel:deploy/.test(workflow));
  assert.ok(script.includes("documents:listCollectionIds"));
  assert.ok(script.includes('"POST",{pageSize:100}'));
  assert.ok(script.includes('method="GET"'));
  assert.ok(!workflow.includes("npm install"));
  assert.ok(!/\.set\(|\.create\(|\.update\((?!mensagem\))|\.delete\(|setCustomUserClaims\(/.test(script));
  assert.ok(script.includes("resultado.firestore"));
  assert.ok(script.includes("resultado.functions"));
});

test('Em build normal a rota demonstrativa e os links para dados fictícios estão ausentes',()=>{
 const main=file('src/main.tsx');
 const site=file('src/pages/SiteOperacionalPage.tsx');
 const home=file('src/pages/HomePages.tsx');
 assert.ok(!main.includes('<Route path="/demonstracao"'));
 assert.ok(main.includes('import.meta.env.MODE === "e2e" && <Route path="/__e2e_demonstracao"'));
 assert.ok(!site.includes('to="/demonstracao"'));
 assert.ok(!home.includes('to="/demonstracao"'));
});
