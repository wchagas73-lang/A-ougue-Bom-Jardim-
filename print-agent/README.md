# Impressão automática — Elgin i8

## O que faz
- O painel autenticado consulta os pedidos reais da loja.
- Pedidos novos são enviados ao serviço local do computador.
- O serviço envia os dados ESC/POS pela fila de impressão do Windows para a impressora `Elgin i8`, usando a porta configurada no Windows (neste computador, `USB001`), sem abrir a janela de impressão.
- O identificador do pedido fica salvo no computador para impedir impressão duplicada.
- Pedidos anteriores à ativação são marcados como já existentes na primeira inicialização e não são reimpressos.

## Preparação do computador da loja
1. Crie a pasta `C:\BomJardimPrint`.
2. Baixe para essa pasta os arquivos `impressao-automatica.ps1` e `iniciar-impressao.bat`.
3. Dê dois cliques em `iniciar-impressao.bat`. O serviço ficará rodando em segundo plano.
4. Na primeira execução, o serviço cria um atalho na pasta Inicializar do Windows para iniciar junto com o computador.
5. Mantenha o painel administrativo aberto e conectado à internet.

## Impressora
- Nome da fila do Windows: `Elgin i8`.
- Selecione a porta USB `USB001` nas propriedades da impressora.
- O serviço usa o spooler do Windows e envia os dados no formato RAW; não depende do IP da impressora nem da rede local.

## Segurança e comportamento
- O serviço escuta somente em `127.0.0.1`; não abre uma porta para a rede local ou para a internet.
- Só aceita origem do domínio Vercel do Açougue Bom Jardim e localhost de desenvolvimento.
- Não usa chave secreta do Supabase no computador.
- Se o computador ou a impressora estiverem indisponíveis, o painel tenta novamente a cada 7 segundos enquanto estiver aberto.
- O serviço mantém uma lista local de pedidos impressos para reduzir duplicidade.
- Pedidos cancelados antes da impressão são ignorados.
- A impressão automática só começa depois que o serviço local estiver instalado e a alteração do painel estiver publicada.

## Observação
O serviço usa o código de página PC860 e comandos ESC/POS. Faça o primeiro teste com um pedido de teste e confira a acentuação e o corte da bobina antes de liberar o uso diário.
