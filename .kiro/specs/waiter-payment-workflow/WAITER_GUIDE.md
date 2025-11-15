# Guia do Garçom - Fluxo de Pagamento

## Visão Geral

Este guia explica como usar o sistema de pagamento para garçons, incluindo criação de pedidos, geração de PIX, adição de itens e acompanhamento de pagamentos.

## Índice

1. [Criando um Pedido](#criando-um-pedido)
2. [Gerando PIX para Pagamento](#gerando-pix-para-pagamento)
3. [Adicionando Itens a Pedidos Existentes](#adicionando-itens-a-pedidos-existentes)
4. [Entendendo os Status de Pagamento](#entendendo-os-status-de-pagamento)
5. [Acompanhando Comissões](#acompanhando-comissões)
6. [Filtrando Pedidos](#filtrando-pedidos)
7. [Perguntas Frequentes](#perguntas-frequentes)

---

## Criando um Pedido

### Passo a Passo

1. **Acesse o Dashboard do Garçom**
   - Faça login com suas credenciais de garçom
   - Você será direcionado automaticamente para o dashboard

2. **Inicie um Novo Pedido**
   - Clique no botão "Novo Pedido" ou acesse o menu
   - Selecione os produtos desejados
   - Adicione quantidades e observações se necessário

3. **Finalize o Pedido**
   - Revise os itens selecionados
   - Confirme o pedido
   - O pedido será criado com:
     - **Status do Pedido**: "Em Preparo" (vai direto para a cozinha)
     - **Status de Pagamento**: "Aguardando Pagamento" (laranja)

### O Que Acontece Depois

- ✅ O pedido aparece **imediatamente na cozinha** para preparo
- ✅ O pedido aparece no seu dashboard com status "Aguardando Pagamento"
- ✅ Você pode gerar o PIX quando o cliente estiver pronto para pagar
- ✅ Você pode adicionar mais itens enquanto o pedido está em preparo

### Diferença dos Pedidos de Clientes

| Aspecto | Pedido do Garçom | Pedido do Cliente |
|---------|------------------|-------------------|
| Status Inicial | Em Preparo | Aguardando Pagamento |
| Vai para Cozinha | Imediatamente | Após pagamento |
| Geração de PIX | Manual (quando necessário) | Automática |
| Adicionar Itens | Sim, enquanto em preparo | Não |

---

## Gerando PIX para Pagamento

### Quando Gerar PIX

- Quando o cliente estiver pronto para pagar
- Após adicionar todos os itens desejados
- Antes de finalizar o atendimento

### Passo a Passo

1. **Localize o Pedido**
   - No seu dashboard, encontre o pedido com status "Aguardando Pagamento"
   - O pedido terá um badge laranja indicando pagamento pendente

2. **Clique em "Gerar PIX"**
   - Botão localizado no card do pedido
   - Disponível apenas para pedidos com pagamento pendente

3. **Aguarde a Geração**
   - O sistema cria o QR Code do PIX
   - Conecta-se ao MercadoPago
   - Gera o código com o valor total do pedido

4. **Mostre o QR Code ao Cliente**
   - QR Code aparece na tela
   - Cliente pode escanear com o app do banco
   - Código tem validade de 30 minutos

5. **Opções Disponíveis**
   - **Copiar Código PIX**: Copia o código para compartilhar
   - **Baixar QR Code**: Salva a imagem do QR Code
   - **Fechar**: Fecha o modal (QR Code fica salvo no pedido)

### Informações Exibidas

- ✅ Valor total do pedido
- ✅ QR Code para escaneamento
- ✅ Código PIX copiável
- ✅ Tempo de expiração (contagem regressiva)
- ✅ Instruções para o cliente

### O Que Acontece Após o Pagamento

1. **Confirmação Automática**
   - MercadoPago confirma o pagamento
   - Sistema atualiza automaticamente o status
   - Você vê a mudança em tempo real

2. **Status Atualizado**
   - Badge muda de laranja para azul
   - Texto muda para "Pagamento Confirmado"
   - Comissão é calculada automaticamente

3. **Notificações**
   - Cliente recebe confirmação por WhatsApp (se configurado)
   - Pedido continua o fluxo normal (preparo → pronto → completo)

### Problemas Comuns

**PIX não gerou?**
- Verifique sua conexão com a internet
- Tente novamente em alguns segundos
- Se persistir, contate o administrador

**Cliente não consegue pagar?**
- Verifique se o QR Code está visível
- Confirme se o app do banco está atualizado
- Ofereça copiar o código PIX manualmente

**PIX expirou?**
- Gere um novo PIX clicando novamente em "Gerar PIX"
- O código anterior será invalidado automaticamente

---

## Adicionando Itens a Pedidos Existentes

### Quando Adicionar Itens

- Cliente pede algo adicional durante o atendimento
- Esqueceu de incluir um item no pedido original
- Quer adicionar sobremesa ou bebida

### Requisitos

✅ Pedido deve estar com status "Em Preparo"
✅ Pagamento deve estar "Aguardando Pagamento"
✅ Você deve ser o garçom responsável pelo pedido

### Passo a Passo

1. **Localize o Pedido**
   - Encontre o pedido no seu dashboard
   - Verifique se está "Em Preparo"

2. **Clique em "Adicionar Item"**
   - Botão disponível no card do pedido
   - Abre o modal de seleção de produtos

3. **Selecione os Produtos**
   - Navegue pelo menu ou use a busca
   - Clique nos produtos desejados
   - Ajuste as quantidades
   - Adicione observações se necessário

4. **Revise o Novo Total**
   - Modal mostra o total atual
   - Mostra os itens que serão adicionados
   - Calcula o novo total automaticamente

5. **Confirme a Adição**
   - Clique em "Adicionar Itens"
   - Sistema atualiza o pedido
   - Novos itens vão para a cozinha

### ⚠️ Importante: PIX Será Invalidado

Se você já gerou o PIX e adicionar itens:

1. **PIX Anterior é Cancelado**
   - O QR Code anterior não funciona mais
   - Valor mudou, então precisa de novo PIX

2. **Aviso Aparece**
   - Sistema avisa antes de confirmar
   - Você precisa confirmar a ação

3. **Gere Novo PIX**
   - Após adicionar itens, clique em "Gerar PIX" novamente
   - Novo QR Code com valor atualizado
   - Mostre o novo código ao cliente

### Exemplo Prático

```
Pedido Original:
- 2x Açaí 500ml: R$ 30,00
- 1x Água: R$ 3,00
Total: R$ 33,00

Cliente pede mais:
- 1x Açaí 300ml: R$ 12,00

Novo Total: R$ 45,00
→ Precisa gerar novo PIX com R$ 45,00
```

### O Que Acontece na Cozinha

- ✅ Novos itens aparecem no pedido existente
- ✅ Cozinha vê quais itens foram adicionados
- ✅ Atualização em tempo real
- ✅ Pedido mantém o mesmo número

---

## Entendendo os Status de Pagamento

### Status Disponíveis

#### 🟠 Aguardando Pagamento (Pending)

**Aparência:**
- Badge laranja com texto escuro
- Texto: "Aguardando Pagamento"

**Significado:**
- Cliente ainda não pagou
- PIX pode ou não ter sido gerado
- Comissão ainda não confirmada

**Ações Disponíveis:**
- ✅ Gerar PIX
- ✅ Adicionar itens
- ✅ Acompanhar preparo

**Comissão:**
- Aparece como "Pendente"
- Não conta no total confirmado
- Será confirmada após pagamento

#### 🔵 Pagamento Confirmado (Confirmed)

**Aparência:**
- Badge azul
- Texto: "Pagamento Confirmado"

**Significado:**
- Cliente pagou com sucesso
- Pagamento processado pelo MercadoPago
- Comissão confirmada

**Ações Disponíveis:**
- ❌ Não pode gerar novo PIX
- ❌ Não pode adicionar itens
- ✅ Acompanhar preparo e entrega

**Comissão:**
- Aparece como "Confirmada"
- Conta no total de comissões do dia
- Valor garantido

#### 🔴 Pagamento Falhou (Failed)

**Aparência:**
- Badge vermelho
- Texto: "Pagamento Falhou"

**Significado:**
- Tentativa de pagamento não foi bem-sucedida
- Pode ter sido cancelada pelo cliente
- Precisa tentar novamente

**Ações Disponíveis:**
- ✅ Gerar novo PIX
- ⚠️ Verificar com cliente
- ⚠️ Contatar administrador se persistir

### Visualização Dupla de Status

Cada pedido mostra **dois status independentes**:

```
┌─────────────────────────────────┐
│  Pedido #1234                   │
│                                 │
│  Status do Pedido: Em Preparo   │  ← Onde está na produção
│  Status de Pagamento: Pendente  │  ← Situação do pagamento
│                                 │
│  [Gerar PIX] [Adicionar Item]   │
└─────────────────────────────────┘
```

**Por que dois status?**
- Pedido pode estar pronto mas não pago
- Pedido pode estar pago mas ainda em preparo
- Permite flexibilidade no atendimento

---

## Acompanhando Comissões

### Tipos de Comissão

#### Comissão Pendente

- Pedidos com pagamento "Aguardando Pagamento"
- Valor estimado, não garantido
- Pode mudar se itens forem adicionados
- Não conta no total do dia

#### Comissão Confirmada

- Pedidos com pagamento "Confirmado"
- Valor garantido e final
- Conta no total do dia
- Será paga no fechamento

### Visualização no Dashboard

```
┌─────────────────────────────────┐
│  Comissões de Hoje              │
│                                 │
│  💰 Confirmada: R$ 45,00        │  ← Garantida
│  ⏳ Pendente: R$ 12,00          │  ← Aguardando pagamento
│                                 │
│  Total Potencial: R$ 57,00      │
└─────────────────────────────────┘
```

### Como Aumentar Comissões Confirmadas

1. **Gere PIX Rapidamente**
   - Quanto antes o cliente pagar, antes confirma
   - Não deixe pedidos sem PIX gerado

2. **Acompanhe Pagamentos**
   - Verifique se cliente pagou
   - Ajude se tiver dificuldade

3. **Finalize Pedidos**
   - Marque como completo após entrega
   - Mantém o fluxo organizado

### Filtros de Data

- **Hoje**: Comissões do dia atual
- **Ontem**: Comissões do dia anterior
- **Esta Semana**: Últimos 7 dias
- **Este Mês**: Mês atual
- **Personalizado**: Escolha o período

---

## Filtrando Pedidos

### Filtros Disponíveis

#### Por Status de Pagamento

**Todos os Pedidos**
- Mostra todos os pedidos
- Útil para visão geral

**Aguardando Pagamento**
- Apenas pedidos não pagos
- Útil para follow-up de pagamentos
- Identifica quem precisa gerar PIX

**Pagamento Confirmado**
- Apenas pedidos pagos
- Útil para conferir comissões
- Verifica pedidos finalizados

#### Por Status do Pedido

- **Em Preparo**: Na cozinha
- **Pronto**: Aguardando entrega
- **Completo**: Já entregue

### Como Usar os Filtros

1. **Selecione o Filtro**
   - Dropdown no topo do dashboard
   - Escolha o status desejado

2. **Visualize os Resultados**
   - Lista atualiza automaticamente
   - Contador mostra quantidade

3. **Combine Filtros**
   - Use filtro de data + status
   - Refine sua busca

### Casos de Uso

**Início do Turno:**
```
Filtro: Aguardando Pagamento
→ Veja quais pedidos precisam de PIX
→ Priorize geração de pagamentos
```

**Durante o Turno:**
```
Filtro: Em Preparo
→ Acompanhe pedidos ativos
→ Adicione itens se necessário
```

**Fim do Turno:**
```
Filtro: Pagamento Confirmado
→ Confira comissões do dia
→ Verifique pedidos completos
```

---

## Perguntas Frequentes

### Sobre Criação de Pedidos

**P: Posso criar pedido sem gerar PIX imediatamente?**
R: Sim! Pedidos de garçom vão direto para preparo. Gere o PIX quando o cliente estiver pronto para pagar.

**P: O pedido vai para a cozinha antes do pagamento?**
R: Sim, pedidos de garçom vão imediatamente para a cozinha, independente do pagamento.

**P: Posso criar pedido para outra mesa?**
R: Sim, você pode criar quantos pedidos precisar. Cada um terá seu próprio número e controle.

### Sobre PIX

**P: Quanto tempo o PIX fica válido?**
R: 30 minutos. Após isso, precisa gerar um novo.

**P: Posso gerar PIX mais de uma vez?**
R: Sim, se o PIX expirar ou se adicionar itens, pode gerar novamente.

**P: O que fazer se o PIX não gerar?**
R: Verifique a conexão e tente novamente. Se persistir, contate o administrador.

**P: Cliente pode pagar depois de levar o pedido?**
R: Tecnicamente sim, mas recomenda-se receber o pagamento antes da entrega.

### Sobre Adicionar Itens

**P: Posso adicionar itens após gerar o PIX?**
R: Sim, mas o PIX anterior será cancelado e você precisará gerar um novo com o valor atualizado.

**P: Posso adicionar itens após o pagamento?**
R: Não. Após o pagamento ser confirmado, não é possível adicionar itens.

**P: Posso remover itens do pedido?**
R: Não diretamente. Contate o administrador ou caixa para ajustes.

### Sobre Comissões

**P: Quando minha comissão é confirmada?**
R: Assim que o pagamento for confirmado pelo MercadoPago.

**P: Comissão pendente conta no total?**
R: Não. Apenas comissões confirmadas contam no total do dia.

**P: Como sei quanto vou receber?**
R: Veja o valor "Confirmada" no dashboard. Esse é o valor garantido.

**P: Comissão é calculada sobre o total do pedido?**
R: Sim, sobre o valor total incluindo todos os itens.

### Sobre Status

**P: O que significa "Em Preparo"?**
R: Pedido está sendo preparado na cozinha.

**P: Diferença entre status do pedido e status de pagamento?**
R: Status do pedido mostra onde está na produção. Status de pagamento mostra se foi pago.

**P: Posso mudar o status manualmente?**
R: Não. Status muda automaticamente conforme o fluxo (cozinha marca pronto, etc).

### Problemas Comuns

**P: Pedido não aparece no dashboard?**
R: Verifique os filtros. Pode estar filtrado por status diferente.

**P: Não consigo adicionar itens?**
R: Verifique se o pedido está "Em Preparo" e se o pagamento está "Pendente".

**P: Cliente diz que pagou mas status não mudou?**
R: Aguarde alguns segundos para atualização. Se não mudar, verifique com o caixa.

**P: Comissão está errada?**
R: Verifique se todos os pagamentos foram confirmados. Comissões pendentes não contam.

---

## Dicas de Boas Práticas

### Para Melhor Atendimento

1. ✅ **Confirme o pedido com o cliente** antes de finalizar
2. ✅ **Gere o PIX assim que possível** para agilizar o pagamento
3. ✅ **Mostre o QR Code claramente** para o cliente
4. ✅ **Aguarde a confirmação** antes de entregar (se possível)
5. ✅ **Verifique o status** regularmente no dashboard

### Para Maximizar Comissões

1. ✅ **Sugira itens adicionais** (sobremesas, bebidas)
2. ✅ **Adicione itens antes de gerar PIX** para evitar retrabalho
3. ✅ **Acompanhe pagamentos pendentes** e faça follow-up
4. ✅ **Finalize pedidos completos** para manter organização
5. ✅ **Use filtros** para identificar oportunidades

### Para Evitar Problemas

1. ❌ **Não adicione itens após gerar PIX** (se possível)
2. ❌ **Não deixe pedidos sem PIX por muito tempo**
3. ❌ **Não confie apenas na comissão pendente**
4. ❌ **Não ignore pedidos com pagamento falho**
5. ❌ **Não esqueça de verificar a conexão**

---

## Suporte

### Precisa de Ajuda?

- **Problemas técnicos**: Contate o administrador
- **Dúvidas sobre pedidos**: Fale com o caixa
- **Questões de pagamento**: Verifique com o gerente

### Atualizações

Este guia é atualizado regularmente. Verifique a data da última atualização e consulte a versão mais recente quando necessário.

**Última atualização**: Novembro 2024
**Versão**: 1.0
