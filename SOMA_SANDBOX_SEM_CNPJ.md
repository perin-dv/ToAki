# toAki — Sandbox fictício “Soma” sem CNPJ

## Finalidade

O responsável quer usar as contas Firebase Authentication já existentes para testar os vínculos de veículos, motoristas, clientes e NFs, sem depender de um CNPJ verdadeiro. **Nunca usar CNPJ de empresa de terceiros ou representar a Soma como empresa juridicamente cadastrada neste sandbox.**

O ID técnico de teste é `empresa_teste_soma` (não é um CNPJ). A interface apresenta aviso de dados fictícios; o registro só pode ter `tipo_registro: "empresa_teste"`, `modo_teste: true`, `cnpj: null`, `ambiente: "piloto"` e `status: "ativa"`.

## Segurança operacional

- `autorizarAprovacaoEmpresa` continua a aceitar **apenas `empresa_<CNPJ>`**, com habilitação da empresa real e sem autoaprovação.
- Para `empresa_teste_soma`, a operação exige simultaneamente `TOAKI_PILOTO_NO_ORIGINAL=habilitado`, `TOAKI_PILOTO_EMPRESAS=empresa_teste_soma`, projeto `toaki-cf058` e os marcadores de sandbox verificados no documento `empresas/empresa_teste_soma`.
- Cada operação continua a verificar usuário com e-mail confirmado, associação `empresas/empresa_teste_soma/funcionarios/{uid}` ativa e cargo permitido, com registro de histórico, transações e validações de referências. **O navegador não pode provisionar empresa, conceder claims ou se tornar gestor sozinho.**
- Firestore Rules atuais permanecem com escrita empresarial pelo navegador negada.
- Testes exigem dados fictícios: não importar notas fiscais, CPFs, endereços residenciais ou dados de clientes reais.
- O ID de teste não é aceito como CNPJ na BrasilAPI e não deve preencher `cnpjs_reservados`.

## Provisionamento manual e reversível

O workflow `.github/workflows/firebase-soma-sandbox.yml` deve ser revisado e incorporado na `main` **sem execução automática**.

Tem dois modos:
1. **verificar**: lê unicamente conta do Firebase Authentication e existência do tenant e vínculo no Firestore, não escreve nada.
2. **provisionar**: exige escolha explícita da operação e texto `PROVISIONAR_SOMA_TESTE`; após conferir projeto, conta existente, e-mail confirmado, cargos prévios, proprietário e dados sem CNPJ, cria apenas a empresa fictícia e a associação ao primeiro usuário em transação; em seguida emite `role: dono_empresa, empresa_id: empresa_teste_soma` no Firebase Authentication. Se uma permissão não estiver disponível, falha sem tentar alterar IAM.

A conta indicada pelo responsável não aparece no código público. O workflow exige configurá-la uma única vez em **GitHub → Settings → Secrets and variables → Actions**, como secret `TOAKI_EMAIL_PROPRIETARIO_SOMA`. Não enviar senha, token nem UID em comentários ou logs.

**Segunda conta:** a identidade ainda é desconhecida. Não adicionar qualquer conta arbitrária. Identificar e confirmar a segunda conta por mecanismo administrativo autorizado antes de vincular um funcionário; não presumir automaticamente que seja a segunda ou última conta da lista.

## Dependências de ativação

- Execução anterior [39852772280](https://github.com/perin-dv/ToAki/actions/runs/39852772280): acesso aos metadados do Firestore `ok`; consulta às Cloud Functions `403 sem_permissao`. Isto não prova que as Functions estão ausentes ou impossibilitadas de deploy.
- Preview [39855708742](https://github.com/perin-dv/ToAki/actions/runs/39855708742) publicado em `fase-b-web`, somente interface de testes. Não alterou Rules, Functions ou Auth Claims.
- **Nada do sandbox foi provisionado nem as Functions publicadas** enquanto não houver execução manual autenticada e aprovação explícita do backend. Merge do código não é deploy.
- Antes de ativar CRUD via Cloud Functions no projeto original, confirmar IAM, backup, custo e configurar allowlist exclusiva do sandbox no runtime das Functions. A publicação do backend deve ser revisada isoladamente e não deve alterar Hosting live.
- Caso a credencial GitHub usada para Hosting não consiga consultar Firebase Auth (`getUserByEmail`) ou não tenha Firestore write, registrar o erro e revisar permissões no Console; jamais pedir chave JSON no chat.

## Próximo teste de aceite

Autenticar com a conta existente, atualizar claims no painel, conferir aviso **Soma — Ambiente de Testes**, cadastrar placa fictícia, motorista fictício, cliente fictício e NF fictícia, recarregar e relogar, confirmar persistência, negar escrita direta no navegador e verificar isolamento de outros usuários.
