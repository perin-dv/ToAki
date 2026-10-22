/** Proteção operacional contra conectar testes de terceiros ao Firebase original. */
export const PROJETO_FIREBASE_ORIGINAL="toaki-cf058";
export const projetoFirebaseWeb=String(import.meta.env.VITE_FIREBASE_PROJECT_ID || PROJETO_FIREBASE_ORIGINAL);
export const ambienteHomologacao=
  import.meta.env.VITE_TOAKI_ENV==="homologacao"
  && projetoFirebaseWeb!==PROJETO_FIREBASE_ORIGINAL
  && projetoFirebaseWeb.length>5
  && import.meta.env.VITE_FIREBASE_API_KEY?.length>12
  && import.meta.env.VITE_FIREBASE_APP_ID?.length>12;
export const compartilhandoFirebaseOriginal=!ambienteHomologacao;
export function exigirHomologacao():void{
  if(!ambienteHomologacao)throw new Error("Operação bloqueada: configure um Firebase de homologação separado antes de gravar dados de terceiros.");
}
