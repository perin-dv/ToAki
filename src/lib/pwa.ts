type InstallPromptEvent=Event&{
  prompt:()=>Promise<void>;
  userChoice:Promise<{outcome:"accepted"|"dismissed";platform:string}>;
};
let disponivel:InstallPromptEvent|null=null;
type Listener=(ev:InstallPromptEvent|null)=>void;
const listeners=new Set<Listener>();
function anunciar(){for(const cb of listeners)cb(disponivel);}
export function registrarPwa(){
  if(typeof window==="undefined"||import.meta.env.MODE==="e2e")return;
  window.addEventListener("beforeinstallprompt",(e:Event)=>{
    e.preventDefault();disponivel=e as InstallPromptEvent;anunciar();
  });
  window.addEventListener("appinstalled",()=>{disponivel=null;anunciar();});
  if("serviceWorker" in navigator){
    window.addEventListener("load",()=>{
      navigator.serviceWorker.register("/sw.js",{scope:"/"}).catch(()=>{
        // Browser pode bloquear PWA no modo privado. O site web segue funcionando.
      });
    },{once:true});
  }
}
export function ouvirInstalacao(cb:Listener){
  listeners.add(cb);cb(disponivel);
  return ()=>{listeners.delete(cb);};
}
export async function instalarPwa():Promise<"accepted"|"dismissed"|"unavailable">{
  const evento=disponivel;
  if(!evento)return "unavailable";
  disponivel=null;anunciar();
  try{await evento.prompt();return (await evento.userChoice).outcome;}
  catch{return "unavailable";}
}
export function estaInstalado():boolean {
  if(typeof window==="undefined")return false;
  return window.matchMedia?.("(display-mode: standalone)").matches
    || Boolean((navigator as Navigator & {standalone?:boolean}).standalone);
}
