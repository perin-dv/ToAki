"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const ler=p=>fs.readFileSync(p,"utf8");

test("login renova claims servidor e reconhece empresa automaticamente",()=>{
 const auth=ler("src/auth/AuthProvider.tsx");
 assert.match(auth,/onAuthStateChanged\(auth/);
 assert.match(auth,/getIdTokenResult\(true\)/);
 assert.match(auth,/identificadorEmpresaValido\(id\)/);
 assert.match(auth,/setEmpresaId\(papel/);
 assert.match(auth,/visibilitychange/);
 assert.match(auth,/window\.addEventListener\("focus"/);
 assert.match(auth,/auth\.currentUser\?\.uid !== current\.uid/);
 assert.doesNotMatch(auth,/setCustomUserClaims|localStorage\.setItem\("empresa_id"/);
});
test("responsável já vinculado no Firebase vê empresa sem repetir CNPJ",()=>{
 const formulario=ler("src/pages/CompanyRegistration.tsx");
 const onboarding=ler("src/pages/CompanyOnboardingPage.tsx");
 assert.match(formulario,/if\(empresaId && \(role==="dono_empresa"/);
 assert.match(formulario,/Abrir painel da minha empresa/);
 assert.match(formulario,/onSnapshot\(doc\(db,"solicitacoes_cadastro_empresas",user\.uid\)/);
 assert.match(formulario,/await setDoc\(doc\(db,"solicitacoes_cadastro_empresas",user\.uid\)/);
 assert.match(formulario,/status==="aprovada"/);
 assert.match(formulario,/refreshClaims\(\)/);
 assert.match(onboarding,/jaVinculada/);
 assert.match(onboarding,/Empresa vinculada/);
});
test("painel só mostra dados depois de leitura autorizada da empresa no Firestore",()=>{
 const site=ler("src/pages/SiteOperacionalPage.tsx");
 assert.match(site,/onSnapshot\(doc\(db,"empresas",empresaId\)/);
 assert.match(site,/snap\.exists\(\)/);
 assert.match(site,/d\?\.status!=="ativa"/);
 assert.match(site,/const destinosAutorizados=!!empresaId&&empresaDisponivel&&acessoEmpresa&&ambienteOperacional/);
 assert.match(site,/setNomeEmpresa/);
 assert.match(site,/onSnapshot\(query\(caminho,limit\(50\)\)/);
 assert.doesNotMatch(site,/sessionStorage/);
});
test("servidor vincula dono e tenant somente após aprovação administrativa real",()=>{
 const backend=ler("functions/index.cjs");
 assert.match(backend,/tx\.create\(empresaRef/);
 assert.match(backend,/tx\.create\(funcionarioRef/);
 assert.match(backend,/await auth\.setCustomUserClaims\(uidSolicitante/);
 assert.match(backend,/autorizarAprovacaoEmpresa/);
 assert.match(backend,/admin_toaki/);
 assert.match(backend,/email_verified!==true/);
 const rules=ler("firestore.rules");
 assert.match(rules,/allow create: if proprietario\(uid\)/);
 assert.match(rules,/match \/empresas\/\{empresaId\}/);
 assert.match(rules,/allow write: if false/);
});
