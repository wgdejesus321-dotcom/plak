# PLAK Web Cardápios e Pedidos

Este módulo foi acrescentado à arquitetura existente do PLAK Studio. O editor de Bio-sites, os modelos existentes e a publicação anterior foram mantidos.

## Áreas e rotas

- ` /admin/cardapios`: editor de cardápio para administradores e usuários aos quais um estabelecimento foi atribuído.
- `/:slug/cardapio`: cardápio público, responsivo, sem cadastro obrigatório do consumidor.
- `/painel/pedidos` e `/admin/orders`: operação de pedidos no painel. O editor também gera o link privado escopado ao estabelecimento (`/painel/pedidos?business=ID`); exige login e as permissões continuam sendo verificadas no banco.
- `/painel/cozinha` e `/admin/kitchen`: fila de cozinha com cartões maiores.
- `/painel/historico`: filtros de histórico, métricas e exportação CSV.
- `/pedido/:token`: acompanhamento público por token aleatório UUID, sem consulta por número sequencial.

## Migração necessária

Aplique `supabase/migrations/0008_web_menus_orders.sql` somente depois das migrations de base (`0001`–`0007`). A migration cria as tabelas de cardápios, categorias, produtos, adicionais, mesas, estações, pedidos, itens, contador diário, histórico de status e preparação para planos comerciais. Ela habilita RLS, associa permissões a estabelecimentos e expõe RPCs controladas para criar pedidos, validar mesa e acompanhar pedido.

A numeração diária é gerada por upsert atômico em `business_order_counters`, por estabelecimento e data local de São Paulo. O ID interno UUID do pedido continua único e preserva a identificação histórica. O RPC valida disponibilidade, adicionais, quantidades e preços na base; os valores enviados pelo cliente não são usados como fonte de preço.

## Configuração de build

Variáveis públicas usadas no navegador:

```env
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=SUA_CHAVE_PUBLICA
# Alternativa compatível com projetos antigos:
# VITE_SUPABASE_ANON_KEY=SUA_CHAVE_PUBLICA
```

Nunca coloque chaves `service_role`, secret keys, tokens administrativos ou senhas no `.env` versionado ou no código frontend.

## Configuração manual no Supabase

1. Aplique a migration e verifique se as tabelas e funções da `0008` foram criadas sem erro.
2. Entre no PLAK com um perfil administrador aprovado.
3. Em **Web Cardápios**, selecione o estabelecimento e crie seu cardápio, depois cadastre pelo menos uma categoria e um produto disponível.
4. Configure modalidades, taxa de entrega e tempo estimado; escolha um dos cinco modelos e publique.
5. Na aba de acesso da equipe, vincule o perfil aprovado do empresário com papel `owner`, `editor` ou `viewer`. Somente `owner`/`editor` e o admin podem editar e avançar pedidos; `viewer` é leitura.
6. Para atualização Realtime, habilite `public.menu_orders` e `public.menu_order_items` na publicação Realtime do Supabase. O painel usa consulta periódica de contingência se a assinatura cair.
7. Para QR por mesa, cadastre uma mesa e use o link que contém seu token aleatório. Não troque o token por um número simples; a função de pedido resolve a mesa no banco.

## Comportamentos importantes

- O pedido é gravado através de uma única chamada de banco (`place_menu_order`), incluindo pedido e itens, antes de o consumidor ser levado à página de confirmação/acompanhamento.
- Uma chave de idempotência enviada pelo navegador e uma restrição única por estabelecimento impedem a duplicação de uma mesma solicitação repetida.
- A numeração legível reinicia por estabelecimento e data; o UUID não reinicia.
- O histórico registra as alterações de status e horário. O banco bloqueia transições fora do fluxo e mudanças de status após concluir/cancelar.
- O acompanhamento público requer token aleatório; conhecer apenas `#001`, `#002` etc. não permite consultar pedido.
- Totais do relatório são separados entre total dos pedidos não cancelados, total concluído e pagamentos explicitamente marcados como confirmados. O painel permite confirmação manual após o responsável verificar o recebimento; não existe gateway de pagamento nem confirmação automática nesta versão.
- A cozinha filtra os itens por categoria e estação sem dividir uma compra em vários pedidos.
- O link de mesa usa um token aleatório persistido no banco e validado no servidor; o projeto não embute uma imagem QR nem serviço externo de geração/impressão automaticamente. O editor atual oferece um grupo de opções por produto, com múltiplas escolhas nesse grupo; grupos independentes adicionais por produto ficam para uma evolução posterior.

## Limites de validação desta entrega

Sem credenciais de um Supabase de teste e sem ambiente de deploy configurado, não é possível alegar validação ponta a ponta de banco, RLS, duas empresas reais, simultaneidade de RPCs ou Realtime. A checagem de build depende da instalação das dependências (`pnpm install --frozen-lockfile`); quando o ambiente de execução estiver sem acesso ao registry do npm, essa etapa precisa ser repetida em um ambiente conectado. A migration e a UI devem ser testadas no projeto Supabase antes de abrir pedidos ao público.
