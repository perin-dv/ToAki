"use strict";
/**
 * Exibe somente uma categoria pública para confirmar qual conta está no secret
 * FIREBASE_SERVICE_ACCOUNT_TOAKI_CF058. Não imprime e-mails desconhecidos,
 * tokens, private_key ou conteúdo da credencial em logs.
 */
const categorias=Object.freeze({
  "toaki-cf058@appspot.gserviceaccount.com":"app_engine_default",
  "591288979843-compute@developer.gserviceaccount.com":"compute_default",
  "firebase-adminsdk-fbsvc@toaki-cf058.iam.gserviceaccount.com":"firebase_adminsdk"
});
function identificarContaServico(email){
  return typeof email==="string" && Object.prototype.hasOwnProperty.call(categorias,email)
    ? categorias[email] : "outra_conta_nao_identificada";
}
module.exports={identificarContaServico};
