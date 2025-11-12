# Guia de Correções - Coco Loko

## ✅ Correções Implementadas

### 1. Mobile Header UI/UX Melhorado
**Status:** ✅ Concluído

**Mudanças:**
- Adicionado logo do Coco Loko no topo do header mobile
- Header fixo com duas seções: logo + navegação de categorias
- Melhor espaçamento e visual mais profissional
- Scroll suave para categorias com offset correto

**Arquivos modificados:**
- `src/pages/Menu.tsx`

---

## 🔧 Correções Necessárias (Requerem Ação)

### 2. WhatsApp Não Conectado
**Status:** ⚠️ Requer configuração

**Problema:**
O sistema WhatsApp está implementado mas precisa de:
1. Dependências instaladas no Cloudflare Pages
2. Configuração do banco de dados para sessões
3. Primeira conexão e scan do QR code

**Solução:**

#### Passo 1: Instalar Dependências
No Cloudflare Pages, adicione as seguintes dependências:
```bash
npm install @whiskeysockets/baileys @hapi/boom
```

#### Passo 2: Criar Tabela de Sessões no Supabase
Execute este SQL no Supabase SQL Editor:

```sql
-- Tabela para armazenar sessões do WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_sessions (
  id TEXT PRIMARY KEY,
  session_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_updated 
ON whatsapp_sessions(updated_at DESC);

-- RLS (Row Level Security)
ALTER TABLE whatsapp_sessions ENABLE ROW LEVEL SECURITY;

-- Política para permitir acesso do service role
CREATE POLICY "Service role can manage sessions" 
ON whatsapp_sessions 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);
```

#### Passo 3: Conectar WhatsApp
1. Acesse a página `/whatsapp-admin`
2. Clique em "Conectar WhatsApp"
3. Escaneie o QR code com seu WhatsApp
4. Aguarde a confirmação de conexão

**Arquivos relacionados:**
- `functions/api/whatsapp/connection.js` - API de conexão
- `src/pages/WhatsAppAdmin.tsx` - Interface de administração

---

### 3. Não Consegue Adicionar Garçons
**Status:** ⚠️ Requer configuração de variáveis de ambiente

**Problema:**
As APIs de gerenciamento de garçons existem mas precisam das variáveis de ambiente configuradas no Cloudflare Pages.

**Solução:**

#### Configurar Variáveis de Ambiente no Cloudflare Pages

1. Acesse o dashboard do Cloudflare Pages
2. Vá em Settings → Environment Variables
3. Adicione as seguintes variáveis:

```
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_KEY=sua-service-role-key-aqui
```

**⚠️ IMPORTANTE:** Use a `service_role` key, não a `anon` key!

#### Como Encontrar as Chaves:
1. Acesse seu projeto no Supabase
2. Vá em Settings → API
3. Copie:
   - **Project URL** → `SUPABASE_URL`
   - **service_role key** (em "Project API keys") → `SUPABASE_SERVICE_KEY`

#### Após Configurar:
1. Faça um novo deploy ou force rebuild no Cloudflare Pages
2. Acesse `/admin-waiters`
3. Clique em "Adicionar Novo Garçom"
4. Preencha os dados e salve

**Arquivos relacionados:**
- `functions/api/admin/create-waiter.js` - Criar garçom
- `functions/api/admin/list-waiters.js` - Listar garçons
- `functions/api/admin/delete-waiter.js` - Deletar garçom
- `src/pages/AdminWaiters.tsx` - Interface de gerenciamento

---

### 4. Não Consegue Ver Produtos
**Status:** ❓ Precisa investigação

**Possíveis Causas:**
1. Não há produtos cadastrados no banco de dados
2. Produtos estão marcados como `available = false`
3. Problema de permissões RLS no Supabase

**Solução:**

#### Verificar se Há Produtos:
Execute no Supabase SQL Editor:

