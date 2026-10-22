/** Proteção operacional: piloto no Firebase único exige ativação explícita.
 * A flag pública não substitui validação do backend. */
export const PROJETO_FIREBASE_ORIGINAL="toaki-cf058";
export const projetoFirebaseWeb=String(import.meta.env.VITE_FIREBASE_PROJECT_ID || PROJETO_FIREBASE_ORIGINAL);
export const ambienteHomologacao=
  import.meta.env.VITE_TOAKI_ENV==="homologacao"
  && projetoFirebaseWeb!==PROJETO_FIREBASE_ORIGINAL
  && projetoFirebaseWeb.length>5
  && import.meta.env.VITE_FIREBASE_API_KEY?.length>12
  && import.meta.env.VITE_FIREBASE_APP_ID?.length>12;
export const ambientePilotoOriginal=
  import.meta.env.VITE_TOAKI_ENV==="piloto"
  && projetoFirebaseWeb===PROJETO_FIREBASE_ORIGINAL
  && import.meta.env.VITE_TOAKI_PILOTO_NO_ORIGINAL==="habilitado";
export const ambienteOperacional=ambienteHomologacao||ambientePilotoOriginal;
export const compartilhandoFirebaseOriginal=projetoFirebaseWeb===PROJETO_FIREBASE_ORIGINAL;
export function exigirAmbienteOperacional():void{
  if(!ambienteOperacional)throw new Error("Operação bloqueada: falta habilitar um ambiente operacional autorizado para testes.");
}
