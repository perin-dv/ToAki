import type { ReactNode } from "react";

export type MenuIconName =
  | "inicio" | "entregas" | "entregadores" | "clientes"
  | "comprovantes" | "historico" | "empresa" | "assinatura" | "menu";

const icons: Record<MenuIconName, ReactNode> = {
  inicio: <><path d="m3 10 9-7 9 7"/><path d="M5 9.5V21h14V9.5"/><path d="M9 21v-7h6v7"/></>,
  entregas: <><path d="M8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8l-5-5H8Z"/><path d="M15 3v6h6"/><path d="M7 13h10M7 17h7"/></>,
  entregadores: <><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><path d="M15 6h3l2 3"/><path d="m6 17.5 4-8h4l4.5 8"/><path d="M10 9.5 7 6.5h3"/></>,
  clientes: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
  comprovantes: <><rect x="5" y="4" width="14" height="18" rx="2"/><rect x="9" y="2" width="6" height="4" rx="1"/><path d="m9 15 2 2 4-4"/></>,
  historico: <><path d="M3 3v5h5"/><path d="M3.7 12a8.5 8.5 0 1 1 2 5.6"/><path d="M12 7.5v5l3 2"/></>,
  empresa: <><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 21v-5h8v5M7 8h2M15 8h2M7 12h2M15 12h2"/></>,
  assinatura: <><rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20M6 15h5"/></>,
  menu: <><path d="M4 6h16M4 12h16M4 18h16"/></>
};

export default function MenuIcon({name,size=19}:{name:MenuIconName;size?:number}) {
  return <svg
    aria-hidden="true"
    focusable="false"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >{icons[name]}</svg>;
}
