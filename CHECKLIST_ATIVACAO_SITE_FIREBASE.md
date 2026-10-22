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
