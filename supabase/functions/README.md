# Public checkout — Açougue Bom Jardim

A função `create-order` recebe pedidos do catálogo público e grava o pedido e seus itens no Supabase. Ela recalcula os preços usando o banco; não confia nos valores enviados pelo navegador.

## Publicação

1. No Supabase, abra **SQL Editor** e execute o conteúdo de `migrations/0002_public_catalog_and_images.sql`.
2. Instale a Supabase CLI em um computador com terminal e autentique-se:
   `supabase login`
3. Na pasta do projeto, vincule o projeto:
   `supabase link --project-ref tbpxqtwlmpifuazmzihe`
4. Publique a função:
   `supabase functions deploy create-order`

A função usa as variáveis gerenciadas pelo próprio Supabase: `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`. A chave de serviço deve permanecer somente no ambiente seguro da função e nunca em variáveis `VITE_*`, no navegador ou no GitHub.

## Importante

- A migração libera apenas os campos estritamente necessários ao catálogo público.
- A função valida loja, produtos ativos/disponíveis, quantidades, preço atual do banco, pedido mínimo e taxa fixa/grátis configurada.
- Modos de entrega por bairro e manual retornam erro até existir uma regra de cálculo segura.
- A interface web ainda precisa ser conectada a esta função para que o checkout do cliente use o fluxo real.
- Antes de produção, testar com dados e conta de teste; configurar proteção contra abuso/rate limiting e revisar mensagens, regras de entrega e política de privacidade.
