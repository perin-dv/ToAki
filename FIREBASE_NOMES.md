# Padrão obrigatório: identificação humana no Firebase

O toAki terá muitos registros de clientes, empresas, motoristas, NFs e contratos. **Não usamos códigos aleatórios como rótulos na interface de administração.**

## Convenções de nomenclatura
- Coleções e campos de dados: **português, snake_case**, descrição autoexplicativa.
- Cada documento cadastral tem `tipo_registro`, `titulo_registro`, `nome_exibicao` ou `razao_social` conforme o tipo, `status` e datas identificáveis.
- Interfaces mostram **"Empresa — Soma Distribuidora"**, **"Cliente — Oficina do João"**, **"Contrato — Plano Básico — Soma"**.
- O ID técnico (UID do Firebase Auth, chave composta ou ID imutável) existe **internamente** para unicidade, associações e regras de segurança, mas NÃO substitui o nome/título mostrado ao usuário.
- NÃO usar nome de pessoa como ID único: nomes se repetem e podem mudar. NÃO usar apenas número da NF como chave global: números podem repetir entre empresas, séries e filiais.
- NUNCA confiar na organização visual das pastas para isolamento: Firestore Security Rules e serviços de backend precisam validar propriedade, empresa, filial, papel e vínculo da entrega.

## Primeira coleção do MVP (somente se o Firestore for habilitado)
```text
solicitacoes_cadastro_empresas/
  {uid_interno_do_responsavel}/
    tipo_registro: "solicitacao_cadastro_empresa"
    titulo_registro: "Solicitação de cadastro — Soma Distribuidora"
    razao_social: "SOMA ..."
    nome_fantasia: "Soma"
    cnpj: "12345678000100"
    nome_responsavel: "Nome do responsável"
    email_responsavel: "responsavel@exemplo.com"
    telefone_contato: "..."
    status: "aguardando_analise"
    criado_em: "2026-..."
```

O Firebase guarda o documento por UID técnico para que somente o proprietário autenticado crie ou leia a própria solicitação. A informação vista na tela de suporte e administração será o `titulo_registro` legível, com CNPJ e responsável identificados.

O navegador não pode aprovar a solicitação nem atribuir `dono_empresa` ou `admin_toaki`. Isso exigirá rotina administrativa segura no backend. A regra atual nega acesso a todas as demais coleções, até serem implementadas e testadas.

## Estrutura futura legível no painel
- **Empresas:** nome fantasia, razão social, CNPJ, identificador estável
- **Filiais:** nome filial e cidade, vinculadas à empresa
- **Funcionários:** nome completo, função, empresa/filial
- **Clientes:** nome ou nome fantasia e contato autorizado
- **Pedidos/NFs:** número, série, cliente e empresa, com chave composta segura
- **Entregas:** título "Entrega NF 0045821 — Oficina Exemplo", status, motorista
- **Motoboys/veículos:** nome exibido, placa/código interno, filiais
- **Contratos:** título do plano, empresa, validade, status
- **Comprovantes:** número NF, entregador, destinatário e horário

## Exigências de segurança
1. Não ativar leitura aberta para facilitar testes.
2. Não usar `uid`, CNPJ, número NF ou nome como prova isolada de autorização.
3. Campos de permissão, status de aprovação e assinatura só podem ser alterados por backend autorizado.
4. Registrar auditoria e eventos relevantes antes de habilitar fluxos de produção.
5. Coleções aprovadas devem ter índices e regras testadas no Emulator Suite antes de uso real.