```sql
-- Ver todos os produtos
SELECT * FROM menu_items;

-- Ver produtos disponíveis
SELECT * FROM menu_items WHERE available = true;

-- Ver categorias
SELECT * FROM menu_categories ORDER BY display_order;
```

#### Se Não Houver Produtos, Adicionar Produtos de Teste:
```sql
-- Inserir categoria de teste
INSERT INTO menu_categories (name, display_order)
VALUES ('Açaí', 1)
ON CONFLICT DO NOTHING;

-- Inserir produto de teste
INSERT INTO menu_items (name, description, price, category_id, available)
SELECT 
  'Açaí 500ml',
  'Açaí tradicional com granola e banana',
  25.00,
  id,
  true
FROM menu_categories 
WHERE name = 'Açaí'
LIMIT 1;
```

#### Verificar Permissões RLS:
```sql
-- Ver políticas RLS da tabela menu_items
SELECT * FROM pg_policies WHERE tablename = 'menu_items';

-- Se necessário, criar política para leitura pública
CREATE POLICY "Anyone can view available menu items"
ON menu_items
FOR SELECT
USING (available = true);
```

#### Testar na Interface:
1. Acesse `/admin-products`
2. Clique em "Novo Produto"
3. Preencha os dados:
   - Nome
   - Categoria
   - Preço
   - Descrição (opcional)
   - Foto (opcional)
4. Marque "Produto disponível"
5. Salve

**Arquivos relacionados:**
- `src/pages/AdminProducts.tsx` - Gerenciamento de produtos
- `src/pages/Menu.tsx` - Visualização do cardápio

---

## 📋 Checklist de Verificação

### WhatsApp
- [ ] Dependências instaladas (`@whiskeysockets/baileys`, `@hapi/boom`)
- [ ] Tabela `whatsapp_sessions` criada no Supabase
- [ ] QR code escaneado e WhatsApp conectado
- [ ] Teste de envio de mensagem funcionando

### Garçons
- [ ] Variável `SUPABASE_URL` configurada no Cloudflare
- [ ] Variável `SUPABASE_SERVICE_KEY` configurada no Cloudflare
- [ ] Deploy realizado após configuração
- [ ] Teste de criação de garçom funcionando
- [ ] Lista de garçons carregando corretamente

### Produtos
- [ ] Pelo menos uma categoria existe no banco
- [ ] Pelo menos um produto existe no banco
- [ ] Produtos marcados como `available = true`
- [ ] Políticas RLS configuradas corretamente
- [ ] Produtos aparecem em `/menu`
- [ ] Produtos aparecem em `/admin-products`

### Mobile Header
- [ ] Logo aparece no topo (mobile)
- [ ] Navegação de categorias funciona
- [ ] Scroll suave para categorias
- [ ] Header fixo não sobrepõe conteúdo

---

## 🆘 Troubleshooting

### Erro: "Supabase environment variables not set"
**Solução:** Configure as variáveis de ambiente no Cloudflare Pages e faça rebuild.

### Erro: "WhatsApp not connected"
**Solução:** Acesse `/whatsapp-admin` e conecte o WhatsApp escaneando o QR code.

### Produtos não aparecem
**Solução:** Verifique se há produtos no banco com `available = true` e se as políticas RLS permitem leitura.

### Garçons não carregam
**Solução:** Verifique se a `service_role` key está correta e se o deploy foi feito após configurar as variáveis.

---

## 📞 Próximos Passos

1. **Configurar variáveis de ambiente** no Cloudflare Pages
2. **Criar tabela de sessões** do WhatsApp no Supabase
3. **Conectar WhatsApp** pela primeira vez
4. **Adicionar produtos** se não houver nenhum
5. **Testar criação de garçons**
6. **Verificar mobile header** em dispositivo real

---

## 🎯 Resultado Esperado

Após seguir este guia:
- ✅ Mobile header bonito e funcional
- ✅ WhatsApp conectado e enviando notificações
- ✅ Garçons podem ser criados e gerenciados
- ✅ Produtos aparecem no cardápio e podem ser editados
