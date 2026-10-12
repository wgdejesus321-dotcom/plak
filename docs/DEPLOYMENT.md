# Checklist de implantação

## 1. Supabase
- Criar projeto e copiar URL/API anon key.
- Executar `supabase/migrations/0001_plak.sql`.
- Habilitar Email/Password em Auth.
- Configurar Site URL e Redirect URLs para local e domínio Pages.
- Criar primeiro usuário, promover a admin no SQL Editor e testar logout/login.

## 2. Cloudflare Pages
- Conectar o repositório ou fazer upload do projeto.
- Build: `pnpm build`.
- Saída: `dist`.
- Variáveis públicas: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (ou `VITE_SUPABASE_ANON_KEY` legado).
- Não adicionar `SUPABASE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY` ou segredos R2 ao frontend.

## 2A. Railway (servidor Express)

- Build Command: `pnpm build` (also works as `npm run build` when pnpm dependencies are already installed).
- Start Command: `pnpm start` (also works as `npm run start`).
- Healthcheck: `/api/health`.
- Frontend/browser variables: `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`.
- Server-only variables: `SUPABASE_URL` e `SUPABASE_SECRET_KEY` (ou `SUPABASE_SERVICE_ROLE_KEY` legado), somente como Service Variables da Railway.
- Nunca use `VITE_SUPABASE_SECRET_KEY` ou `VITE_SUPABASE_SERVICE_ROLE_KEY`, nunca importe uma secret key em `client/src` e nunca coloque uma chave real em arquivos versionados.
- O servidor não valida a service role no boot. O helper `server/supabase-admin.ts` só cria o cliente privilegiado quando uma rota backend o chama; `/api/health` funciona sem essa chave.
- O repositório inclui `pnpm-lock.yaml` e declara `packageManager` no `package.json`; o Railway pode detectar o projeto Node/pnpm nativamente. Não remova o lockfile nem misture `npm install` com `pnpm install` no mesmo deploy.

## 5. Supabase migrations

- Execute `supabase link --project-ref SEU_PROJECT_REF` uma vez por ambiente.
- Valide localmente com `supabase db reset` quando tiver o Supabase CLI/Docker disponível.
- Publique com `supabase db push`; não execute alterações manuais no banco remoto depois de iniciar o histórico versionado.
- Aplique o bootstrap inicial de admin de forma controlada e nunca coloque o e-mail de produção em uma migration pública.

## 3. R2 (opcional)
- Criar bucket e domínio público/customizado.
- Criar API token limitado ao bucket.
- Colocar credenciais apenas em Pages Functions/Workers como secrets.
- Implementar presign/proxy validando JWT antes de permitir gravação.

## 4. Domínio e atualizações
- Adicionar domínio customizado no Pages.
- Adicionar o domínio final nos Redirect URLs do Supabase.
- Para atualizar: aplicar novas migrations, rodar `pnpm check`, `pnpm build` e publicar novo deploy.

## 6. Recursos premium PLAK
- Executar `supabase db push` para aplicar `supabase/migrations/0003_growth_features.sql`.
- A migration cria `businesses.features` para campanha, catálogo, depoimentos, leads e identificação do QR.
- A migration cria a tabela `leads` com inserção pública controlada e leitura protegida para administradores.
- Depois da migration, publicar novamente o frontend e o servidor no Railway.
- No painel, acessar **Modelos prontos** para replicar presets e **Leads** para acompanhar contatos recebidos.


## Web Cardápios e gestão de pedidos (PLAK)

- Aplique `supabase/migrations/0008_web_menus_orders.sql` depois das migrations 0001–0007, usando o SQL Editor do Supabase ou a Supabase CLI. Faça backup antes de aplicar qualquer migration em produção.
- Configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` (ou `VITE_SUPABASE_ANON_KEY` legado) no ambiente de build. O frontend não pode usar uma chave `service_role`/secret.
- No painel de Database → Replication do Supabase, habilite Realtime para `public.menu_orders` e `public.menu_order_items`. Se a assinatura não conectar, a interface consulta o banco periodicamente como contingência.
- Entre como admin aprovado em `/admin/cardapios`, selecione um estabelecimento existente, crie o cardápio, categorias e produtos, configure as modalidades e publique. Em seguida, atribua acesso ao empresário através da área “Acesso da equipe”.
- Links previstos: `/:slug/cardapio`, `/painel/pedidos`, `/painel/cozinha`, `/painel/historico` e `/pedido/:token`. As rotas privadas exigem sessão aprovada; RLS e RPCs no Supabase são a fronteira de autorização.
- A confirmação de pagamento não é automatizada nesta versão: o pedido registra apenas a forma escolhida e o estado `pending` até que uma integração/pessoa autorizada confirme o pagamento. Não tratar o valor registrado como dinheiro recebido.
- A validação ponta a ponta exige um projeto Supabase real com as migrations aplicadas, usuários e produtos cadastrados. Sem as credenciais de um projeto de teste, não é possível validar RLS, concorrência real ou publicação externa apenas pelo build local.
