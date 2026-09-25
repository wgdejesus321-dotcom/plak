# Checklist de implantação

## 1. Supabase
- Criar projeto e copiar URL/API anon key.
- Executar `supabase/migrations/0001_pagina_inteligente.sql`.
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
