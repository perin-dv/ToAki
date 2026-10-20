# toAki — Protótipo visual

Interface inicial do **toAki**, plataforma de rastreamento de entregas.

## Estado atual
- Design branco profissional, com identidade laranja, preto e branco.
- Layout responsivo para computador e celular.
- Mapa **ilustrativo**, sem GPS nem serviço externo.
- Dados de notas fiscais, motoboys e entregas **fictícios**.
- Navegação demonstrativa dos oito módulos do MVP.
- **Sem Firebase, login real, rastreamento, pagamentos ou dados armazenados.**

## Como visualizar
Abra `index.html` em um navegador ou hospede a pasta como site estático.

## Organização planejada do Firebase (não criada ainda)
As coleções e os documentos terão nomes semânticos. Exemplos:

```text
empresas/
  soma_distribuidora/
    funcionarios/
      vendedor_joao_silva/
    filiais/
      maringa_centro/
    entregadores/
      motoboy_joao_silva/
    veiculos/
      moto_03/
    entregas/
      entrega_nf_0045821/
    comprovantes/
      comprovante_nf_0045821/
    links_rastreamento/
      rastreamento_nf_0045821/
assinaturas/
  assinatura_soma_distribuidora/
planos/
  plano_inicial/
```

**Importante:** esses caminhos são **exemplos de organização**, não a estrutura definitiva do banco. Nomes de documentos legíveis não bastam para garantir unicidade: na implementação haverá IDs estáveis e regras de acesso por empresa, evitando colisões de pessoas/filiais com o mesmo nome e exposição de dados. Nunca usar números de CPF, tokens ou dados privados como IDs públicos. Os documentos deverão ter nomes descritivos e campos como `nome_exibicao`, `empresa_id` e `codigo_interno`. Rotas GPS de alta frequência serão avaliadas separadamente no Realtime Database.

## Próximas etapas
1. Aprovação do layout e das interações.
2. Separação do protótipo em componentes.
3. Firebase Authentication e isolamento por empresa.
4. Rastreamento real no app do entregador.
5. Comprovantes, relatórios, links e assinaturas.

A hospedagem comercial deverá respeitar as condições de uso do provedor. O plano Vercel Hobby é destinado a uso pessoal não comercial.
