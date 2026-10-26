"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const load=(path)=>fs.readFileSync(path,"utf8");

test("rota do motoboy exige login e claim servidor role=entregador",()=>{
 const main=load("src/main.tsx"), guard=load("src/components/PrivateRoute.tsx");
 assert.match(main,/<Route path="\/motoboy" element=\{<PrivateRoute area="motoboy"><GpsMotoboyPage\/><\/PrivateRoute>\}/);
 assert.match(guard,/area==="motoboy"\?role==="entregador"/);
 assert.match(guard,/if \(!user\) return <Navigate to="\/login"/);
 assert.match(guard,/if \(!user.emailVerified/);
});
test("o GPS só inicia por botão explícito, em HTTPS, e termina ao fechar",()=>{
 const page=load("src/pages/GpsMotoboyPage.tsx");
 assert.match(page,/onClick=\{iniciar\}/);
 assert.match(page,/window.isSecureContext/);
 assert.match(page,/navigator.geolocation.watchPosition/);
 assert.match(page,/navigator.geolocation.clearWatch/);
 assert.match(page,/document.visibilityState==="hidden"/);
 assert.match(page,/document.addEventListener\("visibilitychange"/);
 assert.match(page,/role!=="entregador"/);
 assert.match(page,/enableHighAccuracy:true,maximumAge:0,timeout:20000/);
});
test("nenhuma coordenada é enviada sem vínculo de entrega e regras revisadas",()=>{
 const page=load("src/pages/GpsMotoboyPage.tsx");
 const lib=load("src/lib/gpsMotoboy.ts");
 assert.doesNotMatch(page,/setDoc\(|updateDoc\(|addDoc\(|fetch\(|httpsCallable|sendBeacon\(/);
 assert.doesNotMatch(lib,/setDoc\(|updateDoc\(|addDoc\(|fetch\(|httpsCallable|sendBeacon\(/);
 assert.match(page,/A posição não é gravada no Firestore/);
 assert.match(page,/Compartilhamento|envio automático/);
 assert.match(page,/Abrir posição no Google Maps/);
 assert.match(page,/rel="noopener noreferrer"/);
});
test("GPS rejeita coordenadas inválidas, imprecisas ou antigas",()=>{
 const src=load("src/lib/gpsMotoboy.ts");
 assert.match(src,/latitude < -90 \|\| latitude > 90/);
 assert.match(src,/longitude < -180 \|\| longitude > 180/);
 assert.match(src,/accuracy > PRECISAO_MAXIMA_METROS/);
 assert.match(src,/agora - horario > 60000/);
 assert.match(src,/PERMISSION_DENIED|erro.code===1/);
});
test("login direciona entregador para área segura sem mudar cadastro empresarial",()=>{
 const auth=load("src/pages/AuthPages.tsx");
 assert.match(auth,/token.claims.role==="entregador"\?"\/motoboy"/);
 assert.match(auth,/location.state\?\.from==="\/cadastro\/empresa\/dados"/);
});

test("teste local do GPS existe somente no modo e2e e não cria permissão no Firebase",()=>{
 const main=load("src/main.tsx"),auth=load("src/auth/AuthProvider.tsx");
 assert.match(main,/import.meta.env.MODE === "e2e" && <Route path="\/__e2e_motoboy"/);
 assert.match(main,/<ContaTesteMotoboyProvider><GpsMotoboyPage\/><\/ContaTesteMotoboyProvider>/);
 assert.match(auth,/export function ContaTesteMotoboyProvider/);
 assert.match(auth,/role:"entregador",empresaId:null,sandboxTester:false/);
 assert.match(auth,/uid:"e2e-motoboy-local"/);
 assert.doesNotMatch(auth.split("export function ContaTesteMotoboyProvider")[1].split("export function ContaTesteProvider")[0],/setCustomUserClaims|setDoc\(|updateDoc\(/);
});
