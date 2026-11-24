"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
test("arquivos de foto e assinatura são isolados, imutáveis e sem listagem pública",()=>{
 const code=fs.readFileSync("storage.rules","utf8");
 const config=JSON.parse(fs.readFileSync("firebase.json","utf8"));
 assert.equal(config.storage.rules,"storage.rules");
 assert.match(code,/comprovantes\/\{empresaId\}\/\{pedidoId\}\/\{uid\}/);
 assert.match(code,/nome in \['foto.jpg','assinatura.png'\]/);
 assert.match(code,/pedidoValido\(empresaId,pedidoId,uid\)/);
 assert.match(code,/request.auth.uid == entregadorUid/);
 assert.match(code,/request.resource.contentType/);
 assert.match(code,/allow list, update, delete: if false/);
 assert.match(code,/match \/\{allPaths=\*\*\} \{allow read, write: if false;\}/);
});
test("Flutter não coleta GPS antes de botão e nenhum release usa credenciais de servidor",()=>{
 const main=fs.readFileSync("apps/entregador/lib/main.dart","utf8");
 const gps=fs.readFileSync("apps/entregador/lib/data/tracking_service.dart","utf8");
 const app=fs.readFileSync("apps/entregador/lib/screens/delivery_screen.dart","utf8");
 const gradle=fs.readFileSync(".github/workflows/flutter-entregador.yml","utf8");
 assert.match(gps,/LocationPermission.denied/);
 assert.match(gps,/foregroundNotificationConfig/);
 assert.match(gps,/await _subscription\?\.cancel\(\)/);
 assert.match(app,/if\(demo\)PolylineLayer/);
 assert.match(main,/TOAKI_DEMO/);
 assert.match(gradle,/flutter build apk --debug/);
 assert.doesNotMatch(main,/serviceAccount|private_key/);
});
