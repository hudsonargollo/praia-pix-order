# Guia de Implantação: Módulo Garçom e Otimização UX/UI

Este guia detalha as etapas necessárias para implantar as novas funcionalidades do Módulo Garçom e as melhorias de UX/UI no ambiente de produção usando Cloudflare Pages e Supabase.

## 1. Atualização do Repositório

As seguintes alterações foram feitas no código-fonte:

1.  **Estrutura do Banco de Dados (Supabase Migrations):**
    *   Adição da coluna `waiter_id` e `commission_amount` à tabela `public.orders`.
    *   Criação de uma função de gatilho (`calculate_waiter_commission`) para calcular automaticamente 10% de comissão no `commission_amount` quando um `waiter_id` estiver presente.
    *   Criação de RLS (Row Level Security) para permitir que garçons visualizem e insiram seus próprios pedidos.
    *   Criação da função RPC `get_waiter_users` para ser usada pelo Cloudflare Worker de administração.
2.  **Frontend (React/TypeScript):**
    *   **`src/pages/Auth.tsx`:** Lógica de redirecionamento atualizada para enviar usuários com `role: 'waiter'` para `/waiter-dashboard` e usuários com `role: 'admin'` para `/admin`.
    *   **`src/pages/Checkout.tsx`:** Lógica de criação de pedidos atualizada para atribuir o `waiter_id` e definir o status inicial como `pending` (em vez de `pending_payment`) para pedidos assistidos por garçom.
    *   **`src/pages/Admin.tsx`:** Adicionado link para o novo painel de gerenciamento de garçons.
    *   **`src/pages/AdminWaiters.tsx` (NOVO):** Componente para o Admin criar, visualizar e deletar contas de garçons.
    *   **`src/pages/WaiterDashboard.tsx` (NOVO):** Componente para o garçom visualizar suas vendas e comissões.
    *   **`src/App.tsx`:** Novas rotas adicionadas (`/admin`, `/admin/waiters`, `/waiter-dashboard`) e rotas de administração existentes (`/reports`, `/whatsapp-admin`, `/monitoring`, `/admin/products`) foram movidas para o `requiredRole="admin"`.
    *   **`src/index.css`:** Melhorias de UX/UI com a adição de transições suaves e consistência de estilo.
3.  **Backend (Cloudflare Workers):**
    *   **`functions/api/admin/create-waiter.js` (NOVO):** Worker para criar contas de garçons de forma segura usando a `SUPABASE_SERVICE_KEY`.
    *   **`functions/api/admin/delete-waiter.js` (NOVO):** Worker para deletar contas de garçons de forma segura.
    *   **`functions/api/admin/list-waiters.js` (NOVO):** Worker para listar contas de garçons usando a função RPC `get_waiter_users`.

## 2. Ações Necessárias no Supabase

**IMPORTANTE:** As migrações de banco de dados devem ser aplicadas manualmente ou via CLI do Supabase.

1.  **Aplicar Migrações SQL:**
    *   Conecte-se ao seu banco de dados Supabase.
    *   Execute o conteúdo dos seguintes arquivos SQL na ordem:
        *   `supabase/migrations/20251108150000_add_waiter_module_fields.sql`
        *   `supabase/migrations/20251108150001_create_waiter_rpc_function.sql`
    *   **Verificação:** Após a execução, a tabela `public.orders` deve ter as colunas `waiter_id` e `commission_amount`.

2.  **Configuração de Autenticação:**
    *   No painel do Supabase, vá para **Authentication > URL Configuration**.
    *   Certifique-se de que o **Site URL** esteja definido para o domínio do seu Cloudflare Pages (ex: `https://manus-ai.pages.dev`).

3.  **Configuração de CORS:**
    *   No painel do Supabase, vá para **API**.
    *   Adicione o domínio do seu Cloudflare Pages à lista de **CORS Configuration**.

## 3. Ações Necessárias no Cloudflare

1.  **Variáveis de Ambiente (Secrets):**
    *   No painel do Cloudflare, para o seu projeto Pages e Workers, defina as seguintes variáveis de ambiente (Secrets) para o ambiente de produção:
        *   `SUPABASE_URL`: O URL da sua API Supabase (o mesmo que `VITE_SUPABASE_URL`).
        *   `SUPABASE_SERVICE_ROLE_KEY`: A chave `service_role` do seu projeto Supabase (encontrada em **Settings > API**). **Esta chave é altamente sensível e deve ser mantida em segredo.**

2.  **Implantação (CI/CD):**
    *   Certifique-se de que o seu projeto Cloudflare Pages esteja conectado ao repositório Git e configurado para implantar automaticamente a partir do branch principal (ex: `main`).
    *   O `wrangler.toml` foi atualizado para garantir que o Cloudflare Pages reconheça a pasta `functions` para os Workers.
    *   Um `git push` para o branch principal deve acionar a implantação automática do frontend (Pages) e dos Workers (Functions).

## 4. Teste Pós-Implantação

1.  **Login de Garçom:** Tente fazer login com a conta de garçom de teste criada na migração (`waiter@cocoloko.com.br` / `waiter123`). Você deve ser redirecionado para `/waiter-dashboard`.
2.  **Criação de Pedido Assistido:** No `/menu`, crie um pedido. Ele deve ser finalizado sem ir para a página de pagamento e deve aparecer no `/waiter-dashboard` com o status `pending` e a comissão calculada.
3.  **Gerenciamento de Garçons (Admin):** Faça login como Admin e acesse `/admin/waiters`. Você deve conseguir ver a lista de garçons e criar um novo garçom.

---
**Próxima Etapa:** Após a confirmação de que o código está no repositório, o usuário deve aplicar as migrações SQL e configurar as variáveis de ambiente no Cloudflare para que o sistema funcione corretamente.
