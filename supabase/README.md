# Banco de dados — Açougue Bom Jardim

## Aplicação das migrações
No painel do projeto Supabase, abra **SQL Editor** e execute os arquivos nesta ordem, uma vez cada:

1. `supabase/migrations/0001_initial_schema.sql` — tabelas, perfis e políticas de acesso.
2. `supabase/migrations/0002_public_catalog_and_images.sql` — catálogo público e imagens.
3. `supabase/migrations/0003_scheduled_promotions.sql` — promoções agendadas.
4. `supabase/migrations/0004_order_status_audit.sql` — histórico permanente de criação e alterações de status.

A migração 0004 é necessária para o histórico de pedidos reais. Ela cria eventos automaticamente quando um pedido é inserido ou quando seu status muda, preserva os eventos anteriores e remove a permissão de inserção/edição/exclusão direta de eventos pelo painel. Pedidos antigos recebem somente um evento inicial com o status atual; mudanças anteriores que nunca foram registradas não podem ser reconstruídas.

## Perfis
- `owner`: gerencia produtos, equipe, configurações e financeiro.
- `employee`: operação de pedidos, sem leitura de pagamentos.
- `technical_admin`: sem acesso automático a dados financeiros; suporte deverá ser concedido de forma explícita e auditada.

## Segurança e produção
- Não coloque a chave `service_role` no navegador, GitHub ou mensagens. Use somente a chave pública anon no cliente, com RLS habilitado.
- O checkout público usa a Edge Function `create-order`, que recalcula os preços no banco. Publique-a conforme `supabase/functions/README.md`.
- Antes de receber pedidos reais, testar com contas separadas de proprietário e funcionário, conferir RLS, backups, autenticação, regras de entrega e política de privacidade.
- A migração SQL precisa ser executada no projeto Supabase conectado à loja; salvar o arquivo no GitHub, por si só, não altera o banco remoto.
