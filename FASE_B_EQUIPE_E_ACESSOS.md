# toAki — Empresa e equipe: acessos e responsabilidades

## Organizações do Firestore
- `empresas/{empresaId}/funcionarios/{uid}`: o **ID continua sendo o UID técnico de autenticação**, indispensável à segurança. A interface apresenta `titulo_registro`, `nome_exibicao`, e-mail, função traduzida e situação.
- `empresas/{empresaId}/convites_equipe/{conviteId}`: convites individuais. Apenas **hash SHA-256** do segredo é armazenado, válido por 24 horas e uso único. Não publicar segredos nem copiá-los no histórico.
- `empresas/{empresaId}/historico/{eventoId}`: auditoria legível de convites, entradas e desligamentos.

## Fluxo previsto para a empresa
1. Gestor ou responsável acessa Empresa e equipe.
2. Gera convite para e-mail específico, escolhendo Vendedor. Apenas o responsável pode convidar Gestor.
3. Envia link privado; destinatário entra ou cria conta e confirma o e-mail.
4. A conta aceita o convite; o servidor valida o e-mail, empresa autorizada, cargo, expiração, não reutilização e vínculos.
5. Firestore recebe um funcionário com título legível e Firebase Auth recebe o cargo assinado.
6. Gestor pode desativar vendedor; responsável pode desativar vendedor ou gestor. Ninguém desativa a própria conta ou o responsável.
7. O Firestore bloqueia dados de pessoas desativadas mesmo antes da atualização da sessão.

## Limitações e proteções
- Convites são enviados **manualmente** pela empresa; não existe envio automatizado de e-mail neste incremento.
- Não mudar automaticamente a função de membros existentes nem reativar contas desativadas; isso exige revisão administrativa.
- Nenhum dado real, credencial, claim ou funcionário é criado por PR. Testar primeiro somente no sandbox Soma.
- A coleção técnica e IDs de vínculo não são substituídos por nomes devido às regras e referências. A visualização e os títulos são humanos.
- Nenhuma Function, Hosting, regra Firestore ou aplicativo do motoboy é implantado automaticamente.
- O Preview já aprovado do mapa e do fluxo de NF permanece inalterado enquanto este PR é revisado.
