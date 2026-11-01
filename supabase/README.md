# Banco de dados — Açougue Bom Jardim

## Estado atual
O aplicativo em `src/App.jsx` ainda é um protótipo com dados locais e envio manual ao WhatsApp. Este diretório prepara o banco, mas não conecta nem publica o sistema.

## Preparação
1. Crie um projeto no Supabase.
2. Abra SQL Editor e execute `supabase/migrations/0001_initial_schema.sql`.
3. Crie a primeira loja e associe o usuário proprietário em `profiles` usando o UUID do usuário criado no Supabase Auth.
4. Não coloque a chave `service_role` no navegador, GitHub ou mensagens. Use somente a chave pública anon no cliente, com RLS habilitado.
5. Antes de produção, crie endpoints server-side para checkout público, validação de preço/estoque, cálculo da entrega e tracking.

## Perfis
- `owner`: gerencia produtos, equipe, configurações e financeiro.
- `employee`: operação de pedidos, sem leitura de pagamentos.
- `technical_admin`: sem acesso automático a dados financeiros; suporte deverá ser concedido de forma explícita e auditada.

## Atenção
As políticas SQL são uma base inicial, não uma auditoria de segurança. A política de cadastro de perfis e o fluxo de criação de pedidos precisam ser concluídos e testados com contas de cada função antes de receber pedidos reais. Não use dados reais de clientes até validar RLS, backups, autenticação e fluxos server-side.
