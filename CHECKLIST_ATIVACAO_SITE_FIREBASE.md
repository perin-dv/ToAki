# toAki — Checkpoint antes de ligar o site à conta real

**Estado do código:** PR #9 em rascunho, sem merge e sem deploy confirmado. Projeto Firebase único: `toaki-cf058` (Blaze).

## O que o proprietário poderá fazer, quando solicitado
1. Abrir Firebase Console > **Firestore Database > Regras** e conferir as regras atualmente publicadas. O repositório pode conter regras diferentes; jamais sobrescrever sem comparar e registrar backup.
2. Abrir Firebase Console > **Firestore Database > Dados** e conferir se já existem empresas, solicitações, veículos, pedidos ou quaisquer coleções que não podem ser alteradas.
3. Conferir em **Authentication > Users** se a conta que será usada está cadastrada e com o e-mail verificado. Não compartilhar senha nem tokens.
4. Definir qual empresa aprovada será a primeira a testar, com CNPJ autorizado. A aprovação administrativa deve partir de um administrador confiável, não do próprio formulário.
5. Confirmar acesso administrativo e permissões do projeto, inclusive eventual necessidade de um operador `admin_toaki` (custom claim via Admin SDK; nunca por alteração direta no navegador).
6. Confirmar alertas e limites de custo no Blaze. Firestore e Functions podem gerar cobrança.

## Antes de deploy de backend
- Validar resultado de todos os testes do CI, inclusive Firestore Emulator e negativos interempresa.
- Revisar o conjunto **atual** de regras implantadas, não apenas o arquivo `firestore.rules`; fazer backup conforme volume/dados existentes.
- Revisar necessidade e permissões dos endpoints `analisarCadastroEmpresa`, `operarEmpresaHomologacao` e `alterarRegistroEmpresaPiloto`.
- Habilitar no backend, somente após aprovação, `TOAKI_PILOTO_NO_ORIGINAL=habilitado` e `TOAKI_PILOTO_EMPRESAS` com o identificador empresarial validado. Não aceitar flags do frontend como autorização.
- Implantar exclusivamente Rules/Functions autorizadas após revisão; não implantar Hosting `live`.
- Compilar Preview autorizado com `VITE_TOAKI_ENV=piloto` e `VITE_TOAKI_PILOTO_NO_ORIGINAL=habilitado`, mas **só** depois de proteger o backend. Hosting Preview não isola o banco de produção.

## Testes de aceite com a conta real
- Conta aprovada: cadastro de moto, motorista vinculado à moto, cliente e NF com busca, validação do endereço e persistência após novo login.
- Uma segunda aba autorizada vê os novos dados sem recarregar.
- Conta de outra empresa não enxerga ou edita dados da primeira.
- Placa duplicada, NF duplicada, vínculo com cadastro inativo/de outra empresa e tentativa de mudar NF diretamente pelo navegador são negados.
- Edição, desativação segura, mudança de status e histórico testados no Firestore real.
- Somente após aceite explícito, seguir para a publicação principal da interface.

**Pendente:** análise do Firebase real, aprovação de administrador/empresa piloto, autorização de deploy e teste ponta a ponta. Não declarar o site pronto antes disso.

## Conferência das regras Firestore atualmente exibidas no Console (22/10/2026)

O responsável copiou do console `toaki-cf058` o conteúdo atual da aba Firestore Database > Regras. Comparação feita com `firestore.rules` da branch `feature/fase-b-busca-vinculos-crud`. **Não publicar regras novamente só para alinhar textos.**

**Compatível com os cadastros e consultas principais:**
- `solicitacoes_cadastro_empresas/{uid}`: dono autenticado e com e-mail verificado pode criar apenas solicitação `aguardando_analise`; admin consulta; ninguém altera diretamente.
- `empresas/{empresaId}/funcionarios/{uid}`: autorização por associação ativa; somente gestor consulta lista; escrita pelo cliente negada.
- `empresas/{empresaId}/{clientes,entregadores_vinculados,veiculos,pedidos,comprovantes,historico}`: leitura segregada por empresa/cargo; escrita do navegador negada.
- `clientes/{uid}`, `entregadores/{uid}`, `planos`, `assinaturas`, `auditoria`: protegidos por identidade/papel e bloqueio de escrita direta.
- `/{document=**}`: default deny.

**Diferenças identificadas entre Console informado e GitHub:**
1. Na criação de solicitação, repositório exige `titulo_registro.size() > 10`; a regra atual do Console apenas exige `<= 200`. É pequena diferença de validação, não autorização extra para virar empresa ou admin. **Não bloquear o desenvolvimento por isso**, mas manter no plano de hardening.
2. `usuarios/{uid}`: Console usa `allow read: proprietario(uid)` (engloba `get` e `list` sob essa condição); repositório permite só `get` e nega explicitamente `list`. A forma do repositório é mais restritiva e preferível em futura revisão controlada.
3. `planos/{planoId}`: Console usa `allow read` e repo explicita `allow get, list`, com a mesma condição de acesso. Sem alteração prática relevante no contexto atual.
4. Comentários, extração de `funcionarioPath` e formatação variam; não há necessidade de publicar só por essas diferenças.

**Verificações ainda NÃO realizadas:** essas regras foram **informadas pelo responsável**, não obtidas por uma chamada administrativa autenticada à API do projeto; o conteúdo copiado não confirma se o Firestore já possui empresa aprovada, se Functions estão implantadas, se há `admin_toaki` ou se o Hosting apresenta o código novo. A execução do CI com Emulator cobre o arquivo do repositório, **não verifica as regras remotas**.

**Conclusão:** nenhuma substituição das regras existentes agora. Próxima conferência com o responsável: **Firestore Database > Dados**, para identificar nomes das coleções e empresas pré-existentes **sem editar nada**, seguida de estado da conta em Authentication > Users. Só depois planejar backup e implantação mínima segura de Functions e um Preview operacional, mediante autorização específica.
