# toAki — Gestão e rastreamento de entregas

Sistema web/PWA para empresas, motoboys e clientes. Identidade visual aprovada: **painel profissional branco, lateral preta e destaques laranja**, com logo oficial. Stack atual: React + TypeScript + Vite, Firebase Authentication, Firestore e Cloud Functions.

## Estado do projeto (25/10/2026)

- **Fase A:** autenticação e interface React/PWA desenvolvidas, com Previews anteriores.
- **Fase B:** telas de empresa, veículos, motoristas, clientes, NFs e relatórios; código de integração Firebase preparado. A Soma fictícia já foi criada e vinculada pelo provisionamento confirmado. **A implantação das Functions e das regras operacionais ainda não foi concluída** por falta de permissão `iam.serviceAccounts.ActAs` na conta de execução `toaki-cf058@appspot.gserviceaccount.com`; não confundir código pronto com site publicado.
- **Fase C (branch de trabalho):** primeira tela GPS do motoboy com leitura **local** e consentida. **Não envia posições ao Firebase, não rastreia entregas em segundo plano e não está publicada**. Vínculo da conta do motoboy com uma entrega ainda precisa ser implementado com segurança.
- **Hospedagem:** Firebase Hosting. Não publicar no canal `live` durante testes.

## Como testar agora, no PC, sem GitHub Actions

Necessário: Node.js 22, Git e navegador. No PowerShell do Windows (use `npm.cmd` se `npm.ps1` estiver bloqueado):

```powershell
git clone --branch feature/fase-c-gps-motoboy-inicial https://github.com/perin-dv/ToAki.git
cd ToAki
npm.cmd install
npm.cmd run dev -- --mode e2e
```

Abra no **mesmo computador**: `http://localhost:5173/__e2e_motoboy`.

- Clique em **Ativar GPS neste aparelho** e permita a localização. Navegador e Windows devem estar com a permissão de localização habilitada.
- No computador, a localização pode ser aproximada (Wi-Fi/IP). Para testar o GPS físico do celular, será necessário posteriormente um Preview HTTPS ou um túnel HTTPS seguro.
- O endereço `/__e2e_motoboy` existe **exclusivamente no modo e2e local**; usa uma identidade de interface simulada para inspecionar o GPS **sem autenticar usuário real e sem criar permissões no Firebase**.
- Pare a leitura com **Desligar GPS**. Ao sair da tela, a localização é interrompida.
- Para conferir a interface demonstrativa: `http://localhost:5173/__e2e_demonstracao`. A tela `/inicio` real exige login Firebase e só habilita operações após as regras/Functions serem implantadas.
- Abra `http://localhost:5173/` para ver a página pública local.
- Para parar o servidor: `Ctrl+C` no PowerShell.

**Celular:** `localhost` do PC não abre no telefone. Além disso, a leitura GPS em navegador exige HTTPS ou localhost confiável. A maneira adequada de testar em um celular diferente é publicar **um Preview HTTPS aprovado**, ou configurar uma conexão de desenvolvimento HTTPS segura. Não desabilite a proteção do navegador para contornar o GPS.

## Testes de código no computador

```powershell
npm.cmd test
npm.cmd run build
```

O build normal (`npm run build`) não inclui a rota `/__e2e_motoboy`, que depende explicitamente de `import.meta.env.MODE === "e2e"`. **Não publicar builds em modo e2e em Hosting de produção ou Preview acessível externamente.**

## Estrutura e decisões que devem continuar preservadas

- `src/pages` — telas; `src/lib` — Firebase, CEP, regras de negócio da interface e GPS local.
- `functions` — operações privadas de criação/edição; não autorizar automaticamente empresas a partir de um CNPJ.
- `firestore.rules` — regras versionadas; as regras realmente publicadas no Firebase precisam de conferência e atualização mínima, preservando configurações existentes.
- `tests` — testes estruturais e de segurança; `.github/workflows` — CI e procedimentos manuais controlados.
- `PLANO_MVP.md` — plano mestre; `ROADMAP_SITE_OFICIAL.md` — sequência e pendências; `FIREBASE_NOMES.md` — nomes legíveis e IDs; `SEGURANCA_CADASTRO.md` e `SEGURANCA_E_ATUALIZACOES.md` — segurança.
- `SOMA_SANDBOX_SEM_CNPJ.md`, `FASE_B_ATIVACAO_FIREBASE_SOMA.md` e `CHECKLIST_ATIVACAO_SITE_FIREBASE.md` — decisões e limites de ativação no Firebase.
- `FASE_C_GPS_MOTOBOY.md` — implementação local do GPS e próximos requisitos (branch de desenvolvimento).

## Documentação histórica

Instruções de fases antigas e de deploy do protótipo HTML inicial foram retiradas da árvore atual para evitar informações conflitantes. O histórico dos documentos **continua recuperável nos commits do GitHub**, mesmo após a exclusão. Excluir Markdown reduz a poluição visual do repositório, não apaga automaticamente o espaço ocupado pelo histórico do Git.
