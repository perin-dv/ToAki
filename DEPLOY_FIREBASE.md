# Publicar o front-end do toAki no Firebase Hosting

**Projeto:** `toaki-cf058` (separado do TemNaLoja). A autenticação e o banco ainda não fazem parte deste protótipo.

## Pré-requisitos
- Node.js instalado.
- Firebase CLI instalada com `npm.cmd install -g firebase-tools`.
- Permissão de acesso ao projeto Firebase `toaki-cf058`.

## Primeira publicação no Windows PowerShell

```powershell
git clone https://github.com/perin-dv/ToAki.git
cd ToAki
npm.cmd install
npm.cmd run build
firebase login
firebase projects:list
firebase deploy --only hosting --project toaki-cf058
```

Se `firebase` não for reconhecido, feche e reabra o terminal depois de instalar `firebase-tools`, ou execute `npx.cmd firebase-tools login` e `npx.cmd firebase-tools deploy --only hosting --project toaki-cf058`.

> Confirme que `firebase projects:list` mostra `toaki-cf058`. O comando de deploy usa `--project toaki-cf058` de propósito para não publicar acidentalmente no Firebase do TemNaLoja.

Ao concluir, o Firebase CLI informa os endereços de publicação, normalmente `https://toaki-cf058.web.app` e `https://toaki-cf058.firebaseapp.com`.

## Atualizações
```powershell
git pull
npm.cmd install
npm.cmd run build
firebase deploy --only hosting --project toaki-cf058
```

## Notas
- O build Vite mantém o atual protótipo HTML/CSS/JS, sem React ainda. Migração para React/TypeScript fica para após a aprovação do visual.
- Dados, mapa e entrega são fictícios; não usar para operações reais.
- Não há Firebase Authentication nem Firestore integrados; registrar um aplicativo web no Firebase não ativa login por si só.
- `firebase.json` publica somente a pasta `dist`, gerada por `npm.cmd run build`.
- A logo desenhada em CSS é provisória; trocar pelo arquivo oficial aprovado quando o componente visual for refinado.
